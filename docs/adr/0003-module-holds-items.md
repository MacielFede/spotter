# 3. A Module holds Items: Exercise or Superset

Date: 2026-10-11

## Status

Accepted

## Context

The spec described modules as "exercises, which have sets or supersets (chains of exercises that
count as 1)". It was unclear whether a Superset is a nested grouping (with its own rounds) or merely
a flag over adjacent Exercises in a flat list.

## Decision

A **Module** holds an **ordered list of Items**. An Item is exactly one of:

- an **Exercise item** — a reference to an Exercise plus its ordered Sets; or
- a **Superset item** — an ordered chain of member Exercises performed back-to-back, plus a round
  count `N`. Each member Exercise carries its own mode/target/starting weight per round.

One pass through a Superset's chain counts as **one round** — this is the "counts as 1" from the
spec. Supersets are first-class: a Module's Items may freely mix Exercises and Supersets, and an
Exercise may appear in any Module (Warm-up, Stretching, Core, Cardio) for now.

## Consequences

- The watch's auto-cycling must walk Items, and within a Superset walk its members across `N`
  rounds before advancing to the next Item.
- Rest, "current exercise", and progress displays are driven by Item/Superset position, not a flat
  exercise list.
- UI needs distinct authoring affordances for "add exercise" vs "create superset".
