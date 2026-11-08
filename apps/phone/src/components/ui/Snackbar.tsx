import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { IconButton } from './IconButton';

interface SnackbarProps {
  message: string | null;
  onDismiss: () => void;
}

/** Floating message pinned above the bottom edge; stays until the user taps its X. */
export function Snackbar({ message, onDismiss }: SnackbarProps) {
  const { tokens } = useTheme();
  const insets = useSafeAreaInsets();
  if (!message) return null;
  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.snackbar,
        {
          bottom: insets.bottom + 16,
          backgroundColor: tokens.surfaceElevated,
          borderColor: tokens.border,
        },
      ]}
    >
      <Text style={[styles.message, { color: tokens.danger }]}>{message}</Text>
      <IconButton name="close" accessibilityLabel="Dismiss message" onPress={onDismiss} />
    </View>
  );
}

const styles = StyleSheet.create({
  snackbar: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    left: 16,
    paddingLeft: 14,
    paddingRight: 4,
    paddingVertical: 4,
    position: 'absolute',
    right: 16,
  },
  message: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 8,
  },
});
