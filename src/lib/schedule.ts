import type { TimeOffRequest } from '@/types'
import type { ClaimStatus, ScheduleError, Shift, SwapRequest, SwapStatus } from '@/types/scheduling'

const pad = (n: number): string => String(n).padStart(2, '0')

// ---------- Fechas (strings YYYY-MM-DD, calculadas en UTC para evitar líos de zona horaria) ----------
const parse = (s: string): Date => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}
const fmtUTC = (d: Date): string => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`

export const toDateStr = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const todayStr = (): string => toDateStr(new Date())

export const addDays = (s: string, n: number): string => {
  const d = parse(s)
  d.setUTCDate(d.getUTCDate() + n)
  return fmtUTC(d)
}

/** Lunes de la semana a la que pertenece la fecha */
export const startOfWeek = (s: string): string => addDays(s, -((parse(s).getUTCDay() + 6) % 7))

export const weekDates = (monday: string): string[] => Array.from({ length: 7 }, (_, i) => addDays(monday, i))

export const daysBetween = (a: string, b: string): number =>
  Math.round((parse(b).getTime() - parse(a).getTime()) / 86_400_000)

export const isDateStr = (s: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(s) && fmtUTC(parse(s)) === s
export const isTimeStr = (s: string): boolean => /^([01]\d|2[0-3]):[0-5]\d$/.test(s)

/** "lun 21" */
export const formatDayLabel = (s: string): string =>
  parse(s).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', timeZone: 'UTC' })

// ---------- Turnos ----------
export const toMinutes = (t: string): number => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

type Timing = Pick<Shift, 'startTime' | 'endTime' | 'breakMinutes'>

/** Minutos pagados del turno (descuenta el descanso). 08:00-17:00 con 60 de descanso = 480 */
export const shiftPaidMinutes = (s: Timing): number => toMinutes(s.endTime) - toMinutes(s.startTime) - s.breakMinutes

export const shiftsOverlap = (a: Pick<Shift, 'startTime' | 'endTime'>, b: Pick<Shift, 'startTime' | 'endTime'>): boolean =>
  toMinutes(a.startTime) < toMinutes(b.endTime) && toMinutes(b.startTime) < toMinutes(a.endTime)

export const isOnApprovedTimeOff = (requests: TimeOffRequest[], agentId: string, date: string): boolean =>
  requests.some((r) => r.agentId === agentId && r.status === 'approved' && r.startDate <= date && date <= r.endDate)

/** Minutos programados de un agente en una fecha, o null si no tiene turno ese día */
export function getScheduledMinutesFor(shifts: Shift[], agentId: string, date: string): number | null {
  const day = shifts.filter((s) => s.agentId === agentId && s.date === date && s.status === 'scheduled')
  if (day.length === 0) return null
  return day.reduce((sum, s) => sum + shiftPaidMinutes(s), 0)
}

/** El turno aún no empieza (hora local) */
export function isUpcoming(s: Pick<Shift, 'date' | 'startTime'>, now: Date = new Date()): boolean {
  const today = toDateStr(now)
  return s.date > today || (s.date === today && toMinutes(s.startTime) > now.getHours() * 60 + now.getMinutes())
}

export const isSwapPending = (s: Pick<SwapRequest, 'status'>): boolean =>
  s.status === 'pending_peer' || s.status === 'pending_approval'

type StatusTone = 'accent' | 'success' | 'warning' | 'danger' | 'neutral' | 'info'

export const SWAP_STATUS_META: Record<SwapStatus, { label: string; tone: StatusTone }> = {
  pending_peer: { label: 'Esperando compañero', tone: 'info' },
  pending_approval: { label: 'Esperando supervisor', tone: 'warning' },
  approved: { label: 'Aprobado', tone: 'success' },
  declined: { label: 'Rechazado por compañero', tone: 'neutral' },
  rejected: { label: 'Rechazado por supervisor', tone: 'danger' },
  cancelled: { label: 'Cancelado', tone: 'neutral' },
}

export const CLAIM_STATUS_META: Record<ClaimStatus, { label: string; tone: StatusTone }> = {
  pending: { label: 'Pendiente', tone: 'warning' },
  approved: { label: 'Aprobada', tone: 'success' },
  rejected: { label: 'Rechazada', tone: 'danger' },
}

/** Mensaje en español por cada motivo de error del módulo de turnos */
export const SCHEDULE_ERROR_MESSAGES: Record<ScheduleError, string> = {
  not_found: 'Turno, solicitud o agente no encontrado.',
  invalid: 'Revisa fecha, horas y descanso (la hora de fin debe ser posterior al inicio y el descanso menor que el turno).',
  overlap: 'El turno se traslapa con otro turno del mismo agente en esa fecha.',
  on_time_off: 'El agente tiene un permiso aprobado ese día.',
  inactive_user: 'No se puede programar a un usuario inactivo.',
  forbidden: 'No tienes permiso para realizar esta acción.',
  past_shift: 'El turno ya inició o ya pasó.',
  not_pending: 'La solicitud ya no está pendiente o el turno ya no está disponible.',
  duplicate: 'Ya existe una solicitud pendiente para este turno.',
}

export function getWeekMinutes(shifts: Shift[], agentId: string, dates: string[]): number {
  const set = new Set(dates)
  return shifts
    .filter((s) => s.agentId === agentId && s.status === 'scheduled' && set.has(s.date))
    .reduce((sum, s) => sum + shiftPaidMinutes(s), 0)
}
