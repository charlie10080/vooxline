import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  BadgeType,
  CelebrationsResult,
  ReactionKind,
  Recognition,
  Redemption,
  Reward,
} from '@/types/celebrations'
import { buildMockBirthdays, buildMockRecognitions, buildMockRedemptions, buildMockRewards } from '@/data/celebrationsMock'
import { MESSAGE_MAX, isBadge, isMonthDay, pointsBalance, pointsFor } from '@/lib/celebrations'
import { getProfile } from '@/lib/groups'
import { useDirectoryStore } from '@/store/useDirectoryStore'
import { useWorkforceStore } from '@/store/useWorkforceStore'

export interface RewardDraft {
  /** Al editar: id del premio */
  id?: string
  name: string
  description: string
  cost: number
  stock: number
  active: boolean
}

export type RedemptionAction = 'approve' | 'deliver' | 'reject'

interface CelebrationsState {
  recognitions: Recognition[]
  rewards: Reward[]
  redemptions: Redemption[]
  /** agentId -> "MM-DD" */
  birthdays: Record<string, string>

  giveRecognition: (fromId: string, toId: string, badge: BadgeType, message: string) => CelebrationsResult
  toggleReaction: (recognitionId: string, userId: string, kind: ReactionKind) => CelebrationsResult
  addComment: (recognitionId: string, userId: string, text: string) => CelebrationsResult
  /** Solo supervisores/admins. `null` borra el cumpleaños. */
  setBirthday: (actorId: string, agentId: string, monthDay: string | null) => CelebrationsResult
  /** Solo supervisores/admins. Crea o edita un premio del catálogo. */
  saveReward: (actorId: string, draft: RewardDraft) => CelebrationsResult
  redeemReward: (agentId: string, rewardId: string) => CelebrationsResult
  /** Solo supervisores/admins. pending -> approved -> delivered; pending/approved -> rejected (devuelve stock y puntos). */
  resolveRedemption: (actorId: string, redemptionId: string, action: RedemptionAction) => CelebrationsResult

  resetCelebrationsDemo: () => void
}

const exists = (id: string): boolean => useWorkforceStore.getState().agents.some((a) => a.id === id)
const profileOf = (id: string) => getProfile(useDirectoryStore.getState().profiles, id)
const isManager = (id: string): boolean => profileOf(id).role !== 'agent'
const REACTIONS: ReactionKind[] = ['applause', 'heart', 'fire']
const COMMENT_MAX = 200

const seed = () => ({
  recognitions: buildMockRecognitions(),
  rewards: buildMockRewards(),
  redemptions: buildMockRedemptions(),
  birthdays: buildMockBirthdays(),
})

export const useCelebrationsStore = create<CelebrationsState>()(
  persist(
    (set, get) => ({
      ...seed(),

      giveRecognition: (fromId, toId, badge, message) => {
        if (!exists(fromId) || !exists(toId)) return { ok: false, reason: 'not_found' }
        if (fromId === toId) return { ok: false, reason: 'self_recognition' }
        const text = message.trim()
        if (!isBadge(badge) || !text || text.length > MESSAGE_MAX) return { ok: false, reason: 'invalid' }
        if (!profileOf(fromId).active || !profileOf(toId).active) return { ok: false, reason: 'inactive_user' }
        const recognition: Recognition = {
          id: crypto.randomUUID(),
          fromId,
          toId,
          badge,
          message: text,
          points: pointsFor(isManager(fromId)),
          createdAt: new Date().toISOString(),
          reactions: { applause: [], heart: [], fire: [] },
          comments: [],
        }
        set((s) => ({ recognitions: [recognition, ...s.recognitions] }))
        return { ok: true }
      },

      toggleReaction: (recognitionId, userId, kind) => {
        if (!exists(userId) || !REACTIONS.includes(kind)) return { ok: false, reason: 'invalid' }
        if (!get().recognitions.some((r) => r.id === recognitionId)) return { ok: false, reason: 'not_found' }
        set((s) => ({
          recognitions: s.recognitions.map((r) => {
            if (r.id !== recognitionId) return r
            const list = r.reactions[kind]
            const next = list.includes(userId) ? list.filter((id) => id !== userId) : [...list, userId]
            return { ...r, reactions: { ...r.reactions, [kind]: next } }
          }),
        }))
        return { ok: true }
      },

      addComment: (recognitionId, userId, text) => {
        const body = text.trim()
        if (!exists(userId) || !body || body.length > COMMENT_MAX) return { ok: false, reason: 'invalid' }
        if (!get().recognitions.some((r) => r.id === recognitionId)) return { ok: false, reason: 'not_found' }
        const comment = { id: crypto.randomUUID(), authorId: userId, text: body, createdAt: new Date().toISOString() }
        set((s) => ({
          recognitions: s.recognitions.map((r) => (r.id === recognitionId ? { ...r, comments: [...r.comments, comment] } : r)),
        }))
        return { ok: true }
      },

      setBirthday: (actorId, agentId, monthDay) => {
        if (!isManager(actorId)) return { ok: false, reason: 'forbidden' }
        if (!exists(agentId)) return { ok: false, reason: 'not_found' }
        if (monthDay !== null && !isMonthDay(monthDay)) return { ok: false, reason: 'invalid' }
        set((s) => {
          const birthdays = { ...s.birthdays }
          if (monthDay === null) delete birthdays[agentId]
          else birthdays[agentId] = monthDay
          return { birthdays }
        })
        return { ok: true }
      },

      saveReward: (actorId, draft) => {
        if (!isManager(actorId)) return { ok: false, reason: 'forbidden' }
        const name = draft.name.trim()
        if (
          !name ||
          name.length > 60 ||
          !Number.isInteger(draft.cost) ||
          draft.cost <= 0 ||
          !Number.isInteger(draft.stock) ||
          draft.stock < 0
        ) {
          return { ok: false, reason: 'invalid' }
        }
        const reward: Reward = {
          id: draft.id ?? crypto.randomUUID(),
          name,
          description: draft.description.trim(),
          cost: draft.cost,
          stock: draft.stock,
          active: draft.active,
        }
        if (draft.id) {
          if (!get().rewards.some((r) => r.id === draft.id)) return { ok: false, reason: 'not_found' }
          set((s) => ({ rewards: s.rewards.map((r) => (r.id === draft.id ? reward : r)) }))
        } else {
          set((s) => ({ rewards: [...s.rewards, reward] }))
        }
        return { ok: true }
      },

      redeemReward: (agentId, rewardId) => {
        const { rewards, recognitions, redemptions } = get()
        const reward = rewards.find((r) => r.id === rewardId)
        if (!reward || !exists(agentId)) return { ok: false, reason: 'not_found' }
        if (!profileOf(agentId).active) return { ok: false, reason: 'inactive_user' }
        if (!reward.active) return { ok: false, reason: 'reward_inactive' }
        if (reward.stock <= 0) return { ok: false, reason: 'out_of_stock' }
        if (pointsBalance(agentId, recognitions, redemptions) < reward.cost) return { ok: false, reason: 'insufficient_points' }
        const redemption: Redemption = {
          id: crypto.randomUUID(),
          agentId,
          rewardId,
          rewardName: reward.name,
          cost: reward.cost,
          status: 'pending',
          requestedAt: new Date().toISOString(),
          resolvedAt: null,
        }
        set((s) => ({
          redemptions: [redemption, ...s.redemptions],
          rewards: s.rewards.map((r) => (r.id === rewardId ? { ...r, stock: r.stock - 1 } : r)),
        }))
        return { ok: true }
      },

      resolveRedemption: (actorId, redemptionId, action) => {
        if (!isManager(actorId)) return { ok: false, reason: 'forbidden' }
        const current = get().redemptions.find((r) => r.id === redemptionId)
        if (!current) return { ok: false, reason: 'not_found' }
        const allowed =
          (action === 'approve' && current.status === 'pending') ||
          (action === 'deliver' && current.status === 'approved') ||
          (action === 'reject' && (current.status === 'pending' || current.status === 'approved'))
        if (!allowed) return { ok: false, reason: 'already_processed' }
        const status: Redemption['status'] = action === 'approve' ? 'approved' : action === 'deliver' ? 'delivered' : 'rejected'
        const now = new Date().toISOString()
        set((s) => ({
          redemptions: s.redemptions.map((r) =>
            r.id === redemptionId ? { ...r, status, resolvedAt: status === 'approved' ? null : now } : r,
          ),
          // Rechazar devuelve la unidad al inventario (los puntos vuelven solos: el saldo ignora los rechazados)
          rewards:
            action === 'reject'
              ? s.rewards.map((r) => (r.id === current.rewardId ? { ...r, stock: r.stock + 1 } : r))
              : s.rewards,
        }))
        return { ok: true }
      },

      resetCelebrationsDemo: () => set(seed()),
    }),
    { name: 'vooxline-celebrations', version: 1 },
  ),
)
