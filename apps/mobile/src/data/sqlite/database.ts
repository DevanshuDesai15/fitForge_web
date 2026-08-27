import * as SQLite from 'expo-sqlite';
import { migrateDatabase } from './migrations';
import type { SqlDatabase, SqlParameters, SqlRunResult } from './types';

function adapt(database: SQLite.SQLiteDatabase): SqlDatabase {
  const adapted: SqlDatabase = {
    execAsync: (sql) => database.execAsync(sql),
    runAsync: (sql, parameters) => database.runAsync(sql, (parameters ?? []) as never) as Promise<SqlRunResult>,
    getFirstAsync: <T,>(sql: string, parameters?: SqlParameters) => database.getFirstAsync<T>(sql, (parameters ?? []) as never),
    getAllAsync: <T,>(sql: string, parameters?: SqlParameters) => database.getAllAsync<T>(sql, (parameters ?? []) as never),
    withExclusiveTransactionAsync: (task) => database.withExclusiveTransactionAsync(async (transaction) => task(adapt(transaction))),
  };
  return adapted;
}

export async function openFitForgeDatabase() {
  const nativeDatabase = await SQLite.openDatabaseAsync('fitforge.db');
  const database = adapt(nativeDatabase);
  await migrateDatabase(database);
  return database;
}

let databasePromise: ReturnType<typeof openFitForgeDatabase> | null = null;
export function getFitForgeDatabase() {
  databasePromise ??= openFitForgeDatabase();
  return databasePromise;
}
