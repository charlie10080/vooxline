import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppNotification, NotificationDraft, NotificationResult } from '@/types/notifications'
import { buildMockNotifications } from '@/data/notificationsMock'
import { isInternalLink } from '@/lib/notifications'

/** shortcut: tope local para no llenar localStorage; con backend se paginan en el servidor */
const MAX_NOTIFICATIONS = 300

interface NotificationsState {
  notifications: AppNotification[]
  /** Uso interno (motor de automatizaciones). Valida todo el lote antes de guardar. */
  notify: (drafts: NotificationDraft[]) => NotificationResult
  markRead: (userId: string, notificationId: string) => NotificationResult
  markAllRead: (userId: string) => NotificationResult
  dismiss: (userId: string, notificationId: string) => NotificationResult
  resetNotificationsDemo: () => void
}

const validDraft = (d: NotificationDraft): boolean =>
  d.recipientId.trim() !== '' && d.title.trim() !== '' && isInternalLink(d.link)

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set, get) => {
      /** El dueño de la notificación es el único que puede tocarla */
      const own = (userId: string, id: string): NotificationResult => {
        const n = get().notifications.find((x) => x.id === id)
        if (!n) return { ok: false, reason: 'not_found' }
        if (n.recipientId !== userId) return { ok: false, reason: 'forbidden' }
        return { ok: true }
      }

      return {
        notifications: buildMockNotifications(),

        notify: (drafts) => {
          if (drafts.length === 0 || !drafts.every(validDraft)) return { ok: false, reason: 'invalid' }
          const now = new Date().toISOString()
          const fresh: AppNotification[] = drafts.map((d) => ({
            ...d,
            title: d.title.trim(),
            body: d.body.trim(),
            id: crypto.randomUUID(),
            createdAt: now,
            readAt: null,
          }))
          set((s) => ({ notifications: [...fresh, ...s.notifications].slice(0, MAX_NOTIFICATIONS) }))
          return { ok: true }
        },

        markRead: (userId, id) => {
          const check = own(userId, id)
          if (!check.ok) return check
          const now = new Date().toISOString()
          set((s) => ({ notifications: s.notifications.map((n) => (n.id === id && !n.readAt ? { ...n, readAt: now } : n)) }))
          return { ok: true }
        },

        markAllRead: (userId) => {
          if (!userId) return { ok: false, reason: 'invalid' }
          const now = new Date().toISOString()
          set((s) => ({
            notifications: s.notifications.map((n) => (n.recipientId === userId && !n.readAt ? { ...n, readAt: now } : n)),
          }))
          return { ok: true }
        },

        dismiss: (userId, id) => {
          const check = own(userId, id)
          if (!check.ok) return check
          set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) }))
          return { ok: true }
        },

        resetNotificationsDemo: () => set({ notifications: buildMockNotifications() }),
      }
    },
    { name: 'vooxline-notifications', version: 1 },
  ),
)
