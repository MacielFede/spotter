import { z } from 'zod';

/** A non-blank string (trimmed non-empty); used for Exercise titles and Plan/Routine names. */
export const nonBlankString = (message: string) =>
  z.string().refine((value) => value.trim().length > 0, message);

/** Weight in kg — the only unit stored; nullable = none, independent of mode (ADR 0009, ADR 0039). */
export const WeightKgSchema = z.number().finite().nonnegative().nullable();

/** Duration in seconds (ADR 0039). */
const SecondsSchema = z.number().int().nonnegative();

/** Rest in seconds, applied after a Set or a Superset round (ADR 0014, ADR 0040); nullable = none. */
export const RestSecondsSchema = SecondsSchema.nullable();
