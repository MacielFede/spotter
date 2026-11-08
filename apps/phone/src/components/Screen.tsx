import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

/** Plain scrollable body surface; the route navigator owns the screen title. */
export function Screen({ children }: { children?: ReactNode }) {
  const { tokens } = useTheme();
  return (
    <ScrollView
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      style={{ backgroundColor: tokens.background, flex: 1 }}
    >
      <View style={styles.body}>{children}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    padding: 20,
  },
  body: {
    gap: 12,
  },
});
