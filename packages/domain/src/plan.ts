import { z } from 'zod';
import { UuidV7Schema } from './id.js';
import { type ModuleKind, ModuleSchema } from './module.js';
import { nonBlankString } from './primitives.js';

/** At most one Module per fixed kind, ordered (ADR 0040). */
const ModulesSchema = z.array(ModuleSchema).superRefine((modules, ctx) => {
  const seen = new Set<ModuleKind>();
  modules.forEach((module, index) => {
    if (seen.has(module.kind)) {
      ctx.addIssue({
        code: 'custom',
        message: `routine holds at most one module of kind '${module.kind}'`,
        path: [index, 'kind'],
      });
    }
    seen.add(module.kind);
  });
});

/**
 * Routine: ordered Modules owned by a Plan, with an active/inactive flag
 * scoped per Plan — many Routines may be active at once (ADR 0010).
 */
export const RoutineSchema = z
  .strictObject({
    id: UuidV7Schema,
    name: nonBlankString('name cannot be blank'),
    active: z.boolean(),
    modules: ModulesSchema,
  })
  .meta({ id: 'Routine', title: 'Routine' });

/** A Plan owns its Routines — neither Exercises nor Workout logs (ADR 0001, ADR 0035). */
export const PlanSchema = z.strictObject({
  id: UuidV7Schema,
  name: nonBlankString('name cannot be blank'),
  routines: z.array(RoutineSchema),
});

export type Routine = z.infer<typeof RoutineSchema>;
export type Plan = z.infer<typeof PlanSchema>;
