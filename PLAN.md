# Yatzy Scoring App — Plan

A scorekeeping app to replace paper Yatzy sheets. No playing/simulating dice in-app — players roll physical dice, the app just calculates and tracks scores, with some QoL features paper can't do.

Self-hosted (Docker, no ongoing SaaS), used mainly on iPads (host) and iPhones (companions).

---

## Core features

- Score a category by selecting it and entering the final dice roll — no manual summing.
- Companion page: each player can check their own progress on their phone instead of asking the host.
- Totals hidden by default (no peeking at the running score), host can reveal. Always revealed once the game is finished.
- Multiple game modes (dice count + category set): Normal, Family, Giant. When starting a game, categories can be added/removed from the chosen mode as a one-off tweak for that game only — this is not a "save as a new mode" feature, there's no persistent custom-mode management. Next game, you're back to picking from the three defaults. **Deferred, not built** — see Build order.
- Click a category (in-game or while picking a mode) to see what roll it needs.
- No accounts anywhere. Host creates a game and enters players; companions join via a short URL/QR and pick themselves from that list.
- A companion can claim host duties on their own device (e.g. the original host's iPad dies mid-game) without losing the original host's access — see "Multi-device host access" below.
- Localized UI (English + Danish), switchable at runtime.

## Game modes

Sourced directly from `5-dice.txt` / `6-dice.txt` / `giant.txt`. Most categories are **sum-based** (computed from the dice actually rolled); a handful are **fixed** all-or-nothing values regardless of which faces make up the pattern — the straights, Giant's Claus/Knold/Tot/Kaptajn Vom family, and Yatzy.

**General sum rule** (confirmed): every sum-based pattern category — pairs, n-of-a-kind, the ×N groups, the size-A+size-B combos — scores using *exactly* the dice required to satisfy the pattern, never any extra matching dice beyond what's needed and never the rest of the roll. E.g. Giant's "3 of a kind" with five 6s rolled still scores `3×6=18`, not `5×6=30`. A category is *eligible* with "at least N" matching dice present, but only *scores* on exactly N of them.

- **Normal** — 5 dice. Upper bonus: minimum 63, bonus 50 (3 of each).
  Ones–Sixes · 1 Pair · 2 Pairs · 3 of a Kind · 4 of a Kind · House (3+2) · Lille (1-5 straight, fixed 15) · Stor (2-6 straight, fixed 20) · Chance · Yatzy (fixed 50)

- **Family** — 6 dice. Upper bonus: minimum 84, bonus 50 (4 of each).
  Ones–Sixes · 1/2/3 Pairs · 3 of a Kind · 4 of a Kind · 2×3 of the same (two distinct-face triples) · House (2+3) · Lille (fixed 15) · Stor (fixed 20) · Royal (1-6 straight, fixed 30) · Chance · Yatzy (fixed 50)

- **Giant** — 12 dice. Upper bonus: minimum 189, bonus 200 (9 of each).
  Ones–Sixes · 1–6 Pairs · 3–11 of a Kind · 2×3/2×4/2×5/2×6 of the same · 3×3/3×4 of the same · Lav (1-5 straight, fixed 15) · Høj (2-6 straight, fixed 20) · Cameron (1-6 straight, fixed 30) · Lille Claus (straight+2×6, fixed 50) · Store Claus (straight+3×6, fixed 75) · Knold (straight+4×6, fixed 100) · Tot (straight+5×6, fixed 150) · Kaptajn Vom (straight+6×6, fixed 200) · Lillemor (3+2) · Poeten (4+2) · Momsemor (5+2) · Skipperskræk (6+2) · Radiserne (4+3) · Basserne (5+3) · Gyldenspjæt (6+3) · Kasket Karl (5+4) · Klaus Kludder (6+4) · Jens Lyn (6+5) · Chance · Yatzy (fixed 250 + eyes bonus)

Normal's Yatzy is flat-only (50, no eyes bonus). Family (50) and Giant (250) both include the eyes-bonus variant. The toggle stays per-mode/per-category either way. See "Scoring engine" below.

Architecture supports adding a new mode (like Giant was) as close to a **data-only change** as possible: mapping Giant onto Normal/Family's primitives left exactly one genuinely new primitive needed (`straight_plus_extra`, for the Claus/Knold/Tot family) — everything else reused.

---

## Product/UX decisions

- **Companion flow**: scan QR/open short link → pick your name from the host-entered player list → live-updating, read-only view of your own progress. No claiming/locking a player identity — if two phones pick the same player, that's fine, matches how a physical sheet already has everything visible on one page. Companion view is scoped to that one player only — never shows other players' scores, and never shows any total/sum, ever. There is no "reveal" concept on companion at all.
- **What "hide totals" actually means**: individually entered category scores are always visible to whoever's allowed to see that row (yourself on companion, every player on host) — that's just tracking progress, never hidden. Totals/sums are simply never shown on companion, full stop — no flag, no reveal event, nothing to sync. On the host screen, seeing totals early is a plain local UI toggle (off by default, unsynced, resets on refresh, no DB column — pure personal convenience for the one device running the host view). The actual "reveal" moment — final standings/podium — happens once on the host screen when the game finishes (`sessions.finishedAt` set), not as a separate flag. Server always sends full data (including totals) to every client; hiding is purely a client-side rendering choice, never response filtering.
- **Late joiners**: explicitly out of scope for v1. The data model doesn't fight this if it comes up anyway (a player added mid-game just starts with a blank card), but no UX is being designed around it.
- **Typo fixes**: host can rename a player after the fact.
- **Cross-out / "no score"**: part of the normal per-category entry flow (the "Strike" button, not a separate button elsewhere), writes a real `0`. No separate flag distinguishes "chose to cross out" from "rolled and it scored zero" — every zero is rule-legitimate. **Resolved**: displayed as a dash (`-`), not a plain `0`, so a deliberate/computed zero reads clearly as "filled in" rather than "blank."
- **Upper section relative display**: each upper-section cell shows a signed delta relative to the per-face target needed for the bonus, not the raw score:
  ```
  delta = actualScore - (requiredCount × faceValue)
  requiredCount = mode.upperBonusThreshold / 21
  ```
  e.g. five 1s on Family → **+1**, three 6s → **-6**. Purely a display computation, no schema impact.
- **Bonus progress indicator**: running subtotal of the deltas filled in so far, shown near the upper section, so pace-to-bonus is visible at a glance.
- **Yatzy bonus**: flat bonus, per mode (Normal 50, Family 50, Giant 250), with an optional "extra points equal to eyes rolled" variant (`includeEyesBonus`) kept available per-mode for future custom modes even though none of the three built-in modes currently use it. No stacking bonus for multiple Yatzys in one game.
- **End-of-game celebration — built**: a `Standings` card (ranked list, standard competition ranking so ties share a rank, trophy icon for 1st) renders on the host screen once `sessions.finishedAt` is set, alongside a one-time `canvas-confetti` burst. The burst is gated on a `false → true` transition of "is this session finished" (tracked in a ref), not on the value simply being `true`, so it fires exactly once per game finishing rather than replaying on every reload or subscription push.
- **Game history — built**: `session.listFinished` returns every finished session with its players/categories/scores; the create-game screen shows it as a paginated list (10/page), each entry showing the winner(s) and final score via the same ranking helper (`rankPlayers`/`grandTotal`) the Standings card uses, linking through to `/s/$code/game` — viewable without a host token once a game is finished.
- **Multi-device host access — built, supersedes the original single-hash design**: host auth was originally a single `hostTokenHash` column on `sessions`. Changed to a separate `host_tokens` table (many tokens per session) so a companion device can claim host duties via `session.claimHost` — e.g. the original host's device dies or is put away mid-game — without invalidating the original token. No identity/permission distinction between tokens; any valid one is fully host-equivalent.
- **Resume sessions across reloads/devices — built**: `rememberedSessions.ts` reads the `yatzy:host:*` / `yatzy:player:*` `localStorage` keys already being written for auth purposes and surfaces them as a "continue where you left off" list on the create-game screen. Purely a client-side convenience — no new schema, and a stale/no-longer-valid entry (session deleted, player removed) quietly removes itself from the list.
- **Dice entry order — built**: dice are stored client-side as the ordered sequence of taps (`diceEntries: number[]`), not a per-face tally, so the modal displays dice in the order they were entered rather than always sorted low-to-high.
- **Dice entry guards — built**: the entry modal derives two constraints per category from its `params` at render time — a per-face cap (a single face can never be given more dice than that category could use, e.g. capped at 2 for Two Pairs) and a max-distinct-faces cap (can't spread dice across more faces than the category has groups for, e.g. capped at 2 distinct faces for House). This stops a host from entering a combination that's provably unscoreable for the selected category (e.g. four-of-a-kind for Two Pairs) before they ever hit Submit — the scoring primitives already reject bad shapes by construction (they'd just silently score `0`), this is purely a UX guard against discovering that the hard way.
- **Off-turn warning — built**: scoring any player out of turn order is, and remains, fully allowed (see `roundProgress` — the "current player" is only a hint). The entry modal shows a non-blocking, dimmed note when the selected player isn't the one considered "up next," to catch accidental mis-clicks without restricting legitimate out-of-order entry.
- **Backlog (not building now)**: per-session category tweaks (add/remove categories from a mode as a one-off for that game) — see Build order step 8. Not a priority right now.

---

## Architecture

- **Hosting**: 100% self-hosted, single Docker image, one container, one named volume for the SQLite file. No external/paid services. Served at `yatzy.mydomain.tld` behind an existing reverse proxy (TLS termination handled there — satisfies the PWA service worker's secure-context requirement for free). **Built** — multi-stage `Dockerfile` (deps → build → prod-deps → runtime, `node:26-alpine`, runs as the non-root `node` user), `docker-compose.yml`, and a GitHub Actions workflow (`build-push-image.yml`) that tests, builds multi-arch (amd64/arm64) images, pushes to `ghcr.io`, and deploys via Komodo on push to `main`. See README for local dev/deploy instructions.
- **Frontend**: Vite + **React** SPA (not SvelteKit — no SSR/content need). Originally planned as Svelte; the implementation switched to React partway through — everything below reflects the actual React stack, not the original Svelte plan. Installable PWA via `vite-plugin-pwa` — **built**.
- **Styling**: **Mantine** (`@mantine/core` + `@mantine/hooks`) — component library, not the originally-planned Tailwind + shadcn-svelte (that combination doesn't apply once the frontend is React).
- **Localization**: `react-i18next`, English + Danish locale files (`common` + `content` namespaces, the latter for game-mode/category copy sourced from the seed data). Not present in the original plan; added during the React build.
- **Client data/state**: TanStack **Query**, wired via the official `@trpc/react-query` adapter (`createTRPCReact`) — React does have a first-party integration, unlike the Svelte ecosystem the original plan sized this decision for, so the planned manual `createTRPCClient`-in-`queryFn` approach wasn't needed. TanStack **Router** for routing (see below). `@dnd-kit` (`core`/`sortable`/`utilities`) for drag-to-reorder players at game creation. **Not used**: TanStack Table (the categories × players grid is a hand-rolled Mantine `Table`, the dynamic category list didn't end up needing it) or TanStack Form (still no custom-mode builder to justify it).
- **tRPC ↔ Query wiring**: `trpc.createClient` with a `splitLink` — subscriptions over `wsLink` (WebSocket), everything else over `httpBatchLink`. Realtime design as planned: an in-memory per-session-code pub/sub hub in the single Node process; mutations write to SQLite then broadcast the full session state to that code's subscribers (state is small, so no diffing — just re-send the whole blob), implemented as a Node `EventEmitter`, `for await`-ing `events.on(emitter, eventName, { signal })` inside a tRPC v11 async-generator subscription.
- **Persistence**: SQLite + Drizzle ORM.
- **Routing**: **TanStack Router** (`@tanstack/react-router`) — not `svelte-spa-router` (Svelte-specific, doesn't apply to the React build). Typed routes via `createRoute`/`createRootRoute`/`createRouter`.
- **Auth model**: session creation returns an opaque `hostToken`, stored in the host's `localStorage`, required on host-only mutations via a tRPC middleware — as planned, except tokens now live in a `host_tokens` table (many valid tokens per session) rather than a single hash column on `sessions`, to support multi-device host reclaim (see Product/UX decisions). The session code/QR is still the only real access boundary — same trust model as a shared paper sheet.
- **DX tooling**: Biome for linting + formatting (single tool, no ESLint/Prettier). The original plan called out Biome's Svelte support specifically as the deciding factor; that reasoning no longer applies now that the frontend is React/TSX, where Biome's support is mature and uncontroversial. Bundling is Rolldown-powered for free via Vite 8+. The Tailwind-specific `biome.json` config note no longer applies (Mantine, not Tailwind).

---

## Data model (Drizzle / SQLite)

```ts
export const gameModes = sqliteTable('game_modes', {
  id: text('id').primaryKey(),                 // "normal" | "family" | "giant" | uuid for custom
  name: text('name').notNull(),
  description: text('description').notNull(),
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
  dice: text('dice', { mode: 'json' }).$type<number[]>(), // the dice actually submitted, in entry order; null for a Strike or a fixed-value (straight) category
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
}, (t) => ({ pk: primaryKey({ columns: [t.sessionCode, t.playerId, t.categoryId] }) }));

export const hostTokens = sqliteTable('host_tokens', {
  sessionCode: text('session_code').notNull().references(() => sessions.code),
  tokenHash: text('token_hash').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (t) => ({ pk: primaryKey({ columns: [t.sessionCode, t.tokenHash] }) }));
```

Notes:
- `params`/`exampleDice` as JSON columns (SQLite JSON1 + Drizzle's `mode: 'json'`) avoid a table per primitive shape.
- Composite primary keys on join-ish tables avoid meaningless surrogate ids.
- Host tokens are stored hashed, in their own table, so a DB backup doesn't hand out live edit access to an open game, and so more than one token can be valid for the same session (see "Multi-device host access" in Product/UX decisions) — this replaced the original single `sessions.hostTokenHash` column design.
- `scores.dice` is a later addition (not in the original plan, which assumed dice were never persisted — see "Dice-input UI design" under Open items) — stores exactly what the host submitted, in entry order, so it can be shown back on the score table or when reopening a cell to correct it.
- `upperBonusThreshold` / `upperBonusAmount` live on `game_modes` so each mode configures its own bonus rule (Normal: 63/50; Family: 84/50; Giant: 189/200).
- **Category rows are not deduplicated by primitive+params, and sharing a row across modes is optional, never required — but when only the *name* differs, use `gameModeCategories.labelOverride` instead of a separate row.** `house` (Normal/Family) and Giant's "Lillemor" are the same `two_groups_sizes({sizeA:3, sizeB:2})`, same description, same everything except what it's called — that's one category row, referenced by both, with Giant's `game_mode_categories` link setting `labelOverride: "Lillemor"`. Same for `lille`/"Lav", `stor`/"Høj", `royal`/"Cameron". Separate rows are still the right call when something *other* than the name differs (different `params`, different `description`, etc.) — the override only covers "identical in every way except display name."
- **`sessionCategories` vs. `gameModeCategories`**: `gameModeCategories` is just the default template per built-in mode, used to pre-populate the picker when starting a new game. `sessionCategories` is the resolved, locked-in category list for one specific session — copied from the mode's defaults at creation time, with any per-session add/remove tweaks already applied. This is what actually drives the scorecard, not `gameModeCategories`. See "Per-session category tweaks" below for why this exists as its own table instead of being derived on the fly.

---

## Scoring engine

**Split**: scoring *logic* lives in code as a fixed catalog of pure, unit-tested primitive functions. Scoring *configuration* (which categories, in what order, for which mode, with what params) lives in the DB. This avoids storing executable logic as data (an eval security hole or a bespoke DSL — overkill for this app) while still making "add a mode" a data operation in the common case.

**Adding Giant later** = insert a `game_modes` row + `categories`/`game_mode_categories` rows for anything that reuses an existing primitive — no code change, no redeploy. In practice, mapping Giant's full ruleset onto the primitives already needed for Normal/Family required exactly **one** genuinely new primitive (`straight_plus_extra`, for the Claus/Knold/Tot/Kaptajn Vom family) — everything else in Giant's 30+ categories reuses the same primitives Normal/Family already need, just with different params. Good validation that this split holds up even for a much more complex mode.

**Upper section bonus**: derived value, not a primitive — `sum(upper category scores) ≥ mode.upperBonusThreshold`. This is what naturally produces "borrowing" behavior (a surplus in one number covers a deficit in another) without any special redistribution logic, since it's one sum compared against one threshold.

**Yatzy bonus**: self-contained in the single `yatzy` category/primitive, params `{ flatBonus, includeEyesBonus }`. No cross-turn state — evaluated once, same as any other category. No stacking bonus for multiple Yatzys. `includeEyesBonus` is false for all three built-in modes but stays available per-category for future custom modes.

**Primitive catalog** — eight primitives cover all three built-in modes, none of them mode-exclusive except `straight_plus_extra`. Every primitive derives its own per-face counts from the raw dice array (never trusts a flat total), so combinations that can't legitimately score a category correctly resolve to `0` rather than being miscounted — validated by both the primitive unit tests and the client-side entry guards (see "Dice entry guards" in Product/UX decisions):

- `sum_of_face(face)` — Ones–Sixes, all modes.
- `n_of_a_kind_sum(requiredCount)` — exactly `requiredCount` dice of the best matching face × face value (not "all matching dice," confirmed). Covers Normal/Family's 3/4-of-a-kind and Giant's 3–11-of-a-kind — one primitive, all three modes.
- `n_groups_of_size(groups, size)` — sum of `groups × size` dice across that many distinct faces, using the highest-value qualifying faces. `size: 2` covers every "pairs" category (Normal's 1/2 Pair, Family's 1/2/3 Pairs, Giant's 1–6 Pairs) — pairs are just this primitive's `size=2` case, not a separate primitive — and other sizes cover Family's "2×3 of the same" and Giant's 2×/3× categories.
- `two_groups_sizes(sizeA, sizeB)` — sum of `sizeA + sizeB` dice across two distinct faces. Covers Normal/Family's House **and** all ten of Giant's named combos (Lillemor…Jens Lyn) — one primitive instead of treating House as a special case.
- `straight(low, high, fixedScore)` — fixed score if the roll contains at least one of each face in range, else 0; only needs to check presence, not exact roll length, so it already works whether the mode's dice count exactly matches the range (Normal/Family) or the range is a subset of a much bigger roll (Giant's Lav/Høj/Cameron). Covers every straight in every mode, including Family's Royal and Giant's Cameron (both 1-6).
- `straight_plus_extra(straightLow, straightHigh, extraFace, extraCount, fixedScore)` — the one Giant-only primitive: Lille Claus / Store Claus / Knold / Tot / Kaptajn Vom.
- `chance()` — sum of all dice, dice-count-agnostic, all modes.
- `yatzy(dice, { flatBonus, includeEyesBonus, requiredCount })` — flat bonus if some face's count === `requiredCount`; `requiredCount` is passed explicitly from `mode.diceCount` rather than inferred from `dice.length`, since the dice-input UI hands primitives a trimmed, category-relevant array rather than the full physical roll — `dice.length` can't be trusted to equal the mode's dice count.

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
- `previewScores({ code, diceCounts })` → query, computes what every category in the session *would* score for a given dice tally, without submitting — powers the live score preview in the entry modal.
- `submitScore({ code, hostToken, playerId, categoryId, value, dice? })` → mutation, host-only. `dice` (added after the original plan) persists the exact dice submitted, in entry order; omitted for a Strike or a fixed-value (straight) category.
- `addPlayer` / `removePlayer` / `renamePlayer` → mutation, host-only
- `endGame({ code, hostToken })` → mutation, host-only, stamps `sessions.finishedAt`.
- `listFinished()` → query, all finished sessions with players/categories/scores — **added after the original plan**, backs the game-history list.
- `claimHost({ code })` → mutation, issues a new valid `hostToken` for an existing session — **added after the original plan**, backs multi-device host reclaim. No auth required to call it (same trust model as the session code itself: anyone with the code/QR already has host-equivalent access via the "Become host" flow).

Host-only procedures go through a `hostProcedure` middleware that checks the supplied `hostToken` against the `host_tokens` table (any matching row for that session code is valid, not just one) and throws `UNAUTHORIZED` on mismatch. `onUpdate`, `listFinished`, and `claimHost` need no token — readable/claimable by anyone with the code.

---

## Project structure

```
/apps
  /web              Vite + React SPA
    src/
      Root.tsx        layout shell (locale switcher, home nav button)
      router.tsx       TanStack Router route tree
      routes/          route-level components: CreateGame, Host, View, PlayerView
      lib/
        api/            trpc client/react-query wiring (trpc.ts, trpc-client.ts, types.ts), useSessionState hook
        components/      ScoreTable (Mantine Table, category tooltips, per-player columns), DieFace, Standings,
                          InviteQr, SortablePlayerRow (dnd-kit)
        i18n/            react-i18next setup + en/da locale files (common + content namespaces)
        scoring.ts       client-side derived-value helpers (roundProgress, rankPlayers/grandTotal, targetDiceCount, etc.)
        rememberedSessions.ts   localStorage-backed "continue where you left off" list
        formatDate.ts     small date/time formatting helpers
  /server           Fastify + tRPC
    src/
      routers/        catalog.ts, session.ts, index.ts (appRouter)
      db/
        schema.ts       (drizzle schema)
        seed.ts
        db-client.ts
        drizzle/         generated migrations + snapshots
      scoring/
        primitives.ts   pure scoring functions
        primitives.test.ts
      ws-hub.ts        per-session pub/sub, used by the onUpdate subscription
      index.ts          Fastify bootstrap: tRPC plugin, static file serving for /apps/web build output
Dockerfile          multi-stage build (deps/build/prod-deps/runtime), runs as non-root "node" user
docker-compose.yml  single service + named volume for the SQLite file
.github/workflows/  build-push-image.yml — test, build multi-arch image, push to ghcr.io, deploy via Komodo
pnpm-workspace.yaml
```

Routes: `/` (create game, plus "continue" and history lists), `/s/:code/game` (host control, gated by matching `hostToken` in `localStorage` — renamed from the originally-planned `/s/:code/host` since this route now also displays a finished game's standings, not just active hosting), `/s/:code/view` (pick your player), `/s/:code/view/:playerId` (companion scorecard, with a "become host" option if no host token is present for that session).

---

## Build order

0. ✅ Repo setup: `git init`, pnpm workspace (`pnpm-workspace.yaml` pointing at `apps/*`), `apps/web` and `apps/server` package.json + tsconfig each, root `.gitignore`.
1. ✅ Scoring primitives + full unit test suite (Vitest) — pure functions, no DB/server yet.
2. ✅ SQLite schema (Drizzle) + seed script for all three built-in modes (Normal, Family, Giant). Confirmed no new primitives were needed beyond `straight_plus_extra`.
3. ✅ Fastify + tRPC server: routers, WS hub, wired to SQLite.
4. ✅ Frontend prototype: create game, add players, pick mode, enter dice → auto-score, live via subscription from day one. **Built in React, not the originally-planned Svelte** — see Architecture.
5. ✅ Companion view (session code/QR join, pick player, read-only).
6. ✅ Hide/reveal totals toggle.
7. ✅ Category info tooltips (from DB `description`/`example_dice`).
8. ⏸️ **Deferred, not a current priority** — Per-session category tweak UI at game creation (add/remove categories from the chosen mode, one-off, writes the resolved list to `sessionCategories` — not a saved mode).
9. ✅ PWA manifest/service worker (`vite-plugin-pwa`, iOS home-screen meta tags, manifest icon path fix). Dockerfile + docker-compose + CI build/push/deploy for self-hosting.

Also built, beyond the original build order:
- ✅ Multi-device host access (`host_tokens` table, `claimHost`) and "continue where you left off" / game history on the create-game screen.
- ✅ End-of-game celebration (Standings card + confetti) and game history — these were listed as backlog/"not building now" in the original plan and have since been built; see Product/UX decisions.
- ✅ Dice persisted per score submission (in entry order) and shown back on the score table / when reopening a cell — the original plan assumed dice were never persisted (see Open items below); that assumption changed.
- ✅ Category-aware dice entry guards (per-face cap + max-distinct-faces cap) so the entry UI can't produce a combination that's provably unscoreable for the selected category.
- ✅ Off-turn entry warning (non-blocking) in the host's scoring modal.
- ✅ Localization (English/Danish).
- ✅ Docker self-hosting: multi-stage `Dockerfile`, `docker-compose.yml`, and a GitHub Actions workflow that tests, builds multi-arch (amd64/arm64) images to `ghcr.io`, and deploys via Komodo over Tailscale on push to `main`.

---

## Open items (small, non-blocking)

- ✅ **Dice-input UI design** — resolved. Category-aware, not a universal "tap all N dice" grid: per-face steppers, capped per-category (see "Dice entry guards" in Product/UX decisions) so only a scoreable subset can be entered. **Supersedes the original plan's assumption that dice values are never persisted** — they now are (`scores.dice`, entry order preserved), so they can be shown back on the score table and pre-filled when reopening a cell to correct it.
- ✅ **Session short-code generation** — resolved as a random 6-digit numeric code (not the word-pair idea originally floated), regenerated on collision.
- ✅ **Cross-out display symbol** — resolved as a dash (`-`), see Product/UX decisions.
- ✅ **Tooltip copy** — description + example dice filled in for every category across all three modes.
- ✅ **Category `id`/slug naming** — resolved: plain English slugs for `id` (e.g. `three_of_a_kind`), Giant's Danish flavor names (Lillemor, Skipperskræk, etc.) kept as the display `label`/`labelOverride` rather than the slug.
