import type { Plan, Routine } from '@spotter/domain';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { db } from '@/db/client';
import { loadActiveWorkout } from '@/db/draft';
import { deletePlan, loadPlan, savePlan } from '@/db/plans';
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

  if (!plan) {
    return (
      <Screen title="Plan">
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
    <Screen title="Plan">
      <Text style={[styles.label, { color: tokens.textSecondary }]}>Name</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        onBlur={rename}
        style={[
          styles.input,
          {
            color: tokens.textPrimary,
            backgroundColor: tokens.surface,
            borderColor: tokens.border,
          },
        ]}
      />

      <Text style={[styles.section, { color: tokens.textPrimary }]}>Routines</Text>
      {plan.routines.map((routine) => (
        <View
          key={routine.id}
          style={[styles.card, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
        >
          <Pressable
            style={styles.routineText}
            onPress={() =>
              router.push({
                pathname: '/routine-editor',
                params: { planId: plan.id, routineId: routine.id },
              })
            }
          >
            <Text style={[styles.routineName, { color: tokens.textPrimary }]}>{routine.name}</Text>
            <Text style={{ color: tokens.textSecondary }}>
              {routine.modules.reduce((count, module) => count + module.items.length, 0)} items
            </Text>
          </Pressable>
          <Switch
            value={routine.active}
            onValueChange={(active) => toggleRoutine(routine, active)}
            trackColor={{ true: tokens.primary, false: tokens.border }}
          />
        </View>
      ))}

      <Pressable onPress={createRoutine} style={[styles.add, { borderColor: tokens.border }]}>
        <Text style={{ color: tokens.primary }}>+ New routine</Text>
      </Pressable>

      <Pressable onPress={removePlan} style={[styles.add, { borderColor: tokens.danger }]}>
        <Text style={{ color: tokens.danger }}>Delete plan</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    textTransform: 'uppercase',
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 18,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  section: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },
  card: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  routineText: {
    flex: 1,
    gap: 2,
  },
  routineName: {
    fontSize: 16,
    fontWeight: '600',
  },
  add: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 12,
  },
});
