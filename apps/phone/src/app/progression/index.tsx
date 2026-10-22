import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Screen } from '@/components/Screen';
import { db } from '@/db/client';
import { listWorkouts } from '@/db/workouts';
import { type ExerciseOption, loggedExercises } from '@/lib/progression';
import { useTheme } from '@/theme/ThemeProvider';

export default function ProgressionListScreen() {
  const { tokens } = useTheme();
  const [options, setOptions] = useState<ExerciseOption[]>([]);

  useFocusEffect(
    useCallback(() => {
      setOptions(loggedExercises(listWorkouts(db)));
    }, []),
  );

  return (
    <Screen title="Progression" subtitle="Weight and volume over time, grouped by Exercise.">
      {options.length === 0 ? (
        <Text style={{ color: tokens.textSecondary }}>
          Save a Workout to start building progression.
        </Text>
      ) : (
        options.map((option) => (
          <Pressable
            key={option.exerciseId}
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: '/progression/[exerciseId]',
                params: { exerciseId: option.exerciseId },
              })
            }
            style={[styles.card, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
          >
            <Text style={{ color: tokens.textPrimary, flex: 1, fontWeight: '600' }}>
              {option.title}
            </Text>
            <Text style={{ color: tokens.textSecondary }}>{option.workoutCount} logs</Text>
          </Pressable>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    padding: 14,
  },
});
