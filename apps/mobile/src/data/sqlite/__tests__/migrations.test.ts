import { describe, expect, it } from 'vitest';
import { migrateDatabase } from '../migrations';
import type { SqlDatabase } from '../types';

function database(version = 0) {
  const executed: string[] = [];
  const db: SqlDatabase = {
    execAsync: async (sql) => { executed.push(sql); },
    runAsync: async () => ({ changes: 0, lastInsertRowId: 0 }),
    getFirstAsync: async <T,>(sql: string) => sql.includes('user_version') ? ({ user_version: version } as T) : null,
    getAllAsync: async <T,>() => [] as T[],
    withExclusiveTransactionAsync: async (task) => { await task(db); },
  };
  return { db, executed };
}

describe('migrateDatabase', () => {
  it('creates the partitioned workout, outbox, and checkpoint schema with durability pragmas', async () => {
    const { db, executed } = database();
    await migrateDatabase(db);
    const sql = executed.join('\n');
    expect(sql).toContain('PRAGMA foreign_keys = ON');
    expect(sql).toContain('PRAGMA journal_mode = WAL');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS workouts');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS outbox');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS sync_checkpoints');
    expect(sql).toContain("CHECK (partition <> '')");
    expect(sql).toContain('PRAGMA user_version = 1');
  });

  it('does not replay schema migrations at the current version', async () => {
    const { db, executed } = database(1);
    await migrateDatabase(db);
    expect(executed.join('\n')).not.toContain('CREATE TABLE');
  });
});
