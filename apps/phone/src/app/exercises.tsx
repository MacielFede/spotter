import type { Exercise } from '@spotter/domain';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { LinkifiedText } from '@/components/LinkifiedText';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
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
    <Screen title="Exercises" subtitle="The global library shared by every Plan.">
      <View style={styles.actions}>
        <PrimaryButton label="New exercise" onPress={() => router.push('/exercise-editor')} />
      </View>

      <View style={styles.filter}>
        <View style={styles.filterText}>
          <Text style={[styles.filterLabel, { color: tokens.textPrimary }]}>Show archived</Text>
          <Text style={[styles.filterHint, { color: tokens.textSecondary }]}>
            Archived Exercises stay out of authoring pickers but keep working in existing Routines.
          </Text>
        </View>
        <Switch
          value={includeArchived}
          onValueChange={setIncludeArchived}
          trackColor={{ true: tokens.primary, false: tokens.border }}
        />
      </View>

      {exercises.length === 0 ? (
        <Text style={{ color: tokens.textSecondary }}>
          {includeArchived
            ? 'No Exercises yet.'
            : 'No active Exercises. Create one to get started.'}
        </Text>
      ) : (
        exercises.map((exercise) => (
          <Pressable
            key={exercise.id}
            accessibilityRole="button"
            onPress={() =>
              router.push({ pathname: '/exercise-editor', params: { id: exercise.id } })
            }
            style={[styles.card, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
          >
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: tokens.textPrimary }]}>
                {exercise.title}
              </Text>
              {exercise.archived ? (
                <Text
                  style={[
                    styles.badge,
                    { color: tokens.textSecondary, borderColor: tokens.border },
                  ]}
                >
                  Archived
                </Text>
              ) : null}
            </View>
            {exercise.description ? <LinkifiedText description={exercise.description} /> : null}
          </Pressable>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: {
    marginBottom: 4,
  },
  filter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  filterText: {
    flex: 1,
    gap: 2,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  filterHint: {
    fontSize: 13,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
  },
  badge: {
    borderWidth: 1,
    borderRadius: 999,
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 2,
    textTransform: 'uppercase',
  },
});
