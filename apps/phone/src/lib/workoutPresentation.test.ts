import type { Workout } from '@spotter/domain';
import { describe, expect, it } from 'vitest';
import {
  advanceWorkoutUnit,
  firstIncompleteUnit,
  isUnitComplete,
  nextIncompleteUnit,
  orderedWorkoutModules,
  removeSupersetMember,
  unitProgress,
  type WorkoutUnit,
  workoutUnits,
} from './workoutPresentation';

const finishUnit = (workout: Workout, unit: WorkoutUnit): Workout => {
  let current = workout;
  while (!isUnitComplete(current, unit)) current = advanceWorkoutUnit(current, unit);
  return current;
};

const EX_A = '0193a1b2-c3d4-7e5f-89ab-cdef01234567';
const EX_B = '0193a1b2-c3d4-7e5f-89ab-cdef01234568';

const workout: Workout = {
  workoutId: '0193a1b2-c3d4-7e5f-89ab-cdef01234570',
  planId: '0193a1b2-c3d4-7e5f-89ab-cdef01234569',
  planName: 'Plan',
  routineId: '0193a1b2-c3d4-7e5f-89ab-cdef0123456a',
  routineName: 'Routine',
  startedAt: '2026-10-12T18:30:00+02:00',
  endedAt: '2026-10-12T19:30:00+02:00',
  startedOn: 'phone',
  exercises: [
    {
      kind: 'exercise',
      exerciseId: EX_A,
      title: 'Warm-up',
      description: '',
      usesWeight: true,
      module: 'warmup',
      rounds: 1,
      sets: [
        {
          mode: 'reps',
          targetReps: 8,
          weightKg: 10,
          restSeconds: null,
          actualReps: 8,
          actualWeightKg: 10,
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
          exerciseId: EX_A,
          title: 'Press',
          description: '',
          usesWeight: true,
          set: { mode: 'reps', targetReps: 10, weightKg: 20 },
          actuals: [
            { mode: 'reps', actualReps: 10, actualWeightKg: 20 },
            { mode: 'reps', actualReps: null, actualWeightKg: null },
          ],
        },
        {
          exerciseId: EX_B,
          title: 'Row',
          description: '',
          usesWeight: false,
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

describe('workout presentation helpers', () => {
  it('preserves the module order from the snapshot', () => {
    expect(orderedWorkoutModules(workout)).toEqual(['warmup', 'core']);
  });

  it('treats each Superset member as its own unit, after standalone exercises', () => {
    expect(workoutUnits(workout)).toEqual([
      { entryIndex: 0, memberIndex: null },
      { entryIndex: 1, memberIndex: 0 },
      { entryIndex: 1, memberIndex: 1 },
    ]);
  });

  it('finds the first unfinished unit for initial focus', () => {
    expect(firstIncompleteUnit(workout)).toEqual({ entryIndex: 1, memberIndex: 0 });
  });

  it('finds the next unfinished unit after the given one, wrapping around', () => {
    expect(nextIncompleteUnit(workout, { entryIndex: 1, memberIndex: 0 })).toEqual({
      entryIndex: 1,
      memberIndex: 1,
    });
    expect(nextIncompleteUnit(workout, { entryIndex: 1, memberIndex: 1 })).toEqual({
      entryIndex: 1,
      memberIndex: 0,
    });

    const finished = finishUnit(finishUnit(workout, { entryIndex: 1, memberIndex: 0 }), {
      entryIndex: 1,
      memberIndex: 1,
    });
    expect(nextIncompleteUnit(finished, { entryIndex: 1, memberIndex: 1 })).toBeUndefined();
  });

  it('logs one set per step and only completes the exercise after its last set', () => {
    const exercise = workout.exercises[0];
    if (exercise?.kind !== 'exercise') throw new Error('expected an exercise');
    const threeSets = {
      ...workout,
      exercises: [
        {
          ...exercise,
          sets: [0, 1, 2].map(() => ({
            mode: 'reps' as const,
            targetReps: 8,
            weightKg: 10,
            restSeconds: null,
            actualReps: null,
            actualWeightKg: null,
          })),
        },
      ],
    };
    const unit = { entryIndex: 0, memberIndex: null };

    const first = advanceWorkoutUnit(threeSets, unit);
    expect(unitProgress(first, unit)).toEqual({ done: 1, total: 3 });
    expect(first.exercises[0]).toMatchObject({
      sets: [{ actualReps: 8 }, { actualReps: null }, { actualReps: null }],
    });
    expect(isUnitComplete(first, unit)).toBe(false);

    const second = advanceWorkoutUnit(first, unit);
    expect(unitProgress(second, unit)).toEqual({ done: 2, total: 3 });
    expect(isUnitComplete(second, unit)).toBe(false);

    const third = advanceWorkoutUnit(second, unit);
    expect(isUnitComplete(third, unit)).toBe(true);
  });

  it('steps through a Superset member round by round, keeping its siblings untouched', () => {
    const superset = workout.exercises[1];
    if (superset?.kind !== 'superset') throw new Error('expected a Superset');
    const pending: Workout = {
      ...workout,
      exercises: [
        {
          ...superset,
          rounds: 3,
          members: [
            {
              ...superset.members[0],
              actuals: [0, 1, 2].map(() => ({
                mode: 'reps' as const,
                actualReps: null,
                actualWeightKg: null,
              })),
            },
            superset.members[1],
          ],
        },
      ],
    };
    const press = { entryIndex: 0, memberIndex: 0 };
    const row = { entryIndex: 0, memberIndex: 1 };

    const stepped = advanceWorkoutUnit(pending, press);
    expect(unitProgress(stepped, press)).toEqual({ done: 1, total: 3 });
    expect(unitProgress(stepped, row)).toEqual({ done: 1, total: 2 });
    expect(isUnitComplete(stepped, press)).toBe(false);
  });

  it('does not change a unit that is already fully logged', () => {
    expect(advanceWorkoutUnit(workout, { entryIndex: 0, memberIndex: null })).toEqual(workout);
    expect(isUnitComplete(workout, { entryIndex: 0, memberIndex: null })).toBe(true);
  });

  it('turns a remaining superset member into an exercise when removing the other member', () => {
    const superset = workout.exercises[1];
    if (superset?.kind !== 'superset') throw new Error('expected a Superset');
    const remaining = removeSupersetMember(superset, 0);

    expect(remaining.kind).toBe('exercise');
    if (remaining.kind !== 'exercise') return;
    expect(remaining.exerciseId).toBe(EX_B);
    expect(remaining.usesWeight).toBe(false);
    expect(remaining.sets).toHaveLength(2);
    expect(remaining.sets[1]?.mode === 'time' ? remaining.sets[1].actualSeconds : 0).toBeNull();
    expect(remaining.sets[0]?.restSeconds).toBe(60);
  });
});
