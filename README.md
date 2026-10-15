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

## Generated artifacts

`pnpm codegen` regenerates every artifact under [`packages/domain/gen/`](packages/domain/gen/)
from the Zod sources; they are committed and **never hand-edited** (ADR 0045). CI
regenerates and fails the build if committed output drifts, and the emit tests in
`packages/codegen` compare fresh emission against the committed files, so `pnpm test`
catches drift locally too.

## Running each app

One matching watch per phone, same platform only (ADR 0029): iPhone ↔ Apple Watch,
Android phone ↔ Wear OS watch.

| App | Status | Run it |
| --- | --- | --- |
| **phone** (Expo + React Native, dev-client) | Not scaffolded yet — issue #4 | `pnpm --filter phone start` (Metro); on-device dev build: `pnpm --filter phone run:ios --device` / `run:android --device` |
| **watchos** (Swift, GRDB) | Not scaffolded yet — issue #5 | `open apps/watchos/Spotter.xcodeproj`, pick your Watch as the run destination in Xcode (⌘R) |
| **wearos** (Kotlin + Compose, Room) | Not scaffolded yet — issue #6 | `apps/wearos/./gradlew :app:installDebug` (installs on the connected watch/emulator) |

Each scaffold issue also wires a build from the repository root (`pnpm build` covers
every package that defines a build).

## Connecting phone ↔ watch

1. **Pair at the OS level** — nothing app-side can do this for you:
   - Apple Watch: pair from the **Watch** app on the iPhone (Watch → Pair New Watch),
     and let it install apps automatically or via the Watch app's *My Watch → Available
     Apps*.
   - Wear OS: pair from the **Wear OS by Google** companion app on the phone.
2. **App-level sync** (once implemented — issues #39–#47, #55–#56, #65–#66):
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

- **iPhone** — build the Expo dev-client once against your device:
  `pnpm --filter phone run:ios --device` (sign with your free/personal team in Xcode;
  with a free team, re-sign roughly every 7 days, or use a paid team to keep it
  installed indefinitely).
- **Apple Watch** — with the Watch paired, Xcode lists it as a run destination: open
  `apps/watchos/Spotter.xcodeproj`, select your Watch, ⌘R (or
  `xcodebuild -destination 'platform=watchOS,name=<Your Watch>' ...`). Installing via
  the iPhone also pushes it to the Watch (watchOS apps install through the paired phone).
- **Android phone** — enable Developer options + USB debugging, then
  `pnpm --filter phone run:android --device` (or `adb install` the built APK).
- **Wear OS watch** — pair it, then either run from Android Studio with the Watch as
  the deployment target, or `adb -s <watch-serial> install app-debug.apk`
  (`apps/wearos/app/build/outputs/apk/debug/`). Over Wi-Fi/Bluetooth:
  `adb pair` / `adb connect` to the Watch's Developer options wireless-debugging address.

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
