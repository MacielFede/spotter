# 37. Workout import never overwrites

Date: 2026-10-12

## Status

Accepted

## Context

ADR 0013 upserts imported entities by id, but ADR 0024 makes saved Workouts immutable. A CSV row
whose `workoutId` already exists locally with **different** content is an attempted edit of an
immutable log — the two rules collided.

## Decision

Workout import **dedupes by `workoutId`, never overwrites**:

- identical row → silently skipped;
- same id, different content → flagged as a conflict in the merge preview (ADR 0013), and the only
  resolution is **keep existing**.

The same rule governs the sync receiver: a watch→phone WorkoutTransfer that arrives twice (lost
Ack, retried) dedupes by `workoutId`, so retries are idempotent and can never duplicate a log.

## Consequences

- Immutability (ADR 0024) holds across import and sync.
- Templates (Plans/Routines/Exercises) still upsert by id per ADR 0013 — only Workouts are
  append-only.
- Sync retry logic needs no dedupe state of its own; the id is the idempotency key.
