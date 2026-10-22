import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import type * as schema from './schema';

/** The app database. Tests substitute a structurally equivalent sync driver. */
export type AppDatabase = ExpoSQLiteDatabase<typeof schema>;
