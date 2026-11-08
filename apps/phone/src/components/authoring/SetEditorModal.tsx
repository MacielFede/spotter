import type { Set as DomainSet, SupersetMemberSet } from '@spotter/domain';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Chip } from '@/components/ui/Chip';
import { Modal } from '@/components/ui/Modal';
import { NumberField } from '@/components/ui/NumberField';
import { PressableText } from '@/components/ui/PressableText';
import { useSnackbar } from '@/components/ui/SnackbarProvider';
import { useTheme } from '@/theme/ThemeProvider';

interface SetEditorModalProps {
  visible: boolean;
  set: DomainSet | SupersetMemberSet | null;
  /** Standalone Sets carry rest; Superset members do not (ADR 0040). */
  allowRest: boolean;
  allowWeight?: boolean;
  onClose: () => void;
  onSave: (set: DomainSet | SupersetMemberSet) => void;
}

const numberOrNull = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
};

export function SetEditorModal({
  visible,
  set,
  allowRest,
  allowWeight = true,
  onClose,
  onSave,
}: SetEditorModalProps) {
  const { tokens } = useTheme();
  const [mode, setMode] = useState<'reps' | 'time'>('reps');
  const [target, setTarget] = useState('8');
  const [weight, setWeight] = useState('');
  const [rest, setRest] = useState('');
  const { showError } = useSnackbar();

  useEffect(() => {
    if (!visible) return;
    if (set) {
      setMode(set.mode);
      setTarget(String(set.mode === 'reps' ? set.targetReps : set.targetSeconds));
      setWeight(set.weightKg === null ? '' : String(set.weightKg));
      setRest('restSeconds' in set && set.restSeconds !== null ? String(set.restSeconds) : '');
    } else {
      setMode('reps');
      setTarget('8');
      setWeight('');
      setRest('');
    }
  }, [visible, set]);

  const save = () => {
    const targetValue = numberOrNull(target);
    if (targetValue === null || !Number.isInteger(targetValue) || targetValue <= 0) {
      showError('Target must be a positive whole number.');
      return;
    }
    const weightValue = allowWeight ? numberOrNull(weight) : null;
    if (weightValue !== null && weightValue < 0) {
      showError('Weight cannot be negative.');
      return;
    }
    const restValue = allowRest ? numberOrNull(rest) : null;
    if (restValue !== null && (!Number.isInteger(restValue) || restValue < 0)) {
      showError('Rest must be a whole number of seconds.');
      return;
    }

    if (mode === 'reps') {
      onSave({
        mode,
        targetReps: targetValue,
        weightKg: weightValue,
        ...(allowRest ? { restSeconds: restValue } : {}),
      });
    } else {
      onSave({
        mode,
        targetSeconds: targetValue,
        weightKg: weightValue,
        ...(allowRest ? { restSeconds: restValue } : {}),
      });
    }
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: tokens.textPrimary, opacity: 0.35 }]}
        />
        <View style={[styles.card, { backgroundColor: tokens.background }]}>
          <Text style={[styles.title, { color: tokens.textPrimary }]}>Set</Text>

          <View style={styles.modeRow}>
            {(['reps', 'time'] as const).map((value) => (
              <Chip
                key={value}
                label={value === 'reps' ? 'Reps' : 'Time'}
                onPress={() => setMode(value)}
                selected={mode === value}
              />
            ))}
          </View>

          <NumberField
            label={mode === 'reps' ? 'Target reps' : 'Target seconds'}
            value={target}
            onChangeText={setTarget}
            unit={mode === 'reps' ? 'reps' : 'sec'}
          />

          {allowWeight ? (
            <NumberField
              label="Starting weight"
              value={weight}
              onChangeText={setWeight}
              placeholder="None"
              decimal
              unit="kg"
            />
          ) : null}

          {allowRest ? (
            <NumberField
              label="Rest after set"
              value={rest}
              onChangeText={setRest}
              placeholder="None"
              unit="sec"
            />
          ) : (
            <Text style={{ color: tokens.textSecondary }}>
              Rest lives on the Superset and fires after each round.
            </Text>
          )}

          <PrimaryButton label="Done" onPress={save} />
          <PressableText label="Cancel" onPress={onClose} tone="secondary" />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    borderRadius: 16,
    gap: 10,
    padding: 18,
    width: '100%',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
  },
});
