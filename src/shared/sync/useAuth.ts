import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { create } from 'zustand'
import { supabase, syncConfigured } from './supabase'
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
  const sb = supabase()!
  const st = useAuthStore.getState()
  const runSync = async (uid: string) => {
    if (syncedForUser === uid) return
    syncedForUser = uid
    st.set({ syncStatus: 'syncing' })
    try { await syncNow(uid); st.set({ syncStatus: 'synced', lastSyncAt: Date.now(), syncError: undefined }) } catch (e) { st.set({ syncStatus: 'error', syncError: (e as Error).message }) }
  }
  sb.auth.getSession().then(({ data }) => { st.set({ session: data.session, loading: false }); if (data.session) void runSync(data.session.user.id) })
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
    const sb = supabase(); if (!sb) return
    setBusy(true)
    const { error } = await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/settings' } })
    if (error) { s.set({ syncStatus: 'error', syncError: error.message }); setBusy(false) }
  }
  const signOut = async () => { const sb = supabase(); if (!sb) return; await sb.auth.signOut(); syncedForUser = null; s.set({ session: null, syncStatus: 'idle' }) }
  const syncNowManual = async () => { const uid = s.session?.user.id; if (!uid) return; s.set({ syncStatus: 'syncing' }); try { await syncNow(uid); s.set({ syncStatus: 'synced', lastSyncAt: Date.now(), syncError: undefined }) } catch (e) { s.set({ syncStatus: 'error', syncError: (e as Error).message }) } }
  return { configured: syncConfigured, session: s.session, user: s.session?.user ?? null, loading: s.loading, busy, syncStatus: s.syncStatus, syncError: s.syncError, lastSyncAt: s.lastSyncAt, signInWithGoogle, signOut, syncNow: syncNowManual }
}
