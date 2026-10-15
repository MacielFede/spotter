# 42. While a workout is active: no delete/deactivate, no plan push

Date: 2026-10-12

## Status

Accepted

## Context

ADR 0005 required the phone to tolerate a finished watch workout whose Plan/Routine had changed
since sync. Rather than tolerating that state, we prevent its most destructive causes. It was also
undefined whether a Plan push may land on the watch mid-workout.

## Decision

While a workout is active (known via the on-focus status, ADR 0007):

- the phone **blocks deleting or deactivating** any Plan or Routine — the UI offers "finish or
  cancel the active workout first". If the companion is unreachable but a session was last known to
  be active, the block still applies (safe default);
- **Plan push to the watch is blocked**; the watch's one Plan is replaced atomically only while
  idle. The phone explains and offers Retry (ADR 0028).

Template **edits** remain available during an active workout and propagate to the running session's
**not-yet-started Items only**: the in-progress Item and anything already logged are untouched
(snapshot purity holds for what's done, ADR 0004). If the session is on the companion device, the
change applies at the next draft sync (ADR 0038).

Residual race: if a Routine is deleted while a genuinely unknown session runs (started offline,
never fetched), the finished workout is still ingested — a log is never refused (ADR 0004).

## Consequences

- The "stale-plan finished workout" case becomes a vanishingly rare race instead of a normal state.
- Deletion UX during an active session needs a clear blocked-message path.
- The watch never has its Plan swapped out from under a running session.
