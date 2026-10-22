import type { Exercise, Plan, Workout } from '@spotter/domain';
import { SCHEMA_VERSION } from '@spotter/domain';
import { describe, expect, it, vi } from 'vitest';
import {
  buildPlanExport,
  CSV_HEADER,
  commitPlanImport,
  commitWorkoutsImport,
  exportWorkoutsCsv,
  parseCsv,
  preparePlanImport,
  prepareWorkoutsCsvImport,
  SchemaVersionError,
  serializePlanExport,
} from './interop';

const EX_A = '0193a1b2-c3d4-7e5f-89ab-cdef01234567';
const EX_B = '0193a1b2-c3d4-7e5f-89ab-cdef01234568';
const EX_C = '0193a1b2-c3d4-7e5f-89ab-cdef01234569';
const EX_NEW = '0193a1b2-c3d4-7e5f-89ab-cdef0123456b';
const EX_UNKNOWN = '0193a1b2-c3d4-7e5f-89ab-cdef0123456a';
const PLAN_ID = '0193a1b2-c3d4-7e5f-89ab-cdef0123456c';
const ROUTINE_ID = '0193a1b2-c3d4-7e5f-89ab-cdef0123456d';

const exercise = (id: string, title: string, description = ''): Exercise => ({
  id,
  title,
  description,
  archived: false,
});

const plan = (ids: string[]): Plan => ({
  id: PLAN_ID,
  name: 'Hypertrophy',
  routines: [
    {
      id: ROUTINE_ID,
      name: 'Push',
      active: true,
      modules: [
        {
          kind: 'core',
          enabled: true,
          items: [
            {
              kind: 'exercise',
              exerciseId: ids[0] ?? EX_A,
              sets: [{ mode: 'reps', targetReps: 8, weightKg: 60, restSeconds: 90 }],
            },
            {
              kind: 'superset',
              rounds: 3,
              restSeconds: 60,
              members: [
                { exerciseId: ids[1] ?? EX_B, set: { mode: 'reps', targetReps: 12, weightKg: 20 } },
                {
                  exerciseId: ids[2] ?? EX_A,
                  set: { mode: 'time', targetSeconds: 30, weightKg: null },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
});

const workout: Workout = {
  workoutId: '0193a1b2-c3d4-7e5f-89ab-cdef01234570',
  planId: PLAN_ID,
  planName: 'Hypertrophy',
  routineId: ROUTINE_ID,
  routineName: 'Push',
  startedAt: '2026-10-12T18:30:00+02:00',
  endedAt: '2026-10-12T19:30:00+02:00',
  startedOn: 'phone',
  exercises: [
    {
      kind: 'exercise',
      exerciseId: EX_A,
      title: 'Bench Press',
      description: 'Comma, quote " and\nnewline',
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
  ],
};

describe('Plan JSON export (issue #48)', () => {
  it('round-trips a mixed Plan with embedded Exercises and no logs', () => {
    const data = buildPlanExport(plan([EX_A, EX_B]), [
      exercise(EX_A, 'Bench Press'),
      exercise(EX_B, 'Row'),
    ]);
    const text = serializePlanExport(data);

    expect(data.exercises.map((item) => item.id)).toEqual([EX_A, EX_B]);
    expect(text).not.toContain('workoutId');
    const preview = preparePlanImport(text, []);
    expect(preview.plan).toEqual(plan([EX_A, EX_B]));
  });
});

describe('Plan JSON import (issue #49)', () => {
  it('upserts by id and merges unknown ids by unique title', () => {
    const imported = buildPlanExport(plan([EX_A, EX_UNKNOWN, EX_NEW]), [
      exercise(EX_A, 'Bench Press', 'imported'),
      exercise(EX_UNKNOWN, '  row ', 'imported row'),
      exercise(EX_NEW, 'Squat'),
    ]);
    const library = [exercise(EX_A, 'Bench Press', 'local'), exercise(EX_C, 'Row', 'local row')];

    const preview = preparePlanImport(serializePlanExport(imported), library);
    const modes = preview.exerciseChanges.map((change) => change.mode);
    expect(modes).toEqual(['update', 'merge', 'create']);

    const supersetMembers = preview.plan.routines[0]?.modules[0]?.items[1];
    expect(supersetMembers?.kind === 'superset' && supersetMembers.members[0]?.exerciseId).toBe(
      EX_C,
    );

    const saveExercise = vi.fn();
    const savePlan = vi.fn();
    commitPlanImport(preview, saveExercise, savePlan);
    expect(saveExercise).toHaveBeenCalledTimes(2);
    expect(savePlan).toHaveBeenCalledOnce();
  });

  it('rejects a mismatched version without writing', () => {
    const text = JSON.stringify({
      schemaVersion: SCHEMA_VERSION + 1,
      plan: plan([EX_A]),
      exercises: [exercise(EX_A, 'Bench Press')],
    });
    expect(() => preparePlanImport(text, [])).toThrow(SchemaVersionError);
    expect(() => preparePlanImport(text, [])).toThrow(/expected 1, found 2/);
  });
});

describe('CSV export (issue #50)', () => {
  it('emits the exact header and RFC 4180 quoting', () => {
    const csv = exportWorkoutsCsv([workout]);
    const [header] = csv.split('\r\n');
    expect(header).toBe(CSV_HEADER.join(','));
    expect(csv).toContain('""');
    expect(parseCsv(csv)[1]).toHaveLength(CSV_HEADER.length);
  });

  it('round-trips full logs from details', () => {
    const preview = prepareWorkoutsCsvImport(exportWorkoutsCsv([workout]), []);
    expect(preview.accepted).toEqual([workout]);
  });
});

describe('CSV import (issues #51-#52)', () => {
  it('recomputes summaries, skips identical rows, and never overwrites', () => {
    const csv = exportWorkoutsCsv([workout]);
    const tampered = csv.replace(/,3600,1,1,480,/, ',999,99,99,999,');

    const recomputed = prepareWorkoutsCsvImport(tampered, []);
    expect(recomputed.accepted).toEqual([workout]);

    const same = prepareWorkoutsCsvImport(csv, [workout]);
    expect(same.accepted).toEqual([]);
    expect(same.skipped).toEqual([workout.workoutId]);

    const baseEntry = workout.exercises[0];
    if (baseEntry?.kind !== 'exercise') throw new Error('fixture must be an exercise');
    const changed: Workout = {
      ...workout,
      exercises: [
        {
          ...baseEntry,
          sets: baseEntry.sets.map((set) =>
            set.mode === 'reps' ? { ...set, actualReps: 5 } : set,
          ),
        },
      ],
    };
    const conflict = prepareWorkoutsCsvImport(exportWorkoutsCsv([changed]), [workout]);
    expect(conflict.conflicts).toHaveLength(1);
    expect(conflict.conflicts[0]?.existing).toEqual(workout);

    const save = vi.fn();
    expect(commitWorkoutsImport(conflict, save)).toBe(0);
    expect(save).not.toHaveBeenCalled();
  });

  it('rejects any other schemaVersion', () => {
    const csv = exportWorkoutsCsv([workout]).replace('\r\n1,', '\r\n7,');
    expect(() => prepareWorkoutsCsvImport(csv, [])).toThrow(SchemaVersionError);
  });
});
