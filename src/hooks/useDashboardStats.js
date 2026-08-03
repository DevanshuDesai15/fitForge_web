import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "./useSupabase";
import { useAuth } from "../contexts/AuthContext";
import { listWorkouts } from "../services/workoutRepository";
import { fetchExerciseMuscleMapByNames } from "../services/exerciseCatalogService";

function getDashboardWeekStart(now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return start;
}

export function getDashboardWeekKey(now = new Date()) {
  const start = getDashboardWeekStart(now);
  return `${start.getFullYear()}-${start.getMonth() + 1}-${start.getDate()}`;
}

export function isWorkoutInDashboardWeek(workout, now = new Date()) {
  const rawDate = workout?.timestamp ?? workout?.completedAt ?? workout?.createdAt;
  if (!rawDate) return false;

  const workoutDate = new Date(rawDate);
  if (Number.isNaN(workoutDate.getTime())) return false;

  const weekStart = getDashboardWeekStart(now);
  const nextWeekStart = new Date(weekStart);
  nextWeekStart.setDate(weekStart.getDate() + 7);
  return workoutDate >= weekStart && workoutDate < nextWeekStart;
}

export function useDashboardStats() {
  const supabase = useSupabase();
  const { currentUser } = useAuth();

  return useQuery({
    queryKey: ["dashboard_stats", currentUser?.uid, getDashboardWeekKey()],
    queryFn: async () => {
      if (!currentUser?.uid) return null;

      // Parallel fetch for core dashboard building blocks
      const [programsResult, workoutsResult] = await Promise.all([
        supabase
          .from("workout_programs")
          .select("*")
          .eq("user_id", currentUser.uid),
        listWorkouts({
          supabase,
          userId: currentUser.uid,
          completed: true,
          limit: 50,
        }),
      ]);

      if (programsResult.error) throw programsResult.error;
      const userPrograms = programsResult.data;
      const completedWorkouts = workoutsResult;

      // Stats Processing (current Sunday-Saturday calendar week)
      const today = new Date();

      let weeklyWorkouts = 0;
      let weeklyMinutes = 0;
      let weeklyVolume = 0;
      let totalSets = 0;
      const uniqueExercises = new Set();
      const targetedMuscles = new Set();

      const weekWorkoutData = completedWorkouts.filter((workout) =>
        isWorkoutInDashboardWeek(workout, today)
      );

      // Collect all exercise names from this week to look up muscle info for old records
      const exerciseNamesInWeek = new Set();
      weekWorkoutData.forEach((workout) => {
        (workout.exercises || []).forEach((ex) => {
          if (ex.name && !ex.body_part && !ex.bodyPart && !ex.target_muscle && !ex.target && !Array.isArray(ex.muscles)) {
            exerciseNamesInWeek.add(ex.name);
          }
        });
      });

      // Batch lookup muscle info from exercises catalog for names missing muscle fields
      const exerciseMuscleMap = await fetchExerciseMuscleMapByNames(
        supabase,
        [...exerciseNamesInWeek]
      );

      weekWorkoutData.forEach((workout) => {
        weeklyWorkouts++;
        weeklyMinutes += workout.durationSeconds || 0;
        weeklyVolume += parseFloat(workout.totalVolumeKg) || 0;

        if (workout.exercises && Array.isArray(workout.exercises)) {
          workout.exercises.forEach((ex) => {
            if (ex.name) uniqueExercises.add(ex.name.toLowerCase());

            // Extract muscle targets — use saved fields first, fall back to catalog lookup
            const catalog = exerciseMuscleMap.get(ex.name) || {};
            const bodyPart = ex.body_part || ex.bodyPart || ex.muscle_group || ex.category || catalog.body_part;
            const targetMuscle = ex.target_muscle || ex.target || catalog.target_muscle;
            if (bodyPart) targetedMuscles.add(bodyPart.toLowerCase());
            if (targetMuscle) targetedMuscles.add(targetMuscle.toLowerCase());
            if (Array.isArray(ex.muscles)) {
              ex.muscles.forEach((m) => {
                const name = typeof m === 'string' ? m : m?.name_en || m?.name;
                if (name) targetedMuscles.add(name.toLowerCase());
              });
            }

            if (ex.sets && Array.isArray(ex.sets)) {
              totalSets += ex.sets.filter((s) => s.completed).length;
            }
          });
        }
      });

      // Simple Streak Calculation
      let streakCount = 0;
      const uniqueDates = new Set(
        completedWorkouts.map((w) => new Date(w.timestamp).toDateString()),
      );

      let tempDate = new Date();
      tempDate.setHours(0, 0, 0, 0);

      let checkStreak = true;
      // If no workout today, check yesterday to keep streak alive
      if (!uniqueDates.has(tempDate.toDateString())) {
        tempDate.setDate(tempDate.getDate() - 1);
        if (!uniqueDates.has(tempDate.toDateString())) {
          checkStreak = false;
        }
      }

      while (checkStreak) {
        streakCount++;
        tempDate.setDate(tempDate.getDate() - 1);
        if (!uniqueDates.has(tempDate.toDateString())) {
          checkStreak = false;
        }
      }

      // Next Workout Logic (Ported from Home.jsx)
      let nextWorkout = null;
      let isTomorrowFocus = false;
      const lastRepeatableWorkout =
        completedWorkouts.find(
          (workout) =>
            Array.isArray(workout.exercises) && workout.exercises.length > 0,
        ) || null;

      // Check if worked out today
      const workedOutToday = uniqueDates.has(new Date().toDateString());
      isTomorrowFocus = workedOutToday;

      if (userPrograms.length > 0) {
        const program = userPrograms[0]; // Logic matches Home.jsx legacy
        if (program.schedule && Array.isArray(program.schedule)) {
          const programWorkouts = completedWorkouts.filter(
            (w) => w.program_id === program.id,
          );

          if (programWorkouts.length === 0) {
            nextWorkout = program.schedule[0];
          } else {
            // Anchor to the most recently completed program day (workouts sorted desc)
            const completedDayNames = new Set(
              programWorkouts.map((w) => w.day_name),
            );
            const lastDayName = programWorkouts[0].day_name;
            const lastIndex = program.schedule.findIndex(
              (d) => d.name === lastDayName,
            );
            const startIndex = lastIndex === -1 ? 0 : lastIndex;
            const len = program.schedule.length;

            // Scan forward from last completed, skip already-done days
            let candidate = null;
            for (let i = 1; i <= len; i++) {
              const idx = (startIndex + i) % len;
              if (!completedDayNames.has(program.schedule[idx].name)) {
                candidate = program.schedule[idx];
                break;
              }
            }

            // All days done → new cycle, advance one from last
            nextWorkout =
              candidate || program.schedule[(startIndex + 1) % len];
          }

          if (nextWorkout) {
            nextWorkout = {
              ...nextWorkout,
              programName: program.name,
              programId: program.id,
            };
          }
        }
      }

      return {
        weeklyStats: {
          totalVolume: Math.round(weeklyVolume),
          volumeUnit: "kg",
          goalProgress: (weeklyWorkouts / 4) * 100, // Target is 4
          goalText: `${weeklyWorkouts}/4`,
          streakDays: streakCount,
          workoutsDone: weeklyWorkouts,
          activeMinutes: Math.round(weeklyMinutes / 60),
          targetedMuscles: { current: targetedMuscles.size, target: 11 },
          weeklySets: { current: totalSets, target: 60 },
          uniqueExercises: { current: uniqueExercises.size, target: 20 },
        },
        nextWorkout,
        isTomorrowFocus,
        completedWorkoutsCount: completedWorkouts.length,
        lastRepeatableWorkout,
      };
    },
    enabled: !!currentUser?.uid,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 60, // Refresh data and roll over promptly at a new week.
  });
}
