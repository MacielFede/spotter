import { UuidV7Schema } from '@spotter/domain';
import { describe, expect, it } from 'vitest';
import { encodeUuidV7 } from './uuid';

describe('UUIDv7 minting', () => {
  it('encodes the timestamp, version, and variant', () => {
    const bytes = new Uint8Array(16).fill(0xab);
    const id = encodeUuidV7(0x0123456789ab, bytes);

    expect(id).toBe('01234567-89ab-7bab-abab-abababababab');
    expect(UuidV7Schema.safeParse(id).success).toBe(true);
  });

  it('is time-ordered for increasing timestamps', () => {
    const bytes = new Uint8Array(16).fill(0x01);
    const earlier = encodeUuidV7(1_700_000_000_000, bytes);
    const later = encodeUuidV7(1_700_000_001_000, bytes);
    expect(earlier < later).toBe(true);
  });
});
