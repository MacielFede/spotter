import { z } from 'zod';
import { UuidV7Schema } from './id.js';
import { SetSchema, SupersetMemberSetSchema } from './set.js';

/** The four fixed module kinds — at most one of each per Routine (ADR 0040). */
export const ModuleKindSchema = z.enum(['warmup', 'stretching', 'core', 'cardio']);

export type ModuleKind = z.infer<typeof ModuleKindSchema>;

/** A Superset member: an Exercise reference plus its one Set template (ADR 0040). */
export const SupersetMemberSchema = z.strictObject({
  exerciseId: UuidV7Schema,
  set: SupersetMemberSetSchema,
});

export type SupersetMember = z.infer<typeof SupersetMemberSchema>;

/**
 * Superset item: an ordered chain of member Exercises performed back-to-back,
 * repeated for `rounds` rounds. Rest lives here and fires after each round;
 * member Sets carry no rest (ADR 0040).
 */
export const SupersetItemSchema = z.strictObject({
  kind: z.literal('superset'),
  members: z.array(SupersetMemberSchema).min(2),
  rounds: z.number().int().positive(),
  restSeconds: z.number().int().nonnegative().nullable(),
});

/** Exercise item: an Exercise reference plus its ordered standalone Sets (ADR 0003). */
export const ExerciseItemSchema = z.strictObject({
  kind: z.literal('exercise'),
  exerciseId: UuidV7Schema,
  sets: z.array(SetSchema).min(1),
});

export const ItemSchema = z.discriminatedUnion('kind', [ExerciseItemSchema, SupersetItemSchema]);

export type Item = z.infer<typeof ItemSchema>;
export type ExerciseItem = z.infer<typeof ExerciseItemSchema>;
export type SupersetItem = z.infer<typeof SupersetItemSchema>;

/** A module: one of the four fixed kinds, enabled/disabled, holding ordered Items (ADR 0040). */
export const ModuleSchema = z.strictObject({
  kind: ModuleKindSchema,
  enabled: z.boolean(),
  items: z.array(ItemSchema),
});

export type Module = z.infer<typeof ModuleSchema>;
