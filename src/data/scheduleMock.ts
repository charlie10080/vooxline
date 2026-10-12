import type { OpenShift, Shift, ShiftClaim, SwapRequest } from '@/types/scheduling'
import { mockAgents } from '@/data/mock'
import { addDays, startOfWeek, todayStr } from '@/lib/schedule'

interface Plan {
  start: string
  end: string
  brk: number
}

const plans: Record<string, Plan> = {
  'a-maria': { start: '08:00', end: '17:00', brk: 60 },
  'a-carlos': { start: '09:00', end: '18:00', brk: 60 },
  'a-valeria': { start: '08:00', end: '17:00', brk: 60 },
  'a-alejandro-t': { start: '10:00', end: '14:00', brk: 0 },
  'a-sofia': { start: '08:00', end: '17:00', brk: 60 },
  'a-alejandro-m': { start: '09:00', end: '18:00', brk: 60 },
  'a-david': { start: '08:00', end: '17:00', brk: 60 },
}

/** Turnos de lunes a viernes de la semana actual, para todos los agentes de demo */
export function buildMockShifts(): Shift[] {
  const monday = startOfWeek(todayStr())
  const shifts: Shift[] = []
  for (const agent of mockAgents) {
    const plan = plans[agent.id]
    if (!plan) continue
    for (let i = 0; i < 5; i++) {
      shifts.push({
        id: `s-${agent.id}-${i}`,
        agentId: agent.id,
        campaignId: agent.campaignId,
        date: addDays(monday, i),
        startTime: plan.start,
        endTime: plan.end,
        breakMinutes: plan.brk,
        status: 'scheduled',
        note: null,
      })
    }
  }
  // Turno extra de María (vespertino, no choca con su plan) que ofreció a David en intercambio
  shifts.push({
    id: 's-a-maria-swap',
    agentId: 'a-maria',
    campaignId: 'c-national',
    date: addDays(todayStr(), 2),
    startTime: '18:00',
    endTime: '22:00',
    breakMinutes: 0,
    status: 'scheduled',
    note: 'Refuerzo nocturno',
  })
  return shifts
}

const hoursAgoIso = (h: number): string => new Date(Date.now() - h * 3_600_000).toISOString()

/** Turnos abiertos de los próximos días (relativos a hoy, para que siempre se puedan tomar) */
export function buildMockOpenShifts(): OpenShift[] {
  const today = todayStr()
  const base = { status: 'open' as const, createdBy: 'a-carlos', filledShiftId: null }
  return [
    { ...base, id: 'os-1', campaignId: 'c-national', date: addDays(today, 1), startTime: '18:00', endTime: '22:00', breakMinutes: 0, note: 'Pico de llamadas por campaña de renovación', requiresApproval: false, createdAt: hoursAgoIso(20) },
    { ...base, id: 'os-2', campaignId: 'c-fidelis', date: addDays(today, 2), startTime: '18:30', endTime: '22:30', breakMinutes: 15, note: null, requiresApproval: true, createdAt: hoursAgoIso(6) },
    { ...base, id: 'os-3', campaignId: 'c-vog', date: addDays(today, 3), startTime: '07:00', endTime: '11:00', breakMinutes: 0, note: 'Cobertura de apertura', requiresApproval: true, createdAt: hoursAgoIso(2), createdBy: 'a-valeria' },
  ]
}

export function buildMockClaims(): ShiftClaim[] {
  return [
    { id: 'cl-1', openShiftId: 'os-2', agentId: 'a-alejandro-m', status: 'pending', createdAt: hoursAgoIso(1), decidedBy: null, decidedAt: null },
  ]
}

export function buildMockSwaps(): SwapRequest[] {
  return [
    {
      id: 'sw-1',
      shiftId: 's-a-maria-swap',
      fromAgentId: 'a-maria',
      toAgentId: 'a-david',
      acceptedBy: 'a-david',
      note: 'Tengo clase ese día por la noche',
      status: 'pending_approval',
      createdAt: hoursAgoIso(3),
      decidedBy: null,
      decidedAt: null,
    },
  ]
}
