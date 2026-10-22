import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';
import type { AppDatabase } from './types';

export const DATABASE_NAME = 'spotter.db';

const expoDb = openDatabaseSync(DATABASE_NAME, { enableChangeListener: true });

// Cascades must actually fire: deleting a Plan may only remove its own Routines
// and their children (ADR 0001, ADR 0035).
expoDb.execSync('PRAGMA foreign_keys = ON;');

export const db: AppDatabase = drizzle(expoDb, { schema });
