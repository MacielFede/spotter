# Generated domain artifacts

Everything under `gen/` is **generated — never hand-edit** (ADR 0045).

Regenerate from the Zod sources with:

```sh
pnpm codegen
```

- `json-schema/*.schema.json` — the versioned JSON Schema envelopes (ADR 0026, ADR
  0041): `{ schemaVersion, ...entity }`, one per entity plus `domain.schema.json`,
  the combined codegen input that carries every entity in one document with named,
  deduplicated `$defs`.
- `swift/Domain.swift` — quicktype-generated Codable models.
- `kotlin/Domain.kt` — quicktype-generated Jackson models.

Notes:

- The generated `Exercise`/`Plan`/`Workout`/`Domain` types are **envelope-shaped**:
  they carry `schemaVersion` alongside the entity fields, because the emitted
  documents are envelopes. The real export-file and sync-envelope schemas
  (ADR 0023, ADR 0041) land with issues #48 and #41.
- TODO(#5) / TODO(#6): round-trip encode/decode tests land with the watchOS and
  Wear OS app scaffolds, which consume these files.
- ADR 0045 names `zod-to-json-schema`, which does not support Zod 4; emission uses
  Zod 4's first-party `z.toJSONSchema` for the same artifact (ADR 0045 amendment).
- Custom checks (`.refine`/`.superRefine`: title uniqueness, one-module-per-kind,
  superset actuals-per-round) do **not** emit into JSON Schema — behavioral rules are
  hand-written per platform and locked by shared golden fixtures (ADR 0046).
- Generator naming quirks (e.g. generic top-level enums `Kind`/`Mode`, `Rounds` as
  an enum, union flattening into a combined struct + kind enum) are absorbed by the
  hand-written mapping layer in each app, never by editing these files (ADR 0012,
  ADR 0045).
- CI regenerates everything and fails the build if committed output drifts.
