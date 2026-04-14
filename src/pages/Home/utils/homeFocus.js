export function deriveHomeFocus({ nextWorkout, lastRepeatableWorkout }) {
  if (nextWorkout) {
    return { mode: 'program', workout: nextWorkout };
  }

  if (lastRepeatableWorkout) {
    return { mode: 'repeat-last', workout: lastRepeatableWorkout };
  }

  return { mode: 'hidden', workout: null };
}
