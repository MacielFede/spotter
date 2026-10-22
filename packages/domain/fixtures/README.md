# Shared golden fixtures (ADR 0046)

Input → expected-output JSON shared by every platform's behavior tests.

- `exercise.json`, `workout.json` — exact domain serialization used for round-trip tests (TS + Kotlin).
- `summary.json` — a Workout plus the derived `durationSeconds`, `exerciseCount`, `setCount`,
  `totalVolumeKg` (ADR 0039). TS computes these; Kotlin consumes the same values when its summary
  behavior lands.

Changing behavior means changing these fixtures and every implementation together.
