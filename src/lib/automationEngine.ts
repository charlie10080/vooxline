import type { Agent, Campaign, TimeEntry, TimeOffRequest, TimeOffType } from '@/types'
import type { AutomationEvent, AutomationRun, AutomationTrigger } from '@/types/automations'
import type { SmartGroup, UserProfile } from '@/types/directory'
import type { FormSubmission, FormTemplate } from '@/types/forms'
import type { Ticket } from '@/types/helpdesk'
import type { NotificationDraft } from '@/types/notifications'
import type { OpenShift, Shift, ShiftClaim, SwapRequest } from '@/types/scheduling'
import type { Update } from '@/types/updates'
import { firedKey, matchesCampaign, renderTemplate, resolveRecipients } from '@/lib/automations'
import { getProfile } from '@/lib/groups'
import { PRIORITY_LABELS, slaState } from '@/lib/helpdesk'
import { linkFor } from '@/lib/notifications'
import { describeAlert, getAttendanceAlerts } from '@/lib/punctuality'
import { getUpdateState, publishedAt, resolveAudience } from '@/lib/updates'
import { useAutomationsStore } from '@/store/useAutomationsStore'
import { useDirectoryStore } from '@/store/useDirectoryStore'
import { useFormsStore } from '@/store/useFormsStore'
import { useHelpdeskStore } from '@/store/useHelpdeskStore'
import { useNotificationsStore } from '@/store/useNotificationsStore'
import { useScheduleStore } from '@/store/useScheduleStore'
import { useUpdatesStore } from '@/store/useUpdatesStore'
import { useWorkforceStore } from '@/store/useWorkforceStore'

/*
 * Motor de automatizaciones. Ningún store importa este archivo: App.tsx llama startAutomations().
 * Cada regla mira el estado ACTUAL de los datos, lo convierte en eventos con clave estable
 * y dispara una sola vez por clave (las claves se guardan en useAutomationsStore).
 */

export interface AutomationSources {
  agents: Agent[]
  campaigns: Campaign[]
  profiles: UserProfile[]
  groups: SmartGroup[]
  timeEntries: TimeEntry[]
  timeOffRequests: TimeOffRequest[]
  shifts: Shift[]
  openShifts: OpenShift[]
  claims: ShiftClaim[]
  swaps: SwapRequest[]
  tickets: Ticket[]
  templates: FormTemplate[]
  submissions: FormSubmission[]
  updates: Update[]
}

const TIME_OFF_LABELS: Record<TimeOffType, string> = { vacation: 'vacaciones', medical: 'permiso médico', personal: 'permiso personal' }

const fmtDate = (date: string): string =>
  new Date(`${date}T00:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })

const dateRange = (start: string, end: string): string => (start === end ? fmtDate(start) : `${fmtDate(start)} al ${fmtDate(end)}`)

/** Eventos vigentes para un disparador (puro: solo lee `src`) */
export function collectEvents(trigger: AutomationTrigger, src: AutomationSources, now: Date): AutomationEvent[] {
  const agentCampaign = (id: string | null): string | null => src.agents.find((a) => a.id === id)?.campaignId ?? null
  const nameOf = (id: string | null): string => src.agents.find((a) => a.id === id)?.name ?? 'Alguien'
  const ev = (key: string, agentId: string | null, category: AutomationEvent['category'], detail: string, campaignId = agentCampaign(agentId)): AutomationEvent => ({
    key,
    agentId,
    campaignId,
    category,
    detail,
  })

  switch (trigger.kind) {
    case 'attendance_alert':
      return getAttendanceAlerts({
        entries: src.timeEntries,
        shifts: src.shifts,
        agents: src.agents,
        profiles: src.profiles,
        timeOffRequests: src.timeOffRequests,
        now,
      })
        .filter((a) => trigger.alertKind === 'any' || a.kind === trigger.alertKind)
        .map((a) => ev(`att:${a.id}`, a.agentId, 'attendance', `${describeAlert(a.kind, a.minutes)} (${fmtDate(a.date)})`))

    case 'time_off_created':
      return src.timeOffRequests.map((r) =>
        ev(`toc:${r.id}`, r.agentId, 'time_off', `solicitó ${TIME_OFF_LABELS[r.type]} del ${dateRange(r.startDate, r.endDate)} (${r.hours} h)`),
      )

    case 'time_off_decided':
      return src.timeOffRequests
        .filter((r) => r.status !== 'pending')
        .map((r) =>
          ev(
            `tod:${r.id}:${r.status}`,
            r.agentId,
            'time_off',
            `la solicitud de ${TIME_OFF_LABELS[r.type]} del ${dateRange(r.startDate, r.endDate)} fue ${r.status === 'approved' ? 'aprobada' : 'rechazada'}`,
          ),
        )

    case 'open_shift_claim':
      return src.claims.flatMap((c) => {
        const os = src.openShifts.find((o) => o.id === c.openShiftId)
        if (c.status !== 'pending' || !os) return []
        return [ev(`claim:${c.id}`, c.agentId, 'schedule', `quiere tomar el turno abierto del ${fmtDate(os.date)} ${os.startTime}-${os.endTime}`, os.campaignId)]
      })

    case 'swap_pending_approval':
      return src.swaps.flatMap((w) => {
        const shift = src.shifts.find((s) => s.id === w.shiftId)
        if (w.status !== 'pending_approval' || !shift) return []
        return [
          ev(
            `swap:${w.id}`,
            w.fromAgentId,
            'schedule',
            `${nameOf(w.fromAgentId)} cede a ${nameOf(w.acceptedBy)} el turno del ${fmtDate(shift.date)} ${shift.startTime}-${shift.endTime}`,
            shift.campaignId,
          ),
        ]
      })

    case 'ticket_high_priority':
      return src.tickets
        .filter((t) => t.priority === 'high' || t.priority === 'critical')
        .map((t) => ev(`tkp:${t.id}`, t.requesterId, 'helpdesk', `${t.code} · ${t.title} (prioridad ${PRIORITY_LABELS[t.priority]})`))

    case 'ticket_sla_overdue':
      return src.tickets
        .filter((t) => slaState(t, now.getTime()) === 'overdue')
        .map((t) => ev(`tks:${t.id}`, t.requesterId, 'helpdesk', `${t.code} · ${t.title} venció su SLA (prioridad ${PRIORITY_LABELS[t.priority]})`))

    case 'form_submitted':
      return src.submissions
        .filter((s) => trigger.templateId === null || s.templateId === trigger.templateId)
        .map((s) => {
          const title = src.templates.find((t) => t.id === s.templateId)?.title ?? 'un formulario'
          return ev(`form:${s.id}`, s.submittedBy, 'forms', `envió "${title}"`)
        })

    case 'update_unconfirmed': {
      const ctx = { agents: src.agents, profiles: src.profiles, groups: src.groups }
      const limit = trigger.hours * 3_600_000
      return src.updates
        .filter((u) => u.requiresConfirmation && getUpdateState(u, now.getTime()) === 'live')
        .filter((u) => now.getTime() - Date.parse(publishedAt(u)) >= limit)
        .flatMap((u) =>
          resolveAudience(u.audience, u.authorId, ctx)
            .filter((id) => !u.confirmations[id])
            .map((id) => ev(`upd:${u.id}:${id}`, id, 'updates', `"${u.title}" (más de ${trigger.hours} h sin confirmar)`)),
        )
    }
  }
}

function gatherSources(): AutomationSources {
  const w = useWorkforceStore.getState()
  const d = useDirectoryStore.getState()
  const s = useScheduleStore.getState()
  const f = useFormsStore.getState()
  return {
    agents: w.agents,
    campaigns: w.campaigns,
    timeEntries: w.timeEntries,
    timeOffRequests: w.timeOffRequests,
    profiles: d.profiles,
    groups: d.groups,
    shifts: s.shifts,
    openShifts: s.openShifts,
    claims: s.claims,
    swaps: s.swaps,
    tickets: useHelpdeskStore.getState().tickets,
    templates: f.templates,
    submissions: f.submissions,
    updates: useUpdatesStore.getState().updates,
  }
}

/** Revisa todas las reglas activas una vez. Exportada para poder forzar una pasada. */
export function evaluateAutomations(now: Date = new Date()): void {
  const auto = useAutomationsStore.getState()
  const src = gatherSources()
  const fired = new Set(auto.firedKeys)
  const primed = new Set(auto.primedRuleIds)
  const isManager = (id: string): boolean => getProfile(src.profiles, id).role !== 'agent'
  const managerIds = src.agents.filter((a) => isManager(a.id) && getProfile(src.profiles, a.id).active).map((a) => a.id)

  const keys: string[] = []
  const runs: AutomationRun[] = []
  const notes: NotificationDraft[] = []
  const newlyPrimed: string[] = []

  for (const rule of auto.rules) {
    if (!rule.enabled) continue
    const isPrimed = primed.has(rule.id)
    for (const event of collectEvents(rule.trigger, src, now)) {
      if (!matchesCampaign(rule.campaignId, event)) continue
      const key = firedKey(rule.id, event.key)
      if (fired.has(key)) continue
      fired.add(key)
      keys.push(key)
      // Primera pasada de la regla: se registra lo que ya existía sin avisar
      if (!isPrimed) continue

      const recipientIds = resolveRecipients(rule.actions, event.agentId, managerIds)
      const body = renderTemplate(rule.message, {
        agente: src.agents.find((a) => a.id === event.agentId)?.name ?? 'Sin agente',
        detalle: event.detail,
        campaña: src.campaigns.find((c) => c.id === event.campaignId)?.name ?? 'Sin campaña',
        regla: rule.name,
      })
      for (const recipientId of recipientIds) {
        notes.push({ recipientId, title: rule.name, body, category: event.category, link: linkFor(event.category, isManager(recipientId)) })
      }
      runs.push({
        id: crypto.randomUUID(),
        ruleId: rule.id,
        ruleName: rule.name,
        at: now.toISOString(),
        detail: event.detail,
        agentId: event.agentId,
        recipientIds,
      })
    }
    if (!isPrimed) newlyPrimed.push(rule.id)
  }

  auto.recordEvaluation({ keys, runs: runs.reverse(), primedRuleIds: newlyPrimed })
  if (notes.length > 0) useNotificationsStore.getState().notify(notes)
}

const DEBOUNCE_MS = 300
const TICK_MS = 60_000

/** Llamar UNA vez al arrancar la app. Devuelve la función para detener el motor. */
export function startAutomations(): () => void {
  let timer: number | null = null
  // Agrupa ráfagas de cambios (y reinicios globales) en una sola pasada
  const schedule = (): void => {
    if (timer !== null) return
    timer = window.setTimeout(() => {
      timer = null
      evaluateAutomations()
    }, DEBOUNCE_MS)
  }

  const unsubscribers = [
    useWorkforceStore.subscribe((n, p) => {
      // Los cambios de estado de los agentes (llamadas en vivo) no importan aquí
      if (n.timeEntries !== p.timeEntries || n.timeOffRequests !== p.timeOffRequests) schedule()
    }),
    useDirectoryStore.subscribe(schedule),
    useScheduleStore.subscribe(schedule),
    useHelpdeskStore.subscribe((n, p) => {
      if (n.tickets !== p.tickets) schedule()
    }),
    useFormsStore.subscribe(schedule),
    useUpdatesStore.subscribe((n, p) => {
      if (n.updates !== p.updates) schedule()
    }),
    // Solo cambios de reglas: las escrituras del propio motor (claves, historial) no vuelven a disparar
    useAutomationsStore.subscribe((n, p) => {
      if (n.rules !== p.rules || n.primedRuleIds.length < p.primedRuleIds.length) schedule()
    }),
  ]
  schedule()
  const interval = window.setInterval(evaluateAutomations, TICK_MS)

  return () => {
    for (const unsubscribe of unsubscribers) unsubscribe()
    window.clearInterval(interval)
    if (timer !== null) window.clearTimeout(timer)
  }
}
