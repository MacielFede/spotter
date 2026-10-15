import { z } from 'zod';
import { RestSecondsSchema, WeightKgSchema } from './primitives.js';

const RepsModeSchema = z.strictObject({
  mode: z.literal('reps'),
  targetReps: z.number().int().positive(),
});

const TimeModeSchema = z.strictObject({
  mode: z.literal('time'),
  targetSeconds: z.number().int().positive(),
});

/**
 * Standalone Set — lives in an exercise Item. Mode, target, and starting weight
 * are authored once and fixed; rest is optional (ADR 0002, ADR 0009, ADR 0014).
 */
export const SetSchema = z
  .discriminatedUnion('mode', [
    RepsModeSchema.extend({ weightKg: WeightKgSchema, restSeconds: RestSecondsSchema }),
    TimeModeSchema.extend({ weightKg: WeightKgSchema, restSeconds: RestSecondsSchema }),
  ])
  .meta({ id: 'Set', title: 'Set' });

/**
 * Superset member Set template. No rest: rest lives on the Superset and fires
 * after each round (ADR 0040). Strict, so a rest key is rejected outright.
 */
export const SupersetMemberSetSchema = z
  .discriminatedUnion('mode', [
    RepsModeSchema.extend({ weightKg: WeightKgSchema }),
    TimeModeSchema.extend({ weightKg: WeightKgSchema }),
  ])
  .meta({ id: 'SupersetMemberSet', title: 'SupersetMemberSet' });

export type Set = z.infer<typeof SetSchema>;
export type SupersetMemberSet = z.infer<typeof SupersetMemberSetSchema>;
