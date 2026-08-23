import type { PathNode } from './types'

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

/** The learning path. Every FEN/solution here is validated by curriculum.test.ts. */
export const CURRICULUM: PathNode[] = [
  // ───────────── TACTICS · Foundation ─────────────
  {
    id: 't-hanging', track: 'tactics', band: 'foundation', kind: 'lesson', xp: 40,
    title: 'Counting and hanging pieces', blurb: 'The most common tactic at every level: a piece that is attacked and not defended.',
    steps: [
      { text: 'A piece is **hanging** when it is attacked and nobody defends it. Before every move ask two questions: *What did my opponent\'s last move attack?* and *What of mine is undefended?*', fen: START },
      { text: 'Counting: a piece attacked twice and defended once is also hanging — unless the first capture costs more than it wins. Count attackers and defenders before you touch a piece.', fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3', highlight: ['e5', 'f3', 'c6'] },
      { text: 'Opponents at every level drop pieces. Your job is simply to notice.', task: { fen: 'rnb1kbnr/pppp1ppp/8/4p1q1/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3', prompt: 'Black brought the queen out early. Punish it.', solution: ['f3g5'], explain: 'The queen on g5 is attacked by the knight and defended by nothing. Nxg5 wins the queen.' } },
      { text: 'Long-range pieces see far. Scan every diagonal, file and rank your queen and bishops sit on.', task: { fen: '4k2q/8/8/8/8/8/8/R3K3 b - - 0 1', prompt: 'Black to move. Look along the long diagonal.', solution: ['h8a1'], explain: 'The rook on a1 is undefended and sits on the h8–a1 diagonal. Qxa1+ wins it with check.' } },
    ],
  },
  { id: 't-hanging-set', track: 'tactics', band: 'foundation', kind: 'themed-set', xp: 60, requires: ['t-hanging'], theme: 'hangingPiece', target: { count: 10, accuracy: 70 }, title: 'Drill: hanging pieces', blurb: 'Solve 10 hanging-piece puzzles at 70 %+ accuracy.' },
  {
    id: 't-fork', track: 'tactics', band: 'foundation', kind: 'lesson', xp: 40, requires: ['t-hanging'],
    title: 'Forks', blurb: 'One piece attacks two targets at once. The opponent can only save one.',
    steps: [
      { text: 'A **fork** (double attack) hits two pieces with one move. Knights are the classic forking piece because their attack cannot be blocked and they jump in from unexpected angles.', fen: START },
      { text: 'The **royal fork** — check plus an attack on the queen or rook — is the strongest version because the king *must* respond.', task: { fen: 'r3k3/8/8/3N4/8/8/8/4K3 w - - 0 1', prompt: 'White to move. Fork the king and rook.', solution: ['d5c7'], explain: 'Nc7+ checks the king and attacks a8. After the king moves, Nxa8.' } },
      { text: 'Queens fork too — look for a check that also lines up with a loose piece.', task: { fen: 'r3k3/8/8/8/8/8/8/3QK3 w - - 0 1', prompt: 'White to move. Check and win the rook.', solution: ['d1a4'], explain: 'Qa4+ checks along the a4–e8 diagonal and attacks a8 along the file.' } },
    ],
  },
  { id: 't-fork-set', track: 'tactics', band: 'foundation', kind: 'themed-set', xp: 60, requires: ['t-fork'], theme: 'fork', target: { count: 10, accuracy: 70 }, title: 'Drill: forks', blurb: 'Solve 10 fork puzzles at 70 %+ accuracy.' },
  {
    id: 't-pin', track: 'tactics', band: 'foundation', kind: 'lesson', xp: 40, requires: ['t-fork'],
    title: 'Pins and skewers', blurb: 'Line pieces that freeze a defender — or pass through a valuable piece to the one behind.',
    steps: [
      { text: 'A **pin** holds a piece in place because moving it would expose something more valuable behind it. Against the king the pin is *absolute*: the pinned piece legally cannot move.', fen: START },
      { text: 'A pinned piece is a target. Pile up on it, or simply take it if it is undefended.', task: { fen: '4k3/4q3/8/8/8/8/8/4RK2 w - - 0 1', prompt: 'White to move. The queen is pinned to its king.', solution: ['e1e7'], explain: 'Rxe7+ — the queen cannot escape the e-file, so the rook simply takes it.' } },
      { text: 'A **skewer** is the reverse: the valuable piece is in front and must move, exposing the one behind.', task: { fen: '4k3/8/8/q7/8/8/8/4K2R b - - 0 1', prompt: 'Black to move. Skewer the king to the rook.', solution: ['a5a1'], explain: 'Qa1+ — the king must step off the first rank and the rook on h1 falls.' } },
    ],
  },
  { id: 't-pin-set', track: 'tactics', band: 'foundation', kind: 'themed-set', xp: 60, requires: ['t-pin'], theme: 'pin', target: { count: 10, accuracy: 70 }, title: 'Drill: pins', blurb: 'Solve 10 pin puzzles at 70 %+ accuracy.' },
  { id: 't-skewer-set', track: 'tactics', band: 'foundation', kind: 'themed-set', xp: 60, requires: ['t-pin'], theme: 'skewer', target: { count: 8, accuracy: 70 }, title: 'Drill: skewers', blurb: 'Solve 8 skewer puzzles at 70 %+ accuracy.' },
  {
    id: 't-discovered', track: 'tactics', band: 'foundation', kind: 'lesson', xp: 40, requires: ['t-pin'],
    title: 'Discovered attacks', blurb: 'Move one piece to unmask another — ideally with check or a capture.',
    steps: [
      { text: 'A **discovered attack** happens when a piece moves off a line and reveals an attack from the piece behind it. The moving piece is free to do anything — capture, check, fork — so you effectively get two moves in one.', fen: START },
      { text: 'The deadliest form is **discovered check**: the revealed piece gives check, and the piece that moved can take whatever it likes.', task: { fen: '3k4/8/1q6/3N4/8/8/8/3RK3 w - - 0 1', prompt: 'White to move. Win the queen.', solution: ['d5b6'], explain: 'Nxb6+ — the knight captures the queen and the rook on d1 delivers check at the same time.' } },
    ],
  },
  { id: 't-discovered-set', track: 'tactics', band: 'foundation', kind: 'themed-set', xp: 60, requires: ['t-discovered'], theme: 'discoveredAttack', target: { count: 10, accuracy: 70 }, title: 'Drill: discovered attacks', blurb: 'Solve 10 discovered-attack puzzles at 70 %+ accuracy.' },
  {
    id: 't-backrank', track: 'tactics', band: 'foundation', kind: 'lesson', xp: 40, requires: ['t-discovered'],
    title: 'Back-rank mates', blurb: 'A castled king trapped behind its own pawns. Always ask: is the back rank covered?',
    steps: [
      { text: 'After castling, the pawns in front of the king are a shelter — and a prison. If the only defender of the back rank leaves or is deflected, a rook or queen check on the 8th (or 1st) rank is mate.', fen: '6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1', highlight: ['g8', 'f7', 'g7', 'h7'] },
      { text: 'Give the king "luft" (an escape square, usually h3/h6) when the back rank is bare — and look for the mate when your opponent forgets.', task: { fen: '6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1', prompt: 'White to move. Mate in one.', solution: ['a1a8'], explain: 'Ra8# — the king has no flight squares because of its own pawns.' } },
      { text: 'Most back-rank combinations start with a **deflection**: drag the defender away first.', task: { fen: 'r5k1/5ppp/8/8/3Q4/8/5PPP/3R2K1 w - - 0 1', prompt: 'White to move. Force mate.', solution: ['d4d8', 'a8d8', 'd1d8'], explain: 'Qd8+! Rxd8 Rxd8# — the queen sacrifice deflects the rook, and the second rook mates.' } },
    ],
  },
  { id: 't-backrank-set', track: 'tactics', band: 'foundation', kind: 'themed-set', xp: 60, requires: ['t-backrank'], theme: 'backRankMate', target: { count: 10, accuracy: 75 }, title: 'Drill: back-rank mates', blurb: 'Solve 10 back-rank puzzles at 75 %+ accuracy.' },
  { id: 't-mate2-set', track: 'tactics', band: 'foundation', kind: 'themed-set', xp: 60, requires: ['t-backrank'], theme: 'mateIn2', target: { count: 10, accuracy: 70 }, title: 'Drill: mate in 2', blurb: 'Short mating nets: check, quiet move, mate.' },
  // ───────────── TACTICS · Club ─────────────
  {
    id: 't-deflection', track: 'tactics', band: 'club', kind: 'lesson', xp: 40, requires: ['t-backrank-set'],
    title: 'Deflection and decoy', blurb: 'Drag a defender away from its job, or lure a piece onto a fatal square.',
    steps: [
      { text: '**Deflection** removes a defender from a key square or line, often with a sacrifice the opponent cannot refuse. **Decoy (attraction)** is its cousin: you lure a piece — usually the king — to a square where a second tactic hits.', fen: START },
      { text: 'Classic decoy: sacrifice to pull the king onto the fork square.', task: { fen: '3q2k1/5pp1/8/4N3/8/8/6P1/6KR w - - 0 1', prompt: 'White to move. Win the queen.', solution: ['h1h8', 'g8h8', 'e5f7'], explain: 'Rh8+! Kxh8 (forced) Nxf7+ forks king and queen.' } },
    ],
  },
  { id: 't-deflection-set', track: 'tactics', band: 'club', kind: 'themed-set', xp: 60, requires: ['t-deflection'], theme: 'deflection', target: { count: 10, accuracy: 70 }, title: 'Drill: deflection', blurb: 'Solve 10 deflection puzzles at 70 %+ accuracy.' },
  { id: 't-attraction-set', track: 'tactics', band: 'club', kind: 'themed-set', xp: 60, requires: ['t-deflection'], theme: 'attraction', target: { count: 10, accuracy: 70 }, title: 'Drill: decoy', blurb: 'Solve 10 attraction puzzles at 70 %+ accuracy.' },
  { id: 't-sacrifice-set', track: 'tactics', band: 'club', kind: 'themed-set', xp: 80, requires: ['t-attraction-set'], theme: 'sacrifice', target: { count: 12, accuracy: 65 }, title: 'Drill: sacrifices', blurb: 'Give material for mate, a decisive attack, or more material back.' },
  { id: 't-trapped-set', track: 'tactics', band: 'club', kind: 'themed-set', xp: 60, requires: ['t-deflection-set'], theme: 'trappedPiece', target: { count: 10, accuracy: 70 }, title: 'Drill: trapped pieces', blurb: 'A piece with no safe squares. Hunt it.' },
  // ───────────── TACTICS · Strong club ─────────────
  { id: 't-zwischenzug-set', track: 'tactics', band: 'strong', kind: 'themed-set', xp: 80, requires: ['t-sacrifice-set'], theme: 'intermezzo', target: { count: 10, accuracy: 65 }, title: 'Drill: zwischenzug', blurb: 'The in-between move that changes everything before the expected recapture.' },
  { id: 't-promotion-set', track: 'tactics', band: 'strong', kind: 'themed-set', xp: 80, requires: ['t-sacrifice-set'], theme: 'advancedPawn', target: { count: 10, accuracy: 70 }, title: 'Drill: promotion tactics', blurb: 'Passed pawns are tactical weapons, not only endgame assets.' },

  // ───────────── ENDGAMES ─────────────
  { id: 'e-kq', track: 'endgames', band: 'foundation', kind: 'endgame', xp: 50, endgameId: 'kq-mate', title: 'Mate with king and queen', blurb: 'Box the king in, bring your king, mate on the edge. Avoid stalemate.' },
  { id: 'e-kr', track: 'endgames', band: 'foundation', kind: 'endgame', xp: 50, requires: ['e-kq'], endgameId: 'kr-mate', title: 'Mate with king and rook', blurb: 'Cut off, take the opposition, check.' },
  {
    id: 'e-opposition', track: 'endgames', band: 'foundation', kind: 'lesson', xp: 40, requires: ['e-kr'],
    title: 'The opposition', blurb: 'King and pawn endings are decided by who has to move.',
    steps: [
      { text: 'Kings facing each other with one square between them are in **opposition**. The side that does *not* have to move "has" the opposition and forces the other king to give way.', fen: '8/4k3/8/4K3/4P3/8/8/8 w - - 0 1', highlight: ['e5', 'e7'] },
      { text: 'With the king **in front of the pawn**, you win if you can get the opposition at the right moment. Here White has a single winning move.', task: { fen: '8/4k3/8/3K4/4P3/8/8/8 w - - 0 1', prompt: 'White to move. Only one move wins.', solution: ['d5e5'], explain: 'Ke5! takes the opposition. Black must step aside and White\'s king walks to the 6th rank ahead of the pawn. Every other move lets Black hold.' } },
      { text: 'The **square of the pawn**: if the defending king can step into the square whose side equals the pawn\'s distance to promotion, it catches the pawn.', task: { fen: '8/8/8/5k2/P7/8/8/6K1 b - - 0 1', prompt: 'Black to move. Catch the pawn.', solution: ['f5e4'], accept: ['f5e4', 'f5e5', 'f5e6'], explain: 'Any king move into the square a4–a8–e8–e4 draws; Kf4, Kg4 or Kg5 loses to a5.' } },
    ],
  },
  { id: 'e-kp', track: 'endgames', band: 'foundation', kind: 'endgame', xp: 50, requires: ['e-opposition'], endgameId: 'kp-opposition', title: 'Convert king and pawn', blurb: 'Use the opposition to promote.' },
  {
    id: 'e-rook-lesson', track: 'endgames', band: 'club', kind: 'lesson', xp: 40, requires: ['e-kp'],
    title: 'Rook endings: Lucena and Philidor', blurb: 'The two positions every club player must know cold.',
    steps: [
      { text: '**Lucena** (winning): your king sits in front of the pawn on the 7th, the enemy king is cut off. Technique: the *bridge* — put your rook on the 4th rank, walk the king out, and block the checks with the rook.', fen: '1K1k4/1P6/8/8/8/8/r7/2R5 w - - 0 1' },
      { text: 'Start the bridge now.', task: { fen: '1K1k4/1P6/8/8/8/8/r7/2R5 w - - 0 1', prompt: 'White to move. Begin the winning plan.', solution: ['c1c4'], accept: ['c1c4', 'c1d1'], explain: 'Rc4! prepares Kc7 and, after the checks begin, Kb6/Kb5 and Rc4–b4 shelters the king. (Rd1+ first also wins.)' } },
      { text: '**Philidor** (drawing): the defending king is in front of the pawn and the rook stays on its 3rd rank (here the 6th) so the attacking king can never use it. When the pawn advances to that rank, drop the rook to the 1st rank and check from behind.', fen: '4k3/R7/1r6/4K3/4P3/8/8/8 b - - 0 1', highlight: ['b6', 'e6'] },
    ],
  },
  { id: 'e-lucena', track: 'endgames', band: 'club', kind: 'endgame', xp: 50, requires: ['e-rook-lesson'], endgameId: 'lucena', title: 'Win the Lucena', blurb: 'Build the bridge against the engine.' },
  { id: 'e-philidor', track: 'endgames', band: 'club', kind: 'endgame', xp: 50, requires: ['e-rook-lesson'], endgameId: 'philidor', title: 'Hold the Philidor', blurb: 'Draw with the third-rank defence.' },
  { id: 'e-qvp', track: 'endgames', band: 'strong', kind: 'endgame', xp: 50, requires: ['e-lucena'], endgameId: 'q-vs-p', title: 'Queen vs pawn on the 7th', blurb: 'Force the king in front of its pawn and gain tempi.' },
  { id: 'e-rook-set', track: 'endgames', band: 'club', kind: 'themed-set', xp: 60, requires: ['e-rook-lesson'], theme: 'rookEndgame', target: { count: 10, accuracy: 65 }, title: 'Drill: rook endgame tactics', blurb: 'Rook endings are the most common in practice.' },
  { id: 'e-pawn-set', track: 'endgames', band: 'club', kind: 'themed-set', xp: 60, requires: ['e-kp'], theme: 'pawnEndgame', target: { count: 10, accuracy: 65 }, title: 'Drill: pawn endgame tactics', blurb: 'Breakthroughs, opposition, key squares.' },

  // ───────────── OPENINGS ─────────────
  {
    id: 'o-principles', track: 'openings', band: 'foundation', kind: 'lesson', xp: 40,
    title: 'Opening principles', blurb: 'Centre, development, king safety — the rules that beat memorisation below 1800.',
    steps: [
      { text: '1. **Control the centre** with pawns (e4/d4 or e5/d5). 2. **Develop** knights before bishops, every piece once before any piece twice. 3. **Castle** early. 4. Connect the rooks. Don\'t bring the queen out early; don\'t grab pawns that cost three tempi.', fen: START },
      { text: 'The Italian after 3.Bc4: both sides have developed toward the centre and the f7/f2 squares. Count: White has two pieces out, Black one.', fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3' },
      { text: 'When development is done and nothing is hanging, the next priority is always the king.', task: { fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2PP1N2/PP3PPP/RNBQK2R w KQkq - 0 6', prompt: 'White to move. What comes next?', solution: ['e1g1'], explain: 'O-O. Pieces are developed, the centre is stable — tuck the king away before opening lines.' } },
    ],
  },
  { id: 'o-italian', track: 'openings', band: 'foundation', kind: 'opening', xp: 80, requires: ['o-principles'], repertoireId: 'italian', title: 'White: Italian Game', blurb: 'Learn the main lines with spaced repetition.' },
  { id: 'o-carokann', track: 'openings', band: 'foundation', kind: 'opening', xp: 80, requires: ['o-principles'], repertoireId: 'caro-kann', title: 'Black vs 1.e4: Caro-Kann', blurb: 'Solid, low-theory, and the bishop gets out.' },
  { id: 'o-london', track: 'openings', band: 'club', kind: 'opening', xp: 80, requires: ['o-italian'], repertoireId: 'london', title: 'White: London System', blurb: 'One setup against everything.' },
  { id: 'o-qgd', track: 'openings', band: 'club', kind: 'opening', xp: 80, requires: ['o-carokann'], repertoireId: 'qgd', title: "Black vs 1.d4: Queen's Gambit Declined", blurb: 'Classical and full of plans.' },

  // ───────────── STRATEGY ─────────────
  {
    id: 's-structure', track: 'strategy', band: 'club', kind: 'lesson', xp: 40, requires: ['t-backrank-set'],
    title: 'Pawn structure basics', blurb: 'Pawns are the skeleton of the position — they tell you where to play.',
    steps: [
      { text: 'An **isolated pawn** has no neighbour to defend it: a target in the endgame, but it gives open files and space in the middlegame. **Doubled pawns** cannot defend each other. A **backward pawn** cannot advance safely and the square in front of it is a hole.', fen: 'r1bq1rk1/pp2bppp/2n1pn2/3p4/2PP4/2N2N2/PP2BPPP/R2QKB1R w KQ - 0 9', highlight: ['d5', 'c4', 'd4'] },
      { text: 'The classic isolated queen\'s pawn (IQP) after cxd5 exd5 and ...dxc4: White gets the d4 pawn\'s space and the e5 outpost; Black wants to trade pieces and blockade on d5. Plans come from the structure, not from memory.', fen: 'r1bq1rk1/pp2bppp/2n2n2/3p4/3P4/2N2N2/PP2BPPP/R2Q1RK1 w - - 0 11', highlight: ['d4', 'd5', 'e5'] },
      { text: 'Rule of thumb: with a space advantage, avoid trades and attack; with a structural advantage (fewer weaknesses), trade pieces and head for the endgame.', fen: START },
    ],
  },
  {
    id: 's-files', track: 'strategy', band: 'club', kind: 'lesson', xp: 40, requires: ['s-structure'],
    title: 'Open files, the 7th rank and outposts', blurb: 'Where rooks and knights live.',
    steps: [
      { text: 'Rooks belong on **open files** (no pawns) or half-open files (only enemy pawns). The goal is the **7th rank**, where a rook attacks pawns sideways and traps the king.', fen: '2r2rk1/1p3ppp/p3p3/8/8/P3P3/1P3PPP/2RR2K1 w - - 0 1', highlight: ['c1', 'd1', 'c8', 'f8', 'd7'] },
      { text: 'An **outpost** is a square in the opponent\'s half that no pawn can ever attack, ideally protected by your own pawn. A knight on an outpost is worth a rook\'s pawn more than usual — and the opponent will often give up a bishop for it.', fen: 'r2q1rk1/pp1b1ppp/2n1pn2/2pp4/3P1B2/2P1PN2/PP1N1PPP/R2QKB1R w KQ - 0 9', highlight: ['e5'] },
      { text: 'Good bishop, bad bishop: a bishop blocked by its own pawns is "bad". Put your pawns on the opposite colour of your bishop — or trade the bad bishop.', fen: START },
    ],
  },
  {
    id: 's-prophylaxis', track: 'strategy', band: 'strong', kind: 'lesson', xp: 40, requires: ['s-files'],
    title: 'Prophylaxis and planning', blurb: 'Ask what your opponent wants — then stop it.',
    steps: [
      { text: 'Before you look for your own ideas, ask: **"What does my opponent want to do next move?"** If the answer is dangerous, your move is the one that prevents it. This single habit removes most "I didn\'t see that" losses.', fen: START },
      { text: 'A plan is a goal derived from the position: open a file for rooks, trade the defender of a weak square, push a pawn majority, improve your worst piece. Make one small plan per phase; re-evaluate when the structure changes.', fen: START },
      { text: 'Review routine: replay your game *without* the engine, mark the three moments you were unsure, write your plan at each, then compare with the engine. Log the error type — tactic, opening, plan, time, endgame — and make the most frequent one next week\'s theme.', fen: START },
    ],
  },
]

export const TRACK_LABEL: Record<PathNode['track'], string> = { tactics: 'Tactics', endgames: 'Endgames', openings: 'Openings', strategy: 'Strategy' }
export const BAND_LABEL: Record<PathNode['band'], string> = { foundation: 'Foundation · <1200', club: 'Club · 1200–1600', strong: 'Strong club · 1600–2000' }
