export function deriveHomeFocus({ nextWorkout, lastRepeatableWorkout }) {
  if (nextWorkout) {
    return { mode: 'program', workout: nextWorkout };
  }

  if (lastRepeatableWorkout) {
    return { mode: 'repeat-last', workout: lastRepeatableWorkout };
  }

  return { mode: 'hidden', workout: null };
}

// Router state for /workout/start from the focus workout (program day or repeat-last).
export function buildFocusStartState(mode, workout) {
  if (mode === 'repeat-last') {
    return {
      workout: {
        name: workout.name || 'Workout',
        dayName: workout.day_name || workout.dayName || workout.name || 'Workout',
        exercises: Array.isArray(workout.exercises) ? workout.exercises : [],
      },
    };
  }
  return {
    templateId: workout.programId,
    dayId: workout.id,
    programTemplateIds: workout.programTemplateIds,
    workout: {
      name: `${workout.programName} - ${workout.name}`,
      programName: workout.programName,
      dayName: workout.name,
      exercises: workout.exercises || [],
    },
  };
}
