export const minutesBetween = (from: string | Date, to: string | Date): number =>
  Math.round((new Date(to).getTime() - new Date(from).getTime()) / 60000)

const pad = (n: number): string => String(n).padStart(2, '0')

/** 492 -> "08h 12m" */
export function formatDuration(totalMinutes: number): string {
  const m = Math.abs(totalMinutes)
  return `${pad(Math.floor(m / 60))}h ${pad(m % 60)}m`
}

/** 12 -> "+00:12", -238 -> "-03:58" */
export function formatDeviation(minutes: number): string {
  const sign = minutes < 0 ? '-' : '+'
  const abs = Math.abs(minutes)
  return `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`
}

export const formatClock = (iso: string): string =>
  new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true })

export const formatUSD = (n: number): string =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
