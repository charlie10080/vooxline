import type {
  AnswerValue,
  FormAudience,
  FormQuestion,
  FormSubmission,
  FormTemplate,
  FormsError,
  QuestionType,
  SubmissionStatus,
} from '@/types/forms'

/*
 * Reglas puras de formularios: validación de plantillas y respuestas, puntaje QA, resúmenes y CSV.
 * Solo importa tipos para poder probarse con `node --experimental-strip-types`.
 */

export const CHOICE_TYPES: QuestionType[] = ['single_choice', 'multi_choice']
export const isChoiceType = (t: QuestionType): boolean => CHOICE_TYPES.includes(t)

const pad = (n: number): string => String(n).padStart(2, '0')
/** Fecha local YYYY-MM-DD de un ISO */
export const localDateOf = (iso: string): string => {
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
const isDateStr = (s: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s))

export const isEmptyAnswer = (v: AnswerValue | undefined): boolean =>
  v === null || v === undefined || (typeof v === 'string' && v.trim() === '') || (Array.isArray(v) && v.length === 0)

export function emptyQuestion(type: QuestionType, id: string): FormQuestion {
  return {
    id,
    type,
    label: '',
    required: true,
    options: isChoiceType(type) ? ['Opción 1', 'Opción 2'] : [],
    min: null,
    max: null,
  }
}

/** Mueve una pregunta arriba (-1) o abajo (+1). Fuera de rango devuelve la misma lista. */
export function moveQuestion<T>(list: T[], index: number, dir: -1 | 1): T[] {
  const target = index + dir
  if (index < 0 || index >= list.length || target < 0 || target >= list.length) return list
  const next = [...list]
  ;[next[index], next[target]] = [next[target], next[index]]
  return next
}

export type TemplateDraft = Pick<
  FormTemplate,
  'title' | 'description' | 'category' | 'audience' | 'questions' | 'frequency'
>

/** Reglas de una plantilla. Devuelve el error y la pregunta culpable, o null si es válida. */
export function validateTemplate(
  draft: TemplateDraft,
  ctx: { campaignIds: string[]; groupIds: string[] },
): { reason: FormsError; questionId?: string } | null {
  if (!draft.title.trim()) return { reason: 'invalid_title' }
  if (!validAudience(draft.audience, ctx)) return { reason: 'invalid_audience' }
  if (draft.questions.length === 0) return { reason: 'no_questions' }
  const ids = new Set<string>()
  for (const q of draft.questions) {
    if (ids.has(q.id) || !q.label.trim()) return { reason: 'invalid_question', questionId: q.id }
    ids.add(q.id)
    if (isChoiceType(q.type)) {
      const opts = q.options.map((o) => o.trim())
      if (opts.length < 2 || opts.some((o) => !o) || new Set(opts.map((o) => o.toLowerCase())).size !== opts.length) {
        return { reason: 'invalid_question', questionId: q.id }
      }
    }
    if (q.type === 'number' && q.min !== null && q.max !== null && q.min > q.max) {
      return { reason: 'invalid_question', questionId: q.id }
    }
  }
  return null
}

function validAudience(a: FormAudience, ctx: { campaignIds: string[]; groupIds: string[] }): boolean {
  if (a.kind === 'everyone') return true
  if (a.kind === 'campaigns') return a.campaignIds.length > 0 && a.campaignIds.every((id) => ctx.campaignIds.includes(id))
  return ctx.groupIds.includes(a.groupId)
}

/** Limpia textos de la plantilla antes de guardarla */
export function normalizeDraft(draft: TemplateDraft): TemplateDraft {
  return {
    ...draft,
    title: draft.title.trim(),
    description: draft.description.trim(),
    questions: draft.questions.map((q) => ({
      ...q,
      label: q.label.trim(),
      options: isChoiceType(q.type) ? q.options.map((o) => o.trim()) : [],
      min: q.type === 'number' ? q.min : null,
      max: q.type === 'number' ? q.max : null,
    })),
  }
}

/** Revisa una respuesta individual (ya sabiendo que no está vacía) */
function answerIsValid(q: FormQuestion, v: AnswerValue, agentIds: string[]): boolean {
  switch (q.type) {
    case 'short_text':
    case 'long_text':
      return typeof v === 'string'
    case 'single_choice':
      return typeof v === 'string' && q.options.includes(v)
    case 'multi_choice':
      return Array.isArray(v) && new Set(v).size === v.length && v.every((o) => q.options.includes(o))
    case 'yes_no':
      return typeof v === 'boolean'
    case 'number':
      return (
        typeof v === 'number' &&
        Number.isFinite(v) &&
        (q.min === null || v >= q.min) &&
        (q.max === null || v <= q.max)
      )
    case 'rating':
      return typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 5
    case 'date':
      return typeof v === 'string' && isDateStr(v)
    case 'agent':
      return typeof v === 'string' && agentIds.includes(v)
  }
}

/** Valida todas las respuestas. Las preguntas que no existen en la plantilla se descartan. */
export function validateAnswers(
  questions: FormQuestion[],
  answers: Record<string, AnswerValue>,
  agentIds: string[],
): { ok: true; clean: Record<string, AnswerValue> } | { ok: false; reason: 'missing_required' | 'invalid_answer'; questionId: string } {
  const clean: Record<string, AnswerValue> = {}
  for (const q of questions) {
    const raw = answers[q.id]
    const v = typeof raw === 'string' ? raw.trim() : raw
    if (isEmptyAnswer(v)) {
      if (q.required) return { ok: false, reason: 'missing_required', questionId: q.id }
      clean[q.id] = null
      continue
    }
    if (!answerIsValid(q, v as AnswerValue, agentIds)) return { ok: false, reason: 'invalid_answer', questionId: q.id }
    clean[q.id] = v as AnswerValue
  }
  return { ok: true, clean }
}

/** Ya respondió hoy (día local de `now`) */
export function hasSubmittedOn(subs: FormSubmission[], templateId: string, agentId: string, now: Date): boolean {
  const today = localDateOf(now.toISOString())
  return subs.some((s) => s.templateId === templateId && s.submittedBy === agentId && localDateOf(s.submittedAt) === today)
}

/** El formulario califica: tiene selector de agente y al menos una pregunta de calificación */
export const isScored = (t: Pick<FormTemplate, 'questions'>): boolean =>
  t.questions.some((q) => q.type === 'agent') && t.questions.some((q) => q.type === 'rating')

/** Puntaje % = suma de calificaciones / (5 × calificaciones respondidas). null si no aplica o no hay calificaciones. */
export function scoreSubmission(t: Pick<FormTemplate, 'questions'>, answers: Record<string, AnswerValue>): number | null {
  if (!isScored(t)) return null
  const ratings = t.questions
    .filter((q) => q.type === 'rating')
    .map((q) => answers[q.id])
    .filter((v): v is number => typeof v === 'number')
  if (ratings.length === 0) return null
  return Math.round((ratings.reduce((a, b) => a + b, 0) / (ratings.length * 5)) * 100)
}

/** Agente evaluado (primera pregunta tipo agente), si hay */
export function evaluatedAgentId(t: Pick<FormTemplate, 'questions'>, answers: Record<string, AnswerValue>): string | null {
  const q = t.questions.find((x) => x.type === 'agent')
  const v = q ? answers[q.id] : null
  return typeof v === 'string' ? v : null
}

export interface SubmissionFilter {
  status: SubmissionStatus | 'all'
  /** id de quien envió, o '' para todos */
  agentId: string
  /** YYYY-MM-DD inclusive, '' sin límite */
  from: string
  to: string
}

export function filterSubmissions(subs: FormSubmission[], f: SubmissionFilter): FormSubmission[] {
  return subs.filter((s) => {
    const day = localDateOf(s.submittedAt)
    return (
      (f.status === 'all' || s.status === f.status) &&
      (!f.agentId || s.submittedBy === f.agentId) &&
      (!f.from || day >= f.from) &&
      (!f.to || day <= f.to)
    )
  })
}

export type QuestionSummary =
  | { kind: 'counts'; answered: number; counts: Array<{ label: string; count: number }> }
  | { kind: 'average'; answered: number; average: number | null }
  | { kind: 'answered'; answered: number }

export function summarizeQuestion(q: FormQuestion, subs: FormSubmission[], nameOf: (id: string) => string): QuestionSummary {
  const values = subs.map((s) => s.answers[q.id]).filter((v) => !isEmptyAnswer(v))
  const answered = values.length
  if (q.type === 'rating' || q.type === 'number') {
    const nums = values.filter((v): v is number => typeof v === 'number')
    const average = nums.length ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10 : null
    return { kind: 'average', answered, average }
  }
  const labels =
    q.type === 'yes_no' ? ['Sí', 'No'] : isChoiceType(q.type) ? q.options : q.type === 'agent' ? null : undefined
  if (labels === undefined) return { kind: 'answered', answered }
  const tally = new Map<string, number>((labels ?? []).map((l) => [l, 0]))
  for (const v of values) {
    const keys = Array.isArray(v) ? v : [q.type === 'yes_no' ? (v ? 'Sí' : 'No') : q.type === 'agent' ? nameOf(String(v)) : String(v)]
    for (const k of keys) tally.set(k, (tally.get(k) ?? 0) + 1)
  }
  return { kind: 'counts', answered, counts: [...tally].map(([label, count]) => ({ label, count })) }
}

/** Texto legible de una respuesta */
export function formatAnswer(q: FormQuestion, v: AnswerValue | undefined, nameOf: (id: string) => string): string {
  if (isEmptyAnswer(v)) return ''
  if (Array.isArray(v)) return v.join('; ')
  if (typeof v === 'boolean') return v ? 'Sí' : 'No'
  if (q.type === 'agent') return nameOf(String(v))
  if (q.type === 'rating') return `${v}/5`
  return String(v)
}

/** Escapa un campo CSV (RFC 4180). Neutraliza fórmulas para que Excel no las ejecute. */
export function csvEscape(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
  return /[",\r\n;]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

export function submissionsToCsv(
  t: FormTemplate,
  subs: FormSubmission[],
  nameOf: (id: string) => string,
): string {
  const scored = isScored(t)
  const header = ['Enviado por', 'Fecha', 'Estado', ...(scored ? ['Puntaje %'] : []), ...t.questions.map((q) => q.label), 'Comentario de revisión']
  const rows = subs.map((s) => {
    const score = scoreSubmission(t, s.answers)
    return [
      nameOf(s.submittedBy),
      s.submittedAt,
      s.status === 'reviewed' ? 'Revisado' : 'Pendiente',
      ...(scored ? [score === null ? '' : String(score)] : []),
      ...t.questions.map((q) => formatAnswer(q, s.answers[q.id], nameOf)),
      s.reviewComment ?? '',
    ]
  })
  return [header, ...rows].map((r) => r.map(csvEscape).join(',')).join('\r\n')
}
