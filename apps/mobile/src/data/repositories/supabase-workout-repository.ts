import { mapCloudWorkout, mapWorkoutToCloud, type CloudWorkoutRow } from '@fitforge/data';
import type { SyncCheckpoint, WorkoutRecord } from '@fitforge/types';
import type { SupabaseClient } from '@supabase/supabase-js';

const WORKOUT_COLUMNS = 'id,user_id,name,timestamp,duration_seconds,total_volume_kg,notes,exercises,completed,completed_at,created_at,updated_at';

function assertOwner(userId: string, workout: WorkoutRecord) {
  if (!userId || workout.userId !== userId) throw new Error('Workout owner does not match the active user');
}

function unwrap<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw Object.assign(new Error(result.error.message), result.error);
  if (result.data === null) throw new Error('Supabase returned no workout data');
  return result.data;
}

export function createSupabaseWorkoutRepository(client: SupabaseClient) {
  return {
    async upsert(userId: string, workout: WorkoutRecord): Promise<WorkoutRecord> {
      assertOwner(userId, workout);
      const result = await client
        .from('workouts')
        .upsert(mapWorkoutToCloud(workout), { onConflict: 'id' })
        .select(WORKOUT_COLUMNS)
        .eq('user_id', userId)
        .single();
      return mapCloudWorkout(unwrap(result) as CloudWorkoutRow);
    },

    async pull(userId: string, checkpoint: SyncCheckpoint | null, limit: number): Promise<WorkoutRecord[]> {
      if (!userId) throw new Error('An active user is required');
      let query = client.from('workouts').select(WORKOUT_COLUMNS).eq('user_id', userId);
      if (checkpoint) {
        query = query.or(`updated_at.gt.${checkpoint.updatedAt},and(updated_at.eq.${checkpoint.updatedAt},id.gt.${checkpoint.entityId})`);
      }
      const result = await query.order('updated_at', { ascending: true }).order('id', { ascending: true }).limit(limit);
      if (result.error) throw Object.assign(new Error(result.error.message), result.error);
      return ((result.data ?? []) as CloudWorkoutRow[]).map(mapCloudWorkout);
    },

    async remove(userId: string, id: string): Promise<void> {
      if (!userId || !id) throw new Error('An active user and workout id are required');
      const result = await client.from('workouts').delete().eq('id', id).eq('user_id', userId);
      if (result.error) throw Object.assign(new Error(result.error.message), result.error);
    },
  };
}

export type SupabaseWorkoutRepository = ReturnType<typeof createSupabaseWorkoutRepository>;
