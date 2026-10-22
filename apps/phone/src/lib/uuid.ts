const HEX = Array.from({ length: 256 }, (_, index) => index.toString(16).padStart(2, '0'));

/**
 * Encodes a UUIDv7 from a millisecond timestamp and 16 random bytes:
 * 48-bit big-endian timestamp, 4-bit version, 2-bit variant (RFC 9562).
 * Kept free of native imports so the layout is unit-testable.
 */
export const encodeUuidV7 = (nowMs: number, random: Uint8Array): string => {
  if (random.length !== 16) throw new Error('UUIDv7 needs exactly 16 random bytes');
  const bytes = Uint8Array.from(random);
  let timestamp = BigInt(Math.trunc(nowMs));
  for (let index = 5; index >= 0; index -= 1) {
    bytes[index] = Number(timestamp & 0xffn);
    timestamp >>= 8n;
  }
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x70;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) => HEX[byte] ?? '00').join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};
