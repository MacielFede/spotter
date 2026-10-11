# 4. A Workout is an immutable snapshot

Date: 2026-10-11

## Status

Accepted

## Context

Routines are editable templates; Workouts are logs. If a Workout referenced the live template by id,
then editing or deleting a Routine (or a Set's target) after the fact would silently rewrite history
and corrupt progression graphs.

## Decision

A **Workout** is written as an **immutable snapshot** of the structure it ran at logging time:

- the Items (Exercises and Supersets) and their order,
- each Set's mode and target,
- the actual reps/duration and weight recorded per set, plus timestamps.

The snapshot **retains the source Exercise id** (so history and graphs can group the same Exercise
across Routines and Plans), but also snapshots the display title/description so a log survives the
Exercise being renamed or removed from the global library.

## Consequences

- Editing or deleting a Routine/Plan/Exercise never rewrites past Workouts.
- Progression lookups ("last workout's values for this Exercise") query logs, not templates.
- Exporting a Plan's logs is self-contained.
- Storage cost: each Workout duplicates some structure — acceptable at this scale.
