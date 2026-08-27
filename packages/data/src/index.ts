export const DATA_PACKAGE = '@fitforge/data' as const;

import type { WorkoutExercise, WorkoutRecord } from '@fitforge/types';

export type CloudWorkoutRow = {
  id: string; user_id: string; name: string; timestamp: string; duration_seconds: number | null;
  total_volume_kg: number | null; notes: string | null; exercises: WorkoutExercise[] | null;
  completed: boolean; completed_at: string | null; created_at: string; updated_at: string;
};

export function mapWorkoutToCloud(workout: WorkoutRecord): CloudWorkoutRow {
  return { id: workout.id, user_id: workout.userId, name: workout.name, timestamp: workout.timestamp, duration_seconds: workout.durationSeconds, total_volume_kg: workout.totalVolumeKg, notes: workout.notes, exercises: workout.exercises, completed: workout.completed, completed_at: workout.completedAt, created_at: workout.createdAt, updated_at: workout.updatedAt };
}

export function mapCloudWorkout(row: CloudWorkoutRow): WorkoutRecord {
  return { id: row.id, userId: row.user_id, name: row.name, timestamp: row.timestamp, durationSeconds: row.duration_seconds, totalVolumeKg: row.total_volume_kg, notes: row.notes ?? '', exercises: row.exercises ?? [], completed: row.completed, completedAt: row.completed_at, createdAt: row.created_at, updatedAt: row.updated_at };
}
