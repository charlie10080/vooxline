export type AgentStatus = 'on_call' | 'available' | 'break' | 'offline'
export type EntryStatus = 'pending' | 'approved' | 'rejected'
export type TimeOffType = 'vacation' | 'medical' | 'personal'
export type TimeOffStatus = 'pending' | 'approved' | 'rejected'

export interface Campaign {
  id: string
  name: string
  /** Tarifa que se le cobra al cliente por hora (USD) */
  billRate: number
  /** Costo de nómina por hora (USD) */
  costRate: number
  /** Horas ya acumuladas en el ciclo antes de las entradas registradas en la app */
  baselineHours: number
}

export interface Agent {
  id: string
  employeeCode: string
  name: string
  level: string
  campaignId: string
  sipExtension: string
  sipTrunk: string
  latencyMs: number
  status: AgentStatus
  isVip: boolean
  /** ISO: desde cuándo está en el estado actual */
  statusSince: string
  qaScore: number | null
  qaLabel: string | null
  /** Duración del turno programado, en minutos */
  shiftMinutes: number
  ptoBalanceHours: number
}

export interface TimeEntry {
  id: string
  agentId: string
  campaignId: string
  /** ISO */
  clockIn: string
  /** ISO, null = turno abierto */
  clockOut: string | null
  breakMinutes: number
  scheduledMinutes: number
  status: EntryStatus
  note: string | null
}

export interface TimeOffRequest {
  id: string
  agentId: string
  type: TimeOffType
  /** YYYY-MM-DD */
  startDate: string
  endDate: string
  hours: number
  reason: string
  attachmentName: string | null
  status: TimeOffStatus
  /** ISO */
  requestedAt: string
}

export type ActionError =
  | 'not_found'
  | 'already_clocked_in'
  | 'not_clocked_in'
  | 'entry_open'
  | 'needs_confirmation'
  | 'already_processed'
  | 'insufficient_pto'

export type ActionResult = { ok: true } | { ok: false; reason: ActionError }
