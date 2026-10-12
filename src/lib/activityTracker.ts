import type { Agent, TimeEntry, TimeOffRequest, TimeOffType } from '@/types'
import type { ActivityDraft } from '@/types/activity'
import type { SmartGroup, UserProfile } from '@/types/directory'
import type { CallSession, MonitorLogEntry, MonitorMode } from '@/types/live'
import type { Shift } from '@/types/scheduling'
import { formatTimer, getCallSeconds } from '@/lib/live'
import { useActivityStore } from '@/store/useActivityStore'
import { useDirectoryStore } from '@/store/useDirectoryStore'
import { useLiveStore } from '@/store/useLiveStore'
import { useScheduleStore } from '@/store/useScheduleStore'
import { useWorkforceStore } from '@/store/useWorkforceStore'

// ---------- Utilidades ----------
const nameOf = (agents: Agent[], id: string): string => agents.find((a) => a.id === id)?.name ?? 'Un agente'

const typeLabel: Record<TimeOffType, string> = {
  vacation: 'vacaciones',
  medical: 'permiso médico',
  personal: 'permiso personal',
}
const modeLabel: Record<MonitorMode, string> = { listen: 'Escuchar', whisper: 'Whisper', intervene: 'Intervenir' }

interface Changes<T> {
  added: T[]
  removed: T[]
  /** Elementos que existen en ambos estados: [antes, después] */
  kept: Array<[T, T]>
}

function compare<T extends { id: string }>(prev: T[], next: T[]): Changes<T> {
  const prevById = new Map(prev.map((x) => [x.id, x]))
  const nextIds = new Set(next.map((x) => x.id))
  const added = next.filter((x) => !prevById.has(x.id))
  const removed = prev.filter((x) => !nextIds.has(x.id))
  const kept: Array<[T, T]> = []
  for (const n of next) {
    const p = prevById.get(n.id)
    if (p) kept.push([p, n])
  }
  return { added, removed, kept }
}

// ---------- Diffs (funciones puras: estado anterior -> estado nuevo => eventos) ----------
export interface WorkforceSlice {
  agents: Agent[]
  timeEntries: TimeEntry[]
  timeOffRequests: TimeOffRequest[]
}

export function diffWorkforce(prev: WorkforceSlice, next: WorkforceSlice): ActivityDraft[] {
  const out: ActivityDraft[] = []
  const agents = next.agents

  const entries = compare(prev.timeEntries, next.timeEntries)
  const requests = compare(prev.timeOffRequests, next.timeOffRequests)
  for (const e of entries.added) {
    out.push({ category: 'attendance', agentId: e.agentId, message: `${nameOf(agents, e.agentId)} marcó entrada` })
  }
  for (const [p, n] of entries.kept) {
    const who = nameOf(agents, n.agentId)
    if (p.clockOut === null && n.clockOut !== null) {
      out.push({ category: 'attendance', agentId: n.agentId, message: `${who} marcó salida` })
    } else if (!p.breakStartedAt && n.breakStartedAt) {
      out.push({ category: 'attendance', agentId: n.agentId, message: `${who} inició un descanso` })
    } else if (p.breakStartedAt && !n.breakStartedAt) {
      out.push({ category: 'attendance', agentId: n.agentId, message: `${who} terminó su descanso` })
    }
    if (p.status !== n.status) {
      if (n.status === 'approved') out.push({ category: 'attendance', agentId: n.agentId, message: `Se aprobó el turno de ${who}` })
      if (n.status === 'rejected') out.push({ category: 'attendance', agentId: n.agentId, message: `Se rechazó el turno de ${who}` })
    }
  }

  for (const r of requests.added) {
    out.push({
      category: 'time_off',
      agentId: r.agentId,
      message: `${nameOf(agents, r.agentId)} solicitó ${typeLabel[r.type]} (${r.hours} h)`,
    })
  }
  for (const [p, n] of requests.kept) {
    if (p.status === n.status) continue
    const who = nameOf(agents, n.agentId)
    if (n.status === 'approved') out.push({ category: 'time_off', agentId: n.agentId, message: `Se aprobó ${typeLabel[n.type]} de ${who} (${n.hours} h)` })
    if (n.status === 'rejected') out.push({ category: 'time_off', agentId: n.agentId, message: `Se rechazó ${typeLabel[n.type]} de ${who}` })
  }
  for (const r of requests.removed) {
    out.push({ category: 'time_off', agentId: r.agentId, message: `${nameOf(agents, r.agentId)} retiró su solicitud de ${typeLabel[r.type]}` })
  }
  return out
}

export interface DirectorySlice {
  profiles: UserProfile[]
  groups: SmartGroup[]
}

const profileKey = (p: UserProfile): string => p.agentId
export function diffDirectory(prev: DirectorySlice, next: DirectorySlice, agents: Agent[]): ActivityDraft[] {
  const out: ActivityDraft[] = []
  const withId = (list: UserProfile[]) => list.map((p) => ({ ...p, id: profileKey(p) }))
  const profiles = compare(withId(prev.profiles), withId(next.profiles))
  const groups = compare(prev.groups, next.groups)

  for (const p of profiles.added) {
    out.push({ category: 'users', agentId: p.agentId, message: `Se creó el usuario ${nameOf(agents, p.agentId)}` })
  }
  for (const [p, n] of profiles.kept) {
    const who = nameOf(agents, n.agentId)
    if (p.active !== n.active) {
      out.push({ category: 'users', agentId: n.agentId, message: n.active ? `Se activó a ${who}` : `Se desactivó a ${who}` })
    }
    if (p.role !== n.role) {
      out.push({ category: 'users', agentId: n.agentId, message: `Cambió el rol de ${who} a ${n.role}` })
    }
  }
  for (const g of groups.added) out.push({ category: 'users', agentId: null, message: `Se creó el grupo "${g.name}"` })
  for (const g of groups.removed) out.push({ category: 'users', agentId: null, message: `Se eliminó el grupo "${g.name}"` })
  return out
}

export function diffSchedule(prev: { shifts: Shift[] }, next: { shifts: Shift[] }, agents: Agent[]): ActivityDraft[] {
  const out: ActivityDraft[] = []
  const shifts = compare(prev.shifts, next.shifts)
  if (shifts.added.length > 5) {
    out.push({ category: 'schedule', agentId: null, message: `Se programaron ${shifts.added.length} turnos de golpe (copia de semana)` })
  } else {
    for (const s of shifts.added) {
      out.push({
        category: 'schedule',
        agentId: s.agentId,
        message: `Se programó turno de ${nameOf(agents, s.agentId)}: ${s.date} ${s.startTime}-${s.endTime}`,
      })
    }
  }
  for (const s of shifts.removed) {
    out.push({ category: 'schedule', agentId: s.agentId, message: `Se eliminó el turno de ${nameOf(agents, s.agentId)} del ${s.date}` })
  }
  for (const [p, n] of shifts.kept) {
    if (p.status === 'scheduled' && n.status === 'cancelled') {
      out.push({ category: 'schedule', agentId: n.agentId, message: `Se canceló el turno de ${nameOf(agents, n.agentId)} del ${n.date}` })
    }
  }
  return out
}

export interface LiveSlice {
  calls: CallSession[]
  monitorLog: MonitorLogEntry[]
}

export function diffLive(prev: LiveSlice, next: LiveSlice, agents: Agent[]): ActivityDraft[] {
  const out: ActivityDraft[] = []
  const calls = compare(prev.calls, next.calls)
  for (const c of calls.added) {
    out.push({
      category: 'calls',
      agentId: c.agentId,
      message: `${nameOf(agents, c.agentId)} inició una llamada${c.isVip ? ' VIP' : ''}`,
    })
  }
  for (const [p, n] of calls.kept) {
    if (p.endedAt === null && n.endedAt !== null) {
      out.push({
        category: 'calls',
        agentId: n.agentId,
        message: `${nameOf(agents, n.agentId)} terminó una llamada (${formatTimer(getCallSeconds(n))})`,
      })
    }
  }

  const known = new Set(prev.monitorLog.map((l) => l.id))
  const fresh = next.monitorLog.filter((l) => !known.has(l.id)).reverse()
  for (const l of fresh) {
    const who = nameOf(agents, l.agentId)
    const text =
      l.action === 'start'
        ? `Supervisión iniciada (${modeLabel[l.mode]}) sobre la llamada de ${who}`
        : l.action === 'mode_change'
          ? `Supervisión cambió a ${modeLabel[l.mode]} en la llamada de ${who}`
          : `Supervisión terminada en la llamada de ${who}`
    out.push({ category: 'supervision', agentId: l.agentId, message: text })
  }
  return out
}

// ---------- Pausa explícita (reinicios) ----------
let paused = false

/** Ejecuta cambios de estado SIN generar eventos de actividad (por ejemplo, un reinicio global). Debe ser síncrona. */
export function runUntracked<T>(fn: () => T): T {
  paused = true
  try {
    return fn()
  } finally {
    paused = false
  }
}

// ---------- Suscripción global ----------
/** Llamar UNA vez al arrancar la app (por ejemplo en App.tsx). Devuelve la función para cancelar. */
export function startActivityTracking(): () => void {
  const record = useActivityStore.getState().record
  const agents = (): Agent[] => useWorkforceStore.getState().agents

  const unsubscribers = [
    useWorkforceStore.subscribe((next, prev) => {
      if (!paused) record(diffWorkforce(prev, next))
    }),
    useDirectoryStore.subscribe((next, prev) => {
      if (!paused) record(diffDirectory(prev, next, agents()))
    }),
    useScheduleStore.subscribe((next, prev) => {
      if (!paused) record(diffSchedule(prev, next, agents()))
    }),
    useLiveStore.subscribe((next, prev) => {
      if (!paused) record(diffLive(prev, next, agents()))
    }),
  ]
  return () => {
    for (const unsubscribe of unsubscribers) unsubscribe()
  }
}
