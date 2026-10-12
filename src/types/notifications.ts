export type NotificationCategory = 'attendance' | 'time_off' | 'schedule' | 'helpdesk' | 'forms' | 'updates' | 'system'

/** Notificación dentro de la app para UN usuario */
export interface AppNotification {
  id: string
  recipientId: string
  title: string
  body: string
  category: NotificationCategory
  /** Ruta interna: /portal/... para agentes, ruta de consola para supervisores */
  link: string
  /** ISO */
  createdAt: string
  /** ISO, null = sin leer */
  readAt: string | null
}

export type NotificationDraft = Pick<AppNotification, 'recipientId' | 'title' | 'body' | 'category' | 'link'>

export type NotificationError = 'not_found' | 'invalid' | 'forbidden'

export type NotificationResult = { ok: true } | { ok: false; reason: NotificationError }
