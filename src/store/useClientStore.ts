import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ClientRequest, ClientRequestPriority, ClientRequestType, ClientResult, Invoice } from '@/types/client'
import { buildMockInvoices, buildMockRequests } from '@/data/clientMock'

interface ClientState {
  requests: ClientRequest[]
  invoices: Invoice[]
  addRequest: (draft: { campaignId: string; type: ClientRequestType; title: string; priority: ClientRequestPriority }) => ClientResult
  /** Solo se puede retirar una solicitud que nadie ha empezado a revisar */
  cancelRequest: (id: string) => ClientResult
  resetClientDemo: () => void
}

const seed = () => ({ requests: buildMockRequests(), invoices: buildMockInvoices() })

export const useClientStore = create<ClientState>()(
  persist(
    (set, get) => ({
      ...seed(),

      addRequest: (draft) => {
        const title = draft.title.trim()
        if (!title) return { ok: false, reason: 'empty_title' }
        const request: ClientRequest = { ...draft, title, id: crypto.randomUUID(), status: 'abierto', createdAt: new Date().toISOString() }
        set((s) => ({ requests: [request, ...s.requests] }))
        return { ok: true }
      },

      cancelRequest: (id) => {
        const request = get().requests.find((r) => r.id === id)
        if (!request) return { ok: false, reason: 'not_found' }
        if (request.status !== 'abierto') return { ok: false, reason: 'not_cancellable' }
        set((s) => ({ requests: s.requests.map((r) => (r.id === id ? { ...r, status: 'cancelado' } : r)) }))
        return { ok: true }
      },

      resetClientDemo: () => set(seed()),
    }),
    { name: 'vooxline-client', version: 1 },
  ),
)
