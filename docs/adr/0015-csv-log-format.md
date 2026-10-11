# 15. CSV logs: one row per Workout, with packed details

Date: 2026-10-11

## Status

Accepted

## Context

A pure summary row per workout is easy to read in a spreadsheet but cannot represent the per-set,
per-exercise weights and reps needed for progression. A row per set is complete but noisy to scan.

## Decision

CSV export writes **one row per Workout**. In addition to summary columns (date, plan, routine,
duration, totals), the row carries a **details column** that packs the full structure as JSON —
exercises × sets × the kg actually lifted per set (plus reps/duration per set). The file is both
human-scannable and complete. CSV **import restores full Workout logs** from that details column.

## Consequences

- The details column's JSON is the same workout-snapshot shape used elsewhere — one serialization
  format, not two.
- CSV is a viable backup/transfer format for logs, not read-only.
- Import follows the same upsert-by-id + preview rules as Plan JSON import (ADR 0013).
- Spreadsheet users can still filter/sort on the summary columns without parsing JSON.
