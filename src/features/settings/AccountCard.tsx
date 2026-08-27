import { useAuth } from '@/shared/sync/useAuth'

export function AccountCard() {
  const a = useAuth()
  if (!a.configured) {
    return (
      <div className="card stack">
        <h3>Account & sync</h3>
        <p className="muted" style={{ fontSize: 14 }}>Cloud sync isn't configured for this deployment, so progress stays on this device (use Export/Import below to move it). To enable Google sign-in and cross-device sync, set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> — see <code>docs/DEPLOY.md</code>.</p>
      </div>
    )
  }
  const u = a.user
  const name = (u?.user_metadata?.full_name as string | undefined) ?? u?.email
  const avatar = u?.user_metadata?.avatar_url as string | undefined
  return (
    <div className="card stack">
      <h3>Account & sync</h3>
      {a.loading ? <p className="muted">Checking session…</p> : u ? (
        <>
          <div className="row">
            {avatar && <img src={avatar} alt="" width={36} height={36} style={{ borderRadius: '50%' }} referrerPolicy="no-referrer" />}
            <div style={{ flex: 1 }}><strong>{name}</strong><br /><span className="muted" style={{ fontSize: 13 }}>{u.email}</span></div>
            <span className={`pill ${a.syncStatus === 'error' ? 'bad' : a.syncStatus === 'synced' ? 'good' : ''}`}>{a.syncStatus === 'syncing' ? 'Syncing…' : a.syncStatus === 'pending' ? 'Saving…' : a.syncStatus === 'synced' ? 'Synced' : a.syncStatus === 'error' ? 'Sync error' : 'Signed in'}</span>
          </div>
          {a.syncError && <p style={{ color: 'var(--bad)', fontSize: 14 }}>{a.syncError}</p>}
          <p className="muted" style={{ fontSize: 13 }}>Your progress is merged across devices signed into this Google account. {a.lastSyncAt ? `Last sync ${new Date(a.lastSyncAt).toLocaleTimeString()}.` : ''}</p>
          <div className="row"><button className="btn" onClick={a.syncNow} disabled={a.syncStatus === 'syncing'}>Sync now</button><button className="btn ghost" onClick={a.signOut}>Sign out</button></div>
        </>
      ) : (
        <>
          {a.syncError && <p style={{ color: 'var(--bad)', fontSize: 14 }}>{a.syncError}</p>}
          <p className="muted" style={{ fontSize: 14 }}>Sign in to keep your XP, ratings, path and games in sync across phone and desktop. Without an account everything still works on this device.</p>
          <button className="btn primary" onClick={a.signInWithGoogle} disabled={a.busy} style={{ alignSelf: 'flex-start' }}>
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.8 6C12.3 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 7.1-10 7.1-17.5z"/><path fill="#FBBC05" d="M10.4 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.8-6z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.7-4.1-13.6-9.8l-7.8 6C6.5 42.6 14.6 48 24 48z"/></svg>
            {a.busy ? 'Redirecting…' : 'Sign in with Google'}
          </button>
        </>
      )}
    </div>
  )
}
