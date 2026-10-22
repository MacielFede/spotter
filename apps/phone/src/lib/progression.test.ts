import type { Workout } from '@spotter/domain';
import { describe, expect, it } from 'vitest';
import { loggedExercises, volumeSeries, weightSeries } from './progression';

const EX_A = '0193a1b2-c3d4-7e5f-89ab-cdef01234567';
const EX_B = '0193a1b2-c3d4-7e5f-89ab-cdef01234568';

const workout = (overrides: Partial<Workout>): Workout => ({
  workoutId: '0193a1b2-c3d4-7e5f-89ab-cdef01234570',
  planId: '0193a1b2-c3d4-7e5f-89ab-cdef01234569',
  planName: 'Hypertrophy',
  routineId: '0193a1b2-c3d4-7e5f-89ab-cdef0123456a',
  routineName: 'Push',
  startedAt: '2026-10-01T10:00:00+02:00',
  endedAt: '2026-10-01T11:00:00+02:00',
  startedOn: 'phone',
  exercises: [],
  ...overrides,
});

const exerciseEntry = (
  exerciseId: string,
  sets: { reps: number | null; weight: number | null }[],
) => ({
  kind: 'exercise' as const,
  exerciseId,
  title: exerciseId === EX_A ? 'Bench Press' : 'Row',
  description: '',
  module: 'core' as const,
  rounds: 1 as const,
  sets: sets.map((set) => ({
    mode: 'reps' as const,
    targetReps: 8,
    weightKg: 50,
    restSeconds: null,
    actualReps: set.reps,
    actualWeightKg: set.weight,
  })),
});

describe('progression series (issue #38)', () => {
  it('groups by Exercise id across Plans and takes the heaviest set', () => {
    const workouts = [
      workout({
        workoutId: '0193a1b2-c3d4-7e5f-89ab-cdef01234571',
        planId: 'plan-2',
        startedAt: '2026-10-02T10:00:00+02:00',
        exercises: [exerciseEntry(EX_A, [{ reps: 8, weight: 70 }])],
      }),
      workout({
        workoutId: '0193a1b2-c3d4-7e5f-89ab-cdef01234572',
        startedAt: '2026-10-01T10:00:00+02:00',
        exercises: [
          exerciseEntry(EX_A, [
            { reps: 8, weight: 60 },
            { reps: 5, weight: 65 },
          ]),
        ],
      }),
    ];

    expect(weightSeries(workouts, EX_A).map((point) => point.value)).toEqual([65, 70]);
    expect(weightSeries(workouts, EX_A, 'plan-2').map((point) => point.value)).toEqual([70]);
  });

  it('computes volume from weighted rep sets only', () => {
    const workouts = [
      workout({
        exercises: [
          exerciseEntry(EX_A, [
            { reps: 10, weight: 50 },
            { reps: 8, weight: 60 },
          ]),
        ],
      }),
    ];
    expect(volumeSeries(workouts, EX_A)[0]?.value).toBe(980);
  });

  it('ignores weightless and time-only logs without crashing', () => {
    const workouts = [
      workout({
        exercises: [
          {
            kind: 'exercise',
            exerciseId: EX_B,
            title: 'Plank',
            description: '',
            module: 'core',
            rounds: 1,
            sets: [
              {
                mode: 'time',
                targetSeconds: 60,
                weightKg: null,
                restSeconds: null,
                actualSeconds: 60,
                actualWeightKg: null,
              },
            ],
          },
        ],
      }),
    ];
    expect(weightSeries(workouts, EX_B)).toEqual([]);
    expect(volumeSeries(workouts, EX_B)).toEqual([]);
  });

  it('lists logged exercises across plans', () => {
    const workouts = [
      workout({
        exercises: [exerciseEntry(EX_A, [{ reps: 8, weight: 60 }])],
      }),
      workout({
        workoutId: '0193a1b2-c3d4-7e5f-89ab-cdef01234573',
        planId: 'plan-2',
        exercises: [
          exerciseEntry(EX_A, [{ reps: 8, weight: 60 }]),
          exerciseEntry(EX_B, [{ reps: 8, weight: 40 }]),
        ],
      }),
    ];
    const options = loggedExercises(workouts);
    expect(options.map((option) => option.exerciseId)).toEqual([EX_A, EX_B]);
    expect(options[0]?.workoutCount).toBe(2);
  });
});
