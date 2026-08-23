/** Gambits, opening traps and quick tricks. Lines are SAN; every line, mate claim and task is validated in tricks.test.ts. */
export interface TrickTask { ply: number; prompt: string; solution: string[]; accept?: string[]; explain: string }
export interface Trick {
  id: string; name: string; kind: 'gambit' | 'trap' | 'trick'; side: 'w' | 'b'; eco?: string
  line: string                       // SAN moves
  notes: Record<number, string>      // comment shown after ply N (1-based)
  idea: string                       // one-line summary
  avoid?: string                     // how the other side should sidestep it
  task?: TrickTask
}

export const TRICKS: Trick[] = [
  {
    id: 'scholars-defence', name: "Scholar's Mate — and how to stop it", kind: 'trap', side: 'b', eco: 'C20',
    line: 'e4 e5 Qh5 Nc6 Bc4 g6 Qf3 Nf6 Qb3 Nd4',
    notes: { 3: 'The queen eyes f7 and e5. Beginners panic here — don\'t.', 4: 'Defend e5 with a developing move.', 5: 'Now Qxf7 is mate next move.', 6: 'g6! hits the queen and shuts the h5–f7 diagonal. 3…Nf6?? loses to Qxf7#.', 8: 'Black has developed with tempo; White\'s queen will keep getting kicked.', 10: 'Nd4 threatens Nxc2+ and ...Nxb3. Black is already better.' },
    idea: 'An early Qh5/Qf3 + Bc4 battery aims at f7. Meet it with …g6 (or …Qe7) and develop with tempo against the queen.',
    task: { ply: 5, prompt: 'White threatens Qxf7#. Stop it and gain time.', solution: ['g7g6'], accept: ['g7g6', 'd8e7', 'd8f6'], explain: '…g6 blocks the diagonal and attacks the queen. …Qe7 or …Qf6 also hold f7, but …g6 gains a tempo.' },
  },
  {
    id: 'legal', name: "Légal's Mate", kind: 'trick', side: 'w', eco: 'C41',
    line: 'e4 e5 Nf3 d6 Bc4 Bg4 Nc3 g6 Nxe5 Bxd1 Bxf7+ Ke7 Nd5#',
    notes: { 6: 'The pin on the f3 knight looks annoying…', 8: '…but Black wasted a tempo on …g6 and hasn\'t castled.', 9: 'Nxe5! "sacrifices" the queen. If 5…dxe5 6.Qxg4 White is simply a pawn up.', 10: 'Greed.', 11: 'Bxf7+ drags the king out.', 13: 'Nd5# — three minor pieces beat a queen.' },
    idea: 'When a bishop pins your Nf3 and the king is still on e8 with f7 weak, Nxe5! unpins with a mate threat.',
    avoid: 'Don\'t take the queen: after Nxe5, play …dxe5 and accept being a pawn down — or better, don\'t play an early …Bg4 + …g6.',
    task: { ply: 8, prompt: 'White to move. The pin on f3 is an illusion — strike.', solution: ['f3e5'], explain: 'Nxe5! If Bxd1 then Bxf7+ Ke7 Nd5#; if dxe5, Qxg4 wins a pawn.' },
  },
  {
    id: 'fried-liver', name: 'Fried Liver Attack', kind: 'trick', side: 'w', eco: 'C57',
    line: 'e4 e5 Nf3 Nc6 Bc4 Nf6 Ng5 d5 exd5 Nxd5 Nxf7 Kxf7 Qf3+ Ke6 Nc3 Ncb4 a3 Nxc2+ Kd1 Nxa1 Nxd5',
    notes: { 7: 'Ng5 attacks f7 twice.', 8: '…d5 is the only good reply.', 10: '10…Nxd5?! recaptures naturally but walks into the Fried Liver. 5…Na5! is the main line.', 11: 'Nxf7! sacrifices the knight to expose the king.', 13: 'Qf3+ forces the king forward: 7…Ke8?? 8.Bxd5 and the pin on the knight is decisive.', 14: 'The king on e6 shields d5 but is hopelessly exposed.', 15: 'Nc3 piles up on d5. Black is objectively lost in practice.' },
    idea: 'If Black recaptures …Nxd5 after 4.Ng5 d5 5.exd5, the knight sacrifice Nxf7 followed by Qf3+ gives a raging attack on the exposed king.',
    avoid: 'As Black play 5…Na5! (or 5…b5, or the Traxler 4…Bc5). Never 5…Nxd5 unless you know the defence cold.',
    task: { ply: 10, prompt: 'White to move. Rip open the king.', solution: ['g5f7'], explain: 'Nxf7! Kxf7 Qf3+ and the black king must go to e6 to keep the d5 knight.' },
  },
  {
    id: 'traxler', name: 'Traxler Counter-Attack', kind: 'gambit', side: 'b', eco: 'C57',
    line: 'e4 e5 Nf3 Nc6 Bc4 Nf6 Ng5 Bc5 Nxf7 Bxf2+ Kxf2 Nxe4+ Kg1 Qh4 g3 Nxg3 hxg3 Qxg3+',
    notes: { 8: 'Bc5!? ignores the threat to f7 and counterattacks f2.', 9: 'Nxf7 forks queen and rook — but…', 10: '…Bxf2+! drags the white king out first.', 12: 'With the king on f2, Nxe4+ hits with tempo; now …Qh4 and …Qf2# ideas fly.', 14: 'Qh4 threatens …Qf2#. White is already in trouble.', 18: 'Perpetual at least; in practice Black usually wins.' },
    idea: 'Against 4.Ng5, Black sacrifices on f2 for a wild king hunt instead of defending f7 passively.',
    avoid: 'As White, meet 4…Bc5 with 5.Bxf7+! Ke7 6.Bd5 — less fun, but sound.',
    task: { ply: 9, prompt: 'White just took on f7. Black to move — counter-strike.', solution: ['c5f2'], explain: 'Bxf2+! 6.Kxf2 Nxe4+ and 7…Qh4 with a crushing attack; 6.Kf1 Qe7 also works.' },
  },
  {
    id: 'stafford', name: 'Stafford Gambit trap', kind: 'trap', side: 'b', eco: 'C42',
    line: 'e4 e5 Nf3 Nf6 Nxe5 Nc6 Nxc6 dxc6 d3 Bc5 Bg5 Nxe4 Bxd8 Bxf2+ Ke2 Bg4#',
    notes: { 4: 'The Stafford: Black gives a pawn for open lines toward f2 and e4.', 8: 'The half-open d-file and the c8 bishop both point at White\'s king side.', 10: 'Bc5 eyes f2. White must be careful now.', 11: 'Bg5?? pins the knight — or so it seems.', 12: 'Nxe4!! The knight is poisoned: dxe4 Bxf2+ Ke2 Bg4+ wins the queen.', 13: 'Taking the queen loses to a forced mate.', 16: 'Bg4# — the f1 bishop and e2 king are boxed in.' },
    idea: 'After 3…Nc6 4.Nxc6 dxc6 Black\'s pieces point at f2/e4; the natural 5.d3 Bc5 6.Bg5?? loses to …Nxe4!',
    avoid: 'As White: 5.d3 Bc5 6.Be2! (not Bg5), or 5.Nc3 and castle fast. Don\'t touch the e4 knight tricks until you\'re developed.',
    task: { ply: 11, prompt: 'White pinned your knight with Bg5. Black to move.', solution: ['f6e4'], explain: 'Nxe4! 7.Bxd8 Bxf2+ 8.Ke2 Bg4#; 7.dxe4 Bxf2+ 8.Ke2 Bg4+ wins the queen.' },
  },
  {
    id: 'englund', name: 'Englund Gambit trap', kind: 'trap', side: 'b', eco: 'A40',
    line: 'd4 e5 dxe5 Nc6 Nf3 Qe7 Bf4 Qb4+ Bd2 Qxb2 Bc3 Bb4 Qd2 Bxc3 Qxc3 Qc1#',
    notes: { 2: 'Objectively dubious, but full of traps against 1.d4 players who want a quiet life.', 6: 'Qe7 prepares to regain the pawn and sets the trap.', 8: 'Qb4+ forks the bishop and b2.', 11: 'Bc3?? looks natural — it attacks the queen and blocks the check — but…', 12: '…Bb4! pins the bishop to the king. Now the queen is lost or it\'s mate.', 16: 'Qc1#.' },
    idea: 'After 4.Bf4 Qb4+ 5.Bd2 Qxb2, the natural 6.Bc3?? walks into …Bb4! with a forced win.',
    avoid: 'As White: 6.Nc3! Bb4 7.Rb1 Qa3 8.Rb3 and the queen is trapped in your camp — White is winning.',
    task: { ply: 10, prompt: 'White to move. Black took on b2 — find the move that refutes the gambit.', solution: ['b1c3'], explain: 'Nc3! develops, shields the rook and threatens Rb1 winning the queen. 6.Bc3?? loses to …Bb4.' },
  },
  {
    id: 'blackburne-shilling', name: 'Blackburne Shilling Gambit', kind: 'trap', side: 'b', eco: 'C50',
    line: 'e4 e5 Nf3 Nc6 Bc4 Nd4 Nxe5 Qg5 Nxf7 Qxg2 Rf1 Qxe4+ Be2 Nf3#',
    notes: { 6: 'Nd4?! breaks a rule — moves a piece twice and hangs e5 — to bait Nxe5.', 7: 'Greedy. 4.Nxd4 exd4 5.O-O is simply good for White.', 8: 'Qg5! attacks both e5 and g2.', 9: 'Nxf7 forks queen and rook, but…', 10: '…Qxg2 threatens the rook and Qxe4+.', 14: 'Nf3# — smothered by White\'s own pieces. The d1 queen blocks the king\'s escape.' },
    idea: 'A cheap trap: if White grabs e5 after 3…Nd4, Qg5! hits g2 and e5 and the game can end by move 7.',
    avoid: 'As White: 4.Nxd4 exd4 5.c3 or 5.O-O. Just don\'t take e5.',
    task: { ply: 7, prompt: 'White grabbed the e5 pawn. Black to move.', solution: ['d8g5'], explain: 'Qg5! attacks the knight and g2 at once; 5.Nxf7 Qxg2 6.Rf1 Qxe4+ 7.Be2 Nf3#.' },
  },
  {
    id: 'elephant-trap', name: 'Elephant Trap (QGD)', kind: 'trap', side: 'b', eco: 'D51',
    line: 'd4 d5 c4 e6 Nc3 Nf6 Bg5 Nbd7 cxd5 exd5 Nxd5 Nxd5 Bxd8 Bb4+ Qd2 Bxd2+ Kxd2 Kxd8',
    notes: { 8: 'Nbd7 looks like it hangs d5 — the f6 knight is pinned, right?', 11: 'Nxd5?? falls for it.', 12: 'Nxd5! The "pinned" knight moves anyway.', 13: 'Bxd8 wins the queen… temporarily.', 14: 'Bb4+! Only Qd2 blocks, and after Bxd2+ Kxd2 Kxd8 Black is a piece up.' },
    idea: 'In the QGD after 4.Bg5 Nbd7, the d5 pawn is poisoned: Nxd5? Nxd5! Bxd8 Bb4+ wins a piece.',
    avoid: 'As White: just develop — 5.e3, 5.Nf3 or 5.cxd5 exd5 6.e3. Never grab d5 here.',
    task: { ply: 11, prompt: 'White took on d5. Black to move — the knight is not really pinned.', solution: ['f6d5'], explain: 'Nxd5! If 7.Bxd8 Bb4+ 8.Qd2 Bxd2+ 9.Kxd2 Kxd8 and Black is a piece up.' },
  },
  {
    id: 'lasker-albin', name: 'Lasker Trap (Albin Counter-Gambit)', kind: 'trap', side: 'b', eco: 'D08',
    line: 'd4 d5 c4 e5 dxe5 d4 e3 Bb4+ Bd2 dxe3 Bxb4 exf2+ Ke2 fxg1=N+ Rxg1 Bg4+',
    notes: { 4: 'The Albin: Black gives e5 for a cramping d4 pawn.', 5: 'e3? is the natural but wrong move.', 6: 'Bb4+ forces Bd2 (Nc3 loses to dxe3 and fxe3 Qh4+).', 8: 'dxe3! Now Bxb4?? loses.', 10: 'exf2+ — and the king can\'t take because of Qxd1.', 11: 'Ke2 forced.', 12: 'fxg1=N+! Underpromotion to a knight with check. Promoting to a queen lets Qxd8 Kxd8 Rxg1.', 14: 'Bg4+ wins the queen. Lasker\'s trap from 1900.' },
    idea: 'After 4.e3? Bb4+ 5.Bd2 dxe3 6.Bxb4?? exf2+ 7.Ke2 fxg1=N+! wins — the famous knight underpromotion.',
    avoid: 'As White: 4.Nf3 (main line) instead of 4.e3.',
    task: { ply: 11, prompt: 'White just took your bishop on b4. Black to move.', solution: ['e3f2'], explain: 'exf2+! 7.Kxf2?? Qxd1. 7.Ke2 fxg1=N+! (not =Q) 8.Rxg1 Bg4+ and the queen falls.' },
  },
  {
    id: 'noahs-ark', name: "Noah's Ark Trap (Ruy Lopez)", kind: 'trap', side: 'b', eco: 'C70',
    line: 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 d6 d4 b5 Bb3 Nxd4 Nxd4 exd4 Qxd4 c5 Qd5 Be6 Qc6+ Bd7 Qd5 c4',
    notes: { 9: 'd4 looks active against the Modern Steinitz.', 10: 'b5 kicks the bishop to b3 first.', 14: 'Now the queen recaptures on d4…', 15: '…and falls into the ark.', 16: 'c5! hits the queen and prepares …c4.', 18: 'Be6 gains another tempo.', 22: 'c4 — the bishop on b3 is trapped by the pawns a6, b5, c4: the "ark".' },
    idea: 'Pawns on a6–b5–c4 trap the Spanish bishop on b3. If White recaptures on d4 with the queen, …c5 and …c4 win the bishop.',
    avoid: 'As White: after 6…Nxd4 7.Nxd4 exd4 don\'t recapture with the queen immediately; 8.Bd5 or 8.c3 is fine.',
    task: { ply: 15, prompt: 'Black to move. The b3 bishop is short of squares — start the trap.', solution: ['c7c5'], explain: 'c5! 9.Qd5 Be6 10.Qc6+ Bd7 11.Qd5 c4 and the bishop is lost.' },
  },
  {
    id: 'siberian', name: 'Siberian Trap (Smith-Morra)', kind: 'trap', side: 'b', eco: 'B21',
    line: 'e4 c5 d4 cxd4 c3 dxc3 Nxc3 Nc6 Nf3 e6 Bc4 Qc7 O-O Nf6 Qe2 Ng4 h3 Nd4 Nxd4 Qh2#',
    notes: { 6: 'The Smith-Morra: a pawn for fast development and open c/d files.', 12: 'Qc7 is the flexible main-line move — it also eyes h2.', 15: 'Qe2 is natural, but it unguards d4 and leaves the f3 knight as the only defender of h2.', 16: 'Ng4! threatens …Nd4 and …Qh2.', 17: 'h3?? asks the knight to leave — it leaves with a bang.', 18: 'Nd4! Deflection: the f3 knight guards h2.', 20: 'Qh2#.' },
    idea: 'With the queen on c7 and a knight on g4, …Nd4! deflects Nf3 and …Qh2 mates. White\'s Qe2 + h3 is the losing combination.',
    avoid: 'As White: play 8.Qe2 only with h3 already in, or answer …Ng4 with 9.Bf4 (or Nb5 ideas), never 9.h3??.',
    task: { ply: 17, prompt: 'White played h3. Black to move — mate in two.', solution: ['c6d4', 'f3d4', 'c7h2'], explain: 'Nd4! deflects the only defender of h2; Nxd4 Qh2#.' },
  },
  {
    id: 'fishing-pole', name: 'Fishing Pole trick', kind: 'trick', side: 'b', eco: 'C65',
    line: 'e4 e5 Nf3 Nc6 Bb5 Nf6 O-O Ng4 h3 h5 hxg4 hxg4 Ne1 Qh4 f3 g3',
    notes: { 8: 'Ng4 dangles the bait: the knight "hangs" to h3.', 10: 'h5! supports it. Now hxg4 opens the h-file toward White\'s castled king.', 11: 'Taking the bait.', 14: 'Qh4 threatens mate on h1/h2. White is lost.', 16: 'g3 — mate cannot be stopped (Qh2#/Qh1#).' },
    idea: 'Against a castled king: …Ng4, …h5 and if hxg4 then hxg4 opens the h-file for …Qh4 and mate.',
    avoid: 'As White: ignore the knight — 5.h3 h5 6.d3 or 6.c3, then Nc3 and the knight must retreat.',
    task: { ply: 11, prompt: 'White took the knight. Black to move.', solution: ['h5g4'], explain: 'hxg4! opens the h-file: 7.Ne1 Qh4 8.f3 g3 and mate on h1/h2 follows.' },
  },
  {
    id: 'kieninger', name: 'Kieninger Trap (Budapest Gambit)', kind: 'trap', side: 'b', eco: 'A52',
    line: 'd4 Nf6 c4 e5 dxe5 Ng4 Bf4 Nc6 Nf3 Bb4+ Nbd2 Qe7 a3 Ngxe5 axb4 Nd3#',
    notes: { 4: 'The Budapest: …e5 for quick piece play.', 10: 'Bb4+ provokes a block; Nbd2 is passive.', 12: 'Qe7 regains the pawn — and sets the trap.', 13: 'a3 attacks the bishop…', 14: '…but Ngxe5 threatens …Nd3#.', 15: 'axb4?? takes the bishop and loses the game.', 16: 'Nd3# — smothered: the king is boxed in by its own pieces.' },
    idea: 'In the Budapest after 6.Nbd2 Qe7 7.a3 Ngxe5, White must not take the bishop: 8.axb4?? Nd3#.',
    avoid: 'As White: 8.Nxe5 Nxe5 9.e3 Bxd2+ 10.Qxd2 — equal.',
    task: { ply: 15, prompt: 'Black to move. Mate in one.', solution: ['e5d3'], explain: 'Nd3# — the king has no squares and nothing can take on d3.' },
  },
  {
    id: 'petroff-trap', name: 'Petroff: the …Nxe4? punishment', kind: 'trick', side: 'w', eco: 'C42',
    line: 'e4 e5 Nf3 Nf6 Nxe5 Nxe4 Qe2 Nf6 Nc6+',
    notes: { 6: 'Nxe4? copies White — but White moved first.', 7: 'Qe2! pins the knight against the king. Now 4…Qe7 is forced (5.Qxe4 d6 equalises).', 8: 'Nf6?? retreats into disaster.', 9: 'Nc6+ — discovered check by the queen, and the knight attacks the queen. White wins the queen.' },
    idea: 'After 3.Nxe5, Black must play 3…d6 first. 3…Nxe4? 4.Qe2 and if the knight retreats, Nc6+ wins the queen.',
    avoid: 'As Black: 3…d6! 4.Nf3 Nxe4. If you already played 3…Nxe4 4.Qe2, play 4…Qe7.',
    task: { ply: 8, prompt: 'White to move. Black retreated the knight — punish it.', solution: ['e5c6'], explain: 'Nc6+! Discovered check from the e2 queen; the knight attacks d8 and the queen is lost.' },
  },
  {
    id: 'evans', name: 'Evans Gambit', kind: 'gambit', side: 'w', eco: 'C51',
    line: 'e4 e5 Nf3 Nc6 Bc4 Bc5 b4 Bxb4 c3 Ba5 d4 exd4 O-O dxc3 Qb3 Qf6 e5 Qg6 Nxc3',
    notes: { 7: 'b4!? gives a pawn to gain a tempo on the bishop and build a big centre.', 9: 'c3 hits the bishop again; d4 comes next.', 11: 'd4: White owns the centre and will castle with open lines toward f7.', 13: 'Castled; Black is still two moves from safety.', 15: 'Qb3 targets f7 — classic Evans pressure.', 19: 'Material is level again and every white piece is active. This is the point of a gambit.' },
    idea: 'A sound, fun gambit: b4 for tempo, c3–d4 for the centre, castle and attack f7. Morphy\'s and Kasparov\'s weapon.',
    task: { ply: 8, prompt: 'White to move. Keep gaining time on the bishop.', solution: ['c2c3'], explain: 'c3! drives the bishop again and prepares d4 with a huge centre.' },
  },
  {
    id: 'danish', name: 'Danish Gambit', kind: 'gambit', side: 'w', eco: 'C21',
    line: 'e4 e5 d4 exd4 c3 dxc3 Bc4 cxb2 Bxb2 d5 Bxd5 Nf6 Bxf7+ Kxf7 Qxd8 Bb4+ Qd2 Bxd2+ Nxd2',
    notes: { 5: 'c3 offers a second pawn.', 8: 'Two pawns for two raking bishops on b2 and c4 aimed at the king side.', 10: 'd5! is the antidote: give the pawns back to kill the bishops.', 16: 'Bb4+ and the simplification leaves an equal endgame — Black has survived the storm.' },
    idea: 'Give two pawns for two monster bishops and a huge lead in development. Great for learning initiative; Black must know …d5!',
    avoid: 'As Black: 5…d5! 6.Bxd5 Nf6 7.Bxf7+ Kxf7 8.Qxd8 Bb4+ and the endgame is fine for Black.',
    task: { ply: 6, prompt: 'White to move. Keep offering pawns — develop with maximum speed.', solution: ['f1c4'], explain: 'Bc4! After cxb2 Bxb2 both bishops stare at the kingside; Nf3/Qb3 and O-O follow.' },
  },
  {
    id: 'smith-morra', name: 'Smith-Morra Gambit', kind: 'gambit', side: 'w', eco: 'B21',
    line: 'e4 c5 d4 cxd4 c3 dxc3 Nxc3 Nc6 Nf3 d6 Bc4 e6 O-O Nf6 Qe2 Be7 Rd1 e5 Be3 O-O Rac1',
    notes: { 4: 'A pawn for the open c- and d-files and quick development against the Sicilian.', 8: 'The standard setup: Nc3, Nf3, Bc4, O-O, Qe2, Rd1, then Rc1 — every piece on an open line.', 15: 'Qe2 and Rd1 put pressure on d6 and prepare e5 breaks.', 21: 'All of White\'s pieces are working; Black must defend precisely for 20 moves to keep the pawn.' },
    idea: 'The practical anti-Sicilian: one pawn for lasting pressure down the c- and d-files. Learn the setup, not the lines.',
    avoid: 'As Black: decline with 3…Nf6 (Alapin-style) or 3…d3, or accept and follow the main line with …a6, …Qc7, …Nf6, …Be7 — and remember the Siberian Trap.',
    task: { ply: 6, prompt: 'White to move. Recapture and develop.', solution: ['b1c3'], explain: 'Nxc3 — the knight comes out for free; Nf3, Bc4, O-O, Qe2, Rd1 follow.' },
  },
  {
    id: 'kings-gambit', name: "King's Gambit basics", kind: 'gambit', side: 'w', eco: 'C33',
    line: 'e4 e5 f4 exf4 Nf3 g5 h4 g4 Ne5 Nf6 Bc4 d5 exd5 Bd6 d4 Nh5 O-O',
    notes: { 3: 'f4!? offers a pawn to open the f-file and build a centre with d4.', 4: 'Accepted.', 5: 'Nf3 is essential: it stops …Qh4+, which would be awkward after 3.Bc4?!.', 6: 'g5 tries to keep the pawn.', 8: 'The Kieseritzky: h4 g4 Ne5 — a sharp main line.', 17: 'White has the centre and the f-file; Black has an extra pawn and a shaky king side. Play for the initiative.' },
    idea: 'Romantic but sound enough at club level: after 2…exf4 play 3.Nf3, then Bc4/d4, castle and use the f-file.',
    avoid: 'As Black: 2…exf4 3.Nf3 d5! (Modern Defence) or 2…Bc5 (declined) keep it calmer than …g5.',
    task: { ply: 4, prompt: 'White to move. Black took on f4 — what must White prevent?', solution: ['g1f3'], explain: 'Nf3! stops …Qh4+. After 3.Bc4?! Qh4+ 4.Kf1 White has lost castling rights.' },
  },
  {
    id: 'vienna', name: 'Vienna Gambit — what to take and what not', kind: 'gambit', side: 'w', eco: 'C29',
    line: 'e4 e5 Nc3 Nf6 f4 d5 fxe5 Nxe4 Nf3 Be7 d4 O-O Bd3 f5 exf6 Bxf6 O-O Nc6',
    notes: { 5: 'f4!? against 2…Nf6. Now 3…exf4? 4.e5! hits the knight and the e5 pawn cramps Black badly (4…Qe7 5.Qe2 Ng8 — ugly).', 6: 'd5! is the correct answer: counter in the centre.', 8: 'Nxe4 — Black gets a good share of the centre.', 18: 'A normal, roughly equal middlegame. Knowing 3…d5 is the whole point.' },
    idea: 'The Vienna Gambit tempts 3…exf4?, after which 4.e5 gives White a huge bind. Black must answer 3.f4 with …d5!',
    avoid: 'As Black: 3…d5! (never 3…exf4?). As White: if 3…exf4? then 4.e5 Qe7 5.Qe2 Ng8 6.Nf3 with a big edge.',
    task: { ply: 5, prompt: 'Black to move against 3.f4. Don\'t take — what is the right reaction?', solution: ['d7d5'], explain: 'd5! strikes the centre: 4.fxe5 Nxe4 and Black is comfortable. 3…exf4? 4.e5! is miserable.' },
  },
]
