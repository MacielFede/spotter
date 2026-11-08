import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

interface BannerProps {
  children: string;
  onPress?: () => void;
}

export function Banner({ children, onPress }: BannerProps) {
  const { tokens } = useTheme();
  const content = <Text style={[styles.text, { color: tokens.onPrimary }]}>{children}</Text>;
  if (!onPress) {
    return <View style={[styles.banner, { backgroundColor: tokens.primary }]}>{content}</View>;
  }
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.banner, { backgroundColor: tokens.primary }]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    justifyContent: 'center',
    borderRadius: 12,
    minHeight: 48,
    padding: 14,
  },
  text: {
    fontWeight: '700',
  },
});
