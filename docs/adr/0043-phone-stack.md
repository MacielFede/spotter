# 43. Phone stack: Expo + React Native + Drizzle + SQLite

Date: 2026-10-12

## Status

Accepted

## Context

ADR 0012 assumed a React Native/Expo phone app with Drizzle + SQLite in passing, but the stack was
never ratified as a decision, and the relationship between local DB migrations and the file
`schemaVersion` (ADR 0026) was undefined.

## Decision

The phone app is **Expo + React Native (TypeScript)**, with **Drizzle ORM over SQLite** for local
persistence. Local DB schema migrations are handled by Drizzle migrations and are **independent of
the file `schemaVersion`**: the exact-match refusal rule applies only to import files and sync
payloads — the app can never refuse its own database; it migrates it forward.

## Consequences

- Two migration concepts exist and are now named: local DB migrations (always applied) vs file/wire
  version (exact match).
- The watch companion bridge (ADR 0028) ships as a native module in an Expo dev client.
- SQLite is the system of record; the Workout log and the ActiveWorkout draft are separate tables
  (ADR 0039).
