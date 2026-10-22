# 48. The watchOS app is removed; Wear OS is the only watch platform

Date: 2026-10-22

## Status

Accepted

## Context

The throwaway scaffolding for `apps/watchos` was never a product commitment. The owner removed it
from the repository: maintaining a second watch app (Xcode project, WatchConnectivity transport,
GRDB storage, screens) would roughly double the watch effort for a companion that is not being
shipped on watchOS. The domain model and codegen remain platform-neutral.

## Decision

Only **Wear OS** ships as a watch app. `apps/watchos` is gone; nothing in the build references it.

- The generated Swift artifact (`packages/domain/gen/swift/Domain.swift`) is **retained**. It is a
  normal output of the ADR 0045 pipeline and keeps the codegen contract honest if watchOS returns.
- Cross-platform pairing stays one matching watch per phone (ADR 0029). With only Wear OS shipping,
  that pairing is Android phone ↔ Wear OS watch.
- The name `startedOn: "watch"` in the workout schema stays: it is a display label, not a platform
  identity (ADR 0039).

## Consequences

- ADR 0012, ADR 0018, ADR 0029 and ADR 0044 are amended: their three-app framing is obsolete.
- Watch storage is Room only (ADR 0044); the GRDB half is dormant.
- CI runs the Kotlin round-trip test; Swift output is drift-checked but not compiled.
- Reintroducing watchOS is a new ADR, not a resurrection of the deleted scaffold.
