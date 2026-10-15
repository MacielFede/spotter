# 35. Plans do not own Workouts; logs reference the Plan by snapshot

Date: 2026-10-12

## Status

Accepted

## Context

ADR 0001 made `Plan` the owner of its Workout logs, but three accepted rules collide with that
ownership: saved Workouts can never be deleted (ADR 0024), Plan JSON export excludes logs
(ADR 0023), and Plans are meant to be managed freely. Under ownership, deleting a Plan would
either destroy history or orphan it.

## Decision

A `Plan` owns its `Routine`s only. A `Workout` is an **independent root entity**.

At save time the Workout snapshots the source Plan's `planId` and `planName` (and the Routine's
`routineId`/`routineName`) as **dead references** — the same pattern ADR 0004 uses for Exercise
id/title. Renaming, deleting, or re-importing the Plan never rewrites the snapshot.

Deleting a Plan is therefore always safe for history: it can never delete or edit a Workout.

## Consequences

- History and graphs group/filter by the snapshotted `planId`; the UI displays the frozen
  `planName`.
- A Plan deleted and later re-imported with the same id (ADR 0013) regroups its old history
  automatically.
- Two Plans may share a name; history still tells them apart by id.
- An orphaned `planId` (Plan gone) is a normal state: the UI renders the frozen name.
- CSV columns `planId`/`planName` (ADR 0027) are read from the snapshot, never joined against a
  live Plan.

## Supersedes note

Partially supersedes ADR 0001 ("A Plan still owns its Routines and its Workout logs"): Plan
ownership of Routines stands; ownership of Workout logs is removed.
