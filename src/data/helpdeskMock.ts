import type { Ticket, TicketCategory, TicketEvent, TicketMessage, TicketPriority, TicketStatus } from '@/types/helpdesk'

const minsAgo = (m: number): string => new Date(Date.now() - m * 60_000).toISOString()
const H = 60
const D = 24 * H

let seq = 0
const nextId = (p: string): string => `${p}-${++seq}`

const msg = (authorId: string, body: string, ago: number, internal = false): TicketMessage => ({
  id: nextId('hm'),
  authorId,
  body,
  internal,
  createdAt: minsAgo(ago),
})

const ev = (actorId: string, kind: TicketEvent['kind'], from: string | null, to: string | null, ago: number): TicketEvent => ({
  id: nextId('he'),
  actorId,
  kind,
  from,
  to,
  at: minsAgo(ago),
})

interface Seed {
  code: number
  requesterId: string
  category: TicketCategory
  priority: TicketPriority
  title: string
  description: string
  attachmentName?: string
  status: TicketStatus
  assigneeId: string | null
  /** Minutos desde la creación */
  age: number
  firstResponseAgo?: number
  resolvedAgo?: number
  rating?: number
  messages?: TicketMessage[]
  history?: TicketEvent[]
}

function build(s: Seed): Ticket {
  const messages = s.messages ?? []
  const history = [ev(s.requesterId, 'created', null, 'open', s.age), ...(s.history ?? [])]
  const last = Math.min(s.age, ...messages.map((m) => (Date.now() - new Date(m.createdAt).getTime()) / 60_000))
  return {
    id: `hd-${s.code}`,
    code: `HD-${s.code}`,
    requesterId: s.requesterId,
    category: s.category,
    priority: s.priority,
    title: s.title,
    description: s.description,
    attachmentName: s.attachmentName ?? null,
    status: s.status,
    assigneeId: s.assigneeId,
    createdAt: minsAgo(s.age),
    updatedAt: minsAgo(last),
    firstResponseAt: s.firstResponseAgo !== undefined ? minsAgo(s.firstResponseAgo) : null,
    resolvedAt: s.resolvedAgo !== undefined ? minsAgo(s.resolvedAgo) : null,
    rating: s.rating ?? null,
    messages,
    history,
  }
}

/** Tickets de ejemplo, con fechas relativas a ahora */
export function buildMockTickets(): Ticket[] {
  seq = 0
  return [
    build({
      code: 1048,
      requesterId: 'a-maria',
      category: 'headset',
      priority: 'high',
      title: 'Diadema sin micrófono en llamadas entrantes',
      description:
        'Desde el inicio del turno el cliente no me escucha. La diadema Jabra Evolve2 sí reproduce audio, pero el micrófono no aparece en el softphone. Ya probé desconectar y reconectar el USB.',
      status: 'in_progress',
      assigneeId: 'a-carlos',
      age: 3 * H + 20,
      firstResponseAgo: 3 * H,
      messages: [
        msg('a-carlos', 'Hola María, ¿puedes probar en otro puerto USB y confirmarme si Windows la detecta en Sonido > Grabación?', 3 * H),
        msg('a-maria', 'En otro puerto tampoco aparece. Estoy tomando llamadas con la diadema de respaldo del piso.', 2 * H + 30),
        msg('a-carlos', 'Probable falla de hardware. Solicitar reemplazo a almacén (quedan 3 en inventario).', 2 * H + 10, true),
      ],
      history: [
        ev('a-carlos', 'assignee', null, 'a-carlos', 3 * H + 5),
        ev('a-carlos', 'status', 'open', 'in_progress', 3 * H),
      ],
    }),
    build({
      code: 1049,
      requesterId: 'a-sofia',
      category: 'softphone',
      priority: 'critical',
      title: 'Latencia y cortes de audio SIP en Trunk-02',
      description:
        'Varias llamadas con eco y cortes de 2-3 segundos. El indicador del softphone marca más de 250 ms. Compañeros de Trunk-02 reportan lo mismo.',
      status: 'open',
      assigneeId: null,
      age: 75,
    }),
    build({
      code: 1050,
      requesterId: 'a-alejandro-t',
      category: 'network',
      priority: 'critical',
      title: 'VPN caída, no puedo conectarme desde home office',
      description:
        'El cliente de VPN se queda en "Autenticando" y luego marca error de tiempo de espera. Mi internet funciona bien (otros sitios cargan normal).',
      attachmentName: 'error_vpn_timeout.png',
      status: 'in_progress',
      assigneeId: 'a-valeria',
      age: 40,
      firstResponseAgo: 25,
      messages: [
        msg('a-valeria', 'Estamos revisando el concentrador de VPN, hay más reportes. Te aviso en cuanto quede.', 25),
        msg('a-valeria', 'Escalado a NOC: el certificado del concentrador venció hoy a las 00:00.', 20, true),
      ],
      history: [
        ev('a-valeria', 'assignee', null, 'a-valeria', 30),
        ev('a-valeria', 'status', 'open', 'in_progress', 25),
      ],
    }),
    build({
      code: 1046,
      requesterId: 'a-david',
      category: 'access',
      priority: 'medium',
      title: 'Reseteo de contraseña del CRM',
      description: 'Mi usuario del CRM quedó bloqueado después de tres intentos fallidos. Necesito restablecer la contraseña para atender mi campaña.',
      status: 'resolved',
      assigneeId: 'a-carlos',
      age: 26 * H,
      firstResponseAgo: 25 * H + 30,
      resolvedAgo: 25 * H,
      messages: [
        msg('a-carlos', 'Listo David, te envié una contraseña temporal a tu correo corporativo. El sistema te pedirá cambiarla al entrar.', 25 * H),
      ],
      history: [
        ev('a-carlos', 'assignee', null, 'a-carlos', 25 * H + 35),
        ev('a-carlos', 'status', 'open', 'resolved', 25 * H),
      ],
    }),
    build({
      code: 1047,
      requesterId: 'a-alejandro-m',
      category: 'payroll',
      priority: 'low',
      title: 'Horas extra no reflejadas en el recibo de nómina',
      description: 'En el recibo de la quincena no aparecen las 6 horas extra del sábado. Adjunto captura del recibo.',
      attachmentName: 'recibo_quincena.pdf',
      status: 'waiting_user',
      assigneeId: 'a-valeria',
      age: 2 * D + 4 * H,
      firstResponseAgo: 2 * D,
      messages: [
        msg('a-valeria', 'Hola Alejandro, ¿me confirmas la fecha exacta del sábado y quién autorizó las horas extra?', 2 * D),
      ],
      history: [
        ev('a-valeria', 'assignee', null, 'a-valeria', 2 * D + H),
        ev('a-valeria', 'status', 'open', 'waiting_user', 2 * D),
      ],
    }),
    build({
      code: 1045,
      requesterId: 'a-maria',
      category: 'computer',
      priority: 'medium',
      title: 'La computadora se reinicia sola al abrir el CRM',
      description: 'Pasa dos o tres veces por turno, siempre al cargar la ficha del cliente. Estación 14, piso 2.',
      status: 'closed',
      assigneeId: 'a-valeria',
      age: 5 * D,
      firstResponseAgo: 5 * D - 50,
      resolvedAgo: 4 * D + 6 * H,
      rating: 5,
      messages: [
        msg('a-valeria', 'Revisamos la estación: la fuente de poder estaba fallando. Ya se reemplazó.', 4 * D + 6 * H),
        msg('a-maria', '¡Gracias! Ya no se ha vuelto a reiniciar.', 4 * D + 4 * H),
      ],
      history: [
        ev('a-valeria', 'assignee', null, 'a-valeria', 5 * D - 60),
        ev('a-valeria', 'status', 'open', 'in_progress', 5 * D - 50),
        ev('a-valeria', 'status', 'in_progress', 'resolved', 4 * D + 6 * H),
        ev('a-maria', 'rated', null, '5', 4 * D + 4 * H),
        ev('a-valeria', 'status', 'resolved', 'closed', 3 * D),
      ],
    }),
    build({
      code: 1051,
      requesterId: 'a-david',
      category: 'crm',
      priority: 'high',
      title: 'El CRM no guarda las tipificaciones de llamada',
      description: 'Al cerrar la llamada y elegir la tipificación, el botón Guardar se queda cargando. Pierdo la nota y tengo que capturarla de nuevo.',
      status: 'open',
      assigneeId: 'a-carlos',
      age: 3 * H + 30,
      history: [ev('a-carlos', 'assignee', null, 'a-carlos', 3 * H)],
    }),
    build({
      code: 1044,
      requesterId: 'a-alejandro-t',
      category: 'softphone',
      priority: 'medium',
      title: 'Extensión SIP-115 no registra después de actualizar',
      description: 'Tras la actualización del softphone la extensión aparece como "No registrada".',
      status: 'resolved',
      assigneeId: 'a-carlos',
      age: 6 * D,
      firstResponseAgo: 6 * D - 2 * H,
      resolvedAgo: 5 * D,
      rating: 3,
      messages: [
        msg('a-carlos', 'Se reconfiguró el perfil SIP con el nuevo servidor de registro. Ya aparece en línea.', 5 * D),
        msg('a-alejandro-t', 'Funciona, aunque tardó más de un día.', 5 * D - H),
      ],
      history: [
        ev('a-carlos', 'assignee', null, 'a-carlos', 6 * D - 2 * H),
        ev('a-carlos', 'status', 'open', 'resolved', 5 * D),
        ev('a-alejandro-t', 'rated', null, '3', 5 * D - H),
      ],
    }),
  ]
}
