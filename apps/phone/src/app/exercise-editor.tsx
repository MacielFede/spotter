import { type Exercise, ExerciseSchema } from '@spotter/domain';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { db } from '@/db/client';
import {
  findExerciseByTitle,
  loadExercise,
  saveExercise,
  setExerciseArchived,
} from '@/db/exercises';
import { newUuidV7 } from '@/lib/newUuid';
import { useTheme } from '@/theme/ThemeProvider';

export default function ExerciseEditorScreen() {
  const { tokens } = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editingId = typeof id === 'string' && id.length > 0 ? id : undefined;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [archived, setArchived] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editingId) return;
    const existing = loadExercise(db, editingId);
    if (existing) {
      setTitle(existing.title);
      setDescription(existing.description);
      setArchived(existing.archived);
    }
  }, [editingId]);

  const save = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      setError('Title cannot be blank.');
      return;
    }

    const duplicate = findExerciseByTitle(db, trimmed);
    if (duplicate && duplicate.id !== editingId) {
      setError(`"${duplicate.title}" already exists. Exercise titles are unique.`);
      return;
    }

    const next: Exercise = {
      id: editingId ?? newUuidV7(),
      title: trimmed,
      description,
      archived,
    };
    const parsed = ExerciseSchema.safeParse(next);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Exercise is not valid.');
      return;
    }

    try {
      saveExercise(db, parsed.data);
      router.back();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save the Exercise.');
    }
  };

  const toggleArchived = () => {
    if (!editingId) return;
    const next = !archived;
    setExerciseArchived(db, editingId, next);
    setArchived(next);
  };

  return (
    <Screen title={editingId ? 'Edit exercise' : 'New exercise'}>
      <View style={styles.field}>
        <Text style={[styles.label, { color: tokens.textPrimary }]}>Title</Text>
        <TextInput
          value={title}
          onChangeText={(value) => {
            setTitle(value);
            setError(null);
          }}
          placeholder="Bench Press"
          placeholderTextColor={tokens.textSecondary}
          autoCapitalize="words"
          style={[
            styles.input,
            {
              color: tokens.textPrimary,
              backgroundColor: tokens.surface,
              borderColor: tokens.border,
            },
          ]}
        />
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: tokens.textPrimary }]}>Description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Free text; links become tappable."
          placeholderTextColor={tokens.textSecondary}
          multiline
          textAlignVertical="top"
          style={[
            styles.input,
            styles.multiline,
            {
              color: tokens.textPrimary,
              backgroundColor: tokens.surface,
              borderColor: tokens.border,
            },
          ]}
        />
      </View>

      {editingId ? (
        <View style={styles.field}>
          <View style={styles.switchRow}>
            <View style={styles.switchText}>
              <Text style={[styles.label, { color: tokens.textPrimary }]}>Archived</Text>
              <Text style={[styles.hint, { color: tokens.textSecondary }]}>
                Archived Exercises are hidden from authoring pickers but keep existing Routines and
                history working.
              </Text>
            </View>
            <Switch
              value={archived}
              onValueChange={toggleArchived}
              trackColor={{ true: tokens.primary, false: tokens.border }}
            />
          </View>
        </View>
      ) : null}

      {error ? <Text style={{ color: tokens.danger }}>{error}</Text> : null}

      <PrimaryButton label={editingId ? 'Save changes' : 'Create exercise'} onPress={save} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 6,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  hint: {
    fontSize: 13,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  multiline: {
    minHeight: 120,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  switchText: {
    flex: 1,
    gap: 2,
  },
});
