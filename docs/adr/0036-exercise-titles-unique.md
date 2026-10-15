# 36. Exercise titles are unique

Date: 2026-10-12

## Status

Accepted

## Context

ADR 0013 dedupes imported Exercises against the global library by id, falling back to title. That
fallback is only safe if a title identifies one Exercise. The review flagged that title uniqueness
had never been declared.

## Decision

Exercise **titles are unique** across the global library. The comparison is **case-insensitive and
trimmed** — "Bench Press", "bench press", and "Bench Press " are the same title; display keeps the
authored casing. Uniqueness is enforced at authoring time and at import time. On import, an
Exercise whose id is unknown but whose title matches an existing Exercise is **merged into the
existing one** (references in the file are remapped to the existing id) — this is ADR 0013's title
fallback, now safe.

## Consequences

- The authoring UI rejects duplicate titles with a clear error.
- Renaming an Exercise is just a title change; ids are stable, history is unaffected (ADR 0004).
- Import can never create two Exercises with the same title.
