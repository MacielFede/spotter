import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { DatabaseGate } from '@/db/DatabaseGate';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';

function ThemedApp() {
  const { mode, tokens } = useTheme();
  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          headerStyle: { backgroundColor: tokens.background },
          headerTintColor: tokens.textPrimary,
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="exercises" options={{ headerShown: true, title: 'Exercises' }} />
        <Stack.Screen name="transfer" options={{ headerShown: true, title: 'Import / Export' }} />
        <Stack.Screen name="exercise-editor" options={{ headerShown: true, title: 'Exercise' }} />
        <Stack.Screen name="plan/[id]" options={{ headerShown: true, title: 'Plan' }} />
        <Stack.Screen name="routine-editor" options={{ headerShown: true, title: 'Routine' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <DatabaseGate>
        <ThemedApp />
      </DatabaseGate>
    </ThemeProvider>
  );
}
