# 7. Cross-device workout visibility is fetched on focus

Date: 2026-10-11

## Status

Accepted

## Context

ADR 0006 makes the active Workout a system-wide singleton, which means the phone must know about a
watch-started workout before it finishes. But ADR 0005 says watch→phone data only moves on finish.
A mechanism is needed for the other device to discover an active session without turning sync into a
continuous stream.

## Decision

There is **no continuous live channel**. Instead, **each app fetches the companion's active-workout
status when it comes into focus** (on app open / on foreground), and symetrically the companion
fetches the phone. The status fetch is lightweight (is a workout active, which Routine, current
position); it does not transfer the session payload.

## Consequences

- "One workout at a time" is enforced at the moment of starting a workout, using the freshest
  on-focus status fetched from the companion. There is a small window where two devices could start
  a workout while both are backgrounded/unreachable — start must be defensive.
- No background daemons or always-on sockets are required.
- If the companion is unreachable when focus happens, the rule degrades to last-known state.
- Per ADR 0019 the non-owner device may *finish* an active session, so at that moment it must be
  able to pull the in-progress draft (structure + actuals so far) from the owner; the on-focus fetch
  is the natural moment to refresh that draft.
