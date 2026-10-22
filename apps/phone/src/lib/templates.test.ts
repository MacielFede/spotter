import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { SCHEMA_VERSION } from '@spotter/domain';
import { describe, expect, it } from 'vitest';
import { parsePlanExport, prepareWorkoutsCsvImport } from './interop';
import { LOGS_TEMPLATE, PLAN_TEMPLATE, TEMPLATES } from './templates';

const templateDir = fileURLToPath(new URL('../../templates', import.meta.url));

describe('canonical templates (issue #54)', () => {
  it('ships a Plan JSON template that parses at the current version', () => {
    const parsed = parsePlanExport(PLAN_TEMPLATE);
    expect(parsed.schemaVersion).toBe(SCHEMA_VERSION);
    expect(parsed.plan.routines.length).toBeGreaterThan(0);
    expect(parsed.exercises.length).toBeGreaterThan(0);
  });

  it('ships a log CSV template that parses at the current version', () => {
    const preview = prepareWorkoutsCsvImport(LOGS_TEMPLATE, []);
    expect(preview.accepted).toHaveLength(1);
    expect(preview.conflicts).toHaveLength(0);
  });

  it('keeps the committed files in sync with the templates', () => {
    for (const [file, content] of Object.entries(TEMPLATES)) {
      expect(readFileSync(`${templateDir}/${file}`, 'utf8')).toBe(content);
    }
  });
});
