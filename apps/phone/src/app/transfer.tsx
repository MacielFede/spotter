import type { Plan } from '@spotter/domain';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { db } from '@/db/client';
import { listExercises, saveExercise } from '@/db/exercises';
import { listPlans, savePlan } from '@/db/plans';
import { listWorkouts, saveWorkout } from '@/db/workouts';
import {
  buildPlanExport,
  commitPlanImport,
  commitWorkoutsImport,
  exportWorkoutsCsv,
  type PlanImportPreview,
  preparePlanImport,
  prepareWorkoutsCsvImport,
  serializePlanExport,
  type WorkoutImportPreview,
} from '@/lib/interop';
import { LOGS_TEMPLATE, PLAN_TEMPLATE } from '@/lib/templates';
import { useTheme } from '@/theme/ThemeProvider';

export default function TransferScreen() {
  const { tokens } = useTheme();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [planText, setPlanText] = useState('');
  const [logsText, setLogsText] = useState('');
  const [planPreview, setPlanPreview] = useState<PlanImportPreview | null>(null);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [editTitle, setEditTitle] = useState('');
  const [logsPreview, setLogsPreview] = useState<WorkoutImportPreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const loaded = listPlans(db);
      setPlans(loaded);
      setSelectedPlanId((current) => current ?? loaded[0]?.id ?? null);
    }, []),
  );

  const share = (message: string, title: string) => {
    Share.share({ message, title }).catch(() => undefined);
  };

  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) ?? null;

  const exportPlan = () => {
    if (!selectedPlan) return;
    try {
      const data = buildPlanExport(selectedPlan, listExercises(db, { includeArchived: true }));
      share(serializePlanExport(data), `${selectedPlan.name}.json`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not export Plan.');
    }
  };

  const exportLogs = () => share(exportWorkoutsCsv(listWorkouts(db)), 'spotter-logs.csv');

  const previewPlan = () => {
    try {
      setError(null);
      const preview = preparePlanImport(planText, listExercises(db, { includeArchived: true }));
      setPlanPreview(preview);
      setReviewIndex(0);
      setEditTitle(preview.exerciseChanges[0]?.imported.title ?? '');
    } catch (cause) {
      setPlanPreview(null);
      setError(cause instanceof Error ? cause.message : 'Could not read Plan JSON.');
    }
  };

  const commitPlanWith = (preview: PlanImportPreview) => {
    commitPlanImport(
      preview,
      (exercise) => saveExercise(db, exercise),
      (plan) => savePlan(db, plan),
    );
    setPlanPreview(null);
    setPlanText('');
    Alert.alert('Imported', 'The Plan and its Exercises were upserted.');
  };

  const previewLogs = () => {
    try {
      setError(null);
      setLogsPreview(prepareWorkoutsCsvImport(logsText, listWorkouts(db)));
    } catch (cause) {
      setLogsPreview(null);
      setError(cause instanceof Error ? cause.message : 'Could not read CSV.');
    }
  };

  const commitLogs = () => {
    if (!logsPreview) return;
    const count = commitWorkoutsImport(logsPreview, (workout) => saveWorkout(db, workout));
    setLogsPreview(null);
    setLogsText('');
    Alert.alert('Imported', `${count} Workouts restored. Existing logs were kept.`);
  };

  const review = planPreview?.exerciseChanges[reviewIndex];

  return (
    <Screen title="Import / Export" subtitle="Files are version-locked and self-contained.">
      {error ? <Text style={{ color: tokens.danger }}>{error}</Text> : null}

      <Text style={[styles.section, { color: tokens.textPrimary }]}>Export Plan JSON</Text>
      <View style={styles.chips}>
        {plans.map((plan) => (
          <Pressable
            key={plan.id}
            onPress={() => setSelectedPlanId(plan.id)}
            style={[
              styles.chip,
              {
                backgroundColor: selectedPlanId === plan.id ? tokens.primary : tokens.surface,
                borderColor: tokens.border,
              },
            ]}
          >
            <Text
              style={{
                color: selectedPlanId === plan.id ? tokens.onPrimary : tokens.textPrimary,
              }}
            >
              {plan.name}
            </Text>
          </Pressable>
        ))}
      </View>
      <PrimaryButton label="Share Plan JSON" onPress={exportPlan} disabled={!selectedPlan} />

      <Text style={[styles.section, { color: tokens.textPrimary }]}>Export logs CSV</Text>
      <PrimaryButton label="Share logs CSV" onPress={exportLogs} />

      <Text style={[styles.section, { color: tokens.textPrimary }]}>Templates</Text>
      <View style={styles.chips}>
        <Pressable onPress={() => share(PLAN_TEMPLATE, 'plan.template.json')}>
          <Text style={{ color: tokens.primary }}>Share Plan template</Text>
        </Pressable>
        <Pressable onPress={() => share(LOGS_TEMPLATE, 'logs.template.csv')}>
          <Text style={{ color: tokens.primary }}>Share logs template</Text>
        </Pressable>
      </View>

      <Text style={[styles.section, { color: tokens.textPrimary }]}>Import Plan JSON</Text>
      <TextInput
        value={planText}
        onChangeText={setPlanText}
        placeholder="Paste a Plan JSON file"
        placeholderTextColor={tokens.textSecondary}
        multiline
        style={[
          styles.input,
          {
            color: tokens.textPrimary,
            borderColor: tokens.border,
            backgroundColor: tokens.surface,
          },
        ]}
      />
      <PrimaryButton label="Preview import" onPress={previewPlan} disabled={!planText.trim()} />

      {planPreview && !review ? (
        <View
          style={[styles.card, { borderColor: tokens.border, backgroundColor: tokens.surface }]}
        >
          <Text style={{ color: tokens.textPrimary }}>
            No conflicting Exercises — the Plan is ready to import.
          </Text>
          <Pressable onPress={() => commitPlanWith(planPreview)}>
            <Text style={{ color: tokens.primary }}>Commit import</Text>
          </Pressable>
        </View>
      ) : null}

      {planPreview && review ? (
        <View
          style={[styles.card, { borderColor: tokens.border, backgroundColor: tokens.surface }]}
        >
          <Text style={[styles.cardTitle, { color: tokens.textPrimary }]}>
            {reviewIndex + 1} / {planPreview.exerciseChanges.length} · {review.mode}
          </Text>
          {review.mode === 'merge' ? (
            <Text style={{ color: tokens.textPrimary }}>Imported: {review.imported.title}</Text>
          ) : (
            <TextInput
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="Title"
              placeholderTextColor={tokens.textSecondary}
              style={[
                styles.input,
                styles.titleInput,
                {
                  color: tokens.textPrimary,
                  borderColor: tokens.border,
                  backgroundColor: tokens.background,
                },
              ]}
            />
          )}
          {review.existing ? (
            <Text style={{ color: tokens.textSecondary }}>Existing: {review.existing.title}</Text>
          ) : null}
          {review.mode === 'merge' ? (
            <Text style={{ color: tokens.textSecondary }}>
              Title match — references are remapped to the existing Exercise; its content is kept.
            </Text>
          ) : null}
          <View style={styles.actions}>
            <Pressable
              onPress={() => {
                const trimmed = editTitle.trim();
                const updated: PlanImportPreview = {
                  ...planPreview,
                  exerciseChanges: planPreview.exerciseChanges.map((change, index) =>
                    index === reviewIndex && trimmed
                      ? { ...change, imported: { ...change.imported, title: trimmed } }
                      : change,
                  ),
                };
                setPlanPreview(updated);
                if (reviewIndex + 1 >= updated.exerciseChanges.length) {
                  commitPlanWith(updated);
                  return;
                }
                const nextIndex = reviewIndex + 1;
                setReviewIndex(nextIndex);
                setEditTitle(updated.exerciseChanges[nextIndex]?.imported.title ?? '');
              }}
            >
              <Text style={{ color: tokens.primary }}>
                {reviewIndex + 1 >= planPreview.exerciseChanges.length ? 'Commit import' : 'Next'}
              </Text>
            </Pressable>
            <Pressable onPress={() => setPlanPreview(null)}>
              <Text style={{ color: tokens.textSecondary }}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <Text style={[styles.section, { color: tokens.textPrimary }]}>Import logs CSV</Text>
      <TextInput
        value={logsText}
        onChangeText={setLogsText}
        placeholder="Paste a logs CSV file"
        placeholderTextColor={tokens.textSecondary}
        multiline
        style={[
          styles.input,
          {
            color: tokens.textPrimary,
            borderColor: tokens.border,
            backgroundColor: tokens.surface,
          },
        ]}
      />
      <PrimaryButton label="Preview logs" onPress={previewLogs} disabled={!logsText.trim()} />

      {logsPreview ? (
        <View
          style={[styles.card, { borderColor: tokens.border, backgroundColor: tokens.surface }]}
        >
          <Text style={{ color: tokens.textPrimary }}>
            {logsPreview.accepted.length} new · {logsPreview.skipped.length} already saved ·{' '}
            {logsPreview.conflicts.length} conflicts (keep existing)
          </Text>
          <View style={styles.actions}>
            <Pressable onPress={commitLogs}>
              <Text style={{ color: tokens.primary }}>Commit import</Text>
            </Pressable>
            <Pressable onPress={() => setLogsPreview(null)}>
              <Text style={{ color: tokens.textSecondary }}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },
  chips: {
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
  input: {
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 14,
    minHeight: 100,
    padding: 10,
    textAlignVertical: 'top',
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    padding: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  titleInput: {
    minHeight: 0,
    paddingVertical: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
  },
});
