import type { Plan, Routine } from '@spotter/domain';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { PrimaryButton } from '@/components/PrimaryButton';
import { RoutineCard } from '@/components/plans/RoutineCard';
import { Screen } from '@/components/Screen';
import { Banner } from '@/components/ui/Banner';
import { Chip } from '@/components/ui/Chip';
import { PressableText } from '@/components/ui/PressableText';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { db } from '@/db/client';
import { listPlans } from '@/db/plans';
import { cancelWorkoutSession, loadWorkoutDraft, startWorkoutSession } from '@/db/workoutSession';
import { isRoutineStartable } from '@/lib/authoring';
import { useTheme } from '@/theme/ThemeProvider';

export default function HomeScreen() {
  const { tokens } = useTheme();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [hasDraft, setHasDraft] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const nextPlans = listPlans(db);
      setPlans(nextPlans);
      setSelectedPlanId((current) => {
        if (current && nextPlans.some((plan) => plan.id === current)) return current;
        return nextPlans[0]?.id ?? null;
      });
      setHasDraft(loadWorkoutDraft() !== null);
    }, []),
  );

  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId);

  const start = (plan: Plan, routine: Routine) => {
    if (hasDraft || loadWorkoutDraft()) {
      setHasDraft(true);
      return;
    }
    if (!isRoutineStartable(routine)) return;
    startWorkoutSession(plan, routine);
    router.push('/workout');
  };

  const cancelDraft = () => {
    Alert.alert('Cancel workout?', 'The draft is discarded entirely.', [
      { text: 'Keep editing', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          cancelWorkoutSession();
          setHasDraft(false);
        },
      },
    ]);
  };

  return (
    <Screen>
      {hasDraft ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Banner onPress={() => router.push('/workout')}>Workout in progress — continue</Banner>
          </View>
          <PressableText label="Cancel" tone="danger" onPress={cancelDraft} />
        </View>
      ) : null}

      {plans.length === 0 ? (
        <Text style={{ color: tokens.textSecondary }}>No Plans yet. Add one from Plans.</Text>
      ) : (
        <>
          <SectionHeader
            title="Plan"
            supportingText={selectedPlan ? undefined : 'Select a Plan to see its Routines.'}
          />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {plans.map((plan) => (
              <Chip
                key={plan.id}
                label={plan.name}
                selected={selectedPlanId === plan.id}
                onPress={() => setSelectedPlanId(plan.id)}
              />
            ))}
          </View>
        </>
      )}

      {selectedPlan ? (
        selectedPlan.routines.length === 0 ? (
          <Text style={{ color: tokens.textSecondary }}>
            No Routines in this Plan yet. Add one from Plans.
          </Text>
        ) : (
          selectedPlan.routines.map((routine) => {
            const startable = isRoutineStartable(routine);
            return (
              <RoutineCard key={routine.id} title={routine.name} subtitle={selectedPlan.name}>
                {!startable ? (
                  <Text style={{ color: tokens.textSecondary }}>
                    {routine.active ? 'Empty — add items to start' : 'Inactive'}
                  </Text>
                ) : (
                  <PrimaryButton
                    label="Start workout"
                    disabled={hasDraft}
                    onPress={() => start(selectedPlan, routine)}
                  />
                )}
              </RoutineCard>
            );
          })
        )
      ) : null}
    </Screen>
  );
}
