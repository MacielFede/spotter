# 19. Either device can save an active workout

Date: 2026-10-11

## Status

Accepted

## Context

ADR 0006 makes the active workout a system-wide singleton and ADR 0007 makes each device fetch the
other's status on focus. It was left open what the non-owner device may do to an active session.

## Decision

Either device may **finish/save** an active workout. When the non-owner saves, it pulls the
in-progress draft (structure + actuals recorded so far) from the owner and writes the resulting
Workout log — possibly with only partial actuals if the session was short-lived. Cancel remains
available on both devices too.

## Consequences

- The in-progress draft must be transferable on demand, not just a boolean status (extends ADR 0007).
- The resulting log's fidelity depends on how fresh the draft was when saved; the UI should warn if
  it is saving a partial session.
- The owner's local partial state must be reconciled so it does not later re-push a now-saved workout.

## Superseded note

Superseded by [ADR 0038](0038-shared-active-session.md): there is no owner — any device may log,
edit, save, or cancel; terminal actions dedupe by session id; drafts resolve latest-wins.
