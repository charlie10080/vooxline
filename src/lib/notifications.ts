import type { AppNotification, NotificationCategory } from '@/types/notifications'

export const NOTIFICATION_CATEGORY_LABELS: Record<NotificationCategory, string> = {
  attendance: 'Asistencia',
  time_off: 'Permisos',
  schedule: 'Turnos',
  helpdesk: 'Soporte',
  forms: 'Formularios',
  updates: 'Avisos',
  system: 'Sistema',
}

const CONSOLE_LINKS: Record<NotificationCategory, string> = {
  attendance: '/time-clock',
  time_off: '/time-off',
  schedule: '/scheduling',
  helpdesk: '/helpdesk',
  forms: '/forms',
  updates: '/updates',
  system: '/automations',
}

const PORTAL_LINKS: Record<NotificationCategory, string> = {
  attendance: '/portal/horas',
  time_off: '/portal/permisos',
  schedule: '/portal/horario',
  helpdesk: '/portal/soporte',
  forms: '/portal/formularios',
  updates: '/portal/avisos',
  system: '/portal',
}

/** Supervisores van a la consola; los agentes, a su portal */
export const linkFor = (category: NotificationCategory, recipientIsManager: boolean): string =>
  (recipientIsManager ? CONSOLE_LINKS : PORTAL_LINKS)[category]

/** Solo rutas internas: evita que un link lleve fuera de la app */
export const isInternalLink = (link: string): boolean => link.startsWith('/') && !link.startsWith('//')

export const notificationsFor = (all: AppNotification[], userId: string): AppNotification[] =>
  all.filter((n) => n.recipientId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))

export const unreadCount = (all: AppNotification[], userId: string): number =>
  all.filter((n) => n.recipientId === userId && n.readAt === null).length
