# 20. The phone workout is fully editable, but only in the snapshot

Date: 2026-10-11

## Status

Accepted

## Context

The phone's workout flow was described as "a list of the starting reps-weight per exercise to
update, then log". It was unclear whether deviations from the routine (extra exercises, skipped
modules) are allowed.

## Decision

The phone may **add/remove whole Exercises and Modules** during a workout. These edits **never touch
the Routine template** — they are applied only to the Workout **snapshot** being built (ADR 0004).
The template is immutable from the workout flow. The same applies to the watch's ability to change
reps/weight mid-workout: it edits actuals, never the template.

## Consequences

- A logged Workout may contain structure that exists in no Routine — that is valid and expected.
- Progression for a session-added Exercise still groups by Exercise id (from the global library).
- The phone's workout UI needs add/remove affordances that the watch deliberately does not have.
- Template editing and workout logging are separate code paths with no shared mutable state.
