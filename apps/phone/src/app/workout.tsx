import type {
  Set as DomainSet,
  ExerciseEntry,
  LoggedSet,
  ModuleKind,
  SupersetEntry,
  SupersetMemberActual,
  SupersetMemberSet,
  Workout,
  WorkoutEntry,
} from '@spotter/domain';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, LayoutAnimation, Text, View } from 'react-native';
import { ExercisePickerModal } from '@/components/authoring/ExercisePickerModal';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { Chip } from '@/components/ui/Chip';
import { Divider } from '@/components/ui/Divider';
import { PressableText } from '@/components/ui/PressableText';
import type { TextInputRef } from '@/components/ui/TextField';
import { ItemBlock } from '@/components/workout/ItemBlock';
import { ModuleCard } from '@/components/workout/ModuleCard';
import { SetRow } from '@/components/workout/SetRow';
import { WorkoutHeaderActions } from '@/components/workout/WorkoutHeaderActions';
import { db } from '@/db/client';
import { loadExercise } from '@/db/exercises';
import {
  cancelWorkoutSession,
  finishWorkoutSession,
  loadWorkoutDraft,
  persistWorkoutDraft,
} from '@/db/workoutSession';
import { useScreenHeader } from '@/hooks/useScreenHeader';
import { defaultSet, MODULE_KINDS, MODULE_LABELS } from '@/lib/authoring';
import { formatTimer, formatWhen } from '@/lib/formatWhen';
import {
  advanceWorkoutUnit,
  firstIncompleteUnit,
  isSupersetMemberComplete,
  isUnitComplete,
  isWorkoutEntryComplete,
  nextIncompleteUnit,
  orderedWorkoutModules,
  removeSupersetMember,
  unitProgress,
  type WorkoutUnit,
} from '@/lib/workoutPresentation';
import { useTheme } from '@/theme/ThemeProvider';

type PickerState = { kind: 'exercise' | 'superset'; module: ModuleKind } | null;

const emptyLoggedSet = (set: DomainSet): LoggedSet =>
  set.mode === 'reps'
    ? { ...set, actualReps: null, actualWeightKg: null }
    : { ...set, actualSeconds: null, actualWeightKg: null };

const emptyMemberActual = (set: SupersetMemberSet): SupersetMemberActual =>
  set.mode === 'reps'
    ? { mode: 'reps', actualReps: null, actualWeightKg: null }
    : { mode: 'time', actualSeconds: null, actualWeightKg: null };

const setTarget = (set: LoggedSet | SupersetMemberSet): number =>
  set.mode === 'reps' ? set.targetReps : set.targetSeconds;

const entryKey = (entry: WorkoutEntry, index: number): string => `${entry.kind}-${index}`;

const animateLayout = () => LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

/** Expansion ids: `"3"` is the item at entry 3, `"3.1"` is member 1 inside that Superset. */
const entryId = (entryIndex: number): string => `${entryIndex}`;
const memberId = (entryIndex: number, memberIndex: number): string =>
  `${entryIndex}.${memberIndex}`;

const unitIds = (unit: WorkoutUnit): string[] =>
  unit.memberIndex === null
    ? [entryId(unit.entryIndex)]
    : [entryId(unit.entryIndex), memberId(unit.entryIndex, unit.memberIndex)];

const shiftExpandedAfterRemoval = (ids: string[], removedEntry: number): string[] =>
  ids.flatMap((id) => {
    const [entry, member] = id.split('.');
    const entryIndex = Number(entry);
    if (entryIndex === removedEntry) return [];
    const shifted = entryIndex > removedEntry ? entryIndex - 1 : entryIndex;
    return [member === undefined ? `${shifted}` : `${shifted}.${member}`];
  });

const exerciseTargetKey = (entryIndex: number, setIndex: number): string =>
  `entry-${entryIndex}-set-${setIndex}-target`;

const exerciseWeightKey = (entryIndex: number, setIndex: number): string =>
  `entry-${entryIndex}-set-${setIndex}-weight`;

const memberTargetKey = (entryIndex: number, round: number, memberIndex: number): string =>
  `entry-${entryIndex}-round-${round}-member-${memberIndex}-target`;

const memberWeightKey = (entryIndex: number, round: number, memberIndex: number): string =>
  `entry-${entryIndex}-round-${round}-member-${memberIndex}-weight`;

const memberSnapshotKey = (entryIndex: number, memberIndex: number, exerciseId: string): string =>
  `entry-${entryIndex}-member-${memberIndex}-${exerciseId}`;

const workoutInputOrder = (workout: Workout): string[] =>
  workout.exercises.flatMap((entry, entryIndex) => {
    if (entry.kind === 'exercise') {
      return entry.sets.flatMap((_, setIndex) => [
        exerciseTargetKey(entryIndex, setIndex),
        ...(entry.usesWeight ? [exerciseWeightKey(entryIndex, setIndex)] : []),
      ]);
    }
    return entry.members.flatMap((member, memberIndex) =>
      Array.from({ length: entry.rounds }, (_, round) => [
        memberTargetKey(entryIndex, round, memberIndex),
        ...(member.usesWeight ? [memberWeightKey(entryIndex, round, memberIndex)] : []),
      ]).flat(),
    );
  });

export default function WorkoutScreen() {
  const { tokens } = useTheme();
  const [initialWorkout] = useState<Workout | null>(loadWorkoutDraft);
  const [workout, setWorkout] = useState<Workout | null>(initialWorkout);
  const [expandedItems, setExpandedItems] = useState<string[]>(() => {
    if (!initialWorkout) return [];
    const first = firstIncompleteUnit(initialWorkout);
    return first ? unitIds(first) : [];
  });
  const [picker, setPicker] = useState<PickerState>(null);
  const inputRefs = useRef<Record<string, TextInputRef | null>>({});

  useEffect(() => {
    if (workout) persistWorkoutDraft(workout);
  }, [workout]);

  const cancel = useCallback(() => {
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
  }, []);

  useScreenHeader(workout?.routineName ?? 'Workout', {
    headerRight: workout ? () => <WorkoutHeaderActions onCancel={cancel} /> : undefined,
  });

  const fieldOrder = workout ? workoutInputOrder(workout) : [];
  const nextField = new Map(fieldOrder.map((key, index) => [key, fieldOrder[index + 1]] as const));

  const registerInput = (key: string) => (input: TextInputRef | null) => {
    inputRefs.current[key] = input;
  };

  const focusInput = (key: string | undefined) => {
    if (key) inputRefs.current[key]?.focus();
  };

  const patchEntry = (index: number, next: WorkoutEntry) => {
    setWorkout((current) =>
      current
        ? {
            ...current,
            exercises: current.exercises.map((entry, entryIndex) =>
              entryIndex === index ? next : entry,
            ),
          }
        : current,
    );
  };

  const removeEntry = (index: number) => {
    animateLayout();
    setWorkout((current) =>
      current
        ? {
            ...current,
            exercises: current.exercises.filter((_, entryIndex) => entryIndex !== index),
          }
        : current,
    );
    setExpandedItems((current) => shiftExpandedAfterRemoval(current, index));
  };

  const confirmRemoveEntry = (index: number) => {
    const entry = workout?.exercises[index];
    if (!entry) return;
    const isSuperset = entry.kind === 'superset';
    Alert.alert(
      isSuperset ? 'Remove superset?' : 'Remove from workout?',
      'This only changes this workout snapshot. Your Plan remains unchanged.',
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: isSuperset ? 'Remove superset' : 'Remove from workout',
          style: 'destructive',
          onPress: () => removeEntry(index),
        },
      ],
    );
  };

  const confirmRemoveMember = (entryIndex: number, memberIndex: number) => {
    const entry = workout?.exercises[entryIndex];
    if (entry?.kind !== 'superset') return;
    const member = entry.members[memberIndex];
    if (!member) return;
    const message =
      entry.members.length === 2
        ? 'The remaining exercise will continue on its own. Your Plan is unchanged.'
        : 'This only changes this workout snapshot. Your Plan remains unchanged.';
    Alert.alert(`Remove ${member.title}?`, message, [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Remove from workout',
        style: 'destructive',
        onPress: () => {
          const nextEntry = removeSupersetMember(entry, memberIndex);
          patchEntry(entryIndex, nextEntry);
          setExpandedItems((current) => current.filter((id) => !id.startsWith(`${entryIndex}.`)));
        },
      },
    ]);
  };

  const removeModule = (kind: ModuleKind) => {
    Alert.alert(
      `Remove ${MODULE_LABELS[kind]} section?`,
      'This only removes the section from this workout snapshot. Your Plan remains unchanged.',
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Remove section',
          style: 'destructive',
          onPress: () => {
            setWorkout((current) =>
              current
                ? {
                    ...current,
                    exercises: current.exercises.filter((entry) => entry.module !== kind),
                  }
                : current,
            );
            setExpandedItems([]);
          },
        },
      ],
    );
  };

  const addExercise = (kind: ModuleKind, exerciseId: string) => {
    const exercise = loadExercise(db, exerciseId);
    if (!exercise || !workout) return;
    const loggedSet = emptyLoggedSet(defaultSet());
    const entry: ExerciseEntry = {
      kind: 'exercise',
      exerciseId,
      title: exercise.title,
      description: exercise.description,
      usesWeight: exercise.usesWeight,
      module: kind,
      rounds: 1,
      sets: [loggedSet],
    };
    animateLayout();
    setExpandedItems((current) => [...current, entryId(workout.exercises.length)]);
    setWorkout((current) =>
      current ? { ...current, exercises: [...current.exercises, entry] } : current,
    );
  };

  const addSuperset = (kind: ModuleKind, exerciseIds: string[]) => {
    if (!workout) return;
    const rounds = 3;
    const members = exerciseIds.flatMap((exerciseId) => {
      const exercise = loadExercise(db, exerciseId);
      if (!exercise) return [];
      const set: SupersetMemberSet = { mode: 'reps', targetReps: 8, weightKg: null };
      return [
        {
          exerciseId: exercise.id,
          title: exercise.title,
          description: exercise.description,
          usesWeight: exercise.usesWeight,
          set,
          actuals: Array.from({ length: rounds }, () => emptyMemberActual(set)),
        },
      ];
    });
    if (members.length < 2) {
      Alert.alert('A superset needs at least two exercises.');
      return;
    }
    const entry: SupersetEntry = {
      kind: 'superset',
      module: kind,
      rounds,
      restSeconds: null,
      members,
    };
    animateLayout();
    const index = workout.exercises.length;
    setExpandedItems((current) => [...current, entryId(index), memberId(index, 0)]);
    setWorkout((current) =>
      current ? { ...current, exercises: [...current.exercises, entry] } : current,
    );
  };

  const patchExerciseActual = (
    entryIndex: number,
    setIndex: number,
    value: number | null,
    weight: boolean,
  ) => {
    const entry = workout?.exercises[entryIndex];
    if (entry?.kind !== 'exercise') return;
    patchEntry(entryIndex, {
      ...entry,
      sets: entry.sets.map((set, index) => {
        if (index !== setIndex) return set;
        if (weight) return { ...set, actualWeightKg: value };
        return set.mode === 'reps'
          ? { ...set, actualReps: value }
          : { ...set, actualSeconds: value };
      }),
    });
  };

  const patchMemberActual = (
    entryIndex: number,
    round: number,
    memberIndex: number,
    value: number | null,
    weight: boolean,
  ) => {
    const entry = workout?.exercises[entryIndex];
    if (entry?.kind !== 'superset') return;
    patchEntry(entryIndex, {
      ...entry,
      members: entry.members.map((member, index) =>
        index !== memberIndex
          ? member
          : {
              ...member,
              actuals: member.actuals.map((actual, actualIndex) => {
                if (actualIndex !== round) return actual;
                if (weight) return { ...actual, actualWeightKg: value };
                return actual.mode === 'reps'
                  ? { ...actual, actualReps: value }
                  : { ...actual, actualSeconds: value };
              }),
            },
      ),
    });
  };

  const addSet = (entryIndex: number) => {
    const entry = workout?.exercises[entryIndex];
    if (entry?.kind !== 'exercise') return;
    const previous = entry.sets[entry.sets.length - 1];
    const nextSet = previous
      ? previous.mode === 'reps'
        ? { ...previous, actualReps: null, actualWeightKg: null }
        : { ...previous, actualSeconds: null, actualWeightKg: null }
      : emptyLoggedSet(defaultSet());
    patchEntry(entryIndex, { ...entry, sets: [...entry.sets, nextSet] });
  };

  const save = () => {
    if (!workout) return;
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

  if (!workout) {
    return (
      <Screen>
        <Text style={{ color: tokens.textSecondary }}>No active workout.</Text>
        <PrimaryButton label="Back to start" onPress={() => router.replace('/')} />
      </Screen>
    );
  }

  const presentModules = orderedWorkoutModules(workout);
  const missingModules = MODULE_KINDS.filter((kind) => !presentModules.includes(kind));
  const toggleItem = (id: string) => {
    animateLayout();
    setExpandedItems((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const advanceUnit = (unit: WorkoutUnit) => {
    if (!workout) return;
    const advanced = advanceWorkoutUnit(workout, unit);
    if (!isUnitComplete(advanced, unit)) {
      setWorkout(advanced);
      return;
    }
    const next = nextIncompleteUnit(advanced, unit);
    const doneId =
      unit.memberIndex === null
        ? entryId(unit.entryIndex)
        : memberId(unit.entryIndex, unit.memberIndex);
    const wrapperId = entryId(unit.entryIndex);
    animateLayout();
    setWorkout(advanced);
    setExpandedItems((current) => {
      let rest = current.filter((id) => id !== doneId);
      const wrapperStillOpen = rest.some((id) => id.startsWith(`${wrapperId}.`));
      if (!wrapperStillOpen && next?.entryIndex !== unit.entryIndex) {
        rest = rest.filter((id) => id !== wrapperId);
      }
      const nextIds = next ? unitIds(next) : [];
      return [...rest.filter((id) => !nextIds.includes(id)), ...nextIds];
    });
  };

  const stepLabel = (unit: WorkoutUnit, noun: 'set' | 'round'): string => {
    if (!workout) return 'Done';
    if (isUnitComplete(workout, unit)) return 'Done · next';
    const { done, total } = unitProgress(workout, unit);
    return `Done · ${noun} ${done + 1} of ${total}`;
  };

  const renderSetRow = (
    set: LoggedSet,
    entry: ExerciseEntry,
    entryIndex: number,
    setIndex: number,
  ) => {
    const targetKey = exerciseTargetKey(entryIndex, setIndex);
    const weightKey = entry.usesWeight ? exerciseWeightKey(entryIndex, setIndex) : undefined;
    return (
      <SetRow
        key={`${entryIndex}-${setIndex}`}
        actualValue={set.mode === 'reps' ? set.actualReps : set.actualSeconds}
        label={`Set ${setIndex + 1}`}
        actualWeightKg={set.actualWeightKg}
        focusInput={focusInput}
        mode={set.mode}
        nextTargetFieldKey={nextField.get(targetKey)}
        nextWeightFieldKey={weightKey ? nextField.get(weightKey) : undefined}
        onActualChange={(value) => patchExerciseActual(entryIndex, setIndex, value, false)}
        onWeightChange={(value) => patchExerciseActual(entryIndex, setIndex, value, true)}
        registerInput={registerInput}
        targetFieldKey={targetKey}
        targetValue={setTarget(set)}
        targetWeightKg={set.weightKg}
        usesWeight={entry.usesWeight}
        weightFieldKey={weightKey}
      />
    );
  };

  const renderExercise = (entry: ExerciseEntry, entryIndex: number) => (
    <ItemBlock
      completed={isWorkoutEntryComplete(entry)}
      description={entry.description}
      doneLabel={stepLabel({ entryIndex, memberIndex: null }, 'set')}
      expanded={expandedItems.includes(entryId(entryIndex))}
      onDone={() => advanceUnit({ entryIndex, memberIndex: null })}
      onOptions={() => confirmRemoveEntry(entryIndex)}
      onToggle={() => toggleItem(entryId(entryIndex))}
      subtitle={`${entry.sets.length} ${entry.sets.length === 1 ? 'set' : 'sets'}`}
      title={entry.title}
    >
      {entry.sets.map((set, setIndex) => renderSetRow(set, entry, entryIndex, setIndex))}
      <PressableText label="+ Add set" onPress={() => addSet(entryIndex)} />
    </ItemBlock>
  );

  const renderSuperset = (entry: SupersetEntry, entryIndex: number) => {
    const rest = entry.restSeconds === null ? '' : ` · ${formatTimer(entry.restSeconds)} rest`;
    return (
      <ItemBlock
        accent
        completed={isWorkoutEntryComplete(entry)}
        expanded={expandedItems.includes(entryId(entryIndex))}
        onOptions={() => confirmRemoveEntry(entryIndex)}
        onToggle={() => toggleItem(entryId(entryIndex))}
        subtitle={`${entry.members.length} exercises · ${entry.rounds} rounds${rest}`}
        title="Superset"
      >
        {entry.members.map((member, memberIndex) => (
          <ItemBlock
            key={memberSnapshotKey(entryIndex, memberIndex, member.exerciseId)}
            completed={isSupersetMemberComplete(member)}
            description={member.description}
            doneLabel={stepLabel({ entryIndex, memberIndex }, 'round')}
            expanded={expandedItems.includes(memberId(entryIndex, memberIndex))}
            onDone={() => advanceUnit({ entryIndex, memberIndex })}
            onOptions={() => confirmRemoveMember(entryIndex, memberIndex)}
            onToggle={() => toggleItem(memberId(entryIndex, memberIndex))}
            subtitle={`${entry.rounds} rounds`}
            title={member.title}
          >
            {Array.from({ length: entry.rounds }, (_, round) => {
              const actual = member.actuals[round];
              if (!actual) return null;
              const targetKey = memberTargetKey(entryIndex, round, memberIndex);
              const weightKey = member.usesWeight
                ? memberWeightKey(entryIndex, round, memberIndex)
                : undefined;
              return (
                <SetRow
                  key={targetKey}
                  actualValue={actual.mode === 'reps' ? actual.actualReps : actual.actualSeconds}
                  actualWeightKg={actual.actualWeightKg}
                  focusInput={focusInput}
                  label={`Round ${round + 1}`}
                  mode={actual.mode}
                  nextTargetFieldKey={nextField.get(targetKey)}
                  nextWeightFieldKey={weightKey ? nextField.get(weightKey) : undefined}
                  onActualChange={(value) =>
                    patchMemberActual(entryIndex, round, memberIndex, value, false)
                  }
                  onWeightChange={(value) =>
                    patchMemberActual(entryIndex, round, memberIndex, value, true)
                  }
                  registerInput={registerInput}
                  targetFieldKey={targetKey}
                  targetValue={setTarget(member.set)}
                  targetWeightKg={member.set.weightKg}
                  usesWeight={member.usesWeight}
                  weightFieldKey={weightKey}
                />
              );
            })}
          </ItemBlock>
        ))}
      </ItemBlock>
    );
  };

  return (
    <Screen>
      <Text style={{ color: tokens.textSecondary }}>
        {workout.planName} · Started {formatWhen(workout.startedAt)}
      </Text>
      {presentModules.map((kind) => {
        const entries = workout.exercises.flatMap((entry, entryIndex) =>
          entry.module === kind ? [{ entry, entryIndex }] : [],
        );
        return (
          <ModuleCard
            key={kind}
            onAddExercise={() => setPicker({ kind: 'exercise', module: kind })}
            onAddSuperset={() => setPicker({ kind: 'superset', module: kind })}
            onRemove={() => removeModule(kind)}
            title={MODULE_LABELS[kind]}
          >
            {entries.map(({ entry, entryIndex }, index) => (
              <View key={entryKey(entry, entryIndex)}>
                {index > 0 ? <Divider /> : null}
                {entry.kind === 'exercise'
                  ? renderExercise(entry, entryIndex)
                  : renderSuperset(entry, entryIndex)}
              </View>
            ))}
          </ModuleCard>
        );
      })}

      {missingModules.length > 0 ? (
        <View>
          <Text style={{ color: tokens.textSecondary, fontWeight: '600' }}>
            Add a missing module
          </Text>
          <View>
            {missingModules.map((kind) => (
              <Chip
                key={kind}
                label={`+ ${MODULE_LABELS[kind]}`}
                onPress={() => setPicker({ kind: 'exercise', module: kind })}
                selected={false}
              />
            ))}
          </View>
        </View>
      ) : null}

      <PrimaryButton label="Save workout" onPress={save} />
      <ExercisePickerModal
        multi={picker?.kind === 'superset'}
        onClose={() => setPicker(null)}
        onSelect={(ids) => {
          if (picker?.kind === 'exercise') {
            const exerciseId = ids[0];
            if (exerciseId) addExercise(picker.module, exerciseId);
          } else if (picker?.kind === 'superset') {
            addSuperset(picker.module, ids);
          }
          setPicker(null);
        }}
        visible={picker !== null}
      />
    </Screen>
  );
}
