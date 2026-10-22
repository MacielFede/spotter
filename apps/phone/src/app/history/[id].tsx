import type { Workout } from '@spotter/domain';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { db } from '@/db/client';
import { loadWorkout } from '@/db/workouts';
import { MODULE_LABELS } from '@/lib/authoring';
import { workoutDurationMinutes, workoutSetCount, workoutVolumeKg } from '@/lib/workout';
import { useTheme } from '@/theme/ThemeProvider';

const actualLabel = (set: {
  mode: 'reps' | 'time';
  actualReps?: number | null;
  actualSeconds?: number | null;
  actualWeightKg: number | null;
}): string => {
  const target =
    set.mode === 'reps' ? `${set.actualReps ?? '—'} reps` : `${set.actualSeconds ?? '—'}s`;
  return set.actualWeightKg === null ? target : `${target} @ ${set.actualWeightKg} kg`;
};

export default function WorkoutDetailScreen() {
  const { tokens } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [workout] = useState<Workout | null>(() => (id ? loadWorkout(db, id) : null));

  if (!workout) {
    return (
      <Screen title="Workout">
        <Text style={{ color: tokens.textSecondary }}>Workout not found.</Text>
      </Screen>
    );
  }

  return (
    <Screen
      title={workout.routineName}
      subtitle={`${workout.planName} · ${new Date(workout.startedAt).toLocaleString()}`}
    >
      <Text style={{ color: tokens.textSecondary }}>
        {workoutDurationMinutes(workout)} min · {workoutSetCount(workout)} sets ·{' '}
        {workoutVolumeKg(workout)} kg
      </Text>

      {workout.exercises.map((entry) => {
        const entryKey = `${entry.kind}-${entry.module}-${entry.kind === 'exercise' ? entry.exerciseId : entry.members.map((member) => member.exerciseId).join('-')}`;
        return (
          <View
            key={entryKey}
            style={[styles.card, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
          >
            <Text style={[styles.module, { color: tokens.textSecondary }]}>
              {MODULE_LABELS[entry.module]}
            </Text>
            {entry.kind === 'exercise' ? (
              <>
                <Text style={[styles.title, { color: tokens.textPrimary }]}>{entry.title}</Text>
                {entry.sets.map((set, setIndex) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: read-only snapshot order
                  <Text key={`set-${set.mode}-${setIndex}`} style={{ color: tokens.textSecondary }}>
                    Set {setIndex + 1}: {actualLabel(set)}
                  </Text>
                ))}
              </>
            ) : (
              <>
                <Text style={[styles.title, { color: tokens.textPrimary }]}>
                  {entry.members.map((member) => member.title).join(' + ')}
                </Text>
                <Text style={{ color: tokens.textSecondary }}>
                  {entry.rounds} rounds
                  {entry.restSeconds === null ? '' : ` · rest ${entry.restSeconds}s`}
                </Text>
                {Array.from({ length: entry.rounds }, (_, round) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: rounds are positional
                  <View key={`round-${round}`}>
                    <Text style={{ color: tokens.textSecondary }}>Round {round + 1}</Text>
                    {entry.members.map((member) => {
                      const actual = member.actuals[round];
                      return actual ? (
                        <Text
                          // biome-ignore lint/suspicious/noArrayIndexKey: rounds are positional
                          key={`${member.exerciseId}-${round}`}
                          style={{ color: tokens.textSecondary }}
                        >
                          {member.title}: {actualLabel(actual)}
                        </Text>
                      ) : null;
                    })}
                  </View>
                ))}
              </>
            )}
          </View>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    padding: 14,
  },
  module: {
    fontSize: 11,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
});
