import { describe, expect, it } from 'vitest';
import type { WorkoutRecord } from '@fitforge/types';
import { createSupabaseWorkoutRepository } from '../supabase-workout-repository';

const workout: WorkoutRecord = { id: 'client-uuid', userId: 'user_1', name: 'Pull', timestamp: '2026-08-25T10:00:00.000Z', durationSeconds: 3000, totalVolumeKg: 3000, notes: '', exercises: [], completed: true, completedAt: '2026-08-25T11:00:00.000Z', createdAt: '2026-08-25T10:00:00.000Z', updatedAt: '2026-08-25T11:00:00.000Z' };

function cloud() {
  const calls: { method: string; value?: unknown }[] = [];
  const result = { data: { id: workout.id, user_id: workout.userId, name: workout.name, timestamp: workout.timestamp, duration_seconds: workout.durationSeconds, total_volume_kg: workout.totalVolumeKg, notes: workout.notes, exercises: workout.exercises, completed: workout.completed, completed_at: workout.completedAt, created_at: workout.createdAt, updated_at: workout.updatedAt }, error: null };
  const builder: Record<string, (...args: unknown[]) => unknown> = {};
  for (const method of ['select', 'eq', 'gt', 'or', 'order', 'limit', 'upsert', 'delete', 'single']) builder[method] = (...args: unknown[]) => { calls.push({ method, value: args }); return method === 'single' ? Promise.resolve(result) : builder; };
  Object.assign(builder, { then: (resolve: (value: unknown) => unknown) => Promise.resolve(resolve({ data: [result.data], error: null })) });
  return { client: { from: (table: string) => { calls.push({ method: 'from', value: table }); return builder; } }, calls };
}

describe('Supabase workout repository', () => {
  it('upserts the client UUID and scopes the accepted row to its owner', async () => {
    const fake = cloud();
    const repository = createSupabaseWorkoutRepository(fake.client as never);
    expect(await repository.upsert('user_1', workout)).toEqual(workout);
    expect(fake.calls.find((call) => call.method === 'upsert')?.value).toEqual([expect.objectContaining({ id: 'client-uuid', user_id: 'user_1' }), { onConflict: 'id' }]);
    expect(fake.calls).toContainEqual({ method: 'eq', value: ['user_id', 'user_1'] });
  });

  it('scopes pulls to the active owner and orders the stable checkpoint tuple', async () => {
    const fake = cloud();
    const repository = createSupabaseWorkoutRepository(fake.client as never);
    await repository.pull('user_1', null, 100);
    expect(fake.calls).toContainEqual({ method: 'eq', value: ['user_id', 'user_1'] });
    expect(fake.calls.filter((call) => call.method === 'order').map((call) => call.value)).toEqual([['updated_at', { ascending: true }], ['id', { ascending: true }]]);
  });
});
