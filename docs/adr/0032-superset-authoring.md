# 32. Superset authoring: a chain container, with grouping as a shortcut

Date: 2026-10-11

## Status

Accepted

## Context

Supersets are Items (ADR 0003) but the authoring interaction was unspecified.

## Decision

Two ways to create a Superset, both producing the same Item:

1. **Primary — chain container.** "Add Superset" inserts a container Item into the Module. The user
   adds member Exercises into it (each with its own mode/target/weight), sets **one round count for
   the whole chain**, and reorders members. It behaves as a single Item in the list.
2. **Shortcut — group existing.** Multi-select Exercises already in a Module and group them into a
   Superset. The **round count is entered manually** (not derived from set counts).

## Consequences

- Round count lives on the Superset, never on member Exercises.
- Both paths must converge on the identical Item structure so the watch sees one shape.
- Relaxing a Superset back to loose Exercises must be supported (ungroup).
