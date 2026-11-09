import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { IconButton } from './IconButton';

const LINE_HEIGHT = 20;
const CHROME_HEIGHT = 26;
const EDGE_OFFSET = 16;

interface SnackbarProps {
  message: string | null;
  onDismiss: () => void;
}

/** Floating message pinned above the bottom edge; stays until the user taps its X. */
export function Snackbar({ message, onDismiss }: SnackbarProps) {
  const { tokens } = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  if (!message) return null;
  const availableHeight = height - insets.top - insets.bottom - EDGE_OFFSET - CHROME_HEIGHT;
  const maxLines = Math.max(1, Math.floor(availableHeight / LINE_HEIGHT));
  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.snackbar,
        {
          bottom: insets.bottom + EDGE_OFFSET,
          backgroundColor: tokens.surfaceElevated,
          borderColor: tokens.border,
        },
      ]}
    >
      <Text numberOfLines={maxLines} style={[styles.message, { color: tokens.danger }]}>
        {message}
      </Text>
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
    lineHeight: LINE_HEIGHT,
    paddingVertical: 8,
  },
});
