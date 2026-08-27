import { describe, expect, it } from 'vitest';
import { createSqliteOutboxRepository } from '../sqlite-outbox-repository';
import type { SqlDatabase } from '../../sqlite/types';

describe('SQLite outbox repository', () => {
  it('scopes pending counts and ready batches to the active partition', async () => {
    const queries: { sql: string; parameters?: unknown }[] = [];
    const db: SqlDatabase = { execAsync: async () => undefined, runAsync: async () => ({ changes: 1, lastInsertRowId: 0 }), getFirstAsync: async <T,>(sql: string, parameters?: unknown) => { queries.push({ sql, parameters }); return { count: 2 } as T; }, getAllAsync: async <T,>(sql: string, parameters?: unknown) => { queries.push({ sql, parameters }); return [] as T[]; }, withExclusiveTransactionAsync: async () => undefined };
    const repository = createSqliteOutboxRepository(db);
    expect(await repository.count('clerk:user_1')).toBe(2);
    await repository.ready('clerk:user_1', '2026-08-25T12:00:00.000Z', 20);
    expect(queries).toHaveLength(2);
    expect(queries.every((query) => query.sql.includes('partition = ?'))).toBe(true);
    expect(queries.every((query) => JSON.stringify(query.parameters).includes('clerk:user_1'))).toBe(true);
  });
});
