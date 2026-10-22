// Generated from packages/theme/src/tokens.json — do not hand-edit (ADR 0018).

export const THEME_VERSION = 1 as const;

export type ThemeMode = 'light' | 'dark';
export type ThemeRole = 'background' | 'surface' | 'surfaceElevated' | 'border' | 'textPrimary' | 'textSecondary' | 'primary' | 'onPrimary' | 'danger' | 'onDanger';
export type ThemeTokens = Record<ThemeRole, string>;

export const themes: Record<ThemeMode, ThemeTokens> = {
  light: {
    background: '#FFFFFF',
    surface: '#F1F7FB',
    surfaceElevated: '#FFFFFF',
    border: '#D3E3EE',
    textPrimary: '#0B1B24',
    textSecondary: '#52646F',
    primary: '#0EA5E9',
    onPrimary: '#FFFFFF',
    danger: '#BE123C',
    onDanger: '#FFFFFF',
  },
  dark: {
    background: '#08131A',
    surface: '#10212B',
    surfaceElevated: '#162C38',
    border: '#24404F',
    textPrimary: '#EAF6FC',
    textSecondary: '#A3BBC8',
    primary: '#38BDF8',
    onPrimary: '#04222F',
    danger: '#FB7185',
    onDanger: '#3B0713',
  },
};
