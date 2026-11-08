import type { Ref } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { NumberField } from '@/components/ui/NumberField';
import type { TextInputRef } from '@/components/ui/TextField';
import { formatTimer, parseTimerInput } from '@/lib/formatWhen';
import { useTheme } from '@/theme/ThemeProvider';

type Mode = 'reps' | 'time';

interface SetRowProps {
  label: string;
  mode: Mode;
  targetValue: number;
  targetWeightKg: number | null;
  actualValue: number | null;
  actualWeightKg: number | null;
  suggestedValue: number | null;
  suggestedWeightKg: number | null;
  usesWeight: boolean;
  onActualChange: (value: number | null) => void;
  onWeightChange: (value: number | null) => void;
  targetFieldKey: string;
  weightFieldKey?: string;
  nextTargetFieldKey?: string;
  nextWeightFieldKey?: string;
  registerInput: (key: string) => Ref<TextInputRef>;
  focusInput: (key: string | undefined) => void;
}

const initialActualText = (mode: Mode, value: number): string =>
  mode === 'time' && value >= 60 ? formatTimer(value) : String(value);

const numberOrNull = (value: string): number | null => {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const weightText = (value: number | null): string => (value === null ? '' : String(value));

export function SetRow({
  label,
  mode,
  targetValue,
  targetWeightKg,
  actualValue,
  actualWeightKg,
  suggestedValue,
  suggestedWeightKg,
  usesWeight,
  onActualChange,
  onWeightChange,
  targetFieldKey,
  weightFieldKey,
  nextTargetFieldKey,
  nextWeightFieldKey,
  registerInput,
  focusInput,
}: SetRowProps) {
  const { tokens } = useTheme();
  const actualFocused = useRef(false);
  const weightFocused = useRef(false);
  const shownValue = actualValue ?? suggestedValue ?? targetValue;
  const shownWeightKg = actualWeightKg ?? suggestedWeightKg ?? targetWeightKg;
  const [actualText, setActualText] = useState(() => initialActualText(mode, shownValue));
  const [weightValue, setWeightValue] = useState(() => weightText(shownWeightKg));

  useEffect(() => {
    if (!actualFocused.current) setActualText(initialActualText(mode, shownValue));
  }, [mode, shownValue]);

  useEffect(() => {
    if (!weightFocused.current) setWeightValue(weightText(shownWeightKg));
  }, [shownWeightKg]);

  const prescribed = mode === 'reps' ? `${targetValue} reps` : formatTimer(targetValue);
  const prescribedLine =
    usesWeight && targetWeightKg !== null ? `${prescribed} · ${targetWeightKg} kg` : prescribed;

  return (
    <View style={styles.row}>
      <View style={styles.summary}>
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: tokens.textPrimary }]}>{label}</Text>
          {actualValue !== null ? <Icon name="checkmark-circle" size={16} tone="primary" /> : null}
        </View>
        <Text style={[styles.prescribed, { color: tokens.textSecondary }]}>{prescribedLine}</Text>
      </View>
      <NumberField
        accessibilityLabel={mode === 'reps' ? 'Actual reps' : 'Actual duration in seconds or mm:ss'}
        inputRef={registerInput(targetFieldKey)}
        keyboardType={
          mode === 'time'
            ? Platform.OS === 'ios'
              ? 'numbers-and-punctuation'
              : 'default'
            : 'number-pad'
        }
        onChangeText={(raw) => {
          setActualText(raw);
          onActualChange(mode === 'time' ? parseTimerInput(raw) : numberOrNull(raw));
        }}
        onBlur={() => {
          actualFocused.current = false;
          setActualText(initialActualText(mode, shownValue));
        }}
        onFocus={() => {
          actualFocused.current = true;
        }}
        onSubmitNext={() => focusInput(nextWeightFieldKey ?? nextTargetFieldKey)}
        placeholder={mode === 'reps' ? String(targetValue) : formatTimer(targetValue)}
        submitBehavior="submit"
        unit={mode === 'reps' ? 'reps' : undefined}
        value={actualText}
        wrapperStyle={styles.field}
      />
      {usesWeight && weightFieldKey ? (
        <NumberField
          accessibilityLabel="Actual weight in kilograms"
          decimal
          inputRef={registerInput(weightFieldKey)}
          onChangeText={(raw) => {
            setWeightValue(raw);
            onWeightChange(numberOrNull(raw));
          }}
          onBlur={() => {
            weightFocused.current = false;
            setWeightValue(weightText(shownWeightKg));
          }}
          onFocus={() => {
            weightFocused.current = true;
          }}
          onSubmitNext={() => focusInput(nextTargetFieldKey)}
          placeholder={targetWeightKg === null ? '—' : String(targetWeightKg)}
          submitBehavior="submit"
          unit="kg"
          value={weightValue}
          wrapperStyle={styles.field}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  summary: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  labelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  prescribed: {
    fontSize: 12,
    lineHeight: 16,
  },
  field: {
    width: 96,
  },
});
