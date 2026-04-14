import { convertWeight } from './unitConversions';

const toArray = (value) => (Array.isArray(value) ? value : []);

function normalizeWorkoutExercise(workout, exercise, index) {
  const sets = toArray(exercise?.sets);
  const firstSet = sets[0] || {};
  const timestamp = workout?.timestamp || workout?.created_at || null;
  const weightUnit = firstSet.weightUnit || workout?.weight_unit || workout?.weightUnit || 'lbs';
  const exerciseName = exercise?.name || exercise?.exerciseName || 'Unknown Exercise';

  return {
    id: `${workout?.id || 'workout'}-exercise-${index}`,
    name: exerciseName,
    exerciseName,
    sets,
    setCount: sets.length,
    reps: firstSet.reps ?? exercise?.reps ?? null,
    weight: firstSet.weight ?? exercise?.weight ?? null,
    weightUnit,
    notes: exercise?.notes || '',
    timestamp,
    createdAt: workout?.created_at || timestamp,
    workoutId: workout?.id || null,
  };
}

export function flattenExercisesFromWorkouts(workouts = []) {
  return toArray(workouts).flatMap((workout) =>
    toArray(workout?.exercises).map((exercise, index) =>
      normalizeWorkoutExercise(workout, exercise, index)
    )
  );
}

export function getRecentExercisesFromWorkouts(workouts = [], limit = 5) {
  const seen = new Set();
  const recentExercises = [];

  for (const exercise of flattenExercisesFromWorkouts(workouts)) {
    if (seen.has(exercise.exerciseName)) {
      continue;
    }

    seen.add(exercise.exerciseName);
    recentExercises.push(exercise);

    if (recentExercises.length >= limit) {
      break;
    }
  }

  return recentExercises;
}

export function getExerciseLibraryStatsFromWorkouts(workouts = [], displayUnit = 'lbs') {
  const normalizedDisplayUnit = displayUnit === 'kg' ? 'kg' : 'lbs';
  const uniqueExercises = new Set();
  let totalSets = 0;
  let totalVolume = 0;

  for (const workout of toArray(workouts)) {
    for (const exercise of toArray(workout?.exercises)) {
      const exerciseName = exercise?.name || exercise?.exerciseName;
      if (exerciseName) {
        uniqueExercises.add(exerciseName.toLowerCase());
      }

      for (const set of toArray(exercise?.sets)) {
        const isCompleted = set?.completed !== false;
        if (!isCompleted) {
          continue;
        }

        totalSets += 1;

        const reps = Number(set?.reps);
        const weight = Number(set?.weight);

        if (!Number.isFinite(reps) || !Number.isFinite(weight)) {
          continue;
        }

        const setWeightUnit = set?.weightUnit || workout?.weight_unit || workout?.weightUnit || normalizedDisplayUnit;
        const normalizedSetUnit = setWeightUnit === 'kg' ? 'kg' : 'lbs';
        const convertedWeight = Number(convertWeight(weight, normalizedSetUnit, normalizedDisplayUnit));

        if (!Number.isFinite(convertedWeight)) {
          continue;
        }

        totalVolume += convertedWeight * reps;
      }
    }
  }

  return {
    exercisesTried: uniqueExercises.size,
    totalSets,
    totalVolume: Math.round(totalVolume),
    volumeUnit: normalizedDisplayUnit,
    hasWorkoutData: totalSets > 0,
  };
}
