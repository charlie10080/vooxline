import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Agent } from '@/types'
import type { UserProfile, UserRole } from '@/types/directory'
import { getProfile } from '@/lib/groups'
import { useDirectoryStore } from '@/store/useDirectoryStore'
import { useWorkforceStore } from '@/store/useWorkforceStore'

/**
 * Usuario con el que se está usando la app.
 * shortcut: sin contraseña, cualquiera puede "entrar como" otro usuario; con backend esto lo da el inicio de sesión real.
 */
interface SessionState {
  /** Sin sesión conserva el último usuario: las páginas siempre tienen un id válido; las guardias revisan isAuthenticated */
  currentUserId: string
  isAuthenticated: boolean
  setCurrentUser: (agentId: string) => void
  login: (agentId: string) => void
  logout: () => void
}

export const DEFAULT_USER_ID = 'a-carlos'

/** Página de inicio de cada rol después de entrar */
export function homePathFor(role: UserRole): string {
  if (role === 'client') return '/cliente'
  if (role === 'agent') return '/portal'
  return '/'
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      currentUserId: DEFAULT_USER_ID,
      isAuthenticated: false,
      setCurrentUser: (agentId) => set({ currentUserId: agentId }),
      login: (agentId) => set({ currentUserId: agentId, isAuthenticated: true }),
      logout: () => set({ isAuthenticated: false }),
    }),
    { name: 'vooxline-session', version: 1 },
  ),
)

export interface CurrentUser {
  agent: Agent | null
  profile: UserProfile
  role: UserRole
  /** Supervisores y admins gestionan; los agentes solo consumen */
  isManager: boolean
}

/** Usuario actual con su perfil y rol */
export function useCurrentUser(): CurrentUser {
  const currentUserId = useSessionStore((s) => s.currentUserId)
  const agent = useWorkforceStore((s) => s.agents.find((a) => a.id === currentUserId) ?? null)
  const profiles = useDirectoryStore((s) => s.profiles)
  const profile = getProfile(profiles, currentUserId)
  return { agent, profile, role: profile.role, isManager: profile.role !== 'agent' }
}
