import { describe, expect, it } from 'vitest';
import { makeUuidV7 } from './testing.js';
import { WorkoutSchema } from './workout.js';

const startedAt = '2026-10-12T18:30:00+02:00';
const endedAt = '2026-10-12T19:35:00+02:00';
const exerciseId = makeUuidV7();
const otherExerciseId = makeUuidV7();

const header = {
  workoutId: makeUuidV7(),
  planId: makeUuidV7(),
  planName: 'Hypertrophy',
  routineId: makeUuidV7(),
  routineName: 'Push Day A',
  startedAt,
  endedAt,
  startedOn: 'phone',
} as const;

const finishedSet = {
  mode: 'reps',
  targetReps: 8,
  weightKg: 60,
  restSeconds: 90,
  actualReps: 8,
  actualWeightKg: 60,
};

const skippedSet = {
  mode: 'reps',
  targetReps: 8,
  weightKg: 60,
  restSeconds: 90,
  actualReps: null,
  actualWeightKg: null,
};

const exerciseEntry = {
  kind: 'exercise',
  exerciseId,
  title: 'Bench Press',
  description: 'Bar to chest, https://example.com/bench',
  module: 'core',
  rounds: 1,
  sets: [finishedSet, skippedSet],
};

const supersetEntry = {
  kind: 'superset',
  module: 'core',
  rounds: 2,
  restSeconds: 120,
  members: [
    {
      exerciseId,
      title: 'Bench Press',
      description: '',
      set: { mode: 'reps', targetReps: 12, weightKg: 40 },
      actuals: [
        { mode: 'reps', actualReps: 12, actualWeightKg: 40 },
        { mode: 'reps', actualReps: null, actualWeightKg: null },
      ],
    },
    {
      exerciseId: otherExerciseId,
      title: 'Row',
      description: '',
      set: { mode: 'time', targetSeconds: 40, weightKg: null },
      actuals: [
        { mode: 'time', actualSeconds: 40, actualWeightKg: null },
        { mode: 'time', actualSeconds: 35, actualWeightKg: null },
      ],
    },
  ],
};

const workout = { ...header, exercises: [exerciseEntry, supersetEntry] };

describe('WorkoutSchema (issue #11)', () => {
  it('parses a full workout snapshot', () => {
    expect(WorkoutSchema.parse(workout)).toEqual(workout);
  });

  it('parses independent of any Plan or Routine — dead id + name snapshots only (ADR 0035)', () => {
    const orphan = {
      ...header,
      planId: makeUuidV7(),
      planName: 'Long-deleted plan',
      routineId: makeUuidV7(),
      routineName: 'Long-deleted routine',
      exercises: [],
    };
    expect(WorkoutSchema.parse(orphan).routineName).toBe('Long-deleted routine');
  });

  it('stores null actuals for never-completed sets (ADR 0039)', () => {
    const parsed = WorkoutSchema.parse(workout);
    const entry = parsed.exercises[0];
    if (entry?.kind !== 'exercise') throw new Error('expected exercise entry');
    const set = entry.sets[1];
    if (set?.mode !== 'reps') throw new Error('expected reps set');
    expect(set.actualReps).toBeNull();
    expect(set.actualWeightKg).toBeNull();
  });

  it('supports session-added structure absent from any template (ADR 0020)', () => {
    const adHoc = {
      ...workout,
      exercises: [
        {
          kind: 'exercise',
          exerciseId: makeUuidV7(),
          title: 'Made-up mid-session exercise',
          description: '',
          module: 'core',
          rounds: 1,
          sets: [
            {
              mode: 'time',
              targetSeconds: 30,
              weightKg: null,
              restSeconds: null,
              actualSeconds: 30,
              actualWeightKg: null,
            },
          ],
        },
      ],
    };
    expect(WorkoutSchema.parse(adHoc).exercises).toHaveLength(1);
  });

  it('rejects timestamps without a UTC offset (ADR 0039)', () => {
    expect(WorkoutSchema.safeParse({ ...workout, startedAt: '2026-10-12T18:30:00' }).success).toBe(
      false,
    );
  });

  it('rejects an unknown startedOn label (ADR 0039)', () => {
    expect(WorkoutSchema.safeParse({ ...workout, startedOn: 'tablet' }).success).toBe(false);
  });

  it('rejects a non-v7 workoutId (ADR 0039)', () => {
    expect(
      WorkoutSchema.safeParse({ ...workout, workoutId: '9c8b7a6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d' })
        .success,
    ).toBe(false);
  });

  it('rejects an unknown key', () => {
    expect(WorkoutSchema.safeParse({ ...workout, rpe: 9 }).success).toBe(false);
  });
});

describe('Workout entries (issue #11)', () => {
  it('rejects rounds != 1 on an exercise entry (ADR 0027)', () => {
    expect(
      WorkoutSchema.safeParse({ ...workout, exercises: [{ ...exerciseEntry, rounds: 2 }] }).success,
    ).toBe(false);
  });

  it('rejects a superset member whose actuals do not cover every round', () => {
    const [firstMember, secondMember] = supersetEntry.members;
    if (!firstMember || !secondMember) throw new Error('fixture must have two members');
    const withGap = {
      ...workout,
      exercises: [
        {
          ...supersetEntry,
          members: [{ ...firstMember, actuals: firstMember.actuals.slice(0, 1) }, secondMember],
        },
      ],
    };
    expect(WorkoutSchema.safeParse(withGap).success).toBe(false);
  });

  it('rejects an actual whose mode does not match the member template mode', () => {
    const [firstMember, secondMember] = supersetEntry.members;
    if (!firstMember || !secondMember) throw new Error('fixture must have two members');
    const mismatch = {
      ...workout,
      exercises: [
        {
          ...supersetEntry,
          members: [
            {
              ...firstMember,
              actuals: [
                { mode: 'time', actualSeconds: 12, actualWeightKg: null },
                { mode: 'reps', actualReps: 12, actualWeightKg: 40 },
              ],
            },
            secondMember,
          ],
        },
      ],
    };
    expect(WorkoutSchema.safeParse(mismatch).success).toBe(false);
  });

  it('rejects an exercise entry with no sets', () => {
    expect(
      WorkoutSchema.safeParse({ ...workout, exercises: [{ ...exerciseEntry, sets: [] }] }).success,
    ).toBe(false);
  });

  it('rejects a superset entry with one member', () => {
    const oneMember = { ...supersetEntry, members: [supersetEntry.members[0]] };
    expect(WorkoutSchema.safeParse({ ...workout, exercises: [oneMember] }).success).toBe(false);
  });
});
