# 14. Rest is an optional duration on each Set

Date: 2026-10-11

## Status

Accepted

## Context

The watch "cycles through exercises and rest (if set up)", but the spec never said where rest is
configured. Rest could be per-Set, per-Item, or a Routine default.

## Decision

Rest is an **optional duration on each Set**, applied **after** that Set. A Set with no rest value
means no rest. In a Superset, rest applies **after the whole chain** (after one round), not between
the member Exercises — the members themselves are performed back-to-back.

## Consequences

- The watch's auto-cycle between Set N and Set N+1 inserts a rest screen when Set N has a rest value.
- Authoring UI exposes a rest field per Set (with easy "none").
- Superset rounds share the rest that follows the chain; there is no per-member rest.
