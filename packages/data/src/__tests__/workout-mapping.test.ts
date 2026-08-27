import { describe, expect, it } from 'vitest';
import type { WorkoutRecord } from '@fitforge/types';
import { mapCloudWorkout, mapWorkoutToCloud } from '..';

const workout: WorkoutRecord = {
  id: '52bc0d55-4b32-4eea-98e8-9db885a92bbb', userId: 'user_123', name: 'Push',
  timestamp: '2026-08-25T20:00:00.000Z', durationSeconds: 3600, totalVolumeKg: 4200,
  notes: 'Strong session', exercises: [{ id: 'bench', name: 'Bench Press', sets: [{ id: 'set-1', weight: 80, reps: 10, completed: true }] }],
  completed: true, completedAt: '2026-08-25T21:00:00.000Z', createdAt: '2026-08-25T20:00:00.000Z', updatedAt: '2026-08-25T21:00:00.000Z',
};

describe('workout cloud mapping', () => {
  it('round-trips identity, ownership, timestamps, completion, and nested exercises', () => {
    const cloud = mapWorkoutToCloud(workout);
    expect(cloud).toMatchObject({ id: workout.id, user_id: workout.userId, duration_seconds: 3600, completed_at: workout.completedAt, updated_at: workout.updatedAt });
    expect(mapCloudWorkout(cloud)).toEqual(workout);
  });
});
