import type { Plan, Routine } from '@spotter/domain';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Switch, Text } from 'react-native';
import { RoutineCard } from '@/components/plans/RoutineCard';
import { Screen } from '@/components/Screen';
import { PressableText } from '@/components/ui/PressableText';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { TextField } from '@/components/ui/TextField';
import { db } from '@/db/client';
import { loadActiveWorkout } from '@/db/draft';
import { deletePlan, loadPlan, savePlan } from '@/db/plans';
import { useScreenHeader } from '@/hooks/useScreenHeader';
import { emptyRoutine } from '@/lib/authoring';
import { newUuidV7 } from '@/lib/newUuid';
import { useTheme } from '@/theme/ThemeProvider';

export default function PlanDetailScreen() {
  const { tokens } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [name, setName] = useState('');

  const reload = useCallback(() => {
    if (!id) return;
    const loaded = loadPlan(db, id);
    setPlan(loaded);
    if (loaded) setName(loaded.name);
  }, [id]);

  useFocusEffect(reload);
  useScreenHeader(name.trim() || 'Plan');

  if (!plan) {
    return (
      <Screen>
        <Text style={{ color: tokens.textSecondary }}>Plan not found.</Text>
      </Screen>
    );
  }

  const persist = (next: Plan) => {
    savePlan(db, next);
    setPlan(next);
  };

  const rename = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    persist({ ...plan, name: trimmed });
  };

  const createRoutine = () => {
    const routine = emptyRoutine(newUuidV7(), 'New Routine');
    persist({ ...plan, routines: [...plan.routines, routine] });
    router.push({
      pathname: '/routine-editor',
      params: { planId: plan.id, routineId: routine.id },
    });
  };

  const toggleRoutine = (routine: Routine, active: boolean) => {
    if (!active && loadActiveWorkout(db)) {
      Alert.alert(
        'Workout in progress',
        'Finish or cancel the workout before deactivating a Routine.',
      );
      return;
    }
    persist({
      ...plan,
      routines: plan.routines.map((item) => (item.id === routine.id ? { ...item, active } : item)),
    });
  };

  const removePlan = () => {
    if (loadActiveWorkout(db)) {
      Alert.alert('Workout in progress', 'Finish or cancel the workout before deleting a Plan.');
      return;
    }
    Alert.alert('Delete Plan?', 'Routines go with it. Exercise history and saved Workouts stay.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deletePlan(db, plan.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <Screen>
      <TextField label="Name" onBlur={rename} onChangeText={setName} value={name} />

      <SectionHeader
        title="Routines"
        action={<PressableText label="+ New routine" onPress={createRoutine} />}
      />
      {plan.routines.map((routine) => (
        <RoutineCard
          key={routine.id}
          title={routine.name}
          subtitle={`${routine.modules.reduce((count, module) => count + module.items.length, 0)} items`}
          onPress={() =>
            router.push({
              pathname: '/routine-editor',
              params: { planId: plan.id, routineId: routine.id },
            })
          }
          trailing={
            <Switch
              value={routine.active}
              onValueChange={(active) => toggleRoutine(routine, active)}
              trackColor={{ true: tokens.primary, false: tokens.border }}
            />
          }
        />
      ))}

      <PressableText label="Delete plan" onPress={removePlan} tone="danger" />
    </Screen>
  );
}
