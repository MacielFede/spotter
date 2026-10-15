# 1. Exercises live in a global library, not inside a Plan

Date: 2026-10-11

## Status

Accepted

## Context

The spec calls `Plan` a top-tier entity that owns its routines, logs, "and everything", which
suggests a Plan-scoped Exercise set. But it also says exercises are added manually rather than
chosen from a pre-populated catalog, and the same exercise (e.g. Bench Press) is expected to be
usable across many routines.

Modeling Exercise as owned by a Plan would duplicate the same exercise once per Plan, and make it
impossible to build a cross-plan exercise history.

## Decision

`Exercise` is a **global root entity**. It is referenced by id from wherever it is used. It is not
owned by a Plan or a Routine.

A Plan still owns its Routines and its Workout logs. When a Plan is exported to JSON, the exports
**embeds copies** of every Exercise the Plan references so the file is self-contained and portable
without depending on the receiving machine's library.

## Consequences

- Cross-plan exercise history and graphs are possible (filter by Plan if desired).
- Plan JSON export/import needs an embed + reconcile step for Exercises (dedupe on import).
- Deleting a Plan leaves the Exercise library untouched.
- Exercise cleanup (unused exercises) becomes a separate concern from Plan deletion.

## Superseded note

Partially superseded by [ADR 0035](0035-plans-do-not-own-workouts.md): a Plan no longer owns its
Workout logs; Workouts are independent roots referencing the Plan by snapshot.
