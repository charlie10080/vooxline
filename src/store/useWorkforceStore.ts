import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  ActionResult,
  Agent,
  Campaign,
  TimeEntry,
  TimeOffRequest,
} from '@/types'
import { mockAgents, mockCampaigns, mockTimeEntries, mockTimeOffRequests } from '@/data/mock'
import { needsSupervisorReview } from '@/lib/metrics'

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
  clockIn: (agentId: string) => ActionResult
  clockOut: (agentId: string) => ActionResult

  // Motor de aprobación
  approveEntry: (entryId: string, supervisorConfirmed?: boolean) => ActionResult
  rejectEntry: (entryId: string) => ActionResult
  /** Aprueba todas las pendientes cerradas y sin desviación > 15 min. Devuelve las bloqueadas. */
  approveBatch: () => { approved: number; blockedIds: string[] }

  // Time Off
  createTimeOff: (input: NewTimeOffInput) => void
  approveTimeOff: (requestId: string) => ActionResult
  rejectTimeOff: (requestId: string) => ActionResult

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

      clockIn: (agentId) => {
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
          scheduledMinutes: agent.shiftMinutes,
          status: 'pending',
          note: null,
        }
        set((s) => ({
          timeEntries: [entry, ...s.timeEntries],
          agents: s.agents.map((a) =>
            a.id === agentId ? { ...a, status: 'available', statusSince: now } : a,
          ),
        }))
        return { ok: true }
      },

      clockOut: (agentId) => {
        const open = get().timeEntries.find((e) => e.agentId === agentId && e.clockOut === null)
        if (!open) return { ok: false, reason: 'not_clocked_in' }
        const now = new Date().toISOString()
        set((s) => ({
          timeEntries: s.timeEntries.map((e) => (e.id === open.id ? { ...e, clockOut: now } : e)),
          agents: s.agents.map((a) =>
            a.id === agentId ? { ...a, status: 'offline', statusSince: now } : a,
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
        const request: TimeOffRequest = {
          ...input,
          id: crypto.randomUUID(),
          status: 'pending',
          requestedAt: new Date().toISOString(),
        }
        set((s) => ({ timeOffRequests: [request, ...s.timeOffRequests] }))
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
