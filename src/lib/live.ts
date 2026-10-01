import type { Agent, AgentStatus } from '@/types'
import type { CallSession, Sentiment } from '@/types/live'

export const getActiveCalls = (calls: CallSession[]): CallSession[] => calls.filter((c) => c.endedAt === null)

export function getCallSeconds(call: CallSession, now: Date = new Date()): number {
  const end = call.endedAt ? new Date(call.endedAt) : now
  return Math.max(0, Math.round((end.getTime() - new Date(call.startedAt).getTime()) / 1000))
}

/** 252 -> "04:12" · 3725 -> "1:02:05" */
export function formatTimer(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

export interface LiveSummary {
  activeCalls: number
  avgSeconds: number
  byStatus: Record<AgentStatus, number>
  sentiment: Record<Sentiment, number>
}

export function getLiveSummary(calls: CallSession[], agents: Agent[], now: Date = new Date()): LiveSummary {
  const active = getActiveCalls(calls)
  const byStatus: Record<AgentStatus, number> = { on_call: 0, available: 0, break: 0, offline: 0 }
  for (const a of agents) byStatus[a.status] += 1
  const sentiment: Record<Sentiment, number> = { positive: 0, neutral: 0, negative: 0 }
  for (const c of active) sentiment[c.sentiment] += 1
  const total = active.reduce((sum, c) => sum + getCallSeconds(c, now), 0)
  return {
    activeCalls: active.length,
    avgSeconds: active.length > 0 ? Math.round(total / active.length) : 0,
    byStatus,
    sentiment,
  }
}
