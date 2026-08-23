// Copies the Stockfish lite single-threaded build into public/engine (run before dev/build).
import { copyFileSync, mkdirSync, existsSync } from 'node:fs'
const src = 'node_modules/stockfish/bin'
mkdirSync('public/engine', { recursive: true })
for (const f of ['stockfish-18-lite-single.js', 'stockfish-18-lite-single.wasm']) {
  if (!existsSync(`public/engine/${f}`)) { copyFileSync(`${src}/${f}`, `public/engine/${f}`); console.log('copied', f) }
}
