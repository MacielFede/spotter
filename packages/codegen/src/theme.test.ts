import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SCHEMA_VERSION } from '@spotter/domain';
import { describe, expect, it } from 'vitest';
import { emitThemes, readThemeTokens, themeGenDir, themeTargets } from './theme.js';

describe('theme codegen (issue #16)', () => {
  it('emits deterministically', () => {
    expect(emitThemes()).toEqual(emitThemes());
  });

  it('covers both modes with the same semantic roles', () => {
    const tokens = readThemeTokens();
    expect(Object.keys(tokens.roles.light)).toEqual(Object.keys(tokens.roles.dark));
    expect(tokens.roles.light.primary).toBeTruthy();
    expect(tokens.roles.dark.primary).toBeTruthy();
  });

  it('versions the tokens alongside the domain schema (ADR 0018)', () => {
    const phone = emitThemes()['phone/theme.ts'] ?? '';
    const wear = emitThemes()['wearos/Theme.kt'] ?? '';
    expect(phone).toContain(`THEME_VERSION = ${SCHEMA_VERSION}`);
    expect(wear).toContain(`VERSION: Int = ${SCHEMA_VERSION}`);
  });

  it('keeps the Wear OS output to the trimmed role subset', () => {
    const tokens = readThemeTokens();
    const wear = emitThemes()['wearos/Theme.kt'] ?? '';
    for (const role of tokens.watchRoles) expect(wear).toContain(`val ${role} = Color(`);
    expect(wear).not.toContain('val border = Color(');
  });

  it('matches the committed artifacts — regenerate with `pnpm codegen`', () => {
    const emitted = emitThemes();
    for (const { file } of themeTargets) {
      const path = join(themeGenDir, file);
      expect(existsSync(path)).toBe(true);
      expect(readFileSync(path, 'utf8')).toBe(emitted[file]);
    }
  });
});
