import type { FormCategory, FormsError, QuestionType, SubmissionFrequency } from '@/types/forms'

export const CATEGORY_LABELS: Record<FormCategory, string> = {
  qa: 'Calidad QA',
  survey: 'Encuesta',
  shift_checklist: 'Checklist de inicio de turno',
  incident: 'Incidencia',
  other: 'Otro',
}

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  short_text: 'Texto corto',
  long_text: 'Texto largo',
  single_choice: 'Opción única',
  multi_choice: 'Opción múltiple',
  yes_no: 'Sí / No',
  number: 'Número',
  rating: 'Calificación 1-5',
  date: 'Fecha',
  agent: 'Selector de agente',
}

export const FREQUENCY_LABELS: Record<SubmissionFrequency, string> = {
  multiple: 'Respuestas ilimitadas',
  daily: 'Una por día',
}

export const FORMS_ERROR_MESSAGES: Record<FormsError, string> = {
  not_found: 'El formulario o la respuesta ya no existe.',
  invalid_title: 'El formulario necesita un título.',
  no_questions: 'Agrega al menos una pregunta.',
  invalid_question:
    'Revisa la pregunta marcada: necesita texto, las de opciones al menos 2 opciones distintas y el mínimo no puede ser mayor que el máximo.',
  invalid_audience: 'Elige al menos una campaña o un grupo que exista.',
  inactive: 'Este formulario está desactivado.',
  not_assigned: 'No tienes asignado este formulario o no tienes permiso para esta acción.',
  already_today: 'Ya enviaste este formulario hoy. Vuelve mañana.',
  missing_required: 'Falta responder una pregunta obligatoria.',
  invalid_answer: 'Una respuesta no es válida (revisa rangos y opciones).',
  has_submissions: 'No se puede eliminar porque ya tiene respuestas. Desactívalo en su lugar.',
  already_reviewed: 'Esta respuesta ya fue revisada.',
}

export const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })

export const scoreTone = (score: number): 'success' | 'warning' | 'danger' =>
  score >= 85 ? 'success' : score >= 70 ? 'warning' : 'danger'
