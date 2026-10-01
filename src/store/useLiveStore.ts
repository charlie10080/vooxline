import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Agent } from '@/types'
import type {
  CallSession,
  LiveResult,
  MonitorLogEntry,
  MonitorMode,
  MonitorSession,
  Sentiment,
} from '@/types/live'
import { buildMockCalls } from '@/data/liveMock'
import { getCallSeconds } from '@/lib/live'
import { useWorkforceStore } from '@/store/useWorkforceStore'

/** Cada cuántos ms debe llamar tick() el intervalo de la página */
export const TICK_MS = 3000
const MIN_CALL_SECONDS = 40
const END_PROBABILITY = 0.12
const START_PROBABILITY = 0.3
const MAX_ENDED_CALLS_KEPT = 50
const MAX_LOG_ENTRIES = 100

interface LiveState {
  calls: CallSession[]
  /** Supervisión actual (solo una a la vez, simulada) */
  monitoring: MonitorSession | null
  monitorLog: MonitorLogEntry[]
  simulationEnabled: boolean

  startCall: (agentId: string, opts?: { isVip?: boolean }) => LiveResult
  endCall: (callId: string) => LiveResult
  /** Pausa / descanso. Solo con turno abierto y sin llamada activa. */
  setBreak: (agentId: string, onBreak: boolean) => LiveResult

  startMonitoring: (callId: string, mode: MonitorMode) => LiveResult
  setMonitorMode: (mode: MonitorMode) => LiveResult
  stopMonitoring: () => void

  setSimulationEnabled: (enabled: boolean) => void
  /** Un paso de la simulación: reconcilia, termina y crea llamadas al azar. Llamar cada TICK_MS mientras la página esté abierta. */
  tick: () => void
  /** Termina las llamadas cuyo agente ya se desconectó (por ejemplo, marcó salida) */
  reconcile: () => void

  resetLiveDemo: () => void
}

const seed = () => ({ calls: buildMockCalls(), monitoring: null, monitorLog: [] as MonitorLogEntry[] })

const hasOpenEntry = (agentId: string): boolean =>
  useWorkforceStore.getState().timeEntries.some((e) => e.agentId === agentId && e.clockOut === null)

const patchAgent = (agentId: string, patch: Partial<Agent>): void => {
  useWorkforceStore.setState((s) => ({
    agents: s.agents.map((a) => (a.id === agentId ? { ...a, ...patch } : a)),
  }))
}

const clamp = (n: number, min: number, max: number): number => Math.min(max, Math.max(min, n))
const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min

const nextSentiment = (current: Sentiment): Sentiment => {
  const order: Sentiment[] = ['negative', 'neutral', 'positive']
  const i = order.indexOf(current)
  const step = Math.random() < 0.5 ? -1 : 1
  return order[clamp(i + step, 0, order.length - 1)]
}

export const useLiveStore = create<LiveState>()(
  persist(
    (set, get) => {
      const log = (entry: Omit<MonitorLogEntry, 'id' | 'at'>): void => {
        set((s) => ({
          monitorLog: [
            { ...entry, id: crypto.randomUUID(), at: new Date().toISOString() },
            ...s.monitorLog,
          ].slice(0, MAX_LOG_ENTRIES),
        }))
      }

      return {
        ...seed(),
        simulationEnabled: true,

        startCall: (agentId, opts) => {
          const agent = useWorkforceStore.getState().agents.find((a) => a.id === agentId)
          if (!agent) return { ok: false, reason: 'not_found' }
          if (!hasOpenEntry(agentId)) return { ok: false, reason: 'not_clocked_in' }
          if (agent.status !== 'available') return { ok: false, reason: 'busy' }
          const now = new Date().toISOString()
          const call: CallSession = {
            id: crypto.randomUUID(),
            agentId,
            campaignId: agent.campaignId,
            startedAt: now,
            endedAt: null,
            customerLabel: `Cliente #${randomInt(1000, 9999)}`,
            isVip: opts?.isVip ?? Math.random() < 0.15,
            sentiment: 'neutral',
            qaScore: randomInt(88, 99),
          }
          patchAgent(agentId, { status: 'on_call', statusSince: now, isVip: call.isVip })
          set((s) => ({ calls: [call, ...s.calls] }))
          return { ok: true }
        },

        endCall: (callId) => {
          const call = get().calls.find((c) => c.id === callId)
          if (!call) return { ok: false, reason: 'not_found' }
          if (call.endedAt !== null) return { ok: false, reason: 'call_ended' }
          const now = new Date().toISOString()
          const stillClocked = hasOpenEntry(call.agentId)
          patchAgent(call.agentId, {
            status: stillClocked ? 'available' : 'offline',
            statusSince: now,
            isVip: false,
            qaScore: call.qaScore,
            qaLabel: call.qaScore >= 95 ? 'Óptimo' : call.qaScore >= 85 ? 'Bueno' : 'Por mejorar',
          })
          const monitor = get().monitoring
          if (monitor?.callId === callId) log({ callId, agentId: call.agentId, action: 'stop', mode: monitor.mode })
          set((s) => {
            const calls = s.calls.map((c) => (c.id === callId ? { ...c, endedAt: now } : c))
            const active = calls.filter((c) => c.endedAt === null)
            const ended = calls.filter((c) => c.endedAt !== null).slice(0, MAX_ENDED_CALLS_KEPT)
            return {
              calls: [...active, ...ended],
              monitoring: s.monitoring?.callId === callId ? null : s.monitoring,
            }
          })
          return { ok: true }
        },

        setBreak: (agentId, onBreak) => {
          const agent = useWorkforceStore.getState().agents.find((a) => a.id === agentId)
          if (!agent) return { ok: false, reason: 'not_found' }
          if (!hasOpenEntry(agentId)) return { ok: false, reason: 'not_clocked_in' }
          if (agent.status === 'on_call') return { ok: false, reason: 'on_call' }
          patchAgent(agentId, { status: onBreak ? 'break' : 'available', statusSince: new Date().toISOString() })
          return { ok: true }
        },

        startMonitoring: (callId, mode) => {
          const call = get().calls.find((c) => c.id === callId)
          if (!call) return { ok: false, reason: 'not_found' }
          if (call.endedAt !== null) return { ok: false, reason: 'call_ended' }
          const previous = get().monitoring
          if (previous && previous.callId !== callId) {
            const prevCall = get().calls.find((c) => c.id === previous.callId)
            if (prevCall) log({ callId: previous.callId, agentId: prevCall.agentId, action: 'stop', mode: previous.mode })
          }
          set({ monitoring: { callId, mode, startedAt: new Date().toISOString() } })
          log({ callId, agentId: call.agentId, action: 'start', mode })
          return { ok: true }
        },

        setMonitorMode: (mode) => {
          const monitor = get().monitoring
          if (!monitor) return { ok: false, reason: 'not_found' }
          const call = get().calls.find((c) => c.id === monitor.callId)
          if (!call || call.endedAt !== null) return { ok: false, reason: 'call_ended' }
          set({ monitoring: { ...monitor, mode } })
          log({ callId: monitor.callId, agentId: call.agentId, action: 'mode_change', mode })
          return { ok: true }
        },

        stopMonitoring: () => {
          const monitor = get().monitoring
          if (!monitor) return
          const call = get().calls.find((c) => c.id === monitor.callId)
          if (call) log({ callId: monitor.callId, agentId: call.agentId, action: 'stop', mode: monitor.mode })
          set({ monitoring: null })
        },

        setSimulationEnabled: (enabled) => set({ simulationEnabled: enabled }),

        reconcile: () => {
          const { agents } = useWorkforceStore.getState()
          const orphaned = get().calls.filter(
            (c) => c.endedAt === null && agents.find((a) => a.id === c.agentId)?.status === 'offline',
          )
          for (const call of orphaned) get().endCall(call.id)
        },

        tick: () => {
          get().reconcile()
          const now = new Date()

          // 1) Terminan algunas llamadas que ya duraron lo suficiente
          for (const call of get().calls.filter((c) => c.endedAt === null)) {
            if (getCallSeconds(call, now) >= MIN_CALL_SECONDS && Math.random() < END_PROBABILITY) {
              get().endCall(call.id)
            }
          }

          // 2) Entran llamadas a los agentes con turno abierto y disponibles
          for (const agent of useWorkforceStore.getState().agents) {
            if (agent.status === 'available' && hasOpenEntry(agent.id) && Math.random() < START_PROBABILITY) {
              get().startCall(agent.id)
            }
          }

          // 3) Cambia un poco el ánimo y la calidad de las llamadas activas
          set((s) => ({
            calls: s.calls.map((c) =>
              c.endedAt !== null
                ? c
                : {
                    ...c,
                    sentiment: Math.random() < 0.1 ? nextSentiment(c.sentiment) : c.sentiment,
                    qaScore: clamp(c.qaScore + randomInt(-1, 1), 60, 100),
                  },
            ),
          }))
        },

        resetLiveDemo: () => set(seed()),
      }
    },
    { name: 'vooxline-live', version: 1 },
  ),
)
