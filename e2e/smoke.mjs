// End-to-end smoke test: run `npm run build && npm run preview` first, then `node e2e/smoke.mjs`.
// Exercises: settings → live Lichess ratings, lesson task (tap-to-move), engine reply, opening drill, rated puzzle solve → rating/XP.
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'

const base = process.env.BASE_URL ?? 'http://localhost:4173'
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

check('No page errors', errors.length === 0, errors.join(' | '))
await browser.close()
process.exit(failures ? 1 : 0)
