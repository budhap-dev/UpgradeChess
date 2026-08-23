/** Curated theoretical positions, all verified against the Lichess tablebase (Aug 2026). */
export interface EndgamePosition { id: string; nodeId: string; title: string; fen: string; side: 'w' | 'b'; goal: 'win' | 'draw'; hint: string }
export const ENDGAMES: EndgamePosition[] = [
  { id: 'kq-mate', nodeId: 'e-kq', title: 'Queen mate', fen: '8/8/8/4k3/8/8/8/4K2Q w - - 0 1', side: 'w', goal: 'win', hint: 'Box the king in with the queen a knight\'s move away, bring your king up, mate on the edge. Watch for stalemate.' },
  { id: 'kr-mate', nodeId: 'e-kr', title: 'Rook mate', fen: '8/8/8/4k3/8/8/8/R3K3 w - - 0 1', side: 'w', goal: 'win', hint: 'Cut the king off with the rook, use your king to take the opposition, then check to push it back a rank.' },
  { id: 'kp-opposition', nodeId: 'e-kp', title: 'King and pawn: opposition', fen: '8/4k3/8/4K3/4P3/8/8/8 b - - 0 1', side: 'w', goal: 'win', hint: 'Black must give way. Step diagonally forward on the side the king leaves, keep the king ahead of the pawn, push only when you have the opposition.' },
  { id: 'lucena', nodeId: 'e-lucena', title: 'Lucena position', fen: '1K1k4/1P6/8/8/8/8/r7/2R5 w - - 0 1', side: 'w', goal: 'win', hint: 'Build the bridge: Rc4, then walk the king out down the c-file and block the checks with the rook on the 4th rank.' },
  { id: 'philidor', nodeId: 'e-philidor', title: 'Philidor position', fen: '4k3/R7/1r6/4K3/4P3/8/8/8 b - - 0 1', side: 'b', goal: 'draw', hint: 'Keep the rook on your 3rd rank (the 6th) until the pawn advances to e6, then drop it to the 1st rank and check from behind.' },
  { id: 'q-vs-p', nodeId: 'e-qvp', title: 'Queen vs pawn on the 7th', fen: '8/8/8/5K2/8/8/1pk5/7Q w - - 0 1', side: 'w', goal: 'win', hint: 'Check to force the king in front of its pawn, gain a tempo each time to bring your king closer. Works vs b/g/d/e pawns.' },
]
