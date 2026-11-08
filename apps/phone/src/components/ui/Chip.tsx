import { Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}

export function Chip({ label, selected, onPress, accessibilityLabel }: ChipProps) {
  const { tokens } = useTheme();
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? tokens.primary : tokens.surface,
          borderColor: selected ? tokens.primary : tokens.border,
        },
      ]}
    >
      <Text style={{ color: selected ? tokens.onPrimary : tokens.textPrimary }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 14,
  },
});
