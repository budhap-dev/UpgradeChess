/** Thin UCI client around the Stockfish WASM worker. One instance per page; evaluations are cancellable. */
export interface EvalInfo { depth: number; cp?: number; mate?: number; pv: string[] }
export interface BestMove { bestmove: string; ponder?: string }

export class Engine {
  private worker: Worker | null = null
  private ready: Promise<void> | null = null
  private listeners = new Set<(line: string) => void>()
  private busy = false

  private boot(): Promise<void> {
    if (this.ready) return this.ready
    this.worker = new Worker('/engine/stockfish-18-lite-single.js')
    this.worker.onmessage = (e: MessageEvent<string>) => { for (const l of this.listeners) l(String(e.data)) }
    this.ready = new Promise<void>((resolve) => {
      const off = this.on((line) => { if (line === 'uciok') { off(); resolve() } })
      this.send('uci')
    })
    return this.ready
  }
  private on(fn: (line: string) => void) { this.listeners.add(fn); return () => this.listeners.delete(fn) }
  private send(cmd: string) { this.worker?.postMessage(cmd) }

  async setSkill(level: number) { await this.boot(); this.send(`setoption name Skill Level value ${Math.max(0, Math.min(20, level))}`) }
  async setElo(elo: number | null) {
    await this.boot()
    if (elo == null) this.send('setoption name UCI_LimitStrength value false')
    else { this.send('setoption name UCI_LimitStrength value true'); this.send(`setoption name UCI_Elo value ${Math.max(1320, Math.min(3190, elo))}`) }
  }

  /** Search a position. Resolves with the best move; `onInfo` streams evaluations. */
  async go(fen: string, opts: { depth?: number; movetimeMs?: number; onInfo?: (i: EvalInfo) => void } = {}): Promise<BestMove> {
    await this.boot()
    if (this.busy) { this.send('stop'); await new Promise((r) => setTimeout(r, 30)) }
    this.busy = true
    return new Promise<BestMove>((resolve) => {
      const off = this.on((line) => {
        if (line.startsWith('info ') && opts.onInfo && line.includes(' pv ')) {
          const depth = Number(/ depth (\d+)/.exec(line)?.[1] ?? 0)
          const cp = / score cp (-?\d+)/.exec(line)?.[1]
          const mate = / score mate (-?\d+)/.exec(line)?.[1]
          const pv = (/ pv (.+)$/.exec(line)?.[1] ?? '').split(' ')
          opts.onInfo({ depth, cp: cp != null ? Number(cp) : undefined, mate: mate != null ? Number(mate) : undefined, pv })
        }
        if (line.startsWith('bestmove')) {
          off(); this.busy = false
          const [, bestmove, , ponder] = line.split(' ')
          resolve({ bestmove, ponder })
        }
      })
      this.send(`position fen ${fen}`)
      if (opts.movetimeMs) this.send(`go movetime ${opts.movetimeMs}`)
      else this.send(`go depth ${opts.depth ?? 12}`)
    })
  }
  newGame() { this.send('ucinewgame') }
  stop() { this.send('stop') }
  dispose() { this.send('quit'); this.worker?.terminate(); this.worker = null; this.ready = null; this.listeners.clear() }
}

let shared: Engine | null = null
export function getEngine(): Engine { return (shared ??= new Engine()) }
