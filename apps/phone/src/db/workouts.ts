import { type Workout, WorkoutSchema } from '@spotter/domain';
import { desc, eq } from 'drizzle-orm';
import { workouts } from './schema';
import type { AppDatabase } from './types';

type WorkoutRow = typeof workouts.$inferSelect;
type WorkoutInsert = typeof workouts.$inferInsert;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const defaultLegacyWeightFlag = (value: unknown): unknown => {
  if (!isRecord(value) || Object.hasOwn(value, 'usesWeight')) return value;
  return { ...value, usesWeight: true };
};

/**
 * Existing on-device snapshots predate the schema-v2 weight flag. Imported
 * files still use strict schema validation; only local records receive this
 * one-time compatibility default.
 */
export const parseStoredWorkout = (value: unknown): Workout => {
  if (!isRecord(value) || !Array.isArray(value.exercises)) return WorkoutSchema.parse(value);

  const exercises = value.exercises.map((entry) => {
    if (!isRecord(entry)) return entry;
    if (entry.kind === 'exercise') return defaultLegacyWeightFlag(entry);
    if (entry.kind !== 'superset' || !Array.isArray(entry.members)) return entry;
    return {
      ...entry,
      members: entry.members.map(defaultLegacyWeightFlag),
    };
  });

  return WorkoutSchema.parse({ ...value, exercises });
};

export const workoutToRow = (workout: Workout): WorkoutInsert => {
  const parsed = WorkoutSchema.parse(workout);
  return {
    workoutId: parsed.workoutId,
    planId: parsed.planId,
    planName: parsed.planName,
    routineId: parsed.routineId,
    routineName: parsed.routineName,
    startedAt: parsed.startedAt,
    endedAt: parsed.endedAt,
    startedOn: parsed.startedOn,
    details: JSON.stringify(parsed),
  };
};

export const rowToWorkout = (row: WorkoutRow): Workout =>
  parseStoredWorkout(JSON.parse(row.details));

/**
 * Append a saved Workout. Imports and retries dedupe by id and never overwrite
 * an existing log (ADR 0024, ADR 0037).
 */
export const saveWorkout = (db: AppDatabase, workout: Workout): Workout => {
  const parsed = WorkoutSchema.parse(workout);
  db.insert(workouts).values(workoutToRow(parsed)).onConflictDoNothing().run();
  return parsed;
};

export const loadWorkout = (db: AppDatabase, workoutId: string): Workout | null => {
  const row = db.select().from(workouts).where(eq(workouts.workoutId, workoutId)).get();
  return row ? rowToWorkout(row) : null;
};

/** Chronological history, newest first. */
export const listWorkouts = (db: AppDatabase): Workout[] =>
  db.select().from(workouts).orderBy(desc(workouts.startedAt)).all().map(rowToWorkout);
