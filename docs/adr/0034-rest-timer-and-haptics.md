# 34. Watch rest timer and haptics

Date: 2026-10-11

## Status

Accepted

## Context

Rest is a per-Set duration applied after the Set (ADR 0014), and the watch auto-cycles. The timer
screen behaviour and haptics were unspecified.

## Decision

A dedicated **rest screen** shows a countdown (`mm:ss`), a preview of what's next (e.g.
`Next: Bench Press · Round 2`), and **Skip** and **+30s** actions. At zero it auto-advances.

Haptics fire at:

- **set completed** (user marks a set finished),
- **time-based set duration reached**,
- **rest countdown reaching zero**.

Because there is no continuous phone link, these must fire **with the screen off** via the platform's
local notification/haptic scheduling on the watch.

## Consequences

- The rest screen is a first-class step in the auto-cycle, alongside set screens.
- Wake/scheduling APIs per platform (WatchKit haptics + local notifications; Wear OS Ongoing
  Activity / notifications) must be used so timers fire while the wrist is down.
- Skip advances immediately; +30s extends the running countdown without altering the template.
