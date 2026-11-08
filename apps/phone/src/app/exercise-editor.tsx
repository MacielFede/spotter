import { type Exercise, ExerciseSchema } from '@spotter/domain';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Switch } from 'react-native';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/ui/Card';
import { ListRow } from '@/components/ui/ListRow';
import { useSnackbar } from '@/components/ui/SnackbarProvider';
import { TextField } from '@/components/ui/TextField';
import { db } from '@/db/client';
import {
  findExerciseByTitle,
  loadExercise,
  saveExercise,
  setExerciseArchived,
} from '@/db/exercises';
import { useScreenHeader } from '@/hooks/useScreenHeader';
import { newUuidV7 } from '@/lib/newUuid';
import { useTheme } from '@/theme/ThemeProvider';

export default function ExerciseEditorScreen() {
  const { tokens } = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editingId = typeof id === 'string' && id.length > 0 ? id : undefined;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [usesWeight, setUsesWeight] = useState(true);
  const [archived, setArchived] = useState(false);
  const [titleInvalid, setTitleInvalid] = useState(false);
  const { showError } = useSnackbar();

  useScreenHeader(title.trim() || (editingId ? 'Exercise' : 'New Exercise'));

  useEffect(() => {
    if (!editingId) return;
    const existing = loadExercise(db, editingId);
    if (existing) {
      setTitle(existing.title);
      setDescription(existing.description);
      setUsesWeight(existing.usesWeight);
      setArchived(existing.archived);
    }
  }, [editingId]);

  const save = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      setTitleInvalid(true);
      showError('Title cannot be blank.');
      return;
    }

    const duplicate = findExerciseByTitle(db, trimmed);
    if (duplicate && duplicate.id !== editingId) {
      setTitleInvalid(true);
      showError(`"${duplicate.title}" already exists. Exercise titles are unique.`);
      return;
    }

    const next: Exercise = {
      id: editingId ?? newUuidV7(),
      title: trimmed,
      description,
      usesWeight,
      archived,
    };
    const parsed = ExerciseSchema.safeParse(next);
    if (!parsed.success) {
      showError(parsed.error.issues[0]?.message ?? 'Exercise is not valid.');
      return;
    }

    try {
      saveExercise(db, parsed.data);
      router.back();
    } catch (cause) {
      showError(cause instanceof Error ? cause.message : 'Could not save the Exercise.');
    }
  };

  const toggleArchived = () => {
    if (!editingId) return;
    const next = !archived;
    setExerciseArchived(db, editingId, next);
    setArchived(next);
  };

  return (
    <Screen>
      <TextField
        autoCapitalize="words"
        invalid={titleInvalid}
        label="Title"
        onChangeText={(value) => {
          setTitle(value);
          setTitleInvalid(false);
        }}
        placeholder="Bench Press"
        value={title}
      />

      <TextField
        label="Description"
        multiline
        onChangeText={setDescription}
        placeholder="Free text; links become tappable."
        value={description}
      />

      <Card>
        <ListRow
          title="Track weight"
          subtitle={
            usesWeight
              ? 'Sets record kilograms.'
              : 'This exercise records reps or time without kilograms.'
          }
          trailing={
            <Switch
              value={usesWeight}
              onValueChange={setUsesWeight}
              trackColor={{ true: tokens.primary, false: tokens.border }}
            />
          }
        />
      </Card>

      {editingId ? (
        <Card>
          <ListRow
            title="Archived"
            subtitle="Archived Exercises are hidden from authoring pickers but keep existing Routines and history working."
            trailing={
              <Switch
                value={archived}
                onValueChange={toggleArchived}
                trackColor={{ true: tokens.primary, false: tokens.border }}
              />
            }
          />
        </Card>
      ) : null}

      <PrimaryButton label={editingId ? 'Save changes' : 'Create exercise'} onPress={save} />
    </Screen>
  );
}
