import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SCHEMA_VERSION } from '@spotter/domain';
import { describe, expect, it } from 'vitest';
import type { z } from 'zod';
import { allSchemaTargets, domainGenDir, emitJsonSchemas } from './emit.js';

const validExercise = {
  id: '0193a1b2-c3d4-7e5f-89ab-cdef01234567',
  title: 'Bench Press',
  description: 'Bar to chest.',
  archived: false,
};

describe('JSON Schema emission (issue #12)', () => {
  it('emits deterministically', () => {
    expect(emitJsonSchemas()).toEqual(emitJsonSchemas());
  });

  it('embeds the single-sourced schemaVersion on every document', () => {
    for (const document of Object.values(emitJsonSchemas())) {
      const parsed = JSON.parse(document) as {
        properties: Record<string, unknown>;
        required: string[];
      };
      expect(parsed.properties.schemaVersion).toEqual({ type: 'number', const: SCHEMA_VERSION });
      expect(parsed.required).toContain('schemaVersion');
    }
  });

  it('envelope parsing accepts the exact schemaVersion and refuses mismatches (ADR 0026)', () => {
    const envelope = allSchemaTargets[0]?.schema as z.ZodType | undefined;
    if (!envelope) throw new Error('missing exercise target');
    expect(envelope.safeParse({ schemaVersion: SCHEMA_VERSION, ...validExercise }).success).toBe(
      true,
    );
    expect(
      envelope.safeParse({ schemaVersion: SCHEMA_VERSION + 1, ...validExercise }).success,
    ).toBe(false);
  });

  it('committed documents carry the declared version — the CI version check (issue #15)', () => {
    for (const { file } of allSchemaTargets) {
      const committed = JSON.parse(
        readFileSync(join(domainGenDir, 'json-schema', file), 'utf8'),
      ) as { properties: { schemaVersion: unknown } };
      expect(committed.properties.schemaVersion).toEqual({
        type: 'number',
        const: SCHEMA_VERSION,
      });
    }
  });

  it('matches the committed artifacts — regenerate with `pnpm codegen`', () => {
    const emitted = emitJsonSchemas();
    for (const { file } of allSchemaTargets) {
      const committed = readFileSync(join(domainGenDir, 'json-schema', file), 'utf8');
      expect(emitted[file]).toBe(committed);
    }
  });

  it('has committed Swift and Kotlin outputs', () => {
    expect(existsSync(join(domainGenDir, 'swift', 'Domain.swift'))).toBe(true);
    expect(existsSync(join(domainGenDir, 'kotlin', 'Domain.kt'))).toBe(true);
  });
});
