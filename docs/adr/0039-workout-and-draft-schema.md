# 39. Workout and draft schema shape

Date: 2026-10-12

## Status

Accepted

## Context

ADR 0004 listed snapshot contents loosely; ADR 0027 fixed CSV columns; the Workout header, the
in-progress draft, id format, units, and the counting rules behind the CSV summary columns were
never pinned down. ADR 0016 also left volume for weighted time-based sets undefined.

## Decision

**Workout** (append-only log):

- header: `workoutId`, `planId`, `planName`, `routineId`, `routineName` (snapshots, ADR 0035),
  `startedAt`, `endedAt` (= save time), ISO 8601 with offset, and `startedOn: "phone" | "watch"` —
  a platform label for history display, not device identity (ADR 0038);
- the snapshot structure (Items, Supersets, Sets with mode/target/starting weight, ADR 0004);
- per-set **actuals, nullable**: sets never completed store `null` (this is how ADR 0019-style
  partial saves are represented).

**ActiveWorkout** (draft) is a **separate record**, never a row in the Workout log: structure +
actuals-so-far + cycle cursor `(item, member, round)` + an **absolute rest deadline** timestamp.
Save converts it to a Workout; Cancel deletes it. The absolute deadline lets rest timers survive
process death and screen-off (ADR 0034).

**Ids** are **UUIDv7** — globally unique and time-ordered — minted by the creating device, stable
across sync and export. A Workout's id is minted at **Start** and doubles as the session id:
terminal actions and simultaneous double-saves dedupe by it (ADRs 0037/0038). Counting and
display numbering are derived from chronological order, never from the id.

**Units:** weight is stored in **kilograms only** — there is no lb mode. Durations in seconds.

**Counts and volume:**

- `exerciseCount` = Exercise appearances (each Superset member counts);
- `setCount` = logged sets (Superset: rounds × members);
- `totalVolumeKg` = Σ weight × reps over **reps-based** logged sets with weight. Time-based sets
  never contribute to volume; bodyweight does not count.

## Consequences

- CSV summary columns (ADR 0027) are derivable from `details`, as already decided.
- Graphs ignore null actuals and never show points for weightless/time-only sets (ADR 0016).
- kg-only storage removes a whole class of unit-conversion bugs.
