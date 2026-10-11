# 27. CSV log columns: full summary + packed details

Date: 2026-10-11

## Status

Accepted

## Context

ADR 0015 fixed the shape (one row per Workout, plus a packed details column). The exact summary
columns and the details payload shape were still open.

## Decision

CSV header (one row per Workout):

```
schemaVersion, workoutId, planId, planName, routineId, routineName,
startedAt, durationSeconds, exerciseCount, setCount, totalVolumeKg, details
```

- `schemaVersion` — constant per file (ADR 0026), enables the exact-version check.
- `startedAt` — ISO 8601 with offset.
- `durationSeconds`, `exerciseCount`, `setCount`, `totalVolumeKg` — derived summaries for sorting/
  filtering in a spreadsheet.
- `details` — a JSON document, quoted, carrying the full snapshot:

```json
{"exercises":[{"exerciseId":"…","title":"Bench Press","module":"core",
  "kind":"exercise","rounds":1,
  "sets":[{"mode":"reps","target":8,"actual":8,"weight":60,"rest":90}]}]}
```

Supersets appear as one entry with `kind:"superset"` and their rounds.

## Consequences

- Summary columns are derivable from `details`; CSV import trusts `details` and recomputes summaries.
- One serialization shape is shared with the rest of the app (same snapshot JSON).
- `details` must be correctly quoted/escaped; the writer owns RFC 4180 quoting.
