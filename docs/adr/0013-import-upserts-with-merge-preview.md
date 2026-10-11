# 13. Plan import upserts by id, with a UI merge preview

Date: 2026-10-11

## Status

Accepted

## Context

Import/export is meant to support moving and restoring Plans between installs as well as sharing.
A pure "always create new" import cannot restore or round-trip; a silent merge can destroy data.

## Decision

Import **upserts by id**: a Plan, Routine, or Exercise with a matching id is updated in place; an
unseen id creates a new entity; Exercises also dedupe against the global library by id (falling back
to title). Because this can be destructive, merges are **never silent**: the UI shows a preview/
edit screen before writing, and when multiple entities would be merged in one import, they are
presented **one merge at a time** for the user to review and edit.

## Consequences

- Export must include stable ids for Plans, Routines, Items, Sets, and Exercises.
- The import pipeline is: parse → diff against DB → present merge list → user resolves each → commit.
- A failed/abandoned import leaves the DB untouched (commit is the last step).
- Schema versioning of the file matters; unknown/newer versions must be rejected with a clear error.
