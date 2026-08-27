export type SqlRunResult = { changes: number; lastInsertRowId: number };
export type SqlParameters = readonly (string | number | null)[] | Record<string, string | number | null>;

export interface SqlDatabase {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, parameters?: SqlParameters): Promise<SqlRunResult>;
  getFirstAsync<T>(sql: string, parameters?: SqlParameters): Promise<T | null>;
  getAllAsync<T>(sql: string, parameters?: SqlParameters): Promise<T[]>;
  withExclusiveTransactionAsync(task: (database: SqlDatabase) => Promise<void>): Promise<void>;
}
