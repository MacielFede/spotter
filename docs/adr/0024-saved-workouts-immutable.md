# 24. Saved workouts are fully immutable

Date: 2026-10-11

## Status

Accepted

## Context

ADR 0004 makes a Workout a snapshot; editing a saved log would still rewrite history and distort
progression graphs. The spec did not say whether correction or deletion is allowed.

## Decision

Once a Workout is **saved**, it is **fully immutable**: it can be neither edited nor deleted. History
is append-only. (An in-progress workout that is *cancelled* is not a saved workout — it is discarded
before ever being written.)

## Consequences

- Accidental or erroneous saved logs are permanent. The UI must therefore make Save deliberate and
  hard to trigger by accident. This is an accepted cost of a trustworthy progression graph.
- No "edit log" or "delete log" screens exist.
- Progression graphs are stable: a point never moves once recorded.
