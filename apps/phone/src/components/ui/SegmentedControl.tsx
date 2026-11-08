import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

export interface SegmentOption<Value extends string> {
  value: Value;
  label: string;
}

interface SegmentedControlProps<Value extends string> {
  options: SegmentOption<Value>[];
  value: Value;
  onChange: (value: Value) => void;
}

export function SegmentedControl<Value extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<Value>) {
  const { tokens } = useTheme();
  return (
    <View
      accessibilityRole="tablist"
      style={[styles.container, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
    >
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[
              styles.segment,
              { backgroundColor: selected ? tokens.surfaceElevated : 'transparent' },
            ]}
          >
            <Text style={{ color: selected ? tokens.textPrimary : tokens.textSecondary }}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    padding: 3,
  },
  segment: {
    alignItems: 'center',
    borderRadius: 9,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 8,
  },
});
