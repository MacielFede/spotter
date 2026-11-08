# Issue #77 — Must needed improvements: implementation plan

Work breakdown, dependency order, and design briefs for every item in #77.

## Decisions locked

| # | Decision | Consequence |
| --- | --- | --- |
| 1 | **Workout focus is visual only.** Collapse/expand is presentation; every set stays editable at any time. | No locking, no "current set" state machine. Simpler, and corrections mid-workout stay possible. |
| 2 | **`usesWeight: boolean` on `Exercise`, default `true`.** | Existing Exercises keep their weight inputs. Bodyweight work is an explicit opt-out per Exercise. |
| 3 | **History exercise rows expand inline** (compact graph + recent sets); **tapping the graph pushes a detail screen.** | Two-level reading: scan inline, drill in deliberately. |

## Dependency order

```
0.1  domain: usesWeight  ──► 0.5 db migrations ──► 2.x workout screen
        │                                          3.x progression
        └──► codegen (Swift/Kotlin) ──► wearos follow-up

0.2  generic components ──► 0.3 extract + restructure ──► 1.1 cards/dividers
                                                        2.x workout screen
                                                        3.x history/progression

0.4  router headers ──► touches every screen; land before the screen redesigns
0.6  theme fix ──► independent, land anytime
```

**Phase 0 must land before Phase 1–3.** Writing new screens into the current structure and then
restructuring would rework the same files twice.

---

## Phase 0 — Foundations

### 0.1 Domain schema: `usesWeight` on Exercise

Source of truth is `packages/domain/src/` (Zod). Everything else is generated.

- `packages/domain/src/exercise.ts` — add `usesWeight: z.boolean()` to `ExerciseSchema`. Semantics:
  `true` = weighted exercise (show/track kg); `false` = bodyweight or unweighted (hide kg input,
  chart reps/time instead).
- `packages/domain/src/workout.ts` — add `usesWeight` to `ExerciseSnapshotSchema` (line 52).
  `Workout` is an immutable snapshot (ADR 0004); the flag must be frozen at save time so History
  renders correctly even after the Exercise is later edited. `SupersetMemberSnapshotSchema` and
  `ExerciseEntrySchema` extend it and inherit the field.
- `packages/domain/src/version.ts` — bump `SCHEMA_VERSION` ([schema-versioning.md](../schema-versioning.md)).
- `pnpm codegen` — regenerates `packages/domain/gen/` (JSON Schema, Swift, Kotlin). Never hand-edit.
- `packages/domain/src/behavior.ts` — exercise copying/prefill helpers carry the new field.
- Fixtures under `packages/domain/fixtures/` and `packages/codegen` golden artifacts follow the bump.
- `apps/phone/templates/plan.template.json` + `logs.template.csv` — refresh so they parse at the new
  version (ADR 0026; templates are tracked by #54).

**Migration (default `true`):**

- `apps/phone/src/db/schema.ts` — add `usesWeight: integer('uses_weight', { mode: 'boolean' }).notNull().default(true)` to `exercises`.
- New Drizzle migration in `apps/phone/drizzle/`, backfilling `uses_weight = 1`.
- `apps/wearos` — Room entity + migration, same default. Kotlin model regenerates via codegen.

> **Open decision A — breaking import.** ADR 0026 accepts export files only on an *exact* schema
> version match and the app has no migration chain. Bumping `SCHEMA_VERSION` makes every Plan JSON
> and log CSV exported before this change unimportable ("update the app"). Options: (a) accept the
> break — the app is pre-release and templates ship for AI-assisted conversion; (b) relax the rule to
> accept one documented prior version and upsert `usesWeight = true`. This is a product call, not an
> implementation detail. **Needs a decision before 0.1 lands.**

> **Follow-up (out of scope for #77, needs tracking):** the Wear OS workout screen shows the kg
> input too. It should honour `usesWeight` for parity.

### 0.2 Generic components (Code #1)

`TextInput`, card, and row styling is repeated inline across `workout.tsx`, `exercise-editor.tsx`,
`routine-editor.tsx`, `SetEditorModal.tsx`, `ExercisePickerModal.tsx`. Introduce a small primitives
layer that consumes `@spotter/theme` semantic roles only — no literal colours.

Proposed set (adjust to what the screens actually need once 0.3 is underway):

| Component | Replaces | Notes |
| --- | --- | --- |
| `TextField` | bare `TextInput` in editors | label, hint, error, border/background from tokens |
| `NumberField` | `TextInput` + `keyboardType="number-pad"` in workout set rows | numeric, optional unit slot |
| `Card` | repeated `surface` + `border` + `borderRadius: 12` blocks | |
| `Divider` | the nested-card look General #1 removes | 1px rule using `tokens.border` |
| `SectionHeader` | module headers, group labels | |
| `Chip` | duplicated `FilterChip`/`Chip` in 3 screens | selected/unselected states |
| `Banner` | the "Workout in progress" banner | |
| `ListRow` | tappable rows in history/progression/exercises | |
| `PressableText` | the bare `Pressable` + coloured `Text` action links | hit target ≥ 44×44 pt / 48×48 dp |

This is also where `accessibilityRole`/`accessibilityState` and the platform touch-target minimums get
applied once, instead of per screen.

### 0.3 Extract components and restructure by domain (Code #2, #3)

Today everything flat lives in `src/components/` and screen-local helper components are defined
inline inside route files (`FilterChip` in `(tabs)/index.tsx`, `Chip` + `Chart` in
`progression/[exerciseId].tsx`, etc.).

Target layout — generic primitives at the root, everything else grouped by product domain:

```
src/components/
  ui/          TextField, NumberField, Card, Divider, Chip, SectionHeader,
               Banner, ListRow, PressableText          (0.2)
  workout/     SetRow, ExerciseBlock, SupersetBlock, ModuleCard, WorkoutHeaderActions
  history/     WorkoutRow, ExerciseAccordionItem, ProgressionGraph
  plans/       RoutineCard, PlanCard
  authoring/   ExercisePickerModal, SetEditorModal     (exists, keep)
  exercises/   ExerciseRow
```

Rules: a route file in `src/app/` contains layout and orchestration only — no `StyleSheet`, no
locally-declared components. Every visual piece is a file under `src/components/<domain>/`.

### 0.4 Move titles into the Expo Router header (Code #4)

- `src/components/Screen.tsx` drops `title`/`subtitle` and becomes a plain scrollable body surface.
- `src/app/_layout.tsx` — `headerShown: true` by default; per-screen `options.title`.
- `src/app/(tabs)/_layout.tsx` — `headerShown: true`; each tab screen owns its title ("Home",
  "Plans", "History", "Settings").
- Data-derived titles set at runtime via `navigation.setOptions({ title })`:
  - `history/[id].tsx` → the Workout's routine name (the issue's example)
  - `plan/[id].tsx` → the Plan name
  - `progression/[exerciseId].tsx` → the Exercise title
  - `exercise-editor.tsx` → the Exercise title (or "New Exercise")
  - `routine-editor.tsx` → the Routine name
  - `workout.tsx` → the routine name, per the sketch ("Workout" + Cancel)
- Wrap that in a `useScreenHeader(title, options?)` hook so it is one call per screen.

Platform conformance (the app ships to iOS and Android):

- iOS — large title on top-level screens collapsing to inline on scroll; inline on detail screens;
  left-edge swipe back preserved.
- Android — Material top app bar; system Back and predictive Back always work.
- `workout.tsx` needs a header trailing action for **Cancel** (the sketch puts it top-right), which
  means a header button, not a full-width button at the bottom.

### 0.5 Database migrations

Carried out alongside 0.1 — see above. Listed separately because `apps/phone/drizzle/` migrations
and `apps/wearos` Room migrations are the part most likely to be forgotten.

### 0.6 Fix the theme picker's "System" option (Settings #1)

**Symptom:** selecting "System" always renders light.

**Root cause (most likely):** `ThemeProvider` (`src/theme/ThemeProvider.tsx` line 52) resolves the
scheme with

```ts
const mode = preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;
```

`useColorScheme()` (RN 0.88) is `useSyncExternalStore(subscribe, getColorScheme)`, and
`getColorScheme()` returns **`null` whenever the `Appearance` native module is unavailable** — RN's
own `Appearance.js` caches `appearance: null` permanently in that case. The `=== 'dark'` check then
silently collapses `null` to `'light'`, which is exactly the reported symptom. The tokens and
`themes.dark` are correct; only the system path is broken.

**Verification first (10 min):** log `useColorScheme()` on a device in OS dark mode. If it is `null`
or stale, the diagnosis is confirmed. Also confirm the built binary actually carries the native
settings — `apps/phone/ios/Spotter/Info.plist` already has `UIUserInterfaceStyle = Automatic`, and
`apps/phone/android/app/src/main/res/values/styles.xml` uses `Theme.AppCompat.DayNight.NoActionBar`.
A binary built before that change would reproduce the symptom without any JS bug.

**Fix shape:**

- Resolve the scheme from `Appearance.getColorScheme()` directly, subscribed with
  `Appearance.addChangeListener`, instead of relying solely on the hook's first value.
- Treat `null` as *unknown* and surface it rather than silently claiming light — a stale-but-honest
  state beats a confidently wrong one.
- Keep the persisted `ThemePreference` behaviour as is.
- Add a `ThemeProvider` unit test with a mocked `Appearance`: system + OS dark → `themes.dark`;
  system + OS light → `themes.light`; explicit `dark` wins over a light OS.
- While here, note Android's `AppTheme` parent is `Theme.AppCompat.DayNight.*`; the Material 3
  reference prefers `Theme.Material3.*`. Decide whether to modernise it now or track separately.

---

## Phase 1 — General

### 1.1 One card per module, dividers inside (General #1)

The issue: exercises are wrapped in a card *inside* a module section, producing nested cards. Target:

```
┌ Module: Warm-up ────────────────────────────┐
│  Bench press                        ⋮ opts  │
│  ─────────────────────────────────────────  │  ← Divider
│  Overhead press                      ⋮ opts │
│  ─────────────────────────────────────────  │
│  Downhill press                       ⋮ opts│
│  + Add exercise                             │
└─────────────────────────────────────────────┘
```

- One `ModuleCard` per module. Exercises inside are **rows separated by `Divider`**, not cards.
- This applies wherever module structure is rendered: the workout screen and `routine-editor.tsx`.
- Built from the 0.2 primitives; no bespoke styles in the routes.

### 1.2 Human-readable timestamps (General #4)

Today `new Date(...).toLocaleString()` produces machine-shaped output (e.g. `10/28/2026, 2:31 PM`).

- Add one shared helper (e.g. `src/lib/formatWhen.ts`) with explicit forms: relative for recent
  ("Today, 18:42", "Yesterday", "Mon 14 Oct"), absolute date otherwise, and a duration form for
  workout length.
- Use it in `history.tsx`, `history/[id].tsx`, `workout.tsx` (the `startedAt` subtitle), and
  progression rows. One formatter, not four.
- Keep locale-aware; do not hand-roll English-only strings.

### 1.3 Native tabs (General #3)

The tab bar is already `expo-router`'s `<Tabs>`, but the styling is hand-rolled
(`src/app/(tabs)/_layout.tsx`: custom `tabBarStyle`, `Ionicons`). Bring it to platform truth:

- iOS — native tab bar appearance: system materials/translucency, `SF Symbols` for icons instead of
  the Ionicons web set, labels that follow Dynamic Type.
- Android — Material 3 `NavigationBar` behaviour: tonal surface, active indicator, icon + label
  roles from the M3 type scale.
- Keep the four destinations (Home, Plans, History, Settings) and their order.

### 1.4 App icon (General #2)

Currently `assets/icon.png` + the Android adaptive layers (`android-icon-foreground.png`,
`-background.png` (`#E6F4FE`), `-monochrome.png`) plus `ios/Spotter/Images.xcassets/AppIcon.appiconset`.

- Direction: a mark that reads at 29 px and survives the monochrome/themed-icon mask on Android 13+.
  It should be built from the same skyblue `primary` world (`#0EA5E9` / `#38BDF8`) so it belongs to
  the app.
- Deliverables: 1024×1024 iOS icon, Android adaptive foreground/background/monochrome layers, and
  the splash mark in `assets/splash-icon.png`. Monochrome must be a solid-alpha silhouette, not a
  greyscale image.
- **This is an asset task** — it needs image generation/export, which is separate from the code work.

---

## Phase 2 — Workout screen

The largest design piece; your sketches (Images 2 and 3) are the source of truth.

### 2.1 Structure and hierarchy

Per the sketch, top to bottom:

```
┌ Workout                        Cancel ┐   ← router header + trailing action
│
│ MODULE: WARM-UP                        │   ← one ModuleCard (1.1)
│ ┌────────────────────────────────────┐ │
│ │ Bench press                  ⋮     │ │   ← collapsed: "done" state, muted
│ │ ────────────────────────────────── │ │
│ │ Overhead press               ⋮     │ │   ← expanded: current focus
│ │ How to set up the bar… (link)      │ │   ← description, only if present
│ │ Prescribed  12 reps    60 kg       │ │
│ │ Actual   [  12  ]    [ 60.0  ]     │ │
│ │ + Add set                          │ │
│ │ ────────────────────────────────── │ │
│ │ Downhill press               ⋮     │ │   ← collapsed: not started
│ │ ────────────────────────────────── │ │
│ │ + Add exercise   + Superset        │ │
│ └────────────────────────────────────┘ │
│
│ [ Save workout ]                       │
```

- **Superset block:** the sketch shows a `Superset` container inside the module holding member
  exercises, each with its own description + prescribed reps/time + weight. Members are rows inside
  the superset block, not separate cards. Round header ("Round 2 of 4") belongs to the block.

### 2.2 Focus and collapse (Workout #1, Image 3)

- The exercise being worked expands by default; others are collapsed but tappable.
- **Collapse is visual only** — no set is locked and any set is editable at any time. A tapped
  collapsed row expands; the "current" one is simply the one expanded by default.
- Completed exercises render muted (the sketch's "exercise already done") so the eye skips them.
- Multiple exercises can be expanded at once; there is no enforced single-expanded accordion here.

### 2.3 Set rows and inputs (Workout #1, #3, #4)

- **Labels on inputs.** The row reads `Prescribed  12 reps · 60 kg` above `Actual [ ] [ ]`. Per the
  issue: drop the redundant "reps" label and let the reps/time input carry it, with the template
  value as the placeholder/default.
- **Entering actuals prefills from the template** — the value shown is the target until changed.
- **`usesWeight` drives the kg input.** `false` → the weight column is absent entirely, not disabled.
  That is the whole point of 0.1.
- **Time-based display (Workout #4):** `600s` is unreadable. Format as `10:00` (mm:ss) for durations
  ≥ 60 s, with `45s` retained for short ones. Same helper for rest durations.
- **Enter advances to the next input** (Workout #2) — `onSubmitEditing` focuses the next field and
  does *not* dismiss the keyboard. Needs a `refs` chain across the set rows.

### 2.4 Removal and options (Workout #5)

- Per the sketch, each exercise row has an overflow (`⋮`) → **Remove exercise**. That removes one
  exercise (or one superset member) without touching the rest.
- Today `removeEntry` and `removeModule` both exist but the wording is blunt ("Remove exercise",
  "Remove module"). Clarify copy: "Remove from workout" for an exercise, "Remove superset" for the
  whole chain, "Remove <Module> section" for the module. All are snapshot-only changes — they never
  mutate the Plan (ADR 0020), and the alert copy should say so.

### 2.5 Descriptions (Workout #6)

- Show `description` inline on the expanded exercise, **only when non-empty**, rendered through the
  existing `LinkifiedText` (ADR 0021). Collapsed rows show title only.

### 2.6 Module ordering (Workout #7)

- Render modules in the **author's order** (`modules.position`), not the fixed
  `MODULE_KINDS` order in `src/lib/authoring.ts`. The workout snapshot already carries module kind
  and position — confirm the snapshot preserves the authored order and render from that.
- Keep the "add missing module" affordance at the end.

---

## Phase 3 — History + Progression

### 3.1 History gets two tabs (History #1)

```
┌ History                          ┐
│ ┌──────────────┬────────────────┐ │
│ │  Workouts    │   Exercises    │ │   ← segmented control
│ └──────────────┴────────────────┘ │
```

Replaces the current single list plus the `Progression` button.

- **Workouts tab** — the saved-workout list as today (`src/app/(tabs)/history.tsx`), with
  human-readable timestamps (1.2) and the existing duration/sets/volume summary.
- **Exercises tab** — an accordion over every Exercise that has logs:
  - collapsed row: exercise title + log count;
  - **tap the row → expands inline** to show a compact graph + recent sets (the sketch: "Tapping the
    exercise expands the data displayed");
  - **tap the graph → pushes the full detail screen** (the sketch: "Tapping the graph opens more
    details like total weight, etc.") — the existing `progression/[exerciseId].tsx`.
- **Search field** at the top of the Exercises tab (Progression item: "choose (and search) an
  exercise"). Filter by title, case-insensitive.
- One row expanded at a time keeps the list scannable.

### 3.2 Progression detail screen (Progression #1–3)

Rework `src/app/progression/[exerciseId].tsx`:

- **Graph above the logs**, not bar-per-date rows. Today it renders a horizontal bar list labelled
  `Chart` — replace with an actual line/area chart.
- **Show reps (or time) as well as weight.** This is the issue's stated reason: exercises without
  weight currently "don't chart" and show a dead-end empty state. Driven by `usesWeight` from 0.1:
  - `usesWeight: true` → weight series primary, volume secondary; reps alongside.
  - `usesWeight: false` → reps or seconds series primary; weight and volume omitted entirely.
- **Drop the Plan filter chips.** The issue is explicit: "I don't care about plan filtering in the
  progression of an exercise, just how i progressed." That also removes the `titleFor()` "Across
  Plans" special case.
- **More data — PRs and summaries** ("it would be awesome to add more data, like PR's and
  everything"). Under the graph: best weight, best reps, best volume, total sessions, last
  performed. Each derived from the existing `src/lib/progression.ts` series — no new data model.
- Individual logs listed below the graph, each showing date + every set's actuals (reps/time and
  weight where used).

### 3.3 Chart component

The graph is now used in two places (inline accordion, detail screen) at two sizes, so it belongs in
`components/history/ProgressionGraph.tsx` with a `compact` / `full` variant rather than being drawn
twice.

> **Decision needed:** no charting library exists in the repo. Either draw it with plain
> `react-native-svg` (one dependency, full control, matches the token world) or hand-roll with
> `View`/`Animated` primitives (zero deps, limited). Recommend `react-native-svg` — the inline
> accordion sparkline and the full detail chart both need real paths.

---

## Suggested PR sequence

| PR | Contents | Why together |
| --- | --- | --- |
| 1 | 0.1 domain `usesWeight` + migrations + codegen + templates | Self-contained schema change; everything downstream depends on it |
| 2 | 0.2 + 0.3 primitives and restructure | Pure refactor, no behaviour change — reviewable on its own |
| 3 | 0.4 router headers | Touches every screen; easier once routes are clean |
| 4 | 0.6 theme fix | Independent; small |
| 5 | 1.1 + 1.2 + 1.3 general polish | Builds on the primitives |
| 6 | 2.x workout screen | The biggest UI change |
| 7 | 3.x history + progression | Independent of 6, but benefits from the chart work |
| 8 | 1.4 app icon | Asset-only, can ship anytime |

---

## Open decisions

1. **Breaking import (blocking 0.1).** Accept that pre-change exports stop importing, or relax
   ADR 0026's exact-match rule for one prior version? See the note in 0.1.
2. **Charting dependency.** `react-native-svg` (recommended) vs. hand-rolled. See 3.3.
3. **Android theme modernisation.** Move `AppTheme` from `Theme.AppCompat.DayNight` to
   `Theme.Material3.*` as part of 1.3, or track separately?
4. **Wear OS parity for `usesWeight`.** In scope for #77, or a follow-up issue?
5. **Icon direction.** Needs a brief before the asset is produced (1.4).
