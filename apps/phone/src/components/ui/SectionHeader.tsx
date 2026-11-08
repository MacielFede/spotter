import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

interface SectionHeaderProps {
  title: string;
  action?: ReactNode;
  supportingText?: string;
}

export function SectionHeader({ title, action, supportingText }: SectionHeaderProps) {
  const { tokens } = useTheme();
  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        <Text style={[styles.title, { color: tokens.textSecondary }]}>{title}</Text>
        {action}
      </View>
      {supportingText ? (
        <Text style={[styles.supportingText, { color: tokens.textSecondary }]}>
          {supportingText}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 4,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  supportingText: {
    fontSize: 13,
  },
});
