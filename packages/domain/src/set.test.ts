import { describe, expect, it } from 'vitest';
import { SetSchema, SupersetMemberSetSchema } from './set.js';

const repsSet = { mode: 'reps', targetReps: 8, weightKg: null, restSeconds: null } as const;
const timeSet = { mode: 'time', targetSeconds: 60, weightKg: null, restSeconds: null } as const;

describe('SetSchema (standalone, issue #10)', () => {
  it('parses a reps-based set with no weight and no rest', () => {
    expect(SetSchema.parse(repsSet)).toEqual(repsSet);
  });

  it('parses a time-based set with no weight and no rest', () => {
    expect(SetSchema.parse(timeSet)).toEqual(timeSet);
  });

  it('parses a reps set with a starting weight', () => {
    expect(SetSchema.parse({ ...repsSet, weightKg: 60 }).weightKg).toBe(60);
  });

  it('parses a time set with a starting weight — weight is independent of mode', () => {
    expect(SetSchema.parse({ ...timeSet, weightKg: 20 }).weightKg).toBe(20);
  });

  it('parses rest after a set, fractional kg weights', () => {
    const parsed = SetSchema.parse({ ...repsSet, restSeconds: 90, weightKg: 62.5 });
    expect(parsed.restSeconds).toBe(90);
    expect(parsed.weightKg).toBe(62.5);
  });

  it('represents "no rest" as null', () => {
    expect(SetSchema.parse(repsSet).restSeconds).toBeNull();
  });

  it('parses every mode × weight × rest combination', () => {
    const targets = [
      { mode: 'reps', targetReps: 8 },
      { mode: 'time', targetSeconds: 60 },
    ] as const;
    for (const target of targets) {
      for (const weightKg of [60, null] as const) {
        for (const restSeconds of [90, null] as const) {
          const result = SetSchema.safeParse({ ...target, weightKg, restSeconds });
          expect({ ...target, weightKg, restSeconds, ok: result.success }).toEqual({
            ...target,
            weightKg,
            restSeconds,
            ok: true,
          });
        }
      }
    }
  });

  it('rejects a missing mode', () => {
    const { mode: _, ...withoutMode } = repsSet;
    expect(SetSchema.safeParse(withoutMode).success).toBe(false);
  });

  it('rejects an unknown mode', () => {
    expect(SetSchema.safeParse({ ...repsSet, mode: 'distance' }).success).toBe(false);
  });

  it('rejects a non-positive target', () => {
    expect(SetSchema.safeParse({ ...repsSet, targetReps: 0 }).success).toBe(false);
    expect(SetSchema.safeParse({ ...timeSet, targetSeconds: 0 }).success).toBe(false);
  });

  it('rejects fractional or negative reps and durations in seconds', () => {
    expect(SetSchema.safeParse({ ...repsSet, targetReps: 8.5 }).success).toBe(false);
    expect(SetSchema.safeParse({ ...timeSet, targetSeconds: -1 }).success).toBe(false);
  });

  it('rejects a negative weight', () => {
    expect(SetSchema.safeParse({ ...repsSet, weightKg: -5 }).success).toBe(false);
  });
});

describe('SupersetMemberSetSchema (issue #10, ADR 0040)', () => {
  it('parses a member template without rest', () => {
    const member = { mode: 'reps', targetReps: 10, weightKg: 30 };
    expect(SupersetMemberSetSchema.parse(member)).toEqual(member);
  });

  it('parses a time-based member template with a nullable weight', () => {
    const member = { mode: 'time', targetSeconds: 45, weightKg: null };
    expect(SupersetMemberSetSchema.parse(member)).toEqual(member);
  });

  it('rejects a member template carrying rest — rest lives on the Superset', () => {
    const member = { mode: 'reps', targetReps: 10, weightKg: 30, restSeconds: 60 };
    expect(SupersetMemberSetSchema.safeParse(member).success).toBe(false);
  });

  it('rejects restSeconds: null on a member — no rest key at all', () => {
    const member = { mode: 'reps', targetReps: 10, weightKg: 30, restSeconds: null };
    expect(SupersetMemberSetSchema.safeParse(member).success).toBe(false);
  });
});
