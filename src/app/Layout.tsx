import { NavLink, Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import { Toast } from '@/shared/ui/Toast'
import { useSettings } from '@/shared/hooks/useSettings'

const NAV = [
  { to: '/', label: 'Home', ico: '⌂' },
  { to: '/path', label: 'Path', ico: '◬' },
  { to: '/puzzles', label: 'Puzzles', ico: '♞' },
  { to: '/review', label: 'Review', ico: '✎' },
  { to: '/progress', label: 'Progress', ico: '◔' },
]

export function Layout() {
  const [settings] = useSettings()
  useEffect(() => {
    const root = document.documentElement
    if (settings.theme === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', settings.theme)
  }, [settings.theme])
  return (
    <div className="shell">
      <header className="topbar">
        <NavLink to="/" className="brand"><span className="knight">♞</span>UpgradeChess</NavLink>
        <nav className="topnav" aria-label="Primary">
          {NAV.map((n) => <NavLink key={n.to} to={n.to} end={n.to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>{n.label}</NavLink>)}
          <NavLink to="/play" className={({ isActive }) => (isActive ? 'active' : '')}>Play</NavLink>
          <NavLink to="/openings" className={({ isActive }) => (isActive ? 'active' : '')}>Openings</NavLink>
          <NavLink to="/library" className={({ isActive }) => (isActive ? 'active' : '')}>Library</NavLink>
          <NavLink to="/settings" className={({ isActive }) => (isActive ? 'active' : '')}>Settings</NavLink>
        </nav>
      </header>
      <main className="content"><Outlet /></main>
      <nav className="tabbar" aria-label="Primary">
        {NAV.map((n) => <NavLink key={n.to} to={n.to} end={n.to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}><span className="ico" aria-hidden>{n.ico}</span>{n.label}</NavLink>)}
      </nav>
      <Toast />
    </div>
  )
}
