import type { AutomationRule, AutomationRun, AutomationTrigger } from '@/types/automations'

const minutesAgo = (m: number): string => new Date(Date.now() - m * 60_000).toISOString()

const trigger = (kind: AutomationTrigger['kind'], extra: Partial<AutomationTrigger> = {}): AutomationTrigger => ({
  kind,
  alertKind: 'any',
  templateId: null,
  hours: 4,
  ...extra,
})

export function buildMockRules(): AutomationRule[] {
  const created = minutesAgo(60 * 24 * 12)
  const base = { createdBy: 'a-carlos', createdAt: created, updatedAt: created, enabled: true, campaignId: null }
  return [
    {
      ...base,
      id: 'r-location',
      name: 'Avisar a supervisión cuando alguien marca fuera de su ubicación',
      trigger: trigger('attendance_alert', { alertKind: 'outside_location' }),
      actions: [{ kind: 'notify_supervisors' }],
      message: '{agente}: {detalle}. Revisa el marcaje en Time Clock.',
    },
    {
      ...base,
      id: 'r-timeoff-decided',
      name: 'Avisar al agente cuando su permiso cambia de estado',
      trigger: trigger('time_off_decided'),
      actions: [{ kind: 'notify_agent' }],
      message: 'Hola {agente}, {detalle}.',
    },
    {
      ...base,
      id: 'r-ticket-urgent',
      name: 'Ticket urgente en Help Desk',
      trigger: trigger('ticket_high_priority'),
      actions: [{ kind: 'notify_supervisors' }],
      message: 'Nuevo ticket de {agente}: {detalle}.',
    },
    {
      ...base,
      id: 'r-no-show',
      name: 'Ausencia sin marcaje en Fidelis',
      campaignId: 'c-fidelis',
      trigger: trigger('attendance_alert', { alertKind: 'no_show' }),
      actions: [{ kind: 'notify_supervisors' }, { kind: 'notify_agent' }],
      message: '{agente} ({campaña}): {detalle}.',
    },
    {
      ...base,
      id: 'r-update-reminder',
      name: 'Recordar avisos sin confirmar',
      trigger: trigger('update_unconfirmed', { hours: 24 }),
      actions: [{ kind: 'notify_agent' }],
      message: '{agente}, tienes pendiente confirmar: {detalle}.',
    },
    {
      ...base,
      id: 'r-swap',
      name: 'Intercambios por aprobar a Valeria',
      enabled: false,
      trigger: trigger('swap_pending_approval'),
      actions: [{ kind: 'notify_user', userId: 'a-valeria' }],
      message: 'Intercambio por aprobar: {detalle}.',
    },
  ]
}

export function buildMockRuns(): AutomationRun[] {
  return [
    {
      id: 'run-1',
      ruleId: 'r-location',
      ruleName: 'Avisar a supervisión cuando alguien marca fuera de su ubicación',
      at: minutesAgo(25),
      detail: 'Marcó fuera de su ubicación (ayer)',
      agentId: 'a-sofia',
      recipientIds: ['a-carlos', 'a-valeria'],
    },
    {
      id: 'run-2',
      ruleId: 'r-ticket-urgent',
      ruleName: 'Ticket urgente en Help Desk',
      at: minutesAgo(70),
      detail: 'HD-1049 · prioridad Crítica',
      agentId: 'a-alejandro-t',
      recipientIds: ['a-carlos', 'a-valeria'],
    },
    {
      id: 'run-3',
      ruleId: 'r-timeoff-decided',
      ruleName: 'Avisar al agente cuando su permiso cambia de estado',
      at: minutesAgo(60 * 26),
      detail: 'tu solicitud de vacaciones fue aprobada',
      agentId: 'a-maria',
      recipientIds: ['a-maria'],
    },
  ]
}
