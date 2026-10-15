import { describe, expect, it } from 'vitest';
import {
  ExerciseItemSchema,
  ItemSchema,
  ModuleSchema,
  SupersetItemSchema,
  SupersetMemberSchema,
} from './module.js';
import { makeUuidV7 } from './testing.js';

const exerciseId = makeUuidV7();
const otherExerciseId = makeUuidV7();

const exerciseItem = {
  kind: 'exercise',
  exerciseId,
  sets: [{ mode: 'reps', targetReps: 8, weightKg: 60, restSeconds: 90 }],
} as const;

const supersetItem = {
  kind: 'superset',
  members: [
    { exerciseId, set: { mode: 'reps', targetReps: 12, weightKg: null } },
    { exerciseId: otherExerciseId, set: { mode: 'time', targetSeconds: 40, weightKg: 5 } },
  ],
  rounds: 3,
  restSeconds: 120,
} as const;

describe('ItemSchema (issue #9)', () => {
  it('parses an exercise item', () => {
    expect(ItemSchema.parse(exerciseItem)).toEqual(exerciseItem);
  });

  it('parses a superset item', () => {
    expect(ItemSchema.parse(supersetItem)).toEqual(supersetItem);
  });

  it('rejects an unknown item kind', () => {
    expect(ItemSchema.safeParse({ ...exerciseItem, kind: 'circuit' }).success).toBe(false);
  });

  it('allows the same Exercise twice — items are matched by position (ADR 0040)', () => {
    const items = [exerciseItem, { ...exerciseItem, sets: exerciseItem.sets.slice() }];
    const parsed = items.map((item) => ExerciseItemSchema.parse(item));
    expect(parsed).toHaveLength(2);
    expect(parsed[0]?.exerciseId).toBe(parsed[1]?.exerciseId);
  });

  it('keeps mixed items in authored order', () => {
    const items = ItemSchema.array().parse([supersetItem, exerciseItem, supersetItem]);
    expect(items.map((item) => item.kind)).toEqual(['superset', 'exercise', 'superset']);
  });

  it('rejects an exercise item with no sets', () => {
    expect(ExerciseItemSchema.safeParse({ ...exerciseItem, sets: [] }).success).toBe(false);
  });
});

describe('SupersetItemSchema (issue #9, ADR 0040)', () => {
  it('rejects a single-member superset — a chain needs at least two members', () => {
    const oneMember = { ...supersetItem, members: supersetItem.members.slice(0, 1) };
    expect(SupersetItemSchema.safeParse(oneMember).success).toBe(false);
  });

  it('rejects a non-positive round count', () => {
    expect(SupersetItemSchema.safeParse({ ...supersetItem, rounds: 0 }).success).toBe(false);
  });

  it('represents "no rest" as null on the chain', () => {
    const parsed = SupersetItemSchema.parse({ ...supersetItem, restSeconds: null });
    expect(parsed.restSeconds).toBeNull();
  });

  it('rejects a member whose Set template carries rest', () => {
    const member = {
      exerciseId,
      set: { mode: 'reps', targetReps: 12, weightKg: null, restSeconds: 30 },
    };
    expect(SupersetMemberSchema.safeParse(member).success).toBe(false);
  });
});

describe('ModuleSchema (issue #9)', () => {
  it('parses a module with kind, enabled flag, and ordered items', () => {
    const module = { kind: 'core', enabled: true, items: [exerciseItem, supersetItem] };
    const parsed = ModuleSchema.parse(module);
    expect(parsed.kind).toBe('core');
    expect(parsed.items.map((item) => item.kind)).toEqual(['exercise', 'superset']);
  });

  it('parses an enabled module with no items — the startability rule is behavioral', () => {
    expect(ModuleSchema.parse({ kind: 'warmup', enabled: true, items: [] }).items).toEqual([]);
  });

  it('rejects an unknown module kind', () => {
    expect(ModuleSchema.safeParse({ kind: 'cooldown', enabled: false, items: [] }).success).toBe(
      false,
    );
  });
});
