import type { SqlDatabase } from './types';

export const DATABASE_VERSION = 1;

const VERSION_1 = `
CREATE TABLE IF NOT EXISTS workouts (
  partition TEXT NOT NULL CHECK (partition <> ''),
  id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (partition, id)
);
CREATE INDEX IF NOT EXISTS workouts_partition_updated ON workouts(partition, updated_at, id);

CREATE TABLE IF NOT EXISTS outbox (
  partition TEXT NOT NULL CHECK (partition <> ''),
  id TEXT NOT NULL,
  entity TEXT NOT NULL CHECK (entity = 'workout'),
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('upsert', 'delete')),
  payload TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  next_attempt_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  last_error TEXT,
  created_at TEXT NOT NULL,
  PRIMARY KEY (partition, id)
);
CREATE INDEX IF NOT EXISTS outbox_ready ON outbox(partition, status, next_attempt_at, created_at);

CREATE TABLE IF NOT EXISTS sync_checkpoints (
  partition TEXT NOT NULL CHECK (partition <> ''),
  entity TEXT NOT NULL CHECK (entity = 'workout'),
  updated_at TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  PRIMARY KEY (partition, entity)
);
PRAGMA user_version = 1;
`;

export async function migrateDatabase(database: SqlDatabase) {
  await database.execAsync('PRAGMA foreign_keys = ON;\nPRAGMA journal_mode = WAL;');
  const row = await database.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const version = row?.user_version ?? 0;
  if (version > DATABASE_VERSION) throw new Error(`Database version ${version} is newer than supported version ${DATABASE_VERSION}`);
  if (version < 1) await database.execAsync(VERSION_1);
}
