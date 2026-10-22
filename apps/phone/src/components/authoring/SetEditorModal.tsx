import type { Set as DomainSet, SupersetMemberSet } from '@spotter/domain';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

interface SetEditorModalProps {
  visible: boolean;
  set: DomainSet | SupersetMemberSet | null;
  /** Standalone Sets carry rest; Superset members do not (ADR 0040). */
  allowRest: boolean;
  onClose: () => void;
  onSave: (set: DomainSet | SupersetMemberSet) => void;
}

const numberOrNull = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
};

export function SetEditorModal({ visible, set, allowRest, onClose, onSave }: SetEditorModalProps) {
  const { tokens } = useTheme();
  const [mode, setMode] = useState<'reps' | 'time'>('reps');
  const [target, setTarget] = useState('8');
  const [weight, setWeight] = useState('');
  const [rest, setRest] = useState('');
  const [error, setError] = useState<string | null>(null);

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
    setError(null);
  }, [visible, set]);

  const save = () => {
    const targetValue = numberOrNull(target);
    if (targetValue === null || !Number.isInteger(targetValue) || targetValue <= 0) {
      setError('Target must be a positive whole number.');
      return;
    }
    const weightValue = numberOrNull(weight);
    if (weightValue !== null && weightValue < 0) {
      setError('Weight cannot be negative.');
      return;
    }
    const restValue = allowRest ? numberOrNull(rest) : null;
    if (restValue !== null && (!Number.isInteger(restValue) || restValue < 0)) {
      setError('Rest must be a whole number of seconds.');
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

  const inputStyle = [
    styles.input,
    { color: tokens.textPrimary, borderColor: tokens.border, backgroundColor: tokens.surface },
  ];

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: tokens.background }]}>
          <Text style={[styles.title, { color: tokens.textPrimary }]}>Set</Text>

          <View style={styles.modeRow}>
            {(['reps', 'time'] as const).map((value) => (
              <Pressable
                key={value}
                onPress={() => setMode(value)}
                style={[
                  styles.mode,
                  {
                    borderColor: tokens.border,
                    backgroundColor: mode === value ? tokens.primary : tokens.surface,
                  },
                ]}
              >
                <Text style={{ color: mode === value ? tokens.onPrimary : tokens.textPrimary }}>
                  {value === 'reps' ? 'Reps' : 'Time'}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.label, { color: tokens.textSecondary }]}>
            {mode === 'reps' ? 'Target reps' : 'Target seconds'}
          </Text>
          <TextInput
            value={target}
            onChangeText={setTarget}
            keyboardType="number-pad"
            style={inputStyle}
          />

          <Text style={[styles.label, { color: tokens.textSecondary }]}>Starting weight (kg)</Text>
          <TextInput
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
            placeholder="None"
            placeholderTextColor={tokens.textSecondary}
            style={inputStyle}
          />

          {allowRest ? (
            <>
              <Text style={[styles.label, { color: tokens.textSecondary }]}>
                Rest after set (s)
              </Text>
              <TextInput
                value={rest}
                onChangeText={setRest}
                keyboardType="number-pad"
                placeholder="None"
                placeholderTextColor={tokens.textSecondary}
                style={inputStyle}
              />
            </>
          ) : (
            <Text style={{ color: tokens.textSecondary }}>
              Rest lives on the Superset and fires after each round.
            </Text>
          )}

          {error ? <Text style={{ color: tokens.danger }}>{error}</Text> : null}

          <Pressable onPress={save} style={[styles.save, { backgroundColor: tokens.primary }]}>
            <Text style={{ color: tokens.onPrimary, fontWeight: '700' }}>Done</Text>
          </Pressable>
          <Pressable onPress={onClose} style={styles.cancel}>
            <Text style={{ color: tokens.textSecondary }}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
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
  mode: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 10,
  },
  label: {
    fontSize: 13,
    textTransform: 'uppercase',
  },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  save: {
    alignItems: 'center',
    borderRadius: 10,
    marginTop: 4,
    paddingVertical: 12,
  },
  cancel: {
    alignItems: 'center',
    paddingVertical: 6,
  },
});
