import { Link } from 'react-router-dom'
import { MOTIFS } from '@/config/themes'

const RESOURCES = [
  { name: 'Lichess Practice', url: 'https://lichess.org/practice', what: 'Free interactive endgame and tactics drills.' },
  { name: 'Lichess Studies', url: 'https://lichess.org/study', what: 'Build your own repertoire studies; drill them here.' },
  { name: 'Lichess Insights', url: 'https://lichess.org/insights', what: 'Where do you lose? Phase, opening, time trouble.' },
  { name: 'Chess.com Lessons', url: 'https://www.chess.com/lessons', what: 'Structured video courses by level.' },
  { name: 'Chessable', url: 'https://www.chessable.com', what: 'Spaced-repetition courses for openings and endgames.' },
  { name: 'ChessTempo', url: 'https://chesstempo.com', what: 'Rated tactics with mistake tracking.' },
  { name: 'Lucas Chess', url: 'https://lucaschess.pythonanywhere.com', what: 'Free desktop trainer: graded engines, training positions, offline.' },
  { name: 'Daniel Naroditsky speedruns', url: 'https://www.youtube.com/@DanielNaroditskyGM', what: 'Thinking explained move by move at every rating.' },
  { name: 'John Bartholomew — Climbing the Rating Ladder', url: 'https://www.youtube.com/@JohnBartholomewChess', what: 'Practical habits per rating band.' },
  { name: 'Chessbrah — Building Habits', url: 'https://www.youtube.com/@chessbrah', what: 'Rule-based play that scales with rating.' },
]
const BOOKS = [
  ['John Bain', 'Chess Tactics for Students', 'Motif-by-motif workbook, perfect foundation.'],
  ['Irving Chernev', 'Logical Chess: Move by Move', 'Every move of 33 games explained.'],
  ['Jeremy Silman', "Silman's Complete Endgame Course", 'Endgames organised by rating — learn only what you need now.'],
  ['Yasser Seirawan', 'Winning Chess Strategies / Tactics', 'Friendly, thorough, club-level.'],
  ['Axel Smith & Hans Tikkanen', 'The Woodpecker Method', 'Repeat a puzzle set in faster cycles to burn in patterns.'],
  ['Jesús de la Villa', '100 Endgames You Must Know', 'The theoretical set, compact.'],
]

export default function LibraryPage() {
  return (
    <div className="stack">
      <div className="page-head"><div><div className="eyebrow">Reference</div><h1>Library</h1></div></div>
      <div className="card">
        <h3>Tactical motifs</h3>
        <p className="muted" style={{ fontSize: 14 }}>In learning order. Tap one to drill it.</p>
        <ul className="list" style={{ marginTop: 10 }}>
          {MOTIFS.map((m, i) => <Link key={m.key} to={`/puzzles/${m.key}`} className="node available"><span className="mark mono" style={{ fontSize: 13 }}>{String(i + 1).padStart(2, '0')}</span><span><strong>{m.label}</strong><br /><span className="muted" style={{ fontSize: 14 }}>{m.blurb}</span></span></Link>)}
        </ul>
      </div>
      <Link to="/tricks" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
        <h3>⚡ Gambits & quick tricks</h3>
        <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>Légal's mate, the Fried Liver, the Stafford and Englund traps, the Elephant and Lasker traps, Noah's Ark, the Siberian trap, Evans / Danish / Smith-Morra / King's gambits and more — each with a step-through line and a test.</p>
      </Link>
      <div className="card">
        <h3>Weekly template (6–8 h)</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ marginTop: 8 }}>
            <thead><tr><th>Day</th><th>Device</th><th>Activity</th></tr></thead>
            <tbody>
              <tr><td>Mon</td><td>Mobile</td><td>20 min rated puzzles + 10 min Streak</td></tr>
              <tr><td>Tue</td><td>Desktop</td><td>1 rapid game 15+10 → review without engine, then with</td></tr>
              <tr><td>Wed</td><td>Mobile</td><td>15 min puzzles + 15 min opening drill</td></tr>
              <tr><td>Thu</td><td>Desktop</td><td>30 min endgame path + 10 min puzzles</td></tr>
              <tr><td>Fri</td><td>Mobile</td><td>20 min puzzles on your weakest motif</td></tr>
              <tr><td>Sat</td><td>Desktop</td><td>2 rapid games → review + one annotated master game</td></tr>
              <tr><td>Sun</td><td>Either</td><td>Check Progress, set next week's theme. Rest.</td></tr>
            </tbody>
          </table>
        </div>
        <p className="muted" style={{ fontSize: 14, marginTop: 8 }}>Bad day? 10 puzzles and one endgame position. Never zero.</p>
      </div>
      <div className="grid cols-2">
        <div className="card">
          <h3>Platforms & videos</h3>
          <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>{RESOURCES.map((r) => <li key={r.url} style={{ marginBottom: 6 }}><a href={r.url} target="_blank" rel="noreferrer">{r.name}</a> — <span className="muted">{r.what}</span></li>)}</ul>
        </div>
        <div className="card">
          <h3>Books</h3>
          <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>{BOOKS.map(([a, t, w]) => <li key={t} style={{ marginBottom: 6 }}><em>{t}</em> — {a}. <span className="muted">{w}</span></li>)}</ul>
        </div>
      </div>
    </div>
  )
}
