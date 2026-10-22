# Prompt: UpgradeChess UI upgrade (web + mobile)

Paste everything below the line into Claude Code (or another coding agent) opened at the root of the UpgradeChess repo.

---

You are upgrading the UI of **UpgradeChess**, a React 19 + TypeScript + Vite PWA for chess training (see `README.md`). The goal: make it look attractive, useful and professional on both desktop and phones, **without changing any features, routes, data logic or tests**. This is a visual and layout refactor of `src/index.css`, `src/app/Layout.tsx` and the page components' markup.

## Ground rules

- Keep every route, hook, Dexie query, store and test working. `npm test`, `npm run lint` and `npm run build` must pass at the end.
- Don't add UI libraries. Plain CSS in `src/index.css` with CSS custom properties, as now. You may split it into `src/styles/*.css` imported from `index.css` if it gets large.
- Replace every Unicode/emoji glyph used as an icon (⌂ ◬ ♞ ✎ ◔ ♔ ♙ ⚡ ★ ▤ ⚙ 🔥 ✓ ◀ ▶ ☰) with inline stroke SVG icons. Create `src/shared/ui/Icon.tsx`: `<Icon name="home" size={20} />`, 24×24 viewBox, `fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"`, `aria-hidden`. Needed names: home, target (puzzles), path, book (openings), zap (tricks), monitor (play), search (review), chart (progress), award (badges), library, sliders (settings), flame, check, x, bulb, chevron-left, chevron-right, arrow-right, flip, skip, grid (more), rook (brand mark).
- Accessibility: real `<button>`/`<a>`, `aria-label` on icon-only buttons, `aria-current="page"` on active nav, visible focus rings, touch targets ≥ 44px, text contrast ≥ 4.5:1 in both themes. Respect `prefers-reduced-motion` (already in the CSS — keep it).
- Keep the existing fonts (Newsreader for display, Source Sans 3 for body, JetBrains Mono for numbers).

## Design tokens (replace the current `:root` values)

Light:
```
--bg #F4F2EC; --surface #FFFFFF; --surface-2 #EEEBE2; --line #E1DCCF;
--ink #17201A; --muted #59645B; --ink-2 #3C4A3F;
--accent #2E5B39; --accent-ink #FFFFFF; --accent-soft #E2EBDD; --accent-soft-ink #1F4228;
--good #2A7041; --warn #94570B; --warn-soft #FBF4E4; --bad #B23B3B; --bad-soft #F6E1DE;
--side-bg #142019; --side-ink #E9E7DF; --side-muted #9DAA9F; --side-active #22352A; --side-accent #9CCB8A; --side-card #1C2B22;
--radius 16px; --radius-sm 10px;
--shadow 0 1px 2px rgba(20,32,25,.06), 0 8px 24px rgba(20,32,25,.06);
--shadow-board 0 1px 2px rgba(20,32,25,.08), 0 12px 32px rgba(20,32,25,.14);
```
Dark (both `:root[data-theme="dark"]` and the `prefers-color-scheme` block, as now):
```
--bg #111712; --surface #1A221C; --surface-2 #232D25; --line #2F3A31;
--ink #E9E7DF; --muted #A3AEA5; --ink-2 #C5CDC6;
--accent #9CCB8A; --accent-ink #10160F; --accent-soft #24362A; --accent-soft-ink #CFE6C5;
--good #8FC27E; --warn #E0AE57; --warn-soft #2E2615; --bad #E07A7A; --bad-soft #3A2020;
--side-bg #0C120E; --side-active #1C2B22; --side-card #152019;
```
Board highlight colours (all themes): last move `#EFE3A0` / `#C8BE6E` (light/dark square), selected `#F4D86B` / `#D8B84A`, hint ring `inset 0 0 0 4px #E8A93A`, move dots `rgba(20,32,25,.3)`.

Typography: page H1 40px desktop / 30px mobile (Newsreader 500, line-height 1.1); card H2 24–26px Newsreader; stat values 40px desktop / 30px mobile Newsreader; eyebrows 11–12px JetBrains Mono, uppercase, letter-spacing .12em, `--muted`; all numbers (ratings, XP, counts, timers) use mono or `font-variant-numeric: tabular-nums`.

Cards: `--surface`, 1px `--line` border, `--radius`, padding 20–24px desktop / 12–16px mobile, no left-border accents, no gradients except the progress ring's conic-gradient.

## App shell (`Layout.tsx`)

**Desktop (≥ 1024px): dark left sidebar**, replacing the top nav.
- Width 240px, `--side-bg`, full height, scrolls with the page (not `position: fixed`, not `100vh`). Main content is `max-width: 1120px`, padding `32px 40px 48px`.
- Top: brand (rook icon in a 34px rounded square filled `--side-accent`, then "UpgradeChess" in Newsreader 21px/600).
- Three groups, each with a mono uppercase label in `--side-muted`:
  - **Train:** Home, Puzzles (shows the tactics rating on the right in mono), Learning path, Openings (badge: due SRS cards when > 0), Gambits & tricks
  - **Play & review:** Play vs engine, Review games (badge: unreviewed games when > 0)
  - **You:** Progress, Badges, Library
- Nav item: 20px icon + label, padding 10px 12px, radius 10px; active = `--side-active` background, white text, icon in `--side-accent`.
- Pinned at the bottom: a level card (`Lv {level} · {title}`, `{xp} / {next} XP` in mono, 6px progress bar in `--side-accent`), then the Settings link with the sync status on the right (dot plus "Synced" / "Syncing" / "Sign in"), using the existing `useAuth` states.
- Badge counts come from the same live queries HomePage already uses (`db.srsCards` due count, unreviewed `db.games`). Move them into small hooks under `src/shared/hooks/` so Layout and HomePage share them.

**Tablet (820–1023px):** the same sidebar collapsed to a 72px icon rail (icons only, labels as `title`/`aria-label`, badges as dots).

**Mobile (< 820px):**
- No top bar on most pages. Each page starts with its own header (eyebrow + H1), with safe-area padding on top.
- Bottom tab bar: Home, Puzzles, Path, Review, More. Height 64px + `env(safe-area-inset-bottom)`, background `color-mix(in srgb, var(--surface) 96%, transparent)` with `backdrop-filter: blur(12px)`, 1px top border. Active tab: icon inside a 56×30 pill in `--accent-soft`, icon in `--accent`, label bold `--ink`. Review shows a red count badge.
- "More" opens the existing bottom sheet, restyled: 3-column grid of icon tiles (Play, Openings, Tricks, Progress, Badges, Library, Settings), with a drag handle and a 20px top radius.
- **Focus mode:** on puzzle/trainer routes (`/puzzles*`, `/path/:nodeId`, `/play`, `/tricks/:id`) hide the tab bar and show the page's own action bar instead (see Puzzle trainer). Use a `data-focus` attribute on `.shell` driven by `useLocation`.
- Keep the landscape-phone rules: board beside the panel, no tab bar.

## Home (`features/home/HomePage.tsx`)

Desktop, top to bottom:
1. **Header row:** eyebrow date ("Thursday 22 October"), H1 "Good evening, {name}." On the right: a streak chip (flame icon, `--warn` text, white pill with border, "12-day streak") and a primary button "Start today's session →" (44px tall, pill, `--accent`) linking to `/puzzles`.
2. **Row of two cards (flex-wrap, 2:1):**
   - *Today's session:* a 132px progress ring (conic-gradient, inner 108px circle showing "60%" in Newsreader plus "of today"), H2 "Today's session", one muted line ("About N minutes left to hit your daily goal"), then a checklist. Each row has a status circle (empty / in progress / filled with a check), a label and a mono count on the right: "Solve 10 rated puzzles 6 / 10", "One lesson or themed drill 0 / 1", "Review N repertoire cards" (crossed out when done). Use the existing `DAILY_GOAL` and `todayProgress`.
   - *Daily puzzle:* a non-interactive 168px mini board (from the first recommended or random pack puzzle; reuse `Board` in a read-only mode or render a static CSS grid), eyebrow "Daily puzzle", title "White to move and win material", "Rated 1612", and an outlined "Solve it" button.
3. **Four stat tiles** (`repeat(auto-fit, minmax(220px, 1fr))`), each a link:
   - Tactics rating: value, a green weekly delta, and a 40px sparkline from rating history (reuse `Sparkline`)
   - Lichess rapid: value, delta, sparkline from the existing snapshots
   - Games to review: count, a one-line summary of the latest game, "Review now →"
   - Repertoire cards: count due, when the next ones are due, "Browse repertoires →"
4. **Row of two (2:1):**
   - *Continue your path:* the first recommendation as a highlighted row (`--accent-soft` background, 44px icon tile in `--accent`, "Up next · Track · Band" eyebrow, bold title, the `reason` text, "+40 XP" pill); the next two as plain bordered rows.
   - *Weak spots:* accuracy by motif from the last 100 attempts (lowest four), each with a label, a mono %, and an 8px bar coloured by threshold (< 55% `--warn`, < 70% muted green, otherwise `--accent`); then a full-width secondary button "Drill {weakest motif}" linking to `/puzzles/{motif}`.

Mobile, in order: header (eyebrow, H1, streak chip on the right) → a dark "Today" card (`--side-bg`, 76px ring, "6 of 10 puzzles · 0 of 1 lesson", "Lv 7 Rook · 2,340 XP", and a full-width 50px button in `--side-accent`: "Continue · 4 puzzles left →") → the daily puzzle as a tappable row (104px mini board, text, chevron) → a 2×2 grid of stat tiles (Tactics, Lichess rapid, To review, Weak spot) → "Up next on your path" with one highlighted row. Leave 120px of bottom padding for the tab bar.

## Puzzle trainer (`PuzzleTrainer.tsx`, `PuzzlesPage.tsx`, also apply to Storm/Woodpecker/Lesson trainers)

Desktop:
- Header: breadcrumb "Home / Puzzles", H1 for the mode name. On the right, a segmented control (pill track in `--surface-2`, active segment white with a small shadow, 40px tall) for Rated · Themed · Streak · Storm · Woodpecker, with `role="tablist"`.
- Two columns (flex-wrap): board column up to 640px, side panel 320px or wider.
- **Board column:** an opponent strip above (colour swatch, side name, "· last move Qd8–c8"), then the board with 10px radius, `--shadow-board`, coordinates inside the squares (12px bold, in the opposite square colour), last-move highlight and hint ring. Below: a "You · White" strip on the left and 44px icon buttons on the right (Flip, Previous, Next) with `title`s showing the shortcuts.
- **Side panel cards:**
  1. *Status card:* the side-to-move swatch plus H2 "White to move", a one-line prompt, and pills ("Rated 1612", "Themes hidden until solved" — show the motif labels only after the puzzle is solved or failed). A hint callout row (bulb icon, `--warn-soft` background) appears once a hint is used: "Hint 1 of 2: … Hints halve the rating gain." Footer buttons: "Hint" / "Another hint" (secondary) and "Skip" (ghost). When solved: green "Solved" heading, rating-delta and XP pills, primary "Next puzzle →". When failed: red "Not quite", Retry and Show solution.
  2. *This session:* "+18 rating" in green mono at the top right; a row of 30px result squares (check on `--accent-soft`, ✕ on `--bad-soft`; use icons, not glyphs) plus a dashed empty slot for the current puzzle; then three mini stats: rating ± RD, accuracy, average time.
  3. *Daily goal* progress bar, plus a muted line of keyboard shortcuts: "H hint · F flip · ← → step · N next". Add the `H`, `F` and `N` handlers if they're missing; scope them to the trainer and ignore keypresses while an input is focused.

Mobile (focus mode, no tab bar):
- App bar: back chevron (44px) → mode title (Newsreader 22px) → a rating chip ("1584 +18" in mono).
- A horizontally scrolling chip row for modes (active chip filled `--ink` with white text).
- A compact status card: swatch, "White to move", "Find the best move · rated 1612", and an elapsed timer in mono on the right.
- The board **edge to edge** (100vw, no radius) with tap-to-move: the selected square is highlighted, legal-move dots appear, and captures get a ring.
- A session strip: "This session" plus "6 / 10 today", then a segmented bar of results (green or red segments, grey for remaining).
- A bottom action bar (5 columns, 64px + safe area, white, top border): Flip, Back, **Hint** (the centre button filled `--accent`, 52px, radius 14px), Forward, Skip. After a solve or fail, the centre button becomes "Next" (or "Retry").

## Shared primitives to restyle

`.btn` (pill, 44px min height; `primary`, `secondary`/default, `ghost`, `sm`), `.card`, `.pill` (+ good/warn/bad/accent), `.stat`, `.progress`, `.ring`, `.node` (path rows: 44px icon tile, highlighted variant), `.table`, `.toast` (above the tab bar on mobile), and form inputs (44px, radius 10px, focus ring in `--accent`). Apply the new primitives to every other page (Path, Openings, Tricks, Play, Review, GameReview, Progress, Badges, Library, Settings, Onboarding) so the whole app is consistent. Give each of those pages the same page header pattern (eyebrow + H1 + right-side actions).

## Board (`shared/ui/Board.tsx`)

Keep react-chessboard and the board-theme/piece-set settings. Add props or styles for: rounded outer corners with `--shadow-board` on desktop and none on mobile, last-move squares, the hint-square ring, legal-move dots and capture rings on selection (if not already present), and coordinates rendered inside the squares.

## Process

1. Read `README.md`, `src/index.css`, `src/app/Layout.tsx`, `HomePage.tsx`, `PuzzleTrainer.tsx`, `PuzzlesPage.tsx` and `shared/ui/Board.tsx` first.
2. Do it in this order and commit after each step (one commit per step, clear messages): tokens + primitives → Icon component → Layout (sidebar, icon rail, tab bar, More sheet, focus mode) → Home → Puzzle trainer → the remaining pages.
3. After each step, run `npm run build` and `npm test`. At the end, run `npm run preview` and `npm run e2e`, and use Playwright to take screenshots at 1440×900, 900×1000, 390×844 and 844×390 (landscape) of `/`, `/puzzles`, `/path`, `/review` and `/progress`, in light and dark themes. Check for horizontal scroll, clipped text, overlap with the tab bar, contrast and focus visibility, and fix anything you find.
4. Finish with a short summary of what changed, any new hooks or components, and any behaviour you had to touch.
