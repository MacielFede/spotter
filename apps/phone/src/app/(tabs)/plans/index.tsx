import type { Plan } from '@spotter/domain';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Text } from 'react-native';
import { PrimaryButton } from '@/components/PrimaryButton';
import { PlanCard } from '@/components/plans/PlanCard';
import { Screen } from '@/components/Screen';
import { db } from '@/db/client';
import { listPlans, savePlan } from '@/db/plans';
import { newUuidV7 } from '@/lib/newUuid';
import { useTheme } from '@/theme/ThemeProvider';

export default function PlansScreen() {
  const { tokens } = useTheme();
  const [plans, setPlans] = useState<Plan[]>([]);

  useFocusEffect(
    useCallback(() => {
      setPlans(listPlans(db));
    }, []),
  );

  const createPlan = () => {
    const plan: Plan = { id: newUuidV7(), name: 'New Plan', routines: [] };
    savePlan(db, plan);
    router.push({ pathname: '/plan/[id]', params: { id: plan.id } });
  };

  return (
    <Screen>
      <Text style={{ color: tokens.textSecondary }}>
        Author Routines and choose what runs on the watch.
      </Text>
      <PrimaryButton label="New plan" onPress={createPlan} />

      {plans.length === 0 ? (
        <Text style={{ color: tokens.textSecondary }}>No Plans yet.</Text>
      ) : (
        plans.map((plan) => (
          <PlanCard
            key={plan.id}
            onPress={() => router.push({ pathname: '/plan/[id]', params: { id: plan.id } })}
            plan={plan}
          />
        ))
      )}
    </Screen>
  );
}
