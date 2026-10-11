# 25. Cancel discards an in-progress workout

Date: 2026-10-11

## Status

Accepted

## Context

ADR 0024 makes saved Workouts immutable and append-only; the counterpart is what leaving an
in-progress session does.

## Decision

**Cancel discards the in-progress workout entirely** — no log is written. A session ends in exactly
one of two states: **Saved** (a permanent log) or **Cancelled** (nothing). There is no partial log.

## Consequences

- Save and Cancel are the only two exits; Save must be deliberate (ADR 0024).
- The durable in-progress draft (ADR 0008) is deleted on cancel.
- No half-finished workouts ever reach history or graphs.
