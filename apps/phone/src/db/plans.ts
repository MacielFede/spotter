import {
  type Set as DomainSet,
  type ModuleKind,
  type Plan,
  PlanSchema,
  type SupersetMember,
  type SupersetMemberSet,
} from '@spotter/domain';
import { asc, eq } from 'drizzle-orm';
import { items, modules, plans, routines, sets, supersetMembers } from './schema';
import type { AppDatabase } from './types';

type SetRow = typeof sets.$inferSelect;
type MemberRow = typeof supersetMembers.$inferSelect;
type ItemRow = typeof items.$inferSelect;

const insertedId = (row: { id: number } | undefined): number => {
  if (!row) throw new Error('insert did not return an id');
  return row.id;
};

const setToRow = (itemId: number, position: number, set: DomainSet) => ({
  itemId,
  position,
  mode: set.mode,
  targetReps: set.mode === 'reps' ? set.targetReps : null,
  targetSeconds: set.mode === 'time' ? set.targetSeconds : null,
  weightKg: set.weightKg,
  restSeconds: set.restSeconds,
});

const rowToSet = (row: SetRow): DomainSet => {
  if (row.mode === 'reps') {
    if (row.targetReps === null) throw new Error('reps Set is missing targetReps');
    return {
      mode: 'reps',
      targetReps: row.targetReps,
      weightKg: row.weightKg,
      restSeconds: row.restSeconds,
    };
  }
  if (row.mode !== 'time') throw new Error(`unknown Set mode '${row.mode}'`);
  if (row.targetSeconds === null) throw new Error('time Set is missing targetSeconds');
  return {
    mode: 'time',
    targetSeconds: row.targetSeconds,
    weightKg: row.weightKg,
    restSeconds: row.restSeconds,
  };
};

const memberToRow = (itemId: number, position: number, member: SupersetMember) => ({
  itemId,
  position,
  exerciseId: member.exerciseId,
  mode: member.set.mode,
  targetReps: member.set.mode === 'reps' ? member.set.targetReps : null,
  targetSeconds: member.set.mode === 'time' ? member.set.targetSeconds : null,
  weightKg: member.set.weightKg,
});

const rowToMember = (row: MemberRow): SupersetMember => {
  let set: SupersetMemberSet;
  if (row.mode === 'reps') {
    if (row.targetReps === null) throw new Error('reps Superset member is missing targetReps');
    set = { mode: 'reps', targetReps: row.targetReps, weightKg: row.weightKg };
  } else {
    if (row.mode !== 'time') throw new Error(`unknown Set mode '${row.mode}'`);
    if (row.targetSeconds === null) {
      throw new Error('time Superset member is missing targetSeconds');
    }
    set = { mode: 'time', targetSeconds: row.targetSeconds, weightKg: row.weightKg };
  }
  return { exerciseId: row.exerciseId, set };
};

const rowToItem = (db: AppDatabase, row: ItemRow) => {
  if (row.kind === 'exercise') {
    if (!row.exerciseId) throw new Error('exercise Item is missing exerciseId');
    const setRows = db
      .select()
      .from(sets)
      .where(eq(sets.itemId, row.id))
      .orderBy(asc(sets.position))
      .all();
    return {
      kind: 'exercise' as const,
      exerciseId: row.exerciseId,
      sets: setRows.map(rowToSet),
    };
  }

  const memberRows = db
    .select()
    .from(supersetMembers)
    .where(eq(supersetMembers.itemId, row.id))
    .orderBy(asc(supersetMembers.position))
    .all();
  return {
    kind: 'superset' as const,
    rounds: row.rounds ?? 1,
    restSeconds: row.restSeconds,
    members: memberRows.map(rowToMember),
  };
};

/** Replace a Plan aggregate atomically; routines/modules/items cascade from it. */
export const savePlan = (db: AppDatabase, plan: Plan): Plan => {
  const parsed = PlanSchema.parse(plan);
  db.transaction((tx) => {
    tx.delete(plans).where(eq(plans.id, parsed.id)).run();
    tx.insert(plans).values({ id: parsed.id, name: parsed.name }).run();

    parsed.routines.forEach((routine, routineIndex) => {
      tx.insert(routines)
        .values({
          id: routine.id,
          planId: parsed.id,
          name: routine.name,
          active: routine.active,
          position: routineIndex,
        })
        .run();

      routine.modules.forEach((module, moduleIndex) => {
        const moduleId = insertedId(
          tx
            .insert(modules)
            .values({
              routineId: routine.id,
              kind: module.kind,
              enabled: module.enabled,
              position: moduleIndex,
            })
            .returning({ id: modules.id })
            .get(),
        );

        module.items.forEach((item, itemIndex) => {
          if (item.kind === 'exercise') {
            const itemId = insertedId(
              tx
                .insert(items)
                .values({
                  moduleId,
                  kind: 'exercise',
                  position: itemIndex,
                  exerciseId: item.exerciseId,
                })
                .returning({ id: items.id })
                .get(),
            );
            item.sets.forEach((set, setIndex) => {
              tx.insert(sets)
                .values(setToRow(itemId, setIndex, set))
                .run();
            });
            return;
          }

          const itemId = insertedId(
            tx
              .insert(items)
              .values({
                moduleId,
                kind: 'superset',
                position: itemIndex,
                rounds: item.rounds,
                restSeconds: item.restSeconds,
              })
              .returning({ id: items.id })
              .get(),
          );
          item.members.forEach((member, memberIndex) => {
            tx.insert(supersetMembers)
              .values(memberToRow(itemId, memberIndex, member))
              .run();
          });
        });
      });
    });
  });
  return parsed;
};

export const loadPlan = (db: AppDatabase, id: string): Plan | null => {
  const planRow = db.select().from(plans).where(eq(plans.id, id)).get();
  if (!planRow) return null;

  const routineRows = db
    .select()
    .from(routines)
    .where(eq(routines.planId, id))
    .orderBy(asc(routines.position))
    .all();

  return PlanSchema.parse({
    id: planRow.id,
    name: planRow.name,
    routines: routineRows.map((routine) => {
      const moduleRows = db
        .select()
        .from(modules)
        .where(eq(modules.routineId, routine.id))
        .orderBy(asc(modules.position))
        .all();
      return {
        id: routine.id,
        name: routine.name,
        active: routine.active,
        modules: moduleRows.map((module) => {
          const itemRows = db
            .select()
            .from(items)
            .where(eq(items.moduleId, module.id))
            .orderBy(asc(items.position))
            .all();
          return {
            kind: module.kind as ModuleKind,
            enabled: module.enabled,
            items: itemRows.map((item) => rowToItem(db, item)),
          };
        }),
      };
    }),
  });
};

export const listPlans = (db: AppDatabase): Plan[] => {
  const ids = db.select({ id: plans.id }).from(plans).orderBy(asc(plans.name)).all();
  return ids.flatMap(({ id }) => {
    const plan = loadPlan(db, id);
    return plan ? [plan] : [];
  });
};

/**
 * Delete a Plan and its Routines/Modules/Items. Exercises and Workouts are
 * untouched: the library is a separate root, and Workouts snapshot by id only
 * (ADR 0001, ADR 0035).
 */
export const deletePlan = (db: AppDatabase, id: string): number =>
  db.delete(plans).where(eq(plans.id, id)).run().changes;
