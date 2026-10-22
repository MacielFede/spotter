# 12. Domain model is schema-first, code-generated per language

Date: 2026-10-11

## Status

Accepted — amended by ADR 0048 (the watchOS app was removed; Swift output is still generated).

## Context

The monorepo ships three apps — React Native/Expo (TypeScript, Drizzle + SQLite), watchOS (Swift),
and WearOS (Kotlin). The same domain concepts must exist and stay in lockstep in all three, but no
single ORM spans them (Drizzle is TS-only; the watches use native stores).

## Decision

A **single versioned schema is the source of truth**, and the domain models plus (de)serialization
are **generated** for TypeScript, Swift, and Kotlin from it. No app hand-writes the shared model.

The concrete schema format and pipeline are decided in ADR 0017 (Zod → JSON Schema → Swift/Kotlin);
the invariant here is one source, generated into all three.

## Consequences

- Adding/altering a domain field is a one-place change followed by codegen across all three apps.
- Storage-specific concerns (Drizzle tables, SwiftData/GRDB, Room/SQLDelight) stay hand-written and
  map to/from the generated model.
- Requires committing to a codegen pipeline early — a deliberate up-front cost accepted in exchange
  for drift-free cross-platform types.
