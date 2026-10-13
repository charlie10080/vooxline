import { supabase } from '@/lib/supabase'
import type { UserProfile, UserRole } from '@/types/directory'

export type IdentityError = 'offline' | 'invalid_credentials' | 'no_profile' | 'inactive' | 'network'
export type SignInResult = { ok: true; profile: UserProfile; profiles: UserProfile[] } | { ok: false; reason: IdentityError }

interface ProfileRow {
  user_id: string
  app_id: string
  email: string
  role: UserRole
  active: boolean
  hire_date: string | null
}

const toProfile = (r: ProfileRow): UserProfile => ({
  agentId: r.app_id,
  email: r.email,
  role: r.role,
  active: r.active,
  hireDate: r.hire_date ?? '',
})

/** Entra con Supabase Auth y trae los perfiles que la RLS deja ver (supervisión: todos; los demás: el propio) */
export async function signIn(email: string, password: string): Promise<SignInResult> {
  if (!supabase) return { ok: false, reason: 'offline' }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { ok: false, reason: error.status === 400 ? 'invalid_credentials' : 'network' }

  const { data: rows, error: rowsError } = await supabase.from('profiles').select('*')
  if (rowsError) return { ok: false, reason: 'network' }
  const all = (rows as ProfileRow[]).map(toProfile)
  const own = (rows as ProfileRow[]).find((r) => r.user_id === data.user.id)
  if (!own) {
    await supabase.auth.signOut()
    return { ok: false, reason: 'no_profile' }
  }
  if (!own.active) {
    await supabase.auth.signOut()
    return { ok: false, reason: 'inactive' }
  }
  return { ok: true, profile: toProfile(own), profiles: all }
}

export async function signOut(): Promise<void> {
  await supabase?.auth.signOut()
}
