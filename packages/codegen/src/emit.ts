import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ExerciseSchema, PlanSchema, SCHEMA_VERSION, WorkoutSchema } from '@spotter/domain';
import { z } from 'zod';

/** Committed generated artifacts live here (packages/domain/gen, ADR 0045). */
export const domainGenDir = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'domain',
  'gen',
);

/**
 * Envelope: an entity wrapped with the single-sourced `schemaVersion`
 * (ADR 0026, ADR 0041) — the same property export files and sync envelopes
 * carry. Parsing refuses a mismatched version (the exact-match rule).
 */
export const withSchemaVersion = <S extends z.ZodObject>(schema: S) =>
  z.strictObject({ schemaVersion: z.literal(SCHEMA_VERSION), ...schema.shape });

export const jsonSchemaTargets = [
  { entity: 'Exercise', file: 'exercise.schema.json', schema: withSchemaVersion(ExerciseSchema) },
  { entity: 'Plan', file: 'plan.schema.json', schema: withSchemaVersion(PlanSchema) },
  { entity: 'Workout', file: 'workout.schema.json', schema: withSchemaVersion(WorkoutSchema) },
] as const;

/**
 * Combined codegen input: every entity in one document, so quicktype generates
 * a single module per language with named, deduplicated types (shared Zod
 * instances — e.g. the Superset member Set — collapse into one `$defs` entry).
 */
const DomainCombinedSchema = withSchemaVersion(
  z.strictObject({
    exercise: ExerciseSchema,
    plan: PlanSchema,
    workout: WorkoutSchema,
  }),
).meta({ title: 'Domain' });

export const domainSchemaTarget = {
  entity: 'Domain',
  file: 'domain.schema.json',
  schema: DomainCombinedSchema,
} as const;

export const allSchemaTargets = [...jsonSchemaTargets, domainSchemaTarget] as const;

/**
 * Zod → JSON Schema. ADR 0045 names zod-to-json-schema, which does not support
 * Zod 4; this uses Zod 4's first-party `z.toJSONSchema` for the same artifact
 * (amendment recorded in ADR 0045). Emission is deterministic: it depends only
 * on the Zod sources and this code.
 */
export const emitJsonSchemas = (): Record<string, string> =>
  Object.fromEntries(
    allSchemaTargets.map(({ file, schema }) => [
      file,
      `${JSON.stringify(z.toJSONSchema(schema), null, 2)}\n`,
    ]),
  );
