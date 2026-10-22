import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SCHEMA_VERSION } from '@spotter/domain';

const codegenDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = join(codegenDir, '..', '..');

/** The single shared token source (ADR 0018). */
export const themeSourcePath = join(repoRoot, 'packages', 'theme', 'src', 'tokens.json');

/** Committed generated theme artifacts live here. */
export const themeGenDir = join(repoRoot, 'packages', 'theme', 'gen');

export type ThemeMode = 'light' | 'dark';

export interface ThemeTokenSource {
  roles: Record<ThemeMode, Record<string, string>>;
  watchRoles: string[];
}

export const readThemeTokens = (): ThemeTokenSource =>
  JSON.parse(readFileSync(themeSourcePath, 'utf8')) as ThemeTokenSource;

const roleEntries = (tokens: ThemeTokenSource, mode: ThemeMode): [string, string][] =>
  Object.entries(tokens.roles[mode]);

const assertHex = (role: string, value: string): string => {
  if (!/^#[0-9a-fA-F]{6}$/.test(value)) {
    throw new Error(`theme: ${role} must be a #RRGGBB color, got '${value}'`);
  }
  return value;
};

/** Phone tokens: a typed TypeScript module (ADR 0018, issue #17 consumes it). */
export const emitPhoneTheme = (tokens: ThemeTokenSource): string => {
  const roles = roleEntries(tokens, 'light').map(([role]) => role);
  const roleUnion = roles.map((role) => `'${role}'`).join(' | ');

  const renderMode = (mode: ThemeMode): string => {
    const body = roleEntries(tokens, mode)
      .map(([role, value]) => `    ${role}: '${assertHex(role, value)}',`)
      .join('\n');
    return `  ${mode}: {\n${body}\n  },`;
  };

  return `// Generated from packages/theme/src/tokens.json — do not hand-edit (ADR 0018).

export const THEME_VERSION = ${SCHEMA_VERSION} as const;

export type ThemeMode = 'light' | 'dark';
export type ThemeRole = ${roleUnion};
export type ThemeTokens = Record<ThemeRole, string>;

export const themes: Record<ThemeMode, ThemeTokens> = {
${renderMode('light')}
${renderMode('dark')}
};
`;
};

/** Wear OS tokens: a trimmed Compose color subset from the same source (issue #19). */
export const emitWearTheme = (tokens: ThemeTokenSource): string => {
  const renderMode = (mode: ThemeMode): string => {
    const all = new Map(roleEntries(tokens, mode));
    const body = tokens.watchRoles
      .map((role) => {
        const value = all.get(role);
        if (!value) throw new Error(`theme: watch role '${role}' is missing in ${mode}`);
        const argb = `0xFF${assertHex(role, value).slice(1).toUpperCase()}`;
        return `        val ${role} = Color(${argb})`;
      })
      .join('\n');
    return `    object ${mode === 'light' ? 'Light' : 'Dark'} {\n${body}\n    }`;
  };

  return `// Generated from packages/theme/src/tokens.json — do not hand-edit (ADR 0018).
package app.spotter.wear.theme

import androidx.compose.ui.graphics.Color

object SpotterColors {
    const val VERSION: Int = ${SCHEMA_VERSION}

${renderMode('light')}

${renderMode('dark')}
}
`;
};

export const themeTargets = [
  { file: 'phone/theme.ts', emit: emitPhoneTheme },
  { file: 'wearos/Theme.kt', emit: emitWearTheme },
] as const;

/** Deterministic emission keyed by path relative to `themeGenDir`. */
export const emitThemes = (): Record<string, string> => {
  const tokens = readThemeTokens();
  return Object.fromEntries(themeTargets.map(({ file, emit }) => [file, emit(tokens)]));
};
