import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Agent, AgentStatus } from '@/types';
import type { UserRole } from '@/types/directory';
import { useWorkforceStore } from '@/store/useWorkforceStore';
import { useDirectoryStore } from '@/store/useDirectoryStore';
import { useScheduleStore } from '@/store/useScheduleStore';
import { getProfile, getGroupMembers } from '@/lib/groups';
import { todayStr } from '@/lib/schedule';
import { getTenure, formatTenure } from '@/lib/tenure';
import {
  BookOpen,
  Search,
  Building2,
  Shield,
  Phone,
  Mail,
  Calendar,
  Clock,
  ExternalLink,
  Coffee,
  Layers,
  UserX,
  ChevronRight,
  Filter,
  Sparkles,
} from 'lucide-react';
import { PageHeader, Card, Button, Badge, Avatar, EmptyState, Modal, Tabs } from '@/components/ui';

export const DirectorPage: React.FC = () => {
  const navigate = useNavigate();

  // Stores (Solo Lectura)
  const { agents, campaigns } = useWorkforceStore();
  const { profiles, groups } = useDirectoryStore();
  const { shifts } = useScheduleStore();

  // Estados de vista y filtros
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showInactive, setShowInactive] = useState(false);
  const [groupByCampaign, setGroupByCampaign] = useState(false);

  // Persona seleccionada para panel/modal de detalle
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  const today = todayStr();
  const campaignMap = useMemo(() => new Map(campaigns.map((c) => [c.id, c])), [campaigns]);

  // Lista filtrada de personas
  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      const profile = getProfile(profiles, agent.id);

      // 1. Filtro activo / inactivo (por defecto solo activos)
      if (!showInactive && !profile.active) {
        return false;
      }

      // 2. Filtro por campaña
      if (selectedCampaignId !== 'all' && agent.campaignId !== selectedCampaignId) {
        return false;
      }

      // 3. Filtro por rol
      if (selectedRole !== 'all' && profile.role !== selectedRole) {
        return false;
      }

      // 4. Filtro por estado en vivo
      if (selectedStatus !== 'all' && agent.status !== selectedStatus) {
        return false;
      }

      // 5. Buscador (nombre, correo, código, extensión SIP)
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchName = agent.name.toLowerCase().includes(q);
        const matchCode = agent.employeeCode.toLowerCase().includes(q);
        const matchEmail = (profile.email || '').toLowerCase().includes(q);
        const matchExt = (agent.sipExtension || '').toLowerCase().includes(q);

        if (!matchName && !matchCode && !matchEmail && !matchExt) {
          return false;
        }
      }

      return true;
    });
  }, [agents, profiles, showInactive, selectedCampaignId, selectedRole, selectedStatus, searchQuery]);

  // Agrupamiento por campaña (si está habilitado)
  const groupedAgents = useMemo(() => {
    if (!groupByCampaign) return null;

    const groupsList: {
      campaignId: string;
      campaignName: string;
      agents: Agent[];
    }[] = [];

    // Por cada campaña conocida
    campaigns.forEach((camp) => {
      const campaignAgents = filteredAgents.filter((a) => a.campaignId === camp.id);
      if (campaignAgents.length > 0) {
        groupsList.push({
          campaignId: camp.id,
          campaignName: camp.name,
          agents: campaignAgents,
        });
      }
    });

    // Agentes sin campaña o con id no mapeado
    const otherAgents = filteredAgents.filter(
      (a) => !campaigns.some((camp) => camp.id === a.campaignId)
    );
    if (otherAgents.length > 0) {
      groupsList.push({
        campaignId: 'unassigned',
        campaignName: 'Sin Campaña Asignada',
        agents: otherAgents,
      });
    }

    return groupsList;
  }, [groupByCampaign, filteredAgents, campaigns]);

  // Persona activa para el modal
  const selectedAgent = useMemo(() => {
    if (!selectedAgentId) return null;
    return agents.find((a) => a.id === selectedAgentId) ?? null;
  }, [selectedAgentId, agents]);

  const selectedProfile = useMemo(() => {
    if (!selectedAgent) return null;
    return getProfile(profiles, selectedAgent.id);
  }, [selectedAgent, profiles]);

  // Turno de HOY de la persona seleccionada
  const selectedTodayShift = useMemo(() => {
    if (!selectedAgent) return null;
    return (
      shifts.find(
        (s) =>
          s.agentId === selectedAgent.id &&
          s.date === today &&
          s.status === 'scheduled'
      ) ?? null
    );
  }, [selectedAgent, shifts, today]);

  // Grupos a los que pertenece la persona seleccionada
  const selectedAgentGroups = useMemo(() => {
    if (!selectedAgent) return [];
    return groups.filter((g) => {
      const members = getGroupMembers(g, agents, profiles);
      return members.some((m) => m.id === selectedAgent.id);
    });
  }, [selectedAgent, groups, agents, profiles]);

  // Antigüedad formateada de la persona seleccionada
  const selectedTenureFormatted = useMemo(() => {
    if (!selectedProfile?.hireDate) return '—';
    const tenure = getTenure(selectedProfile.hireDate, today);
    return formatTenure(tenure);
  }, [selectedProfile, today]);

  // Helpers de renderizado
  const renderStatusBadge = (status: AgentStatus) => {
    switch (status) {
      case 'on_call':
        return (
          <Badge tone="accent">
            <span className="w-1.5 h-1.5 rounded-full bg-[#66FCF1] animate-pulse" />
            En llamada
          </Badge>
        );
      case 'available':
        return (
          <Badge tone="success">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
            Disponible
          </Badge>
        );
      case 'break':
        return (
          <Badge tone="warning">
            <Coffee className="w-3 h-3" />
            En pausa
          </Badge>
        );
      case 'offline':
        return (
          <Badge tone="neutral">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C5C6C7]/40" />
            Desconectado
          </Badge>
        );
    }
  };

  const renderRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <Badge tone="danger">ADMIN</Badge>;
      case 'supervisor':
        return <Badge tone="warning">SUPERVISOR</Badge>;
      case 'agent':
        return <Badge tone="accent">AGENTE</Badge>;
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCampaignId('all');
    setSelectedRole('all');
    setSelectedStatus('all');
    setShowInactive(false);
  };

  // Renderizado individual de una tarjeta de persona
  const renderPersonCard = (agent: Agent) => {
    const profile = getProfile(profiles, agent.id);
    const campaign = campaignMap.get(agent.campaignId);
    const tenure = profile.hireDate ? getTenure(profile.hireDate, today) : null;
    const tenureStr = formatTenure(tenure);

    return (
      <div
        key={agent.id}
        role="button"
        tabIndex={0}
        aria-label={`Ver ficha de ${agent.name}`}
        onClick={() => setSelectedAgentId(agent.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setSelectedAgentId(agent.id);
          }
        }}
        className={`group bg-[#13151c] border rounded-2xl p-5 shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between hover:border-[#66FCF1]/50 hover:shadow-[0_0_20px_rgba(102,252,241,0.12)] relative ${
          !profile.active ? 'border-[#EF4444]/30 bg-[#13151c]/80' : 'border-[#242E3B]'
        }`}
      >
        <div className="space-y-4">
          {/* Fila superior: Avatar, Nombre, Código y Estado */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar name={agent.name} />
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-[#66FCF1] transition-colors leading-tight">
                  {agent.name}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-[11px] font-mono text-[#C5C6C7]/60">
                    {agent.employeeCode}
                  </span>
                  {renderRoleBadge(profile.role)}
                  {!profile.active && <Badge tone="danger">Inactivo</Badge>}
                </div>
              </div>
            </div>

            {/* Badge de estado en vivo */}
            <div className="shrink-0">{renderStatusBadge(agent.status)}</div>
          </div>

          {/* Información operativa y contacto */}
          <div className="space-y-2 pt-2 border-t border-[#242E3B]/60 text-xs">
            {/* Campaña y Nivel */}
            <div className="flex items-center justify-between text-white/90">
              <div className="flex items-center gap-1.5 min-w-0">
                <Building2 className="w-3.5 h-3.5 text-[#66FCF1] shrink-0" />
                <span className="truncate font-medium">{campaign?.name ?? 'Sin Campaña'}</span>
              </div>
              <span className="text-[11px] text-[#C5C6C7]/60 font-mono shrink-0 pl-2">
                {agent.level}
              </span>
            </div>

            {/* Correo */}
            <div className="flex items-center gap-1.5 text-[#C5C6C7]/80">
              <Mail className="w-3.5 h-3.5 text-[#C5C6C7]/40 shrink-0" />
              <span className="truncate font-mono text-[11px]">
                {profile.email || <span className="text-[#C5C6C7]/40">—</span>}
              </span>
            </div>

            {/* Extensión SIP */}
            <div className="flex items-center justify-between text-[#C5C6C7]/80">
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#C5C6C7]/40 shrink-0" />
                <span className="font-mono text-[11px]">
                  Extensión: <strong className="text-white">{agent.sipExtension}</strong>
                </span>
              </div>
              <span className="text-[10px] text-[#C5C6C7]/50 font-mono">
                {agent.sipTrunk}
              </span>
            </div>
          </div>
        </div>

        {/* Fila inferior: Antigüedad y acción */}
        <div className="mt-4 pt-3 border-t border-[#242E3B]/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-[#C5C6C7]/70 font-mono text-[11px]">
            <Calendar className="w-3.5 h-3.5 text-[#66FCF1]/70" />
            <span>Antigüedad:</span>
            <strong className="text-white">{tenureStr}</strong>
          </div>

          <span className="text-[11px] font-semibold text-[#66FCF1] flex items-center gap-0.5 opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
            <span>Ficha</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Encabezado */}
      <PageHeader
        icon={BookOpen}
        eyebrow="COMUNICACIÓN"
        title="Directorio de personal"
        description="Consulta a tu equipo: datos de contacto, campaña, extensión y estado operativo en tiempo real."
        actions={
          <>
            {/* Contador de personas */}
            <div className="px-3.5 py-2 rounded-xl bg-[#0B0C10] border border-[#242E3B] text-xs font-mono text-[#C5C6C7]">
              Mostrando{' '}
              <strong className="text-[#66FCF1] font-bold">{filteredAgents.length}</strong> de{' '}
              <strong className="text-white">{agents.length}</strong> personas
            </div>

            {/* Toggle Tarjetas / Tabla */}
            <Tabs
              value={viewMode}
              onChange={setViewMode}
              options={[
                { value: 'cards', label: 'Tarjetas' },
                { value: 'table', label: 'Tabla' },
              ]}
            />
          </>
        }
      />

      {/* 2. Barra de Filtros y Búsqueda */}
      <div className="bg-[#13151c] border border-[#242E3B] rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Buscador */}
        <div className="relative flex-1 md:max-w-md">
          <Search className="w-3.5 h-3.5 text-[#C5C6C7]/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            aria-label="Buscar personas"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, correo, código o extensión..."
            className="w-full bg-[#0B0C10] border border-[#242E3B] text-xs text-white rounded-xl pl-9 pr-3 py-2 placeholder:text-[#C5C6C7]/40 focus:outline-none focus:border-[#66FCF1]"
          />
        </div>

        {/* Selects de Filtrado y Opciones */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Campaña */}
          <div className="relative">
            <select
              value={selectedCampaignId}
              aria-label="Filtrar por campaña"
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              className="bg-[#0B0C10] border border-[#242E3B] text-xs text-[#C5C6C7] rounded-xl px-3 py-2 pr-8 focus:outline-none focus:border-[#66FCF1] appearance-none"
            >
              <option value="all">Todas las campañas</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <Building2 className="w-3.5 h-3.5 text-[#C5C6C7]/40 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Rol */}
          <div className="relative">
            <select
              value={selectedRole}
              aria-label="Filtrar por rol"
              onChange={(e) => setSelectedRole(e.target.value)}
              className="bg-[#0B0C10] border border-[#242E3B] text-xs text-[#C5C6C7] rounded-xl px-3 py-2 pr-8 focus:outline-none focus:border-[#66FCF1] appearance-none"
            >
              <option value="all">Todos los roles</option>
              <option value="agent">Agente</option>
              <option value="supervisor">Supervisor</option>
              <option value="admin">Administrador</option>
            </select>
            <Shield className="w-3.5 h-3.5 text-[#C5C6C7]/40 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Estado en vivo */}
          <div className="relative">
            <select
              value={selectedStatus}
              aria-label="Filtrar por estado"
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-[#0B0C10] border border-[#242E3B] text-xs text-[#C5C6C7] rounded-xl px-3 py-2 pr-8 focus:outline-none focus:border-[#66FCF1] appearance-none"
            >
              <option value="all">Todos los estados</option>
              <option value="on_call">En llamada</option>
              <option value="available">Disponible</option>
              <option value="break">En pausa</option>
              <option value="offline">Desconectado</option>
            </select>
            <Filter className="w-3.5 h-3.5 text-[#C5C6C7]/40 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Toggle: Mostrar Inactivos */}
          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0B0C10] border border-[#242E3B] text-xs text-[#C5C6C7] cursor-pointer hover:border-[#66FCF1]/40 transition-colors select-none">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="w-3.5 h-3.5 rounded bg-[#13151c] border-[#242E3B] text-[#66FCF1] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#66FCF1]"
            />
            <span>Mostrar inactivos</span>
          </label>

          {/* Toggle: Agrupar por Campaña */}
          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0B0C10] border border-[#242E3B] text-xs text-[#C5C6C7] cursor-pointer hover:border-[#66FCF1]/40 transition-colors select-none">
            <input
              type="checkbox"
              checked={groupByCampaign}
              onChange={(e) => setGroupByCampaign(e.target.checked)}
              className="w-3.5 h-3.5 rounded bg-[#13151c] border-[#242E3B] text-[#66FCF1] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#66FCF1]"
            />
            <span>Agrupar por campaña</span>
          </label>
        </div>
      </div>

      {/* 3. Contenido Principal: Tarjetas o Tabla */}
      {filteredAgents.length === 0 ? (
        /* Estado vacío */
        <Card>
          <EmptyState
            icon={UserX}
            title="No se encontraron personas"
            description="Ninguna persona coincide con los filtros seleccionados. Prueba otros términos o restablece los filtros."
            action={
              <Button variant="primary" onClick={resetFilters}>
                Restablecer filtros
              </Button>
            }
          />
        </Card>
      ) : groupByCampaign && groupedAgents ? (
        /* Vista Agrupada por Campaña */
        <div className="space-y-8">
          {groupedAgents.map((group) => (
            <div key={group.campaignId} className="space-y-3">
              {/* Encabezado del Grupo de Campaña */}
              <div className="flex items-center justify-between pb-2 border-b border-[#242E3B]">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#66FCF1]" />
                  <h2 className="text-base font-bold text-white tracking-wide">
                    {group.campaignName}
                  </h2>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-[#1F2833] text-[#66FCF1] border border-[#242E3B]">
                    {group.agents.length} {group.agents.length === 1 ? 'persona' : 'personas'}
                  </span>
                </div>
              </div>

              {/* Contenido del Grupo: Tarjetas o Subtabla */}
              {viewMode === 'cards' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.agents.map(renderPersonCard)}
                </div>
              ) : (
                <div className="bg-[#13151c] border border-[#242E3B] rounded-2xl shadow-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[#242E3B] bg-[#0B0C10]/60 text-[11px] font-mono text-[#C5C6C7]/60 uppercase tracking-wider">
                          <th className="py-3 px-4">Persona</th>
                          <th className="py-3 px-4">Código</th>
                          <th className="py-3 px-4">Rol & Nivel</th>
                          <th className="py-3 px-4">Contacto</th>
                          <th className="py-3 px-4">Extensión SIP</th>
                          <th className="py-3 px-4">Estado en Vivo</th>
                          <th className="py-3 px-4">Antigüedad</th>
                          <th className="py-3 px-4 text-right">Ficha</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#242E3B]/60">
                        {group.agents.map((agent) => {
                          const profile = getProfile(profiles, agent.id);
                          const tenure = profile.hireDate
                            ? getTenure(profile.hireDate, today)
                            : null;

                          return (
                            <tr
                              key={agent.id}
                              onClick={() => setSelectedAgentId(agent.id)}
                              className="hover:bg-[#1A202C]/50 transition-colors cursor-pointer group"
                            >
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <Avatar name={agent.name} size="sm" />
                                  <div>
                                    <span className="font-semibold text-white group-hover:text-[#66FCF1] transition-colors block whitespace-nowrap">
                                      {agent.name}
                                    </span>
                                    {!profile.active && (
                                      <span className="text-[10px] text-[#EF4444] font-mono">
                                        (Inactivo)
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>

                              <td className="py-3 px-4 font-mono text-[#C5C6C7]">
                                {agent.employeeCode}
                              </td>

                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  {renderRoleBadge(profile.role)}
                                  <span className="text-[#C5C6C7] font-mono text-[11px]">
                                    {agent.level}
                                  </span>
                                </div>
                              </td>

                              <td className="py-3 px-4 text-[#C5C6C7] font-mono text-[11px]">
                                {profile.email || <span className="text-[#C5C6C7]/40">—</span>}
                              </td>

                              <td className="py-3 px-4 font-mono">
                                <span className="text-white font-medium">
                                  {agent.sipExtension}
                                </span>
                              </td>

                              <td className="py-3 px-4">{renderStatusBadge(agent.status)}</td>

                              <td className="py-3 px-4 font-mono text-white/90">
                                {formatTenure(tenure)}
                              </td>

                              <td className="py-3 px-4 text-right">
                                <button
                                  type="button"
                                  aria-label={`Ver ficha de ${agent.name}`}
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#66FCF1] group-hover:underline"
                                >
                                  <span>Ver</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : viewMode === 'cards' ? (
        /* Vista de Tarjetas estándar */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAgents.map(renderPersonCard)}
        </div>
      ) : (
        /* Vista de Tabla estándar */
        <div className="bg-[#13151c] border border-[#242E3B] rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#242E3B] bg-[#0B0C10]/60 text-[11px] font-mono text-[#C5C6C7]/60 uppercase tracking-wider">
                  <th className="py-3 px-4">Persona</th>
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Campaña</th>
                  <th className="py-3 px-4">Rol & Nivel</th>
                  <th className="py-3 px-4">Correo</th>
                  <th className="py-3 px-4">Extensión SIP</th>
                  <th className="py-3 px-4">Estado en Vivo</th>
                  <th className="py-3 px-4">Antigüedad</th>
                  <th className="py-3 px-4 text-right">Ficha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#242E3B]/60">
                {filteredAgents.map((agent) => {
                  const profile = getProfile(profiles, agent.id);
                  const campaign = campaignMap.get(agent.campaignId);
                  const tenure = profile.hireDate ? getTenure(profile.hireDate, today) : null;

                  return (
                    <tr
                      key={agent.id}
                      onClick={() => setSelectedAgentId(agent.id)}
                      className="hover:bg-[#1A202C]/50 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={agent.name} size="sm" />
                          <div>
                            <span className="font-semibold text-white group-hover:text-[#66FCF1] transition-colors block whitespace-nowrap">
                              {agent.name}
                            </span>
                            {!profile.active && (
                              <span className="text-[10px] text-[#EF4444] font-mono">
                                (Inactivo)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-[#C5C6C7]">
                        {agent.employeeCode}
                      </td>

                      <td className="py-3 px-4 text-white/90">
                        {campaign?.name ?? 'Sin Campaña'}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {renderRoleBadge(profile.role)}
                          <span className="text-[#C5C6C7] font-mono text-[11px]">
                            {agent.level}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-[#C5C6C7] font-mono text-[11px]">
                        {profile.email || <span className="text-[#C5C6C7]/40">—</span>}
                      </td>

                      <td className="py-3 px-4 font-mono">
                        <span className="text-white font-medium">{agent.sipExtension}</span>
                      </td>

                      <td className="py-3 px-4">{renderStatusBadge(agent.status)}</td>

                      <td className="py-3 px-4 font-mono text-white/90">
                        {formatTenure(tenure)}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          aria-label={`Ver ficha de ${agent.name}`}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#66FCF1] group-hover:underline"
                        >
                          <span>Ver</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Modal / Panel Lateral de Detalle de Persona */}
      {selectedAgent && selectedProfile && (
        <Modal
          open
          onClose={() => setSelectedAgentId(null)}
          title={selectedAgent.name}
          description={`Ficha de ${selectedAgent.employeeCode}`}
          footer={
            <>
              <Button variant="ghost" onClick={() => setSelectedAgentId(null)}>
                Cerrar
              </Button>
              <Button
                variant="primary"
                icon={ExternalLink}
                onClick={() => {
                  setSelectedAgentId(null);
                  navigate('/users');
                }}
              >
                Editar en Usuarios
              </Button>
            </>
          }
        >
          <div className="space-y-6">
            {/* Cabecera de la ficha */}
            <div className="flex flex-wrap items-center gap-3.5">
              <Avatar name={selectedAgent.name} size="lg" />
              <div className="flex flex-wrap items-center gap-2">
                {selectedProfile.active ? (
                  <Badge tone="success">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                    Activo
                  </Badge>
                ) : (
                  <Badge tone="danger">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
                    Inactivo
                  </Badge>
                )}
                {renderRoleBadge(selectedProfile.role)}
                {renderStatusBadge(selectedAgent.status)}
              </div>
            </div>

            {/* Sección: Datos de Contacto y Operación */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Bloque Contacto */}
              <div className="bg-[#0B0C10] border border-[#242E3B] rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-1.5 text-[#66FCF1] font-mono font-semibold uppercase text-[11px] tracking-wider">
                  <Phone className="w-3.5 h-3.5" />
                  <span>Datos de Contacto</span>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] text-[#C5C6C7]/50 uppercase font-mono block">
                      Correo Corporativo
                    </span>
                    <span className="text-white font-mono break-all">
                      {selectedProfile.email || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#C5C6C7]/50 uppercase font-mono block">
                      Extensión SIP
                    </span>
                    <span className="text-white font-mono font-bold">
                      {selectedAgent.sipExtension}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#C5C6C7]/50 uppercase font-mono block">
                      Troncal / Latencia
                    </span>
                    <span className="text-[#C5C6C7] font-mono">
                      {selectedAgent.sipTrunk} • {selectedAgent.latencyMs} ms
                    </span>
                  </div>
                </div>
              </div>

              {/* Bloque Posición */}
              <div className="bg-[#0B0C10] border border-[#242E3B] rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-1.5 text-[#66FCF1] font-mono font-semibold uppercase text-[11px] tracking-wider">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Posición Operativa</span>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] text-[#C5C6C7]/50 uppercase font-mono block">
                      Campaña
                    </span>
                    <span className="text-white font-medium">
                      {campaignMap.get(selectedAgent.campaignId)?.name ?? 'Sin Campaña'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#C5C6C7]/50 uppercase font-mono block">
                      Nivel / Especialidad
                    </span>
                    <span className="text-[#C5C6C7] font-mono">
                      {selectedAgent.level}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#C5C6C7]/50 uppercase font-mono block">
                      Rol asignado
                    </span>
                    <span className="text-white">
                      {selectedProfile.role === 'admin'
                        ? 'Administrador'
                        : selectedProfile.role === 'supervisor'
                          ? 'Supervisor'
                          : 'Agente'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sección: Antigüedad y Trayectoria */}
            <div className="bg-[#0B0C10] border border-[#242E3B] rounded-xl p-4 space-y-3 text-xs">
              <div className="flex items-center gap-1.5 text-[#66FCF1] font-mono font-semibold uppercase text-[11px] tracking-wider">
                <Calendar className="w-3.5 h-3.5" />
                <span>Antigüedad y trayectoria</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-[#C5C6C7]/50 uppercase font-mono block">
                    Fecha de Ingreso
                  </span>
                  <span className="text-white font-mono">
                    {selectedProfile.hireDate || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#C5C6C7]/50 uppercase font-mono block">
                    Tiempo en la Empresa
                  </span>
                  <span className="text-[#66FCF1] font-mono font-bold">
                    {selectedTenureFormatted}
                  </span>
                </div>
              </div>
            </div>

            {/* Sección: Turno de HOY */}
            <div className="bg-[#0B0C10] border border-[#242E3B] rounded-xl p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[#66FCF1] font-mono font-semibold uppercase text-[11px] tracking-wider">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Turno de hoy ({today})</span>
                </div>
                {selectedTodayShift && (
                  <Badge tone="success">Programado</Badge>
                )}
              </div>

              {selectedTodayShift ? (
                <div className="space-y-1 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold font-mono text-white">
                      {selectedTodayShift.startTime} — {selectedTodayShift.endTime}
                    </span>
                    <span className="text-[#C5C6C7]/50 font-mono text-[11px]">
                      (Descanso: {selectedTodayShift.breakMinutes} min)
                    </span>
                  </div>
                  {selectedTodayShift.note && (
                    <p className="text-[11px] text-[#C5C6C7]/70 italic">
                      Nota: {selectedTodayShift.note}
                    </p>
                  )}
                </div>
              ) : (
                <div className="py-2 text-[#C5C6C7]/50 font-mono text-xs">
                  Sin turno programado hoy
                </div>
              )}
            </div>

            {/* Sección: Grupos a los que pertenece */}
            <div className="bg-[#0B0C10] border border-[#242E3B] rounded-xl p-4 space-y-3 text-xs">
              <div className="flex items-center gap-1.5 text-[#66FCF1] font-mono font-semibold uppercase text-[11px] tracking-wider">
                <Layers className="w-3.5 h-3.5" />
                <span>Grupos asignados ({selectedAgentGroups.length})</span>
              </div>

              {selectedAgentGroups.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedAgentGroups.map((group) => (
                    <div
                      key={group.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1F2833] text-white border border-[#242E3B] text-xs font-mono"
                    >
                      <Sparkles className="w-3 h-3 text-[#66FCF1]" />
                      <span>{group.name}</span>
                      <span className="text-[10px] text-[#C5C6C7]/50 font-sans uppercase">
                        ({group.kind === 'smart' ? 'inteligente' : 'manual'})
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#C5C6C7]/50 font-mono text-xs py-1">
                  Sin grupos asignados actualmente.
                </p>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
