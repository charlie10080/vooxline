import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { OpenShift, ScheduleError, ScheduleResult, Shift, ShiftClaim, SwapRequest } from '@/types/scheduling'
import { buildMockClaims, buildMockOpenShifts, buildMockShifts, buildMockSwaps } from '@/data/scheduleMock'
import { getProfile } from '@/lib/groups'
import {
  addDays,
  daysBetween,
  isDateStr,
  isOnApprovedTimeOff,
  isSwapPending,
  isTimeStr,
  isUpcoming,
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

  // ---------- Turnos abiertos (actorId = usuario que hace la acción) ----------
  openShifts: OpenShift[]
  claims: ShiftClaim[]
  /** Solo supervisores/admins */
  createOpenShift: (actorId: string, input: NewOpenShiftInput) => ScheduleResult
  deleteOpenShift: (actorId: string, openShiftId: string) => ScheduleResult
  /** Si el turno no requiere aprobación, se asigna al instante */
  claimOpenShift: (actorId: string, openShiftId: string) => ScheduleResult
  decideClaim: (actorId: string, claimId: string, approve: boolean) => ScheduleResult

  // ---------- Intercambios ----------
  swaps: SwapRequest[]
  /** toAgentId null = se ofrece a cualquiera de la misma campaña */
  requestSwap: (actorId: string, shiftId: string, toAgentId: string | null, note?: string) => ScheduleResult
  /** Respuesta del compañero */
  respondSwap: (actorId: string, swapId: string, accept: boolean) => ScheduleResult
  /** Decisión del supervisor; al aprobar, el turno cambia de agente */
  decideSwap: (actorId: string, swapId: string, approve: boolean) => ScheduleResult
  cancelSwap: (actorId: string, swapId: string) => ScheduleResult

  resetScheduleDemo: () => void
}

export interface NewOpenShiftInput {
  campaignId: string
  date: string
  startTime: string
  endTime: string
  breakMinutes: number
  requiresApproval: boolean
  note?: string
}

function validTiming(d: Pick<Shift, 'date' | 'startTime' | 'endTime' | 'breakMinutes'>): boolean {
  if (!isDateStr(d.date) || !isTimeStr(d.startTime) || !isTimeStr(d.endTime)) return false
  const duration = toMinutes(d.endTime) - toMinutes(d.startTime)
  return duration > 0 && Number.isFinite(d.breakMinutes) && d.breakMinutes >= 0 && d.breakMinutes < duration
}

const isManager = (agentId: string): boolean =>
  getProfile(useDirectoryStore.getState().profiles, agentId).role !== 'agent'

const nowIso = (): string => new Date().toISOString()

/** Reglas de negocio de un turno. Devuelve el motivo del error, o null si es válido. */
function validate(draft: ShiftDraft, existing: Shift[]): ScheduleError | null {
  const workforce = useWorkforceStore.getState()
  if (!workforce.agents.some((a) => a.id === draft.agentId)) return 'not_found'
  if (!workforce.campaigns.some((c) => c.id === draft.campaignId)) return 'invalid'
  if (!getProfile(useDirectoryStore.getState().profiles, draft.agentId).active) return 'inactive_user'
  if (!validTiming(draft)) return 'invalid'

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

const openShiftDraft = (os: OpenShift, agentId: string): ShiftDraft => ({
  agentId,
  campaignId: os.campaignId,
  date: os.date,
  startTime: os.startTime,
  endTime: os.endTime,
  breakMinutes: os.breakMinutes,
})

/** Turno del intercambio, solo si sigue programado y sigue siendo del solicitante */
const swapShift = (swap: SwapRequest, shifts: Shift[]): Shift | undefined =>
  shifts.find((s) => s.id === swap.shiftId && s.status === 'scheduled' && s.agentId === swap.fromAgentId)

function stripUndefined<T extends object>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T
}

export const useScheduleStore = create<ScheduleState>()(
  persist(
    (set, get) => {
      /** Crea el turno del agente, marca el turno abierto como cubierto y rechaza las demás tomas pendientes */
      const fillOpenShift = (os: OpenShift, claim: ShiftClaim): void => {
        const shift: Shift = { ...openShiftDraft(os, claim.agentId), id: crypto.randomUUID(), status: 'scheduled', note: os.note }
        set((s) => ({
          shifts: [...s.shifts, shift],
          openShifts: s.openShifts.map((o) => (o.id === os.id ? { ...o, status: 'filled', filledShiftId: shift.id } : o)),
          claims: [
            ...s.claims
              .filter((c) => c.id !== claim.id)
              .map((c) =>
                c.openShiftId === os.id && c.status === 'pending'
                  ? { ...c, status: 'rejected' as const, decidedBy: claim.decidedBy, decidedAt: nowIso() }
                  : c,
              ),
            claim,
          ],
        }))
      }

      return {
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

        openShifts: buildMockOpenShifts(),
        claims: buildMockClaims(),
        swaps: buildMockSwaps(),

        createOpenShift: (actorId, input) => {
          if (!isManager(actorId)) return { ok: false, reason: 'forbidden' }
          if (!useWorkforceStore.getState().campaigns.some((c) => c.id === input.campaignId)) return { ok: false, reason: 'invalid' }
          if (!validTiming(input)) return { ok: false, reason: 'invalid' }
          if (!isUpcoming(input)) return { ok: false, reason: 'past_shift' }
          const openShift: OpenShift = {
            id: crypto.randomUUID(),
            campaignId: input.campaignId,
            date: input.date,
            startTime: input.startTime,
            endTime: input.endTime,
            breakMinutes: input.breakMinutes,
            note: input.note?.trim() || null,
            requiresApproval: input.requiresApproval,
            status: 'open',
            createdBy: actorId,
            createdAt: nowIso(),
            filledShiftId: null,
          }
          set((s) => ({ openShifts: [...s.openShifts, openShift] }))
          return { ok: true }
        },

        deleteOpenShift: (actorId, openShiftId) => {
          if (!isManager(actorId)) return { ok: false, reason: 'forbidden' }
          if (!get().openShifts.some((o) => o.id === openShiftId)) return { ok: false, reason: 'not_found' }
          set((s) => ({
            openShifts: s.openShifts.filter((o) => o.id !== openShiftId),
            claims: s.claims.filter((c) => c.openShiftId !== openShiftId),
          }))
          return { ok: true }
        },

        claimOpenShift: (actorId, openShiftId) => {
          const os = get().openShifts.find((o) => o.id === openShiftId)
          if (!os) return { ok: false, reason: 'not_found' }
          if (os.status !== 'open') return { ok: false, reason: 'not_pending' }
          if (!isUpcoming(os)) return { ok: false, reason: 'past_shift' }
          if (get().claims.some((c) => c.openShiftId === os.id && c.agentId === actorId && c.status === 'pending'))
            return { ok: false, reason: 'duplicate' }
          const error = validate(openShiftDraft(os, actorId), get().shifts)
          if (error) return { ok: false, reason: error }
          const claim: ShiftClaim = {
            id: crypto.randomUUID(),
            openShiftId: os.id,
            agentId: actorId,
            status: os.requiresApproval ? 'pending' : 'approved',
            createdAt: nowIso(),
            decidedBy: null,
            decidedAt: os.requiresApproval ? null : nowIso(),
          }
          if (os.requiresApproval) set((s) => ({ claims: [...s.claims, claim] }))
          else fillOpenShift(os, claim)
          return { ok: true }
        },

        decideClaim: (actorId, claimId, approve) => {
          if (!isManager(actorId)) return { ok: false, reason: 'forbidden' }
          const claim = get().claims.find((c) => c.id === claimId)
          if (!claim) return { ok: false, reason: 'not_found' }
          if (claim.status !== 'pending') return { ok: false, reason: 'not_pending' }
          const decided: ShiftClaim = { ...claim, decidedBy: actorId, decidedAt: nowIso(), status: approve ? 'approved' : 'rejected' }
          if (!approve) {
            set((s) => ({ claims: s.claims.map((c) => (c.id === claimId ? decided : c)) }))
            return { ok: true }
          }
          const os = get().openShifts.find((o) => o.id === claim.openShiftId)
          if (!os) return { ok: false, reason: 'not_found' }
          if (os.status !== 'open') return { ok: false, reason: 'not_pending' }
          if (!isUpcoming(os)) return { ok: false, reason: 'past_shift' }
          const error = validate(openShiftDraft(os, claim.agentId), get().shifts)
          if (error) return { ok: false, reason: error }
          fillOpenShift(os, decided)
          return { ok: true }
        },

        requestSwap: (actorId, shiftId, toAgentId, note) => {
          const shift = get().shifts.find((s) => s.id === shiftId)
          if (!shift) return { ok: false, reason: 'not_found' }
          if (shift.agentId !== actorId) return { ok: false, reason: 'forbidden' }
          if (shift.status !== 'scheduled') return { ok: false, reason: 'not_pending' }
          if (!isUpcoming(shift)) return { ok: false, reason: 'past_shift' }
          if (toAgentId !== null) {
            if (toAgentId === actorId) return { ok: false, reason: 'invalid' }
            if (!useWorkforceStore.getState().agents.some((a) => a.id === toAgentId)) return { ok: false, reason: 'not_found' }
            if (!getProfile(useDirectoryStore.getState().profiles, toAgentId).active) return { ok: false, reason: 'inactive_user' }
          }
          if (get().swaps.some((w) => w.shiftId === shiftId && isSwapPending(w))) return { ok: false, reason: 'duplicate' }
          const swap: SwapRequest = {
            id: crypto.randomUUID(),
            shiftId,
            fromAgentId: actorId,
            toAgentId,
            acceptedBy: null,
            note: note?.trim() || null,
            status: 'pending_peer',
            createdAt: nowIso(),
            decidedBy: null,
            decidedAt: null,
          }
          set((s) => ({ swaps: [...s.swaps, swap] }))
          return { ok: true }
        },

        respondSwap: (actorId, swapId, accept) => {
          const swap = get().swaps.find((w) => w.id === swapId)
          if (!swap) return { ok: false, reason: 'not_found' }
          if (swap.status !== 'pending_peer') return { ok: false, reason: 'not_pending' }
          const shift = swapShift(swap, get().shifts)
          if (!shift) return { ok: false, reason: 'not_pending' }
          const actorCampaign = useWorkforceStore.getState().agents.find((a) => a.id === actorId)?.campaignId
          const canRespond =
            swap.toAgentId !== null
              ? swap.toAgentId === actorId
              : actorId !== swap.fromAgentId && actorCampaign === shift.campaignId
          if (!canRespond) return { ok: false, reason: 'forbidden' }
          if (!accept) {
            // Una oferta abierta a la campaña no se "rechaza": simplemente otro la toma
            if (swap.toAgentId === null) return { ok: false, reason: 'forbidden' }
            set((s) => ({ swaps: s.swaps.map((w) => (w.id === swapId ? { ...w, status: 'declined', decidedAt: nowIso() } : w)) }))
            return { ok: true }
          }
          if (!isUpcoming(shift)) return { ok: false, reason: 'past_shift' }
          const error = validate({ ...shift, agentId: actorId }, get().shifts)
          if (error) return { ok: false, reason: error }
          set((s) => ({
            swaps: s.swaps.map((w) => (w.id === swapId ? { ...w, status: 'pending_approval', acceptedBy: actorId } : w)),
          }))
          return { ok: true }
        },

        decideSwap: (actorId, swapId, approve) => {
          if (!isManager(actorId)) return { ok: false, reason: 'forbidden' }
          const swap = get().swaps.find((w) => w.id === swapId)
          if (!swap) return { ok: false, reason: 'not_found' }
          if (swap.status !== 'pending_approval' || !swap.acceptedBy) return { ok: false, reason: 'not_pending' }
          const decided = { decidedBy: actorId, decidedAt: nowIso() }
          if (!approve) {
            set((s) => ({ swaps: s.swaps.map((w) => (w.id === swapId ? { ...w, ...decided, status: 'rejected' } : w)) }))
            return { ok: true }
          }
          const shift = swapShift(swap, get().shifts)
          if (!shift) return { ok: false, reason: 'not_pending' }
          if (!isUpcoming(shift)) return { ok: false, reason: 'past_shift' }
          const newAgentId = swap.acceptedBy
          const error = validate({ ...shift, agentId: newAgentId }, get().shifts)
          if (error) return { ok: false, reason: error }
          set((s) => ({
            shifts: s.shifts.map((x) => (x.id === shift.id ? { ...x, agentId: newAgentId } : x)),
            swaps: s.swaps.map((w) => (w.id === swapId ? { ...w, ...decided, status: 'approved' } : w)),
          }))
          return { ok: true }
        },

        cancelSwap: (actorId, swapId) => {
          const swap = get().swaps.find((w) => w.id === swapId)
          if (!swap) return { ok: false, reason: 'not_found' }
          if (swap.fromAgentId !== actorId) return { ok: false, reason: 'forbidden' }
          if (!isSwapPending(swap)) return { ok: false, reason: 'not_pending' }
          set((s) => ({ swaps: s.swaps.map((w) => (w.id === swapId ? { ...w, status: 'cancelled', decidedAt: nowIso() } : w)) }))
          return { ok: true }
        },

        resetScheduleDemo: () =>
          set({ shifts: buildMockShifts(), openShifts: buildMockOpenShifts(), claims: buildMockClaims(), swaps: buildMockSwaps() }),
      }
    },
    { name: 'vooxline-schedule', version: 1 },
  ),
)
