# UpgradeChess — Improvement Plan & Application Design

> A two-part document. **Part A** is a practical training plan you can follow today on any phone or desktop using Lichess / Chess.com. **Part B** is the specification for *UpgradeChess*, a React + TypeScript web app (installable PWA for mobile) that turns that plan into a guided, point-based learning path with rating reflection.

---

## Part A — The Improvement Plan

### A1. Principles that actually move a rating

1. **Tactics decide most games below ~1800.** Daily, deliberate puzzle work is the single highest-return habit.
2. **Play slow enough to think.** Rapid 15+10 (or 10+5 minimum) is the training time control. Blitz/bullet is for fun, not for improvement.
3. **Review every loss.** 10 minutes of honest review per game beats 3 more games.
4. **One repertoire, learned shallowly and widely.** Know the *ideas* and first 6–10 moves of a few openings; don't memorise 25-move lines.
5. **Endgames are the cheapest rating points.** A handful of theoretical endings (K+P, Lucena, Philidor) win dozens of half-points a year.
6. **Measure.** Track puzzle rating, rapid rating and "blunders per game" weekly. Expect plateaus — they are normal.

### A2. Where are you now? (self-assessment, 45 minutes)

| Test | How | What it tells you |
|---|---|---|
| Tactics baseline | 30 min of Lichess Puzzles (rated) or Chess.com Puzzles | Puzzle rating ≈ your calculation ceiling |
| Play baseline | 3 rapid games 15+10, then run Lichess "Computer analysis" | Blunders/mistakes per game, phase where you lose |
| Endgame baseline | Lichess Practice → "Checkmate patterns", "Pawn endgames" | Which theoretical endings you can't yet convert |
| Opening baseline | Open Lichess "Opening Explorer" on your own games (Insights) | Where you leave book early; poor-scoring lines |

Place yourself in a **band** (rapid rating on Lichess; Chess.com is usually ~150–300 lower at club level):

| Band | Lichess rapid | Focus |
|---|---|---|
| Foundation | < 1200 | Board vision, hanging pieces, 1-move tactics, basic mates, opening principles |
| Club | 1200–1600 | 2–3 move tactics, simple plans, pawn structure basics, K+P & rook endings |
| Strong club | 1600–2000 | Calculation depth, prophylaxis, piece activity, theoretical endings, real repertoire |
| Expert | 2000+ | Deep opening prep, positional nuance, complex endings, engine-assisted self-analysis |

### A3. Weekly template (≈ 6–8 hours; scale up/down)

| Day | Desktop or mobile | Activity |
|---|---|---|
| Mon | Mobile | 20 min puzzles (rated) + 10 min "Puzzle Streak" |
| Tue | Desktop | 1 rapid game 15+10 → full review (no engine first, then engine) |
| Wed | Mobile | 15 min puzzles + 15 min opening drill (Lichess study / Chessable) |
| Thu | Desktop | 30 min endgame study (Lichess Practice / book) + 10 min puzzles |
| Fri | Mobile | 20 min puzzles by **theme** (your weakest motif) |
| Sat | Desktop | 2 rapid games → review + one annotated master game |
| Sun | Either | Weekly review: log ratings, blunder count, pick next week's theme. Rest. |

**Daily micro-habit** (bad days): 10 puzzles + 1 endgame position. Never zero.

### A4. Learning path by phase of the game

#### Openings — a compact repertoire to learn *ideas first*
Pick **one** line per slot; stay with it for at least 3 months.

| Slot | Beginner-friendly | Ambitious alternative | Key ideas to know |
|---|---|---|---|
| White 1st move | **1.e4 → Italian Game** (Giuoco Piano, c3/d3 setups) | Scotch, or 1.d4 Queen's Gambit | Fast development, castle early, d4 break, Ng5/Bxf7 tricks to *avoid* falling for |
| White alt system | London System (1.d4, Bf4) | Catalan | Solid triangle c3-d4-e3, Bd3/Ne5 kingside plans |
| Black vs 1.e4 | **Caro-Kann** (…c6, …d5) | 1…e5 (Two Knights / Italian) or Sicilian (Accelerated Dragon) | Solid structure, light-square bishop outside chain, minority play |
| Black vs 1.d4 | **Queen's Gambit Declined** or Slav | King's Indian / Nimzo-Indian | …c5/…e5 breaks, never leave the c8 bishop buried |
| Black vs others (c4, Nf3) | …e5 or …c5 "mirror" setups | — | Transpose to what you know |

**How to drill:** build a Lichess Study per line (10 moves + 3 typical plans) → drill with spaced repetition (Chessable course or the app's opening trainer) → check the Opening Explorer for what *your* opponents actually play at your rating.

#### Middlegame — tactics
Master these motifs in order (each gets a themed puzzle week):
1. Hanging pieces & counting 2. Forks 3. Pins & skewers 4. Discovered / double check 5. Back-rank mates & mating nets 6. Removing the defender / deflection / decoy 7. Overloading & interference 8. Zwischenzug 9. Trapped pieces 10. X-ray & clearance 11. Sacrifices on f7/h7 (Greek gift) 12. Promotion tactics

**Methods:** daily rated puzzles (quality over quantity: *calculate fully before moving*), the **Woodpecker method** (solve the same 300–500 puzzles in repeated, faster cycles), Lichess Puzzle Storm / Chess.com Puzzle Rush for pattern speed once accuracy is ≥ 80 %.

#### Middlegame — strategy
Study in this order: piece activity and development → pawn structure (isolated, doubled, backward, chains, majorities) → open files & 7th rank → outposts and good/bad bishops → space and the bishop pair → weak squares & colour complexes → prophylaxis and "what does my opponent want?" → planning from the pawn structure → king safety & attacking with pawn storms.

**Methods:** annotated master games (Chernev *Logical Chess: Move by Move*, Seirawan *Winning Chess Strategies*), "guess the move" on master games, Lichess "Practice" positional drills.

#### Endgames — theoretical set (in order of frequency)
1. Basic mates: K+Q, K+R (and K+2B for completeness) 2. King + pawn: opposition, square of the pawn, key squares, outside passed pawn 3. Rook endings: Lucena (bridge), Philidor (3rd-rank defence), rook behind passed pawn, active king/rook, Vancura 4. Queen vs pawn on 7th 5. Minor-piece endings: bishop vs knight, same/opposite colour bishops, wrong-rook-pawn draw 6. Practical principles: activate king, create passed pawn, don't rush, "two weaknesses".

**Resources:** Lichess Practice (free, interactive), Silman *Complete Endgame Course* (organised by rating!), de la Villa *100 Endgames You Must Know*, Lichess tablebase for checking.

#### Game review routine (the part most people skip)
1. Replay the game **without** engine; mark the 3 moments you were unsure. 2. Write your plan at each critical moment. 3. Now run engine analysis; compare. 4. Classify each error: *tactic missed / opening unknown / plan wrong / time trouble / endgame technique*. 5. Log the category. Your weekly theme is the most frequent category.

### A5. Where to learn (what each platform is best at)

| Platform | Best for | Free? |
|---|---|---|
| **Lichess** | Puzzles (themed, streak, storm), Practice (endgames/tactics), Studies, Opening Explorer, Insights, free engine analysis, clean API | Yes, fully |
| **Chess.com** | Lessons (structured video courses), Puzzle Rush, Game Review with explanations, Drills, big player pool | Freemium |
| **Lucas Chess** (desktop, free) — likely what "Lotus chess" refers to | Graded play vs engines, training positions, opening trainer, tactics trainer, offline | Yes |
| Chessable | Spaced-repetition opening/endgame courses ("MoveTrainer") | Freemium |
| ChessTempo | Rated tactics with mistake tracking, endgame trainer | Freemium |
| Aimchess | Weakness analysis of your games, rating goals | Freemium |
| YouTube | Naroditsky speedruns (explained thinking), John Bartholomew "Climbing the Rating Ladder", Chessbrah "Building Habits", Hanging Pawns (openings) | Yes |
| Books | Bain *Chess Tactics for Students*; Chernev *Logical Chess*; Silman *Endgame Course*; Seirawan *Winning Chess* series; *The Woodpecker Method* | — |

### A6. 12-week starter cycle

| Weeks | Theme | Targets |
|---|---|---|
| 1–2 | Baseline + hanging pieces, forks, basic mates, K+P opposition | Puzzle accuracy ≥ 70 %; 0 one-move blunders in 3 games |
| 3–4 | Pins/skewers/discovered attacks; opening repertoire v1 (first 6 moves each) | Reach book move 6 in 80 % of games |
| 5–6 | Back-rank & mating nets; rook endings (Lucena, Philidor) | Convert K+P and Lucena vs engine 5/5 |
| 7–8 | Deflection/decoy/overload; pawn-structure planning | Annotate 4 own games with plans |
| 9–10 | Calculation depth (3-move puzzles, Woodpecker cycle 1) | Puzzle rating +100 |
| 11–12 | Consolidation: Woodpecker cycle 2, opening v2 (10 moves), tournament week | Rapid rating +50–100; log reviewed |

---

## Part B — UpgradeChess Application Specification

### B1. Product vision
A fast, offline-capable chess training app that gives every player a **personalised learning path** (openings → tactics → strategy → endgames → game review), rewards consistent practice with **points, levels, streaks and badges**, and **reflects skill** through an internal rating plus imported Lichess / Chess.com ratings so progress is visible and honest.

**Users:** adult improvers 600–2000; primary device mobile (commute puzzles), secondary desktop (study, game review).
**Non-goals (v1):** live multiplayer server, payments, native app-store builds (PWA first; Capacitor later).

### B2. Core features

1. **Onboarding & assessment** — 15 calibrated puzzles (Glicko-2), 3 endgame conversions, optional Lichess/Chess.com username → assigns a *band* and seeds the path.
2. **Learning Path** — a tree of *Tracks → Modules → Lessons → Drills*. Lessons are interactive (board + text + "your move" checkpoints). Mastery unlocks next nodes; the path adapts to weakest categories from puzzle & game-review data.
3. **Tactics trainer** — rated puzzles from the Lichess puzzle DB (CC0); themed sets, Streak mode, Storm mode, Woodpecker sets; internal Glicko-2 puzzle rating.
4. **Opening trainer** — repertoire as move trees (PGN import / built-in repertoires); spaced repetition (SM-2) on each position; "what do opponents at my rating play?" via Lichess Explorer.
5. **Endgame trainer** — curated theoretical positions played out vs Stockfish (WASM, web worker) with tablebase verification (Lichess tablebase API) and hints.
6. **Game review** — import games (Lichess/Chess.com public APIs or PGN paste), local Stockfish evaluation, blunder/mistake classification, "guess the move", error-category logging → feeds the path.
7. **Play vs engine** — graded engine levels (skill 1–20, limit strength), time controls, post-game review. Offline.
8. **Progress & rating reflection** — dashboard: internal puzzle rating, imported platform ratings with history charts, blunders/game trend, category heatmap, XP, level, streak, badges, weekly goals.
9. **Library** — glossary, motif encyclopaedia (with interactive examples), annotated master games, curated external links (Lichess studies, YouTube, books).
10. **Offline-first PWA** — installable on mobile; puzzles, lessons and engine work offline; sync to cloud when online (optional account).

### B3. Points, levels & rating reflection

**XP rules (tunable in `config/scoring.ts`):**

| Activity | XP | Notes |
|---|---|---|
| Puzzle solved (rated) | 10 + difficulty bonus (0–15) | First-try only; hints halve XP |
| Puzzle failed | 2 | Rewards attempt; no streak credit |
| Themed set completed (10/10 ≥ 80 %) | 60 | Unlocks motif badge progress |
| Lesson completed | 40 | Checkpoints must be passed |
| Drill mastered (3 clean reps over 3 days) | 80 | Spaced repetition |
| Opening line reviewed (SRS due card) | 5 per position | Max 100/day |
| Endgame converted vs engine | 50 | First time; 15 on repeat |
| Own game reviewed & categorised | 70 | Requires ≥ 3 annotations |
| Daily goal hit | 30 | Default goal: 15 puzzles + 1 lesson/drill |
| Streak milestones | 7d: 100, 30d: 500, 100d: 2000 | Streak freeze: 1/week earned |

**Levels:** XP thresholds grow ~1.35× per level (Level 1 = 0, L2 = 200, L3 = 470 …). Level titles borrow chess vernacular: *Pawn → Knight → Bishop → Rook → Queen → King → Grandmaster path*.

**Badges:** motif mastery (e.g. "Fork Master": 200 fork puzzles ≥ 85 %), endgame set completion, "Iron Review" (20 games reviewed), consistency (streaks), repertoire depth.

**Rating reflection:**
- **Internal tactics rating** — Glicko-2 (puzzles carry Lichess ratings; player rating updates per attempt).
- **Imported ratings** — Lichess `perfs` (bullet/blitz/rapid/classical/puzzle) via `GET /api/user/{u}` and `/api/user/{u}/rating-history`; Chess.com via `GET https://api.chess.com/pub/player/{u}/stats`. Polled daily; shown as sparklines and 90-day trends.
- **Skill estimate** — a transparent composite card: tactics rating, play rating (imported), endgame mastery %, opening mastery % — *not* a fake single number; each component shows "what moves this".
- **Goals** — user sets a target (e.g. "Lichess rapid 1500 by November"); dashboard shows trajectory vs required slope and recommends where the path should weight effort.

### B4. Architecture

**Stack**
- Vite + React 18 + TypeScript (strict), React Router (lazy routes)
- State: Zustand (UI/session), TanStack Query (server/API caching), Dexie (IndexedDB) for offline data
- Chess: `chess.js` (rules/PGN/FEN), `chessops` (Lichess TS utils, optional), `react-chessboard` (or Chessground wrapper) for the board
- Engine: Stockfish WASM (multi-thread build with SharedArrayBuffer where COOP/COEP headers allow; single-thread fallback) in a dedicated Web Worker; UCI wrapper with cancellable evaluations
- PWA: `vite-plugin-pwa` (Workbox) — precache app shell, lessons, starter puzzle pack, engine WASM; runtime cache for API calls
- Rating/SRS: `glicko2` package (or in-house), SM-2 implementation
- Charts: Recharts (lazy-loaded) for rating history/heatmaps
- Styling: CSS Modules + CSS variables (light/dark, board themes); Radix primitives for accessible dialogs/menus
- Testing: Vitest + React Testing Library, Playwright (e2e on mobile viewport), MSW for API mocks
- Tooling: ESLint (typescript-eslint, react-hooks, jsx-a11y), Prettier, Husky + lint-staged, GitHub Actions CI, Lighthouse CI budget
- Optional backend (v2): Supabase (Postgres + Auth + RLS) or Firebase for cross-device sync & leaderboards; Lichess OAuth2 PKCE for deeper integration (user's own puzzle stream, studies)

**Folder structure**
```
src/
  app/              # router, providers, layout, theme
  features/
    onboarding/     # assessment wizard
    path/           # learning path tree, progression engine
    puzzles/        # trainer, modes (rated/themed/streak/storm/woodpecker)
    openings/       # repertoire trees, SRS, explorer
    endgames/       # curated positions, play-out vs engine, tablebase
    review/         # game import, analysis, classification
    play/           # vs engine
    progress/       # dashboard, ratings, goals, badges
    library/        # glossary, motifs, master games
  entities/         # domain types: Puzzle, Lesson, Repertoire, Game, Rating, XP
  shared/
    chess/          # chess.js wrappers, FEN/PGN utils, motif detection
    engine/         # stockfish worker + UCI client
    rating/         # glicko2, sm2
    api/            # lichess.ts, chesscom.ts (typed clients, zod schemas)
    db/             # dexie schema, migrations, sync queue
    ui/             # Board, MoveList, EvalBar, Clock, XPToast, ProgressRing
  config/           # scoring.ts, levels.ts, badges.ts, curriculum/*.json
  workers/          # stockfish.worker.ts, puzzle-index.worker.ts
public/
  engine/           # stockfish.wasm, .js
  data/             # starter puzzle pack (~5k), curriculum, repertoires
```

**Key data model (Dexie tables)**
```ts
users        { id, name, band, settings, createdAt }
xpEvents     { id, userId, type, xp, refId, ts }            // append-only; totals derived
progress     { userId+nodeId, status: 'locked'|'available'|'in-progress'|'mastered', score, attempts, lastAt }
puzzleAttempts { id, userId, puzzleId, rating, solved, timeMs, hints, theme[], ts }
playerRating { userId, kind: 'tactics'|'endgame', rating, rd, vol, updatedAt }
srsCards     { id, userId, repertoireId, fen, move, ease, interval, due }
games        { id, userId, source: 'lichess'|'chesscom'|'pgn', pgn, analysed, errors[] }
externalRatings { userId, platform, perf, rating, ts }
badges       { userId+badgeId, earnedAt, progress }
```

**Progression engine (pure functions, unit-tested)**
- `applyXp(event) → {total, level, leveledUp}`
- `unlock(path, progress) → available nodes` (prereqs + band gating)
- `nextRecommended(profile) → node[]` — weights: due SRS cards > weakest motif (last 100 attempts) > next path node > review backlog
- `updateGlicko(player, puzzle, result)`; `scheduleSm2(card, quality)`

### B5. External integrations (read-only, no keys needed)

| Source | Endpoint | Use |
|---|---|---|
| Lichess | `GET /api/user/{u}`, `/api/user/{u}/rating-history` | Ratings & history |
| Lichess | `GET /api/games/user/{u}?max=50&evals=true&opening=true` (NDJSON) | Game import |
| Lichess | `GET /api/puzzle/daily`, `/api/puzzle/next?angle={theme}` | Fresh puzzles online |
| Lichess | Puzzle DB CSV (database.lichess.org, CC0) | Bundled offline packs by theme/rating |
| Lichess | `https://explorer.lichess.ovh/lichess?fen=…&ratings=…` | Opening explorer by rating |
| Lichess | `https://tablebase.lichess.ovh/standard?fen=…` | Endgame verification |
| Lichess | `GET /api/cloud-eval?fen=…` | Cached evals (fallback to local engine) |
| Chess.com | `GET /pub/player/{u}/stats`, `/pub/player/{u}/games/archives` → `/games/{yyyy}/{mm}` | Ratings & game import |
| Chess.com | `GET /pub/puzzle`, `/pub/puzzle/random` | Daily puzzle |

Rate-limit respectfully (Lichess: serial requests, back off on 429); cache in IndexedDB; all clients typed with zod.

### B6. Performance budget
- First load ≤ 150 kB JS gzipped for the shell; every feature route lazy-loaded; engine WASM loaded on demand.
- LCP < 2.0 s on mid-range Android (Lighthouse mobile ≥ 90 in CI).
- Board renders at 60 fps: memoised squares, pointer events, no layout thrash; move list virtualised.
- Engine in a worker, evaluations cancellable, depth-limited per mode (puzzle check ≤ depth 12; review ≤ depth 18 or 1 s/move).
- Puzzle index searched in a worker; starter pack ~5k puzzles bundled, more packs downloaded per theme (~1 MB each).
- Offline: full app shell, engine, lessons and packs precached; sync queue for XP/progress.

### B7. UX outline
- **Home:** today's goal ring, streak, "Continue path" card, quick actions (Puzzles · Play · Review · Openings), rating tiles.
- **Path:** vertical map grouped by track; nodes show state (locked/available/mastered) and XP; tap → lesson with board + steps.
- **Puzzle screen:** board, theme (hidden until solved), timer, hint/explain, rating delta, XP toast; swipe for next.
- **Review screen:** board + eval bar + move list with coloured move quality; "what was the plan?" prompt before engine reveal; error-category chips.
- **Progress:** rating charts, motif heatmap, badges, goal trajectory.
- Mobile-first; board sized to min(viewport width, 70 vh); keyboard navigation on desktop; colour-blind-safe move-quality palette; dark mode.

### B8. Roadmap

| Milestone | Scope | Est. |
|---|---|---|
| M0 Scaffold | Vite/TS/ESLint/Vitest/PWA, board, chess.js, CI | 1 wk |
| M1 Tactics MVP | Starter puzzle pack, rated mode, Glicko-2, XP, streak, dashboard basics | 2 wks |
| M2 Learning Path | Curriculum JSON (Foundation + Club bands), lesson player, progression engine, badges | 3 wks |
| M3 Engine & Endgames | Stockfish worker, play vs engine, endgame trainer, tablebase | 2 wks |
| M4 Openings | Repertoire trees, SRS, explorer integration | 2 wks |
| M5 Review & Import | Lichess/Chess.com import, local analysis, error classification → path feedback | 2 wks |
| M6 Polish | Offline packs, performance budget, a11y, onboarding, goals | 2 wks |
| v2 | Accounts & sync (Supabase), Lichess OAuth, leaderboards, Capacitor builds | — |

### B9. Risks & mitigations
- **Content volume** — start with Lichess CC0 puzzles + public-domain master games; write lessons incrementally per band; keep curriculum as data, not code.
- **Engine on low-end phones** — single-thread WASM fallback, capped depth, cloud-eval first.
- **API changes/limits** — typed clients with zod, graceful degradation to offline data.
- **Gamification gaming** — XP only for first-try/clean solves, daily caps, rating (not XP) shown as the honest skill signal.

### B10. Definition of done (v1)
Installable PWA; 100 % of Foundation + Club path playable offline; rated tactics with Glicko-2; opening SRS; endgame trainer vs engine; game import & review from both platforms; dashboard with imported ratings; Lighthouse ≥ 90 mobile; ≥ 80 % unit coverage on progression/rating/SRS code; e2e smoke on mobile viewport.
