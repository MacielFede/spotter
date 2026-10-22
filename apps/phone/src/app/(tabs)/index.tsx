import type { Plan, Routine } from '@spotter/domain';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { db } from '@/db/client';
import { listPlans } from '@/db/plans';
import { loadWorkoutDraft, startWorkoutSession } from '@/db/workoutSession';
import { isRoutineStartable } from '@/lib/authoring';
import { useTheme } from '@/theme/ThemeProvider';

interface Entry {
  plan: Plan;
  routine: Routine;
}

export default function HomeScreen() {
  const { tokens } = useTheme();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [filter, setFilter] = useState<string | null>(null);
  const [hasDraft, setHasDraft] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setPlans(listPlans(db));
      setHasDraft(loadWorkoutDraft() !== null);
    }, []),
  );

  const entries: Entry[] = plans
    .filter((plan) => filter === null || plan.id === filter)
    .flatMap((plan) => plan.routines.map((routine) => ({ plan, routine })));

  const start = (plan: Plan, routine: Routine) => {
    if (loadWorkoutDraft()) {
      router.push('/workout');
      return;
    }
    if (!isRoutineStartable(routine)) return;
    startWorkoutSession(plan, routine);
    router.push('/workout');
  };

  return (
    <Screen title="Start" subtitle="Every active Routine across your Plans.">
      {hasDraft ? (
        <Pressable
          onPress={() => router.push('/workout')}
          style={[styles.banner, { backgroundColor: tokens.primary }]}
        >
          <Text style={{ color: tokens.onPrimary, fontWeight: '700' }}>
            Workout in progress — continue
          </Text>
        </Pressable>
      ) : null}

      <View style={styles.filters}>
        <FilterChip label="All plans" selected={filter === null} onPress={() => setFilter(null)} />
        {plans.map((plan) => (
          <FilterChip
            key={plan.id}
            label={plan.name}
            selected={filter === plan.id}
            onPress={() => setFilter(plan.id)}
          />
        ))}
      </View>

      {entries.length === 0 ? (
        <Text style={{ color: tokens.textSecondary }}>No Routines yet. Add one from Plans.</Text>
      ) : (
        entries.map(({ plan, routine }) => {
          const startable = isRoutineStartable(routine);
          return (
            <View
              key={routine.id}
              style={[styles.card, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
            >
              <View style={styles.cardText}>
                <Text style={[styles.title, { color: tokens.textPrimary }]}>{routine.name}</Text>
                <Text style={{ color: tokens.textSecondary }}>{plan.name}</Text>
                {!startable ? (
                  <Text style={{ color: tokens.textSecondary }}>
                    {routine.active ? 'Empty — add items to start' : 'Inactive'}
                  </Text>
                ) : null}
              </View>
              {startable ? (
                <View style={styles.start}>
                  <PrimaryButton
                    label={hasDraft ? 'Continue' : 'Start'}
                    onPress={() => start(plan, routine)}
                  />
                </View>
              ) : (
                <Text style={{ color: tokens.textSecondary }}>Not startable</Text>
              )}
            </View>
          );
        })
      )}
    </Screen>
  );
}

function FilterChip({
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
        {
          backgroundColor: selected ? tokens.primary : tokens.surface,
          borderColor: tokens.border,
        },
      ]}
    >
      <Text style={{ color: selected ? tokens.onPrimary : tokens.textPrimary }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 10,
    padding: 14,
  },
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
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
  start: {
    minWidth: 96,
  },
});
