import type { CelebrationsResult } from '@/types/celebrations'

/** Muestra el resultado de una acción del store; `success` es el texto si salió bien */
export type Report = (result: CelebrationsResult, success: string) => boolean

/** "11 oct" a partir de YYYY-MM-DD */
export const formatDay = (date: string): string =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', timeZone: 'UTC' })

/** "hace 5 min" · "hace 3 h" · "hace 2 d" */
export function timeAgo(iso: string): string {
  const min = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60_000))
  if (min < 1) return 'justo ahora'
  if (min < 60) return `hace ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `hace ${h} h`
  return `hace ${Math.round(h / 24)} d`
}

/** "octubre 2026" a partir de YYYY-MM */
export const formatMonth = (month: string): string =>
  new Date(`${month}-01T00:00:00Z`).toLocaleDateString('es-MX', { month: 'long', year: 'numeric', timeZone: 'UTC' })
