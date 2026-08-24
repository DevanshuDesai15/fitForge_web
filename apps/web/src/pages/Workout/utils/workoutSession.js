import { safeCapture } from '../../../services/analyticsService';

const DEFAULT_EMPTY_SET = [
  { weight: '', reps: '', completed: false },
  { weight: '', reps: '', completed: false },
  { weight: '', reps: '', completed: false },
];

export const toArray = (value) => (Array.isArray(value) ? value : []);

const deriveMuscleGroups = (exercises = []) => {
  const groups = new Map();
  for (const exercise of toArray(exercises)) {
    const rawName = exercise.muscleGroup || exercise.target || exercise.bodyPart;
    if (!rawName) continue;
    const name = String(rawName).trim();
    const id = name.toLowerCase();
    if (!groups.has(id)) groups.set(id, { id, name });
  }
  return Array.from(groups.values());
};

export const normalizeWorkoutExercises = (exerciseList) =>
  toArray(exerciseList).map((exercise) => {
    if (exercise.exercise_type === 'cardio') {
      return {
        ...exercise,
        cardio: exercise.cardio || {
          duration_minutes: null,
          distance_km: null,
          completed: false,
        },
      };
    }
    return {
      ...exercise,
      targetSets: exercise.targetSets || exercise.sets?.length || 3,
      sets:
        Array.isArray(exercise.sets) && exercise.sets.length > 0
          ? exercise.sets
          : DEFAULT_EMPTY_SET.map((set) => ({ ...set })),
    };
  });

export function calcWorkoutProgress(exercises) {
  let totalUnits = 0;
  let completedUnits = 0;
  for (const exercise of exercises) {
    if (exercise.exercise_type === 'cardio') {
      totalUnits += 1;
      if (exercise.cardio?.completed) completedUnits += 1;
    } else {
      const sets = exercise.sets || [];
      totalUnits += sets.length;
      completedUnits += sets.filter((set) => set.completed).length;
    }
  }
  return { totalUnits, completedUnits };
}

export function buildWorkoutSaveExercises(exercises, weightUnit) {
  return exercises.flatMap((exercise) => {
    const exerciseId = exercise.exerciseId ?? exercise.id ?? null;
    if (exercise.exercise_type === 'cardio') {
      if (!exercise.cardio?.completed) return [];
      return [{
        ...(exerciseId ? { exerciseId } : {}),
        name: exercise.name,
        exercise_type: 'cardio',
        cardio: {
          duration_minutes: exercise.cardio.duration_minutes,
          distance_km: exercise.cardio.distance_km,
        },
        notes: exercise.notes || '',
      }];
    }
    const completedSets = (exercise.sets || [])
      .filter((set) => set.completed && set.reps)
      .map((set) => ({
        weight: set.weight || '0',
        weightUnit,
        reps: set.reps,
        completed: true,
      }));
    if (completedSets.length === 0) return [];
    return [{
      ...(exerciseId ? { exerciseId } : {}),
      name: exercise.name,
      exercise_type: 'strength',
      sets: completedSets,
      notes: exercise.notes || '',
      body_part:
        exercise.bodyPart || exercise.body_part || exercise.muscle_group || null,
      target_muscle:
        exercise.target ||
        exercise.target_muscle ||
        (Array.isArray(exercise.muscles) ? exercise.muscles[0] : exercise.muscles) ||
        null,
    }];
  });
}

const normalizeExerciseName = (name) => String(name || '').trim().toLowerCase();

export function buildPreviousSetsMap(workoutRows) {
  const map = { byId: {}, byName: {} };
  for (const row of workoutRows || []) {
    for (const exercise of row.exercises || []) {
      if (exercise.exercise_type === 'cardio' || !Array.isArray(exercise.sets)) continue;
      const exerciseId = exercise.exerciseId ?? exercise.exercise_id ?? exercise.id;
      const normalizedName = normalizeExerciseName(exercise.name ?? exercise.exerciseName);
      if (exerciseId && !map.byId[exerciseId]) map.byId[exerciseId] = exercise.sets;
      if (normalizedName && !map.byName[normalizedName]) map.byName[normalizedName] = exercise.sets;
    }
  }
  return map;
}

export function resolvePreviousSets(previousSetsMap, exercise) {
  const exerciseId = exercise?.exerciseId ?? exercise?.exercise_id ?? exercise?.id;
  if (exerciseId && previousSetsMap?.byId?.[exerciseId]) {
    return previousSetsMap.byId[exerciseId];
  }
  const normalizedName = normalizeExerciseName(exercise?.name ?? exercise?.exerciseName);
  return normalizedName ? previousSetsMap?.byName?.[normalizedName] : undefined;
}

export function resolveProgramWorkoutSelection(programData, templateRows, requestedDayId = null) {
  const templateIds = toArray(programData?.template_ids ?? programData?.templateIds);
  const templateById = new Map(toArray(templateRows).map((template) => [template.id, template]));
  const days = templateIds
    .map((templateId, index) => {
      const template = templateById.get(templateId);
      if (!template) return null;
      const exercises = toArray(template.exercises);
      return {
        id: template.id,
        templateId: template.id,
        name: template.name || `Day ${index + 1}`,
        focus: template.description || '',
        exercises,
        muscleGroups: deriveMuscleGroups(exercises),
        category: template.category || 'Strength Training',
        difficulty: template.difficulty || 'Intermediate',
      };
    })
    .filter(Boolean);
  const selectedDay = requestedDayId
    ? days.find((day) => day.templateId === requestedDayId || day.id === requestedDayId) || days[0]
    : days[0];
  return { currentTemplate: programData, selectedDay: selectedDay || null, days };
}

export function beginWorkoutSession({
  setWorkoutStartTime,
  setWorkoutStarted,
  posthog,
  analyticsPayload,
  shouldTrackAnalytics = true,
}) {
  setWorkoutStartTime(new Date().toISOString());
  setWorkoutStarted(true);
  if (shouldTrackAnalytics) safeCapture(posthog, 'workout_started', analyticsPayload);
}
