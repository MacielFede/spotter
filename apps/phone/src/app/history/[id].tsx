import type { Workout, WorkoutEntry } from '@spotter/domain';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { LinkifiedText } from '@/components/LinkifiedText';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/ui/Card';
import { Divider } from '@/components/ui/Divider';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { db } from '@/db/client';
import { loadWorkout } from '@/db/workouts';
import { useScreenHeader } from '@/hooks/useScreenHeader';
import { MODULE_LABELS } from '@/lib/authoring';
import { formatTimer, formatWhen, formatWorkoutDuration } from '@/lib/formatWhen';
import { workoutDurationSeconds, workoutSetCount, workoutVolumeKg } from '@/lib/workout';
import { useTheme } from '@/theme/ThemeProvider';

const actualLabel = (set: {
  mode: 'reps' | 'time';
  actualReps?: number | null;
  actualSeconds?: number | null;
  actualWeightKg: number | null;
  usesWeight: boolean;
}): string => {
  const value =
    set.mode === 'reps'
      ? `${set.actualReps ?? '—'} reps`
      : set.actualSeconds === null || set.actualSeconds === undefined
        ? '—'
        : formatTimer(set.actualSeconds);
  return set.usesWeight && set.actualWeightKg !== null
    ? `${value} @ ${set.actualWeightKg} kg`
    : value;
};

const entryKey = (entry: WorkoutEntry, index: number): string =>
  `${entry.kind}-${entry.module}-${index}`;

const snapshotPositionKey = (...parts: (string | number)[]): string => parts.join(':');

export default function WorkoutDetailScreen() {
  const { tokens } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [workout] = useState<Workout | null>(() => (id ? loadWorkout(db, id) : null));

  useScreenHeader(workout?.routineName ?? 'Workout');

  if (!workout) {
    return (
      <Screen>
        <Text style={{ color: tokens.textSecondary }}>Workout not found.</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={{ color: tokens.textSecondary }}>
        {workout.planName} · {formatWhen(workout.startedAt)}
      </Text>
      <Text style={{ color: tokens.textSecondary }}>
        {formatWorkoutDuration(workoutDurationSeconds(workout))} · {workoutSetCount(workout)} sets ·{' '}
        {workoutVolumeKg(workout)} kg volume
      </Text>

      {workout.exercises.map((entry, index) => (
        <Card key={entryKey(entry, index)}>
          <SectionHeader title={MODULE_LABELS[entry.module]} />
          {entry.kind === 'exercise' ? (
            <>
              <Text style={{ color: tokens.textPrimary, fontSize: 17, fontWeight: '700' }}>
                {entry.title}
              </Text>
              {entry.description ? <LinkifiedText description={entry.description} /> : null}
              {entry.sets.map((set, setIndex) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: saved snapshot set order is immutable
                <Text key={`set-${index}-${setIndex}`} style={{ color: tokens.textSecondary }}>
                  Set {setIndex + 1}: {actualLabel({ ...set, usesWeight: entry.usesWeight })}
                </Text>
              ))}
            </>
          ) : (
            <>
              <Text style={{ color: tokens.textPrimary, fontSize: 17, fontWeight: '700' }}>
                Superset
              </Text>
              {entry.restSeconds !== null ? (
                <Text style={{ color: tokens.textSecondary }}>
                  {entry.rounds} rounds · {formatTimer(entry.restSeconds)} rest
                </Text>
              ) : (
                <Text style={{ color: tokens.textSecondary }}>{entry.rounds} rounds</Text>
              )}
              {Array.from({ length: entry.rounds }, (_, round) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: saved snapshot round order is immutable
                <View key={`round-${index}-${round}`}>
                  <Divider />
                  <Text style={{ color: tokens.textSecondary, fontWeight: '600' }}>
                    Round {round + 1} of {entry.rounds}
                  </Text>
                  {entry.members.map((member, memberIndex) => {
                    const actual = member.actuals[round];
                    return actual ? (
                      <Text
                        key={snapshotPositionKey(
                          workout.workoutId,
                          index,
                          round,
                          memberIndex,
                          member.exerciseId,
                        )}
                        style={{ color: tokens.textSecondary }}
                      >
                        {member.title}: {actualLabel({ ...actual, usesWeight: member.usesWeight })}
                      </Text>
                    ) : null;
                  })}
                </View>
              ))}
            </>
          )}
        </Card>
      ))}
    </Screen>
  );
}
