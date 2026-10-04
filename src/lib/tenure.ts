import { daysBetween } from '@/lib/schedule'

const parts = (s: string): [number, number, number] | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null
  const [y, m, d] = s.split('-').map(Number)
  return [y, m, d]
}

const pad = (n: number): string => String(n).padStart(2, '0')
const isLeap = (y: number): boolean => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0

/** Fecha del aniversario en un año dado (el 29 de febrero se celebra el 28 en años no bisiestos) */
function anniversaryIn(year: number, month: number, day: number): string {
  const d = month === 2 && day === 29 && !isLeap(year) ? 28 : day
  return `${year}-${pad(month)}-${pad(d)}`
}

export interface Tenure {
  years: number
  months: number
}

/** Antigüedad completa (años y meses) a la fecha `today`. Null si la fecha de ingreso falta, es inválida o futura. */
export function getTenure(hireDate: string, today: string): Tenure | null {
  const h = parts(hireDate)
  const t = parts(today)
  if (!h || !t || hireDate > today) return null
  let months = (t[0] - h[0]) * 12 + (t[1] - h[1])
  if (t[2] < h[2]) months -= 1
  return { years: Math.floor(months / 12), months: months % 12 }
}

/** "2 años 3 meses" · "5 meses" · "Menos de 1 mes" */
export function formatTenure(t: Tenure | null): string {
  if (!t) return '—'
  const y = t.years > 0 ? `${t.years} ${t.years === 1 ? 'año' : 'años'}` : ''
  const m = t.months > 0 ? `${t.months} ${t.months === 1 ? 'mes' : 'meses'}` : ''
  return [y, m].filter(Boolean).join(' ') || 'Menos de 1 mes'
}

export interface NextAnniversary {
  /** YYYY-MM-DD */
  date: string
  /** Años que cumple ese día (mínimo 1) */
  years: number
  daysUntil: number
}

/** Próximo aniversario laboral a partir de hoy (si es hoy, daysUntil = 0). Null si no hay fecha válida. */
export function nextAnniversary(hireDate: string, today: string): NextAnniversary | null {
  const h = parts(hireDate)
  const t = parts(today)
  if (!h || !t || hireDate > today) return null
  let year = t[0]
  if (anniversaryIn(year, h[1], h[2]) < today) year += 1
  if (year <= h[0]) year = h[0] + 1
  const date = anniversaryIn(year, h[1], h[2])
  return { date, years: year - h[0], daysUntil: daysBetween(today, date) }
}
