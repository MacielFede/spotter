# 44. Watch storage: GRDB on watchOS, Room on Wear OS

Date: 2026-10-12

## Status

Accepted — amended by ADR 0048 (only the Room/Wear OS half ships).

## Context

ADR 0012 named SwiftData/GRDB and Room/SQLDelight as candidates without choosing. ADR 0008's crash
resume and the durable outbox (ADR 0005) depend on real local persistence on both watches.

## Decision

- **watchOS: GRDB** over SQLite.
- **Wear OS: Room** over SQLite.

Both hold: the synced Plan snapshot, the ActiveWorkout draft (ADR 0039), and the finished-workout
outbox (ADR 0005). Schema migrations use each library's native migration support.

## Consequences

- One storage concept (SQLite + migrations) on all three apps, matching ADR 0043.
- Hand-written tables map to/from the generated models (ADR 0012) on every platform.
- SwiftData's watchOS sync behavior is deliberately avoided — local-only storage, transfers go
  through the sync contract (ADR 0041).
