import { describe, expect, it } from 'vitest';
import {
  ExerciseSchema,
  findDuplicateExerciseTitle,
  isSameExerciseTitle,
  normalizeExerciseTitle,
} from './exercise.js';
import { makeUuidV7 } from './testing.js';

const exercise = {
  id: makeUuidV7(),
  title: 'Bench Press',
  description: 'See https://example.com/form — flat back, bar to chest.',
  archived: false,
};

describe('ExerciseSchema (issue #7)', () => {
  it('parses a valid exercise', () => {
    expect(ExerciseSchema.parse(exercise)).toEqual(exercise);
  });

  it('parses an archived exercise — archive, never delete (ADR 0030)', () => {
    expect(ExerciseSchema.parse({ ...exercise, archived: true }).archived).toBe(true);
  });

  it('parses an empty description — links are detected at render time (ADR 0021)', () => {
    expect(ExerciseSchema.parse({ ...exercise, description: '' }).description).toBe('');
  });

  it('keeps the authored casing — display is not normalized (ADR 0036)', () => {
    expect(ExerciseSchema.parse({ ...exercise, title: 'bEnCh PrEsS' }).title).toBe('bEnCh PrEsS');
  });

  it('rejects a blank title', () => {
    expect(ExerciseSchema.safeParse({ ...exercise, title: '   ' }).success).toBe(false);
    expect(ExerciseSchema.safeParse({ ...exercise, title: '' }).success).toBe(false);
  });

  it('rejects a missing or non-uuid id', () => {
    const { id: _, ...withoutId } = exercise;
    expect(ExerciseSchema.safeParse(withoutId).success).toBe(false);
    expect(ExerciseSchema.safeParse({ ...exercise, id: 'not-a-uuid' }).success).toBe(false);
  });

  it('rejects an unknown key', () => {
    expect(ExerciseSchema.safeParse({ ...exercise, kind: 'strength' }).success).toBe(false);
  });
});

describe('title uniqueness (issue #7, ADR 0036)', () => {
  it('normalizes trimmed + case-insensitively for comparison', () => {
    expect(normalizeExerciseTitle('  Bench Press ')).toBe('bench press');
    expect(isSameExerciseTitle('Bench Press', 'bench press')).toBe(true);
    expect(isSameExerciseTitle('Bench Press ', 'BENCH PRESS')).toBe(true);
    expect(isSameExerciseTitle('Bench Press', 'Squat')).toBe(false);
  });

  it('finds the first duplicate normalized title in a list', () => {
    expect(findDuplicateExerciseTitle(['Bench Press', 'Squat', 'bench press '])).toBe(
      'bench press',
    );
  });

  it('returns null when every title is unique', () => {
    expect(findDuplicateExerciseTitle(['Bench Press', 'Squat'])).toBeNull();
  });
});
