import { createClient, SupabaseAuthAdapter } from '@neondatabase/neon-js'

const authUrl = import.meta.env.VITE_NEON_AUTH_URL as string | undefined
const dataApiUrl = import.meta.env.VITE_NEON_DATA_API_URL as string | undefined

/** Sync is optional: without env vars the app is fully local and the Account card explains how to enable it. */
export const syncConfigured = !!(authUrl && dataApiUrl)

const make = () => createClient({ auth: { adapter: SupabaseAuthAdapter(), url: authUrl! }, dataApi: { url: dataApiUrl! } })
export type NeonClient = ReturnType<typeof make>
export type Session = NonNullable<Awaited<ReturnType<NeonClient['auth']['getSession']>>['data']['session']>

let client: NeonClient | null = null
/** Neon Auth (Google sign-in) + Data API (PostgREST over the `user_data` table, JWT injected automatically). */
export function neon(): NeonClient | null {
  if (!syncConfigured) return null
  client ??= make()
  return client
}
