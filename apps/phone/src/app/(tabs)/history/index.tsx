import type { Workout } from '@spotter/domain';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { ExerciseAccordionItem } from '@/components/history/ExerciseAccordionItem';
import { WorkoutRow } from '@/components/history/WorkoutRow';
import { Screen } from '@/components/Screen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { TextField } from '@/components/ui/TextField';
import { db } from '@/db/client';
import { listWorkouts } from '@/db/workouts';
import { loggedExercises } from '@/lib/progression';
import { useTheme } from '@/theme/ThemeProvider';

type HistoryTab = 'workouts' | 'exercises';

const tabs = [
  { value: 'workouts', label: 'Workouts' },
  { value: 'exercises', label: 'Exercises' },
] as const;

export default function HistoryScreen() {
  const { tokens } = useTheme();
  const [tab, setTab] = useState<HistoryTab>('workouts');
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [search, setSearch] = useState('');
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setWorkouts(listWorkouts(db));
    }, []),
  );

  const options = loggedExercises(workouts).filter((option) =>
    option.title.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()),
  );

  return (
    <Screen>
      <Text style={{ color: tokens.textSecondary }}>
        Saved workouts and the exercises you have logged.
      </Text>
      <SegmentedControl options={[...tabs]} value={tab} onChange={setTab} />

      {tab === 'workouts' ? (
        workouts.length === 0 ? (
          <Text style={{ color: tokens.textSecondary }}>No saved workouts yet.</Text>
        ) : (
          workouts.map((workout) => (
            <WorkoutRow
              key={workout.workoutId}
              onPress={() =>
                router.push({ pathname: '/history/[id]', params: { id: workout.workoutId } })
              }
              workout={workout}
            />
          ))
        )
      ) : (
        <>
          <TextField
            accessibilityLabel="Search exercises"
            onChangeText={setSearch}
            placeholder="Search exercises"
            value={search}
          />
          {options.length === 0 ? (
            <Text style={{ color: tokens.textSecondary }}>
              {search.trim()
                ? 'No logged exercises match that search.'
                : 'Save a workout to build exercise history.'}
            </Text>
          ) : (
            <View style={{ gap: 8 }}>
              {options.map((option) => (
                <ExerciseAccordionItem
                  key={option.exerciseId}
                  expanded={expandedExercise === option.exerciseId}
                  onOpenDetails={() =>
                    router.push({
                      pathname: '/progression/[exerciseId]',
                      params: { exerciseId: option.exerciseId },
                    })
                  }
                  onToggle={() =>
                    setExpandedExercise((current) =>
                      current === option.exerciseId ? null : option.exerciseId,
                    )
                  }
                  option={option}
                  workouts={workouts}
                />
              ))}
            </View>
          )}
        </>
      )}
    </Screen>
  );
}
