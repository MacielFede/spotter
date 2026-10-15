# 46. Behavior is hand-written per platform, locked by golden fixtures

Date: 2026-10-12

## Status

Accepted

## Context

Codegen produces types and parsers (ADRs 0012/0045), but behavior — prefill, volume math, snapshot
building, the cycle state machine, summary derivation — must run natively on each watch **offline**.
A shared core (KMP/Rust/JS engine) is a heavy commitment; three unverified reimplementations drift.

## Decision

Domain **behavior is hand-written per platform**, and all three implementations are locked to
**shared golden JSON fixtures** emitted from the TS package. Each behavior ships with fixtures of
the form `input → expected output`; every platform's test suite must pass the same fixtures.

In scope for fixtures: prefill (same-Routine → Exercise-anywhere → template), volume/count
derivation (ADR 0039), snapshot building from template + edits, and the cycle state machine
(item/member/round transitions, rest insertion).

## Consequences

- Adding or changing a behavior = update fixtures in the TS package + update three implementations;
  CI fails any platform that lags.
- The watches can run a full session offline with verified-identical logic.
- Drift shows up as a fixture failure, not a user-visible discrepancy.

## Considered and rejected

- **Shared native core (KMP/Rust):** large build complexity for three small apps.
- **JS engine on the watches:** runtime cost and bridge complexity for logic that is small.
