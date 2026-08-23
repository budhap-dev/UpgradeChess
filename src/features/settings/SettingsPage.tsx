import { useState } from 'react'
import { useSettings } from '@/shared/hooks/useSettings'
import { db } from '@/shared/db/db'
import { useToast } from '@/shared/ui/toastStore'
import { Board } from '@/shared/ui/Board'
import { BOARD_THEMES, PIECE_SETS, pieceUrl } from '@/config/boardThemes'
import { sfx } from '@/shared/ui/sound'

export default function SettingsPage() {
  const [settings, update] = useSettings()
  const show = useToast((t) => t.show)
  const [li, setLi] = useState<string | null>(null)
  const [cc, setCc] = useState<string | null>(null)
  const liVal = li ?? settings.lichessUser
  const ccVal = cc ?? settings.chesscomUser

  const save = async () => { await update({ lichessUser: liVal.trim(), chesscomUser: ccVal.trim(), onboarded: true }); show('Saved') }
  const reset = async () => {
    if (!confirm('Delete all local progress (XP, ratings, attempts)? This cannot be undone.')) return
    await Promise.all([db.xpEvents.clear(), db.puzzleAttempts.clear(), db.playerRating.clear(), db.externalRatings.clear(), db.progress.clear(), db.srsCards.clear(), db.badges.clear()])
    show('Progress reset')
  }
  const exportData = async () => {
    const dump = { exportedAt: new Date().toISOString(), xpEvents: await db.xpEvents.toArray(), puzzleAttempts: await db.puzzleAttempts.toArray(), playerRating: await db.playerRating.toArray(), externalRatings: await db.externalRatings.toArray(), progress: await db.progress.toArray(), srsCards: await db.srsCards.toArray(), settings: await db.settings.toArray() }
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `upgradechess-${Date.now()}.json`; a.click()
  }

  return (
    <div className="stack" style={{ maxWidth: 640 }}>
      <div className="page-head"><div><div className="eyebrow">Profile</div><h1>Settings</h1></div></div>
      <div className="card stack">
        <label>Lichess username<input className="input" value={liVal} onChange={(e) => setLi(e.target.value)} placeholder="e.g. BudhaP" /></label>
        <label>Chess.com username<input className="input" value={ccVal} onChange={(e) => setCc(e.target.value)} placeholder="optional" /></label>
        <label>Show estimated ratings as
          <select className="input" value={settings.ratingSystem} onChange={(e) => update({ ratingSystem: e.target.value as 'lichess' | 'chesscom' | 'fide' })}>
            <option value="lichess">Lichess</option><option value="chesscom">Chess.com</option><option value="fide">FIDE</option>
          </select>
        </label>
        <p className="muted" style={{ fontSize: 14 }}>Public profiles only — ratings are read from the open APIs and snapshotted daily on this device. No passwords, no login.</p>
        <button className="btn primary" onClick={save}>Save</button>
      </div>
      <div className="card stack">
        <h3>Board & pieces</h3>
        <div className="board-wrap" style={{ maxWidth: 260, margin: 0 }}><Board fen="r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4" interactive={false} lastMove={{ from: 'd1', to: 'h5' }} id="preview" animationMs={0} /></div>
        <div>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Board colours</div>
          <div className="row" role="radiogroup" aria-label="Board colours">
            {BOARD_THEMES.map((t) => (
              <button key={t.id} role="radio" aria-checked={settings.boardTheme === t.id} title={t.name} onClick={() => update({ boardTheme: t.id })} className="swatch" style={{ outline: settings.boardTheme === t.id ? '3px solid var(--accent)' : '1px solid var(--line)', background: `conic-gradient(${t.light} 0 25%, ${t.dark} 0 50%, ${t.light} 0 75%, ${t.dark} 0)` }}>
                <span className="sr-only">{t.name}</span>
              </button>
            ))}
          </div>
          <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>{BOARD_THEMES.find((t) => t.id === settings.boardTheme)?.name}</p>
        </div>
        <div>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Piece set</div>
          <div className="row" role="radiogroup" aria-label="Piece set">
            {PIECE_SETS.map((p) => (
              <button key={p.id} role="radio" aria-checked={settings.pieceSet === p.id} title={p.name} onClick={() => update({ pieceSet: p.id })} className="swatch pieces" style={{ outline: settings.pieceSet === p.id ? '3px solid var(--accent)' : '1px solid var(--line)' }}>
                {p.kind === 'svg' ? <><img src={pieceUrl(p.id, 'wN')} alt="" /><img src={pieceUrl(p.id, 'bQ')} alt="" /></> : <span style={{ fontSize: 22 }}>♘♛</span>}
                <span className="sr-only">{p.name}</span>
              </button>
            ))}
          </div>
          <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>{PIECE_SETS.find((p) => p.id === settings.pieceSet)?.name}{PIECE_SETS.find((p) => p.id === settings.pieceSet)?.credit ? ` · ${PIECE_SETS.find((p) => p.id === settings.pieceSet)?.credit}` : ''}</p>
        </div>
        <label className="row"><input type="checkbox" checked={settings.showCoordinates} onChange={(e) => update({ showCoordinates: e.target.checked })} /> Show coordinates</label>
        <label className="row"><input type="checkbox" checked={settings.animations} onChange={(e) => update({ animations: e.target.checked })} /> Animate pieces</label>
        <label className="row"><input type="checkbox" checked={settings.sounds} onChange={(e) => { update({ sounds: e.target.checked }); if (e.target.checked) setTimeout(sfx.move, 50) }} /> Move sounds</label>
        <label className="row"><input type="checkbox" checked={settings.haptics} onChange={(e) => update({ haptics: e.target.checked })} /> Vibrate on solve (phones)</label>
      </div>
      <div className="card stack">
        <label>Theme
          <select className="input" value={settings.theme} onChange={(e) => update({ theme: e.target.value as 'system' | 'light' | 'dark' })}>
            <option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option>
          </select>
        </label>
        <label className="row"><input type="checkbox" checked={settings.boardFlipAuto} onChange={(e) => update({ boardFlipAuto: e.target.checked })} /> Orient the board to the side to move in puzzles</label>
      </div>
      <div className="card stack">
        <h3>Data</h3>
        <p className="muted" style={{ fontSize: 14 }}>Everything is stored locally in your browser (IndexedDB). Export a backup before switching devices.</p>
        <div className="row"><button className="btn" onClick={exportData}>Export JSON</button><button className="btn" style={{ color: 'var(--bad)' }} onClick={reset}>Reset progress</button></div>
      </div>
    </div>
  )
}
