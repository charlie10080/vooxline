import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AutomationResult, AutomationRule, AutomationRun, RuleDraft } from '@/types/automations'
import { buildMockRules, buildMockRuns } from '@/data/automationsMock'
import { capKeys, validateRuleDraft } from '@/lib/automations'
import { getProfile } from '@/lib/groups'
import { useDirectoryStore } from '@/store/useDirectoryStore'
import { useFormsStore } from '@/store/useFormsStore'
import { useWorkforceStore } from '@/store/useWorkforceStore'

const MAX_RUNS = 200

interface AutomationsState {
  rules: AutomationRule[]
  runs: AutomationRun[]
  /** "regla|evento" que ya se dispararon (o que existían al activar la regla) */
  firedKeys: string[]
  /**
   * Reglas cuyo estado inicial ya se registró. Una regla nueva, editada o reactivada
   * solo reacciona a lo que pase DESPUÉS, no al historial.
   */
  primedRuleIds: string[]

  createRule: (actorId: string, draft: RuleDraft) => AutomationResult
  updateRule: (actorId: string, ruleId: string, draft: RuleDraft) => AutomationResult
  toggleRule: (actorId: string, ruleId: string) => AutomationResult
  deleteRule: (actorId: string, ruleId: string) => AutomationResult
  /** Uso interno del motor (lib/automationEngine) */
  recordEvaluation: (input: { keys: string[]; runs: AutomationRun[]; primedRuleIds: string[] }) => void

  resetAutomationsDemo: () => void
}

const isManager = (agentId: string): boolean =>
  getProfile(useDirectoryStore.getState().profiles, agentId).role !== 'agent'

function checkDraft(draft: RuleDraft): AutomationResult {
  const reason = validateRuleDraft(draft, {
    agentIds: useWorkforceStore.getState().agents.map((a) => a.id),
    campaignIds: useWorkforceStore.getState().campaigns.map((c) => c.id),
    templateIds: useFormsStore.getState().templates.map((t) => t.id),
  })
  return reason ? { ok: false, reason } : { ok: true }
}

const clean = (draft: RuleDraft): RuleDraft => ({ ...draft, name: draft.name.trim(), message: draft.message.trim() })

const seed = () => ({ rules: buildMockRules(), runs: buildMockRuns(), firedKeys: [], primedRuleIds: [] })

export const useAutomationsStore = create<AutomationsState>()(
  persist(
    (set, get) => ({
      ...seed(),

      createRule: (actorId, draft) => {
        if (!isManager(actorId)) return { ok: false, reason: 'forbidden' }
        const check = checkDraft(draft)
        if (!check.ok) return check
        const now = new Date().toISOString()
        const rule: AutomationRule = { ...clean(draft), id: crypto.randomUUID(), enabled: true, createdBy: actorId, createdAt: now, updatedAt: now }
        set((s) => ({ rules: [rule, ...s.rules] }))
        return { ok: true }
      },

      updateRule: (actorId, ruleId, draft) => {
        if (!isManager(actorId)) return { ok: false, reason: 'forbidden' }
        if (!get().rules.some((r) => r.id === ruleId)) return { ok: false, reason: 'not_found' }
        const check = checkDraft(draft)
        if (!check.ok) return check
        const now = new Date().toISOString()
        set((s) => ({
          rules: s.rules.map((r) => (r.id === ruleId ? { ...r, ...clean(draft), updatedAt: now } : r)),
          primedRuleIds: s.primedRuleIds.filter((id) => id !== ruleId),
        }))
        return { ok: true }
      },

      toggleRule: (actorId, ruleId) => {
        if (!isManager(actorId)) return { ok: false, reason: 'forbidden' }
        if (!get().rules.some((r) => r.id === ruleId)) return { ok: false, reason: 'not_found' }
        set((s) => ({
          rules: s.rules.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled, updatedAt: new Date().toISOString() } : r)),
          primedRuleIds: s.primedRuleIds.filter((id) => id !== ruleId),
        }))
        return { ok: true }
      },

      deleteRule: (actorId, ruleId) => {
        if (!isManager(actorId)) return { ok: false, reason: 'forbidden' }
        if (!get().rules.some((r) => r.id === ruleId)) return { ok: false, reason: 'not_found' }
        const prefix = `${ruleId}|`
        set((s) => ({
          rules: s.rules.filter((r) => r.id !== ruleId),
          firedKeys: s.firedKeys.filter((k) => !k.startsWith(prefix)),
          primedRuleIds: s.primedRuleIds.filter((id) => id !== ruleId),
        }))
        return { ok: true }
      },

      recordEvaluation: ({ keys, runs, primedRuleIds }) => {
        if (keys.length === 0 && runs.length === 0 && primedRuleIds.length === 0) return
        set((s) => ({
          firedKeys: capKeys(s.firedKeys, keys),
          runs: [...runs, ...s.runs].slice(0, MAX_RUNS),
          primedRuleIds: [...new Set([...s.primedRuleIds, ...primedRuleIds])],
        }))
      },

      resetAutomationsDemo: () => set(seed()),
    }),
    { name: 'vooxline-automations', version: 1 },
  ),
)
