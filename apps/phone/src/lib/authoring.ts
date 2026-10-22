import type { Set as DomainSet, Module, ModuleKind, Routine } from '@spotter/domain';

export const MODULE_KINDS: ModuleKind[] = ['warmup', 'stretching', 'core', 'cardio'];

export const MODULE_LABELS: Record<ModuleKind, string> = {
  warmup: 'Warm-up',
  stretching: 'Stretching',
  core: 'Core',
  cardio: 'Cardio',
};

/** A new Routine starts with all four fixed module slots, disabled and empty (ADR 0040). */
export const emptyRoutine = (id: string, name: string): Routine => ({
  id,
  name,
  active: false,
  modules: MODULE_KINDS.map((kind) => ({ kind, enabled: false, items: [] })),
});

/** Ensure all four slots exist and are ordered, without dropping authored content. */
export const normalizeModules = (modules: Module[]): Module[] => {
  const known = new Map(modules.map((module) => [module.kind, module]));
  const present = modules.filter((module) => MODULE_KINDS.includes(module.kind));
  for (const kind of MODULE_KINDS) {
    if (!known.has(kind)) present.push({ kind, enabled: false, items: [] });
  }
  return present;
};

export const defaultSet = (): DomainSet => ({
  mode: 'reps',
  targetReps: 8,
  weightKg: null,
  restSeconds: null,
});

export const move = <T>(items: T[], from: number, to: number): T[] => {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) {
    return items;
  }
  const next = [...items];
  const [item] = next.splice(from, 1);
  if (item === undefined) return items;
  next.splice(to, 0, item);
  return next;
};

/** Only active, enabled, non-empty Routines are startable (ADR 0010, ADR 0040). */
export const isRoutineStartable = (routine: Routine): boolean =>
  routine.active && routine.modules.some((module) => module.enabled && module.items.length > 0);
