# 40. Module slots and Superset shape

Date: 2026-10-12

## Status

Accepted

## Context

The review found the Module model only implied ("enable or disable each"), duplicate Exercises
unaddressed, and the Superset schema contradictory: ADR 0003 put mode/target/weight on members
"per round", ADR 0032 put one round count on the chain, and ADR 0014 put rest on each Set while
also saying Superset rest fires after the round.

## Decision

**Modules:** a Routine holds exactly the four fixed kinds — **at most one Module per kind**
(Warm-up, Stretching, Core, Cardio), ordered, each individually enabled/disabled. No free-form
module lists.

**Duplicate Exercises:** the same Exercise may appear multiple times in a Routine, even in one
Module. Items are positioned, so prefill (ADR 0002) and graphs match by **position**, not by
Exercise alone.

**Superset:** a member Exercise is **one Set template** (mode/target/starting weight, ADR 0002)
repeated every round; actuals are logged per member per round. **Rest lives on the Superset** and
fires after each round; member Sets inside a Superset **cannot carry their own rest** — refining
ADR 0014, whose per-Set rest now applies only to standalone Exercise Items.

## Consequences

- One schema shape satisfies ADRs 0002/0003/0032 and the CSV details payload (ADR 0027).
- The watch cycle cursor `(item, member, round)` (ADR 0033) maps directly onto this shape.
- Authoring UI disables the rest field for Sets inside a Superset; the Superset itself gets one
  rest field.

## Supersedes note

Refines ADR 0014: rest is per-Set only for standalone Items; Supersets carry their own rest.
