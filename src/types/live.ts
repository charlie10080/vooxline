export type Sentiment = 'positive' | 'neutral' | 'negative'
export type MonitorMode = 'listen' | 'whisper' | 'intervene'

export interface CallSession {
  id: string
  agentId: string
  campaignId: string
  /** ISO */
  startedAt: string
  /** ISO, null = llamada activa */
  endedAt: string | null
  /** Etiqueta anónima, no datos reales de clientes (ej. "Cliente #4821") */
  customerLabel: string
  isVip: boolean
  sentiment: Sentiment
  /** Puntaje de calidad en vivo, 0-100 */
  qaScore: number
}

/** Sesión de supervisión (simulada: no hay audio real) */
export interface MonitorSession {
  callId: string
  mode: MonitorMode
  /** ISO */
  startedAt: string
}

export interface MonitorLogEntry {
  id: string
  callId: string
  agentId: string
  /** ISO */
  at: string
  action: 'start' | 'mode_change' | 'stop'
  mode: MonitorMode
}

export type LiveError = 'not_found' | 'not_clocked_in' | 'busy' | 'on_call' | 'call_ended'
export type LiveResult = { ok: true } | { ok: false; reason: LiveError }
