#!/usr/bin/env node
// Fetch public ratings from Lichess and Chess.com by username (no API key needed).
// Usage: node scripts/ratings.mjs <lichessUser> [chesscomUser]
const [, , lichessUser, chesscomUser = lichessUser] = process.argv;
if (!lichessUser) { console.error('usage: node scripts/ratings.mjs <lichessUser> [chesscomUser]'); process.exit(1); }

const UA = 'UpgradeChess/0.1 (https://github.com/BudhadityaP/UpgradeChess)';

async function lichess(user) {
  const r = await fetch(`https://lichess.org/api/user/${encodeURIComponent(user)}`, { headers: { Accept: 'application/json' } });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`lichess ${r.status}`);
  const d = await r.json();
  return Object.fromEntries(Object.entries(d.perfs ?? {}).map(([k, v]) => [k, { rating: v.rating, rd: v.rd, games: v.games, prog: v.prog, provisional: !!v.prov }]));
}

async function chesscom(user) {
  const r = await fetch(`https://api.chess.com/pub/player/${encodeURIComponent(user.toLowerCase())}/stats`, { headers: { 'User-Agent': UA } });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`chess.com ${r.status}`);
  const d = await r.json();
  const out = {};
  for (const [k, v] of Object.entries(d)) {
    if (v?.last?.rating) out[k.replace(/^chess_/, '')] = { rating: v.last.rating, rd: v.last.rd, best: v.best?.rating, record: v.record };
    else if (k === 'tactics' && v?.highest) out.puzzles = { best: v.highest.rating };
    else if (k === 'puzzle_rush' && v?.best) out.puzzle_rush = { best: v.best.score };
  }
  return out;
}

const [li, cc] = await Promise.all([lichess(lichessUser), chesscom(chesscomUser)]);
console.log(`\nLichess — ${lichessUser}`);
console.table(li ?? { error: 'user not found' });
console.log(`\nChess.com — ${chesscomUser}`);
console.table(cc && Object.keys(cc).length ? cc : { note: cc ? 'no rated games' : 'user not found' });
