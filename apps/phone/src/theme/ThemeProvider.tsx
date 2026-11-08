import AsyncStorage from '@react-native-async-storage/async-storage';
import { type ThemeMode, type ThemeTokens, themes } from '@spotter/theme';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import type { SystemColorScheme } from './systemAppearance';
import {
  getSystemColorScheme,
  resolveThemeMode,
  subscribeToSystemColorScheme,
} from './systemAppearance';

export type ThemePreference = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'spotter.theme.preference';

interface ThemeContextValue {
  mode: ThemeMode;
  tokens: ThemeTokens;
  preference: ThemePreference;
  systemScheme: SystemColorScheme;
  setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const isPreference = (value: string | null): value is ThemePreference =>
  value === 'system' || value === 'light' || value === 'dark';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useSyncExternalStore(
    subscribeToSystemColorScheme,
    getSystemColorScheme,
    getSystemColorScheme,
  );
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const lastKnownScheme = useRef<'light' | 'dark'>('light');

  if (systemScheme !== null) lastKnownScheme.current = systemScheme;

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (active && isPreference(stored)) setPreferenceState(stored);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => undefined);
  }, []);

  const mode: ThemeMode = resolveThemeMode(preference, systemScheme, lastKnownScheme.current);

  const value = useMemo(
    () => ({ mode, tokens: themes[mode], preference, systemScheme, setPreference }),
    [mode, preference, setPreference, systemScheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside a ThemeProvider');
  return value;
}
