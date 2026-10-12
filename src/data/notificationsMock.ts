import type { AppNotification } from '@/types/notifications'

const minutesAgo = (m: number): string => new Date(Date.now() - m * 60_000).toISOString()

export function buildMockNotifications(): AppNotification[] {
  return [
    {
      id: 'n-1',
      recipientId: 'a-carlos',
      title: 'Avisar a supervisión: marcaje fuera de ubicación',
      body: 'Sofía Navarro: Marcó fuera de su ubicación (ayer).',
      category: 'attendance',
      link: '/time-clock',
      createdAt: minutesAgo(25),
      readAt: null,
    },
    {
      id: 'n-2',
      recipientId: 'a-carlos',
      title: 'Ticket urgente en Help Desk',
      body: 'Nuevo ticket de prioridad alta: HD-1049 de Alejandro Torres.',
      category: 'helpdesk',
      link: '/helpdesk',
      createdAt: minutesAgo(70),
      readAt: null,
    },
    {
      id: 'n-3',
      recipientId: 'a-carlos',
      title: 'Nueva solicitud de permiso',
      body: 'David Morales solicitó permiso médico (4 h). Revísala en Vacaciones y permisos.',
      category: 'time_off',
      link: '/time-off',
      createdAt: minutesAgo(60 * 5),
      readAt: minutesAgo(60 * 4),
    },
    {
      id: 'n-4',
      recipientId: 'a-valeria',
      title: 'Toma de turno abierto por aprobar',
      body: 'María López quiere tomar un turno abierto. Apruébalo o recházalo en Horarios.',
      category: 'schedule',
      link: '/scheduling',
      createdAt: minutesAgo(40),
      readAt: null,
    },
    {
      id: 'n-5',
      recipientId: 'a-maria',
      title: 'Aviso pendiente de confirmar',
      body: 'Tienes un aviso que requiere tu confirmación de lectura.',
      category: 'updates',
      link: '/portal/avisos',
      createdAt: minutesAgo(90),
      readAt: null,
    },
    {
      id: 'n-6',
      recipientId: 'a-maria',
      title: 'Tu permiso cambió de estado',
      body: 'Tu solicitud de vacaciones fue aprobada. ¡Disfruta tu descanso!',
      category: 'time_off',
      link: '/portal/permisos',
      createdAt: minutesAgo(60 * 26),
      readAt: minutesAgo(60 * 25),
    },
  ]
}
