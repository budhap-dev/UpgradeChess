import { useState } from 'react'
import { useSettings } from '@/shared/hooks/useSettings'
import { db } from '@/shared/db/db'
import { useToast } from '@/shared/ui/toastStore'

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
    <div className="stack" style={{ maxWidth: 560 }}>
      <div className="page-head"><div><div className="eyebrow">Profile</div><h1>Settings</h1></div></div>
      <div className="card stack">
        <label>Lichess username<input className="input" value={liVal} onChange={(e) => setLi(e.target.value)} placeholder="e.g. BudhaP" /></label>
        <label>Chess.com username<input className="input" value={ccVal} onChange={(e) => setCc(e.target.value)} placeholder="optional" /></label>
        <p className="muted" style={{ fontSize: 14 }}>Public profiles only — ratings are read from the open APIs and snapshotted daily on this device. No passwords, no login.</p>
        <button className="btn primary" onClick={save}>Save</button>
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
