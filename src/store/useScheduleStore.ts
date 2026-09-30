import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ScheduleError, ScheduleResult, Shift } from '@/types/scheduling'
import { buildMockShifts } from '@/data/scheduleMock'
import { getProfile } from '@/lib/groups'
import {
  addDays,
  daysBetween,
  isDateStr,
  isOnApprovedTimeOff,
  isTimeStr,
  shiftsOverlap,
  toMinutes,
} from '@/lib/schedule'
import { useDirectoryStore } from '@/store/useDirectoryStore'
import { useWorkforceStore } from '@/store/useWorkforceStore'

type ShiftDraft = Pick<Shift, 'agentId' | 'campaignId' | 'date' | 'startTime' | 'endTime' | 'breakMinutes'> & {
  /** Al editar: id del turno que se está modificando, para no chocar consigo mismo */
  id?: string
}

export interface NewShiftInput {
  agentId: string
  /** Si no se manda, se usa la campaña del agente */
  campaignId?: string
  date: string
  startTime: string
  endTime: string
  breakMinutes: number
  note?: string
}

export type ShiftPatch = Partial<
  Pick<Shift, 'agentId' | 'campaignId' | 'date' | 'startTime' | 'endTime' | 'breakMinutes' | 'note'>
>

interface ScheduleState {
  shifts: Shift[]

  createShift: (input: NewShiftInput) => ScheduleResult
  updateShift: (shiftId: string, patch: ShiftPatch) => ScheduleResult
  /** Conserva el registro, pero deja de contar para horarios y turnos programados */
  cancelShift: (shiftId: string) => ScheduleResult
  deleteShift: (shiftId: string) => ScheduleResult
  /** Copia los turnos activos de una semana (lunes) a otra. Omite los que chocarían con permisos, traslapes o usuarios inactivos. */
  copyWeek: (fromMonday: string, toMonday: string) => { created: number; skipped: number }

  resetScheduleDemo: () => void
}

/** Reglas de negocio de un turno. Devuelve el motivo del error, o null si es válido. */
function validate(draft: ShiftDraft, existing: Shift[]): ScheduleError | null {
  const workforce = useWorkforceStore.getState()
  if (!workforce.agents.some((a) => a.id === draft.agentId)) return 'not_found'
  if (!workforce.campaigns.some((c) => c.id === draft.campaignId)) return 'invalid'
  if (!getProfile(useDirectoryStore.getState().profiles, draft.agentId).active) return 'inactive_user'

  if (!isDateStr(draft.date) || !isTimeStr(draft.startTime) || !isTimeStr(draft.endTime)) return 'invalid'
  const duration = toMinutes(draft.endTime) - toMinutes(draft.startTime)
  if (duration <= 0) return 'invalid'
  if (!Number.isFinite(draft.breakMinutes) || draft.breakMinutes < 0 || draft.breakMinutes >= duration) return 'invalid'

  if (isOnApprovedTimeOff(workforce.timeOffRequests, draft.agentId, draft.date)) return 'on_time_off'

  const overlaps = existing.some(
    (s) =>
      s.id !== draft.id &&
      s.status === 'scheduled' &&
      s.agentId === draft.agentId &&
      s.date === draft.date &&
      shiftsOverlap(s, draft),
  )
  return overlaps ? 'overlap' : null
}

function stripUndefined<T extends object>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T
}

export const useScheduleStore = create<ScheduleState>()(
  persist(
    (set, get) => ({
      shifts: buildMockShifts(),

      createShift: (input) => {
        const agent = useWorkforceStore.getState().agents.find((a) => a.id === input.agentId)
        if (!agent) return { ok: false, reason: 'not_found' }
        const draft: ShiftDraft = {
          agentId: input.agentId,
          campaignId: input.campaignId ?? agent.campaignId,
          date: input.date,
          startTime: input.startTime,
          endTime: input.endTime,
          breakMinutes: input.breakMinutes,
        }
        const error = validate(draft, get().shifts)
        if (error) return { ok: false, reason: error }
        const shift: Shift = { ...draft, id: crypto.randomUUID(), status: 'scheduled', note: input.note?.trim() || null }
        set((s) => ({ shifts: [...s.shifts, shift] }))
        return { ok: true }
      },

      updateShift: (shiftId, patch) => {
        const current = get().shifts.find((s) => s.id === shiftId)
        if (!current) return { ok: false, reason: 'not_found' }
        const changes = stripUndefined(patch)
        const draft: ShiftDraft = {
          id: shiftId,
          agentId: changes.agentId ?? current.agentId,
          campaignId: changes.campaignId ?? current.campaignId,
          date: changes.date ?? current.date,
          startTime: changes.startTime ?? current.startTime,
          endTime: changes.endTime ?? current.endTime,
          breakMinutes: changes.breakMinutes ?? current.breakMinutes,
        }
        // Un turno cancelado se puede editar sin validar contra otros
        const error = current.status === 'scheduled' ? validate(draft, get().shifts) : null
        if (error) return { ok: false, reason: error }
        set((s) => ({ shifts: s.shifts.map((x) => (x.id === shiftId ? { ...x, ...changes } : x)) }))
        return { ok: true }
      },

      cancelShift: (shiftId) => {
        if (!get().shifts.some((s) => s.id === shiftId)) return { ok: false, reason: 'not_found' }
        set((s) => ({
          shifts: s.shifts.map((x) => (x.id === shiftId ? { ...x, status: 'cancelled' } : x)),
        }))
        return { ok: true }
      },

      deleteShift: (shiftId) => {
        if (!get().shifts.some((s) => s.id === shiftId)) return { ok: false, reason: 'not_found' }
        set((s) => ({ shifts: s.shifts.filter((x) => x.id !== shiftId) }))
        return { ok: true }
      },

      copyWeek: (fromMonday, toMonday) => {
        const offset = daysBetween(fromMonday, toMonday)
        if (!isDateStr(fromMonday) || !isDateStr(toMonday) || offset === 0) return { created: 0, skipped: 0 }
        const source = get().shifts.filter(
          (s) => s.status === 'scheduled' && s.date >= fromMonday && s.date <= addDays(fromMonday, 6),
        )
        const working = [...get().shifts]
        const created: Shift[] = []
        let skipped = 0
        for (const s of source) {
          const draft: ShiftDraft = {
            agentId: s.agentId,
            campaignId: s.campaignId,
            date: addDays(s.date, offset),
            startTime: s.startTime,
            endTime: s.endTime,
            breakMinutes: s.breakMinutes,
          }
          if (validate(draft, working) !== null) {
            skipped += 1
            continue
          }
          const copy: Shift = { ...draft, id: crypto.randomUUID(), status: 'scheduled', note: s.note }
          working.push(copy)
          created.push(copy)
        }
        if (created.length > 0) set((st) => ({ shifts: [...st.shifts, ...created] }))
        return { created: created.length, skipped }
      },

      resetScheduleDemo: () => set({ shifts: buildMockShifts() }),
    }),
    { name: 'vooxline-schedule', version: 1 },
  ),
)
