# 5. Sync is manual downward, automatic upward

Date: 2026-10-11

## Status

Accepted

## Context

The spec claimed both a manual sync button in Settings and that a finished watch workout is
"automatically saved" to the phone, which is contradictory unless the two directions are separate.

## Decision

The two directions have different triggers:

- **Phone → Watch (plans/routines): manual.** Definitions only move when the user taps the sync
  button in Settings. The watch caches the definitions it has received.
- **Watch → Phone (finished workouts): automatic.** When a workout finishes on the watch, it is
  transferred to the phone. If the phone is unreachable, the log is **queued** on the watch and
  retried when the companion app is open and the device is reachable. After the phone acknowledges
  receipt, the log is **removed from the watch**.

## Consequences

- The watch needs a durable outbox for completed workouts.
- The phone is the system of record; the watch is authoritative only for the in-progress workout.
- Definitions can go stale on the watch (edited since last sync) — the UI must make sync state
  visible, and finish-time behavior must tolerate a watch whose plan no longer matches the phone.
