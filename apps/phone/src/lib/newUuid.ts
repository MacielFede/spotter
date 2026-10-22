import { getRandomBytes } from 'expo-crypto';
import { encodeUuidV7 } from './uuid';

/** Mint a time-ordered UUIDv7 for a new entity (ADR 0039). */
export const newUuidV7 = (): string => encodeUuidV7(Date.now(), getRandomBytes(16));
