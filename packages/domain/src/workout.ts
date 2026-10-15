import { z } from 'zod';
import { UuidV7Schema } from './id.js';
import { ModuleKindSchema } from './module.js';
import { RestSecondsSchema, WeightKgSchema } from './primitives.js';
import { SupersetMemberSetSchema } from './set.js';

/** ISO 8601 timestamp with a UTC offset (ADR 0039). */
const IsoOffsetSchema = z.iso.datetime({ offset: true });

/** Logged standalone Set: template (mode/target/starting weight/rest) + nullable actuals (ADR 0039). */
export const LoggedSetSchema = z.discriminatedUnion('mode', [
  z.strictObject({
    mode: z.literal('reps'),
    targetReps: z.number().int().positive(),
    weightKg: WeightKgSchema,
    restSeconds: RestSecondsSchema,
    actualReps: z.number().int().nonnegative().nullable(),
    actualWeightKg: WeightKgSchema,
  }),
  z.strictObject({
    mode: z.literal('time'),
    targetSeconds: z.number().int().positive(),
    weightKg: WeightKgSchema,
    restSeconds: RestSecondsSchema,
    actualSeconds: z.number().int().nonnegative().nullable(),
    actualWeightKg: WeightKgSchema,
  }),
]);

/** Per-round actual for a Superset member, tagged with the template's mode (ADR 0039). */
export const SupersetMemberActualSchema = z.discriminatedUnion('mode', [
  z.strictObject({
    mode: z.literal('reps'),
    actualReps: z.number().int().nonnegative().nullable(),
    actualWeightKg: WeightKgSchema,
  }),
  z.strictObject({
    mode: z.literal('time'),
    actualSeconds: z.number().int().nonnegative().nullable(),
    actualWeightKg: WeightKgSchema,
  }),
]);

/**
 * Exercise snapshot — the display title/description plus the source Exercise
 * id, so logs survive renames, deletes, and Plan changes (ADR 0004, ADR 0035).
 */
export const ExerciseSnapshotSchema = z.strictObject({
  exerciseId: UuidV7Schema,
  title: z.string(),
  description: z.string(),
});

/** Member snapshot: the Exercise snapshot plus its one Set template and per-round actuals (ADR 0040). */
export const SupersetMemberSnapshotSchema = ExerciseSnapshotSchema.extend({
  set: SupersetMemberSetSchema,
  /** One actual per round; never-completed rounds store null (ADR 0039). */
  actuals: z.array(SupersetMemberActualSchema),
});

/**
 * Superset entry: an ordered chain of member Exercises, repeated for `rounds`
 * rounds — the round count lives on the chain, never on members, and rest
 * lives on the chain and fires after each round (ADR 0040).
 */
export const SupersetEntrySchema = z
  .strictObject({
    kind: z.literal('superset'),
    module: ModuleKindSchema,
    rounds: z.number().int().positive(),
    restSeconds: RestSecondsSchema,
    members: z.array(SupersetMemberSnapshotSchema).min(2),
  })
  .superRefine((entry, ctx) => {
    entry.members.forEach((member, index) => {
      if (member.actuals.length !== entry.rounds) {
        ctx.addIssue({
          code: 'custom',
          message: 'member actuals must cover exactly every round',
          path: ['members', index, 'actuals'],
        });
      }
      member.actuals.forEach((actual, round) => {
        if (actual.mode !== member.set.mode) {
          ctx.addIssue({
            code: 'custom',
            message: "actual mode must match the member's Set template mode",
            path: ['members', index, 'actuals', round, 'mode'],
          });
        }
      });
    });
  });

/** Exercise entry: an Exercise snapshot plus its logged Sets (ADR 0004, ADR 0035). */
export const ExerciseEntrySchema = ExerciseSnapshotSchema.extend({
  kind: z.literal('exercise'),
  module: ModuleKindSchema,
  rounds: z.literal(1),
  sets: z.array(LoggedSetSchema).min(1),
});

export const WorkoutEntrySchema = z.discriminatedUnion('kind', [
  ExerciseEntrySchema,
  SupersetEntrySchema,
]);

/**
 * Workout — an immutable snapshot of the structure it ran plus the actuals
 * recorded (ADR 0004, ADR 0039). References its source Plan and Routine by
 * snapshotted id + name — dead references, not live links (ADR 0035) — so it
 * parses independent of any Plan or Routine. This is the exact serialization
 * shape packed into the CSV `details` column (ADR 0027).
 */
export const WorkoutSchema = z.strictObject({
  workoutId: UuidV7Schema,
  planId: UuidV7Schema,
  planName: z.string(),
  routineId: UuidV7Schema,
  routineName: z.string(),
  startedAt: IsoOffsetSchema,
  endedAt: IsoOffsetSchema,
  /** Display label for history, not device identity (ADR 0039). */
  startedOn: z.enum(['phone', 'watch']),
  exercises: z.array(WorkoutEntrySchema),
});

export type LoggedSet = z.infer<typeof LoggedSetSchema>;
export type SupersetMemberActual = z.infer<typeof SupersetMemberActualSchema>;
export type ExerciseSnapshot = z.infer<typeof ExerciseSnapshotSchema>;
export type SupersetMemberSnapshot = z.infer<typeof SupersetMemberSnapshotSchema>;
export type WorkoutEntry = z.infer<typeof WorkoutEntrySchema>;
export type ExerciseEntry = z.infer<typeof ExerciseEntrySchema>;
export type SupersetEntry = z.infer<typeof SupersetEntrySchema>;
export type Workout = z.infer<typeof WorkoutSchema>;
