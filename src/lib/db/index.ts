import { PostgresDatabase } from './postgres.ts';
import { LocalDatabase } from './local.ts';
import type { Database } from './types.ts';

export type * from './types.ts';

let sharedDatabase: Database | null = null;

export function getDatabase(): Database {
  if (!sharedDatabase) {
    sharedDatabase = process.env.DATABASE_URL ? new PostgresDatabase() : new LocalDatabase();
  }
  return sharedDatabase;
}

export async function initializeDatabase(): Promise<void> {
  const db = getDatabase();
  await db.initialize();
}
