export type BadgeType =
  | 'best_service'
  | 'teamwork'
  | 'punctuality'
  | 'first_call_resolution'
  | 'qa_quality'
  | 'helping_peers'

export type ReactionKind = 'applause' | 'heart' | 'fire'

export interface RecognitionComment {
  id: string
  authorId: string
  text: string
  /** ISO */
  createdAt: string
}

export interface Recognition {
  id: string
  fromId: string
  toId: string
  badge: BadgeType
  message: string
  /** Puntos que otorgó (se fijan al crearla: cambiar el rol después no los altera) */
  points: number
  /** ISO */
  createdAt: string
  /** Ids de quienes reaccionaron, por tipo */
  reactions: Record<ReactionKind, string[]>
  comments: RecognitionComment[]
}

export interface Reward {
  id: string
  name: string
  description: string
  /** Costo en puntos */
  cost: number
  stock: number
  active: boolean
}

export type RedemptionStatus = 'pending' | 'approved' | 'delivered' | 'rejected'

export interface Redemption {
  id: string
  agentId: string
  rewardId: string
  /** Copia del nombre y costo al momento del canje */
  rewardName: string
  cost: number
  status: RedemptionStatus
  /** ISO */
  requestedAt: string
  resolvedAt: string | null
}

/** Cumpleaños o aniversario laboral próximo */
export interface CelebrationEvent {
  kind: 'birthday' | 'anniversary'
  agentId: string
  /** YYYY-MM-DD */
  date: string
  daysUntil: number
  /** Solo aniversarios: años que cumple */
  years: number | null
}

/** Hito automático del feed (derivado, no se guarda) */
export interface Milestone {
  id: string
  kind: 'anniversary' | 'qa'
  agentId: string
  /** YYYY-MM-DD */
  date: string
  years: number | null
  qaScore: number | null
}

export type CelebrationsError =
  | 'not_found'
  | 'invalid'
  | 'self_recognition'
  | 'forbidden'
  | 'inactive_user'
  | 'insufficient_points'
  | 'out_of_stock'
  | 'reward_inactive'
  | 'already_processed'

export type CelebrationsResult = { ok: true } | { ok: false; reason: CelebrationsError }
