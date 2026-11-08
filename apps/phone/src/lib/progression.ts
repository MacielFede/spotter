import type { LoggedSet, SupersetMemberActual, Workout } from '@spotter/domain';

type Mode = 'reps' | 'time';

export interface ProgressionPoint {
  workoutId: string;
  startedAt: string;
  value: number;
}

export interface ExerciseOption {
  exerciseId: string;
  title: string;
  workoutCount: number;
  usesWeight: boolean;
  mode: Mode;
}

export interface ExerciseLogSet {
  mode: Mode;
  actualReps: number | null;
  actualSeconds: number | null;
  actualWeightKg: number | null;
  usesWeight: boolean;
}

export interface ExerciseLog {
  workoutId: string;
  startedAt: string;
  sets: ExerciseLogSet[];
}

interface ExerciseInstance {
  title: string;
  usesWeight: boolean;
  sets: (LoggedSet | SupersetMemberActual)[];
}

const exerciseInstances = (workout: Workout, exerciseId: string): ExerciseInstance[] => {
  const result: ExerciseInstance[] = [];
  for (const entry of workout.exercises) {
    if (entry.kind === 'exercise') {
      if (entry.exerciseId === exerciseId) {
        result.push({ title: entry.title, usesWeight: entry.usesWeight, sets: entry.sets });
      }
      continue;
    }
    for (const member of entry.members) {
      if (member.exerciseId === exerciseId) {
        result.push({ title: member.title, usesWeight: member.usesWeight, sets: member.actuals });
      }
    }
  }
  return result;
};

const chronological = (workouts: Workout[]): Workout[] =>
  [...workouts].sort((left, right) => left.startedAt.localeCompare(right.startedAt));

const point = (workout: Workout, value: number): ProgressionPoint => ({
  workoutId: workout.workoutId,
  startedAt: workout.startedAt,
  value,
});

const bestActual = (workout: Workout, exerciseId: string, mode: Mode): number | null => {
  let best: number | null = null;
  for (const instance of exerciseInstances(workout, exerciseId)) {
    for (const set of instance.sets) {
      if (set.mode !== mode) continue;
      const actual = set.mode === 'reps' ? set.actualReps : set.actualSeconds;
      if (actual !== null) best = best === null ? actual : Math.max(best, actual);
    }
  }
  return best;
};

/** Heaviest completed set's weight per session; bodyweight snapshots are excluded. */
export const weightSeries = (workouts: Workout[], exerciseId: string): ProgressionPoint[] =>
  chronological(workouts).flatMap((workout) => {
    let best: number | null = null;
    for (const instance of exerciseInstances(workout, exerciseId)) {
      if (!instance.usesWeight) continue;
      for (const set of instance.sets) {
        if (set.actualWeightKg === null) continue;
        best = best === null ? set.actualWeightKg : Math.max(best, set.actualWeightKg);
      }
    }
    return best === null ? [] : [point(workout, best)];
  });

/** Volume from weighted rep sets only; bodyweight and time-only work are omitted. */
export const volumeSeries = (workouts: Workout[], exerciseId: string): ProgressionPoint[] =>
  chronological(workouts).flatMap((workout) => {
    let volume = 0;
    for (const instance of exerciseInstances(workout, exerciseId)) {
      if (!instance.usesWeight) continue;
      for (const set of instance.sets) {
        if (set.mode === 'reps' && set.actualReps !== null && set.actualWeightKg !== null) {
          volume += set.actualReps * set.actualWeightKg;
        }
      }
    }
    const rounded = Math.round(volume * 10) / 10;
    return rounded > 0 ? [point(workout, rounded)] : [];
  });

/** Best completed reps in each session, including bodyweight work. */
export const repsSeries = (workouts: Workout[], exerciseId: string): ProgressionPoint[] =>
  chronological(workouts).flatMap((workout) => {
    const best = bestActual(workout, exerciseId, 'reps');
    return best === null ? [] : [point(workout, best)];
  });

/** Best completed duration in each session, in seconds. */
export const timeSeries = (workouts: Workout[], exerciseId: string): ProgressionPoint[] =>
  chronological(workouts).flatMap((workout) => {
    const best = bestActual(workout, exerciseId, 'time');
    return best === null ? [] : [point(workout, best)];
  });

/** Every Exercise with saved logs, counted once per Workout and across all Plans. */
export const loggedExercises = (workouts: Workout[]): ExerciseOption[] => {
  const options = new Map<string, ExerciseOption>();
  const newestFirst = [...workouts].sort((left, right) =>
    right.startedAt.localeCompare(left.startedAt),
  );

  for (const workout of newestFirst) {
    const seenInWorkout = new Set<string>();
    for (const entry of workout.exercises) {
      if (entry.kind === 'exercise') {
        if (seenInWorkout.has(entry.exerciseId)) continue;
        seenInWorkout.add(entry.exerciseId);
        const current = options.get(entry.exerciseId);
        options.set(entry.exerciseId, {
          exerciseId: entry.exerciseId,
          title: current?.title ?? entry.title,
          usesWeight: current?.usesWeight ?? entry.usesWeight,
          mode: current?.mode ?? entry.sets[0]?.mode ?? 'reps',
          workoutCount: (current?.workoutCount ?? 0) + 1,
        });
        continue;
      }
      for (const member of entry.members) {
        if (seenInWorkout.has(member.exerciseId)) continue;
        seenInWorkout.add(member.exerciseId);
        const current = options.get(member.exerciseId);
        options.set(member.exerciseId, {
          exerciseId: member.exerciseId,
          title: current?.title ?? member.title,
          usesWeight: current?.usesWeight ?? member.usesWeight,
          mode: current?.mode ?? member.set.mode,
          workoutCount: (current?.workoutCount ?? 0) + 1,
        });
      }
    }
  }

  return [...options.values()].sort((left, right) => left.title.localeCompare(right.title));
};

/** Per-workout set actuals for an exercise, newest first. */
export const exerciseLogs = (workouts: Workout[], exerciseId: string): ExerciseLog[] =>
  [...workouts]
    .sort((left, right) => right.startedAt.localeCompare(left.startedAt))
    .flatMap((workout) => {
      const sets = exerciseInstances(workout, exerciseId).flatMap((instance) =>
        instance.sets.map((set) => ({
          mode: set.mode,
          actualReps: set.mode === 'reps' ? set.actualReps : null,
          actualSeconds: set.mode === 'time' ? set.actualSeconds : null,
          actualWeightKg: set.actualWeightKg,
          usesWeight: instance.usesWeight,
        })),
      );
      return sets.length === 0
        ? []
        : [{ workoutId: workout.workoutId, startedAt: workout.startedAt, sets }];
    });
