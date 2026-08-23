// End-to-end smoke test: run `npm run build && npm run preview` first, then `node e2e/smoke.mjs`.
// Exercises: settings → live Lichess ratings, lesson task (tap-to-move), engine reply, opening drill, rated puzzle solve → rating/XP.
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'

const base = process.env.BASE_URL ?? 'http://localhost:4199'
const pack = JSON.parse(readFileSync(new URL('../public/data/puzzles.json', import.meta.url), 'utf8'))
const byId = new Map(pack.map((p) => [p.id, p]))
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } })
const errors = []
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()) })
const text = async () => (await page.textContent('main')).replace(/\s+/g, ' ')
const tap = async (from, to) => { await page.click(`[data-square="${from}"]`); await page.waitForTimeout(120); await page.click(`[data-square="${to}"]`) }
let failures = 0
const check = (name, ok, extra = '') => { console.log(`${ok ? '✓' : '✗'} ${name} ${extra}`); if (!ok) failures++ }

await page.goto(base + '/settings'); await page.fill('input[placeholder="e.g. BudhaP"]', 'BudhaP'); await page.click('text=Save'); await page.waitForTimeout(500)
await page.goto(base + '/progress'); await page.waitForTimeout(3500)
check('Lichess ratings render', /Rapid\s*\d{3,4}/i.test(await text()))

await page.goto(base + '/path/t-hanging'); await page.waitForTimeout(600)
await page.click('text=Next'); await page.click('text=Next'); await page.waitForTimeout(400)
await tap('f3', 'g5'); await page.waitForTimeout(500)
check('Lesson task accepts the right move', (await text()).includes('✓'))

await page.goto(base + '/play'); await page.waitForTimeout(600)
await tap('e2', 'e4'); await page.waitForTimeout(6000)
check('Engine replies', /1\. e4 \S+/.test(await text()), /1\. e4 \S+/.exec(await text())?.[0])

await page.goto(base + '/openings/italian'); await page.waitForTimeout(800)
await tap('e2', 'e4'); await page.waitForTimeout(1200)
check('Opening drill plays opponent reply', /1\. e4 \S+/.test(await text()))

await page.goto(base + '/puzzles')
await page.waitForSelector('[data-status="solving"]', { timeout: 15000 })
const id = await page.getAttribute('.board-wrap', 'data-puzzle-id')
const pz = byId.get(id)
if (pz) {
  for (let i = 0; i < pz.solution.length; i += 2) { await tap(pz.solution[i].slice(0, 2), pz.solution[i].slice(2, 4)); await page.waitForTimeout(700) }
  await page.waitForSelector('[data-status="solved"], [data-status="failed"]')
  const t = await text()
  check('Rated puzzle solved with rating + XP', (await page.getAttribute('.board-wrap', 'data-status')) === 'solved' && /[+-]\d+ rating/.test(t) && /\+\d+ XP/.test(t), /[+-]\d+ rating/.exec(t)?.[0])
} else console.log('· puzzle came from Lichess online, skipping solve check')

// Game review: paste a PGN, analyse with the engine, quiz, mark reviewed
const PGN = '[White "Me"]\n[Black "Opp"]\n[Result "0-1"]\n\n1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. Ng5 d5 5. exd5 Nxd5 6. Nxf7 Kxf7 7. Qf3+ Ke6 8. Nc3 Nb4 9. a3 Nxc2+ 10. Kd1 Nxa1 11. Nxd5 Kd6 12. d4 Qe8 13. Bf4 exf4 14. Re1 Qd7 15. Qe4 Kc6 16. Qxf4 Bd6 17. Qxa1 Re8 0-1'
await page.goto(base + '/review'); await page.waitForTimeout(500)
await page.click('text=Paste PGN'); await page.fill('textarea', PGN); await page.click('text=Add game'); await page.waitForTimeout(500)
await page.click('text=vs Opp'); await page.waitForTimeout(500)
await page.click('text=Analyse with engine'); await page.waitForSelector('text=Guess the moves', { timeout: 180000 })
check('Engine analysis finds blunders', /\d+ \?\?/.test(await text()))
await page.click('text=Guess the moves'); await page.waitForTimeout(400); await page.click('text=Show answer'); await page.waitForTimeout(300)
check('Quiz reveals best move + category', /Engine preferred \S+/.test(await text()) && /Category:/.test(await text()))
await page.click('text=Exit quiz'); await page.click('text=Mark reviewed'); await page.waitForTimeout(400)
check('Game marked reviewed', (await text()).includes('Reviewed ✓'))

// Storm: start, solve a couple from the pack, verify counter
await page.goto(base + '/puzzles?mode=storm'); await page.waitForTimeout(500); await page.click('text=Start storm')
for (let r = 0; r < 2; r++) {
  await page.waitForSelector('[data-status="solving"]', { timeout: 15000 })
  const sid = await page.getAttribute('.board-wrap', 'data-puzzle-id'); const sp = byId.get(sid); if (!sp) break
  for (let i = 0; i < sp.solution.length; i += 2) { await tap(sp.solution[i].slice(0, 2), sp.solution[i].slice(2, 4)); await page.waitForTimeout(600) }
  await page.waitForTimeout(800)
}
check('Storm counts solves', Number(/(\d+)\s*solved · combo/.exec(await text())?.[1] ?? 0) >= 1, /\d+\s*solved · combo \d+/.exec(await text())?.[0])

// Woodpecker: create set and start a cycle
await page.goto(base + '/puzzles?mode=woodpecker'); await page.waitForTimeout(500)
await page.click('text=Create my set'); await page.waitForTimeout(800); await page.click('text=Start cycle 1')
await page.waitForSelector('[data-status="solving"]', { timeout: 15000 })
check('Woodpecker cycle starts', /Cycle 1 · 0\/60/.test(await text()))

await page.goto(base + '/badges'); await page.waitForTimeout(800)
check('Badges page shows earned badges', /First blood/.test(await text()) && /\d+\/\d+/.test(await text()))

// Tricks: open Légal's mate, test me, play Nxe5
await page.goto(base + '/tricks/legal'); await page.waitForTimeout(600)
await page.click('text=Test me'); await page.waitForTimeout(300)
await tap('f3', 'e5'); await page.waitForTimeout(500)
check('Trick test accepts key move', (await text()).includes('✓ Exactly'))
await page.goto(base + '/tricks'); await page.waitForTimeout(500)
check('Tricks list shows tested count', /1\/\d+ tested/.test(await text()))

// Appearance: pick a board theme + piece set, verify the board uses them; mobile More sheet
await page.goto(base + '/settings'); await page.waitForTimeout(500)
await page.click('[title="Walnut"]'); await page.click('[title="Merida"]'); await page.waitForTimeout(300)
await page.goto(base + '/play'); await page.waitForTimeout(600)
const sqBg = await page.evaluate(() => getComputedStyle(document.querySelector('[data-square="a1"]')).backgroundColor)
const hasImg = await page.evaluate(() => !!document.querySelector('[data-square="e1"] img[src*="/pieces/merida/"]'))
check('Board theme + piece set applied', sqBg === 'rgb(181, 136, 99)' && hasImg, `${sqBg} img:${hasImg}`)
const mob = await browser.newPage({ viewport: { width: 390, height: 664 }, isMobile: true, hasTouch: true })
await mob.goto(base + '/puzzles'); await mob.waitForSelector('[data-status="solving"]', { timeout: 15000 })
const fits = await mob.evaluate(() => { const b = document.querySelector('.trainer-board').getBoundingClientRect(); const s = document.querySelector('.trainer-status').getBoundingClientRect(); return s.bottom <= b.top && b.bottom <= window.innerHeight - 56 })
check('Mobile: status above board, board fully visible', fits)
await mob.click('text=More'); await mob.waitForTimeout(300)
check('Mobile: More sheet opens with Settings', await mob.isVisible('#more-sheet >> text=Settings'))
await mob.close()

check('No page errors', errors.length === 0, errors.join(' | '))
await browser.close()
process.exit(failures ? 1 : 0)
