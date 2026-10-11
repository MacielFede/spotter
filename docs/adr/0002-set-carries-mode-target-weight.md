# 2. A Set carries its mode, target, and starting weight

Date: 2026-10-11

## Status

Accepted

## Context

The spec said both "each Exercise has reps or time based per set" and "a set can be time based or
rep based, this is selected by the user", leaving it ambiguous whether the reps-vs-time mode is a
property of an Exercise or of an individual Set, and whether it is chosen while authoring or at
runtime.

## Decision

The **Set** is the unit that carries the mode. When authoring a routine, each Set is created as
either:

- **reps-based** — carries a rep target, or
- **time-based** — carries a duration,

and it carries its own **starting weight**. These authored values are fixed ("defined once, cannot
be updated") and act as a template. The watch app only *displays* the template mode and lets the user
log the actual values; it can never switch a Set between reps and time.

## Consequences

- The template (`Plan`/`Routine`) and the log (`Workout`) are separate: template Sets define intent,
  logged Sets record actuals.
- Prefill for a new Workout comes from the **previous Workout's actuals**, not from the template;
  the template's starting weight seeds only the very first time.
- Because mode is authored per Set, two Sets of the same Exercise may differ in mode (e.g. one
  reps-based and one time-based) — the model must not hoist mode up to the Exercise.
