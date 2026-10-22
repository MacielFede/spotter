import { describe, expect, it } from 'vitest';
import { emptyRoutine, isRoutineStartable, move, normalizeModules } from './authoring';

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
