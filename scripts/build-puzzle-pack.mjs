#!/usr/bin/env node
// Builds public/data/puzzles.json — an offline starter pack sampled from the Lichess puzzle database (CC0).
// Streams the .zst dump through the `zstd` CLI (Node's decoder rejects the dump's leading skippable frame),
// stops after `scanLines`, samples stratified by rating band and theme.
// Usage: node scripts/build-puzzle-pack.mjs [target=3000] [scanLines=500000] [localCsvPath]
//   (or: curl -s https://database.lichess.org/lichess_db_puzzle.csv.zst | zstd -dc | head -n 500000 > puzzles.csv)
import { spawn } from 'node:child_process'
import { createReadStream, writeFileSync, mkdirSync } from 'node:fs'
import { createInterface } from 'node:readline'

const TARGET = Number(process.argv[2] ?? 3000)
const SCAN = Number(process.argv[3] ?? 500_000)
const LOCAL = process.argv[4]
const THEMES = ['hangingPiece', 'fork', 'pin', 'skewer', 'discoveredAttack', 'doubleCheck', 'backRankMate', 'mateIn1', 'mateIn2', 'deflection', 'attraction', 'sacrifice', 'intermezzo', 'trappedPiece', 'advancedPawn', 'endgame', 'rookEndgame', 'pawnEndgame', 'queenEndgame', 'knightEndgame', 'bishopEndgame', 'opening', 'middlegame', 'quietMove', 'defensiveMove', 'promotion', 'exposedKing', 'kingsideAttack', 'mateIn3']
const BANDS = [[0, 900], [900, 1200], [1200, 1500], [1500, 1800], [1800, 2100], [2100, 2400], [2400, 3500]]
const perTheme = Math.ceil(TARGET / 12), perBand = Math.ceil(TARGET / BANDS.length)

const proc = LOCAL ? null : spawn('sh', ['-c', 'curl -s https://database.lichess.org/lichess_db_puzzle.csv.zst | zstd -dc'], { stdio: ['ignore', 'pipe', 'inherit'] })
const rl = createInterface({ input: LOCAL ? createReadStream(LOCAL) : proc.stdout })
const chosen = new Map()
const themeCount = Object.fromEntries(THEMES.map((t) => [t, 0]))
const bandCount = BANDS.map(() => 0)
let lines = 0
for await (const line of rl) {
  if (lines++ === 0) continue // header
  if (lines > SCAN) break
  const [id, fen, moves, ratingS, rdS, popS, playsS, themesS, gameUrl] = line.split(',')
  const rating = +ratingS, rd = +rdS, pop = +popS, plays = +playsS
  if (rd > 90 || pop < 60 || plays < 300) continue
  const themes = themesS.split(' ')
  const bi = BANDS.findIndex(([lo, hi]) => rating >= lo && rating < hi)
  if (bi < 0) continue
  const need = themes.filter((t) => t in themeCount && themeCount[t] < perTheme)
  if (!need.length) continue
  const rare = need.some((t) => themeCount[t] < perTheme / 3)
  if (bandCount[bi] >= perBand && !rare) continue
  const mv = moves.split(' ')
  const sideToMove = fen.split(' ')[1] === 'w' ? 'b' : 'w' // opponent moves first, then solver
  chosen.set(id, { id, fen, opponentMove: mv[0], solution: mv.slice(1), rating, themes, sideToMove, gameId: gameUrl?.split('/')[3]?.split('#')[0] })
  bandCount[bi]++
  for (const t of need) themeCount[t]++
  if (chosen.size >= TARGET) break
}
rl.close(); proc?.kill()
mkdirSync('public/data', { recursive: true })
const list = [...chosen.values()].sort((a, b) => a.rating - b.rating)
writeFileSync('public/data/puzzles.json', JSON.stringify(list))
console.log(`scanned ${lines} lines → ${list.length} puzzles, ${(JSON.stringify(list).length / 1024).toFixed(0)} kB`)
console.log('bands', bandCount.join('/'), '| themes', Object.entries(themeCount).map(([t, n]) => `${t}:${n}`).join(' '))
process.exit(0)
