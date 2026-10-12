import type { Agent } from '@/types'
import type { UserProfile } from '@/types/directory'
import type { BadgeType, CelebrationEvent, Milestone, Recognition, Redemption } from '@/types/celebrations'
import { addDays, daysBetween, startOfWeek, toDateStr } from '@/lib/schedule'
import { nextAnniversary } from '@/lib/tenure'

export const PEER_POINTS = 50
export const MANAGER_POINTS = 100
export const QA_HIGHLIGHT_MIN = 95
export const MESSAGE_MAX = 280
/** Los aniversarios de los últimos N días aparecen como hito en el feed */
export const MILESTONE_LOOKBACK_DAYS = 30

export const BADGES: Record<BadgeType, string> = {
  best_service: 'Mejor atención',
  teamwork: 'Trabajo en equipo',
  punctuality: 'Puntualidad perfecta',
  first_call_resolution: 'Resolución en primera llamada',
  qa_quality: 'Calidad QA',
  helping_peers: 'Ayuda a compañeros',
}

export const isBadge = (b: string): b is BadgeType => b in BADGES

/** Reconocer da más puntos si lo hace un supervisor o admin */
export const pointsFor = (giverIsManager: boolean): number => (giverIsManager ? MANAGER_POINTS : PEER_POINTS)

const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

/** "MM-DD" válido (acepta 02-29) */
export function isMonthDay(s: string): boolean {
  if (!/^\d{2}-\d{2}$/.test(s)) return false
  const m = Number(s.slice(0, 2))
  const d = Number(s.slice(3))
  return m >= 1 && m <= 12 && d >= 1 && d <= DAYS_IN_MONTH[m - 1]
}

/** Próximo cumpleaños (si es hoy, daysUntil = 0). El 29 de febrero se celebra el 28 en años no bisiestos. */
export function nextBirthday(mmdd: string, today: string): { date: string; daysUntil: number } | null {
  if (!isMonthDay(mmdd)) return null
  // 2000 es bisiesto y anterior a hoy: nextAnniversary ya resuelve el cálculo del próximo día
  const next = nextAnniversary(`2000-${mmdd}`, today)
  return next && { date: next.date, daysUntil: next.daysUntil }
}

// ---------- Puntos ----------
export const earnedPoints = (agentId: string, recognitions: Recognition[]): number =>
  recognitions.filter((r) => r.toId === agentId).reduce((sum, r) => sum + r.points, 0)

/** Los canjes rechazados devuelven los puntos */
export const spentPoints = (agentId: string, redemptions: Redemption[]): number =>
  redemptions.filter((r) => r.agentId === agentId && r.status !== 'rejected').reduce((sum, r) => sum + r.cost, 0)

export const pointsBalance = (agentId: string, recognitions: Recognition[], redemptions: Redemption[]): number =>
  earnedPoints(agentId, recognitions) - spentPoints(agentId, redemptions)

/** "YYYY-MM" en hora local */
export const monthKey = (iso: string): string => toDateStr(new Date(iso)).slice(0, 7)

export interface LeaderboardRow {
  agentId: string
  points: number
  count: number
}

/** Ranking de puntos recibidos en un mes ("YYYY-MM") */
export function monthlyLeaderboard(recognitions: Recognition[], month: string): LeaderboardRow[] {
  const rows = new Map<string, LeaderboardRow>()
  for (const r of recognitions) {
    if (monthKey(r.createdAt) !== month) continue
    const row = rows.get(r.toId) ?? { agentId: r.toId, points: 0, count: 0 }
    row.points += r.points
    row.count += 1
    rows.set(r.toId, row)
  }
  return [...rows.values()].sort((a, b) => b.points - a.points || b.count - a.count)
}

/** `n` meses ("YYYY-MM") empezando por el de `today`: dir -1 hacia atrás, 1 hacia adelante */
export function monthSequence(today: string, n: number, dir: 1 | -1): string[] {
  const [y, m] = today.split('-').map(Number)
  return Array.from({ length: n }, (_, i) => {
    const total = y * 12 + (m - 1) + i * dir
    return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`
  })
}

// ---------- Fechas especiales ----------
/** Cumpleaños y aniversarios de usuarios activos en los próximos 12 meses, ordenados por cercanía */
export function upcomingEvents(profiles: UserProfile[], birthdays: Record<string, string>, today: string): CelebrationEvent[] {
  const events: CelebrationEvent[] = []
  for (const p of profiles) {
    if (!p.active) continue
    const ann = nextAnniversary(p.hireDate, today)
    if (ann) events.push({ kind: 'anniversary', agentId: p.agentId, date: ann.date, daysUntil: ann.daysUntil, years: ann.years })
    const bday = birthdays[p.agentId] ? nextBirthday(birthdays[p.agentId], today) : null
    if (bday) events.push({ kind: 'birthday', agentId: p.agentId, date: bday.date, daysUntil: bday.daysUntil, years: null })
  }
  return events.sort((a, b) => a.daysUntil - b.daysUntil || a.kind.localeCompare(b.kind))
}

export type DateBucket = 'today' | 'week' | 'month' | 'later'

/** Grupos excluyentes: hoy; resto de la semana (lun-dom); resto del mes; después */
export function dateBucket(date: string, today: string): DateBucket {
  const diff = daysBetween(today, date)
  if (diff === 0) return 'today'
  if (diff > 0 && date <= addDays(startOfWeek(today), 6)) return 'week'
  if (diff > 0 && date.slice(0, 7) === today.slice(0, 7)) return 'month'
  return 'later'
}

/** Aniversarios recientes y agentes con QA destacado. Fechas en YYYY-MM-DD. */
export function buildMilestones(profiles: UserProfile[], agents: Agent[], today: string): Milestone[] {
  const out: Milestone[] = []
  const active = new Set(profiles.filter((p) => p.active).map((p) => p.agentId))
  for (const p of profiles) {
    if (!p.active) continue
    const ann = nextAnniversary(p.hireDate, addDays(today, -MILESTONE_LOOKBACK_DAYS))
    if (ann && ann.date <= today) {
      out.push({ id: `m-ann-${p.agentId}-${ann.date}`, kind: 'anniversary', agentId: p.agentId, date: ann.date, years: ann.years, qaScore: null })
    }
  }
  for (const a of agents) {
    // shortcut: el QA no trae fecha de evaluación, se fecha hoy; con backend usar la fecha real de la auditoría
    if (active.has(a.id) && a.qaScore !== null && a.qaScore >= QA_HIGHLIGHT_MIN) {
      out.push({ id: `m-qa-${a.id}`, kind: 'qa', agentId: a.id, date: today, years: null, qaScore: a.qaScore })
    }
  }
  return out
}

export type FeedItem = { type: 'recognition'; at: number; item: Recognition } | { type: 'milestone'; at: number; item: Milestone }

/** Mezcla reconocimientos e hitos, más recientes primero. Los hitos se ubican a las 00:00 locales de su día. */
export function buildFeed(recognitions: Recognition[], milestones: Milestone[]): FeedItem[] {
  const items: FeedItem[] = [
    ...recognitions.map((r): FeedItem => ({ type: 'recognition', at: Date.parse(r.createdAt), item: r })),
    ...milestones.map((m): FeedItem => ({ type: 'milestone', at: new Date(`${m.date}T00:00:00`).getTime(), item: m })),
  ]
  return items.sort((a, b) => b.at - a.at)
}
