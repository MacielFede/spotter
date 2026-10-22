import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ExerciseSchema } from './exercise.js';
import { WorkoutSchema } from './workout.js';

const fixture = (name: string): unknown =>
  JSON.parse(readFileSync(fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url)), 'utf8'));

describe('shared golden fixtures (issue #75)', () => {
  it('parses the Exercise round-trip fixture', () => {
    const parsed = ExerciseSchema.parse(fixture('exercise.json'));
    expect(ExerciseSchema.parse(parsed)).toEqual(parsed);
  });

  it('parses the Workout round-trip fixture', () => {
    const parsed = WorkoutSchema.parse(fixture('workout.json'));
    expect(WorkoutSchema.parse(parsed)).toEqual(parsed);
  });

  it('documents the summary fixture shape', () => {
    const { input, expected } = fixture('summary.json') as {
      input: unknown;
      expected: {
        durationSeconds: number;
        exerciseCount: number;
        setCount: number;
        totalVolumeKg: number;
      };
    };
    expect(WorkoutSchema.safeParse(input).success).toBe(true);
    expect(expected).toEqual({
      durationSeconds: 3600,
      exerciseCount: 3,
      setCount: 6,
      totalVolumeKg: 940,
    });
  });
});
