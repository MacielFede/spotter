import { type Plan, PlanSchema, type Routine } from '@spotter/domain';
import { router, useFocusEffect, useLocalSearchParams, usePreventRemove } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';
import { PrimaryButton } from '@/components/PrimaryButton';
import { RoutineCard } from '@/components/plans/RoutineCard';
import { Screen } from '@/components/Screen';
import { PressableText } from '@/components/ui/PressableText';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useSnackbar } from '@/components/ui/SnackbarProvider';
import { TextField } from '@/components/ui/TextField';
import { db } from '@/db/client';
import { loadActiveWorkout } from '@/db/draft';
import { saveExercise } from '@/db/exercises';
import { deletePlan, loadPlan, savePlan } from '@/db/plans';
import { useScreenHeader } from '@/hooks/useScreenHeader';
import { duplicatePlan, emptyRoutine } from '@/lib/authoring';
import { commitPlanImport } from '@/lib/interop';
import { newUuidV7 } from '@/lib/newUuid';
import {
  clearPlanImportDraft,
  getPlanDraftKind,
  getPlanImportDraft,
  PLAN_DRAFT_ID,
  startPlanDuplicateDraft,
  updatePlanImportDraft,
} from '@/lib/planImportDraft';
import { useTheme } from '@/theme/ThemeProvider';

export default function PlanDetailScreen() {
  const { tokens } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isDraft = id === PLAN_DRAFT_ID;
  const draftKind = isDraft ? getPlanDraftKind() : null;
  const [plan, setPlan] = useState<Plan | null>(null);
  const [name, setName] = useState('');
  const [unsavedDraft, setUnsavedDraft] = useState(isDraft);
  const { showError } = useSnackbar();

  const reload = useCallback(() => {
    if (!id) return;
    const loaded = isDraft ? getPlanImportDraft()?.plan : loadPlan(db, id);
    setPlan(loaded ?? null);
    if (loaded) setName(loaded.name);
  }, [id, isDraft]);

  useFocusEffect(reload);
  useScreenHeader(name.trim() || 'Plan');

  const disablePrevention = usePreventRemove(unsavedDraft, ({ repeat }) => {
    const isDuplicate = draftKind === 'duplicate';
    Alert.alert(
      isDuplicate ? 'Cancel duplicate?' : 'Cancel import?',
      isDuplicate
        ? 'This duplicate Plan will be discarded. The original is unchanged.'
        : 'The imported Plan will be discarded.',
      [
        { text: 'Keep editing', style: 'cancel' },
        {
          text: isDuplicate ? 'Cancel duplicate' : 'Cancel import',
          style: 'destructive',
          onPress: () => {
            clearPlanImportDraft();
            setUnsavedDraft(false);
            repeat();
          },
        },
      ],
    );
  });

  if (!plan) {
    return (
      <Screen>
        <Text style={{ color: tokens.textSecondary }}>Plan not found.</Text>
      </Screen>
    );
  }

  const routineEditorPlanId = isDraft ? PLAN_DRAFT_ID : plan.id;

  const persist = (next: Plan) => {
    if (isDraft) updatePlanImportDraft(next);
    else savePlan(db, next);
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
      params: { planId: routineEditorPlanId, routineId: routine.id },
    });
  };

  const toggleRoutine = (routine: Routine, active: boolean) => {
    if (!active && loadActiveWorkout(db)) {
      showError('Finish or cancel the workout before deactivating a Routine.');
      return;
    }
    persist({
      ...plan,
      routines: plan.routines.map((item) => (item.id === routine.id ? { ...item, active } : item)),
    });
  };

  const saveDraft = () => {
    const draft = getPlanImportDraft();
    const kind = getPlanDraftKind();
    if (!draft || !kind) return;
    const parsed = PlanSchema.safeParse({ ...plan, name: name.trim() });
    if (!parsed.success) {
      showError(`Cannot save plan: ${parsed.error.issues[0]?.message ?? 'Invalid plan.'}`);
      return;
    }
    if (kind === 'import') {
      commitPlanImport(
        { ...draft, plan: parsed.data },
        (exercise) => saveExercise(db, exercise),
        (next) => savePlan(db, next),
      );
    } else {
      savePlan(db, parsed.data);
    }
    clearPlanImportDraft();
    disablePrevention();
    setUnsavedDraft(false);
    Alert.alert(
      kind === 'duplicate' ? 'Plan duplicated' : 'Imported',
      kind === 'duplicate'
        ? 'The duplicate Plan and its changes were saved.'
        : 'The Plan and its Exercises were saved.',
    );
    router.back();
  };

  const createDuplicate = () => {
    const source = name.trim() ? { ...plan, name: name.trim() } : plan;
    const duplicate = duplicatePlan(source, newUuidV7);
    startPlanDuplicateDraft(duplicate);
    router.push({ pathname: '/plan/[id]', params: { id: PLAN_DRAFT_ID } });
  };

  const removePlan = () => {
    if (loadActiveWorkout(db)) {
      showError('Finish or cancel the workout before deleting a Plan.');
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
      {isDraft ? (
        <Text style={{ color: tokens.textSecondary }}>
          {draftKind === 'duplicate'
            ? 'Duplicate Plan. Save to keep this copy; going back discards it. The original is unchanged.'
            : 'Imported Plan. Save it to keep it; going back discards it.'}
        </Text>
      ) : null}
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
              params: { planId: routineEditorPlanId, routineId: routine.id },
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

      {isDraft ? (
        <PrimaryButton label="Save plan" onPress={saveDraft} />
      ) : (
        <View style={styles.planActions}>
          <PressableText
            accessibilityHint="Opens an editable copy without changing this Plan."
            label="Duplicate plan"
            onPress={createDuplicate}
          />
          <PressableText label="Delete plan" onPress={removePlan} tone="danger" />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  planActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
});
