import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Exercise, Plan, Routine, Workout } from '@spotter/domain';
import { describe, expect, it } from 'vitest';
import {
  buildWorkoutDraft,
  isoWithOffset,
  prefillFromHistory,
  workoutDurationMinutes,
  workoutSetCount,
  workoutVolumeKg,
} from './workout';

const EX_A = '0193a1b2-c3d4-7e5f-89ab-cdef01234567';
const EX_B = '0193a1b2-c3d4-7e5f-89ab-cdef01234568';
const PLAN_ID = '0193a1b2-c3d4-7e5f-89ab-cdef01234569';
const ROUTINE_ID = '0193a1b2-c3d4-7e5f-89ab-cdef0123456a';

const plan: Plan = { id: PLAN_ID, name: 'Hypertrophy', routines: [] };

const routine: Routine = {
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
          exerciseId: EX_A,
          sets: [{ mode: 'reps', targetReps: 8, weightKg: 60, restSeconds: 90 }],
        },
        {
          kind: 'exercise',
          exerciseId: EX_A,
          sets: [{ mode: 'time', targetSeconds: 30, weightKg: null, restSeconds: null }],
        },
        {
          kind: 'superset',
          rounds: 2,
          restSeconds: 60,
          members: [
            { exerciseId: EX_B, set: { mode: 'reps', targetReps: 12, weightKg: 20 } },
            { exerciseId: EX_A, set: { mode: 'reps', targetReps: 10, weightKg: 40 } },
          ],
        },
      ],
    },
    { kind: 'cardio', enabled: false, items: [] },
  ],
};

const exercises: Record<string, Exercise> = {
  [EX_A]: { id: EX_A, title: 'Bench Press', description: 'Bar to chest.', archived: false },
  [EX_B]: { id: EX_B, title: 'Row', description: '', archived: false },
};

const base = {
  plan,
  routine,
  exercises,
  workoutId: '0193a1b2-c3d4-7e5f-89ab-cdef01234570',
  startedAt: '2026-10-12T18:30:00+02:00',
};

describe('workout draft and prefill (issues #32, #34)', () => {
  it('snapshots enabled modules with null actuals and template weights', () => {
    const draft = buildWorkoutDraft({ ...base, history: [] });

    expect(draft.exercises).toHaveLength(3);
    expect(draft.exercises[0]).toMatchObject({
      kind: 'exercise',
      title: 'Bench Press',
      description: 'Bar to chest.',
      sets: [{ mode: 'reps', weightKg: 60, actualReps: null, actualWeightKg: null }],
    });
    const superset = draft.exercises[2];
    expect(superset?.kind).toBe('superset');
    if (superset?.kind === 'superset') {
      expect(superset.members[0]?.actuals).toHaveLength(2);
    }
  });

  it('uses template values for a first-ever workout', () => {
    const draft = buildWorkoutDraft({ ...base, history: [] });
    const first = draft.exercises[0];
    const firstSet = first?.kind === 'exercise' ? first.sets[0] : undefined;
    expect(firstSet?.mode === 'reps' ? firstSet.actualReps : null).toBeNull();
  });

  it('prefills from the previous Workout of the same Routine by position', () => {
    const previous: Workout = buildWorkoutDraft({ ...base, history: [] });
    const withActuals: Workout = {
      ...previous,
      exercises: previous.exercises.map((entry, index) => {
        if (entry.kind !== 'exercise') return entry;
        const actual = index === 0 ? 8 : 25;
        return {
          ...entry,
          sets: entry.sets.map((set) =>
            set.mode === 'reps'
              ? { ...set, actualReps: actual, actualWeightKg: 55 }
              : { ...set, actualSeconds: actual, actualWeightKg: 55 },
          ),
        };
      }),
    };

    const draft = prefillFromHistory(buildWorkoutDraft({ ...base, history: [] }), [withActuals]);

    const first = draft.exercises[0];
    const second = draft.exercises[1];
    const firstSet = first?.kind === 'exercise' ? first.sets[0] : undefined;
    const secondSet = second?.kind === 'exercise' ? second.sets[0] : undefined;
    expect(firstSet?.mode === 'reps' ? firstSet.actualReps : null).toBe(8);
    expect(secondSet?.mode === 'time' ? secondSet.actualSeconds : null).toBe(25);
  });

  it("falls back to the Exercise's last actuals anywhere", () => {
    const otherRoutine: Workout = {
      ...buildWorkoutDraft({ ...base, history: [] }),
      workoutId: '0193a1b2-c3d4-7e5f-89ab-cdef01234571',
      routineId: '0193a1b2-c3d4-7e5f-89ab-cdef0123456b',
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
              restSeconds: null,
              actualReps: 6,
              actualWeightKg: 62.5,
            },
          ],
        },
      ],
    };

    const draft = prefillFromHistory(buildWorkoutDraft({ ...base, history: [] }), [otherRoutine]);
    const first = draft.exercises[0];
    const firstSet = first?.kind === 'exercise' ? first.sets[0] : undefined;
    expect(firstSet?.mode === 'reps' ? firstSet.actualReps : null).toBe(6);
    expect(firstSet?.actualWeightKg).toBe(62.5);
  });

  it('formats ISO timestamps with an explicit offset', () => {
    expect(isoWithOffset(new Date('2026-10-12T16:30:00Z'))).toMatch(
      /^2026-10-12T\d{2}:30:00[+-]\d{2}:\d{2}$/,
    );
  });
});

describe('workout summaries', () => {
  it('counts sets, volume, and duration', () => {
    const draft = buildWorkoutDraft({ ...base, history: [] });
    const workout: Workout = {
      ...draft,
      endedAt: '2026-10-12T19:30:00+02:00',
      exercises: draft.exercises.map((entry) => {
        if (entry.kind !== 'exercise') return entry;
        return {
          ...entry,
          sets: entry.sets.map((set) =>
            set.mode === 'reps'
              ? { ...set, actualReps: 10, actualWeightKg: 50 }
              : { ...set, actualSeconds: 30, actualWeightKg: null },
          ),
        };
      }),
    };

    expect(workoutDurationMinutes(workout)).toBe(60);
    expect(workoutSetCount(workout)).toBe(6);
    expect(workoutVolumeKg(workout)).toBe(500);
  });
});

describe('shared summary fixture (issue #75)', () => {
  it('matches the committed expected summary values', () => {
    const fixture = JSON.parse(
      readFileSync(
        fileURLToPath(
          new URL('../../../../packages/domain/fixtures/summary.json', import.meta.url),
        ),
        'utf8',
      ),
    ) as {
      input: Workout;
      expected: {
        durationSeconds: number;
        exerciseCount: number;
        setCount: number;
        totalVolumeKg: number;
      };
    };

    expect(workoutDurationMinutes(fixture.input) * 60).toBe(fixture.expected.durationSeconds);
    expect(workoutSetCount(fixture.input)).toBe(fixture.expected.setCount);
    expect(workoutVolumeKg(fixture.input)).toBe(fixture.expected.totalVolumeKg);
    expect(
      fixture.input.exercises.reduce(
        (total, entry) => total + (entry.kind === 'exercise' ? 1 : entry.members.length),
        0,
      ),
    ).toBe(fixture.expected.exerciseCount);
  });
});
