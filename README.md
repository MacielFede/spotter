# Spotter

A local-first gym workout tracker: author Plans, run Workouts, log progression, and drive a
companion watch app that records sessions in the gym.

Domain context and decisions live in [`CONTEXT.md`](CONTEXT.md) and [`docs/adr/`](docs/adr/).
Work is tracked as GitHub issues, numbered in dependency order.

## Layout

| Path | What it is |
| --- | --- |
| `apps/phone` | React Native / Expo app (TypeScript), Drizzle + SQLite (ADR 0043) |
| `apps/watchos` | watchOS app (Swift), GRDB storage (ADR 0044) |
| `apps/wearos` | Wear OS app (Kotlin), Room storage (ADR 0044) |
| `packages/domain` | Zod schemas — the source of truth — plus generated models under `gen/` (ADR 0017) |
| `packages/theme` | Shared semantic theme tokens (ADR 0018) |
| `packages/codegen` | JSON Schema emission + Swift/Kotlin generators (ADR 0012, ADR 0045) |

The native app directories are placeholders until their scaffold issues (#4, #5, #6) land.

## Tooling

- **Package manager:** pnpm (via corepack). Node >= 20.
- **Language:** TypeScript, strict; shared config in `tsconfig.base.json`.
- **Lint + format:** Biome (`biome.json`), one command for the whole repo.
- **Tests:** Vitest, rooted at `vitest.config.ts`, wired for `packages/*`.

## Commands

Run from the repository root:

```sh
pnpm install        # install everything

pnpm lint           # lint + format check (Biome)
pnpm format         # lint + format, applying fixes

pnpm typecheck      # TypeScript check for every workspace package
pnpm test           # run the Vitest suite

pnpm build          # build every workspace package that defines a build
pnpm codegen        # regenerate JSON Schema + Swift/Kotlin from Zod
```

CI (`pnpm codegen` + `git diff --exit-code`) fails if committed generated
artifacts drift from the Zod sources.

## Building each app

- **phone** — Expo dev-client. Not scaffolded yet (issue #4); will run with
  `pnpm --filter phone start` once it exists.
- **watchos** — Xcode project under `apps/watchos`. Not scaffolded yet (issue #5);
  will build with `xcodebuild` / Xcode.
- **wearos** — Gradle project under `apps/wearos`. Not scaffolded yet (issue #6);
  will build with `./gradlew :app:assembleDebug`.

## Schema-first invariant

Zod schemas in `packages/domain` are the source of truth. Everything else is generated:
Zod → JSON Schema (`z.toJSONSchema` — Zod 4's first-party emitter; ADR 0045 names
`zod-to-json-schema`, which does not support Zod 4) → Swift/Kotlin (`quicktype`),
in CI/prebuild (ADR 0012, ADR 0017, ADR 0045).

Generated artifacts live in [`packages/domain/gen/`](packages/domain/gen/) and are
committed — **never hand-edit them**. `pnpm codegen` regenerates everything; CI
regenerates and fails the build if committed output drifts from the Zod sources.
