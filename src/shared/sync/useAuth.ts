import { useEffect, useState } from 'react'
import { create } from 'zustand'
import { neon, syncConfigured, type Session } from './neon'
import { syncNow, startAutoPush } from './sync'

interface AuthState {
  session: Session | null; loading: boolean; syncStatus: 'idle' | 'syncing' | 'pending' | 'synced' | 'error'; syncError?: string; lastSyncAt: number | null
  set: (p: Partial<AuthState>) => void
}
export const useAuthStore = create<AuthState>((set) => ({ session: null, loading: syncConfigured, syncStatus: 'idle', lastSyncAt: null, set }))

let booted = false
let stopAutoPush: (() => void) | null = null
let syncedForUser: string | null = null

/** Boot once: subscribe to auth changes, run a full sync on sign-in, auto-push local changes while signed in. */
export function bootAuth() {
  if (booted || !syncConfigured) return
  booted = true
  const sb = neon()!
  const st = useAuthStore.getState()
  const runSync = async (uid: string) => {
    if (syncedForUser === uid) return
    syncedForUser = uid
    st.set({ syncStatus: 'syncing' })
    try { await syncNow(uid); st.set({ syncStatus: 'synced', lastSyncAt: Date.now(), syncError: undefined }) } catch (e) { st.set({ syncStatus: 'error', syncError: (e as Error).message }) }
  }
  // After the Google round-trip Neon Auth lands on /settings?neon_auth_session_verifier=…; getSession() exchanges it and strips it from the URL.
  const returningFromOAuth = new URL(window.location.href).searchParams.has('neon_auth_session_verifier')
  sb.auth.getSession().then(({ data, error }) => {
    const url = new URL(window.location.href)
    const authError = url.searchParams.get('error_description') ?? url.searchParams.get('error')
    if (authError) {
      st.set({ syncStatus: 'error', syncError: 'Sign-in failed: ' + authError.replace(/[_+]/g, ' ') })
      url.searchParams.delete('error'); url.searchParams.delete('error_description')
      window.history.replaceState(null, '', url.pathname + url.search)
    } else if (error && returningFromOAuth) st.set({ syncStatus: 'error', syncError: 'Sign-in failed: ' + error.message })
    const session = data.session
    st.set({ session, loading: false })
    if (session) void runSync(session.user.id)
  })
  sb.auth.onAuthStateChange((_ev, session) => {
    st.set({ session, loading: false })
    if (session) void runSync(session.user.id); else syncedForUser = null
  })
  stopAutoPush?.()
  stopAutoPush = startAutoPush(() => useAuthStore.getState().session?.user.id ?? null, (s, msg) => st.set({ syncStatus: s, syncError: msg, ...(s === 'synced' ? { lastSyncAt: Date.now() } : {}) }))
}

export function useAuth() {
  const s = useAuthStore()
  const [busy, setBusy] = useState(false)
  useEffect(() => { bootAuth() }, [])
  const signInWithGoogle = async () => {
    const sb = neon(); if (!sb) return
    setBusy(true)
    // Neon Auth navigates to Google itself; we only get back here on an error.
    const { error } = await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/settings' } })
    if (error) { s.set({ syncStatus: 'error', syncError: error.message || 'Could not start sign-in' }); setBusy(false) }
  }
  const signOut = async () => { const sb = neon(); if (!sb) return; await sb.auth.signOut(); syncedForUser = null; s.set({ session: null, syncStatus: 'idle' }) }
  const syncNowManual = async () => { const uid = s.session?.user.id; if (!uid) return; s.set({ syncStatus: 'syncing' }); try { await syncNow(uid); s.set({ syncStatus: 'synced', lastSyncAt: Date.now(), syncError: undefined }) } catch (e) { s.set({ syncStatus: 'error', syncError: (e as Error).message }) } }
  return { configured: syncConfigured, session: s.session, user: s.session?.user ?? null, loading: s.loading, busy, syncStatus: s.syncStatus, syncError: s.syncError, lastSyncAt: s.lastSyncAt, signInWithGoogle, signOut, syncNow: syncNowManual }
}
