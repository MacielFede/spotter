import type {
  ExerciseEntry,
  LoggedSet,
  ModuleKind,
  SupersetEntry,
  SupersetMemberActual,
  Workout,
  WorkoutEntry,
} from '@spotter/domain';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ExercisePickerModal } from '@/components/authoring/ExercisePickerModal';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { db } from '@/db/client';
import { loadExercise } from '@/db/exercises';
import {
  cancelWorkoutSession,
  finishWorkoutSession,
  loadWorkoutDraft,
  persistWorkoutDraft,
} from '@/db/workoutSession';
import { defaultSet, MODULE_KINDS, MODULE_LABELS } from '@/lib/authoring';
import { useTheme } from '@/theme/ThemeProvider';

const numberOrNull = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
};

const actualTarget = (set: LoggedSet | SupersetMemberActual): string => {
  if (set.mode === 'reps') return set.actualReps === null ? '' : String(set.actualReps);
  return set.actualSeconds === null ? '' : String(set.actualSeconds);
};

const actualWeight = (set: LoggedSet | SupersetMemberActual): string =>
  set.actualWeightKg === null ? '' : String(set.actualWeightKg);

const templateTarget = (
  set: { mode: 'reps'; targetReps: number } | { mode: 'time'; targetSeconds: number },
): string => (set.mode === 'reps' ? `${set.targetReps} reps` : `${set.targetSeconds}s`);

const withSetTarget = (set: LoggedSet, raw: string): LoggedSet =>
  set.mode === 'reps'
    ? { ...set, actualReps: numberOrNull(raw) }
    : { ...set, actualSeconds: numberOrNull(raw) };

const withSetWeight = (set: LoggedSet, raw: string): LoggedSet =>
  set.mode === 'reps'
    ? { ...set, actualWeightKg: numberOrNull(raw) }
    : { ...set, actualWeightKg: numberOrNull(raw) };

const withActualTarget = (actual: SupersetMemberActual, raw: string): SupersetMemberActual =>
  actual.mode === 'reps'
    ? { ...actual, actualReps: numberOrNull(raw) }
    : { ...actual, actualSeconds: numberOrNull(raw) };

const withActualWeight = (actual: SupersetMemberActual, raw: string): SupersetMemberActual =>
  actual.mode === 'reps'
    ? { ...actual, actualWeightKg: numberOrNull(raw) }
    : { ...actual, actualWeightKg: numberOrNull(raw) };

export default function WorkoutScreen() {
  const { tokens } = useTheme();
  const [workout, setWorkout] = useState<Workout | null>(() => loadWorkoutDraft());
  const [addToModule, setAddToModule] = useState<ModuleKind | null>(null);

  useEffect(() => {
    if (workout) persistWorkoutDraft(workout);
  }, [workout]);

  if (!workout) {
    return (
      <Screen title="Workout">
        <Text style={{ color: tokens.textSecondary }}>No active workout.</Text>
        <PrimaryButton label="Back to start" onPress={() => router.replace('/')} />
      </Screen>
    );
  }

  const patchEntry = (index: number, next: WorkoutEntry) => {
    setWorkout((current) =>
      current
        ? {
            ...current,
            exercises: current.exercises.map((entry, i) => (i === index ? next : entry)),
          }
        : current,
    );
  };

  const removeEntry = (index: number) => {
    setWorkout((current) =>
      current
        ? { ...current, exercises: current.exercises.filter((_, i) => i !== index) }
        : current,
    );
  };

  const removeModule = (kind: ModuleKind) => {
    Alert.alert(`Remove ${MODULE_LABELS[kind]}?`, 'This only changes the workout snapshot.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () =>
          setWorkout((current) =>
            current
              ? {
                  ...current,
                  exercises: current.exercises.filter((entry) => entry.module !== kind),
                }
              : current,
          ),
      },
    ]);
  };

  const addExercise = (kind: ModuleKind, exerciseId: string) => {
    const exercise = loadExercise(db, exerciseId);
    if (!exercise) return;
    const set = defaultSet();
    const loggedSet: LoggedSet =
      set.mode === 'reps'
        ? { ...set, actualReps: null, actualWeightKg: null }
        : { ...set, actualSeconds: null, actualWeightKg: null };
    const entry: ExerciseEntry = {
      kind: 'exercise',
      exerciseId,
      title: exercise.title,
      description: exercise.description,
      module: kind,
      rounds: 1,
      sets: [loggedSet],
    };
    setWorkout((current) =>
      current ? { ...current, exercises: [...current.exercises, entry] } : current,
    );
  };

  const renderSetRow = (
    set: LoggedSet | SupersetMemberActual,
    template: string,
    templateWeightKg: number | null,
    onChangeTarget: (raw: string) => void,
    onChangeWeight: (raw: string) => void,
  ) => (
    <View style={styles.setRow}>
      <Text style={[styles.target, { color: tokens.textSecondary }]}>{template}</Text>
      <TextInput
        value={actualTarget(set)}
        onChangeText={onChangeTarget}
        keyboardType="number-pad"
        placeholder="actual"
        placeholderTextColor={tokens.textSecondary}
        style={[
          styles.input,
          {
            color: tokens.textPrimary,
            borderColor: tokens.border,
            backgroundColor: tokens.background,
          },
        ]}
      />
      <TextInput
        value={actualWeight(set)}
        onChangeText={onChangeWeight}
        keyboardType="decimal-pad"
        placeholder={templateWeightKg === null ? 'kg' : `${templateWeightKg}`}
        placeholderTextColor={tokens.textSecondary}
        style={[
          styles.input,
          {
            color: tokens.textPrimary,
            borderColor: tokens.border,
            backgroundColor: tokens.background,
          },
        ]}
      />
    </View>
  );

  const renderExercise = (entry: ExerciseEntry, entryIndex: number) => (
    <>
      <Text style={[styles.exerciseTitle, { color: tokens.textPrimary }]}>{entry.title}</Text>
      {entry.sets.map((set, setIndex) =>
        renderSetRow(
          set,
          templateTarget(set),
          set.weightKg,
          (raw) =>
            patchEntry(entryIndex, {
              ...entry,
              sets: entry.sets.map((item, i) => (i === setIndex ? withSetTarget(item, raw) : item)),
            }),
          (raw) =>
            patchEntry(entryIndex, {
              ...entry,
              sets: entry.sets.map((item, i) => (i === setIndex ? withSetWeight(item, raw) : item)),
            }),
        ),
      )}
    </>
  );

  const renderSuperset = (entry: SupersetEntry, entryIndex: number) => (
    <>
      <Text style={[styles.exerciseTitle, { color: tokens.textPrimary }]}>
        {entry.members.map((member) => member.title).join(' + ')}
      </Text>
      <Text style={{ color: tokens.textSecondary }}>
        {entry.rounds} rounds{entry.restSeconds === null ? '' : ` · rest ${entry.restSeconds}s`}
      </Text>
      {Array.from({ length: entry.rounds }, (_, round) => (
        <View
          // biome-ignore lint/suspicious/noArrayIndexKey: rounds are positional
          key={`round-${round}`}
          style={styles.round}
        >
          <Text style={[styles.roundLabel, { color: tokens.textPrimary }]}>Round {round + 1}</Text>
          {entry.members.map((member, memberIndex) => {
            const actual = member.actuals[round];
            if (!actual) return null;
            return (
              <View
                // biome-ignore lint/suspicious/noArrayIndexKey: rounds are positional
                key={`${member.exerciseId}-${round}`}
                style={styles.member}
              >
                <Text style={{ color: tokens.textSecondary }}>{member.title}</Text>
                {renderSetRow(
                  actual,
                  templateTarget(member.set),
                  member.set.weightKg,
                  (raw) =>
                    patchEntry(entryIndex, {
                      ...entry,
                      members: entry.members.map((item, i) =>
                        i === memberIndex
                          ? {
                              ...item,
                              actuals: item.actuals.map((value, r) =>
                                r === round ? withActualTarget(value, raw) : value,
                              ),
                            }
                          : item,
                      ),
                    }),
                  (raw) =>
                    patchEntry(entryIndex, {
                      ...entry,
                      members: entry.members.map((item, i) =>
                        i === memberIndex
                          ? {
                              ...item,
                              actuals: item.actuals.map((value, r) =>
                                r === round ? withActualWeight(value, raw) : value,
                              ),
                            }
                          : item,
                      ),
                    }),
                )}
              </View>
            );
          })}
        </View>
      ))}
    </>
  );

  const save = () => {
    Alert.alert('Save workout?', 'Saved Workouts are permanent and cannot be edited or deleted.', [
      { text: 'Keep editing', style: 'cancel' },
      {
        text: 'Save',
        onPress: () => {
          try {
            finishWorkoutSession(workout);
            router.replace('/');
          } catch (cause) {
            Alert.alert('Cannot save', cause instanceof Error ? cause.message : 'Invalid workout.');
          }
        },
      },
    ]);
  };

  const cancel = () => {
    Alert.alert('Cancel workout?', 'The draft is discarded entirely.', [
      { text: 'Keep editing', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          cancelWorkoutSession();
          router.replace('/');
        },
      },
    ]);
  };

  const presentModules = MODULE_KINDS.filter((kind) =>
    workout.exercises.some((entry) => entry.module === kind),
  );
  const missingModules = MODULE_KINDS.filter((kind) => !presentModules.includes(kind));

  return (
    <Screen title={workout.routineName} subtitle={`${workout.planName} · ${workout.startedAt}`}>
      {presentModules.map((kind) => (
        <View key={kind} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.module, { color: tokens.textSecondary }]}>
              {MODULE_LABELS[kind]}
            </Text>
            <Pressable onPress={() => setAddToModule(kind)}>
              <Text style={{ color: tokens.primary }}>+ Exercise</Text>
            </Pressable>
            <Pressable onPress={() => removeModule(kind)}>
              <Text style={{ color: tokens.textSecondary }}>Remove module</Text>
            </Pressable>
          </View>
          {workout.exercises.map((entry, entryIndex) =>
            entry.module === kind ? (
              <View
                // biome-ignore lint/suspicious/noArrayIndexKey: snapshot order
                key={`${entry.kind}-${entryIndex}`}
                style={[
                  styles.card,
                  { backgroundColor: tokens.surface, borderColor: tokens.border },
                ]}
              >
                {entry.kind === 'exercise'
                  ? renderExercise(entry, entryIndex)
                  : renderSuperset(entry, entryIndex)}
                <Pressable onPress={() => removeEntry(entryIndex)}>
                  <Text style={{ color: tokens.danger }}>Remove exercise</Text>
                </Pressable>
              </View>
            ) : null,
          )}
        </View>
      ))}

      {missingModules.length > 0 ? (
        <View style={styles.addModules}>
          {missingModules.map((kind) => (
            <Pressable key={kind} onPress={() => setAddToModule(kind)}>
              <Text style={{ color: tokens.primary }}>+ {MODULE_LABELS[kind]} module</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <PrimaryButton label="Save workout" onPress={save} />
      <Pressable onPress={cancel} style={[styles.cancel, { borderColor: tokens.danger }]}>
        <Text style={{ color: tokens.danger }}>Cancel workout</Text>
      </Pressable>

      <ExercisePickerModal
        visible={addToModule !== null}
        onClose={() => setAddToModule(null)}
        onSelect={(ids) => {
          const exerciseId = ids[0];
          if (exerciseId && addToModule) addExercise(addToModule, exerciseId);
          setAddToModule(null);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 8,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  module: {
    flex: 1,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    padding: 14,
  },
  exerciseTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  setRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  target: {
    flex: 1,
    fontSize: 13,
  },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 15,
    paddingHorizontal: 8,
    paddingVertical: 6,
    textAlign: 'center',
    width: 72,
  },
  round: {
    gap: 6,
  },
  roundLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  member: {
    gap: 4,
  },
  addModules: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  cancel: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 12,
  },
});
