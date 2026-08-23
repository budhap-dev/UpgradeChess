# UpgradeChess

A fast, offline-capable chess training app — React 19 + TypeScript + Vite, installable as a PWA on phone or desktop.

**Plan & spec:** [docs/UpgradeChess-Plan.md](docs/UpgradeChess-Plan.md)

## What it does (v0.1)

| Area | Feature |
|---|---|
| **Onboarding** | Welcome wizard: connect accounts (live rating check), 10 calibration puzzles for the Glicko-2 rating, preferences, band summary with starting recommendations. Rerun from Settings. |
| **Puzzles** | Rated tactics with an internal **Glicko-2** rating, themed drills (17 motifs), **Streak**, **Storm** (3-minute sprint) and **Woodpecker** (repeat a fixed set in cycles) modes, hints, retry, solution replay. 3,200-puzzle offline pack sampled from the CC0 Lichess database + Lichess API when online. |
| **Learning path** | Tracks (tactics · endgames · openings · strategy) × bands (Foundation / Club / Strong club). Interactive lessons with "your move" checkpoints, themed-set drills judged from your puzzle history, endgame conversions vs engine, opening repertoires. Nodes unlock on prerequisites. |
| **Gambits & tricks** | 20 gambits, opening traps and quick tricks (Légal, Fried Liver, Traxler, Stafford, Englund, Blackburne Shilling, Elephant, Lasker, Noah's Ark, Siberian, Fishing Pole, Kieninger, Evans, Danish, Smith-Morra, King's Gambit, Vienna…) — step-through lines with commentary, how to avoid each, and a "Test me" task for XP. |
| **Openings** | Four built-in repertoires (Italian, London, Caro-Kann, QGD) as move trees; **SM-2 spaced repetition** per position; Lichess opening explorer ("what do others play?"). |
| **Review** | Import recent games from Lichess / Chess.com (or paste PGN), analyse locally with Stockfish, win-probability based blunder/mistake/inaccuracy marks, error **categories** (opening · tactic · plan · endgame), "guess the move" quiz at each mistake, mark reviewed for XP; aggregate error profile recommends the weekly theme. |
| **Play** | Stockfish 18 (WASM, web worker) at 7 graded levels; endgame trainer positions verified against the Lichess tablebase. |
| **Progress** | XP, levels (Pawn → Grandmaster), **36 badges**, daily goal, streaks with milestone bonuses, accuracy-by-motif heatmap, and **rating reflection**: live Lichess + Chess.com ratings (public APIs, no login), snapshotted daily for trend sparklines, with a plain-language reading of what to work on. |
| **Library** | Motif encyclopaedia, weekly training template, curated platforms/videos/books. |

All data is local (IndexedDB via Dexie). Export/reset from Settings.

## Run

```bash
npm install
npm run dev          # http://localhost:5173  (copies the Stockfish build into public/engine first)
npm test             # vitest: rating math, SRS, XP/streaks, puzzle conversion, curriculum integrity, progression
npm run build && npm run preview   # then: npm run e2e  (expects preview on :4199)
```

Optional:

```bash
npm run ratings -- <lichessUser> [chesscomUser]   # print ratings in the terminal
npm run puzzles:pack -- 3200 500000                 # rebuild public/data/puzzles.json from the CC0 dump (needs `zstd` CLI; streams, no full download)
```

## Structure

```
src/
  app/            router + layout
  config/         scoring.ts (XP rules), levels.ts, themes.ts (motifs)
  features/       home · puzzles (rated/themed/streak/storm/woodpecker) · path · openings · tricks · play · review · progress (+badges) · library · settings
  shared/
    api/          lichess.ts, chesscom.ts (zod-typed, read-only)
    chess/        puzzle conversion + move checking
    db/           Dexie schema, XP/streak logic
    engine/       UCI client for the Stockfish worker
    rating/       glicko2.ts, sm2.ts
    ui/           Board (drag + tap-to-move), Sparkline, Toast
scripts/          ratings.mjs, build-puzzle-pack.mjs, copy-engine.mjs
public/data/      offline puzzle pack (CC0, from Lichess)
```

## Credits

Puzzles: [Lichess puzzle database](https://database.lichess.org/#puzzles) (CC0). Engine: [Stockfish.js](https://github.com/nmrugg/stockfish.js) (GPLv3). Board: react-chessboard. Ratings: Lichess and Chess.com public APIs.
