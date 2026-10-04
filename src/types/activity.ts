export type ActivityCategory =
  | 'attendance'
  | 'time_off'
  | 'users'
  | 'schedule'
  | 'calls'
  | 'supervision'
  | 'system'

export interface ActivityEvent {
  id: string
  /** ISO */
  at: string
  category: ActivityCategory
  /** Texto ya redactado en español, con los nombres tal como eran en ese momento */
  message: string
  agentId: string | null
}

export type ActivityDraft = Omit<ActivityEvent, 'id' | 'at'>
