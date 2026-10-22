import { fileURLToPath } from 'node:url';
import type { Exercise, Plan, Workout } from '@spotter/domain';
import Database from 'better-sqlite3';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { describe, expect, it } from 'vitest';
import { clearActiveWorkout, loadActiveWorkout, saveActiveWorkout } from './draft';
import {
  findExerciseByTitle,
  listExercises,
  loadExercise,
  saveExercise,
  setExerciseArchived,
} from './exercises';
import {
  ackPersistedOutbox,
  createOutboxStore,
  enqueuePersistedOutbox,
  failPersistedOutbox,
  pendingPersistedOutbox,
  pendingPersistedOutboxCount,
} from './outbox';
import { deletePlan, listPlans, loadPlan, savePlan } from './plans';
import {
  activeWorkout,
  items,
  modules,
  outbox,
  routines,
  sets,
  supersetMembers,
  workouts,
} from './schema';
import type { AppDatabase } from './types';
import { listWorkouts, loadWorkout, saveWorkout } from './workouts';

const migrationsFolder = fileURLToPath(new URL('../../drizzle', import.meta.url));

const createDatabase = (): AppDatabase => {
  const sqlite = new Database(':memory:');
  sqlite.pragma('foreign_keys = ON');
  const db = drizzle(sqlite);
  migrate(db, { migrationsFolder });
  return db as unknown as AppDatabase;
};

const EX_A = '0193a1b2-c3d4-7e5f-89ab-cdef01234567';
const EX_B = '0193a1b2-c3d4-7e5f-89ab-cdef01234568';
const PLAN_ID = '0193a1b2-c3d4-7e5f-89ab-cdef01234569';
const ROUTINE_ID = '0193a1b2-c3d4-7e5f-89ab-cdef0123456a';

const exercise = (id: string, title: string): Exercise => ({
  id,
  title,
  description: '',
  archived: false,
});

const plan: Plan = {
  id: PLAN_ID,
  name: 'Hypertrophy',
  routines: [
    {
      id: ROUTINE_ID,
      name: 'Push Day A',
      active: true,
      modules: [
        { kind: 'warmup', enabled: false, items: [] },
        {
          kind: 'core',
          enabled: true,
          items: [
            {
              kind: 'exercise',
              exerciseId: EX_A,
              sets: [
                { mode: 'reps', targetReps: 8, weightKg: 60, restSeconds: 90 },
                { mode: 'time', targetSeconds: 45, weightKg: null, restSeconds: 30 },
              ],
            },
            {
              kind: 'superset',
              rounds: 3,
              restSeconds: 60,
              members: [
                { exerciseId: EX_B, set: { mode: 'reps', targetReps: 12, weightKg: 20 } },
                { exerciseId: EX_A, set: { mode: 'time', targetSeconds: 30, weightKg: null } },
              ],
            },
          ],
        },
      ],
    },
  ],
};

const workout: Workout = {
  workoutId: '0193a1b2-c3d4-7e5f-89ab-cdef01234570',
  planId: PLAN_ID,
  planName: 'Hypertrophy',
  routineId: ROUTINE_ID,
  routineName: 'Push Day A',
  startedAt: '2026-10-12T18:30:00+02:00',
  endedAt: '2026-10-12T19:35:00+02:00',
  startedOn: 'phone',
  exercises: [
    {
      kind: 'exercise',
      exerciseId: EX_A,
      title: 'Bench Press',
      description: '',
      module: 'core',
      rounds: 1,
      sets: [
        {
          mode: 'reps',
          targetReps: 8,
          weightKg: 60,
          restSeconds: 90,
          actualReps: 8,
          actualWeightKg: 60,
        },
      ],
    },
    {
      kind: 'superset',
      module: 'core',
      rounds: 2,
      restSeconds: 60,
      members: [
        {
          exerciseId: EX_B,
          title: 'Row',
          description: '',
          set: { mode: 'reps', targetReps: 12, weightKg: 20 },
          actuals: [
            { mode: 'reps', actualReps: 12, actualWeightKg: 20 },
            { mode: 'reps', actualReps: null, actualWeightKg: null },
          ],
        },
        {
          exerciseId: EX_A,
          title: 'Bench Press',
          description: '',
          set: { mode: 'time', targetSeconds: 30, weightKg: null },
          actuals: [
            { mode: 'time', actualSeconds: 30, actualWeightKg: null },
            { mode: 'time', actualSeconds: null, actualWeightKg: null },
          ],
        },
      ],
    },
  ],
};

describe('phone storage (issue #21)', () => {
  it('runs migrations on startup and creates every table', () => {
    const db = createDatabase();
    const rows = db
      .all<{ name: string }>(sql`select name from sqlite_master where type = 'table'`)
      .map((row) => row.name);
    expect(rows).toEqual(
      expect.arrayContaining([
        'plans',
        'routines',
        'modules',
        'items',
        'sets',
        'superset_members',
        'exercises',
        'workouts',
        'active_workout',
        'outbox',
      ]),
    );
  });

  it('round-trips an Exercise and rejects duplicate titles (ADR 0036)', () => {
    const db = createDatabase();
    saveExercise(db, { ...exercise(EX_A, 'Bench Press'), description: 'Bar to chest.' });
    expect(loadExercise(db, EX_A)).toEqual({
      ...exercise(EX_A, 'Bench Press'),
      description: 'Bar to chest.',
    });

    expect(() =>
      saveExercise(db, { ...exercise(EX_B, '  bench press '), description: '' }),
    ).toThrow();

    expect(findExerciseByTitle(db, ' BENCH PRESS ')?.id).toBe(EX_A);
  });

  it('hides archived Exercises unless requested (ADR 0030)', () => {
    const db = createDatabase();
    saveExercise(db, exercise(EX_A, 'Bench Press'));
    saveExercise(db, exercise(EX_B, 'Row'));
    setExerciseArchived(db, EX_B, true);

    expect(listExercises(db).map((row) => row.id)).toEqual([EX_A]);
    expect(listExercises(db, { includeArchived: true })).toHaveLength(2);
  });

  it('round-trips a full Plan aggregate through the normalized tables', () => {
    const db = createDatabase();
    saveExercise(db, exercise(EX_A, 'Bench Press'));
    saveExercise(db, exercise(EX_B, 'Row'));

    savePlan(db, plan);
    expect(loadPlan(db, PLAN_ID)).toEqual(plan);
    expect(listPlans(db)).toEqual([plan]);
  });

  it('replaces a Plan atomically on re-save', () => {
    const db = createDatabase();
    saveExercise(db, exercise(EX_A, 'Bench Press'));
    saveExercise(db, exercise(EX_B, 'Row'));
    savePlan(db, plan);

    const renamed = { ...plan, name: 'Hypertrophy B' };
    savePlan(db, renamed);
    expect(loadPlan(db, PLAN_ID)?.name).toBe('Hypertrophy B');
    expect(db.select().from(routines).all()).toHaveLength(1);
    expect(db.select().from(modules).all()).toHaveLength(2);
    expect(db.select().from(items).all()).toHaveLength(2);
    expect(db.select().from(sets).all()).toHaveLength(2);
    expect(db.select().from(supersetMembers).all()).toHaveLength(2);
  });

  it('deleting a Plan leaves Exercises and Workouts intact (ADR 0001, ADR 0035)', () => {
    const db = createDatabase();
    saveExercise(db, exercise(EX_A, 'Bench Press'));
    saveExercise(db, exercise(EX_B, 'Row'));
    savePlan(db, plan);
    saveWorkout(db, workout);

    expect(deletePlan(db, PLAN_ID)).toBe(1);
    expect(loadPlan(db, PLAN_ID)).toBeNull();
    expect(db.select().from(routines).all()).toHaveLength(0);
    expect(db.select().from(modules).all()).toHaveLength(0);
    expect(db.select().from(items).all()).toHaveLength(0);
    expect(db.select().from(sets).all()).toHaveLength(0);
    expect(db.select().from(supersetMembers).all()).toHaveLength(0);

    expect(listExercises(db)).toHaveLength(2);
    expect(loadWorkout(db, workout.workoutId)).toEqual(workout);
  });

  it('round-trips a saved Workout snapshot and dedupes by id (ADR 0037)', () => {
    const db = createDatabase();
    saveWorkout(db, workout);
    saveWorkout(db, workout);

    expect(loadWorkout(db, workout.workoutId)).toEqual(workout);
    expect(listWorkouts(db)).toEqual([workout]);
    expect(db.select().from(workouts).all()).toHaveLength(1);
  });

  it('keeps a single active draft, separate from saved Workouts (ADR 0038)', () => {
    const db = createDatabase();
    saveWorkout(db, workout);

    saveActiveWorkout(db, {
      sessionId: workout.workoutId,
      details: '{"draft":1}',
      updatedAt: '2026-10-12T18:30:00+02:00',
    });
    saveActiveWorkout(db, {
      sessionId: '0193a1b2-c3d4-7e5f-89ab-cdef01234571',
      details: '{"draft":2}',
      updatedAt: '2026-10-12T18:31:00+02:00',
    });

    expect(loadActiveWorkout(db)?.details).toBe('{"draft":2}');
    expect(db.select().from(activeWorkout).all()).toHaveLength(1);
    expect(listWorkouts(db)).toHaveLength(1);

    clearActiveWorkout(db);
    expect(loadActiveWorkout(db)).toBeNull();
  });
});

describe('durable outbox (issue #39)', () => {
  it('survives a restart and keeps failed items queued', () => {
    const db = createDatabase();
    enqueuePersistedOutbox(db, {
      id: workout.workoutId,
      kind: 'workout-upload',
      payload: JSON.stringify(workout),
      createdAt: '2026-10-12T19:40:00+02:00',
    });
    failPersistedOutbox(db, workout.workoutId, 'watch offline');

    // New store instance over the same database: persistence, not process state.
    const pending = pendingPersistedOutbox(db, 'workout-upload');
    expect(pending).toHaveLength(1);
    expect(pending[0]?.attempts).toBe(1);
    expect(pending[0]?.lastError).toBe('watch offline');
  });

  it('removes only after an ack and dedupes re-enqueues', () => {
    const db = createDatabase();
    enqueuePersistedOutbox(db, {
      id: workout.workoutId,
      kind: 'workout-upload',
      payload: JSON.stringify(workout),
    });
    expect(pendingPersistedOutboxCount(db)).toBe(1);

    const store = createOutboxStore(db);
    expect(store.get(workout.workoutId)?.attempts).toBe(0);

    ackPersistedOutbox(db, workout.workoutId);
    expect(pendingPersistedOutboxCount(db)).toBe(0);
    expect(db.select().from(outbox).all()).toHaveLength(0);
  });
});
