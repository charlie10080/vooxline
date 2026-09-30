import type { Shift } from '@/types/scheduling'
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
  return shifts
}
