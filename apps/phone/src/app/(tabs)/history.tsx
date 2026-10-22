import type { Workout } from '@spotter/domain';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { db } from '@/db/client';
import { listWorkouts } from '@/db/workouts';
import { workoutDurationMinutes, workoutSetCount, workoutVolumeKg } from '@/lib/workout';
import { useTheme } from '@/theme/ThemeProvider';

export default function HistoryScreen() {
  const { tokens } = useTheme();
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  useFocusEffect(
    useCallback(() => {
      setWorkouts(listWorkouts(db));
    }, []),
  );

  return (
    <Screen title="History" subtitle="Saved Workouts, newest first.">
      <PrimaryButton label="Progression" onPress={() => router.push('/progression')} />
      {workouts.length === 0 ? (
        <Text style={{ color: tokens.textSecondary }}>No saved Workouts yet.</Text>
      ) : (
        workouts.map((workout) => (
          <Pressable
            key={workout.workoutId}
            accessibilityRole="button"
            onPress={() =>
              router.push({ pathname: '/history/[id]', params: { id: workout.workoutId } })
            }
            style={[styles.card, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
          >
            <Text style={[styles.title, { color: tokens.textPrimary }]}>{workout.routineName}</Text>
            <Text style={{ color: tokens.textSecondary }}>{workout.planName}</Text>
            <Text style={{ color: tokens.textSecondary }}>
              {new Date(workout.startedAt).toLocaleString()} · {workoutDurationMinutes(workout)} min
              · {workoutSetCount(workout)} sets · {workoutVolumeKg(workout)} kg
            </Text>
          </Pressable>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    gap: 3,
    padding: 14,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
});
