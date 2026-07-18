# Yatzy Scoring App — Plan

A scorekeeping app to replace paper Yatzy sheets. No playing/simulating dice in-app — players roll physical dice, the app just calculates and tracks scores, with some QoL features paper can't do.

Self-hosted (Docker, no ongoing SaaS), used mainly on iPads (host) and iPhones (companions).

---

## Core features

- Score a category by selecting it and entering the final dice roll — no manual summing.
- Companion page: each player can check their own progress on their phone instead of asking the host.
- Totals hidden by default (no peeking at the running score), host can reveal.
- Multiple game modes (dice count + category set): Normal, Family, Giant. When starting a game, categories can be added/removed from the chosen mode as a one-off tweak for that game only — this is not a "save as a new mode" feature, there's no persistent custom-mode management. Next game, you're back to picking from the three defaults.
- Click a category (in-game or while picking a mode) to see what roll it needs.
- No accounts anywhere. Host creates a game and enters players; companions join via a short URL/QR and pick themselves from that list.

## Game modes

Sourced directly from `5-dice.txt` / `6-dice.txt` / `giant.txt`. Most categories are **sum-based** (computed from the dice actually rolled); a handful are **fixed** all-or-nothing values regardless of which faces make up the pattern — the straights, Giant's Claus/Knold/Tot/Kaptajn Vom family, and Yatzy.

**General sum rule** (confirmed): every sum-based pattern category — pairs, n-of-a-kind, the ×N groups, the size-A+size-B combos — scores using *exactly* the dice required to satisfy the pattern, never any extra matching dice beyond what's needed and never the rest of the roll. E.g. Giant's "3 of a kind" with five 6s rolled still scores `3×6=18`, not `5×6=30`. A category is *eligible* with "at least N" matching dice present, but only *scores* on exactly N of them.

- **Normal** — 5 dice. Upper bonus: minimum 63, bonus 50 (3 of each).
  Ones–Sixes · 1 Pair · 2 Pairs · 3 of a Kind · 4 of a Kind · House (3+2) · Lille (1-5 straight, fixed 15) · Stor (2-6 straight, fixed 20) · Chance · Yatzy (fixed 50)

- **Family** — 6 dice. Upper bonus: minimum 84, bonus 50 (4 of each).
  Ones–Sixes · 1/2/3 Pairs · 3 of a Kind · 4 of a Kind · 2×3 of the same (two distinct-face triples) · House (2+3) · Lille (fixed 15) · Stor (fixed 20) · Royal (1-6 straight, fixed 30) · Chance · Yatzy (fixed 50)

- **Giant** — 12 dice. Upper bonus: minimum 189, bonus 200 (9 of each).
  Ones–Sixes · 1–6 Pairs · 3–11 of a Kind · 2×3/2×4/2×5/2×6 of the same · 3×3/3×4 of the same · Lav (1-5 straight, fixed 15) · Høj (2-6 straight, fixed 20) · Cameron (1-6 straight, fixed 30) · Lille Claus (straight+2×6, fixed 50) · Store Claus (straight+3×6, fixed 75) · Knold (straight+4×6, fixed 100) · Tot (straight+5×6, fixed 150) · Kaptajn Vom (straight+6×6, fixed 200) · Lillemor (3+2) · Poeten (4+2) · Momsemor (5+2) · Skipperskræk (6+2) · Radiserne (4+3) · Basserne (5+3) · Gyldenspjæt (6+3) · Kasket Karl (5+4) · Klaus Kludder (6+4) · Jens Lyn (6+5) · Chance · Yatzy (fixed 250 + eyes bonus)

Normal's Yatzy is flat-only (50, no eyes bonus). Family (50) and Giant (250) both include the eyes-bonus variant — confirmed from the source files, corrects an earlier assumption that none of the built-in modes used it. The toggle stays per-mode/per-category either way, so this was just a data correction, not a design change. See "Scoring engine" below.

Architecture supports adding a new mode (like Giant was) as close to a **data-only change** as possible: mapping Giant onto Normal/Family's primitives left exactly one genuinely new primitive needed (`straight_plus_extra`, for the Claus/Knold/Tot family) — everything else reused.

---

## Product/UX decisions

- **Companion flow**: scan QR/open short link → pick your name from the host-entered player list → live-updating, read-only view of your own progress. No claiming/locking a player identity — if two phones pick the same player, that's fine, matches how a physical sheet already has everything visible on one page. Companion view is scoped to that one player only — never shows other players' scores, and never shows any total/sum, ever. There is no "reveal" concept on companion at all.
- **What "hide totals" actually means**: individually entered category scores are always visible to whoever's allowed to see that row (yourself on companion, every player on host) — that's just tracking progress, never hidden. Totals/sums are simply never shown on companion, full stop — no flag, no reveal event, nothing to sync. On the host screen, seeing totals early is a plain local UI toggle (off by default, unsynced, resets on refresh, no DB column — pure personal convenience for the one device running the host view). The actual "reveal" moment — final standings/podium — happens once on the host screen when the game finishes (`sessions.finishedAt` set), not as a separate flag. Server always sends full data (including totals) to every client; hiding is purely a client-side rendering choice, never response filtering.
- **Late joiners**: explicitly out of scope for v1. The data model doesn't fight this if it comes up anyway (a player added mid-game just starts with a blank card), but no UX is being designed around it.
- **Typo fixes**: host can rename a player after the fact.
- **Cross-out / "no score"**: part of the normal per-category entry flow (not a separate button elsewhere), writes a real `0`. No separate flag is needed to distinguish "chose to cross out" from "rolled and it scored zero" — every zero is rule-legitimate (every category except Chance can naturally compute to 0; Chance's minimum is `diceCount × 1`, never zero). Display symbol for a zero (plain `0`, a dash, something else) is still TBD, decide during UI work.
- **Upper section relative display**: each upper-section cell shows a signed delta relative to the per-face target needed for the bonus, not the raw score:
  ```
  delta = actualScore - (requiredCount × faceValue)
  requiredCount = mode.upperBonusThreshold / 21
  ```
  e.g. five 1s on Family → **+1**, three 6s → **-6**. Purely a display computation, no schema impact.
- **Bonus progress indicator**: running subtotal of the deltas filled in so far, shown near the upper section, so pace-to-bonus is visible at a glance.
- **Yatzy bonus**: flat bonus, per mode (Normal 50, Family 50, Giant 250), with an optional "extra points equal to eyes rolled" variant (`includeEyesBonus`) kept available per-mode for future custom modes even though none of the three built-in modes currently use it. No stacking bonus for multiple Yatzys in one game.
- **Backlog (not building now)**: a fun end-of-game screen — animation/fireworks, a podium for the top finishers plus a list of the rest. Needs no new backend or schema, just a results view sorted by final score plus a frontend animation library (e.g. `canvas-confetti`) whenever it gets built.
- **Backlog (not building now)**: a game history / stats view. Sessions are meant to persist rather than be cleaned up, so this needs no schema changes when it happens — `sessions.finishedAt` (null while in progress) already gives both the "is this game done" filter and the sort order a history list needs.

---

## Architecture

- **Hosting**: 100% self-hosted, single Docker image, one container, one volume for the SQLite file. No external/paid services. Served at `yatzy.mydomain.tld` behind an existing reverse proxy (TLS termination handled there — satisfies the PWA service worker's secure-context requirement for free).
- **Frontend**: Vite + Svelte SPA (not SvelteKit — no SSR/content need), installable PWA via `vite-plugin-pwa`.
- **Styling**: Tailwind CSS + **shadcn-svelte** (components copied into the repo via CLI, built on headless Bits UI — chosen for the most polished default look, at the cost of a bit more setup than an npm-installed component library).
- **Client data/state**: TanStack **Query** (cache fed by both request/response calls and WS subscription pushes), TanStack **Table** (the categories × players scorecard grid, since the category list is dynamic per mode), TanStack **Devtools**. Considered and deliberately skipped: Form (defer until the custom mode builder needs it), Store (Svelte's built-in stores already cover this), Virtual (no list in this app is ever long enough to need it), DB (solves distributed/local-first sync problems this app doesn't have).
- **API/sync**: Fastify + **tRPC** — typed procedures for queries/mutations, typed **subscriptions over WebSocket** for realtime session state (replaces a hand-rolled WS message protocol). Realtime design: an in-memory per-session-code pub/sub hub in the single Node process; mutations write to SQLite then broadcast the full session state to that code's subscribers (state is small, so no diffing — just re-send the whole blob).
- **Persistence**: SQLite + Drizzle ORM.
- **Routing**: `svelte-spa-router` (small, well-worn, not worth hand-rolling even for ~4 routes).
- **Auth model**: none. Session creation returns an opaque `hostToken` stored in the host's `localStorage`, required on host-only mutations via a tRPC middleware. The session code/QR is the only real boundary — same trust model as a shared paper sheet.
- **DX tooling**: Biome for linting + formatting (single tool, no ESLint/Prettier) — has genuine, if experimental, Svelte support since v2.3/2.4 (formats and lints the HTML/CSS/JS inside `.svelte` files, including template-aware checks), which is currently ahead of oxc's tooling for this framework (oxlint/oxfmt only see `.svelte` script blocks, no template awareness yet) — evaluated both, went with the mature single-tool option. Bundling is Rolldown-powered for free via Vite 8+ (default since March 2026), no separate package needed. Biome needs `css.parser.tailwindDirectives: true` in `biome.json` to recognize Tailwind v4's custom CSS syntax (`@apply`/`@theme`/`@variant`/`@source`) — off by default, otherwise flags it as unrecognized.

---

## Data model (Drizzle / SQLite)

```ts
export const gameModes = sqliteTable('game_modes', {
  id: text('id').primaryKey(),                 // "normal" | "family" | "giant" | uuid for custom
  name: text('name').notNull(),
  diceCount: integer('dice_count').notNull(),
  isBuiltin: integer('is_builtin', { mode: 'boolean' }).notNull().default(false),
  upperBonusThreshold: integer('upper_bonus_threshold').notNull(),
  upperBonusAmount: integer('upper_bonus_amount').notNull(),
});

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),                 // slug, e.g. "three_kind"
  label: text('label'),                        // override; falls back to the primitive's generated default label if null
  description: text('description').notNull(), // tooltip copy
  section: text('section', { enum: ['upper', 'lower'] }).notNull(),
  primitive: text('primitive').notNull(),       // key into the code-side scoring catalog
  params: text('params', { mode: 'json' }).notNull(),     // e.g. {} for chance, { face: 1 }, { n: 3 }, { flatBonus, includeEyesBonus }
  exampleDice: text('example_dice', { mode: 'json' }), // number[]; null = no static example, tooltip computes one dynamically (currently only sum_of_face categories)
});

export const gameModeCategories = sqliteTable('game_mode_categories', {
  gameModeId: text('game_mode_id').notNull().references(() => gameModes.id),
  categoryId: text('category_id').notNull().references(() => categories.id),
  orderIndex: integer('order_index').notNull(),
  labelOverride: text('label_override'), // null = use categories.label (or its own fallback); set when the same category needs a different display name for this mode (e.g. House vs. Lillemor)
}, (t) => ({ pk: primaryKey({ columns: [t.gameModeId, t.categoryId] }) }));

export const sessionCategories = sqliteTable('session_categories', {
  sessionCode: text('session_code').notNull().references(() => sessions.code),
  categoryId: text('category_id').notNull().references(() => categories.id),
  orderIndex: integer('order_index').notNull(),
  labelOverride: text('label_override'), // copied from game_mode_categories.labelOverride at session creation, same reasoning as everything else in this table being a locked-in resolved copy
}, (t) => ({ pk: primaryKey({ columns: [t.sessionCode, t.categoryId] }) }));

export const sessions = sqliteTable('sessions', {
  code: text('code').primaryKey(),              // short human code
  gameModeId: text('game_mode_id').notNull().references(() => gameModes.id),
  hostTokenHash: text('host_token_hash').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  finishedAt: integer('finished_at', { mode: 'timestamp' }),  // null = in progress, set = finished (also the history sort key)
});

export const players = sqliteTable('players', {
  id: text('id').primaryKey(),
  sessionCode: text('session_code').notNull().references(() => sessions.code),
  name: text('name').notNull(),
  orderIndex: integer('order_index').notNull(),
});

export const scores = sqliteTable('scores', {
  sessionCode: text('session_code').notNull().references(() => sessions.code),
  playerId: text('player_id').notNull().references(() => players.id),
  categoryId: text('category_id').notNull().references(() => categories.id),
  value: integer('value'),                      // null = not yet entered, 0 = filled in as zero
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
}, (t) => ({ pk: primaryKey({ columns: [t.sessionCode, t.playerId, t.categoryId] }) }));
```

Notes:
- `params`/`exampleDice` as JSON columns (SQLite JSON1 + Drizzle's `mode: 'json'`) avoid a table per primitive shape.
- Composite primary keys on join-ish tables avoid meaningless surrogate ids.
- `hostTokenHash` stored hashed so a DB backup doesn't hand out live edit access to an open game.
- `upperBonusThreshold` / `upperBonusAmount` live on `game_modes` so each mode configures its own bonus rule (Normal: 63/50; Family: 84/50; Giant: 189/200).
- **Category rows are not deduplicated by primitive+params, and sharing a row across modes is optional, never required — but when only the *name* differs, use `gameModeCategories.labelOverride` instead of a separate row.** `house` (Normal/Family) and Giant's "Lillemor" are the same `two_groups_sizes({sizeA:3, sizeB:2})`, same description, same everything except what it's called — that's one category row, referenced by both, with Giant's `game_mode_categories` link setting `labelOverride: "Lillemor"`. Same for `lille`/"Lav", `stor`/"Høj", `royal`/"Cameron". Separate rows are still the right call when something *other* than the name differs (different `params`, different `description`, etc.) — the override only covers "identical in every way except display name."
- **`sessionCategories` vs. `gameModeCategories`**: `gameModeCategories` is just the default template per built-in mode, used to pre-populate the picker when starting a new game. `sessionCategories` is the resolved, locked-in category list for one specific session — copied from the mode's defaults at creation time, with any per-session add/remove tweaks already applied. This is what actually drives the scorecard, not `gameModeCategories`. See "Per-session category tweaks" below for why this exists as its own table instead of being derived on the fly.

---

## Scoring engine

**Split**: scoring *logic* lives in code as a fixed catalog of pure, unit-tested primitive functions. Scoring *configuration* (which categories, in what order, for which mode, with what params) lives in the DB. This avoids storing executable logic as data (an eval security hole or a bespoke DSL — overkill for this app) while still making "add a mode" a data operation in the common case.

**Adding Giant later** = insert a `game_modes` row + `categories`/`game_mode_categories` rows for anything that reuses an existing primitive — no code change, no redeploy. In practice, mapping Giant's full ruleset onto the primitives already needed for Normal/Family required exactly **one** genuinely new primitive (`straight_plus_extra`, for the Claus/Knold/Tot/Kaptajn Vom family) — everything else in Giant's 30+ categories reuses the same primitives Normal/Family already need, just with different params. Good validation that this split holds up even for a much more complex mode.

**Upper section bonus**: derived value, not a primitive — `sum(upper category scores) ≥ mode.upperBonusThreshold`. This is what naturally produces "borrowing" behavior (a surplus in one number covers a deficit in another) without any special redistribution logic, since it's one sum compared against one threshold.

**Yatzy bonus**: self-contained in the single `yatzy` category/primitive, params `{ flatBonus, includeEyesBonus }`. No cross-turn state — evaluated once, same as any other category. No stacking bonus for multiple Yatzys. `includeEyesBonus` is false for all three built-in modes but stays available per-category for future custom modes.

**Primitive catalog** — eight primitives cover all three built-in modes, none of them mode-exclusive except `straight_plus_extra`:

- `sum_of_face(face)` — Ones–Sixes, all modes.
- `n_of_a_kind_sum(requiredCount)` — exactly `requiredCount` dice of the best matching face × face value (not "all matching dice," confirmed). Covers Normal/Family's 3/4-of-a-kind and Giant's 3–11-of-a-kind — one primitive, all three modes.
- `n_groups_of_size(groups, size)` — sum of `groups × size` dice across that many distinct faces, using the highest-value qualifying faces. `size: 2` covers every "pairs" category (Normal's 1/2 Pair, Family's 1/2/3 Pairs, Giant's 1–6 Pairs) — pairs are just this primitive's `size=2` case, not a separate primitive — and other sizes cover Family's "2×3 of the same" and Giant's 2×/3× categories.
- `two_groups_sizes(sizeA, sizeB)` — sum of `sizeA + sizeB` dice across two distinct faces. Covers Normal/Family's House **and** all ten of Giant's named combos (Lillemor…Jens Lyn) — one primitive instead of treating House as a special case.
- `straight(low, high, fixedScore)` — fixed score if the roll contains at least one of each face in range, else 0; only needs to check presence, not exact roll length, so it already works whether the mode's dice count exactly matches the range (Normal/Family) or the range is a subset of a much bigger roll (Giant's Lav/Høj/Cameron). Covers every straight in every mode, including Family's Royal and Giant's Cameron (both 1-6).
- `straight_plus_extra(straightLow, straightHigh, extraFace, extraCount, fixedScore)` — the one Giant-only primitive: Lille Claus / Store Claus / Knold / Tot / Kaptajn Vom.
- `chance()` — sum of all dice, dice-count-agnostic, all modes.
- `yatzy(dice, { flatBonus, includeEyesBonus, requiredCount })` — flat bonus if some face's count === `requiredCount`; `requiredCount` is passed explicitly from `mode.diceCount` rather than inferred from `dice.length`, since the dice-input UI may hand primitives a trimmed, category-relevant array rather than the full physical roll (see "Dice-input UI design" open item) — `dice.length` can't be trusted to equal the mode's dice count.

**Default labels**: each primitive is paired with an optional default-label generator (`params → string`), e.g. `two_groups_sizes` defaults to `"{sizeA}+{sizeB} of a Kind"`, `straight` defaults to `"Straight {low}-{high}"`. A category row's stored `label` is an override — if left unset, the UI falls back to the primitive's generated default from that row's `params`. This means most categories (especially future custom-mode ones) never need a hand-written label at all, and the flavorful/named ones (House, Lillemor, Lav, Yatzy, etc.) just set `label` explicitly on their own row.

**`exampleDice` stores only the meaningful/matching dice, no filler** — e.g. `[6,6,6]` for "Three of a Kind," not padded out to any particular dice count. The tooltip UI pads it out to whichever mode's actual dice count it's currently being shown for (5/6/12), using arbitrary non-matching filler, at render time. This is what keeps a category row shareable across modes despite different dice counts — the visual always matches the mode you're looking at without needing separate stored rows per mode. One primitive is the exception: `yatzy` needs every die to match, so its padding rule is "repeat the matching value," not "add arbitrary filler." This applies to every primitive **except** `sum_of_face` — see below.

**Upper section (`sum_of_face`) is a special case, both for the text hint and the visual example.** Unlike the other primitives, its "required count" isn't in the category's own `params` at all — it comes from the *mode's* bonus threshold (`requiredCount = mode.upperBonusThreshold / 21`: 3 for Normal, 4 for Family, 9 for Giant), the same number the delta-display cells already compute. Because that number is mode-dependent and only knowable at render time, the tooltip doesn't use a stored `exampleDice` for these categories at all — it synthesizes the *entire* example live from `(mode, category.params.face)`: `requiredCount` dice showing `params.face`, padded with filler to `mode.diceCount`. Ones–Sixes store `exampleDice: null` for exactly this reason — there's nothing meaningful to store, so the column honestly reflects that instead of holding a placeholder value nothing reads. The tooltip also needs mode context for this to work even outside an active game, since it's shown during mode selection too, before any session/delta-display exists to fall back on.

---

## tRPC router shape

**`catalog`** (read-only, rarely changes — long Query `staleTime`):
- `listGameModes()`
- `getGameMode(id)` → categories in order with label/description/example dice

**`session`**:
- `create({ gameModeId, playerNames[] })` → mutation → `{ code, hostToken }`
- `get({ code })` → query, full current state (initial load / reconnect)
- `onUpdate({ code })` → **subscription**, emits full session state on every change
- `submitScore({ code, hostToken, playerId, categoryId, value })` → mutation, host-only
- `addPlayer` / `removePlayer` / `renamePlayer` → mutation, host-only
- `endGame({ code, hostToken })` → mutation, host-only, stamps `sessions.finishedAt`. Exact trigger conditions (auto-detected when every category/player combo has a score vs. an explicit host action to stop early) still TBD, but the procedure and column are the same regardless — just deciding what calls it and when.

Host-only procedures go through a `hostProcedure` middleware that checks the supplied `hostToken` against the session row and throws `UNAUTHORIZED` on mismatch. `onUpdate` needs no token — readable by anyone with the code.

---

## Project structure

```
/apps
  /web              Vite + Svelte SPA
    src/
      routes/         route-level components
      lib/
        api/           tRPC client + Query client setup
        components/     ScoreGrid (TanStack Table), CategoryTooltip, PlayerCard, DiceInput
        stores/          small local UI state (theme, per-session hostToken map)
  /server           Fastify + tRPC
    src/
      routers/        catalog.ts, session.ts, index.ts (appRouter)
      db/
        schema.ts       (drizzle schema)
        seed.ts
        client.ts
      scoring/
        primitives.ts   pure scoring functions
        primitives.test.ts
      ws/
        hub.ts          per-session pub/sub, used by the onUpdate subscription
      index.ts          Fastify bootstrap: tRPC plugin, static file serving for /apps/web build output
Dockerfile
docker-compose.yml
pnpm-workspace.yaml
```

Routes: `/` (create game), `/s/:code/host` (host control, gated by matching `hostToken` in `localStorage`), `/s/:code/view` (pick your player), `/s/:code/view/:playerId` (companion scorecard).

---

## Build order

0. Repo setup: `git init`, pnpm workspace (`pnpm-workspace.yaml` pointing at `apps/*`), `apps/web` and `apps/server` package.json + tsconfig each, root `.gitignore`.
1. Scoring primitives + full unit test suite (Vitest) — pure functions, no DB/server yet.
2. SQLite schema (Drizzle) + seed script for **all three built-in modes** (Normal, Family, and Giant — done together rather than deferring Giant, since the full category/primitive mapping was already worked out during planning). Confirmed no new primitives were needed beyond `straight_plus_extra`, matching the original extensibility goal.
3. Fastify + tRPC server: routers, WS hub, wired to SQLite.
4. Svelte SPA prototype: create game, add players, pick mode, enter dice → auto-score, live via subscription from day one.
5. Companion view (session code/QR join, pick player, read-only).
6. Hide/reveal totals toggle.
7. Category info tooltips (from DB `description`/`example_dice`).
8. Per-session category tweak UI at game creation (add/remove categories from the chosen mode, one-off, writes the resolved list to `sessionCategories` — not a saved mode) — bring in TanStack Form here.
9. PWA manifest/service worker polish + Dockerfile + docker-compose for self-hosting.

Backlog (post-v1): end-of-game celebration screen + podium/standings; game history / stats view (see Product/UX decisions — needs no schema changes when it happens).

---

## Open items (small, non-blocking)

- Dice-input UI design (how a roll gets entered before scoring a category) — resolved principle: input should be **category-aware**, not a universal "tap all N dice" grid. Since dice values are never persisted (only the computed `scores.value` is stored), the UI only needs to collect enough to drive the selected category's specific primitive (e.g. a "which face, how many" picker for n-of-a-kind/pairs/group categories, a straight checklist, a single face picker for Yatzy) rather than requiring every one of the 12 dice to be entered individually for Giant. Exact widget design per primitive shape still TBD.
- Session short-code generation scheme (e.g. word-pair like "BEAR-217" vs random) and QR generation library.
- Cross-out display symbol (plain `0`, a dash, or something else).
- Tooltip copy (description + example dice) for every category across all three modes — the scoring rules and point values are now fully settled (source: `5-dice.txt`, `6-dice.txt`, `giant.txt`), just the explanatory text/examples are left to write during seeding.
- Category `id`/slug naming for the seed data, including how to handle Giant's Danish names (e.g. keep "Lillemor" etc. as the display label — probably worth keeping, it's charming and specific — vs. a plain English slug for the internal `id`).
