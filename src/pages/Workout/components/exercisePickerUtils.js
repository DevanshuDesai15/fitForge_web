export function normalizeCustomExercises(customExercises) {
  return customExercises.map((exercise) => ({
    id: exercise.name,
    name: exercise.name,
    muscleGroup: exercise.muscleGroups || exercise.muscles || exercise.primaryMuscles?.[0] || 'Various',
    equipment: exercise.equipment || 'Various',
    description: '',
    isCustom: true,
  }));
}

export function buildExercisePickerOptions({
  customExercises,
  catalogExercises,
  searchTerm = '',
  selectedMuscleGroup = 'All',
}) {
  const search = searchTerm.toLowerCase();
  const muscle = selectedMuscleGroup.toLowerCase();
  const matches = (exercise) =>
    exercise.name.toLowerCase().includes(search) &&
    (selectedMuscleGroup === 'All' ||
      exercise.muscleGroup?.toLowerCase().includes(muscle) ||
      exercise.target?.toLowerCase().includes(muscle));
  return [
    ...normalizeCustomExercises(customExercises).filter(matches),
    ...catalogExercises.filter(matches),
  ];
}
