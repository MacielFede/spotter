import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

interface CardProps extends Omit<ViewProps, 'children'> {
  children?: ReactNode;
  padded?: boolean;
}

export function Card({ children, padded = true, style, ...props }: CardProps) {
  const { tokens } = useTheme();
  return (
    <View
      {...props}
      style={[
        styles.card,
        padded && styles.padded,
        { backgroundColor: tokens.surface, borderColor: tokens.border },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  padded: {
    padding: 14,
  },
});
