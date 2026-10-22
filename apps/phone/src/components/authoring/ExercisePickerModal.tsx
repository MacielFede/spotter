import { type Exercise, ExerciseSchema } from '@spotter/domain';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setExercises(listExercises(db));
    setSearch('');
    setSelected([]);
    setCreating(false);
    setError(null);
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
      setError('Title cannot be blank.');
      return;
    }
    const duplicate = findExerciseByTitle(db, trimmed);
    if (duplicate) {
      setError(`"${duplicate.title}" already exists.`);
      return;
    }
    const exercise: Exercise = {
      id: newUuidV7(),
      title: trimmed,
      description,
      archived: false,
    };
    const parsed = ExerciseSchema.safeParse(exercise);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Exercise is not valid.');
      return;
    }
    saveExercise(db, parsed.data);
    setExercises(listExercises(db));
    setCreating(false);
    setTitle('');
    setDescription('');
    setError(null);
    choose(parsed.data.id);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
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
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Title"
                placeholderTextColor={tokens.textSecondary}
                style={[
                  styles.input,
                  {
                    color: tokens.textPrimary,
                    borderColor: tokens.border,
                    backgroundColor: tokens.surface,
                  },
                ]}
              />
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Description (optional)"
                placeholderTextColor={tokens.textSecondary}
                style={[
                  styles.input,
                  {
                    color: tokens.textPrimary,
                    borderColor: tokens.border,
                    backgroundColor: tokens.surface,
                  },
                ]}
              />
              {error ? <Text style={{ color: tokens.danger }}>{error}</Text> : null}
              <Pressable
                onPress={create}
                style={[styles.confirm, { backgroundColor: tokens.primary }]}
              >
                <Text style={{ color: tokens.onPrimary, fontWeight: '700' }}>Create & choose</Text>
              </Pressable>
              <Pressable onPress={() => setCreating(false)}>
                <Text style={{ color: tokens.textSecondary }}>Back to library</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search exercises"
                placeholderTextColor={tokens.textSecondary}
                style={[
                  styles.input,
                  {
                    color: tokens.textPrimary,
                    borderColor: tokens.border,
                    backgroundColor: tokens.surface,
                  },
                ]}
              />
              <Pressable onPress={() => setCreating(true)}>
                <Text style={{ color: tokens.primary }}>+ Create new exercise</Text>
              </Pressable>
              <ScrollView style={styles.list}>
                {filtered.length === 0 ? (
                  <Text style={{ color: tokens.textSecondary }}>No active Exercises match.</Text>
                ) : (
                  filtered.map((exercise) => {
                    const isSelected = selected.includes(exercise.id);
                    return (
                      <Pressable
                        key={exercise.id}
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
                          <Text
                            style={{ color: isSelected ? tokens.primary : tokens.textSecondary }}
                          >
                            {isSelected ? '✓' : '+'}
                          </Text>
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
    backgroundColor: 'rgba(0,0,0,0.35)',
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
  input: {
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
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
    padding: 12,
  },
  confirm: {
    alignItems: 'center',
    borderRadius: 10,
    paddingVertical: 14,
  },
});
