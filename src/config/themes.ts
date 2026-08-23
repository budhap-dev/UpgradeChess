/** Lichess puzzle theme keys → human labels, in the curriculum learning order. */
export const MOTIFS: { key: string; label: string; blurb: string }[] = [
  { key: 'hangingPiece', label: 'Hanging pieces', blurb: 'Count attackers and defenders. Free material is the most common tactic at every level.' },
  { key: 'fork', label: 'Forks', blurb: 'One piece attacks two targets at once. Knights and queens are the usual culprits.' },
  { key: 'pin', label: 'Pins', blurb: 'A piece cannot move without exposing something more valuable behind it.' },
  { key: 'skewer', label: 'Skewers', blurb: 'The reverse pin: the valuable piece is in front and must move, exposing the one behind.' },
  { key: 'discoveredAttack', label: 'Discovered attacks', blurb: 'Move one piece to unmask an attack from another — ideally with tempo.' },
  { key: 'doubleCheck', label: 'Double check', blurb: 'Only the king can move. The most forcing move in chess.' },
  { key: 'backRankMate', label: 'Back-rank mates', blurb: 'A king trapped by its own pawns. Always ask: is the back rank defended?' },
  { key: 'mateIn2', label: 'Mate in 2', blurb: 'Short mating nets: check, quiet move, mate.' },
  { key: 'deflection', label: 'Deflection', blurb: 'Drag a defender away from its job.' },
  { key: 'attraction', label: 'Decoy / attraction', blurb: 'Lure a piece (often the king) onto a fatal square.' },
  { key: 'sacrifice', label: 'Sacrifices', blurb: 'Give material for a bigger gain — mate, a decisive attack, or more material back.' },
  { key: 'intermezzo', label: 'Zwischenzug', blurb: 'An in-between move that changes everything before the expected recapture.' },
  { key: 'trappedPiece', label: 'Trapped pieces', blurb: 'A piece with no safe squares. Hunt it.' },
  { key: 'advancedPawn', label: 'Promotion tactics', blurb: 'Passed pawns are tactical weapons, not only endgame assets.' },
  { key: 'endgame', label: 'Endgame tactics', blurb: 'Precise calculation when few pieces remain.' },
  { key: 'rookEndgame', label: 'Rook endgames', blurb: 'The most common endgame in practice. Activity beats material.' },
  { key: 'pawnEndgame', label: 'Pawn endgames', blurb: 'Opposition, key squares, the square of the pawn.' },
]
export const MOTIF_LABEL: Record<string, string> = Object.fromEntries(MOTIFS.map((m) => [m.key, m.label]))
export const DIFFICULTY_OFFSETS = { easiest: -600, easier: -300, normal: 0, harder: 300, hardest: 600 } as const
