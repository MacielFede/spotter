# 31. Phone shell: four bottom tabs

Date: 2026-10-11

## Status

Accepted

## Context

Home is the global start list (ADR 0022). The remaining top-level destinations needed a shell.

## Decision

The phone app uses **four bottom tabs**:

1. **Home** — the global start list (active Routines across Plans).
2. **Plans** — create/manage Plans, their Routines, Modules, Items, and activation.
3. **History** — saved Workout logs and progression graphs.
4. **Settings** — sync, theme, import/export, and the exercise library entry point.

The global Exercise library is not a top-level tab. A standalone **Exercises** screen is pushed from
**Settings** (create/archive/manage), and the Routine editor additionally lets you create/select
Exercises inline while authoring.

## Consequences

- Four stable tabs; deep flows (routine editing, exercise library, graphs) are pushed screens.
- The library is treated as supporting data, not a primary destination.
