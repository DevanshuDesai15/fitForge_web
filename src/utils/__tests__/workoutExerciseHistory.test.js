import { describe, expect, it } from 'vitest';
import {
  flattenExercisesFromWorkouts,
  getRecentExercisesFromWorkouts,
} from '../workoutExerciseHistory';

describe('flattenExercisesFromWorkouts', () => {
  it('normalizes workout JSONB exercises for history views', () => {
    const result = flattenExercisesFromWorkouts([
      {
        id: 'workout_1',
        timestamp: '2026-04-06T12:00:00.000Z',
        weight_unit: 'kg',
        exercises: [
          {
            name: 'Bench Press',
            sets: [{ reps: 5, weight: 100, weightUnit: 'kg' }],
            notes: 'Strong day',
          },
        ],
      },
    ]);

    expect(result).toEqual([
      expect.objectContaining({
        id: 'workout_1-exercise-0',
        name: 'Bench Press',
        exerciseName: 'Bench Press',
        timestamp: '2026-04-06T12:00:00.000Z',
        weightUnit: 'kg',
        workoutId: 'workout_1',
        notes: 'Strong day',
      }),
    ]);
  });
});

describe('getRecentExercisesFromWorkouts', () => {
  it('returns deduped recent exercises with summary fields for quick add and selector history', () => {
    const result = getRecentExercisesFromWorkouts([
      {
        id: 'workout_newest',
        created_at: '2026-04-06T12:00:00.000Z',
        timestamp: '2026-04-06T12:00:00.000Z',
        exercises: [
          {
            name: 'Bench Press',
            sets: [
              { reps: 5, weight: 100, weightUnit: 'kg' },
              { reps: 5, weight: 100, weightUnit: 'kg' },
            ],
            notes: 'Strong day',
          },
        ],
      },
      {
        id: 'workout_older',
        created_at: '2026-04-05T12:00:00.000Z',
        timestamp: '2026-04-05T12:00:00.000Z',
        exercises: [
          {
            name: 'Bench Press',
            sets: [{ reps: 3, weight: 95, weightUnit: 'kg' }],
            notes: 'Older entry',
          },
          {
            name: 'Squat',
            sets: [{ reps: 5, weight: 140, weightUnit: 'kg' }],
          },
        ],
      },
    ]);

    expect(result).toEqual([
      expect.objectContaining({
        id: 'workout_newest-exercise-0',
        name: 'Bench Press',
        exerciseName: 'Bench Press',
        setCount: 2,
        reps: 5,
        weight: 100,
      }),
      expect.objectContaining({
        id: 'workout_older-exercise-1',
        name: 'Squat',
        exerciseName: 'Squat',
        setCount: 1,
        reps: 5,
        weight: 140,
      }),
    ]);
  });
});
