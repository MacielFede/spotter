import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Text, View } from 'react-native';
import {
  ProgressionGraph,
  type ProgressionGraphSeries,
} from '@/components/history/ProgressionGraph';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/ui/Card';
import { ListRow } from '@/components/ui/ListRow';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { db } from '@/db/client';
import { listWorkouts } from '@/db/workouts';
import { useScreenHeader } from '@/hooks/useScreenHeader';
import { formatTimer, formatWhen } from '@/lib/formatWhen';
import {
  exerciseLogs,
  loggedExercises,
  repsSeries,
  timeSeries,
  volumeSeries,
  weightSeries,
} from '@/lib/progression';
import { useTheme } from '@/theme/ThemeProvider';

const best = (values: number[]): number | null => (values.length > 0 ? Math.max(...values) : null);

export default function ProgressionDetailScreen() {
  const { tokens } = useTheme();
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();
  const workouts = useMemo(() => listWorkouts(db), []);
  const exercise = useMemo(
    () => loggedExercises(workouts).find((option) => option.exerciseId === exerciseId),
    [exerciseId, workouts],
  );

  useScreenHeader(exercise?.title ?? 'Progression');

  const weight = exerciseId ? weightSeries(workouts, exerciseId) : [];
  const volume = exerciseId ? volumeSeries(workouts, exerciseId) : [];
  const reps = exerciseId ? repsSeries(workouts, exerciseId) : [];
  const time = exerciseId ? timeSeries(workouts, exerciseId) : [];
  const logs = exerciseId ? exerciseLogs(workouts, exerciseId) : [];

  const graphSeries: ProgressionGraphSeries[] = exercise?.usesWeight
    ? [
        { key: 'weight', label: 'Best weight', unit: 'kg', points: weight },
        { key: 'volume', label: 'Volume', unit: 'kg·reps', points: volume },
        ...(exercise.mode === 'time'
          ? [
              {
                key: 'time',
                label: 'Best time',
                unit: 'sec',
                formatValue: formatTimer,
                points: time,
              },
            ]
          : [{ key: 'reps', label: 'Best reps', unit: 'reps', points: reps }]),
      ]
    : exercise?.mode === 'time'
      ? [{ key: 'time', label: 'Best time', unit: 'sec', formatValue: formatTimer, points: time }]
      : [{ key: 'reps', label: 'Best reps', unit: 'reps', points: reps }];

  if (!exercise) {
    return (
      <Screen>
        <Text style={{ color: tokens.textSecondary }}>No saved exercise data was found.</Text>
      </Screen>
    );
  }

  const bestWeight = best(weight.map((point) => point.value));
  const bestVolume = best(volume.map((point) => point.value));
  const bestReps = best(reps.map((point) => point.value));
  const bestTime = best(time.map((point) => point.value));
  const lastPerformed = logs[0]?.startedAt;

  return (
    <Screen>
      {graphSeries.some((series) => series.points.length > 0) ? (
        <ProgressionGraph series={graphSeries} variant="full" />
      ) : (
        <Text style={{ color: tokens.textSecondary }}>No completed sets to chart yet.</Text>
      )}

      <Card>
        <SectionHeader title="Personal records" />
        {exercise.usesWeight && bestWeight !== null ? (
          <ListRow
            title="Best weight"
            trailing={<Text style={{ color: tokens.textPrimary }}>{bestWeight} kg</Text>}
          />
        ) : null}
        {exercise.mode === 'time' && bestTime !== null ? (
          <ListRow
            title="Best time"
            trailing={<Text style={{ color: tokens.textPrimary }}>{formatTimer(bestTime)}</Text>}
          />
        ) : null}
        {exercise.mode === 'reps' && bestReps !== null ? (
          <ListRow
            title="Best reps"
            trailing={<Text style={{ color: tokens.textPrimary }}>{bestReps}</Text>}
          />
        ) : null}
        {exercise.usesWeight && bestVolume !== null ? (
          <ListRow
            title="Best volume"
            trailing={<Text style={{ color: tokens.textPrimary }}>{bestVolume} kg·reps</Text>}
          />
        ) : null}
        <ListRow
          title="Total sessions"
          trailing={<Text style={{ color: tokens.textPrimary }}>{exercise.workoutCount}</Text>}
        />
        <ListRow
          title="Last performed"
          trailing={
            <Text style={{ color: tokens.textPrimary }}>
              {lastPerformed ? formatWhen(lastPerformed) : '—'}
            </Text>
          }
        />
      </Card>

      <SectionHeader title="Workout log" />
      {logs.length === 0 ? (
        <Text style={{ color: tokens.textSecondary }}>No saved sets yet.</Text>
      ) : (
        <View style={{ gap: 8 }}>
          {logs.map((log) => (
            <Card key={log.workoutId}>
              <Text style={{ color: tokens.textPrimary, fontWeight: '700' }}>
                {formatWhen(log.startedAt)}
              </Text>
              {log.sets.map((set, index) => {
                const value =
                  set.mode === 'reps'
                    ? `${set.actualReps ?? '—'} reps`
                    : set.actualSeconds === null
                      ? '—'
                      : formatTimer(set.actualSeconds);
                const actual =
                  set.usesWeight && set.actualWeightKg !== null
                    ? `${value} @ ${set.actualWeightKg} kg`
                    : value;
                return (
                  // biome-ignore lint/suspicious/noArrayIndexKey: saved workout set order is immutable
                  <Text key={`${log.workoutId}-${index}`} style={{ color: tokens.textSecondary }}>
                    Set {index + 1}: {actual}
                  </Text>
                );
              })}
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}
