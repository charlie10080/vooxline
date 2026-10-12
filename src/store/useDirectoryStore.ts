import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Agent } from '@/types'
import type {
  DirectoryResult,
  SmartGroup,
  UserProfile,
  UserRole,
} from '@/types/directory'
import { mockGroups, mockProfiles } from '@/data/directoryMock'
import { useWorkforceStore } from '@/store/useWorkforceStore'

export interface NewUserInput {
  name: string
  email: string
  level: string
  campaignId: string
  role: UserRole
  shiftMinutes?: number
  sipExtension?: string
}

type AgentPatch = Partial<Pick<Agent, 'name' | 'level' | 'campaignId' | 'shiftMinutes' | 'sipExtension'>>
type ProfilePatch = Partial<Pick<UserProfile, 'email' | 'role'>>
/** Pasa SOLO los campos que cambian (no mandes claves con undefined). */
export type UserPatch = AgentPatch & ProfilePatch

export type NewGroupInput = Pick<SmartGroup, 'name' | 'description' | 'kind' | 'match' | 'rules' | 'memberIds'>
export type GroupPatch = Partial<NewGroupInput>

interface DirectoryState {
  profiles: UserProfile[]
  groups: SmartGroup[]

  createUser: (input: NewUserInput) => DirectoryResult
  updateUser: (agentId: string, patch: UserPatch) => DirectoryResult
  /** No se borran usuarios: la nómina y las horas los referencian. Se desactivan. */
  setUserActive: (agentId: string, active: boolean) => DirectoryResult

  createGroup: (input: NewGroupInput) => DirectoryResult
  updateGroup: (groupId: string, patch: GroupPatch) => DirectoryResult
  deleteGroup: (groupId: string) => DirectoryResult
  /** Solo para grupos manuales: agrega o quita a un agente */
  toggleGroupMember: (groupId: string, agentId: string) => DirectoryResult

  resetDirectoryDemo: () => void
}

const seed = () => ({ profiles: mockProfiles, groups: mockGroups })

const norm = (s: string): string => s.trim().toLowerCase()
const isEmail = (s: string): boolean => /^\S+@\S+\.\S+$/.test(s.trim())

function stripUndefined<T extends object>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T
}

function nextEmployeeCode(agents: Agent[]): string {
  const max = agents.reduce((m, a) => {
    const n = Number(a.employeeCode.replace(/\D/g, ''))
    return Number.isFinite(n) && n > m ? n : m
  }, 0)
  return `VX-${max + 1}`
}

export const useDirectoryStore = create<DirectoryState>()(
  persist(
    (set, get) => ({
      ...seed(),

      createUser: (input) => {
        const name = input.name.trim()
        const email = input.email.trim()
        if (!name || !isEmail(email)) return { ok: false, reason: 'invalid' }
        if (get().profiles.some((p) => norm(p.email) === norm(email))) {
          return { ok: false, reason: 'email_taken' }
        }
        const workforce = useWorkforceStore.getState()
        if (!workforce.campaigns.some((c) => c.id === input.campaignId)) {
          return { ok: false, reason: 'invalid' }
        }
        const now = new Date().toISOString()
        const agent: Agent = {
          id: crypto.randomUUID(),
          employeeCode: nextEmployeeCode(workforce.agents),
          name,
          level: input.level.trim(),
          campaignId: input.campaignId,
          sipExtension: input.sipExtension?.trim() || `SIP-${104 + workforce.agents.length}`,
          sipTrunk: 'Trunk-01',
          latencyMs: 20,
          status: 'offline',
          isVip: false,
          statusSince: now,
          qaScore: null,
          qaLabel: null,
          shiftMinutes: input.shiftMinutes ?? 480,
          ptoBalanceHours: 40,
        }
        const profile: UserProfile = {
          agentId: agent.id,
          email,
          role: input.role,
          active: true,
          hireDate: now.slice(0, 10),
        }
        // Un usuario nuevo es un agente nuevo en el store de operaciones
        useWorkforceStore.setState((s) => ({ agents: [agent, ...s.agents] }))
        set((s) => ({ profiles: [profile, ...s.profiles] }))
        return { ok: true }
      },

      updateUser: (agentId, patch) => {
        const workforce = useWorkforceStore.getState()
        if (!workforce.agents.some((a) => a.id === agentId)) return { ok: false, reason: 'not_found' }
        const { email, role, ...rest } = patch
        const agentPatch = stripUndefined(rest)

        if (agentPatch.name !== undefined && !agentPatch.name.trim()) return { ok: false, reason: 'invalid' }
        if (email !== undefined) {
          if (!isEmail(email)) return { ok: false, reason: 'invalid' }
          const taken = get().profiles.some((p) => p.agentId !== agentId && norm(p.email) === norm(email))
          if (taken) return { ok: false, reason: 'email_taken' }
        }

        if (Object.keys(agentPatch).length > 0) {
          useWorkforceStore.setState((s) => ({
            agents: s.agents.map((a) => (a.id === agentId ? { ...a, ...agentPatch } : a)),
          }))
        }
        if (email !== undefined || role !== undefined) {
          set((s) => {
            const exists = s.profiles.some((p) => p.agentId === agentId)
            const base: UserProfile = { agentId, email: '', role: 'agent', active: true, hireDate: '' }
            const changes = stripUndefined<ProfilePatch>({ email: email?.trim(), role })
            return {
              profiles: exists
                ? s.profiles.map((p) => (p.agentId === agentId ? { ...p, ...changes } : p))
                : [{ ...base, ...changes }, ...s.profiles],
            }
          })
        }
        return { ok: true }
      },

      setUserActive: (agentId, active) => {
        const workforce = useWorkforceStore.getState()
        if (!workforce.agents.some((a) => a.id === agentId)) return { ok: false, reason: 'not_found' }
        if (!active && workforce.timeEntries.some((e) => e.agentId === agentId && e.clockOut === null)) {
          return { ok: false, reason: 'has_open_entry' }
        }
        set((s) => {
          const exists = s.profiles.some((p) => p.agentId === agentId)
          return {
            profiles: exists
              ? s.profiles.map((p) => (p.agentId === agentId ? { ...p, active } : p))
              : [{ agentId, email: '', role: 'agent', active, hireDate: '' }, ...s.profiles],
          }
        })
        return { ok: true }
      },

      createGroup: (input) => {
        const name = input.name.trim()
        if (!name) return { ok: false, reason: 'invalid' }
        if (get().groups.some((g) => norm(g.name) === norm(name))) return { ok: false, reason: 'name_taken' }
        const group: SmartGroup = { ...input, name, id: crypto.randomUUID() }
        set((s) => ({ groups: [group, ...s.groups] }))
        return { ok: true }
      },

      updateGroup: (groupId, patch) => {
        if (!get().groups.some((g) => g.id === groupId)) return { ok: false, reason: 'not_found' }
        const changes = stripUndefined(patch)
        if (changes.name !== undefined) {
          const name = changes.name.trim()
          if (!name) return { ok: false, reason: 'invalid' }
          if (get().groups.some((g) => g.id !== groupId && norm(g.name) === norm(name))) {
            return { ok: false, reason: 'name_taken' }
          }
          changes.name = name
        }
        set((s) => ({ groups: s.groups.map((g) => (g.id === groupId ? { ...g, ...changes } : g)) }))
        return { ok: true }
      },

      deleteGroup: (groupId) => {
        if (!get().groups.some((g) => g.id === groupId)) return { ok: false, reason: 'not_found' }
        set((s) => ({ groups: s.groups.filter((g) => g.id !== groupId) }))
        return { ok: true }
      },

      toggleGroupMember: (groupId, agentId) => {
        const group = get().groups.find((g) => g.id === groupId)
        if (!group) return { ok: false, reason: 'not_found' }
        if (group.kind !== 'manual') return { ok: false, reason: 'invalid' }
        const has = group.memberIds.includes(agentId)
        const memberIds = has ? group.memberIds.filter((id) => id !== agentId) : [...group.memberIds, agentId]
        set((s) => ({ groups: s.groups.map((g) => (g.id === groupId ? { ...g, memberIds } : g)) }))
        return { ok: true }
      },

      resetDirectoryDemo: () => set(seed()),
    }),
    {
      name: 'vooxline-directory',
      version: 3,
      // v2: agrega los perfiles semilla nuevos (cliente). v3: el admin de la demo es Valeria (un usuario completo), no 'u-admin'
      migrate: (persisted, version) => {
        const s = persisted as DirectoryState
        let profiles = s.profiles.filter((p) => p.agentId !== 'u-admin')
        if (version < 3) profiles = profiles.map((p) => (p.agentId === 'a-valeria' ? { ...p, role: 'admin' as const } : p))
        const missing = mockProfiles.filter((m) => !profiles.some((p) => p.agentId === m.agentId))
        return { ...s, profiles: [...profiles, ...missing] }
      },
    },
  ),
)
