/**
 * Glicko-2 (Glickman 2012) — single-result update, used for the internal tactics rating.
 * Puzzles are treated as opponents with rating = puzzle rating and a fixed RD.
 */
export interface Glicko { rating: number; rd: number; vol: number }

const SCALE = 173.7178
const TAU = 0.5 // system constant — lower = less volatile
const EPS = 1e-6

export const DEFAULT_GLICKO: Glicko = { rating: 1500, rd: 350, vol: 0.06 }
export const PUZZLE_RD = 80

const g = (phi: number) => 1 / Math.sqrt(1 + (3 * phi * phi) / (Math.PI * Math.PI))
const E = (mu: number, muj: number, phij: number) => 1 / (1 + Math.exp(-g(phij) * (mu - muj)))

/** Update `player` after one result (1 = win/solved, 0 = loss/failed, 0.5 = draw) vs `opp`. */
export function updateGlicko(player: Glicko, opp: Glicko, score: 0 | 0.5 | 1): Glicko {
  const mu = (player.rating - 1500) / SCALE
  const phi = player.rd / SCALE
  const muj = (opp.rating - 1500) / SCALE
  const phij = opp.rd / SCALE
  const e = E(mu, muj, phij)
  const gj = g(phij)
  const v = 1 / (gj * gj * e * (1 - e))
  const delta = v * gj * (score - e)

  // volatility iteration (Illinois algorithm)
  const a = Math.log(player.vol * player.vol)
  const f = (x: number) => {
    const ex = Math.exp(x)
    const num = ex * (delta * delta - phi * phi - v - ex)
    const den = 2 * Math.pow(phi * phi + v + ex, 2)
    return num / den - (x - a) / (TAU * TAU)
  }
  let A = a
  let B: number
  if (delta * delta > phi * phi + v) B = Math.log(delta * delta - phi * phi - v)
  else {
    let k = 1
    while (f(a - k * TAU) < 0) k++
    B = a - k * TAU
  }
  let fA = f(A)
  let fB = f(B)
  let guard = 0
  while (Math.abs(B - A) > EPS && guard++ < 100) {
    const C = A + ((A - B) * fA) / (fB - fA)
    const fC = f(C)
    if (fC * fB <= 0) { A = B; fA = fB } else fA /= 2
    B = C; fB = fC
  }
  const newVol = Math.exp(A / 2)
  const phiStar = Math.sqrt(phi * phi + newVol * newVol)
  const newPhi = 1 / Math.sqrt(1 / (phiStar * phiStar) + 1 / v)
  const newMu = mu + newPhi * newPhi * gj * (score - e)
  return { rating: Math.round((newMu * SCALE + 1500) * 100) / 100, rd: Math.round(newPhi * SCALE * 100) / 100, vol: newVol }
}

/** Expected probability that `player` solves a puzzle of `puzzleRating`. */
export function expectedScore(player: Glicko, puzzleRating: number): number {
  return E((player.rating - 1500) / SCALE, (puzzleRating - 1500) / SCALE, PUZZLE_RD / SCALE)
}
