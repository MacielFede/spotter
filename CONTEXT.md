# Spotter — Domain Context

> Living document. Glossary and aggregate boundaries are sharpened during grilling sessions.
> Each resolved decision is recorded as an ADR in `docs/adr/` (index at the bottom of this file).

## Product in one line

A local-first gym workout tracker: author Plans, run Workouts, log progression, and drive a
companion watch app that records sessions in the gym.

## Ubiquitous language

- **Plan** — top-tier aggregate and UI boundary. A user may hold several Plans and manages each
  independently. A Plan owns its Routines. A Plan owns **neither** Exercises **nor** Workout logs.
- **Exercise** — a reusable reference consisting of a **unique title** and a free-text description
  that may contain auto-linked URLs. Lives in a **global library** shared by every Plan, referenced
  by id (ADR 0036).
- **Routine** — an ordered collection of Modules, owned by a Plan. Carries an **active/inactive**
  state; only active Routines are startable, and only while they hold at least one enabled Module
  containing an Item. Any number may be active per Plan.
- **Module** — one of four fixed kinds (Warm-up, Stretching, Core, Cardio); a Routine holds at most
  one of each, ordered, each enabled or disabled. A Module holds an ordered list of **Items**. The
  same Exercise may appear more than once, even within one Module (ADR 0040).
- **Item** — a slot inside a Module. Either a single **Exercise** (owning its Sets) or a **Superset**.
- **Superset** — an ordered chain of member Exercises performed back-to-back, repeated for `N` rounds.
  Each member is **one Set template** (mode/target/starting weight) repeated every round, with
  actuals logged per round. One pass through the chain counts as one round ("counts as 1"). Rest
  lives on the Superset and applies after each round; member Sets carry no rest (ADR 0040).
- **Set** — the unit of work inside a routine template. Authored as either **reps-based** (rep target)
  or **time-based** (duration), may optionally carry a **starting weight** (nullable, independent of
  mode) and an optional **rest** duration applied after it. Mode/starting weight are fixed once
  authored; the watch cannot switch a Set's mode mid-workout.
- **Current Plan** — the single Plan the phone has sent to the watch (ADR 0011), explicitly marked
  **"On watch"** on the phone. The watch holds one Plan at a time; switching requires re-sync.
- **Workout** — a log of a performed session, an independent root entity. An immutable **snapshot**
  of the structure it ran (Items, member Exercises, Set modes/targets) plus the actuals recorded.
  References its source Plan and Routine by a snapshotted id + name taken at save time (a dead
  reference, not a live link) and keeps the source Exercise id, so history groups across Plans but
  depends on nothing staying alive. Saved Workouts are fully immutable (append-only history).
- **Active workout** — the at-most-one workout in progress system-wide. A **shared session with no
  owner**: any device may log, edit, save, or cancel it, and the latest draft wins (ADR 0038).
  Durably persisted while running, ended exactly once — deduped by session id — by Save (permanent
  log) or Cancel (nothing).

## Aggregate boundaries

- `Plan` owns `Routine`. `Exercise` and `Workout` are separate root entities referenced by id.
- Deleting a Plan or Routine never touches a `Workout`; logs reference them only by snapshot
  (ADR 0035). Deleting/exporting a Plan must not mutate or delete the global Exercise library. JSON
  export of a Plan embeds copies of the Exercises it references so the file is self-contained.
- A `Workout` snapshot never depends on a live `Routine`; the template and the log are separate
  (and the workout flow can never mutate the template).

## Key invariants

- At most **one** active Workout system-wide, across phone + the paired watch.
- An active session has no owner: the latest draft wins, and it ends exactly once — the first Save
  or Cancel for its session id is final (ADR 0038).
- A Workout can only start from an **active**, non-empty Routine (at least one enabled Module with
  an Item).
- A saved Workout is never edited or deleted; Cancel discards entirely (no partial logs). Imports
  and sync retries dedupe by id and never overwrite a log (ADR 0037).
- Deleting a Plan or Routine leaves every Workout untouched; logs reference them only by snapshot.
- Mode and starting weight are authored once; a workout may change **actuals**, never the template.
- New Workout prefills from the previous Workout of the **same Routine**, then the Exercise's last
  actuals anywhere, then the template's starting values — matched by position.
- While a workout is active, Plans/Routines cannot be deleted or deactivated, and no Plan push
  reaches the watch (ADR 0042). Mid-workout template edits propagate only to not-yet-started Items.

## Interop & platform decisions

- **Schema:** Zod (TypeScript) is the source of truth → emit JSON Schema → generate Swift + Kotlin.
- **Theme:** one shared semantic token file (roles like `background`/`primary`=skyblue, light+dark)
  consumed by all three apps. Follows the OS theme, with a light/dark override in Settings.
- **Phone→Watch (definitions):** manual sync button in Settings; pushes exactly the Current Plan and
  its active Routines + referenced Exercises.
- **Watch→Phone (finished Workout):** automatic on finish, with a durable outbox that retries and is
  cleared once the phone acknowledges.
- **Cross-device visibility:** each app fetches the companion's active-workout status/draft on focus
  (no continuous live channel); the in-progress draft is also **pushed on change** via the durable
  background transfer (ADR 0038).
- **Sync contract:** message envelopes (`PlanPush`, `WorkoutTransfer`, `StatusFetch`, `DraftPull`/
  `DraftPush`, `TerminalAction`, `Ack`) are Zod schemas in the shared package; every payload carries
  `schemaVersion` and receivers refuse mismatches — the exact-match rule, on the wire (ADR 0041).
  No device identity is modeled.
- **Formats:** Plan JSON = template only (no logs); CSV = logs, one row per Workout with a packed
  JSON details column. Both import by id-upsert with a per-merge preview UI — except Workouts, which
  dedupe and never overwrite (ADR 0037).
- **Units:** weights are stored and displayed in **kilograms only**.
- **Backup:** app data is excluded from OS cloud backup; export/import is the backup story
  (ADR 0047).
- **History:** chronological log + per-exercise graphs, filterable by Plan (snapshot id) and
  Exercise.
- **Platforms:** iOS 17 / watchOS 10 / Android 11+ (Wear OS 4).

## Architecture decisions (index)

- [0001](docs/adr/0001-exercises-are-a-global-library.md) — Exercises are a global library, not owned by a Plan.
- [0002](docs/adr/0002-set-carries-mode-target-weight.md) — A Set carries its mode, target, and starting weight.
- [0003](docs/adr/0003-module-holds-items.md) — A Module holds Items: Exercise or Superset.
- [0004](docs/adr/0004-workout-is-a-snapshot.md) — A Workout is an immutable snapshot.
- [0005](docs/adr/0005-sync-direction.md) — Sync is manual downward, automatic upward.
- [0006](docs/adr/0006-one-workout-at-a-time.md) — At most one Workout in progress, system-wide.
- [0007](docs/adr/0007-workout-status-fetched-on-focus.md) — Cross-device status fetched on focus.
- [0008](docs/adr/0008-in-progress-workout-durability.md) — In-progress workouts are durably persisted.
- [0009](docs/adr/0009-weight-optional-any-set.md) — Weight is optional and independent of mode.
- [0010](docs/adr/0010-many-active-routines.md) — Many routines may be active per Plan.
- [0011](docs/adr/0011-watch-carries-one-plan.md) — The watch carries one Plan and its active routines.
- [0012](docs/adr/0012-schema-first-codegen.md) — Domain model is schema-first, generated per language.
- [0013](docs/adr/0013-import-upserts-with-merge-preview.md) — Import upserts by id with a UI merge preview.
- [0014](docs/adr/0014-rest-is-per-set.md) — Rest is an optional duration on each Set.
- [0015](docs/adr/0015-csv-log-format.md) — CSV logs: one row per Workout with packed details.
- [0016](docs/adr/0016-progression-metrics.md) — Progression graphs: weight and volume over time.
- [0017](docs/adr/0017-zod-is-schema-source.md) — Zod/TypeScript is the schema source of truth.
- [0018](docs/adr/0018-shared-theme-tokens.md) — Theme is a shared semantic token file.
- [0019](docs/adr/0019-either-device-can-save.md) — Either device can save an active workout.
- [0020](docs/adr/0020-phone-workout-edits-snapshot-only.md) — Phone workout is fully editable, snapshot-only.
- [0021](docs/adr/0021-exercise-description-free-text-links.md) — Description is free text with auto-detected links.
- [0022](docs/adr/0022-global-start-list.md) — Workouts start from a global start list.
- [0023](docs/adr/0023-plan-json-template-only.md) — Plan JSON is template-only; logs travel as CSV.
- [0024](docs/adr/0024-saved-workouts-immutable.md) — Saved workouts are fully immutable.
- [0025](docs/adr/0025-cancel-discards.md) — Cancel discards an in-progress workout.
- [0026](docs/adr/0026-exact-version-files.md) — Exported files must match the exact schema version; ship templates for AI-assisted conversion.
- [0027](docs/adr/0027-csv-columns.md) — CSV columns: full summary + packed `details` JSON per Workout.
- [0028](docs/adr/0028-sync-transport.md) — Sync uses durable background transfers + a pending/Retry UI.
- [0029](docs/adr/0029-one-watch-per-phone.md) — One matching watch per phone; no cross-platform pairing.
- [0030](docs/adr/0030-archive-exercises.md) — Exercises are archived, never hard-deleted.
- [0031](docs/adr/0031-phone-tabs.md) — Phone shell is four bottom tabs: Home, Plans, History, Settings.
- [0032](docs/adr/0032-superset-authoring.md) — Superset authoring: chain container, with grouping as a shortcut.
- [0033](docs/adr/0033-watch-superset-cycling.md) — Watch superset cycling: per-member screen with a round header.
- [0034](docs/adr/0034-rest-timer-and-haptics.md) — Watch rest timer: countdown with skip/+30s, haptics, fires screen-off.
- [0035](docs/adr/0035-plans-do-not-own-workouts.md) — Plans do not own Workouts; logs snapshot the Plan's id + name.
- [0036](docs/adr/0036-exercise-titles-unique.md) — Exercise titles are unique.
- [0037](docs/adr/0037-workout-import-never-overwrites.md) — Workout import dedupes by id and never overwrites.
- [0038](docs/adr/0038-shared-active-session.md) — The active workout is a shared session with no owner.
- [0039](docs/adr/0039-workout-and-draft-schema.md) — Workout/draft schema: header, null actuals, kg-only, counts, volume.
- [0040](docs/adr/0040-module-slots-and-supersets.md) — Four fixed module slots; Superset = per-member template × N rounds, rest on the chain.
- [0041](docs/adr/0041-sync-contract.md) — Sync envelopes are versioned Zod schemas in the domain package.
- [0042](docs/adr/0042-mid-workout-plan-rules.md) — While a workout is active: no delete/deactivate, no plan push.
- [0043](docs/adr/0043-phone-stack.md) — Phone: Expo + React Native + Drizzle + SQLite.
- [0044](docs/adr/0044-watch-storage.md) — Watch storage: GRDB on watchOS, Room on Wear OS.
- [0045](docs/adr/0045-codegen-pipeline.md) — Codegen: zod-to-json-schema → quicktype, in CI/prebuild.
- [0046](docs/adr/0046-behavior-sharing-fixtures.md) — Behavior hand-written per platform, locked by golden fixtures.
- [0047](docs/adr/0047-no-cloud-backup.md) — App data is excluded from OS cloud backup.

## Out of scope

- Cloud sync / accounts — the app is local-only; no server, no accounts.
- Workout/exercise notes, RPE, warm-up-set flags, equipment and muscle-group catalogs.
- Weight units other than kilograms.
- A pause state for workouts — duration is wall clock from Start to Save/Cancel (ADR 0038).
- OS-level cloud backup/restore — export/import is the only backup story (ADR 0047).
