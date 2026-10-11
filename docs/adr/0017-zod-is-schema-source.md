# 17. Zod/TypeScript is the schema source of truth

Date: 2026-10-11

## Status

Accepted

## Context

ADR 0012 chose schema-first codegen but left the format open. The phone stack is TypeScript
(Expo + Drizzle), export/import files are JSON, and the model needs Swift and Kotlin mirrors.

## Decision

**Zod schemas in a shared TypeScript package are the source of truth.** The pipeline is:

1. author Zod schemas (and their inferred TS types) in `packages/…` (working name `@spotter/domain`
   or similar);
2. emit **JSON Schema** from them as the neutral, versioned artifact;
3. generate **Swift** and **Kotlin** models/parsers from the JSON Schema.

The user-facing export files are the JSON Schema-shaped documents — the contract and the wire format
are the same thing.

## Consequences

- TypeScript is the birthplace of every domain change; Swift/Kotlin are outputs, never edited by hand.
- Drizzle table definitions map to/from the Zod model in the TS layer.
- A schema version is part of the emitted JSON Schema, enforced on import (ADR 0013).
- The codegen step must run in CI/`prebuild` so the native apps cannot lag the model.
