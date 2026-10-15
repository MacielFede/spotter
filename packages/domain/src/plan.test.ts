import { describe, expect, it } from 'vitest';
import { PlanSchema, RoutineSchema } from './plan.js';
import { makeUuidV7 } from './testing.js';

const coreModule = {
  kind: 'core',
  enabled: true,
  items: [
    {
      kind: 'exercise',
      exerciseId: makeUuidV7(),
      sets: [{ mode: 'reps', targetReps: 8, weightKg: 60, restSeconds: 90 }],
    },
  ],
} as const;

const routine = {
  id: makeUuidV7(),
  name: 'Push Day A',
  active: true,
  modules: [coreModule],
} as const;

describe('RoutineSchema (issue #8)', () => {
  it('parses a valid routine', () => {
    expect(RoutineSchema.parse(routine)).toEqual(routine);
  });

  it('parses an inactive routine — the flag is scoped per Plan (ADR 0010)', () => {
    expect(RoutineSchema.parse({ ...routine, active: false }).active).toBe(false);
  });

  it('parses all four module kinds at once, in order (ADR 0040)', () => {
    const kinds = ['warmup', 'stretching', 'core', 'cardio'] as const;
    const modules = kinds.map((kind) => ({ kind, enabled: true, items: [] }));
    const parsed = RoutineSchema.parse({ ...routine, modules });
    expect(parsed.modules.map((module) => module.kind)).toEqual(kinds);
  });

  it('preserves module ordering — array order is display order', () => {
    const modules = [
      { kind: 'cardio', enabled: true, items: [] },
      { kind: 'warmup', enabled: false, items: [] },
    ];
    expect(RoutineSchema.parse({ ...routine, modules }).modules.map((m) => m.kind)).toEqual([
      'cardio',
      'warmup',
    ]);
  });

  it('rejects two modules of the same kind — at most one per fixed kind (ADR 0040)', () => {
    const modules = [
      { kind: 'core', enabled: true, items: [] },
      { kind: 'core', enabled: false, items: [] },
    ];
    expect(RoutineSchema.safeParse({ ...routine, modules }).success).toBe(false);
  });

  it('rejects a blank name', () => {
    expect(RoutineSchema.safeParse({ ...routine, name: '   ' }).success).toBe(false);
  });

  it('rejects a non-uuidv7 id — stable ids are required for import/export', () => {
    expect(
      RoutineSchema.safeParse({ ...routine, id: '9c8b7a6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d' }).success,
    ).toBe(false);
  });

  it('rejects an unknown key', () => {
    expect(RoutineSchema.safeParse({ ...routine, planId: makeUuidV7() }).success).toBe(false);
  });
});

describe('PlanSchema (issue #8)', () => {
  it('parses a plan owning its routines', () => {
    const plan = { id: makeUuidV7(), name: 'Hypertrophy', routines: [routine] };
    expect(PlanSchema.parse(plan)).toEqual(plan);
  });

  it('parses a plan with many active routines at once (ADR 0010)', () => {
    const routines = [
      { ...routine, id: makeUuidV7(), name: 'Push Day A' },
      { ...routine, id: makeUuidV7(), name: 'Pull Day A' },
    ];
    expect(PlanSchema.parse({ id: makeUuidV7(), name: 'PPL', routines }).routines).toHaveLength(2);
  });

  it('parses a plan with no routines', () => {
    expect(PlanSchema.parse({ id: makeUuidV7(), name: 'Empty', routines: [] }).routines).toEqual(
      [],
    );
  });

  it('rejects a blank plan name', () => {
    expect(PlanSchema.safeParse({ id: makeUuidV7(), name: '', routines: [] }).success).toBe(false);
  });
});
