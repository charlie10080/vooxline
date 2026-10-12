import type { AttendanceAlertKind } from '@/lib/punctuality'
import type { NotificationCategory } from '@/types/notifications'

export type TriggerKind =
  | 'attendance_alert'
  | 'time_off_created'
  | 'time_off_decided'
  | 'open_shift_claim'
  | 'swap_pending_approval'
  | 'ticket_high_priority'
  | 'ticket_sla_overdue'
  | 'form_submitted'
  | 'update_unconfirmed'

/** Parámetros planos: cada disparador usa solo los suyos (ver TRIGGER_PARAMS en lib/automations) */
export interface AutomationTrigger {
  kind: TriggerKind
  /** attendance_alert: tipo de alerta, 'any' = cualquiera */
  alertKind: AttendanceAlertKind | 'any'
  /** form_submitted: plantilla, null = cualquiera */
  templateId: string | null
  /** update_unconfirmed: horas sin confirmar */
  hours: number
}

export type AutomationAction =
  | { kind: 'notify_supervisors' }
  | { kind: 'notify_agent' }
  | { kind: 'notify_user'; userId: string }

export interface AutomationRule {
  id: string
  name: string
  enabled: boolean
  trigger: AutomationTrigger
  /** Filtro opcional: solo eventos de esta campaña (null = todas) */
  campaignId: string | null
  actions: AutomationAction[]
  /** Plantilla con {agente}, {detalle}, {campaña}, {regla} */
  message: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export type RuleDraft = Pick<AutomationRule, 'name' | 'trigger' | 'campaignId' | 'actions' | 'message'>

/** Algo que ocurrió en los datos y que un disparador detectó */
export interface AutomationEvent {
  /** Estable: la misma situación produce siempre la misma clave */
  key: string
  agentId: string | null
  campaignId: string | null
  category: NotificationCategory
  detail: string
}

export interface AutomationRun {
  id: string
  ruleId: string
  ruleName: string
  at: string
  detail: string
  agentId: string | null
  recipientIds: string[]
}

export type AutomationError =
  | 'forbidden'
  | 'not_found'
  | 'invalid_name'
  | 'invalid_trigger'
  | 'invalid_campaign'
  | 'no_actions'
  | 'invalid_user'
  | 'invalid_message'

export type AutomationResult = { ok: true } | { ok: false; reason: AutomationError }
