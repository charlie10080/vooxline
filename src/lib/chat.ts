import type { Agent } from '@/types'
import type { UserProfile } from '@/types/directory'
import type { ChatMessage, ChatReadMap, Conversation } from '@/types/chat'

/** Solo imports de tipos: este archivo se puede probar con node --experimental-strip-types */

export const MAX_MESSAGE_LENGTH = 2000

export interface ChatUser {
  id: string
  name: string
  campaignId: string
  isManager: boolean
  active: boolean
}

/** Une agentes y perfiles. Sin perfil = agente activo (igual que getProfile de lib/groups). */
export function buildChatUsers(agents: Agent[], profiles: UserProfile[]): ChatUser[] {
  return agents.map((a) => {
    const p = profiles.find((x) => x.agentId === a.id)
    return {
      id: a.id,
      name: a.name,
      campaignId: a.campaignId,
      isManager: p ? p.role !== 'agent' : false,
      active: p ? p.active : true,
    }
  })
}

/** Ids de los miembros activos de una conversación */
export function getMemberIds(conv: Conversation, users: ChatUser[]): string[] {
  const active = users.filter((u) => u.active)
  if (conv.kind !== 'channel') return active.filter((u) => conv.memberIds.includes(u.id)).map((u) => u.id)
  switch (conv.scope) {
    case 'managers':
      return active.filter((u) => u.isManager).map((u) => u.id)
    case 'campaign':
      return active.filter((u) => u.isManager || u.campaignId === conv.campaignId).map((u) => u.id)
    default:
      return active.map((u) => u.id)
  }
}

export const isMember = (conv: Conversation, userId: string, users: ChatUser[]): boolean =>
  getMemberIds(conv, users).includes(userId)

export function canPost(conv: Conversation, userId: string, users: ChatUser[]): boolean {
  if (!isMember(conv, userId, users)) return false
  return !conv.announcementOnly || users.some((u) => u.id === userId && u.isManager)
}

/** Mensajes de otros, no eliminados, posteriores a la última lectura del usuario */
export function countUnread(convId: string, userId: string, messages: ChatMessage[], read: ChatReadMap): number {
  const last = read[convId]?.[userId] ?? ''
  return messages.filter(
    (m) => m.conversationId === convId && m.authorId !== userId && !m.deletedAt && m.createdAt > last,
  ).length
}

export function unreadTotal(
  userId: string,
  conversations: Conversation[],
  messages: ChatMessage[],
  read: ChatReadMap,
  users: ChatUser[],
): number {
  return conversations
    .filter((c) => isMember(c, userId, users))
    .reduce((sum, c) => sum + countUnread(c.id, userId, messages, read), 0)
}

/** Texto partido en trozos; los que son "@Nombre Completo" de un usuario traen mention */
export function splitMentions(text: string, names: string[]): Array<{ text: string; mention: string | null }> {
  const sorted = [...names].filter(Boolean).sort((a, b) => b.length - a.length)
  if (sorted.length === 0) return [{ text, mention: null }]
  const escaped = sorted.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const re = new RegExp(`@(${escaped.join('|')})`, 'g')
  const out: Array<{ text: string; mention: string | null }> = []
  let last = 0
  for (const m of text.matchAll(re)) {
    const idx = m.index ?? 0
    if (idx > last) out.push({ text: text.slice(last, idx), mention: null })
    out.push({ text: m[0], mention: m[1] })
    last = idx + m[0].length
  }
  if (last < text.length) out.push({ text: text.slice(last), mention: null })
  return out
}

/** Búsqueda sin distinguir mayúsculas ni acentos */
const fold = (s: string): string => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
export const matchesSearch = (text: string, query: string): boolean => fold(text).includes(fold(query.trim()))

/** Id determinista de un directo, para no duplicarlo */
export const directId = (a: string, b: string): string => `dm-${[a, b].sort().join('--')}`
