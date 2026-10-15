import { z } from 'zod';

/** UUIDv7 — globally unique, time-ordered, minted by the creating device (ADR 0039). */
export const UuidV7Schema = z.uuidv7();

export type UuidV7 = z.infer<typeof UuidV7Schema>;
