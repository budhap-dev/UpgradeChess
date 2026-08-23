import { Chess } from 'chess.js'
import type { Repertoire } from '@/features/path/repertoires'

export interface MoveNode { san: string; uci: string; fen: string; children: MoveNode[] }
export interface RepTree { root: MoveNode; cards: { id: string; fen: string; move: string; san: string }[] }

const key = (fen: string) => fen.split(' ').slice(0, 4).join(' ')

/** Merge SAN lines into a move tree and derive SRS cards (one per position where it is the learner's move). */
export function buildTree(rep: Repertoire): RepTree {
  const start = new Chess()
  const root: MoveNode = { san: '', uci: '', fen: start.fen(), children: [] }
  const cards = new Map<string, { id: string; fen: string; move: string; san: string }>()
  for (const line of rep.lines) {
    const c = new Chess()
    let node = root
    for (const san of line.split(' ')) {
      const turn = c.turn()
      const m = c.move(san)
      const uci = m.from + m.to + (m.promotion ?? '')
      if (turn === rep.side) {
        const id = `${rep.id}:${key(node.fen)}`
        if (!cards.has(id)) cards.set(id, { id, fen: node.fen, move: uci, san })
      }
      let child = node.children.find((ch) => ch.uci === uci)
      if (!child) { child = { san, uci, fen: c.fen(), children: [] }; node.children.push(child) }
      node = child
    }
  }
  return { root, cards: [...cards.values()] }
}

/** Walk to a random leaf, choosing opponent moves at random (weighted equally). Returns the path of nodes. */
export function randomLine(root: MoveNode, rnd = Math.random): MoveNode[] {
  const path: MoveNode[] = []
  let n = root
  while (n.children.length) { n = n.children[Math.floor(rnd() * n.children.length)]; path.push(n) }
  return path
}
