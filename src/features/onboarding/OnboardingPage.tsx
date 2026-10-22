import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSettings } from '@/shared/hooks/useSettings'
import { usePlayerRating } from '@/shared/hooks/usePlayerRating'
import { useLichessRatings, useChesscomRatings } from '@/features/progress/useExternalRatings'
import { PuzzleTrainer } from '@/features/puzzles/PuzzleTrainer'
import { nextRecommended } from '@/features/path/progression'
import { CURRICULUM } from '@/features/path/curriculum'
import { BOARD_THEMES } from '@/config/boardThemes'
import { Icon } from '@/shared/ui/Icon'

const CALIBRATION_PUZZLES = 10
type Step = 'welcome' | 'accounts' | 'calibrate' | 'preferences' | 'done'
const ORDER: Step[] = ['welcome', 'accounts', 'calibrate', 'preferences', 'done']

export function bandFor(rapid: number | undefined, tactics: number) {
  const r = rapid ?? tactics - 200
  if (r < 1200) return { name: 'Foundation', note: 'Board vision, hanging pieces, one-move tactics and basic mates come first.' }
  if (r < 1600) return { name: 'Club', note: '2–3 move tactics, simple plans, king-and-pawn and rook endings.' }
  if (r < 2000) return { name: 'Strong club', note: 'Calculation depth, prophylaxis, theoretical endings and a real repertoire.' }
  return { name: 'Expert', note: 'Deep preparation, positional nuance, complex endings.' }
}

export default function OnboardingPage() {
  const nav = useNavigate()
  const [settings, update] = useSettings()
  const tactics = usePlayerRating('tactics')
  const [step, setStep] = useState<Step>('welcome')
  const [li, setLi] = useState(settings.lichessUser)
  const [cc, setCc] = useState(settings.chesscomUser)
  const [checkLi, setCheckLi] = useState('')
  const [checkCc, setCheckCc] = useState('')
  const liQ = useLichessRatings(checkLi)
  const ccQ = useChesscomRatings(checkCc)
  const [done, setDone] = useState(0)
  const [solvedCount, setSolvedCount] = useState(0)
  useEffect(() => { setLi(settings.lichessUser); setCc(settings.chesscomUser) }, [settings.lichessUser, settings.chesscomUser])

  const idx = ORDER.indexOf(step)
  const next = () => setStep(ORDER[Math.min(ORDER.length - 1, idx + 1)])
  const back = () => setStep(ORDER[Math.max(0, idx - 1)])
  const rapid = liQ.data && !liQ.data.notFound ? liQ.data.rows.find((r) => r.perf === 'rapid')?.rating : undefined
  const band = bandFor(rapid, tactics.rating)
  const recs = nextRecommended({ progress: [], attempts: [], dueCards: 0, nodes: CURRICULUM }).slice(0, 3)

  const saveAccounts = async () => { await update({ lichessUser: li.trim(), chesscomUser: cc.trim() }); next() }
  const finish = async () => { await update({ onboarded: true }); nav('/') }

  return (
    <div className="stack" style={{ maxWidth: 720, margin: '0 auto' }}>
      <div className="steps" role="progressbar" aria-label="Setup progress" aria-valuemin={1} aria-valuemax={ORDER.length} aria-valuenow={idx + 1}>{ORDER.map((s, i) => <span key={s} className={i <= idx ? 'on' : ''} />)}</div>

      {step === 'welcome' && (
        <div className="card stack">
          <div className="eyebrow">Welcome</div>
          <h1>Let's find your starting point.</h1>
          <p>Three minutes: connect your online accounts (optional), solve ten calibration puzzles so the tactics rating settles, and pick a couple of preferences. Then the learning path is set to your level.</p>
          <ul style={{ margin: 0, paddingLeft: 20 }} className="muted">
            <li>Everything stays on this device — no sign-up.</li>
            <li>You can rerun this from Settings at any time.</li>
          </ul>
          <div className="row"><button className="btn primary" onClick={next}>Start <Icon name="arrow-right" size={18} /></button><Link className="btn ghost" to="/" onClick={() => update({ onboarded: true })}>Skip for now</Link></div>
        </div>
      )}

      {step === 'accounts' && (
        <div className="card stack">
          <div className="eyebrow">Step 1 · Accounts</div>
          <h2>Where do you play?</h2>
          <p className="muted">Public usernames only. We read ratings from the open APIs and snapshot them daily so you can watch the trend.</p>
          <label className="field">Lichess username<div className="row nowrap"><input className="input" value={li} onChange={(e) => setLi(e.target.value)} placeholder="username" autoComplete="off" /><button className="btn" onClick={() => setCheckLi(li.trim())} disabled={!li.trim()}>Check</button></div></label>
          {checkLi && liQ.isLoading && <p className="muted">Looking up {checkLi}…</p>}
          {liQ.data?.notFound && <p className="bad">No Lichess user "{checkLi}".</p>}
          {liQ.data && !liQ.data.notFound && <p className="row">{liQ.data.rows.slice(0, 4).map((r) => <span key={r.perf} className="pill mono" style={{ textTransform: 'capitalize' }}>{r.perf} {r.rating}</span>)}</p>}
          <label className="field">Chess.com username<div className="row nowrap"><input className="input" value={cc} onChange={(e) => setCc(e.target.value)} placeholder="optional" autoComplete="off" /><button className="btn" onClick={() => setCheckCc(cc.trim())} disabled={!cc.trim()}>Check</button></div></label>
          {ccQ.data?.notFound && <p className="bad">No Chess.com user "{checkCc}".</p>}
          {ccQ.data && !ccQ.data.notFound && <p className="row">{ccQ.data.rows.length ? ccQ.data.rows.slice(0, 4).map((r) => <span key={r.perf} className="pill mono" style={{ textTransform: 'capitalize' }}>{r.perf} {r.rating}</span>) : <span className="muted">Found, no rated games yet.</span>}</p>}
          <div className="row"><button className="btn ghost" onClick={back}><Icon name="arrow-left" size={18} />Back</button><button className="btn primary" onClick={saveAccounts}>{li.trim() || cc.trim() ? 'Save & continue' : 'Continue without accounts'} <Icon name="arrow-right" size={18} /></button></div>
        </div>
      )}

      {step === 'calibrate' && (
        <div className="stack">
          <div className="card">
            <div className="eyebrow">Step 2 · Calibration</div>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <span className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
                <button className="icon-btn plain" onClick={back} aria-label="Back" title="Back"><Icon name="chevron-left" /></button>
                <h2>Solve {CALIBRATION_PUZZLES} puzzles</h2>
              </span>
              <span className="row" style={{ gap: 6 }}>
                <span className="pill accent mono">{Math.min(done, CALIBRATION_PUZZLES)}/{CALIBRATION_PUZZLES} · rating {Math.round(tactics.rating)} ± {Math.round(tactics.rd)}</span>
                {done < CALIBRATION_PUZZLES && <button className="btn sm ghost" onClick={next}>Skip <Icon name="arrow-right" size={16} /></button>}
              </span>
            </div>
            <p className="muted" style={{ marginTop: 4 }}>Take your time and calculate — these are rated, so each result moves your tactics rating a lot while it's still uncertain.</p>
            <div className="progress" style={{ marginTop: 8 }}><span style={{ width: `${(Math.min(done, CALIBRATION_PUZZLES) / CALIBRATION_PUZZLES) * 100}%` }} /></div>
          </div>
          {done < CALIBRATION_PUZZLES ? (
            <PuzzleTrainer mode="rated" options={{ onResult: (s) => { setDone((d) => d + 1); if (s) setSolvedCount((c) => c + 1) } }} autoAdvanceMs={900} />
          ) : (
            <div className="card stack">
              <h3>Calibration done — {solvedCount}/{CALIBRATION_PUZZLES} solved.</h3>
              <p>Your tactics rating is <strong>{Math.round(tactics.rating)}</strong> (± {Math.round(tactics.rd)}). It keeps refining as you solve.</p>
              <div className="row"><button className="btn primary" onClick={next}>Continue <Icon name="arrow-right" size={18} /></button></div>
            </div>
          )}
        </div>
      )}

      {step === 'preferences' && (
        <div className="card stack">
          <div className="eyebrow">Step 3 · Preferences</div>
          <h2>A few preferences</h2>
          <label className="field">Show estimated ratings as
            <select className="input" value={settings.ratingSystem} onChange={(e) => update({ ratingSystem: e.target.value as 'lichess' | 'chesscom' | 'fide' })}><option value="lichess">Lichess</option><option value="chesscom">Chess.com</option><option value="fide">FIDE</option></select>
          </label>
          <div>
            <div className="eyebrow" style={{ marginBottom: 6 }}>Board colours</div>
            <div className="row" role="radiogroup" aria-label="Board colours">{BOARD_THEMES.map((t) => <button key={t.id} role="radio" aria-checked={settings.boardTheme === t.id} title={t.name} onClick={() => update({ boardTheme: t.id })} className="swatch" style={{ outline: settings.boardTheme === t.id ? undefined : '1px solid var(--line)', background: `conic-gradient(${t.light} 0 25%, ${t.dark} 0 50%, ${t.light} 0 75%, ${t.dark} 0)` }}><span className="sr-only">{t.name}</span></button>)}</div>
          </div>
          <label className="check"><input type="checkbox" checked={settings.sounds} onChange={(e) => update({ sounds: e.target.checked })} /> Move sounds</label>
          <label className="check"><input type="checkbox" checked={settings.boardFlipAuto} onChange={(e) => update({ boardFlipAuto: e.target.checked })} /> Orient the board to the side to move in puzzles</label>
          <p className="muted" style={{ fontSize: 13 }}>More (piece sets, theme, animations) in Settings.</p>
          <div className="row"><button className="btn ghost" onClick={back}><Icon name="arrow-left" size={18} />Back</button><button className="btn primary" onClick={next}>Continue <Icon name="arrow-right" size={18} /></button></div>
        </div>
      )}

      {step === 'done' && (
        <div className="card stack">
          <div className="eyebrow">Ready</div>
          <h1>You're in the <span style={{ color: 'var(--accent)' }}>{band.name}</span> band.</h1>
          <p>{band.note}</p>
          <div className="row">
            <span className="pill accent mono">Tactics {Math.round(tactics.rating)}</span>
            {rapid && <span className="pill mono">Lichess rapid {rapid}</span>}
          </div>
          <div>
            <div className="eyebrow" style={{ marginBottom: 6 }}>Start here</div>
            <ul className="list">{recs.map((r) => <li key={r.id} className="node available"><span className="mark"><Icon name={r.icon} size={20} /></span><span className="body"><span className="title">{r.title}</span><span className="desc">{r.reason}</span></span></li>)}</ul>
          </div>
          <p className="muted" style={{ fontSize: 14 }}>Daily goal: 15 puzzles + 1 lesson or drill. Review every loss. Bad day? 10 puzzles and one endgame — never zero.</p>
          <div className="row"><button className="btn primary" onClick={finish}>Go to my dashboard <Icon name="arrow-right" size={18} /></button></div>
        </div>
      )}
    </div>
  )
}
