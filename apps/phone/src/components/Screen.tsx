import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useTheme } from '@/theme/ThemeProvider';

/** Scrollable body surface that keeps the focused field above the keyboard; the route navigator owns the screen title. */
export function Screen({ children }: { children?: ReactNode }) {
  const { tokens } = useTheme();
  return (
    <KeyboardAwareScrollView
      bottomOffset={20}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      style={{ backgroundColor: tokens.background, flex: 1 }}
    >
      <View style={styles.body}>{children}</View>
    </KeyboardAwareScrollView>
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
