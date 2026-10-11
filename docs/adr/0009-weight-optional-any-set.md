# 9. Weight is optional and independent of Set mode

Date: 2026-10-11

## Status

Accepted

## Context

Some time-based work is loaded (weighted plank, farmer's carry) and some is not (cardio,
stretching). The spec did not say whether weight applies to time-based Sets.

## Decision

Weight is an **optional field on every Set**, independent of mode. A reps-based Set usually has one;
a time-based Set may have one or none. The field is nullable.

## Consequences

- The watch's logging UI must allow editing a weight for both modes, and omit it cleanly when empty.
- Progression graphs must handle exercises with no weight (track reps/duration instead).
