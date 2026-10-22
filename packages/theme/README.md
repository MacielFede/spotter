# @spotter/theme

The single shared source of semantic color roles (ADR 0018).

## Source

[`src/tokens.json`](src/tokens.json) defines the roles for **light** and **dark**. Colors are
`#RRGGBB`; roles are semantic (what the color is for), not brand names:

`background`, `surface`, `surfaceElevated`, `border`, `textPrimary`, `textSecondary`, `primary`
(skyblue), `onPrimary`, `danger`, `onDanger`.

`watchRoles` is the trimmed subset Wear OS consumes.

## Generated artifacts

Never hand-edit [`gen/`](gen/). `pnpm codegen` (from the repo root) emits:

- `gen/phone/theme.ts` — typed tokens for React Native; re-exported from the package root.
- `gen/wearos/Theme.kt` — Compose `SpotterColors` tokens, compiled into the Wear OS app.

Both carry `THEME_VERSION`, sourced from the domain `SCHEMA_VERSION` so theme and schema never
diverge. CI regenerates and fails on drift.

## Consuming

```ts
import { themes } from '@spotter/theme';
```

The phone renders through `src/theme/ThemeProvider.tsx`, which follows the OS theme and persists a
light/dark/system override (issue #17). Wear OS maps the generated colors onto its Material 3
scheme in `WearTheme.kt` (issue #19).
