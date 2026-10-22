import { type Exercise, ExerciseSchema, normalizeExerciseTitle } from '@spotter/domain';
import { asc, eq } from 'drizzle-orm';
import { exercises } from './schema';
import type { AppDatabase } from './types';

type ExerciseRow = typeof exercises.$inferSelect;
type ExerciseInsert = typeof exercises.$inferInsert;

export const exerciseToRow = (exercise: Exercise): ExerciseInsert => {
  const parsed = ExerciseSchema.parse(exercise);
  return {
    id: parsed.id,
    title: parsed.title,
    titleKey: normalizeExerciseTitle(parsed.title),
    description: parsed.description,
    archived: parsed.archived,
  };
};

export const rowToExercise = (row: ExerciseRow): Exercise =>
  ExerciseSchema.parse({
    id: row.id,
    title: row.title,
    description: row.description,
    archived: row.archived,
  });

export interface ListExercisesOptions {
  includeArchived?: boolean;
}

/** Global library list; archived Exercises are hidden unless explicitly requested (ADR 0030). */
export const listExercises = (
  db: AppDatabase,
  { includeArchived = false }: ListExercisesOptions = {},
): Exercise[] => {
  const query = db.select().from(exercises);
  const rows = includeArchived
    ? query.orderBy(asc(exercises.titleKey)).all()
    : query.where(eq(exercises.archived, false)).orderBy(asc(exercises.titleKey)).all();
  return rows.map(rowToExercise);
};

export const findExerciseByTitle = (db: AppDatabase, title: string): Exercise | null => {
  const row = db
    .select()
    .from(exercises)
    .where(eq(exercises.titleKey, normalizeExerciseTitle(title)))
    .get();
  return row ? rowToExercise(row) : null;
};

export const loadExercise = (db: AppDatabase, id: string): Exercise | null => {
  const row = db.select().from(exercises).where(eq(exercises.id, id)).get();
  return row ? rowToExercise(row) : null;
};

/**
 * Insert or update by id. A duplicate normalized title throws the SQLite unique
 * constraint — callers surface that as a clear duplicate-title error (ADR 0036).
 */
export const saveExercise = (db: AppDatabase, exercise: Exercise): Exercise => {
  const row = exerciseToRow(exercise);
  db.insert(exercises)
    .values(row)
    .onConflictDoUpdate({
      target: exercises.id,
      set: {
        title: row.title,
        titleKey: row.titleKey,
        description: row.description,
        archived: row.archived,
      },
    })
    .run();
  return rowToExercise(row as ExerciseRow);
};

/** Archive/unarchive; Exercises are never hard-deleted (ADR 0030). */
export const setExerciseArchived = (db: AppDatabase, id: string, archived: boolean): void => {
  db.update(exercises).set({ archived }).where(eq(exercises.id, id)).run();
};
