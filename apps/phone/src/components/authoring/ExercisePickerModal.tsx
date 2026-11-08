import { type Exercise, ExerciseSchema } from '@spotter/domain';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Icon } from '@/components/ui/Icon';
import { ListRow } from '@/components/ui/ListRow';
import { Modal } from '@/components/ui/Modal';
import { PressableText } from '@/components/ui/PressableText';
import { useSnackbar } from '@/components/ui/SnackbarProvider';
import { TextField } from '@/components/ui/TextField';
import { db } from '@/db/client';
import { findExerciseByTitle, listExercises, saveExercise } from '@/db/exercises';
import { newUuidV7 } from '@/lib/newUuid';
import { useTheme } from '@/theme/ThemeProvider';

interface ExercisePickerModalProps {
  visible: boolean;
  multi?: boolean;
  onClose: () => void;
  onSelect: (exerciseIds: string[]) => void;
}

export function ExercisePickerModal({
  visible,
  multi = false,
  onClose,
  onSelect,
}: ExercisePickerModalProps) {
  const { tokens } = useTheme();
  const [search, setSearch] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [usesWeight, setUsesWeight] = useState(true);
  const { showError } = useSnackbar();

  useEffect(() => {
    if (!visible) return;
    setExercises(listExercises(db));
    setSearch('');
    setSelected([]);
    setCreating(false);
    setUsesWeight(true);
  }, [visible]);

  const filtered = exercises.filter((exercise) =>
    exercise.title.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const choose = (id: string) => {
    if (!multi) {
      onSelect([id]);
      onClose();
      return;
    }
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const create = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      showError('Title cannot be blank.');
      return;
    }
    const duplicate = findExerciseByTitle(db, trimmed);
    if (duplicate) {
      showError(`"${duplicate.title}" already exists.`);
      return;
    }
    const exercise: Exercise = {
      id: newUuidV7(),
      title: trimmed,
      description,
      usesWeight,
      archived: false,
    };
    const parsed = ExerciseSchema.safeParse(exercise);
    if (!parsed.success) {
      showError(parsed.error.issues[0]?.message ?? 'Exercise is not valid.');
      return;
    }
    saveExercise(db, parsed.data);
    setExercises(listExercises(db));
    setCreating(false);
    setTitle('');
    setDescription('');
    setUsesWeight(true);
    choose(parsed.data.id);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: tokens.textPrimary, opacity: 0.35 }]}
        />
        <View style={[styles.sheet, { backgroundColor: tokens.background }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: tokens.textPrimary }]}>
              {creating ? 'New exercise' : 'Choose exercise'}
            </Text>
            <Pressable onPress={onClose} accessibilityRole="button">
              <Text style={{ color: tokens.textSecondary }}>Close</Text>
            </Pressable>
          </View>

          {creating ? (
            <View style={styles.create}>
              <TextField value={title} onChangeText={setTitle} label="Title" placeholder="Title" />
              <TextField
                value={description}
                onChangeText={setDescription}
                label="Description"
                placeholder="Description (optional)"
                multiline
              />
              <ListRow
                title="Track weight"
                subtitle="Turn off for bodyweight or unweighted exercises."
                trailing={
                  <Switch
                    value={usesWeight}
                    onValueChange={setUsesWeight}
                    trackColor={{ true: tokens.primary, false: tokens.border }}
                  />
                }
              />
              <PrimaryButton label="Create & choose" onPress={create} />
              <PressableText
                label="Back to library"
                onPress={() => setCreating(false)}
                tone="secondary"
              />
            </View>
          ) : (
            <>
              <TextField
                value={search}
                onChangeText={setSearch}
                accessibilityLabel="Search exercises"
                placeholder="Search exercises"
              />
              <PressableText label="+ Create new exercise" onPress={() => setCreating(true)} />
              <ScrollView style={styles.list}>
                {filtered.length === 0 ? (
                  <Text style={{ color: tokens.textSecondary }}>No active Exercises match.</Text>
                ) : (
                  filtered.map((exercise) => {
                    const isSelected = selected.includes(exercise.id);
                    return (
                      <Pressable
                        key={exercise.id}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isSelected }}
                        onPress={() => choose(exercise.id)}
                        style={[
                          styles.row,
                          {
                            borderColor: tokens.border,
                            backgroundColor: isSelected ? tokens.surfaceElevated : tokens.surface,
                          },
                        ]}
                      >
                        <Text style={{ color: tokens.textPrimary, flex: 1 }}>{exercise.title}</Text>
                        {multi ? (
                          <Icon
                            name={isSelected ? 'checkmark-circle' : 'add-circle-outline'}
                            tone={isSelected ? 'primary' : 'secondary'}
                          />
                        ) : null}
                      </Pressable>
                    );
                  })
                )}
              </ScrollView>
              {multi ? (
                <Pressable
                  disabled={selected.length === 0}
                  onPress={() => {
                    onSelect(selected);
                    onClose();
                  }}
                  style={[
                    styles.confirm,
                    { backgroundColor: tokens.primary, opacity: selected.length === 0 ? 0.5 : 1 },
                  ]}
                >
                  <Text style={{ color: tokens.onPrimary, fontWeight: '700' }}>
                    Add {selected.length || ''}
                  </Text>
                </Pressable>
              ) : null}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    gap: 12,
    maxHeight: '85%',
    padding: 18,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  create: {
    gap: 12,
  },
  list: {
    maxHeight: 360,
  },
  row: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    minHeight: 48,
    padding: 12,
  },
  confirm: {
    alignItems: 'center',
    borderRadius: 10,
    justifyContent: 'center',
    minHeight: 48,
    paddingVertical: 14,
  },
});
