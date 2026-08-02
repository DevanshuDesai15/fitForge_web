import { describe, expect, it } from 'vitest';
import {
  resolveProgramWorkoutSelection,
  calcWorkoutProgress,
  buildWorkoutSaveExercises,
  buildPreviousSetsMap,
  resolvePreviousSets,
} from '../utils/workoutSession';

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

describe('calcWorkoutProgress', () => {
  it('counts a completed cardio activity as 1 of 1', () => {
    const exercises = [
      { exercise_type: 'cardio', cardio: { duration_minutes: 30, distance_km: 5, completed: true } },
    ];
    expect(calcWorkoutProgress(exercises)).toEqual({ completedUnits: 1, totalUnits: 1 });
  });

  it('counts an incomplete cardio activity as 0 of 1', () => {
    const exercises = [
      { exercise_type: 'cardio', cardio: { duration_minutes: null, distance_km: null, completed: false } },
    ];
    expect(calcWorkoutProgress(exercises)).toEqual({ completedUnits: 0, totalUnits: 1 });
  });

  it('counts strength sets correctly', () => {
    const exercises = [
      {
        exercise_type: 'strength',
        sets: [
          { reps: '8', weight: '60', completed: true },
          { reps: '8', weight: '60', completed: false },
        ],
      },
    ];
    expect(calcWorkoutProgress(exercises)).toEqual({ completedUnits: 1, totalUnits: 2 });
  });

  it('mixes cardio and strength correctly', () => {
    const exercises = [
      { exercise_type: 'cardio', cardio: { completed: true } },
      { exercise_type: 'strength', sets: [{ completed: true }, { completed: false }] },
    ];
    expect(calcWorkoutProgress(exercises)).toEqual({ completedUnits: 2, totalUnits: 3 });
  });
});

describe('buildWorkoutSaveExercises', () => {
  it('includes completed cardio in save payload', () => {
    const exercises = [
      { name: 'Running', exercise_type: 'cardio', cardio: { duration_minutes: 30, distance_km: 5, completed: true }, notes: '' },
    ];
    const result = buildWorkoutSaveExercises(exercises, 'kg');
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ name: 'Running', exercise_type: 'cardio', cardio: { duration_minutes: 30, distance_km: 5 } });
  });

  it('excludes incomplete cardio from save payload', () => {
    const exercises = [
      { name: 'Running', exercise_type: 'cardio', cardio: { duration_minutes: null, distance_km: null, completed: false } },
    ];
    expect(buildWorkoutSaveExercises(exercises, 'kg')).toHaveLength(0);
  });

  it('includes strength exercises with completed sets', () => {
    const exercises = [
      {
        name: 'Bench Press', exercise_type: 'strength',
        sets: [
          { weight: '60', reps: '8', completed: true },
          { weight: '60', reps: '', completed: false },
        ],
        notes: '',
      },
    ];
    const result = buildWorkoutSaveExercises(exercises, 'kg');
    expect(result).toHaveLength(1);
    expect(result[0].sets).toHaveLength(1);
    expect(result[0].sets[0]).toMatchObject({ weight: '60', reps: '8', completed: true, weightUnit: 'kg' });
  });

  it('persists a stable exercise identifier with completed exercises', () => {
    const [saved] = buildWorkoutSaveExercises([{
      id: 'catalog_bench_press',
      name: 'Bench Press',
      exercise_type: 'strength',
      sets: [{ weight: '60', reps: '8', completed: true }],
    }], 'kg');

    expect(saved.exerciseId).toBe('catalog_bench_press');
  });

  it('excludes strength exercises with no completed sets', () => {
    const exercises = [
      { name: 'Squat', exercise_type: 'strength', sets: [{ weight: '', reps: '', completed: false }], notes: '' },
    ];
    expect(buildWorkoutSaveExercises(exercises, 'kg')).toHaveLength(0);
  });
});

describe('buildPreviousSetsMap', () => {
  it('returns empty object for empty input', () => {
    expect(buildPreviousSetsMap([])).toEqual({ byId: {}, byName: {} });
  });

  it('returns empty object for null input', () => {
    expect(buildPreviousSetsMap(null)).toEqual({ byId: {}, byName: {} });
  });

  it('maps exercise name to sets from the most recent workout', () => {
    const rows = [
      {
        completed_at: '2026-06-10T10:00:00Z',
        exercises: [
          { name: 'Bench Press', exercise_type: 'strength', sets: [{ reps: 10, weight: '60' }] },
        ],
      },
    ];
    expect(buildPreviousSetsMap(rows).byName).toEqual({
      'bench press': [{ reps: 10, weight: '60' }],
    });
  });

  it('uses the first (most recent) row when exercise appears in multiple workouts', () => {
    const rows = [
      {
        completed_at: '2026-06-10T10:00:00Z',
        exercises: [{ name: 'Squat', exercise_type: 'strength', sets: [{ reps: 5, weight: '100' }] }],
      },
      {
        completed_at: '2026-06-03T10:00:00Z',
        exercises: [{ name: 'Squat', exercise_type: 'strength', sets: [{ reps: 5, weight: '90' }] }],
      },
    ];
    expect(buildPreviousSetsMap(rows).byName.squat).toEqual([{ reps: 5, weight: '100' }]);
  });

  it('skips cardio exercises', () => {
    const rows = [
      {
        exercises: [{ name: 'Running', exercise_type: 'cardio', cardio: {} }],
      },
    ];
    expect(buildPreviousSetsMap(rows)).toEqual({ byId: {}, byName: {} });
  });

  it('skips exercises without a sets array', () => {
    const rows = [
      {
        exercises: [{ name: 'Plank', exercise_type: 'strength' }],
      },
    ];
    expect(buildPreviousSetsMap(rows)).toEqual({ byId: {}, byName: {} });
  });

  it('builds map across multiple exercises in one workout', () => {
    const rows = [
      {
        exercises: [
          { name: 'Bench Press', exercise_type: 'strength', sets: [{ reps: 10, weight: '60' }] },
          { name: 'Tricep Pushdown', exercise_type: 'strength', sets: [{ reps: 12, weight: '30' }] },
        ],
      },
    ];
    const map = buildPreviousSetsMap(rows);
    expect(map.byName['bench press']).toEqual([{ reps: 10, weight: '60' }]);
    expect(map.byName['tricep pushdown']).toEqual([{ reps: 12, weight: '30' }]);
  });

  it('resolves by stable ID before display name after a rename', () => {
    const history = buildPreviousSetsMap([{
      exercises: [{
        exerciseId: 'catalog_bench',
        name: 'Barbell Bench Press',
        exercise_type: 'strength',
        sets: [{ reps: 8, weight: '70' }],
      }],
    }]);

    expect(resolvePreviousSets(history, {
      id: 'catalog_bench',
      name: 'Competition Bench Press',
    })).toEqual([{ reps: 8, weight: '70' }]);
  });

  it('falls back to a normalized legacy name when no ID was stored', () => {
    const history = buildPreviousSetsMap([{
      exercises: [{
        name: '  Bench Press ',
        exercise_type: 'strength',
        sets: [{ reps: 10, weight: '60' }],
      }],
    }]);

    expect(resolvePreviousSets(history, { name: 'bench press' }))
      .toEqual([{ reps: 10, weight: '60' }]);
  });

  it('does not let a name collision override an ID match', () => {
    const history = buildPreviousSetsMap([{
      exercises: [
        {
          exerciseId: 'stable-id',
          name: 'Original Name',
          exercise_type: 'strength',
          sets: [{ reps: 5, weight: '100' }],
        },
        {
          exerciseId: 'other-id',
          name: 'Renamed Exercise',
          exercise_type: 'strength',
          sets: [{ reps: 12, weight: '30' }],
        },
      ],
    }]);

    expect(resolvePreviousSets(history, {
      exerciseId: 'stable-id',
      name: 'Renamed Exercise',
    })).toEqual([{ reps: 5, weight: '100' }]);
  });
});
