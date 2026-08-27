import type { OutboxOperation } from '@fitforge/types';
import type { SqlDatabase } from '../sqlite/types';

type OutboxRow = { id: string; partition: string; entity: 'workout'; entity_id: string; action: 'upsert' | 'delete'; payload: string | null; attempts: number; next_attempt_at: string; status: 'pending' | 'blocked-auth' | 'permanent-failure'; last_error: string | null; created_at: string };
const requirePartition = (partition: string) => { if (!partition.trim()) throw new Error('A non-empty partition is required'); };
const decode = (row: OutboxRow): OutboxOperation => ({ id: row.id, partition: row.partition, entity: row.entity, entityId: row.entity_id, action: row.action, payload: row.payload ? JSON.parse(row.payload) : null, attempts: row.attempts, nextAttemptAt: row.next_attempt_at, status: row.status, lastError: row.last_error, createdAt: row.created_at });

export function createSqliteOutboxRepository(database: SqlDatabase) {
  return {
    async count(partition: string) { requirePartition(partition); const row = await database.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM outbox WHERE partition = ?', [partition]); return row?.count ?? 0; },
    async ready(partition: string, at: string, limit: number) { requirePartition(partition); const rows = await database.getAllAsync<OutboxRow>("SELECT * FROM outbox WHERE partition = ? AND status IN ('pending', 'blocked-auth') AND next_attempt_at <= ? ORDER BY created_at ASC LIMIT ?", [partition, at, limit]); return rows.map(decode); },
    async acknowledge(partition: string, id: string) { requirePartition(partition); await database.runAsync('DELETE FROM outbox WHERE partition = ? AND id = ?', [partition, id]); },
    async retry(partition: string, id: string, attempts: number, nextAttemptAt: string, message: string) { requirePartition(partition); await database.runAsync("UPDATE outbox SET attempts = ?, next_attempt_at = ?, last_error = ?, status = 'pending' WHERE partition = ? AND id = ?", [attempts, nextAttemptAt, message, partition, id]); },
    async fail(partition: string, id: string, status: 'blocked-auth' | 'permanent-failure', message: string) { requirePartition(partition); await database.runAsync('UPDATE outbox SET status = ?, last_error = ? WHERE partition = ? AND id = ?', [status, message, partition, id]); },
  };
}
