export type ShiftStatus = 'scheduled' | 'cancelled'

export interface Shift {
  id: string
  agentId: string
  campaignId: string
  /** YYYY-MM-DD */
  date: string
  /** HH:mm (24 h). El turno no cruza la medianoche. */
  startTime: string
  endTime: string
  breakMinutes: number
  status: ShiftStatus
  note: string | null
}

export type ScheduleError =
  | 'not_found'
  | 'invalid'
  | 'overlap'
  | 'on_time_off'
  | 'inactive_user'

export type ScheduleResult = { ok: true } | { ok: false; reason: ScheduleError }
