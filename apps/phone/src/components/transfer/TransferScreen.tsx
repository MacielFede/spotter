import type { Plan } from '@spotter/domain';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { useSnackbar } from '@/components/ui/SnackbarProvider';
import { db } from '@/db/client';
import { listExercises } from '@/db/exercises';
import { listPlans } from '@/db/plans';
import { listWorkouts, saveWorkout } from '@/db/workouts';
import {
  buildPlanExport,
  commitWorkoutsImport,
  exportWorkoutsCsv,
  preparePlanImport,
  prepareWorkoutsCsvImport,
  serializePlanExport,
  type WorkoutImportPreview,
} from '@/lib/interop';
import { PLAN_DRAFT_ID, startPlanImportDraft } from '@/lib/planImportDraft';
import { LOGS_TEMPLATE, PLAN_TEMPLATE } from '@/lib/templates';
import { useTheme } from '@/theme/ThemeProvider';

export default function TransferScreen() {
  const { tokens } = useTheme();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [logsPreview, setLogsPreview] = useState<WorkoutImportPreview | null>(null);
  const { showError } = useSnackbar();

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
      showError(cause instanceof Error ? cause.message : 'Could not export Plan.');
    }
  };

  const exportLogs = () => share(exportWorkoutsCsv(listWorkouts(db)), 'spotter-logs.csv');

  /** Returns the picked file's text, or null when the user cancels. Read errors propagate. */
  const pickFileText = async (type: 'json' | 'csv') => {
    const result = await DocumentPicker.getDocumentAsync({
      type: type === 'json' ? 'application/json' : 'text/csv',
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets || result.assets.length === 0) return null;
    return new File(result.assets[0].uri).textSync();
  };

  const importPlan = async () => {
    try {
      const text = await pickFileText('json');
      if (text === null) return;
      startPlanImportDraft(preparePlanImport(text, listExercises(db, { includeArchived: true })));
      router.push({ pathname: '/plan/[id]', params: { id: PLAN_DRAFT_ID } });
    } catch (cause) {
      showError(cause instanceof Error ? cause.message : 'Could not read Plan JSON.');
    }
  };

  const previewLogs = async () => {
    try {
      const text = await pickFileText('csv');
      if (text === null) return;
      setLogsPreview(prepareWorkoutsCsvImport(text, listWorkouts(db)));
    } catch (cause) {
      setLogsPreview(null);
      showError(cause instanceof Error ? cause.message : 'Could not read CSV.');
    }
  };

  const commitLogs = () => {
    if (!logsPreview) return;
    const count = commitWorkoutsImport(logsPreview, (workout) => saveWorkout(db, workout));
    setLogsPreview(null);
    Alert.alert('Imported', `${count} Workouts restored. Existing logs were kept.`);
  };

  return (
    <Screen>
      <Text style={{ color: tokens.textSecondary }}>
        Files are version-locked and self-contained.
      </Text>

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
      <PrimaryButton label="Pick Plan JSON" onPress={importPlan} />

      <Text style={[styles.section, { color: tokens.textPrimary }]}>Import logs CSV</Text>
      <PrimaryButton label="Pick logs CSV" onPress={previewLogs} />

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
  card: {
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    padding: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
  },
});
