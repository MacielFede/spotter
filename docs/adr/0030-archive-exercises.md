# 30. Exercises are archived, never hard-deleted

Date: 2026-10-11

## Status

Accepted

## Context

Exercises are global (ADR 0001) and referenced by id from Routines. Workout history is safe from
deletion (snapshots, ADR 0004), but a Routine still points at the Exercise id, so a hard delete would
leave dangling references in the template.

## Decision

An Exercise is **archived**, never hard-deleted. Archiving:

- hides it from authoring pickers so it cannot be added to new Routines,
- leaves existing Routines that reference it fully working,
- leaves all history and graphs untouched,
- is reversible (can be un-archived).

## Consequences

- The library distinguishes active vs archived Exercises; archived ones are visible under a filter.
- No dangling-reference repair flow is needed for deletion.
- The Exercise id is permanent for the life of the install; only the display state changes.
