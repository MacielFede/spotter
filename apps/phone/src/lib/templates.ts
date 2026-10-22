import type { Exercise, Plan, Workout } from '@spotter/domain';
import { buildPlanExport, exportWorkoutsCsv, serializePlanExport } from './interop';

const EX_BENCH = '0193a1b2-c3d4-7e5f-89ab-cdef01234567';
const EX_ROW = '0193a1b2-c3d4-7e5f-89ab-cdef01234568';
const PLAN_ID = '0193a1b2-c3d4-7e5f-89ab-cdef01234569';
const ROUTINE_ID = '0193a1b2-c3d4-7e5f-89ab-cdef0123456a';

const exercises: Exercise[] = [
  {
    id: EX_BENCH,
    title: 'Bench Press',
    description: 'Bar to chest. Example form: https://example.com/bench',
    archived: false,
  },
  { id: EX_ROW, title: 'Row', description: '', archived: false },
];

const plan: Plan = {
  id: PLAN_ID,
  name: 'Template Plan',
  routines: [
    {
      id: ROUTINE_ID,
      name: 'Template Routine',
      active: true,
      modules: [
        { kind: 'warmup', enabled: false, items: [] },
        {
          kind: 'core',
          enabled: true,
          items: [
            {
              kind: 'exercise',
              exerciseId: EX_BENCH,
              sets: [{ mode: 'reps', targetReps: 8, weightKg: 60, restSeconds: 90 }],
            },
            {
              kind: 'superset',
              rounds: 2,
              restSeconds: 60,
              members: [
                { exerciseId: EX_ROW, set: { mode: 'reps', targetReps: 12, weightKg: 20 } },
                { exerciseId: EX_BENCH, set: { mode: 'time', targetSeconds: 30, weightKg: null } },
              ],
            },
          ],
        },
        { kind: 'stretching', enabled: false, items: [] },
        { kind: 'cardio', enabled: false, items: [] },
      ],
    },
  ],
};

const workout: Workout = {
  workoutId: '0193a1b2-c3d4-7e5f-89ab-cdef0123456b',
  planId: PLAN_ID,
  planName: 'Template Plan',
  routineId: ROUTINE_ID,
  routineName: 'Template Routine',
  startedAt: '2026-10-12T18:30:00+02:00',
  endedAt: '2026-10-12T19:30:00+02:00',
  startedOn: 'phone',
  exercises: [
    {
      kind: 'exercise',
      exerciseId: EX_BENCH,
      title: 'Bench Press',
      description: 'Bar to chest. Example form: https://example.com/bench',
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

/** Canonical Plan JSON template, always at the current schema version (ADR 0026, issue #54). */
export const PLAN_TEMPLATE = serializePlanExport(buildPlanExport(plan, exercises));

/** Canonical log CSV template, always at the current schema version (ADR 0027, issue #54). */
export const LOGS_TEMPLATE = `${exportWorkoutsCsv([workout])}\r\n`;

export const TEMPLATES: Record<string, string> = {
  'plan.template.json': PLAN_TEMPLATE,
  'logs.template.csv': LOGS_TEMPLATE,
};
