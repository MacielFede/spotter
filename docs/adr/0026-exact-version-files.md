# 26. Exported files are version-locked to the exact schema version

Date: 2026-10-11

## Status

Accepted

## Context

Import uses upsert-by-id with a destructive merge preview (ADR 0013). Silently reading files of an
unknown or partial schema risks corrupting the library. A full migration-chain engine is real cost
for a local-first, single-user app.

## Decision

Every exported file (Plan JSON and log CSV) carries an explicit **`schemaVersion`** matching the
domain schema (ADR 0017). Import accepts **only the exact current version**; any other version is
**refused** with a clear error.

To keep older/newer files usable without an in-app migration engine, the app **ships a canonical
example/template** of each format (and the emitted **JSON Schema**), so a user can download the
template and hand both the old file and the template to an AI/tool to mechanically produce a file in
the current version.

## Consequences

- No migration code in the app; the compatibility burden moves to an external conversion step the
  user can run with AI help.
- Bumping the domain schema means bumping `schemaVersion` and refreshing the shipped template.
- Import errors must clearly state expected vs found version and point at the template.
- The example/template is a first-class, tested artifact — it must always parse.

## Supersedes note

This refines ADR 0013's "unknown/newer versions rejected" into a strict exact-match rule.
