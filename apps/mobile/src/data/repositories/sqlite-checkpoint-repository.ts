import type { SyncCheckpoint } from '@fitforge/types';
import type { SqlDatabase } from '../sqlite/types';

const requirePartition = (partition: string) => { if (!partition.trim()) throw new Error('A non-empty partition is required'); };

export function createSqliteCheckpointRepository(database: SqlDatabase) {
  return {
    async get(partition: string): Promise<SyncCheckpoint | null> {
      requirePartition(partition);
      const row = await database.getFirstAsync<{ partition: string; entity: 'workout'; updated_at: string; entity_id: string }>('SELECT partition, entity, updated_at, entity_id FROM sync_checkpoints WHERE partition = ? AND entity = ?', [partition, 'workout']);
      return row ? { partition: row.partition, entity: row.entity, updatedAt: row.updated_at, entityId: row.entity_id } : null;
    },
    async set(checkpoint: SyncCheckpoint): Promise<void> {
      requirePartition(checkpoint.partition);
      await database.runAsync('INSERT INTO sync_checkpoints (partition, entity, updated_at, entity_id) VALUES (?, ?, ?, ?) ON CONFLICT(partition, entity) DO UPDATE SET updated_at = excluded.updated_at, entity_id = excluded.entity_id', [checkpoint.partition, checkpoint.entity, checkpoint.updatedAt, checkpoint.entityId]);
    },
  };
}

export type SqliteCheckpointRepository = ReturnType<typeof createSqliteCheckpointRepository>;
