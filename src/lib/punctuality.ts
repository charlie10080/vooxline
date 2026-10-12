import type { Agent, TimeEntry, TimeOffRequest } from '@/types'
import type { UserProfile } from '@/types/directory'
import type { Shift } from '@/types/scheduling'
import { getProfile } from '@/lib/groups'
import { getEntryLocationFlags } from '@/lib/geo'
import type { LocationFlag } from '@/lib/geo'
import { REVIEW_THRESHOLD_MIN, needsSupervisorReview } from '@/lib/metrics'
import { addDays, isOnApprovedTimeOff, toDateStr } from '@/lib/schedule'
import { minutesBetween } from '@/lib/time'

/** Misma regla de negocio de 15 min que ya usa la aprobación de horas */
export const PUNCTUALITY_TOLERANCE_MIN = REVIEW_THRESHOLD_MIN
/** Cuánto después del fin del turno una entrada abierta se considera "olvido de marcaje" */
export const MISSED_CLOCKOUT_GRACE_MIN = 30

export type PunctualityFlag = 'late_arrival' | 'early_leave' | 'late_leave' | 'missed_clock_out'
export type AttendanceAlertKind = PunctualityFlag | LocationFlag | 'no_show'

export interface EntryPunctuality {
  /** Turno contra el que se comparó, o null si ese día no tenía turno */
  shift: Shift | null
  /** Minutos: positivo = llegó tarde, negativo = llegó antes */
  arrivalMinutes: number | null
  /** Minutos: positivo = salió después del fin, negativo = antes (solo entradas cerradas) */
  departureMinutes: number | null
  /** Minutos que lleva pasado del fin del turno sin marcar salida (solo entradas abiertas) */
  openOverdueMinutes: number | null
  flags: PunctualityFlag[]
}

export interface AttendanceAlert {
  id: string
  kind: AttendanceAlertKind
  agentId: string
  /** YYYY-MM-DD del turno */
  date: string
  /** Minutos relevantes de la alerta (tarde, antes, después...), null en ausencias */
  minutes: number | null
  /** Entrada asociada; null en ausencias sin marcaje */
  entryId: string | null
}

const shiftAt = (date: string, time: string): Date => new Date(`${date}T${time}:00`)

/** Turno activo del agente en la fecha en que se marcó la entrada (si hay varios, el de inicio más cercano) */
export function findShiftForEntry(entry: TimeEntry, shifts: Shift[]): Shift | null {
  const date = toDateStr(new Date(entry.clockIn))
  const candidates = shifts.filter((s) => s.status === 'scheduled' && s.agentId === entry.agentId && s.date === date)
  if (candidates.length === 0) return null
  const distance = (s: Shift): number => Math.abs(minutesBetween(shiftAt(s.date, s.startTime), entry.clockIn))
  return candidates.reduce((best, s) => (distance(s) < distance(best) ? s : best))
}

export function getEntryPunctuality(entry: TimeEntry, shifts: Shift[], now: Date = new Date()): EntryPunctuality {
  const shift = findShiftForEntry(entry, shifts)
  const empty: EntryPunctuality = {
    shift: null,
    arrivalMinutes: null,
    departureMinutes: null,
    openOverdueMinutes: null,
    flags: [],
  }
  if (!shift) return empty

  const start = shiftAt(shift.date, shift.startTime)
  const end = shiftAt(shift.date, shift.endTime)
  const flags: PunctualityFlag[] = []

  const arrivalMinutes = minutesBetween(start, entry.clockIn)
  if (arrivalMinutes > PUNCTUALITY_TOLERANCE_MIN) flags.push('late_arrival')

  let departureMinutes: number | null = null
  let openOverdueMinutes: number | null = null
  if (entry.clockOut !== null) {
    departureMinutes = minutesBetween(end, entry.clockOut)
    if (departureMinutes < -PUNCTUALITY_TOLERANCE_MIN) flags.push('early_leave')
    else if (departureMinutes > PUNCTUALITY_TOLERANCE_MIN) flags.push('late_leave')
  } else {
    const overdue = minutesBetween(end, now)
    if (overdue > MISSED_CLOCKOUT_GRACE_MIN) {
      openOverdueMinutes = overdue
      flags.push('missed_clock_out')
    }
  }
  return { shift, arrivalMinutes, departureMinutes, openOverdueMinutes, flags }
}

/**
 * Turnos programados que ya terminaron y en los que el agente no marcó nada.
 * Solo mira hoy y `lookbackDays` días atrás para no inundar la lista.
 */
export function findNoShows(args: {
  shifts: Shift[]
  entries: TimeEntry[]
  agents: Agent[]
  profiles: UserProfile[]
  timeOffRequests: TimeOffRequest[]
  now?: Date
  lookbackDays?: number
}): Shift[] {
  const { shifts, entries, agents, profiles, timeOffRequests } = args
  const now = args.now ?? new Date()
  const today = toDateStr(now)
  const from = addDays(today, -(args.lookbackDays ?? 1))

  return shifts.filter((s) => {
    if (s.status !== 'scheduled' || s.date < from || s.date > today) return false
    if (shiftAt(s.date, s.endTime).getTime() >= now.getTime()) return false
    if (!agents.some((a) => a.id === s.agentId)) return false
    if (!getProfile(profiles, s.agentId).active) return false
    if (isOnApprovedTimeOff(timeOffRequests, s.agentId, s.date)) return false
    const clocked = entries.some((e) => e.agentId === s.agentId && toDateStr(new Date(e.clockIn)) === s.date)
    return !clocked
  })
}

/** Minutos que acompañan a una bandera (para describeAlert) */
export function flagMinutes(p: EntryPunctuality, flag: PunctualityFlag): number | null {
  if (flag === 'late_arrival') return p.arrivalMinutes
  if (flag === 'early_leave') return p.departureMinutes === null ? null : Math.abs(p.departureMinutes)
  if (flag === 'late_leave') return p.departureMinutes
  return p.openOverdueMinutes
}

/** Alertas accionables: entradas pendientes con banderas de puntualidad + ausencias sin marcaje */
export function getAttendanceAlerts(args: {
  entries: TimeEntry[]
  shifts: Shift[]
  agents: Agent[]
  profiles: UserProfile[]
  timeOffRequests: TimeOffRequest[]
  now?: Date
  lookbackDays?: number
}): AttendanceAlert[] {
  const now = args.now ?? new Date()
  const alerts: AttendanceAlert[] = []

  for (const entry of args.entries) {
    if (entry.status !== 'pending') continue
    // La ubicación se revisa aunque ese día no haya turno programado
    for (const flag of getEntryLocationFlags(entry)) {
      alerts.push({
        id: `${flag}:${entry.id}`,
        kind: flag,
        agentId: entry.agentId,
        date: toDateStr(new Date(entry.clockIn)),
        minutes: null,
        entryId: entry.id,
      })
    }
    const p = getEntryPunctuality(entry, args.shifts, now)
    if (!p.shift) continue
    const base = { agentId: entry.agentId, date: p.shift.date, entryId: entry.id }
    for (const flag of p.flags) {
      let minutes: number | null = null
      if (flag === 'late_arrival') minutes = p.arrivalMinutes
      else if (flag === 'early_leave') minutes = p.departureMinutes === null ? null : Math.abs(p.departureMinutes)
      else if (flag === 'late_leave') minutes = p.departureMinutes
      else minutes = p.openOverdueMinutes
      alerts.push({ ...base, id: `${flag}:${entry.id}`, kind: flag, minutes })
    }
  }

  for (const shift of findNoShows({ ...args, now })) {
    alerts.push({
      id: `no_show:${shift.id}`,
      kind: 'no_show',
      agentId: shift.agentId,
      date: shift.date,
      minutes: null,
      entryId: null,
    })
  }
  return alerts
}

export function countAlertsByKind(alerts: AttendanceAlert[]): Record<AttendanceAlertKind, number> {
  const counts: Record<AttendanceAlertKind, number> = {
    late_arrival: 0,
    early_leave: 0,
    late_leave: 0,
    missed_clock_out: 0,
    outside_location: 0,
    location_missing: 0,
    no_show: 0,
  }
  for (const a of alerts) counts[a.kind] += 1
  return counts
}

const fmtMin = (m: number): string => {
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const r = m % 60
  return r === 0 ? `${h} h` : `${h} h ${r} min`
}

export const ALERT_KIND_LABELS: Record<AttendanceAlertKind, string> = {
  late_arrival: 'Llegadas tarde',
  early_leave: 'Salidas tempranas',
  late_leave: 'Salidas tardías',
  missed_clock_out: 'Olvidos de marcaje',
  outside_location: 'Fuera de ubicación',
  location_missing: 'Sin ubicación',
  no_show: 'Ausencias sin marcaje',
}

/** Texto corto para badges y listas: "Llegó 32 min tarde" */
export function describeAlert(kind: AttendanceAlertKind, minutes: number | null): string {
  const m = minutes === null ? '' : fmtMin(Math.abs(minutes))
  switch (kind) {
    case 'late_arrival':
      return `Llegó ${m} tarde`
    case 'early_leave':
      return `Salió ${m} antes`
    case 'late_leave':
      return `Salida tardía (+${m})`
    case 'missed_clock_out':
      return `Sin marcar salida (+${m})`
    case 'outside_location':
      return 'Marcó fuera de su ubicación'
    case 'location_missing':
      return 'Marcó sin compartir ubicación'
    case 'no_show':
      return 'Ausencia sin marcaje'
  }
}

/**
 * Regla ÚNICA de "esta entrada necesita revisión del supervisor":
 * desviación de horas mayor a 15 min O alguna bandera de puntualidad O de ubicación.
 * Las páginas (Time Clock, Overview) deben usar esta función en vez de repetir la condición.
 */
export function entryNeedsReview(entry: TimeEntry, shifts: Shift[], now: Date = new Date()): boolean {
  return (
    needsSupervisorReview(entry) ||
    getEntryPunctuality(entry, shifts, now).flags.length > 0 ||
    getEntryLocationFlags(entry).length > 0
  )
}
