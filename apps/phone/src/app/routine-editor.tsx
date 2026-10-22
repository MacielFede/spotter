import {
  type Set as DomainSet,
  type ExerciseItem,
  type Module,
  type ModuleKind,
  type Plan,
  PlanSchema,
  type Routine,
  type SupersetItem,
  type SupersetMember,
  type SupersetMemberSet,
} from '@spotter/domain';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { ExercisePickerModal } from '@/components/authoring/ExercisePickerModal';
import { SetEditorModal } from '@/components/authoring/SetEditorModal';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { db } from '@/db/client';
import { loadActiveWorkout } from '@/db/draft';
import { listExercises } from '@/db/exercises';
import { loadPlan, savePlan } from '@/db/plans';
import { defaultSet, MODULE_LABELS, move, normalizeModules } from '@/lib/authoring';
import { useTheme } from '@/theme/ThemeProvider';

type MemberSet = DomainSet | SupersetMemberSet;

type PickerState =
  | { mode: 'exercise'; moduleKind: ModuleKind }
  | { mode: 'superset'; moduleKind: ModuleKind }
  | { mode: 'member'; moduleKind: ModuleKind; itemIndex: number }
  | null;

type SetEditorState =
  | {
      kind: 'exercise';
      moduleKind: ModuleKind;
      itemIndex: number;
      setIndex: number;
      set: DomainSet;
    }
  | {
      kind: 'member';
      moduleKind: ModuleKind;
      itemIndex: number;
      memberIndex: number;
      set: SupersetMemberSet;
    }
  | null;

const setSummary = (set: MemberSet): string => {
  const target = set.mode === 'reps' ? `${set.targetReps} reps` : `${set.targetSeconds}s`;
  const weight = set.weightKg === null ? '' : ` · ${set.weightKg} kg`;
  const rest =
    'restSeconds' in set && set.restSeconds !== null ? ` · rest ${set.restSeconds}s` : '';
  return `${target}${weight}${rest}`;
};

const numberOr = (value: string, fallback: number): number => {
  const parsed = Number(value.trim());
  return Number.isFinite(parsed) ? parsed : fallback;
};

export default function RoutineEditorScreen() {
  const { tokens } = useTheme();
  const { planId, routineId } = useLocalSearchParams<{ planId: string; routineId: string }>();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [picker, setPicker] = useState<PickerState>(null);
  const [setEditor, setSetEditor] = useState<SetEditorState>(null);
  const [groupFor, setGroupFor] = useState<ModuleKind | null>(null);
  const [groupSelection, setGroupSelection] = useState<number[]>([]);
  const [groupRounds, setGroupRounds] = useState('3');
  const [groupRest, setGroupRest] = useState('');

  const reload = useCallback(() => {
    if (!planId || !routineId) return;
    const loaded = loadPlan(db, planId);
    const found = loaded?.routines.find((item) => item.id === routineId);
    if (loaded && found) {
      setPlan(loaded);
      setRoutine({ ...found, modules: normalizeModules(found.modules) });
    }
    const map: Record<string, string> = {};
    for (const exercise of listExercises(db, { includeArchived: true })) {
      map[exercise.id] = exercise.title;
    }
    setTitles(map);
  }, [planId, routineId]);

  useFocusEffect(reload);

  if (!plan || !routine) {
    return (
      <Screen title="Routine">
        <Text style={{ color: tokens.textSecondary }}>Routine not found.</Text>
      </Screen>
    );
  }

  const titleFor = (id: string) => titles[id] ?? 'Unknown exercise';
  const setModules = (modules: Module[]) => setRoutine({ ...routine, modules });

  const patchModule = (kind: ModuleKind, patch: Partial<Module>) => {
    setModules(
      routine.modules.map((module) => (module.kind === kind ? { ...module, ...patch } : module)),
    );
  };

  const moveModule = (index: number, delta: number) => {
    setModules(move(routine.modules, index, index + delta));
  };

  const addExercises = (kind: ModuleKind, ids: string[]) => {
    const module = routine.modules.find((item) => item.kind === kind);
    if (!module) return;
    const items = ids.map((exerciseId) => ({
      kind: 'exercise' as const,
      exerciseId,
      sets: [defaultSet()],
    }));
    patchModule(kind, { items: [...module.items, ...items] });
    setPicker(null);
  };

  const addSuperset = (kind: ModuleKind, ids: string[]) => {
    const module = routine.modules.find((item) => item.kind === kind);
    if (!module) return;
    if (ids.length < 2) {
      Alert.alert('Superset needs at least two exercises');
      return;
    }
    const item: SupersetItem = {
      kind: 'superset',
      rounds: 3,
      restSeconds: null,
      members: ids.map((exerciseId) => ({
        exerciseId,
        set: { mode: 'reps', targetReps: 8, weightKg: null },
      })),
    };
    patchModule(kind, { items: [...module.items, item] });
    setPicker(null);
  };

  const addMember = (kind: ModuleKind, itemIndex: number, ids: string[]) => {
    const module = routine.modules.find((item) => item.kind === kind);
    const item = module?.items[itemIndex];
    if (!module || !item || item.kind !== 'superset') return;
    const exerciseId = ids[0];
    if (!exerciseId) return;
    const member: SupersetMember = {
      exerciseId,
      set: { mode: 'reps', targetReps: 8, weightKg: null },
    };
    patchModule(kind, {
      items: module.items.map((entry, index) =>
        index === itemIndex ? { ...item, members: [...item.members, member] } : entry,
      ),
    });
    setPicker(null);
  };

  const patchItem = (kind: ModuleKind, index: number, next: ExerciseItem | SupersetItem) => {
    const module = routine.modules.find((item) => item.kind === kind);
    if (!module) return;
    patchModule(kind, {
      items: module.items.map((item, itemIndex) => (itemIndex === index ? next : item)),
    });
  };

  const removeItem = (kind: ModuleKind, index: number) => {
    const module = routine.modules.find((item) => item.kind === kind);
    if (!module) return;
    patchModule(kind, { items: module.items.filter((_, itemIndex) => itemIndex !== index) });
    setExpanded(null);
  };

  const save = () => {
    const nextPlan: Plan = {
      ...plan,
      routines: plan.routines.map((item) => (item.id === routine.id ? routine : item)),
    };
    const parsed = PlanSchema.safeParse(nextPlan);
    if (!parsed.success) {
      Alert.alert('Cannot save routine', parsed.error.issues[0]?.message ?? 'Invalid routine.');
      return;
    }
    savePlan(db, parsed.data);
    setPlan(parsed.data);
    Alert.alert('Saved');
  };

  const deleteRoutine = () => {
    if (loadActiveWorkout(db)) {
      Alert.alert('Workout in progress', 'Finish or cancel the workout before deleting a Routine.');
      return;
    }
    Alert.alert('Delete routine?', 'Saved Workouts are not affected.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          savePlan(db, {
            ...plan,
            routines: plan.routines.filter((item) => item.id !== routine.id),
          });
          router.back();
        },
      },
    ]);
  };

  const openGroup = (kind: ModuleKind) => {
    setGroupFor(kind);
    setGroupSelection([]);
    setGroupRounds('3');
    setGroupRest('');
  };

  const confirmGroup = () => {
    if (!groupFor) return;
    const module = routine.modules.find((item) => item.kind === groupFor);
    if (!module || groupSelection.length < 2) {
      Alert.alert('Select at least two exercise items to group.');
      return;
    }
    const indexes = [...groupSelection].sort((a, b) => a - b);
    const chosen = indexes.map((index) => module.items[index]);
    const members: SupersetMember[] = [];
    for (const item of chosen) {
      if (item?.kind !== 'exercise') continue;
      const first = item.sets[0];
      if (!first) continue;
      const set: SupersetMemberSet =
        first.mode === 'reps'
          ? { mode: 'reps', targetReps: first.targetReps, weightKg: first.weightKg }
          : { mode: 'time', targetSeconds: first.targetSeconds, weightKg: first.weightKg };
      members.push({ exerciseId: item.exerciseId, set });
    }
    if (members.length < 2) {
      Alert.alert('Select at least two exercise items to group.');
      return;
    }
    const rest = groupRest.trim() ? Math.max(0, Math.round(numberOr(groupRest, 0))) : null;
    const superset: SupersetItem = {
      kind: 'superset',
      rounds: Math.max(1, Math.round(numberOr(groupRounds, 3))),
      restSeconds: rest,
      members,
    };
    const remaining = module.items.filter((_, index) => !groupSelection.includes(index));
    const insertAt = Math.min(indexes[0] ?? remaining.length, remaining.length);
    const items = [...remaining.slice(0, insertAt), superset, ...remaining.slice(insertAt)];
    patchModule(groupFor, { items });
    setGroupFor(null);
  };

  const saveSet = (next: MemberSet) => {
    if (!setEditor) return;
    const module = routine.modules.find((item) => item.kind === setEditor.moduleKind);
    const item = module?.items[setEditor.itemIndex];
    if (!module || !item) return;

    if (setEditor.kind === 'exercise' && item.kind === 'exercise') {
      patchItem(setEditor.moduleKind, setEditor.itemIndex, {
        ...item,
        sets: item.sets.map((set, index) =>
          index === setEditor.setIndex ? (next as DomainSet) : set,
        ),
      });
    }

    if (setEditor.kind === 'member' && item.kind === 'superset') {
      patchItem(setEditor.moduleKind, setEditor.itemIndex, {
        ...item,
        members: item.members.map((member, index) =>
          index === setEditor.memberIndex ? { ...member, set: next as SupersetMemberSet } : member,
        ),
      });
    }
    setSetEditor(null);
  };

  const ungroup = (kind: ModuleKind, itemIndex: number, item: SupersetItem) => {
    const module = routine.modules.find((entry) => entry.kind === kind);
    if (!module) return;
    const loose: ExerciseItem[] = item.members.map((member) => ({
      kind: 'exercise',
      exerciseId: member.exerciseId,
      sets: [
        member.set.mode === 'reps'
          ? {
              mode: 'reps',
              targetReps: member.set.targetReps,
              weightKg: member.set.weightKg,
              restSeconds: null,
            }
          : {
              mode: 'time',
              targetSeconds: member.set.targetSeconds,
              weightKg: member.set.weightKg,
              restSeconds: null,
            },
      ],
    }));
    patchModule(kind, {
      items: [...module.items.slice(0, itemIndex), ...loose, ...module.items.slice(itemIndex + 1)],
    });
    setExpanded(null);
  };

  const renderExerciseItem = (kind: ModuleKind, item: ExerciseItem, itemIndex: number) => {
    let offset = 0;
    return (
      <>
        {item.sets.map((set, setIndex) => {
          const key = `set-${offset}`;
          offset += 1;
          return (
            <View key={key} style={styles.row}>
              <Pressable
                style={styles.rowText}
                onPress={() =>
                  setSetEditor({
                    kind: 'exercise',
                    moduleKind: kind,
                    itemIndex,
                    setIndex,
                    set,
                  })
                }
              >
                <Text style={{ color: tokens.textPrimary }}>Set {setIndex + 1}</Text>
                <Text style={{ color: tokens.textSecondary }}>{setSummary(set)}</Text>
              </Pressable>
              <SmallButton
                label="↑"
                onPress={() =>
                  patchItem(kind, itemIndex, {
                    ...item,
                    sets: move(item.sets, setIndex, setIndex - 1),
                  })
                }
                disabled={setIndex === 0}
              />
              <SmallButton
                label="↓"
                onPress={() =>
                  patchItem(kind, itemIndex, {
                    ...item,
                    sets: move(item.sets, setIndex, setIndex + 1),
                  })
                }
                disabled={setIndex === item.sets.length - 1}
              />
              <SmallButton
                label="✕"
                onPress={() =>
                  patchItem(kind, itemIndex, {
                    ...item,
                    sets: item.sets.filter((_, index) => index !== setIndex),
                  })
                }
                disabled={item.sets.length === 1}
                danger
              />
            </View>
          );
        })}
        <Pressable
          onPress={() =>
            patchItem(kind, itemIndex, { ...item, sets: [...item.sets, defaultSet()] })
          }
        >
          <Text style={{ color: tokens.primary }}>+ Add set</Text>
        </Pressable>
      </>
    );
  };

  const renderSuperset = (kind: ModuleKind, item: SupersetItem, itemIndex: number) => {
    let memberOffset = 0;
    return (
      <>
        <View style={styles.inlineFields}>
          <View style={styles.inlineField}>
            <Text style={[styles.smallLabel, { color: tokens.textSecondary }]}>Rounds</Text>
            <TextInput
              value={String(item.rounds)}
              keyboardType="number-pad"
              onChangeText={(value) =>
                patchItem(kind, itemIndex, {
                  ...item,
                  rounds: Math.max(1, Math.round(numberOr(value, item.rounds))),
                })
              }
              style={[
                styles.smallInput,
                {
                  color: tokens.textPrimary,
                  borderColor: tokens.border,
                  backgroundColor: tokens.surface,
                },
              ]}
            />
          </View>
          <View style={styles.inlineField}>
            <Text style={[styles.smallLabel, { color: tokens.textSecondary }]}>
              Rest after round (s)
            </Text>
            <TextInput
              value={item.restSeconds === null ? '' : String(item.restSeconds)}
              keyboardType="number-pad"
              placeholder="None"
              placeholderTextColor={tokens.textSecondary}
              onChangeText={(value) =>
                patchItem(kind, itemIndex, {
                  ...item,
                  restSeconds: value.trim() ? Math.max(0, Math.round(numberOr(value, 0))) : null,
                })
              }
              style={[
                styles.smallInput,
                {
                  color: tokens.textPrimary,
                  borderColor: tokens.border,
                  backgroundColor: tokens.surface,
                },
              ]}
            />
          </View>
        </View>

        {item.members.map((member, memberIndex) => {
          const key = `member-${memberOffset}`;
          memberOffset += 1;
          return (
            <View key={key} style={styles.row}>
              <Pressable
                style={styles.rowText}
                onPress={() =>
                  setSetEditor({
                    kind: 'member',
                    moduleKind: kind,
                    itemIndex,
                    memberIndex,
                    set: member.set,
                  })
                }
              >
                <Text style={{ color: tokens.textPrimary }}>{titleFor(member.exerciseId)}</Text>
                <Text style={{ color: tokens.textSecondary }}>{setSummary(member.set)}</Text>
              </Pressable>
              <SmallButton
                label="↑"
                onPress={() =>
                  patchItem(kind, itemIndex, {
                    ...item,
                    members: move(item.members, memberIndex, memberIndex - 1),
                  })
                }
                disabled={memberIndex === 0}
              />
              <SmallButton
                label="↓"
                onPress={() =>
                  patchItem(kind, itemIndex, {
                    ...item,
                    members: move(item.members, memberIndex, memberIndex + 1),
                  })
                }
                disabled={memberIndex === item.members.length - 1}
              />
              <SmallButton
                label="✕"
                onPress={() =>
                  patchItem(kind, itemIndex, {
                    ...item,
                    members: item.members.filter((_, index) => index !== memberIndex),
                  })
                }
                disabled={item.members.length === 2}
                danger
              />
            </View>
          );
        })}
        <View style={styles.addRow}>
          <Pressable onPress={() => setPicker({ mode: 'member', moduleKind: kind, itemIndex })}>
            <Text style={{ color: tokens.primary }}>+ Add member</Text>
          </Pressable>
          <Pressable onPress={() => ungroup(kind, itemIndex, item)}>
            <Text style={{ color: tokens.textSecondary }}>Ungroup</Text>
          </Pressable>
        </View>
      </>
    );
  };

  const exercisesByModule = (kind: ModuleKind) => {
    const module = routine.modules.find((item) => item.kind === kind);
    return module?.items.filter((item): item is ExerciseItem => item.kind === 'exercise') ?? [];
  };

  return (
    <Screen title="Routine">
      <TextInput
        value={routine.name}
        onChangeText={(name) => setRoutine({ ...routine, name })}
        style={[
          styles.nameInput,
          {
            color: tokens.textPrimary,
            backgroundColor: tokens.surface,
            borderColor: tokens.border,
          },
        ]}
      />

      {routine.modules.map((module, moduleIndex) => (
        <View
          key={module.kind}
          style={[styles.module, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
        >
          <View style={styles.moduleHeader}>
            <Text style={[styles.moduleTitle, { color: tokens.textPrimary }]}>
              {MODULE_LABELS[module.kind]}
            </Text>
            <SmallButton
              label="↑"
              onPress={() => moveModule(moduleIndex, -1)}
              disabled={moduleIndex === 0}
            />
            <SmallButton
              label="↓"
              onPress={() => moveModule(moduleIndex, 1)}
              disabled={moduleIndex === routine.modules.length - 1}
            />
            <Switch
              value={module.enabled}
              onValueChange={(enabled) => patchModule(module.kind, { enabled })}
              trackColor={{ true: tokens.primary, false: tokens.border }}
            />
          </View>

          {module.items.map((item, itemIndex) => {
            const key = `${module.kind}:${itemIndex}`;
            const isOpen = expanded === key;
            const name = item.kind === 'exercise' ? titleFor(item.exerciseId) : 'Superset';
            return (
              <View key={key} style={[styles.item, { borderColor: tokens.border }]}>
                <View style={styles.row}>
                  <Pressable
                    style={styles.rowText}
                    onPress={() => setExpanded(isOpen ? null : key)}
                  >
                    <Text style={{ color: tokens.textPrimary, fontWeight: '600' }}>
                      {isOpen ? '▾' : '▸'} {name}
                    </Text>
                    <Text style={{ color: tokens.textSecondary }}>
                      {item.kind === 'exercise'
                        ? `${item.sets.length} sets`
                        : `${item.members.length} exercises · ${item.rounds} rounds`}
                    </Text>
                  </Pressable>
                  <SmallButton
                    label="↑"
                    onPress={() =>
                      patchModule(module.kind, {
                        items: move(module.items, itemIndex, itemIndex - 1),
                      })
                    }
                    disabled={itemIndex === 0}
                  />
                  <SmallButton
                    label="↓"
                    onPress={() =>
                      patchModule(module.kind, {
                        items: move(module.items, itemIndex, itemIndex + 1),
                      })
                    }
                    disabled={itemIndex === module.items.length - 1}
                  />
                  <SmallButton
                    label="✕"
                    onPress={() => removeItem(module.kind, itemIndex)}
                    danger
                  />
                </View>
                {isOpen
                  ? item.kind === 'exercise'
                    ? renderExerciseItem(module.kind, item, itemIndex)
                    : renderSuperset(module.kind, item, itemIndex)
                  : null}
              </View>
            );
          })}

          <View style={styles.addRow}>
            <Pressable onPress={() => setPicker({ mode: 'exercise', moduleKind: module.kind })}>
              <Text style={{ color: tokens.primary }}>+ Exercise</Text>
            </Pressable>
            <Pressable onPress={() => setPicker({ mode: 'superset', moduleKind: module.kind })}>
              <Text style={{ color: tokens.primary }}>+ Superset</Text>
            </Pressable>
            {exercisesByModule(module.kind).length >= 2 ? (
              <Pressable onPress={() => openGroup(module.kind)}>
                <Text style={{ color: tokens.textSecondary }}>Group exercises</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ))}

      <PrimaryButton label="Save routine" onPress={save} />
      <Pressable onPress={deleteRoutine} style={[styles.delete, { borderColor: tokens.danger }]}>
        <Text style={{ color: tokens.danger }}>Delete routine</Text>
      </Pressable>

      <ExercisePickerModal
        visible={picker !== null && picker.mode !== 'superset'}
        onClose={() => setPicker(null)}
        onSelect={(ids) => {
          if (!picker) return;
          if (picker.mode === 'exercise') addExercises(picker.moduleKind, ids);
          if (picker.mode === 'member') addMember(picker.moduleKind, picker.itemIndex, ids);
        }}
      />
      <ExercisePickerModal
        visible={picker?.mode === 'superset'}
        multi
        onClose={() => setPicker(null)}
        onSelect={(ids) => {
          if (picker?.mode === 'superset') addSuperset(picker.moduleKind, ids);
        }}
      />
      <SetEditorModal
        visible={setEditor !== null}
        set={setEditor?.set ?? null}
        allowRest={setEditor?.kind === 'exercise'}
        onClose={() => setSetEditor(null)}
        onSave={saveSet}
      />

      <Modal
        visible={groupFor !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setGroupFor(null)}
      >
        <View style={styles.overlay}>
          <View style={[styles.groupCard, { backgroundColor: tokens.background }]}>
            <Text style={[styles.groupTitle, { color: tokens.textPrimary }]}>Group exercises</Text>
            <Text style={{ color: tokens.textSecondary }}>
              Pick two or more exercise items. Their first set becomes the member template.
            </Text>
            {(groupFor ? exercisesByModule(groupFor) : []).map((item) => {
              const module = groupFor
                ? routine.modules.find((entry) => entry.kind === groupFor)
                : undefined;
              const itemIndex = module ? module.items.indexOf(item) : -1;
              const selected = groupSelection.includes(itemIndex);
              return (
                <Pressable
                  key={`group-${itemIndex}`}
                  onPress={() =>
                    setGroupSelection((current) =>
                      current.includes(itemIndex)
                        ? current.filter((value) => value !== itemIndex)
                        : [...current, itemIndex],
                    )
                  }
                  style={[
                    styles.groupRow,
                    {
                      borderColor: tokens.border,
                      backgroundColor: selected ? tokens.surfaceElevated : tokens.surface,
                    },
                  ]}
                >
                  <Text style={{ color: tokens.textPrimary, flex: 1 }}>
                    {titleFor(item.exerciseId)}
                  </Text>
                  <Text style={{ color: selected ? tokens.primary : tokens.textSecondary }}>
                    {selected ? '✓' : '+'}
                  </Text>
                </Pressable>
              );
            })}
            <View style={styles.inlineFields}>
              <View style={styles.inlineField}>
                <Text style={[styles.smallLabel, { color: tokens.textSecondary }]}>Rounds</Text>
                <TextInput
                  value={groupRounds}
                  onChangeText={setGroupRounds}
                  keyboardType="number-pad"
                  style={[
                    styles.smallInput,
                    {
                      color: tokens.textPrimary,
                      borderColor: tokens.border,
                      backgroundColor: tokens.surface,
                    },
                  ]}
                />
              </View>
              <View style={styles.inlineField}>
                <Text style={[styles.smallLabel, { color: tokens.textSecondary }]}>Rest (s)</Text>
                <TextInput
                  value={groupRest}
                  onChangeText={setGroupRest}
                  keyboardType="number-pad"
                  placeholder="None"
                  placeholderTextColor={tokens.textSecondary}
                  style={[
                    styles.smallInput,
                    {
                      color: tokens.textPrimary,
                      borderColor: tokens.border,
                      backgroundColor: tokens.surface,
                    },
                  ]}
                />
              </View>
            </View>
            <PrimaryButton label="Create superset" onPress={confirmGroup} />
            <Pressable onPress={() => setGroupFor(null)}>
              <Text style={{ color: tokens.textSecondary, textAlign: 'center' }}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function SmallButton({
  label,
  onPress,
  disabled = false,
  danger = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  const { tokens } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.smallButton,
        {
          borderColor: danger ? tokens.danger : tokens.border,
          opacity: disabled ? 0.3 : 1,
        },
      ]}
    >
      <Text style={{ color: danger ? tokens.danger : tokens.textPrimary }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  nameInput: {
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 20,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  module: {
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  moduleHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  moduleTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
  },
  item: {
    borderTopWidth: 1,
    gap: 8,
    paddingTop: 8,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  addRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  smallButton: {
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    minWidth: 30,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  inlineFields: {
    flexDirection: 'row',
    gap: 12,
  },
  inlineField: {
    flex: 1,
    gap: 4,
  },
  smallLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
  },
  smallInput: {
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 15,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  delete: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 12,
  },
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  groupCard: {
    borderRadius: 16,
    gap: 10,
    padding: 18,
  },
  groupTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  groupRow: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 12,
  },
});
