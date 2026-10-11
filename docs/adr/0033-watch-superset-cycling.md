# 33. Watch superset cycling: per-member screen with a round header

Date: 2026-10-11

## Status

Accepted

## Context

The watch auto-cycles on set completion (ADR 0003 requires walking Items and, within a Superset,
members across rounds), but the presentation was unspecified.

## Decision

Each Superset member gets its own **normal set screen**, enhanced with a header such as
`Superset · Round 2/3 · A→B→C`, and its own editable reps/weight. Completing the **last member**
ends the round: if a rest is set (ADR 0014, rest lives after the round), the rest screen shows, then
the next round begins. A small progress row indicates the current member.

## Consequences

- The watch's cycle cursor tracks (Item, member, round) — three coordinates, not just an exercise
  index.
- Reps/weight are editable per member per round, same as a standalone Set.
- Supersets add no new screen types — just header/progress chrome over the standard set screen.
