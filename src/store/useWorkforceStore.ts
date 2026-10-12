import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  ActionResult,
  Agent,
  Campaign,
  GeoPoint,
  TimeEntry,
  TimeOffRequest,
} from '@/types'
import { mockAgents, mockCampaigns, mockTimeEntries, mockTimeOffRequests } from '@/data/mock'
import { needsSupervisorReview } from '@/lib/metrics'
import { checkLocation, DEFAULT_RADIUS_M } from '@/lib/geo'
import type { GeoReading } from '@/lib/geo'
import { minutesBetween } from '@/lib/time'
import { isDateStr } from '@/lib/schedule'

type NewTimeOffInput = Pick<
  TimeOffRequest,
  'agentId' | 'type' | 'startDate' | 'endDate' | 'hours' | 'reason' | 'attachmentName'
>

interface WorkforceState {
  agents: Agent[]
  campaigns: Campaign[]
  timeEntries: TimeEntry[]
  timeOffRequests: TimeOffRequest[]

  // Time Clock
  /** `location`: lectura del navegador al marcar; sin ella la entrada queda sin revisión de ubicación */
  clockIn: (agentId: string, scheduledMinutes?: number, location?: GeoReading) => ActionResult
  clockOut: (agentId: string, location?: GeoReading) => ActionResult
  setAuthorizedLocation: (agentId: string, point: GeoPoint, radiusM?: number) => ActionResult
  /** Descanso dentro de un turno abierto; los minutos se suman a breakMinutes al terminarlo */
  startBreak: (agentId: string) => ActionResult
  endBreak: (agentId: string) => ActionResult

  // Motor de aprobación
  approveEntry: (entryId: string, supervisorConfirmed?: boolean) => ActionResult
  rejectEntry: (entryId: string) => ActionResult
  /** Aprueba todas las pendientes cerradas y sin desviación > 15 min. Devuelve las bloqueadas. */
  approveBatch: () => { approved: number; blockedIds: string[] }

  // Time Off
  createTimeOff: (input: NewTimeOffInput) => ActionResult
  approveTimeOff: (requestId: string) => ActionResult
  rejectTimeOff: (requestId: string) => ActionResult
  /** El propio agente retira una solicitud que sigue pendiente */
  cancelTimeOff: (requestId: string, agentId: string) => ActionResult

  resetDemoData: () => void
}

const seed = () => ({
  agents: mockAgents,
  campaigns: mockCampaigns,
  timeEntries: mockTimeEntries,
  timeOffRequests: mockTimeOffRequests,
})

export const useWorkforceStore = create<WorkforceState>()(
  persist(
    (set, get) => ({
      ...seed(),

      clockIn: (agentId, scheduledMinutes, location) => {
        const { agents, timeEntries } = get()
        const agent = agents.find((a) => a.id === agentId)
        if (!agent) return { ok: false, reason: 'not_found' }
        if (timeEntries.some((e) => e.agentId === agentId && e.clockOut === null)) {
          return { ok: false, reason: 'already_clocked_in' }
        }
        const now = new Date().toISOString()
        const entry: TimeEntry = {
          id: crypto.randomUUID(),
          agentId,
          campaignId: agent.campaignId,
          clockIn: now,
          clockOut: null,
          breakMinutes: 0,
          scheduledMinutes:
            scheduledMinutes !== undefined && Number.isFinite(scheduledMinutes) && scheduledMinutes > 0
              ? scheduledMinutes
              : agent.shiftMinutes,
          status: 'pending',
          note: null,
          ...(location && { clockInGeo: checkLocation(location, agent.authorizedLocation) }),
        }
        set((s) => ({
          timeEntries: [entry, ...s.timeEntries],
          agents: s.agents.map((a) =>
            a.id === agentId ? { ...a, status: 'available', statusSince: now } : a,
          ),
        }))
        return { ok: true }
      },

      clockOut: (agentId, location) => {
        const { agents, timeEntries } = get()
        const open = timeEntries.find((e) => e.agentId === agentId && e.clockOut === null)
        if (!open) return { ok: false, reason: 'not_clocked_in' }
        const now = new Date().toISOString()
        const authorized = agents.find((a) => a.id === agentId)?.authorizedLocation
        const geo = location ? { clockOutGeo: checkLocation(location, authorized) } : {}
        // Si sale estando en descanso, el descanso se cierra a la hora de salida
        const breakMinutes = open.breakMinutes + (open.breakStartedAt ? minutesBetween(open.breakStartedAt, now) : 0)
        set((s) => ({
          timeEntries: s.timeEntries.map((e) =>
            e.id === open.id ? { ...e, clockOut: now, breakMinutes, breakStartedAt: null, ...geo } : e,
          ),
          agents: s.agents.map((a) =>
            a.id === agentId ? { ...a, status: 'offline', statusSince: now } : a,
          ),
        }))
        return { ok: true }
      },

      startBreak: (agentId) => {
        const open = get().timeEntries.find((e) => e.agentId === agentId && e.clockOut === null)
        if (!open) return { ok: false, reason: 'not_clocked_in' }
        if (open.breakStartedAt) return { ok: false, reason: 'on_break' }
        const now = new Date().toISOString()
        set((s) => ({
          timeEntries: s.timeEntries.map((e) => (e.id === open.id ? { ...e, breakStartedAt: now } : e)),
          agents: s.agents.map((a) => (a.id === agentId ? { ...a, status: 'break', statusSince: now } : a)),
        }))
        return { ok: true }
      },

      endBreak: (agentId) => {
        const open = get().timeEntries.find((e) => e.agentId === agentId && e.clockOut === null)
        if (!open) return { ok: false, reason: 'not_clocked_in' }
        if (!open.breakStartedAt) return { ok: false, reason: 'not_on_break' }
        const now = new Date().toISOString()
        const breakMinutes = open.breakMinutes + minutesBetween(open.breakStartedAt, now)
        set((s) => ({
          timeEntries: s.timeEntries.map((e) =>
            e.id === open.id ? { ...e, breakMinutes, breakStartedAt: null } : e,
          ),
          agents: s.agents.map((a) => (a.id === agentId ? { ...a, status: 'available', statusSince: now } : a)),
        }))
        return { ok: true }
      },

      setAuthorizedLocation: (agentId, point, radiusM = DEFAULT_RADIUS_M) => {
        if (!get().agents.some((a) => a.id === agentId)) return { ok: false, reason: 'not_found' }
        set((s) => ({
          agents: s.agents.map((a) =>
            a.id === agentId ? { ...a, authorizedLocation: { lat: point.lat, lng: point.lng, radiusM } } : a,
          ),
        }))
        return { ok: true }
      },

      approveEntry: (entryId, supervisorConfirmed = false) => {
        const entry = get().timeEntries.find((e) => e.id === entryId)
        if (!entry) return { ok: false, reason: 'not_found' }
        if (entry.status !== 'pending') return { ok: false, reason: 'already_processed' }
        if (entry.clockOut === null) return { ok: false, reason: 'entry_open' }
        if (needsSupervisorReview(entry) && !supervisorConfirmed) {
          return { ok: false, reason: 'needs_confirmation' }
        }
        set((s) => ({
          timeEntries: s.timeEntries.map((e) =>
            e.id === entryId ? { ...e, status: 'approved' } : e,
          ),
        }))
        return { ok: true }
      },

      rejectEntry: (entryId) => {
        const entry = get().timeEntries.find((e) => e.id === entryId)
        if (!entry) return { ok: false, reason: 'not_found' }
        if (entry.status !== 'pending') return { ok: false, reason: 'already_processed' }
        set((s) => ({
          timeEntries: s.timeEntries.map((e) =>
            e.id === entryId ? { ...e, status: 'rejected' } : e,
          ),
        }))
        return { ok: true }
      },

      approveBatch: () => {
        const pending = get().timeEntries.filter((e) => e.status === 'pending')
        const approvable = pending.filter((e) => e.clockOut !== null && !needsSupervisorReview(e))
        const approvableIds = new Set(approvable.map((e) => e.id))
        const blockedIds = pending.filter((e) => !approvableIds.has(e.id)).map((e) => e.id)
        set((s) => ({
          timeEntries: s.timeEntries.map((e) =>
            approvableIds.has(e.id) ? { ...e, status: 'approved' } : e,
          ),
        }))
        return { approved: approvable.length, blockedIds }
      },

      createTimeOff: (input) => {
        if (!get().agents.some((a) => a.id === input.agentId)) return { ok: false, reason: 'not_found' }
        const validDates =
          isDateStr(input.startDate) && isDateStr(input.endDate) && input.startDate <= input.endDate
        if (!validDates || !Number.isFinite(input.hours) || input.hours <= 0 || !input.reason.trim()) {
          return { ok: false, reason: 'invalid' }
        }
        const request: TimeOffRequest = {
          ...input,
          reason: input.reason.trim(),
          id: crypto.randomUUID(),
          status: 'pending',
          requestedAt: new Date().toISOString(),
        }
        set((s) => ({ timeOffRequests: [request, ...s.timeOffRequests] }))
        return { ok: true }
      },

      cancelTimeOff: (requestId, agentId) => {
        const req = get().timeOffRequests.find((r) => r.id === requestId)
        if (!req) return { ok: false, reason: 'not_found' }
        if (req.agentId !== agentId) return { ok: false, reason: 'forbidden' }
        if (req.status !== 'pending') return { ok: false, reason: 'already_processed' }
        set((s) => ({ timeOffRequests: s.timeOffRequests.filter((r) => r.id !== requestId) }))
        return { ok: true }
      },

      approveTimeOff: (requestId) => {
        const { timeOffRequests, agents } = get()
        const req = timeOffRequests.find((r) => r.id === requestId)
        if (!req) return { ok: false, reason: 'not_found' }
        if (req.status !== 'pending') return { ok: false, reason: 'already_processed' }
        const agent = agents.find((a) => a.id === req.agentId)
        if (!agent) return { ok: false, reason: 'not_found' }
        const deducts = req.type === 'vacation'
        if (deducts && agent.ptoBalanceHours < req.hours) {
          return { ok: false, reason: 'insufficient_pto' }
        }
        set((s) => ({
          timeOffRequests: s.timeOffRequests.map((r) =>
            r.id === requestId ? { ...r, status: 'approved' } : r,
          ),
          agents: deducts
            ? s.agents.map((a) =>
                a.id === agent.id ? { ...a, ptoBalanceHours: a.ptoBalanceHours - req.hours } : a,
              )
            : s.agents,
        }))
        return { ok: true }
      },

      rejectTimeOff: (requestId) => {
        const req = get().timeOffRequests.find((r) => r.id === requestId)
        if (!req) return { ok: false, reason: 'not_found' }
        if (req.status !== 'pending') return { ok: false, reason: 'already_processed' }
        set((s) => ({
          timeOffRequests: s.timeOffRequests.map((r) =>
            r.id === requestId ? { ...r, status: 'rejected' } : r,
          ),
        }))
        return { ok: true }
      },

      resetDemoData: () => set(seed()),
    }),
    { name: 'vooxline-workforce', version: 1 },
  ),
)
