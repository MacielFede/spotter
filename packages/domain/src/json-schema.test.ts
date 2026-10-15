import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { ExerciseSchema } from './exercise.js';
import {
  ExerciseItemSchema,
  ItemSchema,
  ModuleKindSchema,
  ModuleSchema,
  SupersetItemSchema,
  SupersetMemberSchema,
} from './module.js';
import { PlanSchema, RoutineSchema } from './plan.js';
import { SetSchema, SupersetMemberSetSchema } from './set.js';
import {
  ExerciseEntrySchema,
  LoggedSetSchema,
  SupersetEntrySchema,
  SupersetMemberActualSchema,
  SupersetMemberSnapshotSchema,
  WorkoutEntrySchema,
  WorkoutSchema,
} from './workout.js';

const schemas = [
  ['ExerciseSchema', ExerciseSchema],
  ['SetSchema', SetSchema],
  ['SupersetMemberSetSchema', SupersetMemberSetSchema],
  ['ModuleSchema', ModuleSchema],
  ['ItemSchema', ItemSchema],
  ['ExerciseItemSchema', ExerciseItemSchema],
  ['SupersetItemSchema', SupersetItemSchema],
  ['SupersetMemberSchema', SupersetMemberSchema],
  ['RoutineSchema', RoutineSchema],
  ['PlanSchema', PlanSchema],
  ['LoggedSetSchema', LoggedSetSchema],
  ['SupersetMemberActualSchema', SupersetMemberActualSchema],
  ['SupersetMemberSnapshotSchema', SupersetMemberSnapshotSchema],
  ['ExerciseEntrySchema', ExerciseEntrySchema],
  ['SupersetEntrySchema', SupersetEntrySchema],
  ['WorkoutEntrySchema', WorkoutEntrySchema],
  ['WorkoutSchema', WorkoutSchema],
] as const;

describe('JSON Schema emission (issue #7 acceptance: emits cleanly)', () => {
  it.each(schemas)('%s emits cleanly into JSON Schema', (_name, schema) => {
    const jsonSchema = z.toJSONSchema(schema);
    expect(JSON.stringify(jsonSchema)).toBeTruthy();
  });

  it('emits the structural constraints codegen relies on', () => {
    const exercise = z.toJSONSchema(ExerciseSchema);
    expect(exercise.additionalProperties).toBe(false);
    expect(exercise.required).toContain('archived');

    const moduleKind = z.toJSONSchema(ModuleKindSchema);
    expect(moduleKind.enum).toEqual(['warmup', 'stretching', 'core', 'cardio']);

    const supersetItem = z.toJSONSchema(SupersetItemSchema);
    const members = supersetItem.properties?.members as { minItems?: number } | undefined;
    expect(members?.minItems).toBe(2);

    const serializedSet = JSON.stringify(z.toJSONSchema(SetSchema));
    expect(serializedSet).toContain('"const":"reps"');
    expect(serializedSet).toContain('"const":"time"');
  });

  it('drops custom checks — behavioral rules are hand-written per platform (ADR 0046)', () => {
    const refined = z.toJSONSchema(z.string().refine((value) => value.length > 2));
    expect(refined).toEqual({
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'string',
    });
  });
});
