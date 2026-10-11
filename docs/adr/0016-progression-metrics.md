# 16. Progression graphs: weight and volume over time

Date: 2026-10-11

## Status

Accepted

## Context

The spec asks to "create graphs and track progression" without naming the metrics.

## Decision

Progression is tracked **per Exercise** (grouped by Exercise id, so it spans Plans) and offers two
graphs:

- **Weight over time** — the heaviest set's weight per session.
- **Volume over time** — sum of reps × weight across the session's sets.

Exercises with no weight (bodyweight/reps-only or time-only) fall back meaningfully: volume uses
reps, and weight-based graphs simply show no points.

## Consequences

- Graph data is derived from the Workout snapshots (ADR 0004), never from templates.
- Only two metrics exist for now; reps-alone and duration graphs are explicitly deferred, not
  designed-in.
- Requires storing enough per-set actuals (weight, reps/duration) to compute both.
