import type {
  Set as DomainSet,
  Exercise,
  ExerciseEntry,
  LoggedSet,
  Plan,
  Routine,
  SupersetEntry,
  SupersetMemberActual,
  SupersetMemberSet,
  Workout,
  WorkoutEntry,
} from '@spotter/domain';

/** ISO 8601 with a local UTC offset (ADR 0039). */
export const isoWithOffset = (date = new Date()): string => {
  const pad = (value: number) => String(value).padStart(2, '0');
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absolute = Math.abs(offsetMinutes);
  const local = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  return `${local}${sign}${pad(Math.floor(absolute / 60))}:${pad(absolute % 60)}`;
};

const emptyLoggedSet = (set: DomainSet): LoggedSet =>
  set.mode === 'reps'
    ? { ...set, actualReps: null, actualWeightKg: null }
    : { ...set, actualSeconds: null, actualWeightKg: null };

const emptyActual = (set: SupersetMemberSet): SupersetMemberActual =>
  set.mode === 'reps'
    ? { mode: 'reps', actualReps: null, actualWeightKg: null }
    : { mode: 'time', actualSeconds: null, actualWeightKg: null };

const copySetActuals = (target: LoggedSet, source: LoggedSet): LoggedSet => {
  if (target.mode === 'reps' && source.mode === 'reps') {
    return { ...target, actualReps: source.actualReps, actualWeightKg: source.actualWeightKg };
  }
  if (target.mode === 'time' && source.mode === 'time') {
    return {
      ...target,
      actualSeconds: source.actualSeconds,
      actualWeightKg: source.actualWeightKg,
    };
  }
  return target;
};

const copyActual = (
  target: SupersetMemberActual,
  source: SupersetMemberActual,
): SupersetMemberActual => {
  if (target.mode === 'reps' && source.mode === 'reps') {
    return { ...target, actualReps: source.actualReps, actualWeightKg: source.actualWeightKg };
  }
  if (target.mode === 'time' && source.mode === 'time') {
    return {
      ...target,
      actualSeconds: source.actualSeconds,
      actualWeightKg: source.actualWeightKg,
    };
  }
  return target;
};

const lastExerciseEntry = (history: Workout[], exerciseId: string): ExerciseEntry | undefined =>
  history
    .flatMap((workout) => workout.exercises)
    .find(
      (entry): entry is ExerciseEntry =>
        entry.kind === 'exercise' && entry.exerciseId === exerciseId,
    );

const lastSupersetMember = (history: Workout[], exerciseId: string) => {
  for (const workout of history) {
    for (const entry of workout.exercises) {
      if (entry.kind !== 'superset') continue;
      const member = entry.members.find((candidate) => candidate.exerciseId === exerciseId);
      if (member) return member;
    }
  }
  return undefined;
};

const sameMembers = (left: SupersetEntry, right: SupersetEntry): boolean =>
  left.members.length === right.members.length &&
  left.members.every((member, index) => member.exerciseId === right.members[index]?.exerciseId);

/**
 * Prefill order (CONTEXT): previous Workout of the same Routine, then the
 * Exercise's last actuals anywhere, then the template starting values — all
 * matched by position so duplicate Exercises stay distinct (ADR 0040).
 */
export const prefillFromHistory = (draft: Workout, history: Workout[]): Workout => {
  const previous = history.find((workout) => workout.routineId === draft.routineId);

  return {
    ...draft,
    exercises: draft.exercises.map((entry, index) => {
      const prior = previous?.exercises[index];

      if (entry.kind === 'exercise') {
        const byPosition =
          prior?.kind === 'exercise' && prior.exerciseId === entry.exerciseId ? prior : undefined;
        const source = byPosition ?? lastExerciseEntry(history, entry.exerciseId);
        if (!source) return entry;
        return {
          ...entry,
          sets: entry.sets.map((set, setIndex) => {
            const sourceSet = source.sets[setIndex];
            return sourceSet ? copySetActuals(set, sourceSet) : set;
          }),
        };
      }

      const byPosition =
        prior?.kind === 'superset' && sameMembers(prior, entry) ? prior : undefined;
      return {
        ...entry,
        members: entry.members.map((member) => {
          const source =
            byPosition?.members.find((candidate) => candidate.exerciseId === member.exerciseId) ??
            lastSupersetMember(history, member.exerciseId);
          if (!source) return member;
          return {
            ...member,
            actuals: member.actuals.map((actual, round) => {
              const sourceActual = source.actuals[round];
              return sourceActual ? copyActual(actual, sourceActual) : actual;
            }),
          };
        }),
      };
    }),
  };
};

export interface DraftContext {
  plan: Plan;
  routine: Routine;
  exercises: Record<string, Exercise>;
  history: Workout[];
  workoutId: string;
  startedAt?: string;
}

/** Snapshot the enabled modules of a Routine into a fresh, fully-null draft (ADR 0004). */
export const buildWorkoutDraft = ({
  plan,
  routine,
  exercises,
  history,
  workoutId,
  startedAt = isoWithOffset(),
}: DraftContext): Workout => {
  const exercisesById = exercises;
  const entries: WorkoutEntry[] = [];

  for (const module of routine.modules) {
    if (!module.enabled) continue;
    for (const item of module.items) {
      if (item.kind === 'exercise') {
        const exercise = exercisesById[item.exerciseId];
        entries.push({
          kind: 'exercise',
          exerciseId: item.exerciseId,
          title: exercise?.title ?? 'Unknown exercise',
          description: exercise?.description ?? '',
          module: module.kind,
          rounds: 1,
          sets: item.sets.map(emptyLoggedSet),
        });
        continue;
      }

      entries.push({
        kind: 'superset',
        module: module.kind,
        rounds: item.rounds,
        restSeconds: item.restSeconds,
        members: item.members.map((member) => {
          const exercise = exercisesById[member.exerciseId];
          return {
            exerciseId: member.exerciseId,
            title: exercise?.title ?? 'Unknown exercise',
            description: exercise?.description ?? '',
            set: member.set,
            actuals: Array.from({ length: item.rounds }, () => emptyActual(member.set)),
          };
        }),
      });
    }
  }

  const draft: Workout = {
    workoutId,
    planId: plan.id,
    planName: plan.name,
    routineId: routine.id,
    routineName: routine.name,
    startedAt,
    endedAt: startedAt,
    startedOn: 'phone',
    exercises: entries,
  };

  return prefillFromHistory(draft, history);
};

/** Total logged Sets in a Workout snapshot. */
export const workoutSetCount = (workout: Workout): number =>
  workout.exercises.reduce((total, entry) => {
    if (entry.kind === 'exercise') return total + entry.sets.length;
    return total + entry.members.length * entry.rounds;
  }, 0);

/** Volume in kg: reps × weight for completed rep Sets only (ADR 0016, ADR 0039). */
export const workoutVolumeKg = (workout: Workout): number => {
  let volume = 0;
  for (const entry of workout.exercises) {
    if (entry.kind === 'exercise') {
      for (const set of entry.sets) {
        if (set.mode === 'reps' && set.actualReps !== null && set.actualWeightKg !== null) {
          volume += set.actualReps * set.actualWeightKg;
        }
      }
      continue;
    }
    for (const member of entry.members) {
      for (const actual of member.actuals) {
        if (
          actual.mode === 'reps' &&
          actual.actualReps !== null &&
          actual.actualWeightKg !== null
        ) {
          volume += actual.actualReps * actual.actualWeightKg;
        }
      }
    }
  }
  return Math.round(volume * 10) / 10;
};

/** Wall-clock duration from Start to Save (ADR 0038). */
export const workoutDurationMinutes = (workout: Workout): number =>
  Math.max(0, Math.round((Date.parse(workout.endedAt) - Date.parse(workout.startedAt)) / 60_000));
