# 45. Codegen pipeline: zod-to-json-schema, then quicktype

Date: 2026-10-12

## Status

Accepted

## Context

ADR 0017 fixed the pipeline shape (Zod → JSON Schema → Swift/Kotlin) but not the tools.

## Decision

- **Zod schemas** live in the shared TS package and are the source of truth (domain model + sync
  envelopes, ADR 0041).
- **`zod-to-json-schema`** emits the versioned JSON Schema artifact.
- **`quicktype`** generates the Swift and Kotlin models/parsers from that artifact.
- Codegen runs in **CI/prebuild**; native apps cannot lag the schema. Generated code is never
  hand-edited.

## Consequences

- The emitted JSON Schema is the same artifact shipped for AI-assisted file conversion (ADR 0026).
- A schema change is: edit Zod → regenerate → all three apps compile against the new model.
- Generator output quirks are absorbed in the hand-written mapping layer (ADR 0012), never by
  editing generated files.
