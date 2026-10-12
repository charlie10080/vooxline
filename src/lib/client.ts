import type { Agent, Campaign, TimeEntry } from '@/types'
import type { CallSession } from '@/types/live'
import type { ClientPeriod, Invoice } from '@/types/client'
import { getWorkedMinutes } from '@/lib/metrics'
import { csvEscape } from '@/lib/forms'

/** Meta de cumplimiento acordada con el cliente */
export const SLA_TARGET_PCT = 90

export function periodStart(period: ClientPeriod, now: Date = new Date()): Date {
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  if (period === '7d') d.setDate(d.getDate() - 6)
  if (period === 'mes') d.setDate(1)
  return d
}

export interface CampaignSnapshot {
  assigned: Agent[]
  online: Agent[]
  activeCalls: CallSession[]
  workedHours: number
  scheduledHours: number
  /** Horas trabajadas / programadas del periodo (tope 100). null si no hay turnos en el periodo */
  slaPct: number | null
  estimatedUsd: number
}

/**
 * Lo que el cliente ve de su campaña en un periodo.
 * shortcut: el SLA es cumplimiento de horas (no nivel de servicio telefónico); con datos de cola del backend se cambia aquí.
 */
export function getCampaignSnapshot(
  campaign: Campaign,
  agents: Agent[],
  entries: TimeEntry[],
  calls: CallSession[],
  period: ClientPeriod,
  now: Date = new Date(),
): CampaignSnapshot {
  const from = periodStart(period, now).getTime()
  const assigned = agents.filter((a) => a.campaignId === campaign.id)
  const inPeriod = entries.filter((e) => e.campaignId === campaign.id && new Date(e.clockIn).getTime() >= from)
  const openIds = new Set(entries.filter((e) => e.campaignId === campaign.id && e.clockOut === null).map((e) => e.agentId))
  const workedHours = inPeriod.reduce((s, e) => s + getWorkedMinutes(e, now), 0) / 60
  const scheduledHours = inPeriod.reduce((s, e) => s + e.scheduledMinutes, 0) / 60
  return {
    assigned,
    online: assigned.filter((a) => openIds.has(a.id)),
    activeCalls: calls.filter((c) => c.campaignId === campaign.id && c.endedAt === null),
    workedHours,
    scheduledHours,
    slaPct: scheduledHours > 0 ? Math.min(100, (workedHours / scheduledHours) * 100) : null,
    estimatedUsd: workedHours * campaign.billRate,
  }
}

const toCsv = (rows: (string | number)[][]): string => rows.map((r) => r.map((v) => csvEscape(String(v))).join(',')).join('\n')

export function invoiceToCsv(invoice: Invoice, campaignName: string): string {
  return toCsv([
    ['Factura', 'Periodo', 'Campaña', 'Horas facturables', 'Tarifa USD', 'Total USD', 'Estado'],
    [invoice.id, invoice.period, campaignName, invoice.billableHours, invoice.rateUsd, invoice.totalUsd.toFixed(2), invoice.status],
  ])
}

/** Corte en curso: una fila por agente con sus horas del periodo */
export function currentCutToCsv(campaign: Campaign, agents: Agent[], entries: TimeEntry[], period: ClientPeriod, now: Date = new Date()): string {
  const from = periodStart(period, now).getTime()
  const rows = agents
    .filter((a) => a.campaignId === campaign.id)
    .map((a) => {
      const hours = entries
        .filter((e) => e.agentId === a.id && e.campaignId === campaign.id && new Date(e.clockIn).getTime() >= from)
        .reduce((s, e) => s + getWorkedMinutes(e, now), 0) / 60
      return [a.name, a.employeeCode, hours.toFixed(2), campaign.billRate, (hours * campaign.billRate).toFixed(2)]
    })
  return toCsv([['Agente', 'Código', 'Horas', 'Tarifa USD', 'Total USD'], ...rows])
}

export function downloadCsv(filename: string, csv: string): void {
  // BOM para que Excel abra bien los acentos
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
