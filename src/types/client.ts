export type ClientRequestType = 'ampliar_agentes' | 'ajuste_script' | 'soporte_facturacion' | 'otro'
export type ClientRequestPriority = 'normal' | 'alta'
export type ClientRequestStatus = 'abierto' | 'en_revision' | 'aplicado' | 'cancelado'

export interface ClientRequest {
  id: string
  campaignId: string
  type: ClientRequestType
  title: string
  priority: ClientRequestPriority
  status: ClientRequestStatus
  /** ISO */
  createdAt: string
}

export interface Invoice {
  id: string
  campaignId: string
  /** Ej. "2026-09" */
  period: string
  billableHours: number
  rateUsd: number
  totalUsd: number
  status: 'pagada' | 'pendiente'
}

export type ClientPeriod = 'hoy' | '7d' | 'mes'

export type ClientError = 'empty_title' | 'not_found' | 'not_cancellable'
export type ClientResult = { ok: true } | { ok: false; reason: ClientError }
