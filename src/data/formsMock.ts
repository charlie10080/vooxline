import type { AnswerValue, FormQuestion, FormSubmission, FormTemplate, QuestionType } from '@/types/forms'

const hoursAgo = (h: number): string => new Date(Date.now() - h * 3_600_000).toISOString()
const pad = (n: number): string => String(n).padStart(2, '0')
const dayAgo = (n: number): string => {
  const d = new Date(Date.now() - n * 86_400_000)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const q = (
  id: string,
  type: QuestionType,
  label: string,
  extra: Partial<Omit<FormQuestion, 'id' | 'type' | 'label'>> = {},
): FormQuestion => ({ id, type, label, required: true, options: [], min: null, max: null, ...extra })

export function buildMockTemplates(): FormTemplate[] {
  return [
    {
      id: 'f-qa',
      title: 'Evaluación de calidad de llamada',
      description: 'Monitoreo QA de una llamada grabada: protocolo, empatía y resolución.',
      category: 'qa',
      audience: { kind: 'group', groupId: 'g-supervisors' },
      frequency: 'multiple',
      active: true,
      createdBy: 'a-carlos',
      createdAt: hoursAgo(24 * 30),
      questions: [
        q('qa-agent', 'agent', 'Agente evaluado'),
        q('qa-date', 'date', 'Fecha de la llamada'),
        q('qa-greeting', 'rating', 'Saludo y presentación'),
        q('qa-empathy', 'rating', 'Empatía y escucha activa'),
        q('qa-resolution', 'rating', 'Resolución en primer contacto'),
        q('qa-script', 'yes_no', '¿Siguió el guion de cumplimiento?'),
        q('qa-notes', 'long_text', 'Retroalimentación para el agente', { required: false }),
      ],
    },
    {
      id: 'f-shift',
      title: 'Checklist de inicio de turno',
      description: 'Verifica tu estación antes de conectarte a la cola.',
      category: 'shift_checklist',
      audience: { kind: 'everyone' },
      frequency: 'daily',
      active: true,
      createdBy: 'a-valeria',
      createdAt: hoursAgo(24 * 60),
      questions: [
        q('sh-headset', 'yes_no', '¿La diadema funciona (micrófono y audio)?'),
        q('sh-softphone', 'yes_no', '¿El softphone está registrado?'),
        q('sh-vpn', 'yes_no', '¿La VPN está conectada?'),
        q('sh-script', 'yes_no', '¿Revisaste el guion vigente de tu campaña?'),
        q('sh-latency', 'number', 'Latencia medida (ms)', { required: false, min: 0, max: 1000 }),
        q('sh-notes', 'short_text', 'Observaciones', { required: false }),
      ],
    },
    {
      id: 'f-climate',
      title: 'Encuesta de clima mensual',
      description: 'Cuéntanos cómo te sientes en tu equipo. Tus respuestas ayudan a mejorar la operación.',
      category: 'survey',
      audience: { kind: 'everyone' },
      frequency: 'daily',
      active: true,
      createdBy: 'a-carlos',
      createdAt: hoursAgo(24 * 10),
      questions: [
        q('cl-satisfaction', 'rating', '¿Qué tan satisfecho estás con tu trabajo este mes?'),
        q('cl-load', 'single_choice', 'Tu carga de trabajo es…', { options: ['Baja', 'Adecuada', 'Alta', 'Excesiva'] }),
        q('cl-improve', 'multi_choice', '¿Qué mejorarías?', {
          required: false,
          options: ['Capacitación', 'Herramientas', 'Horarios', 'Comunicación con supervisión', 'Pausas'],
        }),
        q('cl-comments', 'long_text', 'Comentarios adicionales', { required: false }),
      ],
    },
    {
      id: 'f-incident',
      title: 'Reporte de incidencia técnica',
      description: 'Reporta fallas de audio, softphone, VPN o CRM que afecten tus llamadas.',
      category: 'incident',
      audience: { kind: 'everyone' },
      frequency: 'multiple',
      active: true,
      createdBy: 'a-valeria',
      createdAt: hoursAgo(24 * 45),
      questions: [
        q('in-type', 'single_choice', 'Tipo de falla', { options: ['Audio', 'Softphone', 'VPN', 'CRM', 'Equipo de cómputo'] }),
        q('in-severity', 'single_choice', 'Severidad', { options: ['Baja', 'Media', 'Alta', 'Crítica'] }),
        q('in-date', 'date', 'Fecha de la falla'),
        q('in-calls', 'number', 'Llamadas afectadas', { min: 0, max: 500 }),
        q('in-desc', 'long_text', 'Descripción de lo que pasó'),
      ],
    },
  ]
}

const sub = (
  id: string,
  templateId: string,
  submittedBy: string,
  submittedAt: string,
  answers: Record<string, AnswerValue>,
  review?: { by: string; at: string; comment: string },
): FormSubmission => ({
  id,
  templateId,
  submittedBy,
  submittedAt,
  answers,
  status: review ? 'reviewed' : 'pending',
  reviewedBy: review?.by ?? null,
  reviewedAt: review?.at ?? null,
  reviewComment: review?.comment ?? null,
})

export function buildMockSubmissions(): FormSubmission[] {
  return [
    sub(
      'fs-1', 'f-qa', 'a-carlos', hoursAgo(50),
      { 'qa-agent': 'a-maria', 'qa-date': dayAgo(3), 'qa-greeting': 5, 'qa-empathy': 5, 'qa-resolution': 4, 'qa-script': true, 'qa-notes': 'Excelente manejo de objeciones, cerrar con resumen del caso.' },
      { by: 'a-valeria', at: hoursAgo(30), comment: 'Calibrado con el equipo de QA. Compartir como ejemplo.' },
    ),
    sub(
      'fs-2', 'f-qa', 'a-valeria', hoursAgo(20),
      { 'qa-agent': 'a-david', 'qa-date': dayAgo(1), 'qa-greeting': 4, 'qa-empathy': 3, 'qa-resolution': 2, 'qa-script': false, 'qa-notes': 'Omitió el aviso de privacidad y no validó identidad.' },
    ),
    sub(
      'fs-3', 'f-qa', 'a-carlos', hoursAgo(4),
      { 'qa-agent': 'a-sofia', 'qa-date': dayAgo(0), 'qa-greeting': 4, 'qa-empathy': 4, 'qa-resolution': 3, 'qa-script': true, 'qa-notes': null },
    ),
    sub('fs-4', 'f-shift', 'a-maria', hoursAgo(2), {
      'sh-headset': true, 'sh-softphone': true, 'sh-vpn': true, 'sh-script': true, 'sh-latency': 18, 'sh-notes': null,
    }),
    sub(
      'fs-5', 'f-shift', 'a-sofia', hoursAgo(26),
      { 'sh-headset': true, 'sh-softphone': false, 'sh-vpn': true, 'sh-script': true, 'sh-latency': 140, 'sh-notes': 'Softphone pide reinstalar certificado.' },
      { by: 'a-valeria', at: hoursAgo(25), comment: 'Escalado a soporte TI, ya quedó resuelto.' },
    ),
    sub('fs-6', 'f-climate', 'a-maria', hoursAgo(72), {
      'cl-satisfaction': 4, 'cl-load': 'Alta', 'cl-improve': ['Pausas', 'Horarios'], 'cl-comments': 'Más pausas activas en picos de la tarde.',
    }),
    sub('fs-7', 'f-climate', 'a-david', hoursAgo(48), {
      'cl-satisfaction': 3, 'cl-load': 'Excesiva', 'cl-improve': ['Capacitación', 'Herramientas'], 'cl-comments': null,
    }),
    sub('fs-8', 'f-incident', 'a-alejandro-t', hoursAgo(3), {
      'in-type': 'VPN', 'in-severity': 'Alta', 'in-date': dayAgo(0), 'in-calls': 6, 'in-desc': 'La VPN se desconecta cada 20 minutos y se cortan las llamadas en curso.',
    }),
  ]
}
