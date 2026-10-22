import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

/**
 * Local SQLite schema (ADR 0043). These tables are hand-written and mapped
 * to/from the shared domain models (ADR 0012). Local migrations are independent
 * of the file `schemaVersion` (ADR 0026/0043).
 */

export const exercises = sqliteTable(
  'exercises',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    /** Trimmed + lowercased title, unique (ADR 0036). */
    titleKey: text('title_key').notNull(),
    description: text('description').notNull(),
    archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
  },
  (table) => [uniqueIndex('exercises_title_key_unique').on(table.titleKey)],
);

export const plans = sqliteTable('plans', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
});

export const routines = sqliteTable(
  'routines',
  {
    id: text('id').primaryKey(),
    planId: text('plan_id')
      .notNull()
      .references(() => plans.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    active: integer('active', { mode: 'boolean' }).notNull().default(false),
    position: integer('position').notNull(),
  },
  (table) => [index('routines_plan_id_idx').on(table.planId)],
);

export const modules = sqliteTable(
  'modules',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    routineId: text('routine_id')
      .notNull()
      .references(() => routines.id, { onDelete: 'cascade' }),
    kind: text('kind').notNull(),
    enabled: integer('enabled', { mode: 'boolean' }).notNull(),
    position: integer('position').notNull(),
  },
  (table) => [
    uniqueIndex('modules_routine_kind_unique').on(table.routineId, table.kind),
    index('modules_routine_id_idx').on(table.routineId),
  ],
);

export const items = sqliteTable(
  'items',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    moduleId: integer('module_id')
      .notNull()
      .references(() => modules.id, { onDelete: 'cascade' }),
    kind: text('kind').notNull(),
    position: integer('position').notNull(),
    /** Set for exercise Items only. */
    exerciseId: text('exercise_id').references(() => exercises.id),
    /** Set for Superset Items only (ADR 0040). */
    rounds: integer('rounds'),
    restSeconds: integer('rest_seconds'),
  },
  (table) => [index('items_module_id_idx').on(table.moduleId)],
);

/** Standalone Sets of an exercise Item (rest lives here). */
export const sets = sqliteTable(
  'sets',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    itemId: integer('item_id')
      .notNull()
      .references(() => items.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    mode: text('mode').notNull(),
    targetReps: integer('target_reps'),
    targetSeconds: integer('target_seconds'),
    weightKg: real('weight_kg'),
    restSeconds: integer('rest_seconds'),
  },
  (table) => [index('sets_item_id_idx').on(table.itemId)],
);

/** Superset members: one Exercise reference + one Set template, no rest (ADR 0040). */
export const supersetMembers = sqliteTable(
  'superset_members',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    itemId: integer('item_id')
      .notNull()
      .references(() => items.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    exerciseId: text('exercise_id')
      .notNull()
      .references(() => exercises.id),
    mode: text('mode').notNull(),
    targetReps: integer('target_reps'),
    targetSeconds: integer('target_seconds'),
    weightKg: real('weight_kg'),
  },
  (table) => [index('superset_members_item_id_idx').on(table.itemId)],
);

/**
 * Saved Workout log. Deliberately has no foreign keys to Plans or Routines:
 * history snapshots the ids and never depends on them staying alive (ADR 0035).
 * `details` is the serialized domain Workout (the CSV `details` shape, ADR 0027).
 */
export const workouts = sqliteTable(
  'workouts',
  {
    workoutId: text('workout_id').primaryKey(),
    planId: text('plan_id').notNull(),
    planName: text('plan_name').notNull(),
    routineId: text('routine_id').notNull(),
    routineName: text('routine_name').notNull(),
    startedAt: text('started_at').notNull(),
    endedAt: text('ended_at').notNull(),
    startedOn: text('started_on').notNull(),
    details: text('details').notNull(),
  },
  (table) => [
    index('workouts_started_at_idx').on(table.startedAt),
    index('workouts_plan_id_idx').on(table.planId),
    index('workouts_routine_id_idx').on(table.routineId),
  ],
);

/**
 * The at-most-one in-progress draft, separate from saved logs (ADR 0039).
 * The singleton check removes any chance of two drafts; `details` holds the
 * draft payload (its domain schema lands with issue #39).
 */
export const activeWorkout = sqliteTable(
  'active_workout',
  {
    id: integer('id').primaryKey(),
    sessionId: text('session_id').notNull(),
    details: text('details').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [check('active_workout_singleton', sql`${table.id} = 1`)],
);

/** Durable sync outbox (ADR 0005, ADR 0028, ADR 0041); the source of truth for "pending". */
export const outbox = sqliteTable(
  'outbox',
  {
    id: text('id').primaryKey(),
    kind: text('kind').notNull(),
    payload: text('payload').notNull(),
    createdAt: text('created_at').notNull(),
    attempts: integer('attempts').notNull().default(0),
    lastError: text('last_error'),
  },
  (table) => [
    index('outbox_created_at_idx').on(table.createdAt),
    index('outbox_kind_idx').on(table.kind),
  ],
);
