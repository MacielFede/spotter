import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

export function Divider() {
  const { tokens } = useTheme();
  return (
    <View accessibilityElementsHidden style={[styles.rule, { backgroundColor: tokens.border }]} />
  );
}

const styles = StyleSheet.create({
  rule: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
});
