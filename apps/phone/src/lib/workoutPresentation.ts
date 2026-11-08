import type {
  ExerciseEntry,
  LoggedSet,
  ModuleKind,
  SupersetEntry,
  SupersetMemberActual,
  SupersetMemberSnapshot,
  Workout,
  WorkoutEntry,
} from '@spotter/domain';

const actualIsComplete = (actual: LoggedSet | SupersetMemberActual): boolean =>
  actual.mode === 'reps' ? actual.actualReps !== null : actual.actualSeconds !== null;

export const isSupersetMemberComplete = (member: SupersetMemberSnapshot): boolean =>
  member.actuals.every(actualIsComplete);

export const isWorkoutEntryComplete = (entry: WorkoutEntry): boolean => {
  if (entry.kind === 'exercise') return entry.sets.every(actualIsComplete);
  return entry.members.every(isSupersetMemberComplete);
};

/** The snapshot's item sequence preserves the author's module order. */
export const orderedWorkoutModules = (workout: Workout): ModuleKind[] => {
  const seen = new Set<ModuleKind>();
  return workout.exercises.flatMap((entry) => {
    if (seen.has(entry.module)) return [];
    seen.add(entry.module);
    return [entry.module];
  });
};

const loggedSetFromMember = (
  member: SupersetMemberSnapshot,
  actual: SupersetMemberActual,
  restSeconds: number | null,
): LoggedSet => {
  if (actual.mode === 'reps' && member.set.mode === 'reps') {
    return {
      mode: 'reps',
      targetReps: member.set.targetReps,
      weightKg: member.set.weightKg,
      restSeconds,
      actualReps: actual.actualReps,
      actualWeightKg: actual.actualWeightKg,
    };
  }
  if (actual.mode === 'time' && member.set.mode === 'time') {
    return {
      mode: 'time',
      targetSeconds: member.set.targetSeconds,
      weightKg: member.set.weightKg,
      restSeconds,
      actualSeconds: actual.actualSeconds,
      actualWeightKg: actual.actualWeightKg,
    };
  }
  throw new Error('Superset actual mode does not match its member template.');
};

/** Remove one member while preserving the remaining work and keeping the snapshot valid. */
export const removeSupersetMember = (entry: SupersetEntry, memberIndex: number): WorkoutEntry => {
  if (memberIndex < 0 || memberIndex >= entry.members.length) return entry;
  const members = entry.members.filter((_, index) => index !== memberIndex);
  if (members.length >= 2) return { ...entry, members };

  const [remaining] = members;
  if (!remaining) throw new Error('A Superset must retain at least one exercise.');
  const standalone: ExerciseEntry = {
    kind: 'exercise',
    exerciseId: remaining.exerciseId,
    title: remaining.title,
    description: remaining.description,
    usesWeight: remaining.usesWeight,
    module: entry.module,
    rounds: 1,
    sets: remaining.actuals.map((actual) =>
      loggedSetFromMember(remaining, actual, entry.restSeconds),
    ),
  };
  return standalone;
};

const completeLoggedSet = (set: LoggedSet, usesWeight: boolean): LoggedSet => {
  const actualWeightKg = usesWeight ? (set.actualWeightKg ?? set.weightKg) : null;
  if (set.mode === 'reps') {
    return { ...set, actualReps: set.actualReps ?? set.targetReps, actualWeightKg };
  }
  return { ...set, actualSeconds: set.actualSeconds ?? set.targetSeconds, actualWeightKg };
};

const completeMemberActual = (
  member: SupersetMemberSnapshot,
  actual: SupersetMemberActual,
): SupersetMemberActual => {
  const actualWeightKg = member.usesWeight ? (actual.actualWeightKg ?? member.set.weightKg) : null;
  if (actual.mode === 'reps' && member.set.mode === 'reps') {
    return { ...actual, actualReps: actual.actualReps ?? member.set.targetReps, actualWeightKg };
  }
  if (actual.mode === 'time' && member.set.mode === 'time') {
    return {
      ...actual,
      actualSeconds: actual.actualSeconds ?? member.set.targetSeconds,
      actualWeightKg,
    };
  }
  return actual;
};

/**
 * A focusable piece of work: a standalone Exercise (`memberIndex` null) or one
 * member of a Superset. The Superset itself is only a wrapper around its members.
 */
export interface WorkoutUnit {
  entryIndex: number;
  memberIndex: number | null;
}

export const workoutUnits = (workout: Workout): WorkoutUnit[] =>
  workout.exercises.flatMap((entry, entryIndex): WorkoutUnit[] =>
    entry.kind === 'exercise'
      ? [{ entryIndex, memberIndex: null }]
      : entry.members.map((_, memberIndex) => ({ entryIndex, memberIndex })),
  );

const completeNextExerciseSet = (entry: ExerciseEntry): ExerciseEntry => {
  const index = entry.sets.findIndex((set) => !actualIsComplete(set));
  if (index < 0) return entry;
  return {
    ...entry,
    sets: entry.sets.map((set, setIndex) =>
      setIndex === index ? completeLoggedSet(set, entry.usesWeight) : set,
    ),
  };
};

const completeNextMemberRound = (entry: SupersetEntry, memberIndex: number): SupersetEntry => {
  const member = entry.members[memberIndex];
  if (!member) return entry;
  const round = member.actuals.findIndex((actual) => !actualIsComplete(actual));
  if (round < 0) return entry;
  return {
    ...entry,
    members: entry.members.map((candidate, index) =>
      index === memberIndex
        ? {
            ...candidate,
            actuals: candidate.actuals.map((actual, actualIndex) =>
              actualIndex === round ? completeMemberActual(candidate, actual) : actual,
            ),
          }
        : candidate,
    ),
  };
};

/** Logs the next unlogged set (or round) of a unit at its prescribed target. One step per press. */
export const advanceWorkoutUnit = (workout: Workout, unit: WorkoutUnit): Workout => ({
  ...workout,
  exercises: workout.exercises.map((entry, entryIndex) => {
    if (entryIndex !== unit.entryIndex) return entry;
    if (unit.memberIndex === null) {
      return entry.kind === 'exercise' ? completeNextExerciseSet(entry) : entry;
    }
    return entry.kind === 'superset' ? completeNextMemberRound(entry, unit.memberIndex) : entry;
  }),
});

const unitActuals = (workout: Workout, unit: WorkoutUnit): (LoggedSet | SupersetMemberActual)[] => {
  const entry = workout.exercises[unit.entryIndex];
  if (!entry) return [];
  if (unit.memberIndex === null) return entry.kind === 'exercise' ? entry.sets : [];
  if (entry.kind !== 'superset') return [];
  return entry.members[unit.memberIndex]?.actuals ?? [];
};

/** How many of a unit's sets (or rounds) are logged, out of how many it has. */
export const unitProgress = (
  workout: Workout,
  unit: WorkoutUnit,
): { done: number; total: number } => {
  const actuals = unitActuals(workout, unit);
  return { done: actuals.filter(actualIsComplete).length, total: actuals.length };
};

export const isUnitComplete = (workout: Workout, unit: WorkoutUnit): boolean => {
  const { done, total } = unitProgress(workout, unit);
  return done >= total;
};

export const firstIncompleteUnit = (workout: Workout): WorkoutUnit | undefined =>
  workoutUnits(workout).find((unit) => !isUnitComplete(workout, unit));

/** The next unfinished unit after `unit`, wrapping around; undefined when nothing is left. */
export const nextIncompleteUnit = (
  workout: Workout,
  unit: WorkoutUnit,
): WorkoutUnit | undefined => {
  const units = workoutUnits(workout);
  const index = units.findIndex(
    (candidate) =>
      candidate.entryIndex === unit.entryIndex && candidate.memberIndex === unit.memberIndex,
  );
  for (let offset = 1; offset < units.length; offset++) {
    const candidate = units[(index + offset) % units.length];
    if (candidate && !isUnitComplete(workout, candidate)) return candidate;
  }
  return undefined;
};
