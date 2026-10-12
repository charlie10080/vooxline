export type FormCategory = 'qa' | 'survey' | 'shift_checklist' | 'incident' | 'other'

export type QuestionType =
  | 'short_text'
  | 'long_text'
  | 'single_choice'
  | 'multi_choice'
  | 'yes_no'
  | 'number'
  | 'rating'
  | 'date'
  /** Elegir a un usuario (p. ej. el agente evaluado en QA) */
  | 'agent'

export interface FormQuestion {
  id: string
  type: QuestionType
  label: string
  required: boolean
  /** Solo para single_choice / multi_choice */
  options: string[]
  /** Solo para number: rango permitido (null = sin límite) */
  min: number | null
  max: number | null
}

export type FormAudience =
  | { kind: 'everyone' }
  | { kind: 'campaigns'; campaignIds: string[] }
  | { kind: 'group'; groupId: string }

/** multiple = sin límite · daily = una respuesta por usuario por día */
export type SubmissionFrequency = 'multiple' | 'daily'

export interface FormTemplate {
  id: string
  title: string
  description: string
  category: FormCategory
  audience: FormAudience
  questions: FormQuestion[]
  active: boolean
  frequency: SubmissionFrequency
  createdBy: string
  /** ISO */
  createdAt: string
}

/**
 * Valor de una respuesta según el tipo de pregunta:
 * texto/fecha (YYYY-MM-DD)/single_choice/agent (id) = string · multi_choice = string[] ·
 * yes_no = boolean · number/rating = number · sin responder = null
 */
export type AnswerValue = string | string[] | number | boolean | null

export type SubmissionStatus = 'pending' | 'reviewed'

export interface FormSubmission {
  id: string
  templateId: string
  submittedBy: string
  /** ISO */
  submittedAt: string
  answers: Record<string, AnswerValue>
  status: SubmissionStatus
  reviewedBy: string | null
  reviewedAt: string | null
  reviewComment: string | null
}

export type FormsError =
  | 'not_found'
  | 'invalid_title'
  | 'no_questions'
  | 'invalid_question'
  | 'invalid_audience'
  | 'inactive'
  | 'not_assigned'
  | 'already_today'
  | 'missing_required'
  | 'invalid_answer'
  | 'has_submissions'
  | 'already_reviewed'

export type FormsResult = { ok: true } | { ok: false; reason: FormsError; questionId?: string }
