# 18. Theme is a shared semantic token file

Date: 2026-10-11

## Status

Accepted

## Context

The spec asks for dark mode and a skyblue/white/black palette across React Native, watchOS, and
WearOS. Defining colors three times invites drift and makes dark mode three separate efforts.

## Decision

A **single shared token file** (JSON, part of the shared package, sibling to the Zod schema) defines
**semantic color roles** — e.g. `background`, `surface`, `textPrimary`, `textSecondary`, `primary`
(skyblue), `onPrimary` — for both **light** and **dark** themes. Each app consumes tokens generated
from this file; no app hard-codes skyblue/white/black.

## Consequences

- Dark mode is one switch over the same token set on every platform.
- Rebranding or adding a role is a one-place change, then regenerate.
- Watch apps get a trimmed token subset (small screens) generated from the same source.
- The token file is versioned alongside the domain schema so the two never diverge.
