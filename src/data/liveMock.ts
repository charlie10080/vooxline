import type { CallSession } from '@/types/live'

const secondsAgo = (s: number): string => new Date(Date.now() - s * 1000).toISOString()

/** Coinciden con los agentes que en data/mock.ts ya están "en llamada" (María, VIP; y Valeria) */
export function buildMockCalls(): CallSession[] {
  return [
    { id: 'call-seed-1', agentId: 'a-maria', campaignId: 'c-national', startedAt: secondsAgo(252), endedAt: null, customerLabel: 'Cliente #4821', isVip: true, sentiment: 'positive', qaScore: 98 },
    { id: 'call-seed-2', agentId: 'a-valeria', campaignId: 'c-vog', startedAt: secondsAgo(728), endedAt: null, customerLabel: 'Cliente #3307', isVip: false, sentiment: 'neutral', qaScore: 95 },
  ]
}
