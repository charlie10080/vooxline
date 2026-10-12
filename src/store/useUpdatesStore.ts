import { useEffect, useState } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Update, UpdateAudience, UpdateCategory, UpdateError, UpdateEvent, UpdateResult } from '@/types/updates'
import { buildMockUpdates } from '@/data/updatesMock'
import { getProfile } from '@/lib/groups'
import { countAttention, getUpdateState, getUpdateStats, resolveAudience } from '@/lib/updates'
import type { Attention, AudienceContext } from '@/lib/updates'
import { useDirectoryStore } from '@/store/useDirectoryStore'
import { useSessionStore } from '@/store/useSessionStore'
import { useWorkforceStore } from '@/store/useWorkforceStore'

export type UpdateInput = Pick<
  Update,
  'title' | 'body' | 'category' | 'audience' | 'requiresConfirmation' | 'pinned' | 'commentsEnabled' | 'publishAt' | 'expiresAt'
>

interface UpdatesState {
  updates: Update[]

  /** publish=false guarda borrador */
  createUpdate: (input: UpdateInput, publish: boolean) => UpdateResult
  editUpdate: (id: string, input: UpdateInput) => UpdateResult
  publishUpdate: (id: string) => UpdateResult
  archiveUpdate: (id: string) => UpdateResult
  restoreUpdate: (id: string) => UpdateResult
  deleteUpdate: (id: string) => UpdateResult
  togglePin: (id: string) => UpdateResult
  /** Registra un recordatorio para quienes no han leído / confirmado */
  sendReminder: (id: string) => UpdateResult

  markRead: (id: string) => UpdateResult
  confirmRead: (id: string) => UpdateResult
  toggleLike: (id: string) => UpdateResult
  addComment: (id: string, body: string) => UpdateResult

  resetUpdatesDemo: () => void
}

const CATEGORIES: UpdateCategory[] = ['operation', 'campaign', 'hr', 'urgent']

function audienceContext(): AudienceContext {
  const { profiles, groups } = useDirectoryStore.getState()
  return { agents: useWorkforceStore.getState().agents, profiles, groups }
}

function actor(): { id: string; isManager: boolean } {
  const id = useSessionStore.getState().currentUserId
  return { id, isManager: getProfile(useDirectoryStore.getState().profiles, id).role !== 'agent' }
}

const isIsoOrNull = (v: string | null): boolean => v === null || !Number.isNaN(Date.parse(v))

function validAudience(a: UpdateAudience): boolean {
  if (a.kind === 'everyone') return true
  if (a.kind === 'campaigns') {
    const campaigns = useWorkforceStore.getState().campaigns
    return a.campaignIds.length > 0 && a.campaignIds.every((id) => campaigns.some((c) => c.id === id))
  }
  return useDirectoryStore.getState().groups.some((g) => g.id === a.groupId)
}

/** Devuelve la entrada limpia o el motivo del error */
function clean(input: UpdateInput): UpdateInput | UpdateError {
  const title = input.title.trim()
  const body = input.body.trim()
  if (title.length < 3 || title.length > 120 || body.length === 0 || body.length > 5000) return 'invalid'
  if (!CATEGORIES.includes(input.category) || !validAudience(input.audience)) return 'invalid'
  if (!isIsoOrNull(input.publishAt) || !isIsoOrNull(input.expiresAt)) return 'invalid'
  const start = input.publishAt ? Date.parse(input.publishAt) : Date.now()
  if (input.expiresAt && Date.parse(input.expiresAt) <= start) return 'invalid'
  return { ...input, title, body }
}

const newEvent = (kind: UpdateEvent['kind'], actorId: string, note: string | null = null): UpdateEvent => ({
  id: crypto.randomUUID(),
  kind,
  actorId,
  at: new Date().toISOString(),
  note,
})

export const useUpdatesStore = create<UpdatesState>()(
  persist(
    (set, get) => {
      const patch = (id: string, fn: (u: Update) => Update) =>
        set((s) => ({ updates: s.updates.map((u) => (u.id === id ? fn(u) : u)) }))

      /** Gestión: solo supervisores/admins */
      const managed = (id: string): { update: Update; actorId: string } | UpdateError => {
        const me = actor()
        if (!me.isManager) return 'forbidden'
        const update = get().updates.find((u) => u.id === id)
        return update ? { update, actorId: me.id } : 'not_found'
      }

      /** Participación: el aviso debe estar vigente y dirigido al usuario actual */
      const targeted = (id: string): { update: Update; userId: string } | UpdateError => {
        const me = actor()
        const update = get().updates.find((u) => u.id === id)
        if (!update) return 'not_found'
        if (getUpdateState(update, Date.now()) !== 'live') return 'not_live'
        if (!resolveAudience(update.audience, update.authorId, audienceContext()).includes(me.id)) return 'not_in_audience'
        return { update, userId: me.id }
      }

      return {
        updates: buildMockUpdates(),

        createUpdate: (input, publish) => {
          const me = actor()
          if (!me.isManager) return { ok: false, reason: 'forbidden' }
          const data = clean(input)
          if (typeof data === 'string') return { ok: false, reason: data }
          const history = [newEvent('created', me.id)]
          if (publish) history.push(newEvent('published', me.id, data.publishAt ? 'Programado' : null))
          const update: Update = {
            ...data,
            id: crypto.randomUUID(),
            status: publish ? 'published' : 'draft',
            authorId: me.id,
            createdAt: new Date().toISOString(),
            reads: {},
            confirmations: {},
            likes: [],
            comments: [],
            history,
          }
          set((s) => ({ updates: [update, ...s.updates] }))
          return { ok: true }
        },

        editUpdate: (id, input) => {
          const m = managed(id)
          if (typeof m === 'string') return { ok: false, reason: m }
          const data = clean(input)
          if (typeof data === 'string') return { ok: false, reason: data }
          patch(id, (u) => ({ ...u, ...data, history: [...u.history, newEvent('edited', m.actorId)] }))
          return { ok: true }
        },

        publishUpdate: (id) => {
          const m = managed(id)
          if (typeof m === 'string') return { ok: false, reason: m }
          if (m.update.status !== 'draft') return { ok: false, reason: 'invalid' }
          const data = clean(m.update) // las fechas del borrador pueden haber quedado en el pasado
          if (typeof data === 'string') return { ok: false, reason: data }
          patch(id, (u) => ({
            ...u,
            status: 'published',
            history: [...u.history, newEvent('published', m.actorId, u.publishAt ? 'Programado' : null)],
          }))
          return { ok: true }
        },

        archiveUpdate: (id) => {
          const m = managed(id)
          if (typeof m === 'string') return { ok: false, reason: m }
          if (m.update.status === 'archived') return { ok: false, reason: 'invalid' }
          patch(id, (u) => ({ ...u, status: 'archived', pinned: false, history: [...u.history, newEvent('archived', m.actorId)] }))
          return { ok: true }
        },

        restoreUpdate: (id) => {
          const m = managed(id)
          if (typeof m === 'string') return { ok: false, reason: m }
          if (m.update.status !== 'archived') return { ok: false, reason: 'invalid' }
          patch(id, (u) => ({ ...u, status: 'published', history: [...u.history, newEvent('restored', m.actorId)] }))
          return { ok: true }
        },

        deleteUpdate: (id) => {
          const m = managed(id)
          if (typeof m === 'string') return { ok: false, reason: m }
          set((s) => ({ updates: s.updates.filter((u) => u.id !== id) }))
          return { ok: true }
        },

        togglePin: (id) => {
          const m = managed(id)
          if (typeof m === 'string') return { ok: false, reason: m }
          if (m.update.status === 'archived') return { ok: false, reason: 'invalid' }
          patch(id, (u) => ({ ...u, pinned: !u.pinned }))
          return { ok: true }
        },

        sendReminder: (id) => {
          const m = managed(id)
          if (typeof m === 'string') return { ok: false, reason: m }
          if (getUpdateState(m.update, Date.now()) !== 'live') return { ok: false, reason: 'not_live' }
          const pending = getUpdateStats(m.update, audienceContext()).pending.length
          if (pending === 0) return { ok: false, reason: 'nobody_pending' }
          const note = `Recordatorio a ${pending} ${pending === 1 ? 'persona pendiente' : 'personas pendientes'}`
          patch(id, (u) => ({ ...u, history: [...u.history, newEvent('reminder', m.actorId, note)] }))
          return { ok: true }
        },

        markRead: (id) => {
          const t = targeted(id)
          if (typeof t === 'string') return { ok: false, reason: t }
          if (!t.update.reads[t.userId]) {
            patch(id, (u) => ({ ...u, reads: { ...u.reads, [t.userId]: new Date().toISOString() } }))
          }
          return { ok: true }
        },

        confirmRead: (id) => {
          const t = targeted(id)
          if (typeof t === 'string') return { ok: false, reason: t }
          if (!t.update.requiresConfirmation) return { ok: false, reason: 'confirmation_not_required' }
          if (t.update.confirmations[t.userId]) return { ok: true }
          const now = new Date().toISOString()
          patch(id, (u) => ({
            ...u,
            reads: { [t.userId]: now, ...u.reads },
            confirmations: { ...u.confirmations, [t.userId]: now },
          }))
          return { ok: true }
        },

        toggleLike: (id) => {
          const t = targeted(id)
          if (typeof t === 'string') return { ok: false, reason: t }
          patch(id, (u) => ({
            ...u,
            likes: u.likes.includes(t.userId) ? u.likes.filter((x) => x !== t.userId) : [...u.likes, t.userId],
          }))
          return { ok: true }
        },

        addComment: (id, body) => {
          const text = body.trim()
          if (text.length === 0 || text.length > 1000) return { ok: false, reason: 'invalid' }
          const me = actor()
          const update = get().updates.find((u) => u.id === id)
          if (!update) return { ok: false, reason: 'not_found' }
          // Los supervisores pueden responder aunque no estén en la audiencia
          if (!me.isManager) {
            const t = targeted(id)
            if (typeof t === 'string') return { ok: false, reason: t }
          }
          if (!update.commentsEnabled) return { ok: false, reason: 'comments_disabled' }
          const comment = { id: crypto.randomUUID(), authorId: me.id, body: text, createdAt: new Date().toISOString() }
          patch(id, (u) => ({ ...u, comments: [...u.comments, comment] }))
          return { ok: true }
        },

        resetUpdatesDemo: () => set({ updates: buildMockUpdates() }),
      }
    },
    { name: 'vooxline-updates', version: 1 },
  ),
)

/** Avisos sin leer / por confirmar de un usuario (para el badge del menú lateral) */
export function useUpdatesAttention(userId: string): Attention {
  const updates = useUpdatesStore((s) => s.updates)
  const agents = useWorkforceStore((s) => s.agents)
  const profiles = useDirectoryStore((s) => s.profiles)
  const groups = useDirectoryStore((s) => s.groups)
  // Se refresca cada minuto para que los avisos programados entren al badge solos
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(t)
  }, [])
  return countAttention(updates, userId, { agents, profiles, groups }, now)
}
