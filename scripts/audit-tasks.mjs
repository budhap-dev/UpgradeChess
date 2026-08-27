#!/usr/bin/env node
// Engine audit for hand-authored content: every lesson/trick task's expected solver move must be
// Stockfish-best at depth 16 (or within 60cp, for "a winning move" tasks with an accept list).
// Usage: node scripts/audit-tasks.mjs   (exits 1 if anything is suspicious)
import { execSync, spawn } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const tmp = mkdtempSync(join(tmpdir(), 'uc-audit-'))
execSync(`npx esbuild --bundle src/features/path/curriculum.ts --format=esm --outfile=${tmp}/cur.mjs`, { stdio: 'inherit' })
execSync(`npx esbuild --bundle src/features/tricks/tricks.ts --format=esm --outfile=${tmp}/tricks.mjs`, { stdio: 'inherit' })
const { Chess } = await import('chess.js')
const { CURRICULUM } = await import(`${tmp}/cur.mjs`)
const { TRICKS } = await import(`${tmp}/tricks.mjs`)

const engine = spawn('node', ['node_modules/stockfish/bin/stockfish-18-lite-single.js'])
const lines = []
engine.stdout.on('data', (d) => lines.push(...d.toString().split('\n')))
const send = (c) => engine.stdin.write(c + '\n')
const until = async (pred) => { for (;;) { const i = lines.findIndex(pred); if (i >= 0) { const l = lines[i]; lines.length = 0; return l } await new Promise((r) => setTimeout(r, 30)) } }
send('uci'); await until((l) => l === 'uciok')

async function evalMove(fen, uci) {
  send(`position fen ${fen} moves ${uci}`); send('go depth 16')
  let last = 0, mate = null
  for (;;) {
    await new Promise((r) => setTimeout(r, 20))
    for (const l of lines) { const cp = / score cp (-?\d+)/.exec(l); const m = / score mate (-?\d+)/.exec(l); if (cp) { last = +cp[1]; mate = null } if (m) mate = +m[1] }
    if (lines.some((l) => l.startsWith('bestmove'))) { lines.length = 0; break }
  }
  const v = mate != null ? (mate > 0 ? 10000 - Math.abs(mate) : -10000 + Math.abs(mate)) : last
  return -v
}
async function best(fen) { send(`position fen ${fen}`); send('go depth 16'); return (await until((x) => x.startsWith('bestmove'))).split(' ')[1] }

const tasks = []
for (const n of CURRICULUM) for (const [i, st] of (n.steps ?? []).entries()) if (st.task) tasks.push({ id: `${n.id}#${i}`, fen: st.task.fen, moves: st.task.solution, accept: st.task.accept })
for (const t of TRICKS) if (t.task) { const c = new Chess(); const sans = t.line.split(' '); for (let i = 0; i < t.task.ply; i++) c.move(sans[i]); tasks.push({ id: `trick:${t.id}`, fen: c.fen(), moves: t.task.solution, accept: t.task.accept }) }

let bad = 0
for (const t of tasks) {
  let fen = t.fen
  const verdicts = []
  for (let i = 0; i < t.moves.length; i++) {
    const u = t.moves[i]
    if (i % 2 === 0) {
      const b = await best(fen)
      if (b !== u && !(t.accept ?? []).includes(b)) {
        const evB = await evalMove(fen, b), evU = await evalMove(fen, u)
        if (evB - evU > 60) verdicts.push(`ply${i}: expected ${u} (${evU}) but engine prefers ${b} (${evB})`)
      }
    }
    const c = new Chess(fen); c.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] }); fen = c.fen()
  }
  if (verdicts.length) { bad++; console.log('⚠', t.id, '|', verdicts.join(' ; ')) }
}
console.log(`audited ${tasks.length} tasks, ${bad} suspicious`)
rmSync(tmp, { recursive: true, force: true })
engine.kill()
process.exit(bad ? 1 : 0)
