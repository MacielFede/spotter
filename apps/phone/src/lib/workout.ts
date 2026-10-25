import {
  buildWorkoutDraft as buildDraft,
  type DraftContext,
  type Workout,
} from '@spotter/domain';

export {
  buildCyclePlan,
  type CycleStep,
  prefillFromHistory,
  type WorkStepRef,
  workoutDurationSeconds,
  workoutExerciseCount,
  workoutSetCount,
  type WorkoutSummary,
  workoutSummary,
  workoutVolumeKg,
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

type PhoneDraftContext = Omit<DraftContext, 'startedAt' | 'startedOn'> &
  Partial<Pick<DraftContext, 'startedAt'>>;

/** Phone-side draft builder: stamps now and labels the session as started on the phone. */
export const buildWorkoutDraft = ({ startedAt, ...rest }: PhoneDraftContext): Workout =>
  buildDraft({ ...rest, startedAt: startedAt ?? isoWithOffset(), startedOn: 'phone' });

/** Wall-clock duration in whole minutes, for history display. */
export const workoutDurationMinutes = (workout: Workout): number =>
  Math.max(0, Math.round((Date.parse(workout.endedAt) - Date.parse(workout.startedAt)) / 60_000));
