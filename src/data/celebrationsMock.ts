import type { BadgeType, Recognition, Redemption, Reward } from '@/types/celebrations'
import { MANAGER_POINTS, PEER_POINTS } from '@/lib/celebrations'
import { addDays, todayStr } from '@/lib/schedule'

const hoursAgo = (h: number): string => new Date(Date.now() - h * 3_600_000).toISOString()
/** "MM-DD" a `n` días de hoy, para que siempre haya cumpleaños cercanos en la demo */
const monthDayIn = (n: number): string => addDays(todayStr(), n).slice(5)

const MANAGERS = new Set(['a-carlos', 'a-valeria'])

function rec(
  id: string,
  fromId: string,
  toId: string,
  badge: BadgeType,
  message: string,
  hAgo: number,
  reactions: Partial<Recognition['reactions']> = {},
  comments: Array<[string, string, number]> = [],
): Recognition {
  return {
    id,
    fromId,
    toId,
    badge,
    message,
    points: MANAGERS.has(fromId) ? MANAGER_POINTS : PEER_POINTS,
    createdAt: hoursAgo(hAgo),
    reactions: { applause: [], heart: [], fire: [], ...reactions },
    comments: comments.map(([authorId, text, h], i) => ({ id: `${id}-c${i}`, authorId, text, createdAt: hoursAgo(h) })),
  }
}

export function buildMockRecognitions(): Recognition[] {
  return [
    rec('r-1', 'a-carlos', 'a-maria', 'best_service', 'Cerró la escalación de National Assemblers sin perder la calma y el cliente pidió felicitarla por escrito.', 3,
      { applause: ['a-valeria', 'a-sofia'], heart: ['a-david'] },
      [['a-sofia', '¡Te lo mereces, María!', 2]]),
    rec('r-2', 'a-sofia', 'a-david', 'helping_peers', 'Me explicó el flujo de validación clínica en su descanso. Hoy ya resolví solo tres casos.', 20,
      { heart: ['a-maria'] }),
    rec('r-3', 'a-valeria', 'a-alejandro-t', 'first_call_resolution', '92 % de resolución en primer contacto esta semana en FinTech. Récord del equipo.', 46,
      { fire: ['a-carlos', 'a-alejandro-m'], applause: ['a-maria'] },
      [['a-alejandro-t', 'Gracias, Vale. Fue trabajo de todo el turno.', 44]]),
    rec('r-4', 'a-maria', 'a-sofia', 'teamwork', 'Cubrió la cola bilingüe cuando se cayó el troncal 2. Sin ella el SLA se iba.', 70,
      { applause: ['a-carlos'] }),
    rec('r-5', 'a-carlos', 'a-alejandro-m', 'punctuality', 'Un mes completo marcando a tiempo en todos sus turnos de Fidelis.', 120),
    rec('r-6', 'a-david', 'a-maria', 'qa_quality', 'Escuché su llamada en la calibración: guion impecable y gran empatía.', 160,
      { heart: ['a-valeria', 'a-carlos'] }),
    rec('r-7', 'a-alejandro-t', 'a-valeria', 'helping_peers', 'Siempre tiene tiempo para resolver dudas del equipo, aunque esté en llamada.', 210),
    rec('r-8', 'a-valeria', 'a-maria', 'teamwork', 'Organizó el relevo de turno para que nadie se quedara sin descanso.', 24 * 34),
    rec('r-9', 'a-carlos', 'a-david', 'qa_quality', 'Calificación QA perfecta en las auditorías de septiembre.', 24 * 38,
      { applause: ['a-sofia', 'a-maria'] }),
    rec('r-10', 'a-alejandro-m', 'a-alejandro-t', 'teamwork', 'Me ayudó a migrar mis notas al nuevo CRM sin perder un solo caso.', 24 * 45),
  ]
}

export function buildMockRewards(): Reward[] {
  return [
    { id: 'rw-lunch', name: 'Vale de comida', description: 'Comida para ti en la cafetería del piso o por app de entrega.', cost: 100, stock: 20, active: true },
    { id: 'rw-shift', name: 'Elegir horario', description: 'Escoge tu horario preferido durante una semana.', cost: 200, stock: 5, active: true },
    { id: 'rw-gift', name: 'Tarjeta de regalo $500', description: 'Tarjeta de regalo para tienda departamental.', cost: 300, stock: 8, active: true },
    { id: 'rw-dayoff', name: 'Día libre', description: 'Un día libre pagado, a coordinar con tu supervisor.', cost: 400, stock: 3, active: true },
  ]
}

export function buildMockRedemptions(): Redemption[] {
  return [
    { id: 'rd-1', agentId: 'a-maria', rewardId: 'rw-lunch', rewardName: 'Vale de comida', cost: 100, status: 'delivered', requestedAt: hoursAgo(24 * 30), resolvedAt: hoursAgo(24 * 29) },
    { id: 'rd-2', agentId: 'a-david', rewardId: 'rw-lunch', rewardName: 'Vale de comida', cost: 100, status: 'pending', requestedAt: hoursAgo(5), resolvedAt: null },
  ]
}

/** agentId -> "MM-DD" */
export function buildMockBirthdays(): Record<string, string> {
  return {
    'a-maria': monthDayIn(0),
    'a-sofia': monthDayIn(3),
    'a-david': monthDayIn(12),
    'a-carlos': monthDayIn(47),
    'a-valeria': monthDayIn(120),
    'a-alejandro-t': monthDayIn(200),
    'a-alejandro-m': monthDayIn(290),
  }
}
