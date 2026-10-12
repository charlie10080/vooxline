import type { Ticket, TicketCategory, TicketPriority, TicketStatus } from '@/types/helpdesk'

export const CATEGORY_LABELS: Record<TicketCategory, string> = {
  headset: 'Diadema / Audio',
  softphone: 'Softphone / SIP',
  computer: 'Computadora',
  network: 'Red / VPN',
  access: 'Accesos y contraseñas',
  crm: 'CRM / Herramientas',
  payroll: 'Nómina / RR.HH.',
  other: 'Otro',
}

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  critical: 'Crítica',
}

export const STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'Abierto',
  in_progress: 'En progreso',
  waiting_user: 'En espera del usuario',
  resolved: 'Resuelto',
  closed: 'Cerrado',
}

const HOUR = 3_600_000

/** Tiempo objetivo de resolución por prioridad, en horas */
export const SLA_HOURS: Record<TicketPriority, number> = { critical: 1, high: 4, medium: 24, low: 72 }

/** Ventana para que el solicitante reabra un ticket resuelto */
export const REOPEN_WINDOW_HOURS = 72

/** "Por vencer" cuando queda menos de esta fracción del SLA */
const DUE_SOON_FRACTION = 0.25

/** Transiciones de estado permitidas (supervisores). Cerrado es final. */
export const TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  open: ['in_progress', 'waiting_user', 'resolved', 'closed'],
  in_progress: ['open', 'waiting_user', 'resolved'],
  waiting_user: ['in_progress', 'resolved', 'closed'],
  resolved: ['in_progress', 'closed'],
  closed: [],
}

export const canTransition = (from: TicketStatus, to: TicketStatus): boolean => TRANSITIONS[from].includes(to)

export const isActive = (t: Pick<Ticket, 'status'>): boolean => t.status !== 'resolved' && t.status !== 'closed'

export const slaDueAt = (t: Pick<Ticket, 'createdAt' | 'priority'>): number =>
  new Date(t.createdAt).getTime() + SLA_HOURS[t.priority] * HOUR

export type SlaState = 'on_track' | 'due_soon' | 'overdue' | 'met' | 'missed'

export function slaState(t: Pick<Ticket, 'createdAt' | 'priority' | 'status' | 'resolvedAt'>, now = Date.now()): SlaState {
  const due = slaDueAt(t)
  if (!isActive(t)) {
    // El store fija resolvedAt al resolver o cerrar; el respaldo a `now` solo cubre datos viejos
    const end = t.resolvedAt ? new Date(t.resolvedAt).getTime() : now
    return end <= due ? 'met' : 'missed'
  }
  if (now > due) return 'overdue'
  return due - now <= SLA_HOURS[t.priority] * HOUR * DUE_SOON_FRACTION ? 'due_soon' : 'on_track'
}

export const isOverdue = (t: Ticket, now = Date.now()): boolean => slaState(t, now) === 'overdue'

export function canReopen(t: Pick<Ticket, 'status' | 'resolvedAt'>, now = Date.now()): boolean {
  if (t.status !== 'resolved' || !t.resolvedAt) return false
  return now - new Date(t.resolvedAt).getTime() <= REOPEN_WINDOW_HOURS * HOUR
}

/** Tickets que puede ver un usuario: los managers ven todos, los agentes solo los suyos */
export const visibleTickets = (tickets: Ticket[], userId: string, isManager: boolean): Ticket[] =>
  isManager ? tickets : tickets.filter((t) => t.requesterId === userId)

export const visibleMessages = (t: Ticket, isManager: boolean) =>
  isManager ? t.messages : t.messages.filter((m) => !m.internal)

export interface HelpdeskKpis {
  open: number
  overdue: number
  /** Minutos; null si no hay datos */
  avgFirstResponseMin: number | null
  avgResolutionMin: number | null
  satisfaction: number | null
}

const avg = (xs: number[]): number | null => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)
const mins = (from: string, to: string): number => (new Date(to).getTime() - new Date(from).getTime()) / 60000

export function computeKpis(tickets: Ticket[], now = Date.now()): HelpdeskKpis {
  return {
    open: tickets.filter(isActive).length,
    overdue: tickets.filter((t) => isOverdue(t, now)).length,
    avgFirstResponseMin: avg(tickets.flatMap((t) => (t.firstResponseAt ? [mins(t.createdAt, t.firstResponseAt)] : []))),
    avgResolutionMin: avg(tickets.flatMap((t) => (t.resolvedAt ? [mins(t.createdAt, t.resolvedAt)] : []))),
    satisfaction: avg(tickets.flatMap((t) => (t.rating !== null ? [t.rating] : []))),
  }
}

/** 45 -> "45 min", 150 -> "2.5 h", 2880 -> "2.0 d" */
export function formatSpan(minutes: number): string {
  const m = Math.abs(minutes)
  if (m < 60) return `${Math.round(m)} min`
  if (m < 60 * 24) return `${(m / 60).toFixed(1)} h`
  return `${(m / 1440).toFixed(1)} d`
}

/** Texto del SLA restante o vencido para un ticket activo */
export function slaRemainingLabel(t: Ticket, now = Date.now()): string {
  const diff = (slaDueAt(t) - now) / 60000
  return diff >= 0 ? `vence en ${formatSpan(diff)}` : `vencido hace ${formatSpan(diff)}`
}
