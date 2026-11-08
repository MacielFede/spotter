# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Users

Individual gym-goers planning and logging their own training at the gym.

## Product Purpose

Spotter helps users author reusable Plans and Routines, record completed workouts, and review exercise progression. Success means users can manage this training workflow on their phone, with an optional matching Wear OS companion for recording sessions.

## Positioning

Spotter is a local-first workout tracker with no account or cloud service. It keeps workout data on the user's devices, supports a matching Wear OS companion, and leaves backup and transfer in the user's hands through export/import files.

## Operating Context

- Users create Plans containing Routines and reusable Exercises, then start an active Routine to log a workout.
- The phone has Home, Plans, History, and Settings areas. History includes chronological logs and per-exercise progression views, filterable by Plan and Exercise.
- Phone-to-watch transfer is initiated manually from Settings. Finished workouts transfer automatically from watch to phone; active workout state is shared between paired devices.
- The phone app supports iOS and Android. The Wear OS companion pairs only with an Android phone; there is no cross-platform phone/watch pairing.

## Capabilities and Constraints

- Workout data is stored locally; there are no accounts, server, or cloud sync. App data is excluded from OS cloud backup. Export/import files are the backup path.
- Plans export as JSON templates and workout logs as CSV. Imports show a merge preview; saved workouts are deduplicated and never overwritten.
- Exercises are reusable in a global library. Plans own Routines, not Exercises or workout logs. Saved workout records are immutable snapshots.
- A user may have at most one active workout across the phone and paired watch. It may be saved once or cancelled and discarded.
- Weight is stored and displayed in kilograms only. The product does not include a pause state for workouts.
- The phone is implemented with Expo/React Native, TypeScript, SQLite, and Drizzle. Shared domain schemas and semantic theme tokens are maintained in workspace packages.

## Evidence on Hand

- The repository contains working phone app flows, domain schemas, tests, and JSON/CSV templates under `apps/phone/templates/`.
- No customer testimonials, external validation, or other marketing proof has been provided. Future work must not invent these.

## Product Principles

- Keep the core training workflow available locally, without requiring an account or network service.
- Make Plans and Routines reusable while keeping completed workout history as a durable record of what happened.
- Keep phone and matching-watch workout state coherent through explicit plan transfer and reliable completed-workout transfer.
- Let users own their backup and transfer files.
- Use consistent, unambiguous training data, including kilograms-only weights and explicit workout state.
