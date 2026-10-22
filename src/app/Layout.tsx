import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Toast } from '@/shared/ui/Toast'
import { Icon, type IconName } from '@/shared/ui/Icon'
import { useSettings } from '@/shared/hooks/useSettings'
import { usePlayerRating } from '@/shared/hooks/usePlayerRating'
import { useDueCards, useTotalXp, useUnreviewedGames } from '@/shared/hooks/useCounts'
import { levelForXp } from '@/config/levels'
import { useAuth } from '@/shared/sync/useAuth'

interface NavItem { to: string; label: string; icon: IconName; end?: boolean; meta?: ReactNode; badge?: number }

/** Routes where the board is the whole job: on phones the tab bar gives way to the page's own action bar. */
const isFocusRoute = (p: string) => /^\/puzzles(\/|$)/.test(p) || /^\/path\/[^/]+/.test(p) || p === '/play' || /^\/tricks\/[^/]+/.test(p)

const MORE: { to: string; label: string; icon: IconName }[] = [
  { to: '/play', label: 'Play', icon: 'monitor' },
  { to: '/openings', label: 'Openings', icon: 'book' },
  { to: '/tricks', label: 'Tricks', icon: 'zap' },
  { to: '/progress', label: 'Progress', icon: 'chart' },
  { to: '/badges', label: 'Badges', icon: 'award' },
  { to: '/library', label: 'Library', icon: 'library' },
  { to: '/settings', label: 'Settings', icon: 'sliders' },
]

export function Layout() {
  const [settings] = useSettings()
  const auth = useAuth()
  const tactics = usePlayerRating('tactics')
  const due = useDueCards()
  const unreviewed = useUnreviewedGames()
  const xp = useTotalXp()
  const lvl = levelForXp(xp)
  const [more, setMore] = useState(false)
  const closeMore = useCallback(() => setMore(false), [])
  const loc = useLocation()
  const focus = isFocusRoute(loc.pathname)
  useEffect(() => { setMore(false) }, [loc.pathname])
  useEffect(() => {
    const root = document.documentElement
    if (settings.theme === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', settings.theme)
    const dark = settings.theme === 'dark' || (settings.theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#111712' : '#F4F2EC')
  }, [settings.theme])

  const groups: { label: string; items: NavItem[] }[] = [
    { label: 'Train', items: [
      { to: '/', label: 'Home', icon: 'home', end: true },
      { to: '/puzzles', label: 'Puzzles', icon: 'target', meta: <span className="side-meta mono">{Math.round(tactics.rating)}</span> },
      { to: '/path', label: 'Learning path', icon: 'path' },
      { to: '/openings', label: 'Openings', icon: 'book', badge: due },
      { to: '/tricks', label: 'Gambits & tricks', icon: 'zap' },
    ] },
    { label: 'Play & review', items: [
      { to: '/play', label: 'Play vs engine', icon: 'monitor' },
      { to: '/review', label: 'Review games', icon: 'search', badge: unreviewed },
    ] },
    { label: 'You', items: [
      { to: '/progress', label: 'Progress', icon: 'chart' },
      { to: '/badges', label: 'Badges', icon: 'award' },
      { to: '/library', label: 'Library', icon: 'library' },
    ] },
  ]

  const sync = !auth.configured ? null
    : !auth.user ? { cls: 'off', text: 'Sign in' }
    : auth.syncStatus === 'error' ? { cls: 'bad', text: 'Sync error' }
    : auth.syncStatus === 'syncing' || auth.syncStatus === 'pending' ? { cls: 'busy', text: 'Syncing' }
    : { cls: 'ok', text: 'Synced' }
  const moreActive = MORE.some((m) => loc.pathname.startsWith(m.to))

  return (
    <div className="shell" data-focus={focus || undefined}>
      <aside className="sidebar">
        <Link to="/" className="brand" aria-label="UpgradeChess home">
          <span className="brand-mark"><Icon name="rook" size={20} strokeWidth={2} /></span>
          <span className="brand-name">UpgradeChess</span>
        </Link>
        <nav className="side-nav" aria-label="Primary">
          {groups.map((g) => (
            <div key={g.label} className="side-group">
              <div className="side-label">{g.label}</div>
              {g.items.map((n) => (
                <NavLink key={n.to} to={n.to} end={n.end} className="side-link" title={n.label}>
                  <Icon name={n.icon} />
                  <span className="side-text">{n.label}</span>
                  {n.meta}
                  {!!n.badge && <><span className="side-badge mono" aria-hidden="true">{n.badge}</span><span className="sr-only">, {n.badge} pending</span></>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="side-foot">
          <Link to="/progress" className="level-card" title={`Level ${lvl.level} · ${xp} XP`}>
            <span className="level-top"><span className="lv-short">Lv {lvl.level}</span><span className="side-text">Lv {lvl.level} · {lvl.title}</span></span>
            <span className="side-text mono level-xp">{xp.toLocaleString()} / {lvl.next.toLocaleString()} XP</span>
            <span className="level-bar"><span style={{ width: `${Math.round(lvl.progress * 100)}%` }} /></span>
          </Link>
          <NavLink to="/settings" className="side-link" title={sync ? `Settings · ${sync.text}` : 'Settings'}>
            <Icon name="sliders" />
            <span className="side-text">Settings</span>
            {sync && <span className={`sync-state ${sync.cls}`}><span className="dot" aria-hidden="true" /><span className="side-text">{sync.text}</span></span>}
          </NavLink>
        </div>
      </aside>

      <main className="content"><Outlet /></main>

      {more && <MoreSheet onClose={closeMore} />}
      <nav className="tabbar" aria-label="Primary">
        <TabLink to="/" end icon="home" label="Home" />
        <TabLink to="/puzzles" icon="target" label="Puzzles" />
        <TabLink to="/path" icon="path" label="Path" />
        <TabLink to="/review" icon="search" label="Review" badge={unreviewed} />
        <button type="button" className={`tab${moreActive || more ? ' active' : ''}`} aria-expanded={more} aria-controls="more-sheet" onClick={() => setMore((v) => !v)}>
          <span className="tab-ico"><Icon name="grid" size={22} /></span><span className="tab-label">More</span>
        </button>
      </nav>
      <Toast />
    </div>
  )
}

function TabLink({ to, end, icon, label, badge }: { to: string; end?: boolean; icon: IconName; label: string; badge?: number }) {
  return (
    <NavLink to={to} end={end} className={({ isActive }) => `tab${isActive ? ' active' : ''}`}>
      <span className="tab-ico"><Icon name={icon} size={22} />{!!badge && <span className="badge-count" aria-hidden="true">{badge > 99 ? '99+' : badge}</span>}</span>
      <span className="tab-label">{label}</span>
      {!!badge && <span className="sr-only">, {badge} to review</span>}
    </NavLink>
  )
}

function MoreSheet({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.querySelector('a')?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div id="more-sheet" ref={ref} className="sheet" role="dialog" aria-modal="true" aria-label="More">
        <span className="sheet-handle" aria-hidden="true" />
        <nav className="sheet-grid" aria-label="More">
          {MORE.map((m) => (
            <NavLink key={m.to} to={m.to} className="sheet-tile">
              <span className="sheet-ico"><Icon name={m.icon} size={22} /></span>{m.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </>
  )
}
