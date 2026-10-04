import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ActivityDraft, ActivityEvent } from '@/types/activity'

const MAX_EVENTS = 300

interface ActivityState {
  /** Más reciente primero */
  events: ActivityEvent[]
  record: (drafts: ActivityDraft[]) => void
  clearActivity: () => void
}

export const useActivityStore = create<ActivityState>()(
  persist(
    (set) => ({
      events: [],

      record: (drafts) => {
        if (drafts.length === 0) return
        const at = new Date().toISOString()
        const created: ActivityEvent[] = drafts.map((d) => ({ ...d, id: crypto.randomUUID(), at }))
        set((s) => ({ events: [...created.reverse(), ...s.events].slice(0, MAX_EVENTS) }))
      },

      clearActivity: () => set({ events: [] }),
    }),
    { name: 'vooxline-activity', version: 1 },
  ),
)
