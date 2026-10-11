# 28. Sync uses durable background transfers with a Retry UI

Date: 2026-10-11

## Status

Accepted

## Context

ADR 0005 fixes the sync *directions* (manual down, auto up) but not the transport or how failures
surface. Reachable-only messaging would lose a finished workout whenever the user walks away from
their phone.

## Decision

- **Plan push (phone→watch)** and **finished-workout transfer (watch→phone)** use the platform's
  **background-capable transfer APIs** so they complete without both apps foregrounded:
  WatchConnectivity `transferUserInfo`/`transferFile` on iOS; Wearable Data Layer
  `DataClient`/`ChannelClient` on Wear OS.
- **On-focus status/draft fetch** (ADR 0007) uses the reachable-only fast path:
  `sendMessage` / `MessageClient`.
- **Failure UX:** Settings shows **last-sync time** and a **pending badge** (count of queued items)
  with a **Retry** action. Failures never lose the item; it stays queued until acknowledged (ADR 0005).

## Consequences

- Workouts sync even when the phone is pocketed; transfers are OS-scheduled and may be delayed, so the
  outbox — not the UI — is the source of truth for "pending".
- Two code paths per direction (durable vs reachable), but one outbox abstraction.
- Requires a small, thin native bridge in Expo (a dev-client module) exposing transfer + queue state.
