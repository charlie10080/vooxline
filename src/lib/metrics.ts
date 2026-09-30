import type { Campaign, TimeEntry } from '@/types'
import { minutesBetween } from '@/lib/time'

/** Regla de negocio: desviaciones mayores a 15 min requieren confirmación del supervisor */
export const REVIEW_THRESHOLD_MIN = 15

export function getWorkedMinutes(entry: TimeEntry, now: Date = new Date()): number {
  const end = entry.clockOut ?? now.toISOString()
  return Math.max(0, minutesBetween(entry.clockIn, end) - entry.breakMinutes)
}

export const getDeviationMinutes = (entry: TimeEntry, now?: Date): number =>
  getWorkedMinutes(entry, now) - entry.scheduledMinutes

export const needsSupervisorReview = (entry: TimeEntry): boolean =>
  entry.clockOut !== null && Math.abs(getDeviationMinutes(entry)) > REVIEW_THRESHOLD_MIN

export interface CampaignStats {
  campaign: Campaign
  hours: number
  billed: number
  cost: number
  marginPct: number
}

/** Rentabilidad por campaña: horas base + horas aprobadas en la app */
export function getCampaignStats(campaigns: Campaign[], entries: TimeEntry[]): CampaignStats[] {
  return campaigns.map((campaign) => {
    const approvedHours = entries
      .filter((e) => e.campaignId === campaign.id && e.status === 'approved')
      .reduce((sum, e) => sum + getWorkedMinutes(e) / 60, 0)
    const hours = campaign.baselineHours + approvedHours
    const billed = hours * campaign.billRate
    const cost = hours * campaign.costRate
    const marginPct = billed > 0 ? ((billed - cost) / billed) * 100 : 0
    return { campaign, hours, billed, cost, marginPct }
  })
}

export function getPayrollTotals(stats: CampaignStats[]): { totalHours: number; totalCost: number; avgMarginPct: number } {
  const totalHours = stats.reduce((s, c) => s + c.hours, 0)
  const totalCost = stats.reduce((s, c) => s + c.cost, 0)
  const totalBilled = stats.reduce((s, c) => s + c.billed, 0)
  const avgMarginPct = totalBilled > 0 ? ((totalBilled - totalCost) / totalBilled) * 100 : 0
  return { totalHours, totalCost, avgMarginPct }
}
