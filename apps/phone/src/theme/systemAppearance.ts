import type { ThemeMode } from '@spotter/theme';
import { Appearance } from 'react-native';

export type SystemColorScheme = ThemeMode | null;

const isThemeMode = (value: unknown): value is ThemeMode => value === 'light' || value === 'dark';

export const getSystemColorScheme = (): SystemColorScheme => {
  const scheme: unknown = Appearance.getColorScheme();
  return isThemeMode(scheme) ? scheme : null;
};

export const subscribeToSystemColorScheme = (listener: () => void): (() => void) => {
  const subscription = Appearance.addChangeListener(listener);
  return () => subscription.remove();
};

export const resolveThemeMode = (
  preference: ThemeMode | 'system',
  systemScheme: SystemColorScheme,
  lastKnownScheme: ThemeMode = 'light',
): ThemeMode => {
  if (preference === 'light' || preference === 'dark') return preference;
  if (isThemeMode(systemScheme)) return systemScheme;
  return lastKnownScheme === 'dark' ? 'dark' : 'light';
};
