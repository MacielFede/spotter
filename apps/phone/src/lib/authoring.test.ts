import type { Plan } from '@spotter/domain';
import { describe, expect, it } from 'vitest';
import {
  duplicatePlan,
  emptyRoutine,
  isRoutineStartable,
  move,
  normalizeModules,
} from './authoring';

const routine = emptyRoutine('0193a1b2-c3d4-7e5f-89ab-cdef01234569', 'Push');

describe('authoring helpers', () => {
  it('creates all four module slots disabled and empty', () => {
    expect(routine.modules.map((module) => module.kind)).toEqual([
      'warmup',
      'stretching',
      'core',
      'cardio',
    ]);
    expect(routine.modules.every((module) => !module.enabled)).toBe(true);
  });

  it('duplicates a Plan with fresh ids and independent authored content', () => {
    const source: Plan = {
      id: '0193a1b2-c3d4-7e5f-89ab-cdef01234567',
      name: 'Strength',
      routines: [
        {
          id: '0193a1b2-c3d4-7e5f-89ab-cdef01234568',
          name: 'Push',
          active: true,
          modules: [
            {
              kind: 'warmup',
              enabled: true,
              items: [
                {
                  kind: 'exercise',
                  exerciseId: '0193a1b2-c3d4-7e5f-89ab-cdef01234569',
                  sets: [{ mode: 'reps', targetReps: 8, weightKg: 20, restSeconds: 60 }],
                },
              ],
            },
            {
              kind: 'core',
              enabled: true,
              items: [
                {
                  kind: 'superset',
                  rounds: 3,
                  restSeconds: 30,
                  members: [
                    {
                      exerciseId: '0193a1b2-c3d4-7e5f-89ab-cdef01234569',
                      set: { mode: 'reps', targetReps: 10, weightKg: null },
                    },
                    {
                      exerciseId: '0193a1b2-c3d4-7e5f-89ab-cdef0123456a',
                      set: { mode: 'time', targetSeconds: 30, weightKg: null },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
    const generatedIds = [
      '0193a1b2-c3d4-7e5f-89ab-cdef0123456b',
      '0193a1b2-c3d4-7e5f-89ab-cdef0123456c',
    ];

    const copy = duplicatePlan(source, () => {
      const id = generatedIds.shift();
      if (!id) throw new Error('duplicatePlan requested too many ids');
      return id;
    });

    expect(copy).toEqual({
      ...source,
      id: '0193a1b2-c3d4-7e5f-89ab-cdef0123456b',
      name: 'Copy of Strength',
      routines: [
        {
          ...source.routines[0],
          id: '0193a1b2-c3d4-7e5f-89ab-cdef0123456c',
        },
      ],
    });
    expect(generatedIds).toEqual([]);
    expect(copy.routines[0]).not.toBe(source.routines[0]);
    expect(copy.routines[0]?.modules).not.toBe(source.routines[0]?.modules);
    expect(copy.routines[0]?.modules[0]?.items[0]).not.toBe(
      source.routines[0]?.modules[0]?.items[0],
    );
    const sourceExerciseItem = source.routines[0]?.modules[0]?.items[0];
    const copyExerciseItem = copy.routines[0]?.modules[0]?.items[0];
    expect(copyExerciseItem).not.toBe(sourceExerciseItem);
    if (copyExerciseItem?.kind === 'exercise' && sourceExerciseItem?.kind === 'exercise') {
      expect(copyExerciseItem.sets).not.toBe(sourceExerciseItem.sets);
      expect(copyExerciseItem.sets[0]).not.toBe(sourceExerciseItem.sets[0]);
    }

    const sourceSuperset = source.routines[0]?.modules[1]?.items[0];
    const copySuperset = copy.routines[0]?.modules[1]?.items[0];
    expect(copySuperset).not.toBe(sourceSuperset);
    if (copySuperset?.kind === 'superset' && sourceSuperset?.kind === 'superset') {
      expect(copySuperset.members).not.toBe(sourceSuperset.members);
      expect(copySuperset.members[0]).not.toBe(sourceSuperset.members[0]);
      expect(copySuperset.members[0]?.set).not.toBe(sourceSuperset.members[0]?.set);
    }
  });

  it('moves list entries without mutating the source', () => {
    expect(move([1, 2, 3], 0, 2)).toEqual([2, 3, 1]);
    expect(move([1, 2, 3], 2, 0)).toEqual([3, 1, 2]);
    expect(move([1, 2, 3], 0, 0)).toEqual([1, 2, 3]);
  });

  it('re-adds a missing fixed module kind', () => {
    const modules = normalizeModules([{ kind: 'core', enabled: true, items: [] }]);
    expect(modules.map((module) => module.kind)).toEqual([
      'core',
      'warmup',
      'stretching',
      'cardio',
    ]);
  });

  it('requires active, enabled, non-empty to be startable', () => {
    expect(isRoutineStartable(routine)).toBe(false);
    const content = {
      ...routine,
      active: true,
      modules: [
        {
          kind: 'core' as const,
          enabled: true,
          items: [
            {
              kind: 'exercise' as const,
              exerciseId: '0193a1b2-c3d4-7e5f-89ab-cdef01234567',
              sets: [{ mode: 'reps' as const, targetReps: 8, weightKg: null, restSeconds: null }],
            },
          ],
        },
      ],
    };
    expect(isRoutineStartable(content)).toBe(true);
    expect(isRoutineStartable({ ...content, active: false })).toBe(false);
  });
});
