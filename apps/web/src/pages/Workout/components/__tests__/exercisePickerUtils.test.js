import { describe, expect, it } from 'vitest';
import { buildExercisePickerOptions } from '../exercisePickerUtils';

describe('exercise picker options', () => {
  it('merges custom and catalog exercises with search and muscle filtering', () => {
    const result = buildExercisePickerOptions({
      customExercises: [{ name: 'Custom Press', muscleGroups: 'Chest' }],
      catalogExercises: [
        { id: 'bench', name: 'Bench Press', muscleGroup: 'Chest', target: 'Pectorals' },
        { id: 'squat', name: 'Squat', muscleGroup: 'Legs' },
      ],
      searchTerm: 'press',
      selectedMuscleGroup: 'Chest',
    });
    expect(result.map((exercise) => exercise.name)).toEqual(['Custom Press', 'Bench Press']);
    expect(result[0]).toEqual(expect.objectContaining({ isCustom: true, equipment: 'Various' }));
  });
});
