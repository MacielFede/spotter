import type { Plan, Routine } from '@spotter/domain';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { PrimaryButton } from '@/components/PrimaryButton';
import { RoutineCard } from '@/components/plans/RoutineCard';
import { Screen } from '@/components/Screen';
import { Banner } from '@/components/ui/Banner';
import { Chip } from '@/components/ui/Chip';
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
    <Screen>
      <Text style={{ color: tokens.textSecondary }}>Every active Routine across your Plans.</Text>

      {hasDraft ? (
        <Banner onPress={() => router.push('/workout')}>Workout in progress — continue</Banner>
      ) : null}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Chip label="All plans" selected={filter === null} onPress={() => setFilter(null)} />
        {plans.map((plan) => (
          <Chip
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
            <RoutineCard key={routine.id} title={routine.name} subtitle={plan.name}>
              {!startable ? (
                <Text style={{ color: tokens.textSecondary }}>
                  {routine.active ? 'Empty — add items to start' : 'Inactive'}
                </Text>
              ) : (
                <PrimaryButton
                  label={hasDraft ? 'Continue workout' : 'Start workout'}
                  onPress={() => start(plan, routine)}
                />
              )}
            </RoutineCard>
          );
        })
      )}
    </Screen>
  );
}
