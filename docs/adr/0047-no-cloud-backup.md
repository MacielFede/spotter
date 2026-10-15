# 47. App data is excluded from OS cloud backup

Date: 2026-10-12

## Status

Accepted

## Context

iOS and Android back up app data by default. Restoring a stale database could resurrect an
active-workout draft or logs the companion already owns, and the restore semantics were undesigned.

## Decision

The app's data is **excluded from OS cloud backup** (iCloud backup, Android Auto Backup).
Backup/restore is exactly the export/import story — Plan JSON (ADR 0023) and log CSV (ADR 0015) —
which is versioned (ADR 0026) and deduped on import (ADR 0037).

## Consequences

- No stale-draft resurrection, no duplicate-log restore races.
- A new phone starts empty; the user restores via explicit export/import.
- OS-level backup flags must be set deliberately per platform and tested.
