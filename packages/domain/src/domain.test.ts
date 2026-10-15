import { describe, expect, it } from 'vitest';
import { SCHEMA_VERSION } from './index.js';

describe('domain package', () => {
  it('exposes a schema version', () => {
    expect(SCHEMA_VERSION).toBe(1);
  });
});
