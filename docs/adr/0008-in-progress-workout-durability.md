# 8. In-progress workouts are durably persisted

Date: 2026-10-11

## Status

Accepted

## Context

The spec asks that a stopped/paused workout's data "should not be lost immediately", which is
underspecified — it does not say how much can be lost on a crash.

## Decision

An in-progress workout is persisted **continuously**:

- a completed set is written **immediately**;
- in-progress edits (rep/weight changes, timer state) are written **debounced** (a few seconds, and
  on screen/navigation changes).

The watch is authoritative for the workout it is running. If the app is killed or the watch reboots,
the session resumes from the last durable point.

## Consequences

- Watch storage must hold a partial Workout before it is finished and pushed.
- On launch, the watch checks for an unfinished local workout and offers to resume it.
- The debounce window is the worst-case data loss — a few seconds, never a whole session.

## Superseded note

Extended by [ADR 0038](0038-shared-active-session.md): the same durability rule applies to the
phone, and "the watch is authoritative for the workout it is running" is superseded — the session
has no owner; the latest draft wins.
