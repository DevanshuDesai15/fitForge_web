import * as Crypto from 'expo-crypto';
import type { WorkoutRecord, WorkoutRepository } from '@fitforge/types';
import type { SqlDatabase } from '../sqlite/types';

type Dependencies = { createId?: () => string; now?: () => string };
type WorkoutRow = { payload: string };

function requirePartition(partition: string) {
  if (!partition.trim()) throw new Error('A non-empty partition is required');
}
function requireOwnership(partition: string, userId: string) {
  requirePartition(partition);
  if (partition !== `clerk:${userId}`) throw new Error('The active partition does not own this workout');
}
const decode = (row: WorkoutRow) => JSON.parse(row.payload) as WorkoutRecord;

export function createSqliteWorkoutRepository(database: SqlDatabase, dependencies: Dependencies = {}): WorkoutRepository & {
  cache(partition: string, workout: WorkoutRecord): Promise<void>;
  deleteCached(partition: string, id: string): Promise<void>;
} {
  const createId = dependencies.createId ?? (() => Crypto.randomUUID());
  const now = dependencies.now ?? (() => new Date().toISOString());
  return {
    async list(partition) { requirePartition(partition); return (await database.getAllAsync<WorkoutRow>('SELECT payload FROM workouts WHERE partition = ? ORDER BY updated_at DESC, id DESC', [partition])).map(decode); },
    async get(partition, id) { requirePartition(partition); const row = await database.getFirstAsync<WorkoutRow>('SELECT payload FROM workouts WHERE partition = ? AND id = ?', [partition, id]); return row ? decode(row) : null; },
    async save(partition, workout) {
      requireOwnership(partition, workout.userId);
      await database.withExclusiveTransactionAsync(async (transaction) => {
        const payload = JSON.stringify(workout);
        await transaction.runAsync('INSERT INTO workouts (partition, id, user_id, payload, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(partition, id) DO UPDATE SET user_id = excluded.user_id, payload = excluded.payload, updated_at = excluded.updated_at', [partition, workout.id, workout.userId, payload, workout.updatedAt]);
        await transaction.runAsync('INSERT INTO outbox (partition, id, entity, entity_id, action, payload, attempts, next_attempt_at, status, last_error, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, NULL, ?)', [partition, createId(), 'workout', workout.id, 'upsert', payload, now(), 'pending', now()]);
      });
    },
    async remove(partition, id) {
      requirePartition(partition);
      await database.withExclusiveTransactionAsync(async (transaction) => {
        await transaction.runAsync('DELETE FROM workouts WHERE partition = ? AND id = ?', [partition, id]);
        const timestamp = now();
        await transaction.runAsync('INSERT INTO outbox (partition, id, entity, entity_id, action, payload, attempts, next_attempt_at, status, last_error, created_at) VALUES (?, ?, ?, ?, ?, NULL, 0, ?, ?, NULL, ?)', [partition, createId(), 'workout', id, 'delete', timestamp, 'pending', timestamp]);
      });
    },
    async cache(partition: string, workout: WorkoutRecord) {
      requireOwnership(partition, workout.userId);
      await database.runAsync('INSERT INTO workouts (partition, id, user_id, payload, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(partition, id) DO UPDATE SET user_id = excluded.user_id, payload = excluded.payload, updated_at = excluded.updated_at', [partition, workout.id, workout.userId, JSON.stringify(workout), workout.updatedAt]);
    },
    async deleteCached(partition: string, id: string) {
      requirePartition(partition);
      await database.runAsync('DELETE FROM workouts WHERE partition = ? AND id = ?', [partition, id]);
    },
  };
}

export type SqliteWorkoutRepository = ReturnType<typeof createSqliteWorkoutRepository>;
