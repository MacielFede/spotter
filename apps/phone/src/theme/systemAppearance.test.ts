import { themes } from '@spotter/theme';
import { describe, expect, it, vi } from 'vitest';

const appearance = vi.hoisted(() => ({
  scheme: 'light' as string | null,
  listener: undefined as (() => void) | undefined,
  getColorScheme: vi.fn(() => appearance.scheme),
  addChangeListener: vi.fn((listener: () => void) => {
    appearance.listener = listener;
    return { remove: vi.fn() };
  }),
}));

vi.mock('react-native', () => ({ Appearance: appearance }));

import {
  getSystemColorScheme,
  resolveThemeMode,
  subscribeToSystemColorScheme,
} from './systemAppearance';

describe('system theme resolution (ThemeProvider)', () => {
  it('uses the system light or dark scheme when selected', () => {
    appearance.scheme = 'dark';
    expect(themes[resolveThemeMode('system', getSystemColorScheme())]).toBe(themes.dark);

    appearance.scheme = 'light';
    expect(themes[resolveThemeMode('system', getSystemColorScheme())]).toBe(themes.light);
  });

  it('subscribes to Appearance changes and preserves the last known scheme on unknown', () => {
    const onChange = vi.fn();
    const unsubscribe = subscribeToSystemColorScheme(onChange);
    appearance.listener?.();
    expect(onChange).toHaveBeenCalledOnce();

    appearance.scheme = null;
    expect(resolveThemeMode('system', getSystemColorScheme(), 'dark')).toBe('dark');
    expect(resolveThemeMode('dark', 'light')).toBe('dark');

    unsubscribe();
  });

  it('normalizes unknown system values so they cannot produce missing theme tokens', () => {
    appearance.scheme = 'unspecified';
    const scheme = getSystemColorScheme();

    expect(scheme).toBeNull();
    expect(resolveThemeMode('system', scheme, 'dark')).toBe('dark');
  });
});
