import type { Agent } from '@/types'
import type { GroupRule, SmartGroup, UserProfile } from '@/types/directory'

/** Perfil por defecto para agentes que aún no tienen uno (p. ej. tras un reinicio de datos demo) */
export function getProfile(profiles: UserProfile[], agentId: string): UserProfile {
  return (
    profiles.find((p) => p.agentId === agentId) ?? {
      agentId,
      email: '',
      role: 'agent',
      active: true,
      hireDate: '',
    }
  )
}

function getRuleFieldValue(rule: GroupRule, agent: Agent, profile: UserProfile): string {
  switch (rule.field) {
    case 'campaign':
      return agent.campaignId
    case 'level':
      return agent.level
    case 'status':
      return agent.status
    case 'role':
      return profile.role
    case 'active':
      return String(profile.active)
  }
}

export function ruleMatches(rule: GroupRule, agent: Agent, profile: UserProfile): boolean {
  const actual = getRuleFieldValue(rule, agent, profile).toLowerCase()
  const expected = rule.value.trim().toLowerCase()
  switch (rule.operator) {
    case 'is':
      return actual === expected
    case 'is_not':
      return actual !== expected
    case 'contains':
      return actual.includes(expected)
  }
}

/** Miembros de un grupo. Los smart se recalculan cada vez (por ejemplo, "En llamada ahora" cambia solo). */
export function getGroupMembers(group: SmartGroup, agents: Agent[], profiles: UserProfile[]): Agent[] {
  if (group.kind === 'manual') {
    const ids = new Set(group.memberIds)
    return agents.filter((a) => ids.has(a.id))
  }
  if (group.rules.length === 0) return []
  return agents.filter((agent) => {
    const profile = getProfile(profiles, agent.id)
    const results = group.rules.map((rule) => ruleMatches(rule, agent, profile))
    return group.match === 'all' ? results.every(Boolean) : results.some(Boolean)
  })
}
