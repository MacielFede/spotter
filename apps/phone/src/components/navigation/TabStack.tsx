import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

export function TabStack({ title }: { title: string }) {
  const { tokens } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerLargeTitle: Platform.OS === 'ios',
        headerLargeTitleShadowVisible: false,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: tokens.background },
        headerTintColor: tokens.textPrimary,
      }}
    >
      <Stack.Screen name="index" options={{ title }} />
    </Stack>
  );
}
