import { describe, expect, it } from 'vitest';
import type { WorkoutRecord } from '@fitforge/types';
import { createSqliteWorkoutRepository } from '../sqlite-workout-repository';
import type { SqlDatabase } from '../../sqlite/types';

const workout: WorkoutRecord = { id: 'workout-1', userId: 'user_1', name: 'Push', timestamp: '2026-08-25T10:00:00.000Z', durationSeconds: null, totalVolumeKg: null, notes: '', exercises: [], completed: false, completedAt: null, createdAt: '2026-08-25T10:00:00.000Z', updatedAt: '2026-08-25T10:00:00.000Z' };

function fakeDatabase() {
  const calls: { sql: string; parameters?: unknown }[] = [];
  let transactions = 0;
  const db: SqlDatabase = {
    execAsync: async () => undefined,
    runAsync: async (sql, parameters) => { calls.push({ sql, parameters }); return { changes: 1, lastInsertRowId: 1 }; },
    getFirstAsync: async () => null,
    getAllAsync: async () => [],
    withExclusiveTransactionAsync: async (task) => { transactions += 1; await task(db); },
  };
  return { db, calls, transactions: () => transactions };
}

describe('SQLite workout repository', () => {
  it('writes the workout and outbox entry in one exclusive transaction', async () => {
    const fake = fakeDatabase();
    const repository = createSqliteWorkoutRepository(fake.db, { createId: () => 'op-1', now: () => workout.updatedAt });
    await repository.save('clerk:user_1', workout);
    expect(fake.transactions()).toBe(1);
    expect(fake.calls.map((call) => call.sql)).toEqual([expect.stringContaining('INSERT INTO workouts'), expect.stringContaining('INSERT INTO outbox')]);
    expect(JSON.stringify(fake.calls)).toContain('workout-1');
  });

  it('rejects an empty or mismatched partition before querying SQLite', async () => {
    const fake = fakeDatabase();
    const repository = createSqliteWorkoutRepository(fake.db);
    await expect(repository.save('', workout)).rejects.toThrow('partition');
    await expect(repository.save('clerk:user_2', workout)).rejects.toThrow('does not own');
    expect(fake.calls).toHaveLength(0);
  });
});
