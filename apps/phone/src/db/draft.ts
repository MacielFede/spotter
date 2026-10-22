import { eq } from 'drizzle-orm';
import { activeWorkout } from './schema';
import type { AppDatabase } from './types';

export interface ActiveWorkoutDraft {
  sessionId: string;
  /** Serialized draft payload; the draft schema lands with issue #39. */
  details: string;
  updatedAt: string;
}

const SINGLETON_ID = 1;

/** Persist the single in-progress draft (ADR 0038, ADR 0039). */
export const saveActiveWorkout = (db: AppDatabase, draft: ActiveWorkoutDraft): void => {
  db.insert(activeWorkout)
    .values({ id: SINGLETON_ID, ...draft })
    .onConflictDoUpdate({
      target: activeWorkout.id,
      set: {
        sessionId: draft.sessionId,
        details: draft.details,
        updatedAt: draft.updatedAt,
      },
    })
    .run();
};

export const loadActiveWorkout = (db: AppDatabase): ActiveWorkoutDraft | null => {
  const row = db.select().from(activeWorkout).where(eq(activeWorkout.id, SINGLETON_ID)).get();
  return row ? { sessionId: row.sessionId, details: row.details, updatedAt: row.updatedAt } : null;
};

/** Save or Cancel both end the session; nothing partial survives (ADR 0025). */
export const clearActiveWorkout = (db: AppDatabase): void => {
  db.delete(activeWorkout).where(eq(activeWorkout.id, SINGLETON_ID)).run();
};
