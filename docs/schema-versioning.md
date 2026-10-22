# Schema versioning

The domain schema has exactly one version number. Everything user-facing or cross-device that
carries a schema — export files, sync envelopes — carries the same number and is accepted only on an
exact match (ADR 0026, ADR 0041).

## Single source

`packages/domain/src/version.ts` exports `SCHEMA_VERSION`. Nothing else declares a version. It is
consumed by:

- the JSON Schema envelopes emitted into `packages/domain/gen/json-schema/` (ADR 0026);
- the generated Swift and Kotlin models, which carry `schemaVersion` on the `Domain` root;
- the export formats (Plan JSON, log CSV) when they land (ADR 0023, ADR 0027);
- every sync envelope — `PlanPush`, `WorkoutTransfer`, `StatusFetch`, `DraftPull`/`DraftPush`,
  `TerminalAction`, `Ack` — when they land (ADR 0041).

Receivers compare against their own `SCHEMA_VERSION` and refuse anything else with an "update the
app" error; there is no migration chain in the app (ADR 0026).

## Bumping the version

1. Change the Zod sources in `packages/domain/src/`.
2. Bump `SCHEMA_VERSION` in `packages/domain/src/version.ts`.
3. Run `pnpm codegen` to refresh JSON Schema, Swift, and Kotlin.
4. Refresh any shipped canonical templates (Plan JSON, log CSV) so they still parse at the new
   version (ADR 0026; templates are tracked by issue #54).
5. Run `pnpm lint && pnpm typecheck && pnpm test` — the codegen tests parse the committed artifacts
   and fail if they still declare the old version.
6. Commit the source change **and** every regenerated artifact together. Never hand-edit `gen/`.

## What CI enforces

- `pnpm codegen` followed by `git diff --exit-code`: generated output must match the Zod sources
  (drift check).
- `packages/codegen/src/emit.test.ts`: freshly emitted and committed JSON Schema documents must
  embed the current `SCHEMA_VERSION` and accept only that value.
- `packages/domain/src/json-schema.test.ts`: every schema still emits cleanly.

The version must not diverge per platform: the same `SCHEMA_VERSION` covers phone and watch, files
and wire.
