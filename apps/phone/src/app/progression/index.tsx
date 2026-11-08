import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Text } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/ui/Card';
import { ListRow } from '@/components/ui/ListRow';
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
    <Screen>
      <Text style={{ color: tokens.textSecondary }}>Progress over time, grouped by Exercise.</Text>
      {options.length === 0 ? (
        <Text style={{ color: tokens.textSecondary }}>
          Save a Workout to start building progression.
        </Text>
      ) : (
        options.map((option) => (
          <Card key={option.exerciseId}>
            <ListRow
              onPress={() =>
                router.push({
                  pathname: '/progression/[exerciseId]',
                  params: { exerciseId: option.exerciseId },
                })
              }
              subtitle={`${option.workoutCount} ${option.workoutCount === 1 ? 'log' : 'logs'}`}
              title={option.title}
            />
          </Card>
        ))
      )}
    </Screen>
  );
}
