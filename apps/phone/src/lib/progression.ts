import type { Workout } from '@spotter/domain';

export interface ProgressionPoint {
  workoutId: string;
  startedAt: string;
  planId: string;
  planName: string;
  value: number;
}

export interface ExerciseOption {
  exerciseId: string;
  title: string;
  workoutCount: number;
}

const weightOf = (workout: Workout, exerciseId: string): number | null => {
  let heaviest: number | null = null;
  for (const entry of workout.exercises) {
    if (entry.kind === 'exercise') {
      if (entry.exerciseId !== exerciseId) continue;
      for (const set of entry.sets) {
        if (set.actualWeightKg === null) continue;
        heaviest = heaviest === null ? set.actualWeightKg : Math.max(heaviest, set.actualWeightKg);
      }
      continue;
    }
    for (const member of entry.members) {
      if (member.exerciseId !== exerciseId) continue;
      for (const actual of member.actuals) {
        if (actual.actualWeightKg === null) continue;
        heaviest =
          heaviest === null ? actual.actualWeightKg : Math.max(heaviest, actual.actualWeightKg);
      }
    }
  }
  return heaviest;
};

const volumeOf = (workout: Workout, exerciseId: string): number => {
  let volume = 0;
  for (const entry of workout.exercises) {
    if (entry.kind === 'exercise') {
      if (entry.exerciseId !== exerciseId) continue;
      for (const set of entry.sets) {
        if (set.mode === 'reps' && set.actualReps !== null && set.actualWeightKg !== null) {
          volume += set.actualReps * set.actualWeightKg;
        }
      }
      continue;
    }
    for (const member of entry.members) {
      if (member.exerciseId !== exerciseId) continue;
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

const point = (workout: Workout, value: number): ProgressionPoint => ({
  workoutId: workout.workoutId,
  startedAt: workout.startedAt,
  planId: workout.planId,
  planName: workout.planName,
  value,
});

const chronological = (workouts: Workout[]): Workout[] =>
  [...workouts].sort((left, right) => left.startedAt.localeCompare(right.startedAt));

/** Heaviest completed set's weight per session (ADR 0016). */
export const weightSeries = (
  workouts: Workout[],
  exerciseId: string,
  planId?: string | null,
): ProgressionPoint[] =>
  chronological(workouts)
    .filter((workout) => !planId || workout.planId === planId)
    .flatMap((workout) => {
      const value = weightOf(workout, exerciseId);
      return value === null ? [] : [point(workout, value)];
    });

/** Total volume from weighted rep Sets per session; time-only sets never count (ADR 0039). */
export const volumeSeries = (
  workouts: Workout[],
  exerciseId: string,
  planId?: string | null,
): ProgressionPoint[] =>
  chronological(workouts)
    .filter((workout) => !planId || workout.planId === planId)
    .flatMap((workout) => {
      const value = volumeOf(workout, exerciseId);
      return value > 0 ? [point(workout, value)] : [];
    });

/** Every Exercise that appears in saved logs, cross-plan, keyed by the stable Exercise id. */
export const loggedExercises = (workouts: Workout[]): ExerciseOption[] => {
  const options = new Map<string, ExerciseOption>();
  for (const workout of workouts) {
    for (const entry of workout.exercises) {
      if (entry.kind === 'exercise') {
        const current = options.get(entry.exerciseId);
        options.set(entry.exerciseId, {
          exerciseId: entry.exerciseId,
          title: current?.title ?? entry.title,
          workoutCount: (current?.workoutCount ?? 0) + 1,
        });
        continue;
      }
      for (const member of entry.members) {
        const current = options.get(member.exerciseId);
        options.set(member.exerciseId, {
          exerciseId: member.exerciseId,
          title: current?.title ?? member.title,
          workoutCount: (current?.workoutCount ?? 0) + 1,
        });
      }
    }
  }
  return [...options.values()].sort((left, right) => left.title.localeCompare(right.title));
};
