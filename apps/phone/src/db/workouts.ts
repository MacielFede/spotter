import { type Workout, WorkoutSchema } from '@spotter/domain';
import { desc, eq } from 'drizzle-orm';
import { workouts } from './schema';
import type { AppDatabase } from './types';

type WorkoutRow = typeof workouts.$inferSelect;
type WorkoutInsert = typeof workouts.$inferInsert;

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
  WorkoutSchema.parse(JSON.parse(row.details));

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
