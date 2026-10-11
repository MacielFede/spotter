# 11. The watch carries one Plan and its active Routines

Date: 2026-10-11

## Status

Accepted

## Context

Watch storage and screen space are limited, and the phone holds many Plans. The spec said "the
companion app can start any workout", which would imply mirroring everything.

## Decision

The manual sync pushes **exactly one Plan** — the phone's currently selected Plan — together with
that Plan's **active Routines** (and the Exercises they reference). The watch holds **one Plan at a
time**; switching the watch's Plan requires re-syncing.

## Consequences

- The watch is not a full mirror of the phone; it can only start Routines that were synced while
  active. **Activation is phone-only**: the watch cannot activate a Routine it does not hold, so
  changing what the watch can start means activating on the phone and re-syncing.
- The phone must expose a notion of "the Plan currently on the watch" (selection semantics to be
  decided).
- Offline the watch can still run any synced active Routine and cycle through its Items.
