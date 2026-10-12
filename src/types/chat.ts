/** Canal = abierto por regla de membresía · direct = 1 a 1 · group = grupo creado por un supervisor */
export type ConversationKind = 'channel' | 'direct' | 'group'

/** Quién pertenece a un canal: todos, agentes de una campaña (+ supervisión) o solo supervisión */
export type ChannelScope = 'all' | 'campaign' | 'managers'

export interface Conversation {
  id: string
  kind: ConversationKind
  /** En los directos se muestra el nombre del otro usuario */
  name: string
  description: string
  /** Solo canales */
  scope: ChannelScope | null
  /** Solo canales con scope 'campaign' */
  campaignId: string | null
  /** Solo direct y group: miembros fijos */
  memberIds: string[]
  /** Solo supervisores y admins pueden publicar */
  announcementOnly: boolean
  createdBy: string | null
  /** ISO */
  createdAt: string
}

export const CHAT_REACTIONS = ['👍', '❤️', '😂', '🎉', '👀', '✅'] as const
export type ChatReaction = (typeof CHAT_REACTIONS)[number]

export interface ChatMessage {
  id: string
  conversationId: string
  authorId: string
  /** Vacío si el mensaje se eliminó */
  text: string
  /** ISO */
  createdAt: string
  editedAt: string | null
  deletedAt: string | null
  replyToId: string | null
  /** emoji -> ids de usuarios que reaccionaron */
  reactions: Partial<Record<ChatReaction, string[]>>
  pinned: boolean
}

/** conversationId -> userId -> ISO de la última lectura */
export type ChatReadMap = Record<string, Record<string, string>>

export type ChatError =
  | 'not_found'
  | 'not_member'
  | 'forbidden'
  | 'announcement_only'
  | 'empty'
  | 'too_long'
  | 'invalid'

export type ChatResult = { ok: true } | { ok: false; reason: ChatError }
export type ChatCreateResult = { ok: true; conversationId: string } | { ok: false; reason: ChatError }
