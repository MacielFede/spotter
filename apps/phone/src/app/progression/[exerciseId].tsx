import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { db } from '@/db/client';
import { listWorkouts } from '@/db/workouts';
import { type ProgressionPoint, volumeSeries, weightSeries } from '@/lib/progression';
import { useTheme } from '@/theme/ThemeProvider';

const titleFor = (points: ProgressionPoint[]): string => {
  const planNames = [...new Set(points.map((point) => point.planName))];
  return planNames.length > 1 ? 'Across Plans' : (planNames[0] ?? 'No data');
};

export default function ProgressionDetailScreen() {
  const { tokens } = useTheme();
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();
  const workouts = useMemo(() => listWorkouts(db), []);
  const plans = useMemo(() => {
    const map = new Map<string, string>();
    for (const workout of workouts) map.set(workout.planId, workout.planName);
    return [...map.entries()];
  }, [workouts]);
  const [planId, setPlanId] = useState<string | null>(null);

  const weight = exerciseId ? weightSeries(workouts, exerciseId, planId) : [];
  const volume = exerciseId ? volumeSeries(workouts, exerciseId, planId) : [];

  return (
    <Screen title="Progression">
      <View style={styles.filters}>
        <Chip label="All plans" selected={planId === null} onPress={() => setPlanId(null)} />
        {plans.map(([id, name]) => (
          <Chip key={id} label={name} selected={planId === id} onPress={() => setPlanId(id)} />
        ))}
      </View>

      <Chart title={`Weight (kg) · ${titleFor(weight)}`} points={weight} unit="kg" />
      <Chart title={`Volume (kg) · ${titleFor(volume)}`} points={volume} unit="kg" />

      {weight.length === 0 && volume.length === 0 ? (
        <Text style={{ color: tokens.textSecondary }}>
          No weighted rep Sets logged for this Exercise yet. Time-only and bodyweight work does not
          chart.
        </Text>
      ) : null}
    </Screen>
  );
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { tokens } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        { backgroundColor: selected ? tokens.primary : tokens.surface, borderColor: tokens.border },
      ]}
    >
      <Text style={{ color: selected ? tokens.onPrimary : tokens.textPrimary }}>{label}</Text>
    </Pressable>
  );
}

function Chart({
  title,
  points,
  unit,
}: {
  title: string;
  points: ProgressionPoint[];
  unit: string;
}) {
  const { tokens } = useTheme();
  const max = Math.max(...points.map((point) => point.value), 1);
  return (
    <View style={[styles.card, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
      <Text style={[styles.title, { color: tokens.textPrimary }]}>{title}</Text>
      {points.length === 0 ? (
        <Text style={{ color: tokens.textSecondary }}>No points.</Text>
      ) : (
        points.map((point) => (
          <View key={point.workoutId} style={styles.barRow}>
            <Text style={[styles.date, { color: tokens.textSecondary }]}>
              {new Date(point.startedAt).toLocaleDateString()}
            </Text>
            <View style={[styles.barTrack, { backgroundColor: tokens.border }]}>
              <View
                style={[
                  styles.bar,
                  {
                    backgroundColor: tokens.primary,
                    width: `${Math.max(4, (point.value / max) * 100)}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.value, { color: tokens.textPrimary }]}>
              {point.value} {unit}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    padding: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  barRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  date: {
    fontSize: 11,
    width: 70,
  },
  barTrack: {
    borderRadius: 4,
    flex: 1,
    height: 12,
    overflow: 'hidden',
  },
  bar: {
    borderRadius: 4,
    height: 12,
  },
  value: {
    fontSize: 12,
    textAlign: 'right',
    width: 78,
  },
});
