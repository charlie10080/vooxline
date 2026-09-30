import type { SmartGroup, UserProfile } from '@/types/directory'

export const mockProfiles: UserProfile[] = [
  { agentId: 'a-maria', email: 'maria.lopez@vooxline.com', role: 'agent', active: true, hireDate: '2025-03-10' },
  { agentId: 'a-carlos', email: 'carlos.mendoza@vooxline.com', role: 'supervisor', active: true, hireDate: '2024-11-04' },
  { agentId: 'a-valeria', email: 'valeria.rios@vooxline.com', role: 'supervisor', active: true, hireDate: '2024-06-17' },
  { agentId: 'a-alejandro-t', email: 'alejandro.torres@vooxline.com', role: 'agent', active: true, hireDate: '2025-08-01' },
  { agentId: 'a-sofia', email: 'sofia.navarro@vooxline.com', role: 'agent', active: true, hireDate: '2026-01-12' },
  { agentId: 'a-alejandro-m', email: 'alejandro.moreno@vooxline.com', role: 'agent', active: true, hireDate: '2025-05-26' },
  { agentId: 'a-david', email: 'david.morales@vooxline.com', role: 'agent', active: true, hireDate: '2025-09-15' },
]

export const mockGroups: SmartGroup[] = [
  {
    id: 'g-bilingual', name: 'Bilingües', description: 'Agentes con nivel bilingüe',
    kind: 'smart', match: 'all', memberIds: [],
    rules: [{ id: 'r-1', field: 'level', operator: 'contains', value: 'bilingüe' }],
  },
  {
    id: 'g-national', name: 'Equipo National Assemblers', description: 'Todos los agentes de la campaña',
    kind: 'smart', match: 'all', memberIds: [],
    rules: [{ id: 'r-2', field: 'campaign', operator: 'is', value: 'c-national' }],
  },
  {
    id: 'g-oncall', name: 'En llamada ahora', description: 'Se actualiza solo según el estado en vivo',
    kind: 'smart', match: 'all', memberIds: [],
    rules: [{ id: 'r-3', field: 'status', operator: 'is', value: 'on_call' }],
  },
  {
    id: 'g-supervisors', name: 'Supervisión', description: 'Usuarios con rol de supervisor activos',
    kind: 'smart', match: 'all', memberIds: [],
    rules: [
      { id: 'r-4', field: 'role', operator: 'is', value: 'supervisor' },
      { id: 'r-5', field: 'active', operator: 'is', value: 'true' },
    ],
  },
  {
    id: 'g-qa', name: 'Comité de calidad', description: 'Lista fija armada a mano',
    kind: 'manual', match: 'all', rules: [], memberIds: ['a-carlos', 'a-valeria'],
  },
]
