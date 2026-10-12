export type TicketCategory = 'headset' | 'softphone' | 'computer' | 'network' | 'access' | 'crm' | 'payroll' | 'other'

export type TicketPriority = 'low' | 'medium' | 'high' | 'critical'

export type TicketStatus = 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed'

export interface TicketMessage {
  id: string
  authorId: string
  body: string
  /** Nota interna: solo la ven supervisores y admins */
  internal: boolean
  createdAt: string
}

export type TicketEventKind = 'created' | 'status' | 'assignee' | 'rated'

export interface TicketEvent {
  id: string
  actorId: string
  kind: TicketEventKind
  /** Estado o id de responsable anterior / nuevo (null = sin asignar). En 'rated', `to` es la calificación. */
  from: string | null
  to: string | null
  at: string
}

export interface Ticket {
  id: string
  /** Folio visible, p. ej. HD-1042 */
  code: string
  requesterId: string
  category: TicketCategory
  priority: TicketPriority
  title: string
  description: string
  /** Solo el nombre del archivo; no hay carga real */
  attachmentName: string | null
  status: TicketStatus
  assigneeId: string | null
  createdAt: string
  updatedAt: string
  /** Primera respuesta pública de alguien distinto al solicitante */
  firstResponseAt: string | null
  resolvedAt: string | null
  /** 1 a 5, la da el solicitante al resolverse */
  rating: number | null
  messages: TicketMessage[]
  history: TicketEvent[]
}

export type HelpdeskError =
  | 'not_found'
  | 'forbidden'
  | 'invalid'
  | 'invalid_transition'
  | 'reopen_expired'
  | 'not_resolved'
  | 'already_rated'
  | 'assignee_not_manager'

export type HelpdeskResult = { ok: true } | { ok: false; reason: HelpdeskError }
