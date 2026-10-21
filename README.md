# Spotter

A local-first gym workout tracker: author Plans, run Workouts, log progression, and drive a
companion watch app that records sessions in the gym.

Domain context and decisions live in [`CONTEXT.md`](CONTEXT.md) and [`docs/adr/`](docs/adr/).
Work is tracked as GitHub issues, numbered in dependency order.

## Layout

| Path | What it is |
| --- | --- |
| `apps/phone` | React Native / Expo app (TypeScript), Drizzle + SQLite (ADR 0043) |
| `apps/wearos` | Wear OS app (Kotlin + Compose), Room storage (ADR 0044) |
| `packages/domain` | Zod schemas — the source of truth — plus generated models under `gen/` (ADR 0017) |
| `packages/theme` | Shared semantic theme tokens (ADR 0018) |
| `packages/codegen` | JSON Schema emission + Swift/Kotlin generators (ADR 0012, ADR 0045) |

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

## Generated artifacts

`pnpm codegen` regenerates every artifact under [`packages/domain/gen/`](packages/domain/gen/)
from the Zod sources; they are committed and **never hand-edited** (ADR 0045). CI
regenerates and fails the build if committed output drifts, and the emit tests in
`packages/codegen` compare fresh emission against the committed files, so `pnpm test`
catches drift locally too.

## Running each app

One matching watch per phone, same platform only (ADR 0029): Android phone ↔ Wear OS
watch. (A watchOS app was scaffolded and then removed — only the generated Swift
artifact remains; the platform stays in the domain model if it returns.)

| App | Status | Run it |
| --- | --- | --- |
| **phone** (Expo + React Native, dev-client) | Scaffolded (#4) | `pnpm --filter phone start` (Metro); on-device dev build: `pnpm --filter phone run:ios --device` / `run:android --device` |
| **wearos** (Kotlin + Compose, Room) | Scaffolded (#6) | `apps/wearos/./gradlew :app:installDebug` (installs on the connected watch/emulator) |

Build from the root: `pnpm build:phone` (Expo prebuild — generates `apps/phone/ios` +
`apps/phone/android`), `pnpm build:wearos` (Gradle `assembleDebug`), or `pnpm build`
(every workspace package that defines a build).

## Connecting phone ↔ watch

1. **Pair at the OS level** — nothing app-side can do this for you: pair from the
   **Wear OS by Google** companion app on the phone.
2. **App-level sync** (once implemented — issues #39–#47, #65–#66):
   - Phone → Watch (definitions): a **manual sync button in Settings** pushes the
     Current Plan + its active Routines + referenced Exercises (ADR 0005, ADR 0011).
   - Watch → Phone (finished workouts): **automatic on finish**, durable outbox with
     retry (ADR 0005, ADR 0028).
   - There is no cloud, no account, and no continuous channel — each app fetches the
     companion's status on focus, and the active-workout draft pushes on change
     (ADR 0007, ADR 0038).

## Installing on your devices (and keeping it installed)

Spotter is local-first with **no cloud backup** (ADR 0047) — export/import is the backup
story. To have the apps permanently on your devices:

- **Android phone** — enable Developer options + USB debugging, then
  `pnpm --filter phone run:android --device` (or `adb install` the built APK).
- **Wear OS watch** — pair it, then either run from Android Studio with the Watch as
  the deployment target, or `adb -s <watch-serial> install
  apps/wearos/app/build/outputs/apk/debug/app-debug.apk`. Over Wi-Fi/Bluetooth:
  `adb pair` / `adb connect` to the Watch's Developer options wireless-debugging
  address.

After that, day-to-day use needs no computer: the apps stay installed; syncing is
phone ↔ watch over the OS transport; backups are export/import files you own.

## Schema-first invariant

Zod schemas in `packages/domain` are the source of truth. Everything else is generated:
Zod → JSON Schema (`z.toJSONSchema` — Zod 4's first-party emitter; ADR 0045 names
`zod-to-json-schema`, which does not support Zod 4) → Swift/Kotlin (`quicktype`),
in CI/prebuild (ADR 0012, ADR 0017, ADR 0045).

Generated artifacts live in [`packages/domain/gen/`](packages/domain/gen/) and are
committed — **never hand-edit them**. `pnpm codegen` regenerates everything; CI
regenerates and fails the build if committed output drifts from the Zod sources.
