import type { Agent, Campaign, TimeEntry, TimeOffRequest } from '@/types'

/** Fecha/hora local relativa a hoy, en ISO */
const at = (hour: number, minute: number, daysAgo = 0): string => {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}
const hoursAgo = (h: number): string => new Date(Date.now() - h * 3_600_000).toISOString()

export const mockCampaigns: Campaign[] = [
  { id: 'c-national', name: 'National Assemblers Inc', billRate: 5.63, costRate: 1.78, baselineHours: 1087 },
  { id: 'c-fidelis', name: 'Fidelis Manager', billRate: 5.5, costRate: 1.58, baselineHours: 640 },
  { id: 'c-vog', name: 'VOG Firma Legal', billRate: 5.5, costRate: 1.95, baselineHours: 412 },
  { id: 'c-fintech', name: 'FinTech Enterprise Support', billRate: 5.85, costRate: 1.47, baselineHours: 328 },
]

export const mockAgents: Agent[] = [
  { id: 'a-maria', employeeCode: 'VX-9921', name: 'María López', level: 'Nivel 2 Bilingüe', campaignId: 'c-national', sipExtension: 'SIP-104', sipTrunk: 'Trunk-01', latencyMs: 18, status: 'on_call', isVip: true, statusSince: hoursAgo(0.07), qaScore: 98, qaLabel: 'Óptimo', shiftMinutes: 480, ptoBalanceHours: 80 },
  { id: 'a-carlos', employeeCode: 'VX-6620', name: 'Carlos Mendoza', level: 'Senior QA', campaignId: 'c-fidelis', sipExtension: 'SIP-112', sipTrunk: 'Trunk-02', latencyMs: 22, status: 'available', isVip: false, statusSince: hoursAgo(0.75), qaScore: null, qaLabel: null, shiftMinutes: 480, ptoBalanceHours: 64 },
  { id: 'a-valeria', employeeCode: 'VX-8812', name: 'Valeria Ríos', level: 'Team Lead', campaignId: 'c-vog', sipExtension: 'SIP-108', sipTrunk: 'Trunk-01', latencyMs: 15, status: 'on_call', isVip: false, statusSince: hoursAgo(0.2), qaScore: 95, qaLabel: 'Audio claro', shiftMinutes: 480, ptoBalanceHours: 72 },
  { id: 'a-alejandro-t', employeeCode: 'VX-4109', name: 'Alejandro Torres', level: 'Soporte', campaignId: 'c-fintech', sipExtension: 'SIP-115', sipTrunk: 'Trunk-03', latencyMs: 19, status: 'break', isVip: false, statusSince: hoursAgo(0.1), qaScore: null, qaLabel: null, shiftMinutes: 240, ptoBalanceHours: 40 },
  { id: 'a-sofia', employeeCode: 'VX-7734', name: 'Sofía Navarro', level: 'Nivel 1', campaignId: 'c-national', sipExtension: 'SIP-120', sipTrunk: 'Trunk-02', latencyMs: 21, status: 'offline', isVip: false, statusSince: hoursAgo(1), qaScore: null, qaLabel: null, shiftMinutes: 480, ptoBalanceHours: 56 },
  { id: 'a-alejandro-m', employeeCode: 'VX-5307', name: 'Alejandro Moreno', level: 'Nivel 2', campaignId: 'c-fidelis', sipExtension: 'SIP-118', sipTrunk: 'Trunk-02', latencyMs: 20, status: 'offline', isVip: false, statusSince: hoursAgo(14), qaScore: null, qaLabel: null, shiftMinutes: 480, ptoBalanceHours: 48 },
  { id: 'a-david', employeeCode: 'VX-2288', name: 'David Morales', level: 'Especialista clínico', campaignId: 'c-national', sipExtension: 'SIP-121', sipTrunk: 'Trunk-01', latencyMs: 17, status: 'offline', isVip: false, statusSince: hoursAgo(14), qaScore: null, qaLabel: null, shiftMinutes: 480, ptoBalanceHours: 32 },
]

export const mockTimeEntries: TimeEntry[] = [
  { id: 'e-1', agentId: 'a-maria', campaignId: 'c-national', clockIn: at(8, 2, 1), clockOut: at(17, 14, 1), breakMinutes: 60, scheduledMinutes: 480, status: 'pending', note: null },
  { id: 'e-2', agentId: 'a-carlos', campaignId: 'c-fidelis', clockIn: at(9, 0), clockOut: null, breakMinutes: 0, scheduledMinutes: 480, status: 'pending', note: 'Revisión requerida' },
  { id: 'e-3', agentId: 'a-valeria', campaignId: 'c-vog', clockIn: at(7, 58, 1), clockOut: at(16, 2, 1), breakMinutes: 0, scheduledMinutes: 480, status: 'approved', note: null },
  { id: 'e-4', agentId: 'a-alejandro-t', campaignId: 'c-fintech', clockIn: at(10, 0, 1), clockOut: at(14, 4, 1), breakMinutes: 0, scheduledMinutes: 240, status: 'approved', note: null },
  { id: 'e-5', agentId: 'a-sofia', campaignId: 'c-national', clockIn: at(8, 0, 1), clockOut: at(17, 0, 1), breakMinutes: 0, scheduledMinutes: 480, status: 'pending', note: 'Excede el turno programado' },
]

export const mockTimeOffRequests: TimeOffRequest[] = [
  { id: 't-1', agentId: 'a-alejandro-m', type: 'vacation', startDate: '2026-10-04', endDate: '2026-10-07', hours: 24, reason: 'Viaje familiar programado anual. Horas cubiertas previamente con soporte extendido.', attachmentName: null, status: 'pending', requestedAt: hoursAgo(3) },
  { id: 't-2', agentId: 'a-david', type: 'medical', startDate: '2026-09-28', endDate: '2026-09-28', hours: 4, reason: 'Cita con especialista clínico IMSS. Adjunto comprobante médico y citatorio formal.', attachmentName: 'Constancia_IMSS_Sep28.pdf', status: 'pending', requestedAt: hoursAgo(1) },
]
