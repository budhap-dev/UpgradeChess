/** Annotated classic games with "guess the move" checkpoints. Validated in masterGames.test.ts. */
export interface MasterGame {
  id: string; title: string; white: string; black: string; event: string; year: number; result: string; eco?: string
  theme: string                      // one-line lesson
  moves: string                      // SAN
  notes: Record<number, string>      // after ply N
  guess: number[]                    // plies where the learner must find the move that was played (ply N = the Nth move)
  guessSide: 'w' | 'b'
}

export const MASTER_GAMES: MasterGame[] = [
  {
    id: 'opera', title: 'The Opera Game', white: 'Paul Morphy', black: 'Duke of Brunswick & Count Isouard', event: 'Paris Opera', year: 1858, result: '1-0', eco: 'C41',
    theme: 'Development and open lines beat material. Every Morphy move brings a piece into play or opens a line toward the king.',
    moves: 'e4 e5 Nf3 d6 d4 Bg4 dxe5 Bxf3 Qxf3 dxe5 Bc4 Nf6 Qb3 Qe7 Nc3 c6 Bg5 b5 Nxb5 cxb5 Bxb5+ Nbd7 O-O-O Rd8 Rxd7 Rxd7 Rd1 Qe6 Bxd7+ Nxd7 Qb8+ Nxb8 Rd8#',
    notes: {
      6: 'Pinning the knight this early lets White force matters.', 8: 'Black gives up the bishop pair to avoid losing a pawn: 4…dxe5 5.Qxd8+ loses castling rights.',
      12: 'Bc4 and Qb3 hit f7 and b7 at once.', 13: 'Qb3 attacks b7 and f7. 7…Qe7 is the only move that holds both, but it blocks the bishop.',
      15: 'Morphy refuses 8.Qxb7 (Qb4+ forces a queen trade): with a lead in development you keep the queens on.', 17: 'Every piece out. Black has one piece developed.',
      19: 'Nxb5! — the sacrifice opens the b-file and the a4–e8 diagonal. Black\'s pieces cannot cover both.', 23: 'Castling long brings the rook to the d-file in one move — development with tempo.',
      25: 'Rxd7! removes the defender of the knight and rips open the d-file.', 27: 'Rd1 piles on again; Black\'s remaining rook is pinned.',
      31: 'Qb8+!! deflects the knight from d7.', 33: 'Rd8# — a queen sacrifice ending with two minor pieces against a whole army still at home.',
    },
    guess: [19, 25, 31, 33], guessSide: 'w',
  },
  {
    id: 'immortal', title: 'The Immortal Game', white: 'Adolf Anderssen', black: 'Lionel Kieseritzky', event: 'London', year: 1851, result: '1-0', eco: 'C33',
    theme: 'Initiative over material: White gives a bishop, both rooks and the queen, and mates with three minor pieces.',
    moves: 'e4 e5 f4 exf4 Bc4 Qh4+ Kf1 b5 Bxb5 Nf6 Nf3 Qh6 d3 Nh5 Nh4 Qg5 Nf5 c6 g4 Nf6 Rg1 cxb5 h4 Qg6 h5 Qg5 Qf3 Ng8 Bxf4 Qf6 Nc3 Bc5 Nd5 Qxb2 Bd6 Bxg1 e5 Qxa1+ Ke2 Na6 Nxg7+ Kd8 Qf6+ Nxf6 Be7#',
    notes: {
      6: 'Qh4+ wins the right to castle but the queen will be chased for the rest of the game.', 8: 'Bryan\'s Counter-gambit: a pawn to deflect the bishop.',
      21: 'Rg1 offers the bishop: White wants open lines more than material.', 27: 'Qf3 threatens Bxf4 trapping the queen; Black\'s queen has made eight moves.',
      33: 'Nd5 — every white piece aims at the king. Black grabs material…', 35: 'Bd6!! invites Bxg1 and Qxa1+ — both rooks hang and White doesn\'t care.',
      37: 'e5! shuts the queen out of the defence along the long diagonal.', 41: 'Nxg7+ starts the final combination.', 43: 'Qf6+!! Nxf6 is forced…', 45: 'Be7# — queen, both rooks and a bishop sacrificed. Mate with the remaining minor pieces.',
    },
    guess: [35, 37, 43, 45], guessSide: 'w',
  },
  {
    id: 'reti-tartakower', title: 'The Réti double-bishop mate', white: 'Richard Réti', black: 'Savielly Tartakower', event: 'Vienna', year: 1910, result: '1-0', eco: 'B15',
    theme: 'A king in the centre plus a queen sacrifice: eleven moves, one pattern you will see again and again.',
    moves: 'e4 c6 d4 d5 Nc3 dxe4 Nxe4 Nf6 Qd3 e5 dxe5 Qa5+ Bd2 Qxe5 O-O-O Nxe4',
    notes: {
      10: 'e5?! opens the centre while Black\'s king is still on e8.', 14: 'Qxe5 wins a pawn — and walks into the trap.', 15: 'O-O-O: the rook is on the d-file, the d2 bishop is ready.', 16: 'Nxe4?? grabs a second piece. Now 9.Qd8+!! Kxd8 10.Bg5+ and mate next move (Kc7 Bd8#, Ke8 Rd8#). Réti played it.',
    },
    guess: [], guessSide: 'w',
  },
  {
    id: 'game-of-the-century', title: 'The Game of the Century', white: 'Donald Byrne', black: 'Robert J. Fischer', event: 'New York (Rosenwald)', year: 1956, result: '0-1', eco: 'D92',
    theme: 'A 13-year-old gives his queen for a windmill of minor pieces and a rook — coordination beats material.',
    moves: 'Nf3 Nf6 c4 g6 Nc3 Bg7 d4 O-O Bf4 d5 Qb3 dxc4 Qxc4 c6 e4 Nbd7 Rd1 Nb6 Qc5 Bg4 Bg5 Na4 Qa3 Nxc3 bxc3 Nxe4 Bxe7 Qb6 Bc4 Nxc3 Bc5 Rfe8+ Kf1 Be6 Bxb6 Bxc4+ Kg1 Ne2+ Kf1 Nxd4+ Kg1 Ne2+ Kf1 Nc3+ Kg1 axb6 Qb4 Ra4 Qxb6 Nxd1 h3 Rxa2 Kh2 Nxf2 Re1 Rxe1 Qd8+ Bf8 Nxe1 Bd5 Nf3 Ne4 Qb8 b5 h4 h5 Ne5 Kg7 Kg1 Bc5+ Kf1 Ng3+ Ke1 Bb4+ Kd1 Bb3+ Kc1 Ne2+ Kb1 Nc3+ Kc1 Rc2#',
    notes: {
      21: 'Bg5? — White\'s 11th move loses time; the king is still in the centre.', 22: 'Na4!! — Fischer\'s first star move. If Nxa4 then Nxe4 and the queen on a3 is overloaded.',
      26: 'Nxe4! A piece sacrifice: Bxe7 Qb6 and Black\'s pieces come alive.', 34: 'Be6!! — the queen is left en prise. Bxb6 runs into Bxc4+ and a windmill of discovered checks.',
      36: 'Bxc4+: the windmill begins. Every knight check comes with a discovered attack.', 48: 'Black has rook, two bishops and a knight for the queen — and total coordination.',
      58: 'The pieces swarm; White\'s queen is a spectator.', 82: 'Rc2# — the king is hunted across the board.',
    },
    guess: [22, 26, 34, 36], guessSide: 'b',
  },
  {
    id: 'lasker-bauer', title: 'The double bishop sacrifice', white: 'Emanuel Lasker', black: 'Johann Bauer', event: 'Amsterdam', year: 1889, result: '1-0', eco: 'A03',
    theme: 'The original double bishop sacrifice: Bxh7+, Qxh5, then Bxg7 strips the king; a rook lift finishes.',
    moves: 'f4 d5 e3 Nf6 b3 e6 Bb2 Be7 Bd3 b6 Nc3 Bb7 Nf3 Nbd7 O-O O-O Ne2 c5 Ng3 Qc7 Ne5 Nxe5 Bxe5 Qc6 Qe2 a6 Nh5 Nxh5 Bxh7+ Kxh7 Qxh5+ Kg8 Bxg7 Kxg7 Qg4+ Kh7 Rf3 e5 Rh3+ Qh6 Rxh6+ Kxh6 Qd7',
    notes: {
      24: 'Qc6 leaves the kingside thin: only the f6 knight defends h7.', 28: 'Nxh5 — the defender of h7 is gone and the queen can come to h5.',
      29: 'Bxh7+! The first bishop.', 31: 'Qxh5+ — threatens Qh7# and the second sacrifice.', 33: 'Bxg7! The second bishop: the king is stripped bare.',
      35: 'Qg4+ followed by Rf3–h3 is the point — the rook lift.', 37: 'Rf3: unstoppable Rh3+.', 41: 'Rxh6+ Kxh6 and now Qd7 forks the two bishops — White emerges a piece up and won on move 38.',
    },
    guess: [29, 33, 37], guessSide: 'w',
  },
]
