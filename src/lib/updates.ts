import type { Agent } from '@/types'
import type { SmartGroup, UserProfile } from '@/types/directory'
import type { Update, UpdateAudience, UpdateCategory, UpdateState } from '@/types/updates'
import { getGroupMembers, getProfile } from '@/lib/groups'

export const CATEGORY_LABELS: Record<UpdateCategory, string> = {
  operation: 'Operación',
  campaign: 'Campaña',
  hr: 'RR.HH.',
  urgent: 'Urgente',
}

/** Tono del Badge del kit de UI */
export const CATEGORY_TONE = { operation: 'info', campaign: 'accent', hr: 'success', urgent: 'danger' } as const

export const STATE_LABEL: Record<UpdateState, { label: string; tone: 'success' | 'warning' | 'neutral' | 'info' }> = {
  live: { label: 'Publicado', tone: 'success' },
  scheduled: { label: 'Programado', tone: 'info' },
  draft: { label: 'Borrador', tone: 'warning' },
  expired: { label: 'Vencido', tone: 'neutral' },
  archived: { label: 'Archivado', tone: 'neutral' },
}

export interface AudienceContext {
  agents: Agent[]
  profiles: UserProfile[]
  groups: SmartGroup[]
}

/** Ids de los usuarios activos a los que va dirigido el aviso (sin el autor). Los grupos smart se recalculan cada vez. */
export function resolveAudience(audience: UpdateAudience, authorId: string, ctx: AudienceContext): string[] {
  let targets: Agent[]
  if (audience.kind === 'everyone') targets = ctx.agents
  else if (audience.kind === 'campaigns') targets = ctx.agents.filter((a) => audience.campaignIds.includes(a.campaignId))
  else {
    const group = ctx.groups.find((g) => g.id === audience.groupId)
    targets = group ? getGroupMembers(group, ctx.agents, ctx.profiles) : []
  }
  return targets.filter((a) => a.id !== authorId && getProfile(ctx.profiles, a.id).active).map((a) => a.id)
}

export function getUpdateState(u: Update, now: number): UpdateState {
  if (u.status === 'draft' || u.status === 'archived') return u.status
  if (u.publishAt && Date.parse(u.publishAt) > now) return 'scheduled'
  if (u.expiresAt && Date.parse(u.expiresAt) <= now) return 'expired'
  return 'live'
}

/** Fecha que se muestra como "publicado": la programada o, si no hay, la de creación */
export const publishedAt = (u: Update): string => u.publishAt ?? u.createdAt

/** Feed de un usuario: solo avisos vigentes dirigidos a él. Fijados primero, luego los más recientes. */
export function feedFor(updates: Update[], userId: string, ctx: AudienceContext, now: number): Update[] {
  return updates
    .filter((u) => getUpdateState(u, now) === 'live' && resolveAudience(u.audience, u.authorId, ctx).includes(userId))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || publishedAt(b).localeCompare(publishedAt(a)))
}

export interface Attention {
  unread: number
  pendingConfirmation: number
  /** Avisos que requieren algo del usuario (sin leer o sin confirmar), sin contar dos veces */
  total: number
}

/** Para el badge del menú lateral */
export function countAttention(updates: Update[], userId: string, ctx: AudienceContext, now: number): Attention {
  let unread = 0
  let pendingConfirmation = 0
  let total = 0
  for (const u of feedFor(updates, userId, ctx, now)) {
    const isUnread = !u.reads[userId]
    const isPending = u.requiresConfirmation && !u.confirmations[userId]
    if (isUnread) unread += 1
    if (isPending) pendingConfirmation += 1
    if (isUnread || isPending) total += 1
  }
  return { unread, pendingConfirmation, total }
}

export interface UpdateStats {
  audience: string[]
  read: string[]
  confirmed: string[]
  /** Sin leer, o sin confirmar si el aviso lo requiere */
  pending: string[]
  /** 0-100: confirmaciones si se requieren, lecturas si no */
  percent: number
}

export function getUpdateStats(u: Update, ctx: AudienceContext): UpdateStats {
  const audience = resolveAudience(u.audience, u.authorId, ctx)
  const read = audience.filter((id) => u.reads[id])
  const confirmed = audience.filter((id) => u.confirmations[id])
  const done = u.requiresConfirmation ? confirmed : read
  const pending = audience.filter((id) => !done.includes(id))
  const percent = audience.length === 0 ? 0 : Math.round((done.length / audience.length) * 100)
  return { audience, read, confirmed, pending, percent }
}

/* ---------- Fechas ---------- */

/** ISO -> valor de <input type="datetime-local"> en hora local */
export function toLocalInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}

/** Valor de datetime-local (hora local) -> ISO, o null si está vacío */
export const fromLocalInput = (value: string): string | null => (value ? new Date(value).toISOString() : null)

export const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

/** "hace 5 min", "hace 3 h", "hace 2 d", o "en 4 h" si es futuro */
export function timeAgo(iso: string, now: number): string {
  const diff = now - Date.parse(iso)
  const mins = Math.round(Math.abs(diff) / 60_000)
  const label = mins < 60 ? `${Math.max(mins, 1)} min` : mins < 60 * 24 ? `${Math.round(mins / 60)} h` : `${Math.round(mins / 1440)} d`
  return diff >= 0 ? `hace ${label}` : `en ${label}`
}

/* ---------- Texto del aviso (sin HTML: se arma con elementos de React) ---------- */

export type Inline = { text: string; bold: boolean }
export type BodyBlock = { kind: 'paragraph'; lines: Inline[][] } | { kind: 'list'; items: Inline[][] }

/** "hola **mundo**" -> [{hola, false}, {mundo, true}]. Un ** sin cerrar se deja como texto. */
export function parseInline(text: string): Inline[] {
  const parts = text.split('**')
  if (parts.length % 2 === 0) return [{ text, bold: false }]
  return parts.map((t, i) => ({ text: t, bold: i % 2 === 1 })).filter((p) => p.text !== '')
}

const LIST_ITEM = /^\s*[-*•]\s+/

export function parseBody(body: string): BodyBlock[] {
  const blocks: BodyBlock[] = []
  for (const line of body.replace(/\r\n/g, '\n').split('\n')) {
    const last = blocks[blocks.length - 1]
    if (line.trim() === '') {
      blocks.push({ kind: 'paragraph', lines: [] }) // separador; los vacíos se quitan al final
    } else if (LIST_ITEM.test(line)) {
      const item = parseInline(line.replace(LIST_ITEM, ''))
      if (last?.kind === 'list') last.items.push(item)
      else blocks.push({ kind: 'list', items: [item] })
    } else if (last?.kind === 'paragraph') {
      last.lines.push(parseInline(line.trim()))
    } else {
      blocks.push({ kind: 'paragraph', lines: [parseInline(line.trim())] })
    }
  }
  return blocks.filter((b) => (b.kind === 'list' ? b.items.length > 0 : b.lines.length > 0))
}
