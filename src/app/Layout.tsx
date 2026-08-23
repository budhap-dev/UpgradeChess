import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Toast } from '@/shared/ui/Toast'
import { useSettings } from '@/shared/hooks/useSettings'
import { useAuth } from '@/shared/sync/useAuth'

const NAV = [
  { to: '/', label: 'Home', ico: '⌂' },
  { to: '/path', label: 'Path', ico: '◬' },
  { to: '/puzzles', label: 'Puzzles', ico: '♞' },
  { to: '/review', label: 'Review', ico: '✎' },
  { to: '/progress', label: 'Progress', ico: '◔' },
]

const MORE = [
  { to: '/play', label: 'Play vs engine', ico: '♔' },
  { to: '/openings', label: 'Openings', ico: '♙' },
  { to: '/tricks', label: 'Gambits & tricks', ico: '⚡' },
  { to: '/badges', label: 'Badges', ico: '★' },
  { to: '/library', label: 'Library', ico: '▤' },
  { to: '/settings', label: 'Settings', ico: '⚙' },
]

export function Layout() {
  const [settings] = useSettings()
  const auth = useAuth()
  const [more, setMore] = useState(false)
  const loc = useLocation()
  useEffect(() => { setMore(false) }, [loc.pathname])
  useEffect(() => {
    const root = document.documentElement
    if (settings.theme === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', settings.theme)
    const dark = settings.theme === 'dark' || (settings.theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#1d231d' : '#4d7a44')
  }, [settings.theme])
  return (
    <div className="shell">
      <header className="topbar">
        <NavLink to="/" className="brand"><span className="knight">♞</span>UpgradeChess</NavLink>
        {auth.configured && (
          <NavLink to="/settings" className="sync-dot" title={auth.user ? `Signed in as ${auth.user.email} · ${auth.syncStatus}` : 'Sign in to sync'} aria-label="Account">
            {auth.user ? <span className={`dot ${auth.syncStatus === 'error' ? 'bad' : auth.syncStatus === 'pending' || auth.syncStatus === 'syncing' ? 'warn' : 'good'}`} /> : <span className="muted" style={{ fontSize: 13 }}>Sign in</span>}
          </NavLink>
        )}
        <button className="btn sm ghost more-btn" aria-expanded={more} aria-controls="more-sheet" onClick={() => setMore((v) => !v)}>{more ? 'Close' : 'More ☰'}</button>
        <nav className="topnav" aria-label="Primary">
          {NAV.map((n) => <NavLink key={n.to} to={n.to} end={n.to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>{n.label}</NavLink>)}
          <NavLink to="/play" className={({ isActive }) => (isActive ? 'active' : '')}>Play</NavLink>
          <NavLink to="/openings" className={({ isActive }) => (isActive ? 'active' : '')}>Openings</NavLink>
          <NavLink to="/tricks" className={({ isActive }) => (isActive ? 'active' : '')}>Tricks</NavLink>
          <NavLink to="/library" className={({ isActive }) => (isActive ? 'active' : '')}>Library</NavLink>
          <NavLink to="/settings" className={({ isActive }) => (isActive ? 'active' : '')}>Settings</NavLink>
        </nav>
      </header>
      <main className="content"><Outlet /></main>
      {more && (
        <>
          <div className="sheet-backdrop" onClick={() => setMore(false)} />
          <nav id="more-sheet" className="sheet" aria-label="More">
            {MORE.map((m) => <NavLink key={m.to} to={m.to} className={({ isActive }) => (isActive ? 'active' : '')}><span className="ico" aria-hidden>{m.ico}</span>{m.label}</NavLink>)}
          </nav>
        </>
      )}
      <nav className="tabbar" aria-label="Primary">
        {NAV.map((n) => <NavLink key={n.to} to={n.to} end={n.to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}><span className="ico" aria-hidden>{n.ico}</span>{n.label}</NavLink>)}
      </nav>
      <Toast />
    </div>
  )
}
