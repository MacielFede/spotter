# 23. Plan JSON is template-only; logs travel as CSV

Date: 2026-10-11

## Status

Accepted

## Context

The spec asks for JSON import/export of "a workout plan" and CSV import/export of "log data",
implying two different payloads, but it was not explicitly stated that JSON excludes logs.

## Decision

Plan JSON export contains **only the template**: the Plan, its Routines (Modules, Items, Sets,
rest/weight/modes), and the referenced Exercises. **Workout logs are not in the JSON** — they move
exclusively through CSV (ADR 0015). Importing a Plan JSON never imports history.

## Consequences

- Two clean formats with one job each: JSON = structure, CSV = history.
- A full backup = one JSON per Plan + one CSV of logs.
- Plan JSON stays small and human-diffable.
- Because logs reference Exercise ids and snapshot titles, importing a Plan without its logs is safe.
