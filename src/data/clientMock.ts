import type { ClientRequest, Invoice } from '@/types/client'

const daysAgo = (d: number): string => new Date(Date.now() - d * 86_400_000).toISOString()

const invoice = (id: string, campaignId: string, period: string, hours: number, rate: number, status: Invoice['status']): Invoice => ({
  id, campaignId, period, billableHours: hours, rateUsd: rate, totalUsd: Math.round(hours * rate * 100) / 100, status,
})

export const buildMockInvoices = (): Invoice[] => [
  invoice('inv-2608-nat', 'c-national', '2026-08', 1120, 5.63, 'pagada'),
  invoice('inv-2609-nat', 'c-national', '2026-09', 1164, 5.63, 'pendiente'),
  invoice('inv-2608-fid', 'c-fidelis', '2026-08', 610, 5.5, 'pagada'),
  invoice('inv-2609-fid', 'c-fidelis', '2026-09', 655, 5.5, 'pendiente'),
  invoice('inv-2609-vog', 'c-vog', '2026-09', 402, 5.5, 'pagada'),
  invoice('inv-2609-fin', 'c-fintech', '2026-09', 318, 5.85, 'pendiente'),
]

export const buildMockRequests = (): ClientRequest[] => [
  { id: 'req-1', campaignId: 'c-national', type: 'ampliar_agentes', title: 'Sumar 2 agentes bilingües en el turno de la tarde', priority: 'alta', status: 'en_revision', createdAt: daysAgo(3) },
  { id: 'req-2', campaignId: 'c-national', type: 'ajuste_script', title: 'Actualizar el saludo con la nueva promoción', priority: 'normal', status: 'abierto', createdAt: daysAgo(1) },
  { id: 'req-3', campaignId: 'c-fidelis', type: 'soporte_facturacion', title: 'Desglose por agente en la factura de agosto', priority: 'normal', status: 'aplicado', createdAt: daysAgo(12) },
]
