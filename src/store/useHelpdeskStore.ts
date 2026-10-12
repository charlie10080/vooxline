import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  HelpdeskError,
  HelpdeskResult,
  Ticket,
  TicketCategory,
  TicketEvent,
  TicketPriority,
  TicketStatus,
} from '@/types/helpdesk'
import { buildMockTickets } from '@/data/helpdeskMock'
import { CATEGORY_LABELS, PRIORITY_LABELS, canReopen, canTransition } from '@/lib/helpdesk'
import { getProfile } from '@/lib/groups'
import { useDirectoryStore } from '@/store/useDirectoryStore'
import { useSessionStore } from '@/store/useSessionStore'

export interface NewTicketInput {
  category: TicketCategory
  priority: TicketPriority
  title: string
  description: string
  attachmentName?: string
}

interface HelpdeskState {
  tickets: Ticket[]

  createTicket: (input: NewTicketInput) => { ok: true; id: string } | { ok: false; reason: HelpdeskError }
  /** Respuesta pública, o nota interna (solo managers) */
  addMessage: (ticketId: string, body: string, internal: boolean) => HelpdeskResult
  /** Solo managers; respeta TRANSITIONS */
  setStatus: (ticketId: string, status: TicketStatus) => HelpdeskResult
  /** Solo managers; el responsable debe ser supervisor o admin. null = sin asignar */
  assign: (ticketId: string, assigneeId: string | null) => HelpdeskResult
  /** El solicitante reabre un ticket resuelto dentro de las 72 h */
  reopen: (ticketId: string) => HelpdeskResult
  /** El solicitante califica (1-5) un ticket resuelto o cerrado, una sola vez */
  rate: (ticketId: string, rating: number) => HelpdeskResult

  resetHelpdeskDemo: () => void
}

/** El actor sale de la sesión, no de la página, para que los permisos no dependan de la UI */
function actor(): { id: string; isManager: boolean } {
  const id = useSessionStore.getState().currentUserId
  return { id, isManager: isManagerId(id) }
}

const isManagerId = (id: string): boolean => {
  const profile = getProfile(useDirectoryStore.getState().profiles, id)
  return profile.active && profile.role !== 'agent'
}

const now = (): string => new Date().toISOString()
const event = (actorId: string, kind: TicketEvent['kind'], from: string | null, to: string | null): TicketEvent => ({
  id: crypto.randomUUID(),
  actorId,
  kind,
  from,
  to,
  at: now(),
})

/** Campos que cambian al pasar a un estado (resolvedAt se fija al resolver/cerrar y se limpia al reabrir) */
function statusPatch(t: Ticket, to: TicketStatus, actorId: string): Partial<Ticket> {
  const at = now()
  const done = to === 'resolved' || to === 'closed'
  return {
    status: to,
    resolvedAt: done ? (t.resolvedAt ?? at) : null,
    updatedAt: at,
    history: [...t.history, event(actorId, 'status', t.status, to)],
  }
}

export const useHelpdeskStore = create<HelpdeskState>()(
  persist(
    (set, get) => {
      const patch = (id: string, changes: Partial<Ticket>) =>
        set((s) => ({ tickets: s.tickets.map((t) => (t.id === id ? { ...t, ...changes } : t)) }))
      const find = (id: string) => get().tickets.find((t) => t.id === id)

      return {
        tickets: buildMockTickets(),

        createTicket: (input) => {
          const me = actor()
          const title = input.title?.trim() ?? ''
          const description = input.description?.trim() ?? ''
          const attachmentName = input.attachmentName?.trim() || null
          if (
            !(input.category in CATEGORY_LABELS) ||
            !(input.priority in PRIORITY_LABELS) ||
            title.length < 4 ||
            title.length > 120 ||
            description.length < 10 ||
            description.length > 4000 ||
            (attachmentName !== null && (attachmentName.length > 120 || /[\\/]/.test(attachmentName)))
          )
            return { ok: false, reason: 'invalid' }
          const tickets = get().tickets
          const code = Math.max(1000, ...tickets.map((t) => Number(t.code.slice(3)) || 0)) + 1
          const at = now()
          const ticket: Ticket = {
            id: crypto.randomUUID(),
            code: `HD-${code}`,
            requesterId: me.id,
            category: input.category,
            priority: input.priority,
            title,
            description,
            attachmentName,
            status: 'open',
            assigneeId: null,
            createdAt: at,
            updatedAt: at,
            firstResponseAt: null,
            resolvedAt: null,
            rating: null,
            messages: [],
            history: [event(me.id, 'created', null, 'open')],
          }
          set({ tickets: [ticket, ...tickets] })
          return { ok: true, id: ticket.id }
        },

        addMessage: (ticketId, body, internal) => {
          const me = actor()
          const t = find(ticketId)
          if (!t) return { ok: false, reason: 'not_found' }
          const isRequester = t.requesterId === me.id
          if (!me.isManager && (!isRequester || internal)) return { ok: false, reason: 'forbidden' }
          const text = body?.trim() ?? ''
          if (text.length < 1 || text.length > 4000) return { ok: false, reason: 'invalid' }
          if (t.status === 'closed') return { ok: false, reason: 'invalid_transition' }
          const at = now()
          let changes: Partial<Ticket> = {}
          // El solicitante contesta lo que se le pidió: vuelve a "En progreso"
          if (isRequester && !internal && t.status === 'waiting_user') changes = statusPatch(t, 'in_progress', me.id)
          const isFirstResponse = !internal && !isRequester && t.firstResponseAt === null
          patch(ticketId, {
            ...changes,
            messages: [...t.messages, { id: crypto.randomUUID(), authorId: me.id, body: text, internal, createdAt: at }],
            firstResponseAt: isFirstResponse ? at : t.firstResponseAt,
            updatedAt: at,
          })
          return { ok: true }
        },

        setStatus: (ticketId, status) => {
          const me = actor()
          const t = find(ticketId)
          if (!t) return { ok: false, reason: 'not_found' }
          if (!me.isManager) return { ok: false, reason: 'forbidden' }
          if (!canTransition(t.status, status)) return { ok: false, reason: 'invalid_transition' }
          patch(ticketId, statusPatch(t, status, me.id))
          return { ok: true }
        },

        assign: (ticketId, assigneeId) => {
          const me = actor()
          const t = find(ticketId)
          if (!t) return { ok: false, reason: 'not_found' }
          if (!me.isManager) return { ok: false, reason: 'forbidden' }
          if (t.status === 'closed') return { ok: false, reason: 'invalid_transition' }
          if (assigneeId !== null && !isManagerId(assigneeId)) return { ok: false, reason: 'assignee_not_manager' }
          if (assigneeId === t.assigneeId) return { ok: true }
          patch(ticketId, {
            assigneeId,
            updatedAt: now(),
            history: [...t.history, event(me.id, 'assignee', t.assigneeId, assigneeId)],
          })
          return { ok: true }
        },

        reopen: (ticketId) => {
          const me = actor()
          const t = find(ticketId)
          if (!t) return { ok: false, reason: 'not_found' }
          if (t.requesterId !== me.id) return { ok: false, reason: 'forbidden' }
          if (t.status !== 'resolved') return { ok: false, reason: 'not_resolved' }
          if (!canReopen(t)) return { ok: false, reason: 'reopen_expired' }
          patch(ticketId, { ...statusPatch(t, 'in_progress', me.id), rating: null })
          return { ok: true }
        },

        rate: (ticketId, rating) => {
          const me = actor()
          const t = find(ticketId)
          if (!t) return { ok: false, reason: 'not_found' }
          if (t.requesterId !== me.id) return { ok: false, reason: 'forbidden' }
          if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { ok: false, reason: 'invalid' }
          if (t.status !== 'resolved' && t.status !== 'closed') return { ok: false, reason: 'not_resolved' }
          if (t.rating !== null) return { ok: false, reason: 'already_rated' }
          patch(ticketId, {
            rating,
            updatedAt: now(),
            history: [...t.history, event(me.id, 'rated', null, String(rating))],
          })
          return { ok: true }
        },

        resetHelpdeskDemo: () => set({ tickets: buildMockTickets() }),
      }
    },
    { name: 'vooxline-helpdesk', version: 1 },
  ),
)
