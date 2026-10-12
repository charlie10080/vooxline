import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  ChatCreateResult,
  ChatError,
  ChatMessage,
  ChatReaction,
  ChatReadMap,
  ChatResult,
  Conversation,
} from '@/types/chat'
import { CHAT_REACTIONS } from '@/types/chat'
import { buildMockConversations, buildMockMessages, buildMockReadMap } from '@/data/chatMock'
import { MAX_MESSAGE_LENGTH, buildChatUsers, canPost, directId, isMember, unreadTotal } from '@/lib/chat'
import type { ChatUser } from '@/lib/chat'
import { useDirectoryStore } from '@/store/useDirectoryStore'
import { useWorkforceStore } from '@/store/useWorkforceStore'

/*
 * Chat interno (canales, directos y grupos).
 * shortcut: sin backend no hay tiempo real; los mensajes solo existen en este navegador (localStorage).
 * Con backend, este store se reemplaza por llamadas a la API + websocket, manteniendo las mismas acciones.
 */

interface ChatState {
  conversations: Conversation[]
  messages: ChatMessage[]
  lastReadAt: ChatReadMap

  sendMessage: (userId: string, conversationId: string, text: string, replyToId?: string | null) => ChatResult
  editMessage: (userId: string, messageId: string, text: string) => ChatResult
  /** Borrado lógico: el mensaje queda como "Mensaje eliminado" */
  deleteMessage: (userId: string, messageId: string) => ChatResult
  toggleReaction: (userId: string, messageId: string, emoji: ChatReaction) => ChatResult
  /** Solo supervisión */
  togglePin: (userId: string, messageId: string) => ChatResult
  markRead: (userId: string, conversationId: string) => ChatResult
  /** Abre (o crea) el directo entre dos usuarios */
  openDirect: (userId: string, otherId: string) => ChatCreateResult
  /** Solo supervisión */
  createGroup: (userId: string, name: string, memberIds: string[]) => ChatCreateResult
  /** Solo supervisión, solo canales */
  setAnnouncementOnly: (userId: string, conversationId: string, value: boolean) => ChatResult

  resetChatDemo: () => void
}

const users = (): ChatUser[] =>
  buildChatUsers(useWorkforceStore.getState().agents, useDirectoryStore.getState().profiles)

const fail = (reason: ChatError): { ok: false; reason: ChatError } => ({ ok: false, reason })

function checkText(text: string): ChatError | null {
  const t = text.trim()
  if (!t) return 'empty'
  if (t.length > MAX_MESSAGE_LENGTH) return 'too_long'
  return null
}

const seed = () => {
  const conversations = buildMockConversations()
  return { conversations, messages: buildMockMessages(), lastReadAt: buildMockReadMap(conversations) }
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => {
      /** Mensaje + su conversación, si el usuario puede leerla */
      const access = (userId: string, messageId: string) => {
        const message = get().messages.find((m) => m.id === messageId)
        if (!message) return fail('not_found')
        const conv = get().conversations.find((c) => c.id === message.conversationId)
        if (!conv) return fail('not_found')
        const list = users()
        if (!isMember(conv, userId, list)) return fail('not_member')
        return { ok: true as const, message, conv, list }
      }
      const patchMessage = (id: string, patch: Partial<ChatMessage>) =>
        set((s) => ({ messages: s.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)) }))
      const isManager = (list: ChatUser[], userId: string) => list.some((u) => u.id === userId && u.isManager && u.active)

      return {
        ...seed(),

        sendMessage: (userId, conversationId, text, replyToId = null) => {
          const conv = get().conversations.find((c) => c.id === conversationId)
          if (!conv) return fail('not_found')
          const list = users()
          if (!isMember(conv, userId, list)) return fail('not_member')
          if (!canPost(conv, userId, list)) return fail('announcement_only')
          const err = checkText(text)
          if (err) return fail(err)
          if (replyToId && !get().messages.some((m) => m.id === replyToId && m.conversationId === conversationId)) {
            return fail('invalid')
          }
          const now = new Date().toISOString()
          const message: ChatMessage = {
            id: crypto.randomUUID(), conversationId, authorId: userId, text: text.trim(), createdAt: now,
            editedAt: null, deletedAt: null, replyToId, reactions: {}, pinned: false,
          }
          set((s) => ({
            messages: [...s.messages, message],
            lastReadAt: { ...s.lastReadAt, [conversationId]: { ...s.lastReadAt[conversationId], [userId]: now } },
          }))
          return { ok: true }
        },

        editMessage: (userId, messageId, text) => {
          const a = access(userId, messageId)
          if (!a.ok) return a
          if (a.message.authorId !== userId || a.message.deletedAt) return fail('forbidden')
          const err = checkText(text)
          if (err) return fail(err)
          patchMessage(messageId, { text: text.trim(), editedAt: new Date().toISOString() })
          return { ok: true }
        },

        deleteMessage: (userId, messageId) => {
          const a = access(userId, messageId)
          if (!a.ok) return a
          if (a.message.authorId !== userId || a.message.deletedAt) return fail('forbidden')
          patchMessage(messageId, { text: '', deletedAt: new Date().toISOString(), reactions: {}, pinned: false })
          return { ok: true }
        },

        toggleReaction: (userId, messageId, emoji) => {
          if (!CHAT_REACTIONS.includes(emoji)) return fail('invalid')
          const a = access(userId, messageId)
          if (!a.ok) return a
          if (a.message.deletedAt) return fail('forbidden')
          const current = a.message.reactions[emoji] ?? []
          const next = current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId]
          patchMessage(messageId, { reactions: { ...a.message.reactions, [emoji]: next } })
          return { ok: true }
        },

        togglePin: (userId, messageId) => {
          const a = access(userId, messageId)
          if (!a.ok) return a
          if (!isManager(a.list, userId) || a.message.deletedAt) return fail('forbidden')
          patchMessage(messageId, { pinned: !a.message.pinned })
          return { ok: true }
        },

        markRead: (userId, conversationId) => {
          const conv = get().conversations.find((c) => c.id === conversationId)
          if (!conv) return fail('not_found')
          if (!isMember(conv, userId, users())) return fail('not_member')
          set((s) => ({
            lastReadAt: {
              ...s.lastReadAt,
              [conversationId]: { ...s.lastReadAt[conversationId], [userId]: new Date().toISOString() },
            },
          }))
          return { ok: true }
        },

        openDirect: (userId, otherId) => {
          if (userId === otherId) return fail('invalid')
          const list = users()
          const both = [userId, otherId].map((id) => list.find((u) => u.id === id))
          if (both.some((u) => !u)) return fail('not_found')
          if (both.some((u) => !u?.active)) return fail('forbidden')
          const id = directId(userId, otherId)
          if (!get().conversations.some((c) => c.id === id)) {
            const conv: Conversation = {
              id, kind: 'direct', name: '', description: '', scope: null, campaignId: null,
              memberIds: [userId, otherId], announcementOnly: false, createdBy: userId, createdAt: new Date().toISOString(),
            }
            set((s) => ({ conversations: [...s.conversations, conv] }))
          }
          return { ok: true, conversationId: id }
        },

        createGroup: (userId, name, memberIds) => {
          const list = users()
          if (!isManager(list, userId)) return fail('forbidden')
          const title = name.trim()
          if (!title || title.length > 60) return fail('invalid')
          const members = [...new Set([userId, ...memberIds])]
          if (members.some((id) => !list.some((u) => u.id === id && u.active))) return fail('not_found')
          if (members.length < 3) return fail('invalid')
          const conv: Conversation = {
            id: crypto.randomUUID(), kind: 'group', name: title, description: '', scope: null, campaignId: null,
            memberIds: members, announcementOnly: false, createdBy: userId, createdAt: new Date().toISOString(),
          }
          set((s) => ({ conversations: [...s.conversations, conv] }))
          return { ok: true, conversationId: conv.id }
        },

        setAnnouncementOnly: (userId, conversationId, value) => {
          const conv = get().conversations.find((c) => c.id === conversationId)
          if (!conv) return fail('not_found')
          const list = users()
          if (!isMember(conv, userId, list)) return fail('not_member')
          if (conv.kind !== 'channel' || !isManager(list, userId)) return fail('forbidden')
          set((s) => ({
            conversations: s.conversations.map((c) => (c.id === conversationId ? { ...c, announcementOnly: value } : c)),
          }))
          return { ok: true }
        },

        resetChatDemo: () => set(seed()),
      }
    },
    {
      name: 'vooxline-chat',
      version: 1,
      partialize: (s) => ({ conversations: s.conversations, messages: s.messages, lastReadAt: s.lastReadAt }),
    },
  ),
)

/** Total de mensajes sin leer del usuario (no reactivo; para lógica fuera de React) */
export function getUnreadTotal(userId: string): number {
  const { conversations, messages, lastReadAt } = useChatStore.getState()
  return unreadTotal(userId, conversations, messages, lastReadAt, users())
}

/** Total de mensajes sin leer del usuario, reactivo: para el badge del menú lateral */
export function useChatUnreadTotal(userId: string): number {
  const agents = useWorkforceStore((s) => s.agents)
  const profiles = useDirectoryStore((s) => s.profiles)
  return useChatStore((s) =>
    unreadTotal(userId, s.conversations, s.messages, s.lastReadAt, buildChatUsers(agents, profiles)),
  )
}
