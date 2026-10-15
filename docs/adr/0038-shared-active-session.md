# 38. The active workout is a shared session with no owner

Date: 2026-10-12

## Status

Accepted

## Context

ADRs 0006/0019/0020 built a device-ownership model: the starting device owned the session, the
other could only Cancel or Save, and saving required pulling the draft from the owner. Ownership is
awkward for a single user who moves between phone and watch and expects to pick the session up
anywhere.

## Decision

The active workout is a **shared session with no owner**. Any device may:

- **log** actuals and **edit** the session (within its UI's capabilities — the watch edits
  actuals/skips/revisits sets; structure editing is a phone UI capability, ADR 0020),
- **Save** or **Cancel** it,
- **continue** a session started on the other device (handoff is allowed).

Mechanics:

- The draft syncs between devices — pulled on focus (ADR 0007) and pushed on change via the durable
  background transfer (ADR 0028). When drafts diverge, the **latest-updated draft wins wholesale**
  (accepted risk: simultaneous offline edits on both devices can drop one side's sets; a single
  user logs sequentially in practice).
- A session ends **exactly once**, deduped by session id: the first Save or Cancel to reach a
  device is final; later terminal actions for the same session id are discarded.
- **Double-start race:** if two active sessions are discovered, the one with the earlier
  `startedAt` survives; the other auto-cancels its draft with a notice on that device.
- **No pause state.** Duration is wall clock from Start to the terminal action.
- Both devices begin sessions with an explicit **Start**. The phone's session is a **form-style**
  editable list — the guided cycle and rest timers stay watch-only (ADRs 0033/0034).

No device identity is modeled anywhere (no owner fields, no deviceId).

## Consequences

- ADR 0006's "phone can only Cancel/Save a watch session" is superseded — any device can do
  everything.
- ADR 0019's owner-pull is superseded — a device fetches/pushes the *latest draft*, and Save
  dedupes by session id.
- ADR 0008's durability rule extends to the phone: set-completions write immediately, edits
  debounced, resume on launch.
- "One workout at a time" (ADR 0006) is enforced by the double-start and terminal-dedupe rules
  rather than by ownership.

## Supersedes note

Supersedes the ownership parts of ADRs 0006 and 0019, and the "watch is authoritative" line in
ADR 0008.
