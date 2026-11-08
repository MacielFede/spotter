import { Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

type Tone = 'primary' | 'secondary' | 'danger';

interface PressableTextProps {
  label: string;
  onPress: () => void;
  tone?: Tone;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function PressableText({
  label,
  onPress,
  tone = 'primary',
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
}: PressableTextProps) {
  const { tokens } = useTheme();
  const color =
    tone === 'danger'
      ? tokens.danger
      : tone === 'secondary'
        ? tokens.textSecondary
        : tokens.primary;
  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.touchTarget, { opacity: disabled ? 0.45 : 1 }]}
    >
      <Text style={{ color, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  touchTarget: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    minWidth: 48,
    paddingHorizontal: 4,
  },
});
