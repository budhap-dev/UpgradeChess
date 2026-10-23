# Mobile design upgrade plan

Source: the `design-mobile` agent audit, 2026-10-23 (finding numbers in brackets).
Workflow: one change at a time. Each step is implemented, then checked with build, lint and tests, then reviewed by you before the next step starts. Nothing is committed until you say so.

Status: ☐ todo · ◐ in progress · ☑ done (awaiting your review) · ✔ approved

## Phase 1: Quick wins (small, low risk)

| # | Change | Files | Status |
|---|---|---|---|
| 1 | First puzzle of a session uses your real rating, not the 1500 default [3] | `usePuzzleSession.ts` | ✔ PR #12 |
| 2 | Centre action button: Hint gets a quiet outlined style, and taps are ignored for 500ms after a result so a double-tap on Next can't use a hint [5] | `PuzzleTrainer.tsx`, `trainer.css` | ✔ PR #13 |
| 3 | Failed state: remove the duplicate buttons in the status card; the action bar becomes Flip · Back · **Retry** · Solution · Next [7] | `PuzzleTrainer.tsx`, `trainer.css` | ✔ PR #14 |
| 4 | Phone landscape works on wide phones (844–932px) and adds notch-side safe-area padding [2] | `shell.css`, `trainer.css` | ✔ PR #15 |
| 5 | Dark mode: the Home "Today" card gets visible contrast [8] | `home.css` | ☐ |
| 6 | Installed-app theme and background colours match the new palette [10, part] | `vite.config.ts`, `index.html` | ☐ |

## Phase 2: Puzzle screen layout

| # | Change | Files | Status |
|---|---|---|---|
| 7 | Board pinned under the app bar; a fixed-height feedback strip under the board swaps content per state, so the board never moves or slides under the action bar [1] | `trainer.css`, `PuzzleTrainer.tsx` | ☐ |
| 8 | Loading state: an empty, dimmed board instead of a fake start position; hide the 1500 chip until the rating is known [11] | `PuzzleTrainer.tsx`, `PuzzlesPage.tsx` | ☐ |
| 9 | After a solve, show only readable motif pills (drop raw tags like "crushing", "veryLong"); source game becomes a 44px "Open on Lichess" button [12] | `PuzzleTrainer.tsx` | ☐ |
| 10 | Promotion picker (Q/R/B/N) instead of auto-queen, so underpromotion puzzles are solvable [19] | `Board.tsx` | ☐ |
| 11 | Mode chips move into a "Rated ▾" switcher sheet; Storm gets a one-line HUD and only Flip + End run in its action bar [6] | `PuzzlesPage.tsx`, `StormMode.tsx`, `trainer.css` | ☐ |

## Phase 3: Navigation and other pages

| # | Change | Files | Status |
|---|---|---|---|
| 12 | Shared FocusBar (44px back button + title) and ActionBar; all board pages (lesson, play, trick, opening drill, game review, master game) use focus mode with a real back button [4] | `src/shared/ui/FocusBar.tsx`, `ActionBar.tsx`, `Layout.tsx`, feature pages | ☐ |
| 13 | Home: one-line greeting, larger daily-puzzle board, clearer weak-spot tile, "cards due" visible on phone with a badge on More [9] | `HomePage.tsx`, `home.css`, `Layout.tsx` | ☐ |
| 14 | Move lists become a horizontal 44px chip strip under the board on phone; larger breadcrumb/button tap targets [13] | `primitives.css` | ☐ |
| 15 | Same edge-to-edge board size on every phone board page; eval bar becomes a thin horizontal bar above the board [16] | `boards.css` | ☐ |
| 16 | Progress: Lichess ratings table becomes stacked rows on phone [15] | `ProgressPage.tsx` | ☐ |
| 17 | Small fixes: onboarding in focus mode; hide keyboard hints on touch; puzzle Back goes to Home; toasts at the top on focus routes; board flash for feedback (iOS has no vibration) [19] | various | ☐ |
| 18 | Swipe gestures: step moves on the strip under the board, next puzzle on the feedback strip, swipe down to close More [14] | `src/shared/hooks/useSwipe.ts`, pages | ☐ |

## Needs your decision (not started)

- **Play page setup sheet** [17]: move level/colour/rating scale into a "New game" sheet, defaulting the level near your Lichess rapid.
- **Path page** [18]: collapse finished/locked bands and offer "Place me by rating" to skip beginner bands?
- **App icons and offline fonts** [10, rest]: new icon artwork from the brand mark, self-hosted fonts, engine cached on demand instead of the 9 MB first download.
- **Hint in rated mode**: keep it as a main button (current plan: yes, but quieter), or move it to an overflow menu?
- **4th tab**: Review or Openings?
- **Auto-advance after a correct solve**: optional setting, or always manual Next? (Current plan: keep manual.)
- **Landscape**: do you train in landscape? (Step 4 is cheap either way.)
- **Puzzle supply**: about 1,000 offline puzzles at 1900+. Plan a bigger high-rated pack?
