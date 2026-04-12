import { describe, expect, it } from 'vitest';
import {
  flattenExercisesFromWorkouts,
  getRecentExercisesFromWorkouts,
  getExerciseLibraryStatsFromWorkouts,
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

describe('getExerciseLibraryStatsFromWorkouts', () => {
  it('returns empty-state stats when the user has no logged workout history', () => {
    expect(getExerciseLibraryStatsFromWorkouts([])).toEqual({
      exercisesTried: 0,
      totalSets: 0,
      totalVolume: 0,
      volumeUnit: 'lbs',
      hasWorkoutData: false,
    });
  });

  it('aggregates exercises tried, completed sets, and volume from workout history', () => {
    const result = getExerciseLibraryStatsFromWorkouts([
      {
        id: 'workout_1',
        weight_unit: 'kg',
        exercises: [
          {
            name: 'Bench Press',
            sets: [
              { reps: 5, weight: 100, completed: true },
              { reps: 5, weight: 100, completed: false },
              { reps: 8, weight: 80, completed: true },
            ],
          },
          {
            name: 'Squat',
            sets: [
              { reps: 5, weight: 140, completed: true },
            ],
          },
        ],
      },
      {
        id: 'workout_2',
        weight_unit: 'lbs',
        exercises: [
          {
            name: 'Bench Press',
            sets: [
              { reps: 10, weight: 135, completed: true, weightUnit: 'lbs' },
            ],
          },
          {
            name: 'Pull Up',
            sets: [
              { reps: 8, completed: true },
            ],
          },
        ],
      },
    ], 'lbs');

    expect(result).toEqual({
      exercisesTried: 3,
      totalSets: 5,
      totalVolume: 5407,
      volumeUnit: 'lbs',
      hasWorkoutData: true,
    });
  });
});
