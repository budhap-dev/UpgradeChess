/** Built-in repertoires as SAN lines. Lines are merged into a tree; `side` is the colour the learner plays. */
export interface Repertoire { id: string; name: string; side: 'w' | 'b'; eco: string; blurb: string; ideas: string[]; lines: string[] }
export const REPERTOIRES: Repertoire[] = [
  {
    id: 'italian', name: 'Italian Game', side: 'w', eco: 'C50–C54',
    blurb: 'Fast development, early castling, the slow c3–d3 build-up and a later d4 break.',
    ideas: ['Develop Nf3 and Bc4 toward f7', 'c3 prepares d4; d3 keeps it solid', 'Castle by move 6, Re1 and Bb3 keep the bishop safe', 'Nbd2–f1–g3 is the classic knight route'],
    lines: [
      'e4 e5 Nf3 Nc6 Bc4 Bc5 c3 Nf6 d3 d6 O-O O-O Re1 a6 Bb3 Ba7 h3',
      'e4 e5 Nf3 Nc6 Bc4 Bc5 c3 Nf6 d3 O-O O-O d6 Re1 a6 Bb3',
      'e4 e5 Nf3 Nc6 Bc4 Nf6 d3 Bc5 c3 d6 O-O O-O Re1 a6 Bb3',
      'e4 e5 Nf3 Nc6 Bc4 Nf6 d3 Be7 O-O O-O Re1 d6 c3 Na5 Bb5',
      'e4 e5 Nf3 Nc6 Bc4 Be7 d4 exd4 Nxd4 Nf6 Nc3 O-O O-O',
      'e4 e5 Nf3 Nf6 Nc3 Nc6 Bc4 Bc5 d3 d6 O-O O-O',
      'e4 e5 Nf3 d6 d4 exd4 Nxd4 Nf6 Nc3 Be7 Be2 O-O O-O',
    ],
  },
  {
    id: 'london', name: 'London System', side: 'w', eco: 'D02',
    blurb: 'The same solid setup against almost everything: d4, Bf4, e3, c3, Nbd2, Bd3, Nf3.',
    ideas: ['Bishop outside the pawn chain before e3', 'h3 gives the bishop an escape square on h2', 'Ne5 supported by the f4 bishop is the thematic outpost', 'Against ...c5, keep c3 and answer ...Qb6 with Qb3'],
    lines: [
      'd4 d5 Bf4 Nf6 e3 e6 Nf3 c5 c3 Nc6 Nbd2 Bd6 Bg3 O-O Bd3 b6 Qe2',
      'd4 d5 Bf4 Nf6 e3 c5 c3 Nc6 Nd2 e6 Ngf3 Bd6 Bg3 O-O Bd3 Qe7 Ne5',
      'd4 d5 Bf4 c5 e3 Nc6 c3 Qb6 Qb3 c4 Qc2 Bf5 Qc1 e6 Nf3',
      'd4 Nf6 Bf4 g6 e3 Bg7 Nf3 O-O Be2 d6 h3 Nbd7 O-O',
      'd4 Nf6 Bf4 e6 e3 b6 Nf3 Bb7 Bd3 Be7 Nbd2 O-O h3',
    ],
  },
  {
    id: 'caro-kann', name: 'Caro-Kann Defence', side: 'b', eco: 'B10–B19',
    blurb: 'Solid structure, the light-squared bishop comes out before ...e6, and few early tactics to memorise.',
    ideas: ['...c6 and ...d5 challenge the centre without blocking the c8 bishop', 'Classical: ...Bf5, ...Bg6, ...h6, then ...Nd7 and ...e6', 'Advance: ...Bf5 first, then ...e6 and ...c5', 'Exchange: ...Nc6, ...Bg4 and ...Qd7 to meet Qb3'],
    lines: [
      'e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5 Ng3 Bg6 h4 h6 Nf3 Nd7 h5 Bh7 Bd3 Bxd3 Qxd3 e6 Bd2 Ngf6 O-O-O Be7',
      'e4 c6 d4 d5 Nd2 dxe4 Nxe4 Bf5 Ng3 Bg6 h4 h6 Nf3 Nd7 h5 Bh7 Bd3 Bxd3 Qxd3 e6',
      'e4 c6 d4 d5 e5 Bf5 Nf3 e6 Be2 c5 O-O Nc6 c3 cxd4 cxd4 Nge7 Nc3 Nc8',
      'e4 c6 d4 d5 e5 Bf5 c4 e6 Nc3 Ne7 Nf3 Nd7 Be2 dxc4 Bxc4 Nb6',
      'e4 c6 d4 d5 exd5 cxd5 Bd3 Nc6 c3 Nf6 Bf4 Bg4 Qb3 Qd7 Nd2 e6 Ngf3 Bd6',
      'e4 c6 Nc3 d5 Nf3 Bg4 h3 Bxf3 Qxf3 e6 d4 Nf6 Bd3 dxe4 Nxe4 Qxd4',
      'e4 c6 c4 d5 exd5 cxd5 cxd5 Nf6 Nc3 Nxd5 Nf3 Nc6 Bb5 e6',
    ],
  },
  {
    id: 'qgd', name: "Queen's Gambit Declined", side: 'b', eco: 'D30–D69',
    blurb: 'Classical, solid and full of plans: ...e6, ...Nf6, ...Be7, castle, then ...b6/...Bb7 or ...c5.',
    ideas: ['Never leave the c8 bishop buried: plan ...b6 and ...Bb7 or ...dxc4 with ...c5', '...h6 before ...b6 takes the sting out of Bxf6', 'Against the Exchange (cxd5 exd5) play ...c6, ...Nbd7, ...Re8 and ...Nf8', 'Break with ...c5 when your pieces are ready'],
    lines: [
      'd4 d5 c4 e6 Nc3 Nf6 Bg5 Be7 e3 O-O Nf3 h6 Bh4 b6 Bd3 Bb7 O-O Nbd7 Qe2 c5',
      'd4 d5 c4 e6 Nf3 Nf6 Nc3 Be7 Bg5 O-O e3 h6 Bh4 b6 cxd5 Nxd5 Bxe7 Qxe7',
      'd4 d5 c4 e6 Nc3 Nf6 cxd5 exd5 Bg5 Be7 e3 O-O Bd3 c6 Qc2 Nbd7 Nf3 Re8 O-O Nf8',
      'd4 d5 c4 e6 Nf3 Nf6 g3 Be7 Bg2 O-O O-O dxc4 Qc2 a6 Qxc4 b5 Qc2 Bb7',
      'd4 d5 c4 e6 Nc3 Nf6 Nf3 Be7 Bf4 O-O e3 c5 dxc5 Bxc5 Qc2 Nc6 a3 Qa5',
      'd4 Nf6 c4 e6 Nf3 d5 Nc3 Be7 Bg5 O-O e3 h6 Bh4 b6 Bd3 Bb7',
    ],
  },
]
