import type { ChatMessage, ChatReadMap, Conversation } from '@/types/chat'
import { directId } from '@/lib/chat'

/** Hace N minutos, en ISO */
const ago = (minutes: number): string => new Date(Date.now() - minutes * 60_000).toISOString()
/** Hace N días a una hora dada (N >= 1, para no caer en el futuro) */
const dayAt = (daysAgo: number, hour: number, minute: number): string => {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

const channel = (
  id: string,
  name: string,
  description: string,
  scope: Conversation['scope'],
  campaignId: string | null = null,
  announcementOnly = false,
): Conversation => ({
  id, kind: 'channel', name, description, scope, campaignId, memberIds: [], announcementOnly, createdBy: null, createdAt: dayAt(30, 8, 0),
})

const direct = (a: string, b: string): Conversation => ({
  id: directId(a, b), kind: 'direct', name: '', description: '', scope: null, campaignId: null,
  memberIds: [a, b], announcementOnly: false, createdBy: a, createdAt: dayAt(10, 9, 0),
})

export function buildMockConversations(): Conversation[] {
  return [
    channel('ch-general', 'General', 'Conversación de todo el equipo de Vooxline', 'all'),
    channel('ch-comunicados', 'Comunicados', 'Avisos oficiales de operación. Solo supervisión publica.', 'all', null, true),
    channel('ch-supervision', 'Supervisión', 'Canal privado de supervisores y administradores', 'managers'),
    channel('ch-c-national', 'National Assemblers', 'Campaña National Assemblers Inc', 'campaign', 'c-national'),
    channel('ch-c-fidelis', 'Fidelis Manager', 'Campaña Fidelis Manager', 'campaign', 'c-fidelis'),
    channel('ch-c-vog', 'VOG Firma Legal', 'Campaña VOG Firma Legal', 'campaign', 'c-vog'),
    channel('ch-c-fintech', 'FinTech Support', 'Campaña FinTech Enterprise Support', 'campaign', 'c-fintech'),
    direct('a-maria', 'a-carlos'),
    direct('a-valeria', 'a-carlos'),
    direct('a-sofia', 'a-david'),
    {
      id: 'grp-fintech-cierre', kind: 'group', name: 'Cierre de mes FinTech', description: 'Seguimiento de tickets abiertos antes del corte',
      scope: null, campaignId: null, memberIds: ['a-valeria', 'a-carlos', 'a-alejandro-t'], announcementOnly: false,
      createdBy: 'a-valeria', createdAt: dayAt(3, 10, 0),
    },
  ]
}

let seq = 0
const msg = (
  conversationId: string,
  authorId: string,
  createdAt: string,
  text: string,
  extra: Partial<ChatMessage> = {},
): ChatMessage => ({
  id: `m-${++seq}`, conversationId, authorId, text, createdAt, editedAt: null, deletedAt: null,
  replyToId: null, reactions: {}, pinned: false, ...extra,
})

export function buildMockMessages(): ChatMessage[] {
  seq = 0
  const dmMC = directId('a-maria', 'a-carlos')
  const dmVC = directId('a-valeria', 'a-carlos')
  const dmSD = directId('a-sofia', 'a-david')
  return [
    // General
    msg('ch-general', 'a-carlos', dayAt(2, 8, 5), '¡Buenos días, equipo! Recuerden registrar su entrada en el reloj checador antes de conectarse al softphone.', { reactions: { '👍': ['a-maria', 'a-sofia', 'a-david'] } }),
    msg('ch-general', 'a-maria', dayAt(2, 8, 12), '¿Alguien más tiene lentitud en el CRM esta mañana? Me tarda en cargar la ficha del cliente.'),
    msg('ch-general', 'a-david', dayAt(2, 8, 14), 'Sí, a mí también. Ya levanté ticket con TI.', { replyToId: 'm-2' }),
    msg('ch-general', 'a-valeria', dayAt(1, 13, 40), 'Quedó resuelto lo del CRM. Era un problema de caché en el servidor. Gracias por reportarlo 🙌', { reactions: { '🎉': ['a-maria', 'a-david'] } }),
    msg('ch-general', 'a-sofia', ago(95), '¿Hoy hay pastel por el cumpleaños de @David Morales? 🎂'),
    msg('ch-general', 'a-carlos', ago(40), 'A las 4 pm en el comedor. No le digan nada a @David Morales 🤫', { reactions: { '😂': ['a-sofia', 'a-maria'] } }),

    // Comunicados (solo supervisión)
    msg('ch-comunicados', 'a-valeria', dayAt(4, 9, 0), 'A partir del lunes el horario de break se escalona por campaña para mantener el nivel de servicio arriba de 80/20. Consulten su turno en Horarios.', { pinned: true, reactions: { '✅': ['a-maria', 'a-sofia', 'a-alejandro-t'] } }),
    msg('ch-comunicados', 'a-carlos', ago(180), 'Mañana de 7:00 a 7:30 habrá mantenimiento al IVR. Si entran llamadas por la línea de respaldo, usen el speech de contingencia.', { pinned: true }),

    // Supervisión
    msg('ch-supervision', 'a-carlos', dayAt(1, 18, 10), 'Cerramos ayer con TMO de 5:42 en Fidelis. Sigue alto por las llamadas de facturación.'),
    msg('ch-supervision', 'a-valeria', dayAt(1, 18, 22), 'En VOG estamos en 4:58. Te comparto el guion corto de facturación que nos funcionó.'),
    msg('ch-supervision', 'a-valeria', ago(65), 'Ojo: @Carlos Mendoza, Alejandro Moreno lleva 3 días sin registrar entrada. ¿Lo revisas en Asistencia?'),

    // National Assemblers
    msg('ch-c-national', 'a-carlos', dayAt(1, 9, 0), 'Equipo National: hoy entra campaña de recuperación de cartera, prioridad a las colas 2 y 3.', { pinned: true }),
    msg('ch-c-national', 'a-maria', dayAt(1, 11, 30), 'Tengo un cliente que pide hablar en inglés con supervisor, ¿a quién lo transfiero?'),
    msg('ch-c-national', 'a-carlos', dayAt(1, 11, 33), 'Transfiérelo a la extensión SIP-104 de respaldo bilingüe, o márcame y lo tomo yo.', { replyToId: 'm-13' }),
    msg('ch-c-national', 'a-david', ago(120), 'Cola 3 con 12 llamadas en espera. ¿Abrimos más agentes?'),
    msg('ch-c-national', 'a-sofia', ago(25), 'Ya me conecté para apoyar la cola 3 👋'),
    msg('ch-c-national', 'a-maria', ago(8), 'Gracias @Sofía Navarro, ya bajó a 4 en espera.', { reactions: { '❤️': ['a-sofia'] } }),

    // Fidelis
    msg('ch-c-fidelis', 'a-carlos', dayAt(2, 10, 0), 'Recordatorio: validar identidad con 3 datos antes de dar saldo de póliza.', { pinned: true }),
    msg('ch-c-fidelis', 'a-alejandro-m', dayAt(2, 16, 45), 'Entendido. ¿El RFC cuenta como uno de los tres?'),
    msg('ch-c-fidelis', 'a-carlos', dayAt(2, 16, 50), 'Sí, RFC, fecha de nacimiento y código postal.', { replyToId: 'm-19' }),

    // VOG
    msg('ch-c-vog', 'a-valeria', ago(300), 'Calibración de QA a las 3 pm. Traigan 2 llamadas grabadas de esta semana.'),

    // FinTech
    msg('ch-c-fintech', 'a-alejandro-t', ago(210), 'Muchos clientes reportan que no les llega el código de verificación por SMS.'),
    msg('ch-c-fintech', 'a-valeria', ago(200), 'Escálalo como incidente P2 y usa la plantilla de "validación por correo" mientras tanto.', { replyToId: 'm-22' }),
    msg('ch-c-fintech', 'a-alejandro-t', ago(15), 'Listo, ticket INC-4471 creado. El proveedor de SMS ya lo está revisando.'),

    // Directos
    msg(dmMC, 'a-maria', dayAt(1, 15, 0), 'Carlos, ¿me puedes revisar la evaluación de QA de la llamada de ayer? Creo que se marcó mal el cierre.'),
    msg(dmMC, 'a-carlos', dayAt(1, 15, 20), 'Claro, la reviso con el auditor y te aviso.'),
    msg(dmMC, 'a-carlos', ago(30), 'Ya quedó corregida, subiste a 98 de calidad. ¡Buen trabajo! 💪'),
    msg(dmVC, 'a-valeria', ago(50), '¿Me cubres la junta de las 5? Tengo la calibración de VOG.'),
    msg(dmSD, 'a-sofia', ago(60), 'David, ¿me pasas la tipificación que usas para quejas de entrega?'),
    msg(dmSD, 'a-david', ago(55), 'Es "Logística > Retraso > Seguimiento". Si hay daño usa "Logística > Daño".'),

    // Grupo
    msg('grp-fintech-cierre', 'a-valeria', dayAt(3, 10, 5), 'Armé este grupo para cerrar los 18 tickets pendientes antes del corte del viernes.'),
    msg('grp-fintech-cierre', 'a-alejandro-t', dayAt(1, 17, 0), 'Van 11 cerrados, quedan 7 que dependen del área de fraudes.'),
    msg('grp-fintech-cierre', 'a-carlos', ago(90), 'Hablé con fraudes, liberan 5 hoy. @Alejandro Torres avísame cuando los cierres.'),
  ]
}

/**
 * Lectura inicial: cada usuario leyó todo hasta hace 2 horas, y algunos van más atrás para que la demo
 * muestre pendientes. Los usuarios sin registro ven todo como no leído.
 */
export function buildMockReadMap(conversations: Conversation[]): ChatReadMap {
  const ids = ['a-maria', 'a-carlos', 'a-valeria', 'a-alejandro-t', 'a-sofia', 'a-alejandro-m', 'a-david']
  const map: ChatReadMap = {}
  for (const c of conversations) map[c.id] = Object.fromEntries(ids.map((id) => [id, ago(150)]))
  // Supervisor por defecto (Carlos) y María ya leyeron algunos canales al día
  map['ch-general']['a-carlos'] = ago(35)
  map['ch-c-national']['a-maria'] = ago(5)
  map[directId('a-maria', 'a-carlos')]['a-carlos'] = ago(1)
  map['ch-c-fintech']['a-alejandro-t'] = ago(10)
  return map
}
