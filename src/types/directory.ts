export type UserRole = 'agent' | 'supervisor' | 'admin' | 'client'

/** Datos de cuenta de un agente. Se enlaza con Agent por agentId (no duplica sus campos). */
export interface UserProfile {
  agentId: string
  email: string
  role: UserRole
  active: boolean
  /** YYYY-MM-DD */
  hireDate: string
}

export type RuleField = 'campaign' | 'level' | 'status' | 'role' | 'active'
export type RuleOperator = 'is' | 'is_not' | 'contains'
export type GroupMatch = 'all' | 'any'
export type GroupKind = 'manual' | 'smart'

export interface GroupRule {
  id: string
  field: RuleField
  operator: RuleOperator
  /** campaign: id de campaña · status: on_call|available|break|offline · role: agent|supervisor|admin · active: true|false · level: texto libre */
  value: string
}

export interface SmartGroup {
  id: string
  name: string
  description: string
  /** manual = lista fija (memberIds) · smart = miembros calculados con rules */
  kind: GroupKind
  /** all = cumple TODAS las reglas · any = cumple ALGUNA */
  match: GroupMatch
  rules: GroupRule[]
  memberIds: string[]
}

export type DirectoryError = 'not_found' | 'email_taken' | 'name_taken' | 'has_open_entry' | 'invalid'
export type DirectoryResult = { ok: true } | { ok: false; reason: DirectoryError }
