# 6. At most one Workout in progress, system-wide

Date: 2026-10-11

## Status

Accepted

## Context

The spec said "no more than 1 workout could happen at the same time" without defining the scope
(global, per-device, or watch-only). The phone also has a lightweight logging flow, so the rule has
to say whether a phone session can coexist with a watch session.

## Decision

There is **at most one active Workout across the whole system** (phone + WatchOS + WearOS). You
cannot start a new Workout while one is in progress. When the phone is open and a Workout is active,
the phone shows the "workout in progress" screen, and the only actions available are **Cancel** or
**Save** — it cannot start a second one.

## Consequences

- Active-workout state is a system-level singleton, not per-device.
- The phone must be able to learn that a Workout is active even when it was started on the watch
  (mechanism decided in ADR 0007: on-focus status fetch, no live channel).
- Starting a Workout is blocked, not merely discouraged, on every surface.

## Superseded note

Partially superseded by [ADR 0038](0038-shared-active-session.md): the active session has no owner
— any device may log, edit, save, or cancel it (the "phone shows Cancel/Save only" line above no
longer holds). The one-workout-at-a-time invariant stands.
