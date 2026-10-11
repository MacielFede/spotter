# 22. Workouts start from a global start list

Date: 2026-10-11

## Status

Accepted

## Context

The spec says a Workout can only be started from an active Routine, but not where the start action
lives. Given ADRs 0006/0010 (single global workout, many active routines per Plan), a Plan-first
navigation would hide most startable routines behind a click.

## Decision

- **Phone:** the top-level Home is a **global start list** of every active Routine across all Plans
  (with Plans as filters). Start lives on the list; inactive Routines are shown but not startable.
- **Watch:** the start list is the currently synced Plan's active Routines (the watch only ever holds
  one Plan — ADR 0011).

## Consequences

- Plans are not the only navigation axis on the phone; the app opens on what you can *do* now.
- The list must surface which Plan each routine belongs to.
- Inactive routines still need a visible home (the per-Plan view) so they can be activated.
