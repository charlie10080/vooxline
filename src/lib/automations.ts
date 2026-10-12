import type {
  AutomationAction,
  AutomationError,
  AutomationEvent,
  AutomationTrigger,
  RuleDraft,
  TriggerKind,
} from '@/types/automations'

/* Lógica pura de automatizaciones (sin stores): se puede probar con node. */

export const TRIGGER_LABELS: Record<TriggerKind, string> = {
  attendance_alert: 'Aparece una alerta de asistencia',
  time_off_created: 'Un agente solicita un permiso',
  time_off_decided: 'Se aprueba o rechaza un permiso',
  open_shift_claim: 'Alguien toma un turno abierto que requiere aprobación',
  swap_pending_approval: 'Un intercambio de turno espera aprobación',
  ticket_high_priority: 'Se abre un ticket de prioridad Alta o Crítica',
  ticket_sla_overdue: 'Un ticket de Help Desk vence su SLA',
  form_submitted: 'Llega una respuesta de formulario',
  update_unconfirmed: 'Un aviso sigue sin confirmar después de N horas',
}

export const TRIGGER_ORDER = Object.keys(TRIGGER_LABELS) as TriggerKind[]

export const MAX_UPDATE_HOURS = 24 * 14
export const MAX_MESSAGE_LENGTH = 280
/** shortcut: claves recordadas para no repetir avisos; si una vieja sale del tope y el evento sigue vigente, se vuelve a avisar. Con backend, guardar en el servidor sin tope. */
export const MAX_FIRED_KEYS = 2000

export const PLACEHOLDERS = ['{agente}', '{detalle}', '{campaña}', '{regla}'] as const

export interface TemplateValues {
  agente: string
  detalle: string
  campaña: string
  regla: string
}

/** Reemplaza {agente}, {detalle}, {campaña}, {regla}. Lo desconocido se deja tal cual. */
export function renderTemplate(template: string, values: TemplateValues): string {
  return template.replace(/\{([^{}]+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(values, name) ? values[name as keyof TemplateValues] : match,
  )
}

export const firedKey = (ruleId: string, eventKey: string): string => `${ruleId}|${eventKey}`

/** Une las claves nuevas y deja solo las más recientes */
export const capKeys = (existing: string[], added: string[], max = MAX_FIRED_KEYS): string[] =>
  [...existing, ...added].slice(-max)

export const matchesCampaign = (campaignId: string | null, event: Pick<AutomationEvent, 'campaignId'>): boolean =>
  campaignId === null || event.campaignId === campaignId

/** Destinatarios sin repetir. managerIds = supervisores y admins activos. */
export function resolveRecipients(actions: AutomationAction[], agentId: string | null, managerIds: string[]): string[] {
  const out = new Set<string>()
  for (const a of actions) {
    if (a.kind === 'notify_supervisors') managerIds.forEach((id) => out.add(id))
    else if (a.kind === 'notify_agent') {
      if (agentId) out.add(agentId)
    } else out.add(a.userId)
  }
  return [...out]
}

export interface DraftContext {
  agentIds: string[]
  campaignIds: string[]
  templateIds: string[]
}

export function validateTrigger(t: AutomationTrigger, ctx: DraftContext): boolean {
  if (!TRIGGER_ORDER.includes(t.kind)) return false
  if (t.kind === 'form_submitted' && t.templateId !== null && !ctx.templateIds.includes(t.templateId)) return false
  if (t.kind === 'update_unconfirmed') return Number.isInteger(t.hours) && t.hours >= 1 && t.hours <= MAX_UPDATE_HOURS
  return true
}

/** Motivo del error o null si el borrador es válido */
export function validateRuleDraft(d: RuleDraft, ctx: DraftContext): AutomationError | null {
  const name = d.name.trim()
  if (name.length < 3 || name.length > 80) return 'invalid_name'
  if (!validateTrigger(d.trigger, ctx)) return 'invalid_trigger'
  if (d.campaignId !== null && !ctx.campaignIds.includes(d.campaignId)) return 'invalid_campaign'
  if (d.actions.length === 0) return 'no_actions'
  if (d.actions.some((a) => a.kind === 'notify_user' && !ctx.agentIds.includes(a.userId))) return 'invalid_user'
  const msg = d.message.trim()
  if (msg.length === 0 || msg.length > MAX_MESSAGE_LENGTH) return 'invalid_message'
  return null
}
