# 10. Many routines may be active per Plan

Date: 2026-10-11

## Status

Accepted

## Context

The spec said a Routine is active/inactive and can only be started while active, but did not say how
many may be active at once, nor the scope of the flag.

## Decision

Any number of a Plan's Routines may be active simultaneously. **Active** is purely the gate that
makes a Routine startable. Inactive Routines remain visible in the UI and can be activated at will.
The flag is scoped **per Plan** (there is no cross-Plan active constraint).

## Consequences

- The UI shows active and inactive Routines in the same list, with a toggle, grouping by Plan.
- A Workout can only be started from an active Routine — this is an invariant enforced on every
  surface (phone and both watches), alongside the one-workout-at-a-time rule (ADR 0006).
