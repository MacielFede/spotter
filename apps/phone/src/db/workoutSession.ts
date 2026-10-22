import { type Plan, type Routine, type Workout, WorkoutSchema } from '@spotter/domain';
import { newUuidV7 } from '@/lib/newUuid';
import { buildWorkoutDraft, isoWithOffset } from '@/lib/workout';
import { db } from './client';
import { clearActiveWorkout, loadActiveWorkout, saveActiveWorkout } from './draft';
import { listExercises } from './exercises';
import { listWorkouts, saveWorkout } from './workouts';

/** Start a shared, ownerless session from a startable Routine (ADR 0038). */
export const startWorkoutSession = (plan: Plan, routine: Routine): Workout => {
  // Defensive: a second Start continues the existing session instead of forking one.
  const existing = loadWorkoutDraft();
  if (existing) return existing;

  const exercises = Object.fromEntries(
    listExercises(db, { includeArchived: true }).map((exercise) => [exercise.id, exercise]),
  );
  const draft = buildWorkoutDraft({
    plan,
    routine,
    exercises,
    history: listWorkouts(db),
    workoutId: newUuidV7(),
  });
  persistWorkoutDraft(draft);
  return draft;
};

/** Durably persist every edit so a crash resumes the same draft (ADR 0008). */
export const persistWorkoutDraft = (draft: Workout): void => {
  saveActiveWorkout(db, {
    sessionId: draft.workoutId,
    details: JSON.stringify(draft),
    updatedAt: isoWithOffset(),
  });
};

export const loadWorkoutDraft = (): Workout | null => {
  const active = loadActiveWorkout(db);
  if (!active) return null;
  try {
    const parsed = WorkoutSchema.safeParse(JSON.parse(active.details));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
};

/** Save is final: stamp endedAt, append the immutable log, clear the draft. */
export const finishWorkoutSession = (draft: Workout): Workout => {
  const active = loadActiveWorkout(db);
  // A session ends exactly once: late/duplicate terminal actions are ignored.
  if (!active || active.sessionId !== draft.workoutId) return draft;

  const done = WorkoutSchema.parse({ ...draft, endedAt: isoWithOffset() });
  saveWorkout(db, done);
  clearActiveWorkout(db);
  return done;
};

/** Cancel discards entirely — no partial logs (ADR 0025). */
export const cancelWorkoutSession = (): void => {
  clearActiveWorkout(db);
};
