# 49. Phone Home selects a Plan before its Routines

Date: 2026-11-08

## Status

Accepted

## Context

ADR 0022 made Phone Home a global start list with Plans as filters. The user prefers the routine
list to be scoped to one Plan, but does not want to select a Plan manually before choosing a
Routine. The global "All Plans" view should no longer be available.

## Decision

- Phone Home selects the first available Plan by default; the user can switch to another Plan.
- Home shows the selected Plan's Routines as the routine picker.
- The routine picker is shown even when the selected Plan has exactly one Routine.
- Inactive or empty Routines remain visible with their existing unavailable state; startability rules
  do not change.
- The Wear OS start list remains the active Routines from its synced Plan (ADR 0011).

## Consequences

- Home opens with the first Plan's Routines ready to choose, without a required Plan-selection step.
- The phone no longer offers a cross-Plan start list from Home; switch Plans to see different Routines.
- This supersedes the phone portion of ADR 0022 only.
