import type { ReactNode } from 'react';
import { type AccessibilityState, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

interface ListRowProps {
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  onPress?: () => void;
  accessibilityHint?: string;
  accessibilityState?: AccessibilityState;
}

export function ListRow({
  title,
  subtitle,
  trailing,
  onPress,
  accessibilityHint,
  accessibilityState,
}: ListRowProps) {
  const { tokens } = useTheme();
  const content = (
    <>
      <View style={styles.copy}>
        <Text style={[styles.title, { color: tokens.textPrimary }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: tokens.textSecondary }]}>{subtitle}</Text>
        ) : null}
      </View>
      {trailing}
    </>
  );

  if (!onPress) return <View style={styles.row}>{content}</View>;
  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
      accessibilityState={accessibilityState}
      onPress={onPress}
      style={styles.row}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    minHeight: 52,
  },
  copy: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
  },
});
