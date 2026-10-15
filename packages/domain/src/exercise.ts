import { z } from 'zod';
import { UuidV7Schema } from './id.js';
import { nonBlankString } from './primitives.js';

/** Reusable reference in the global library — not owned by any Plan (ADR 0001). */
export const ExerciseSchema = z.strictObject({
  id: UuidV7Schema,
  /** Unique across the library, compared trimmed + case-insensitively (ADR 0036). */
  title: nonBlankString('title cannot be blank'),
  /** Free text; links are detected at render time (ADR 0021). */
  description: z.string(),
  /** Archive, never hard-delete (ADR 0030). */
  archived: z.boolean(),
});

export type Exercise = z.infer<typeof ExerciseSchema>;

/** Normalized form used for uniqueness comparisons (ADR 0036). */
export const normalizeExerciseTitle = (title: string): string => title.trim().toLowerCase();

export const isSameExerciseTitle = (a: string, b: string): boolean =>
  normalizeExerciseTitle(a) === normalizeExerciseTitle(b);

/**
 * Title uniqueness at the authoring/import boundary: returns the first duplicate
 * normalized title in a list, or `null` when every title is unique (ADR 0036).
 * The authoring UI (#22, #23) and the import merge (#49) call this to enforce
 * uniqueness — the schema itself can only represent a single title.
 */
export const findDuplicateExerciseTitle = (titles: string[]): string | null => {
  const seen = new Set<string>();
  for (const title of titles) {
    const normalized = normalizeExerciseTitle(title);
    if (seen.has(normalized)) return normalized;
    seen.add(normalized);
  }
  return null;
};
