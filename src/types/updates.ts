export type UpdateCategory = 'operation' | 'campaign' | 'hr' | 'urgent'

/** Estado guardado. "Programado" y "Vencido" se calculan con publishAt / expiresAt (ver getUpdateState). */
export type UpdateStatus = 'draft' | 'published' | 'archived'

/** Estado visible, derivado del guardado y de la hora actual */
export type UpdateState = 'draft' | 'scheduled' | 'live' | 'expired' | 'archived'

export type UpdateAudience =
  | { kind: 'everyone' }
  | { kind: 'campaigns'; campaignIds: string[] }
  | { kind: 'group'; groupId: string }

export interface UpdateComment {
  id: string
  authorId: string
  body: string
  /** ISO */
  createdAt: string
}

export type UpdateEventKind = 'created' | 'published' | 'edited' | 'reminder' | 'archived' | 'restored'

export interface UpdateEvent {
  id: string
  kind: UpdateEventKind
  actorId: string
  /** ISO */
  at: string
  /** Por ejemplo, a cuántas personas se mandó el recordatorio */
  note: string | null
}

export interface Update {
  id: string
  title: string
  /** Texto plano: párrafos separados por línea en blanco, listas con "- ", negritas con **texto** */
  body: string
  category: UpdateCategory
  audience: UpdateAudience
  requiresConfirmation: boolean
  pinned: boolean
  commentsEnabled: boolean
  status: UpdateStatus
  authorId: string
  /** ISO */
  createdAt: string
  /** ISO. Cuándo se vuelve visible; null = en cuanto se publica */
  publishAt: string | null
  /** ISO. Deja de verse en el feed de los agentes; null = no vence */
  expiresAt: string | null
  /** agentId -> ISO de la primera lectura */
  reads: Record<string, string>
  /** agentId -> ISO de la confirmación "Leído y entendido" */
  confirmations: Record<string, string>
  likes: string[]
  comments: UpdateComment[]
  history: UpdateEvent[]
}

export type UpdateError =
  | 'not_found'
  | 'invalid'
  | 'forbidden'
  | 'not_in_audience'
  | 'not_live'
  | 'comments_disabled'
  | 'confirmation_not_required'
  | 'nobody_pending'

export type UpdateResult = { ok: true } | { ok: false; reason: UpdateError }
