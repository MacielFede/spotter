# 29. One matching watch per phone

Date: 2026-10-11

## Status

Accepted

## Context

The monorepo ships a watchOS app and a WearOS app, raising the question of whether a single phone
could talk to both. The native transports are platform-locked (WatchConnectivity is iPhone↔Apple
Watch; the Wearable Data Layer is Android↔Wear OS).

## Decision

A phone pairs with **exactly one matching watch**: iPhone↔Apple Watch, Android↔Wear OS. No
cross-platform transport is built. The other watch app exists so the product ships on both
ecosystems, but a given user only ever runs the one that matches their phone.

## Consequences

- Sync logic is implemented once per platform against that platform's transport (ADR 0028).
- No multi-watch fan-out, no de-duplication of a workout arriving from two watches.
- "One workout at a time" (ADR 0006) is enforced across exactly two devices: the phone and its one
  paired watch.
