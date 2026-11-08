import type { Exercise } from '@spotter/domain';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Switch, Text } from 'react-native';
import { ExerciseRow } from '@/components/exercises/ExerciseRow';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/ui/Card';
import { ListRow } from '@/components/ui/ListRow';
import { db } from '@/db/client';
import { listExercises } from '@/db/exercises';
import { useTheme } from '@/theme/ThemeProvider';

export default function ExercisesScreen() {
  const { tokens } = useTheme();
  const [includeArchived, setIncludeArchived] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);

  useFocusEffect(
    useCallback(() => {
      setExercises(listExercises(db, { includeArchived }));
    }, [includeArchived]),
  );

  return (
    <Screen>
      <Text style={{ color: tokens.textSecondary }}>The global library shared by every Plan.</Text>
      <PrimaryButton label="New exercise" onPress={() => router.push('/exercise-editor')} />

      <Card>
        <ListRow
          title="Show archived"
          subtitle="Archived Exercises stay out of authoring pickers but keep existing Routines working."
          trailing={
            <Switch
              value={includeArchived}
              onValueChange={setIncludeArchived}
              trackColor={{ true: tokens.primary, false: tokens.border }}
            />
          }
        />
      </Card>

      {exercises.length === 0 ? (
        <Text style={{ color: tokens.textSecondary }}>
          {includeArchived
            ? 'No Exercises yet.'
            : 'No active Exercises. Create one to get started.'}
        </Text>
      ) : (
        exercises.map((exercise) => (
          <ExerciseRow
            key={exercise.id}
            exercise={exercise}
            onPress={() =>
              router.push({ pathname: '/exercise-editor', params: { id: exercise.id } })
            }
          />
        ))
      )}
    </Screen>
  );
}
