import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Agent } from '@/types'
import type { SmartGroup, UserProfile } from '@/types/directory'
import type { AnswerValue, FormAudience, FormSubmission, FormTemplate, FormsResult } from '@/types/forms'
import { buildMockSubmissions, buildMockTemplates } from '@/data/formsMock'
import { getGroupMembers, getProfile } from '@/lib/groups'
import { hasSubmittedOn, normalizeDraft, validateAnswers, validateTemplate } from '@/lib/forms'
import type { TemplateDraft } from '@/lib/forms'
import { useDirectoryStore } from '@/store/useDirectoryStore'
import { useWorkforceStore } from '@/store/useWorkforceStore'

interface FormsState {
  templates: FormTemplate[]
  submissions: FormSubmission[]

  createTemplate: (draft: TemplateDraft, createdBy: string) => FormsResult
  updateTemplate: (templateId: string, draft: TemplateDraft) => FormsResult
  setTemplateActive: (templateId: string, active: boolean) => FormsResult
  /** Solo plantillas sin respuestas; las que ya tienen respuestas se desactivan */
  deleteTemplate: (templateId: string) => FormsResult
  submitForm: (templateId: string, agentId: string, answers: Record<string, AnswerValue>) => FormsResult
  reviewSubmission: (submissionId: string, reviewerId: string, comment: string) => FormsResult

  resetFormsDemo: () => void
}

/** ¿El agente está en el público del formulario? Usuarios inactivos nunca lo están. */
export function isInAudience(
  audience: FormAudience,
  agentId: string,
  agents: Agent[],
  profiles: UserProfile[],
  groups: SmartGroup[],
): boolean {
  const agent = agents.find((a) => a.id === agentId)
  if (!agent || !getProfile(profiles, agentId).active) return false
  if (audience.kind === 'everyone') return true
  if (audience.kind === 'campaigns') return audience.campaignIds.includes(agent.campaignId)
  const group = groups.find((g) => g.id === audience.groupId)
  return !!group && getGroupMembers(group, agents, profiles).some((a) => a.id === agentId)
}

function context() {
  return {
    campaignIds: useWorkforceStore.getState().campaigns.map((c) => c.id),
    groupIds: useDirectoryStore.getState().groups.map((g) => g.id),
  }
}

const seed = () => ({ templates: buildMockTemplates(), submissions: buildMockSubmissions() })

export const useFormsStore = create<FormsState>()(
  persist(
    (set, get) => ({
      ...seed(),

      createTemplate: (draft, createdBy) => {
        const error = validateTemplate(draft, context())
        if (error) return { ok: false, ...error }
        const template: FormTemplate = {
          ...normalizeDraft(draft),
          id: crypto.randomUUID(),
          active: true,
          createdBy,
          createdAt: new Date().toISOString(),
        }
        set((s) => ({ templates: [template, ...s.templates] }))
        return { ok: true }
      },

      updateTemplate: (templateId, draft) => {
        if (!get().templates.some((t) => t.id === templateId)) return { ok: false, reason: 'not_found' }
        const error = validateTemplate(draft, context())
        if (error) return { ok: false, ...error }
        const clean = normalizeDraft(draft)
        set((s) => ({ templates: s.templates.map((t) => (t.id === templateId ? { ...t, ...clean } : t)) }))
        return { ok: true }
      },

      setTemplateActive: (templateId, active) => {
        if (!get().templates.some((t) => t.id === templateId)) return { ok: false, reason: 'not_found' }
        set((s) => ({ templates: s.templates.map((t) => (t.id === templateId ? { ...t, active } : t)) }))
        return { ok: true }
      },

      deleteTemplate: (templateId) => {
        if (!get().templates.some((t) => t.id === templateId)) return { ok: false, reason: 'not_found' }
        if (get().submissions.some((s) => s.templateId === templateId)) return { ok: false, reason: 'has_submissions' }
        set((s) => ({ templates: s.templates.filter((t) => t.id !== templateId) }))
        return { ok: true }
      },

      submitForm: (templateId, agentId, answers) => {
        const template = get().templates.find((t) => t.id === templateId)
        if (!template) return { ok: false, reason: 'not_found' }
        if (!template.active) return { ok: false, reason: 'inactive' }
        const { agents } = useWorkforceStore.getState()
        const { profiles, groups } = useDirectoryStore.getState()
        if (!isInAudience(template.audience, agentId, agents, profiles, groups)) return { ok: false, reason: 'not_assigned' }
        const now = new Date()
        if (template.frequency === 'daily' && hasSubmittedOn(get().submissions, templateId, agentId, now)) {
          return { ok: false, reason: 'already_today' }
        }
        const checked = validateAnswers(template.questions, answers, agents.map((a) => a.id))
        if (!checked.ok) return { ok: false, reason: checked.reason, questionId: checked.questionId }
        const submission: FormSubmission = {
          id: crypto.randomUUID(),
          templateId,
          submittedBy: agentId,
          submittedAt: now.toISOString(),
          answers: checked.clean,
          status: 'pending',
          reviewedBy: null,
          reviewedAt: null,
          reviewComment: null,
        }
        set((s) => ({ submissions: [submission, ...s.submissions] }))
        return { ok: true }
      },

      reviewSubmission: (submissionId, reviewerId, comment) => {
        const current = get().submissions.find((s) => s.id === submissionId)
        if (!current) return { ok: false, reason: 'not_found' }
        if (current.status === 'reviewed') return { ok: false, reason: 'already_reviewed' }
        if (getProfile(useDirectoryStore.getState().profiles, reviewerId).role === 'agent') {
          return { ok: false, reason: 'not_assigned' }
        }
        const patch = {
          status: 'reviewed' as const,
          reviewedBy: reviewerId,
          reviewedAt: new Date().toISOString(),
          reviewComment: comment.trim() || null,
        }
        set((s) => ({ submissions: s.submissions.map((x) => (x.id === submissionId ? { ...x, ...patch } : x)) }))
        return { ok: true }
      },

      resetFormsDemo: () => set(seed()),
    }),
    { name: 'vooxline-forms', version: 1 },
  ),
)
