import type { Exercise } from '@spotter/domain';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Switch, Text } from 'react-native';
import { ExerciseRow } from '@/components/exercises/ExerciseRow';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/ui/Card';
import { ListRow } from '@/components/ui/ListRow';
import { TextField } from '@/components/ui/TextField';
import { db } from '@/db/client';
import { listExercises } from '@/db/exercises';
import { useTheme } from '@/theme/ThemeProvider';

export default function ExercisesScreen() {
  const { tokens } = useTheme();
  const [includeArchived, setIncludeArchived] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState('');

  useFocusEffect(
    useCallback(() => {
      setExercises(listExercises(db, { includeArchived }));
    }, [includeArchived]),
  );

  const query = search.trim().toLocaleLowerCase();
  const matches = exercises.filter((exercise) =>
    exercise.title.toLocaleLowerCase().includes(query),
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

      <TextField
        accessibilityLabel="Search exercises"
        onChangeText={setSearch}
        placeholder="Search exercises"
        value={search}
      />

      {exercises.length === 0 ? (
        <Text style={{ color: tokens.textSecondary }}>
          {includeArchived
            ? 'No Exercises yet.'
            : 'No active Exercises. Create one to get started.'}
        </Text>
      ) : matches.length === 0 ? (
        <Text style={{ color: tokens.textSecondary }}>No Exercises match that search.</Text>
      ) : (
        matches.map((exercise) => (
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
