export type ShiftStatus = 'scheduled' | 'cancelled'

export interface Shift {
  id: string
  agentId: string
  campaignId: string
  /** YYYY-MM-DD */
  date: string
  /** HH:mm (24 h). El turno no cruza la medianoche. */
  startTime: string
  endTime: string
  breakMinutes: number
  status: ShiftStatus
  note: string | null
}

/** Turno publicado sin agente: un turno abierto = un cupo */
export type OpenShiftStatus = 'open' | 'filled'

export interface OpenShift {
  id: string
  campaignId: string
  /** YYYY-MM-DD */
  date: string
  startTime: string
  endTime: string
  breakMinutes: number
  note: string | null
  /** true: la toma espera aprobación del supervisor. false: se asigna al instante */
  requiresApproval: boolean
  status: OpenShiftStatus
  createdBy: string
  createdAt: string
  /** Turno creado al cubrirse */
  filledShiftId: string | null
}

export type ClaimStatus = 'pending' | 'approved' | 'rejected'

export interface ShiftClaim {
  id: string
  openShiftId: string
  agentId: string
  status: ClaimStatus
  createdAt: string
  decidedBy: string | null
  decidedAt: string | null
}

/**
 * pending_peer: espera que el compañero acepte. pending_approval: aceptado, espera al supervisor.
 * declined: el compañero lo rechazó. rejected: el supervisor lo rechazó.
 */
export type SwapStatus = 'pending_peer' | 'pending_approval' | 'approved' | 'declined' | 'rejected' | 'cancelled'

export interface SwapRequest {
  id: string
  shiftId: string
  fromAgentId: string
  /** null = se ofrece a cualquiera de la misma campaña */
  toAgentId: string | null
  /** Quién aceptó el turno (al ofrecerse a cualquiera, se conoce al aceptar) */
  acceptedBy: string | null
  note: string | null
  status: SwapStatus
  createdAt: string
  decidedBy: string | null
  decidedAt: string | null
}

export type ScheduleError =
  | 'not_found'
  | 'invalid'
  | 'overlap'
  | 'on_time_off'
  | 'inactive_user'
  /** El usuario no puede hacer esta acción (rol o dueño) */
  | 'forbidden'
  /** El turno ya pasó */
  | 'past_shift'
  /** Ya no está pendiente / disponible */
  | 'not_pending'
  /** Ya existe una solicitud pendiente igual */
  | 'duplicate'

export type ScheduleResult = { ok: true } | { ok: false; reason: ScheduleError }
