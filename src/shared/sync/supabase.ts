import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** Sync is optional: without env vars the app is fully local and the Account card explains how to enable it. */
export const syncConfigured = !!(url && anon)
let client: SupabaseClient | null = null
export function supabase(): SupabaseClient | null {
  if (!syncConfigured) return null
  client ??= createClient(url!, anon!, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'implicit' } })
  return client
}
