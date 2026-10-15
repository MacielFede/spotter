# 41. The sync contract is versioned envelopes in the domain package

Date: 2026-10-12

## Status

Accepted

## Context

ADR 0028 chose the transports (durable background transfers + reachable-only messages) but not the
contract: payload shapes, acknowledgment semantics, and version skew were undefined. ADR 0038
removed device identity, so the contract carries none.

## Decision

Sync messages are **Zod schemas in the shared domain package** (ADR 0017), versioned like
everything else there. Envelope types:

- `PlanPush` — phone→watch, the Current Plan + active Routines + referenced Exercises (ADR 0011);
- `WorkoutTransfer` — watch→phone, a finished Workout;
- `StatusFetch` / status response — is a workout active, which Routine, current position;
- `DraftPull` / `DraftPush` — the in-progress draft (ADR 0038);
- `TerminalAction` — Save or Cancel for a session id;
- `Ack` — means **persisted**, not merely received.

Rules:

- Every payload carries `schemaVersion`; the receiver **refuses mismatches** with a clear
  "update the app" error — ADR 0026's exact-match rule applied to the wire.
- Retries are idempotent via id dedupe (ADR 0037); no separate dedupe state.
- No device id appears in any payload (ADR 0038).

## Consequences

- One schema source covers files **and** the wire; codegen gives both watches the same envelopes.
- Version skew surfaces as a readable error, never silent corruption.
- Ack=persisted keeps the watch outbox honest: an item clears only when the phone has written it.
