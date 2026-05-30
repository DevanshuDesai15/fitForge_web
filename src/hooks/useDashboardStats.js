import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "./useSupabase";
import { useAuth } from "../contexts/AuthContext";

export function useDashboardStats() {
  const supabase = useSupabase();
  const { currentUser } = useAuth();

  return useQuery({
    queryKey: ["dashboard_stats", currentUser?.uid],
    queryFn: async () => {
      if (!currentUser?.uid) return null;

      // Parallel fetch for core dashboard building blocks
      const [programsResult, workoutsResult] = await Promise.all([
        supabase
          .from("workout_programs")
          .select("*")
          .eq("user_id", currentUser.uid),
        supabase
          .from("workouts")
          .select("*")
          .eq("user_id", currentUser.uid)
          .eq("completed", true)
          .order("timestamp", { ascending: false })
          .limit(50),
      ]);

      if (programsResult.error) throw programsResult.error;
      if (workoutsResult.error) throw workoutsResult.error;

      const userPrograms = programsResult.data;
      const completedWorkouts = workoutsResult.data;

      // Stats Processing (Trailing 7 days)
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);

      let weeklyWorkouts = 0;
      let weeklyMinutes = 0;
      let weeklyVolume = 0;
      let totalSets = 0;
      const uniqueExercises = new Set();
      const targetedMuscles = new Set();

      const weekWorkoutData = completedWorkouts.filter((w) => {
        const workoutDate = new Date(w.timestamp);
        return workoutDate >= sevenDaysAgo;
      });

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
      const exerciseMuscleMap = new Map();
      if (exerciseNamesInWeek.size > 0) {
        const { data: catalogRows } = await supabase
          .from("exercises")
          .select("name, primary_muscle, body_part")
          .in("name", [...exerciseNamesInWeek]);
        (catalogRows || []).forEach((row) => {
          exerciseMuscleMap.set(row.name, {
            body_part: row.body_part || null,
            target_muscle: row.primary_muscle || null,
          });
        });
      }

      weekWorkoutData.forEach((workout) => {
        weeklyWorkouts++;
        weeklyMinutes += workout.duration_seconds || 0;
        weeklyVolume += parseFloat(workout.total_volume_kg) || 0;

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
  });
}
