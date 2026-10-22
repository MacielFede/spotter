import type { Plan } from '@spotter/domain';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { PrimaryButton } from '@/components/PrimaryButton';
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
    <Screen title="Plans" subtitle="Author Routines and choose what runs on the watch.">
      <PrimaryButton label="New plan" onPress={createPlan} />

      {plans.length === 0 ? (
        <Text style={{ color: tokens.textSecondary }}>No Plans yet.</Text>
      ) : (
        plans.map((plan) => (
          <Pressable
            key={plan.id}
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/plan/[id]', params: { id: plan.id } })}
            style={[styles.card, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
          >
            <Text style={[styles.title, { color: tokens.textPrimary }]}>{plan.name}</Text>
            <Text style={{ color: tokens.textSecondary }}>
              {plan.routines.length} {plan.routines.length === 1 ? 'Routine' : 'Routines'}
            </Text>
          </Pressable>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    padding: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
});
