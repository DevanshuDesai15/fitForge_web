import { describe, expect, it } from 'vitest';
import { resolveProgramWorkoutSelection } from '../StartWorkout';

describe('resolveProgramWorkoutSelection', () => {
  it('rebuilds program days from template rows and selects the requested template id', () => {
    const result = resolveProgramWorkoutSelection(
      {
        id: 'program_1',
        name: 'Push Pull Legs',
        template_ids: ['template_push', 'template_pull', 'template_legs'],
      },
      [
        {
          id: 'template_push',
          name: 'Push Day',
          description: 'Chest and shoulders',
          exercises: [{ name: 'Bench Press' }],
          category: 'Strength',
          difficulty: 'Intermediate',
        },
        {
          id: 'template_pull',
          name: 'Pull Day',
          description: 'Back and biceps',
          exercises: [{ name: 'Barbell Row' }],
          category: 'Strength',
          difficulty: 'Intermediate',
        },
        {
          id: 'template_legs',
          name: 'Leg Day',
          description: 'Legs',
          exercises: [{ name: 'Squat' }],
          category: 'Strength',
          difficulty: 'Advanced',
        },
      ],
      'template_pull'
    );

    expect(result.currentTemplate).toEqual(
      expect.objectContaining({
        id: 'program_1',
        name: 'Push Pull Legs',
      })
    );
    expect(result.selectedDay).toEqual(
      expect.objectContaining({
        id: 'template_pull',
        templateId: 'template_pull',
        name: 'Pull Day',
        exercises: [{ name: 'Barbell Row' }],
      })
    );
    expect(result.days).toEqual([
      expect.objectContaining({ templateId: 'template_push', name: 'Push Day' }),
      expect.objectContaining({ templateId: 'template_pull', name: 'Pull Day' }),
      expect.objectContaining({ templateId: 'template_legs', name: 'Leg Day' }),
    ]);
  });

  it('falls back to the first program day when no specific day id is requested', () => {
    const result = resolveProgramWorkoutSelection(
      {
        id: 'program_1',
        name: 'Upper Lower',
        template_ids: ['template_upper', 'template_lower'],
      },
      [
        {
          id: 'template_upper',
          name: 'Upper A',
          exercises: [{ name: 'Bench Press' }],
        },
        {
          id: 'template_lower',
          name: 'Lower A',
          exercises: [{ name: 'Squat' }],
        },
      ],
      null
    );

    expect(result.selectedDay).toEqual(
      expect.objectContaining({
        templateId: 'template_upper',
        name: 'Upper A',
      })
    );
  });
});
