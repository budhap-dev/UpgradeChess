#!/usr/bin/env node
// Builds public/data/puzzles.json — an offline starter pack from the Lichess puzzle API (CC0).
// Usage: node scripts/build-puzzle-pack.mjs [perTheme=40]
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs'
import { Chess } from 'chess.js'

const THEMES = ['mix', 'hangingPiece', 'fork', 'pin', 'skewer', 'discoveredAttack', 'doubleCheck', 'backRankMate', 'mateIn1', 'mateIn2', 'deflection', 'attraction', 'sacrifice', 'zwischenzug', 'trappedPiece', 'advancedPawn', 'endgame', 'rookEndgame', 'pawnEndgame', 'opening', 'middlegame']
const per = Number(process.argv[2] ?? 40)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function convert(p) {
  const chess = new Chess()
  const moves = p.game.pgn.trim().split(/\s+/)
  for (let i = 0; i < p.puzzle.initialPly; i++) chess.move(moves[i])
  const fen = chess.fen()
  const mv = chess.move(moves[p.puzzle.initialPly])
  return { id: p.puzzle.id, fen, opponentMove: mv.from + mv.to + (mv.promotion ?? ''), solution: p.puzzle.solution, rating: p.puzzle.rating, themes: p.puzzle.themes, sideToMove: chess.turn(), gameId: p.game.id }
}

const OUT = 'public/data/puzzles.json'
const seen = new Map()
if (existsSync(OUT)) for (const p of JSON.parse(readFileSync(OUT, 'utf8'))) seen.set(p.id, p)
console.log('existing', seen.size)
async function getBatch(theme) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const r = await fetch(`https://lichess.org/api/puzzle/batch/${theme}?nb=${per}`, { headers: { Accept: 'application/json', 'User-Agent': 'UpgradeChess pack builder' } })
    if (r.ok) return (await r.json()).puzzles
    const wait = Math.max(65, Number(r.headers.get('retry-after') || 0) + 5)
    console.error(theme, r.status, `backing off ${wait}s`)
    await sleep(wait * 1000)
  }
  return []
}
function save() { mkdirSync('public/data', { recursive: true }); writeFileSync(OUT, JSON.stringify([...seen.values()].sort((a, b) => a.rating - b.rating))) }
for (const theme of THEMES) {
  try {
    const puzzles = await getBatch(theme)
    let n = 0
    for (const p of puzzles) { try { const c = convert(p); if (!seen.has(c.id)) { seen.set(c.id, c); n++ } } catch (e) { console.error('skip', p.puzzle?.id, e.message) } }
    console.log(theme.padEnd(18), n, 'new', '| total', seen.size)
  } catch (e) { console.error(theme, e.message) }
  save()
  await sleep(8000)
}
save()
console.log('wrote', OUT, seen.size, 'puzzles')
