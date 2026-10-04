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
  LayoutGrid,
  List,
  Building2,
  Shield,
  Phone,
  Mail,
  Calendar,
  Clock,
  ExternalLink,
  X,
  Coffee,
  Layers,
  UserX,
  ChevronRight,
  Filter,
  Sparkles,
} from 'lucide-react';

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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-[#66FCF1]/15 text-[#66FCF1] border border-[#66FCF1]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#66FCF1] animate-pulse" />
            En llamada
          </span>
        );
      case 'available':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
            Disponible
          </span>
        );
      case 'break':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30">
            <Coffee className="w-3 h-3" />
            En pausa
          </span>
        );
      case 'offline':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-[#1F2833] text-[#C5C6C7]/60 border border-[#242E3B]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C5C6C7]/40" />
            Desconectado
          </span>
        );
    }
  };

  const renderRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30">
            ADMIN
          </span>
        );
      case 'supervisor':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30">
            SUPERVISOR
          </span>
        );
      case 'agent':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full font-mono text-[10px] font-medium bg-[#66FCF1]/10 text-[#66FCF1] border border-[#66FCF1]/20">
            AGENTE
          </span>
        );
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
        onClick={() => setSelectedAgentId(agent.id)}
        className={`group bg-[#13151c] border rounded-2xl p-5 shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between hover:border-[#66FCF1]/50 hover:shadow-[0_0_20px_rgba(102,252,241,0.12)] relative ${
          !profile.active ? 'border-[#EF4444]/30 bg-[#13151c]/80' : 'border-[#242E3B]'
        }`}
      >
        <div className="space-y-4">
          {/* Fila superior: Avatar, Nombre, Código y Estado */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#1F2833] border border-[#242E3B] flex items-center justify-center text-[#66FCF1] font-mono font-bold text-sm shrink-0 group-hover:border-[#66FCF1]/40 group-hover:scale-105 transition-all">
                {agent.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-[#66FCF1] transition-colors leading-tight">
                  {agent.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] font-mono text-[#C5C6C7]/60">
                    {agent.employeeCode}
                  </span>
                  {renderRoleBadge(profile.role)}
                  {!profile.active && (
                    <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40">
                      Inactivo
                    </span>
                  )}
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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-[#13151c] border border-[#242E3B] rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-[#66FCF1]/5 to-transparent pointer-events-none" />

        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-[#66FCF1]/10 text-[#66FCF1] border border-[#66FCF1]/30">
              COMMUNICATION & DIRECTORY
            </span>
            <span className="text-xs text-[#C5C6C7]/50 font-mono">
              Libreta de Personal en Vivo
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <BookOpen className="w-7 h-7 text-[#66FCF1]" />
            <span>Directorio de Personal</span>
          </h1>
          <p className="text-sm text-[#C5C6C7]/80">
            Libreta de contactos corporativa: consulta personas, canales de contacto, campañas y estado operativo en tiempo real.
          </p>
        </div>

        {/* Alternador de Vistas & Contador */}
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          {/* Contador de personas */}
          <div className="px-3.5 py-2 rounded-xl bg-[#0B0C10] border border-[#242E3B] text-xs font-mono text-[#C5C6C7]">
            Mostrando{' '}
            <strong className="text-[#66FCF1] font-bold">{filteredAgents.length}</strong> de{' '}
            <strong className="text-white">{agents.length}</strong> personas
          </div>

          {/* Toggle Tarjetas / Tabla */}
          <div className="inline-flex rounded-xl p-1 bg-[#0B0C10] border border-[#242E3B]">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              title="Vista de Tarjetas"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'cards'
                  ? 'bg-[#66FCF1] text-[#0B0C10] shadow-[0_0_12px_rgba(102,252,241,0.3)]'
                  : 'text-[#C5C6C7] hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Tarjetas</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              title="Vista de Tabla"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-[#66FCF1] text-[#0B0C10] shadow-[0_0_12px_rgba(102,252,241,0.3)]'
                  : 'text-[#C5C6C7] hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Tabla</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Barra de Filtros y Búsqueda */}
      <div className="bg-[#13151c] border border-[#242E3B] rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Buscador */}
        <div className="relative flex-1 md:max-w-md">
          <Search className="w-3.5 h-3.5 text-[#C5C6C7]/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
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
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              className="bg-[#0B0C10] border border-[#242E3B] text-xs text-[#C5C6C7] rounded-xl px-3 py-2 pr-8 focus:outline-none focus:border-[#66FCF1] appearance-none"
            >
              <option value="all">Todas las Campañas</option>
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
              onChange={(e) => setSelectedRole(e.target.value)}
              className="bg-[#0B0C10] border border-[#242E3B] text-xs text-[#C5C6C7] rounded-xl px-3 py-2 pr-8 focus:outline-none focus:border-[#66FCF1] appearance-none"
            >
              <option value="all">Todos los Roles</option>
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
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-[#0B0C10] border border-[#242E3B] text-xs text-[#C5C6C7] rounded-xl px-3 py-2 pr-8 focus:outline-none focus:border-[#66FCF1] appearance-none"
            >
              <option value="all">Todos los Estados</option>
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
        <div className="bg-[#13151c] border border-[#242E3B] rounded-2xl p-12 text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-[#1F2833] text-[#66FCF1] flex items-center justify-center mx-auto border border-[#242E3B]">
            <UserX className="w-7 h-7 text-[#C5C6C7]/60" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">
              No se encontraron personas
            </h3>
            <p className="text-xs text-[#C5C6C7]/60 max-w-md mx-auto">
              Ninguna persona coincide con los filtros de búsqueda seleccionados. Prueba modificando los términos o restableciendo los filtros.
            </p>
          </div>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#66FCF1]/10 hover:bg-[#66FCF1]/20 text-[#66FCF1] border border-[#66FCF1]/30 text-xs font-bold transition-colors cursor-pointer"
          >
            <span>Restablecer Filtros</span>
          </button>
        </div>
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
                                  <div className="w-8 h-8 rounded-lg bg-[#1F2833] border border-[#242E3B] flex items-center justify-center text-[#66FCF1] font-mono font-bold text-xs shrink-0 group-hover:border-[#66FCF1]/40">
                                    {agent.name.charAt(0)}
                                  </div>
                                  <div>
                                    <span className="font-semibold text-white group-hover:text-[#66FCF1] transition-colors block">
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
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#66FCF1] group-hover:underline">
                                  <span>Ver</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </span>
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
                          <div className="w-8 h-8 rounded-lg bg-[#1F2833] border border-[#242E3B] flex items-center justify-center text-[#66FCF1] font-mono font-bold text-xs shrink-0 group-hover:border-[#66FCF1]/40">
                            {agent.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-semibold text-white group-hover:text-[#66FCF1] transition-colors block">
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
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#66FCF1] group-hover:underline">
                          <span>Ver</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#13151c] border border-[#242E3B] rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Cabecera del Modal */}
            <div className="flex items-start justify-between border-b border-[#242E3B] pb-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-[#1F2833] text-[#66FCF1] flex items-center justify-center border border-[#242E3B] font-mono font-bold text-lg shrink-0">
                  {selectedAgent.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">{selectedAgent.name}</h3>
                    {selectedProfile.active ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                        Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
                        Inactivo
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-mono text-[#C5C6C7]/60">
                      {selectedAgent.employeeCode}
                    </span>
                    <span className="text-[#C5C6C7]/40">•</span>
                    {renderRoleBadge(selectedProfile.role)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="shrink-0">{renderStatusBadge(selectedAgent.status)}</div>
                <button
                  type="button"
                  onClick={() => setSelectedAgentId(null)}
                  className="p-1 rounded-lg text-[#C5C6C7] hover:text-white hover:bg-[#1F2833] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
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
                      Rol Asignado
                    </span>
                    <span className="text-white capitalize">
                      {selectedProfile.role}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sección: Antigüedad y Trayectoria */}
            <div className="bg-[#0B0C10] border border-[#242E3B] rounded-xl p-4 space-y-3 text-xs">
              <div className="flex items-center gap-1.5 text-[#66FCF1] font-mono font-semibold uppercase text-[11px] tracking-wider">
                <Calendar className="w-3.5 h-3.5" />
                <span>Antigüedad y Trayectoria</span>
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
                  <span>Turno de Hoy ({today})</span>
                </div>
                {selectedTodayShift && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                    Programado
                  </span>
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
                <span>Grupos Asignados ({selectedAgentGroups.length})</span>
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
                        ({group.kind})
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

            {/* Pie del Modal: Botones de Acción */}
            <div className="pt-4 border-t border-[#242E3B] flex items-center justify-between">
              {/* Botón Editar en Users */}
              <button
                type="button"
                onClick={() => {
                  setSelectedAgentId(null);
                  navigate('/users');
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#66FCF1] hover:bg-[#52e0d6] text-[#0B0C10] text-xs font-bold transition-all shadow-[0_0_12px_rgba(102,252,241,0.25)] cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Editar en Users</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedAgentId(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#C5C6C7] hover:text-white bg-[#1F2833] hover:bg-[#253240] border border-[#242E3B] transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
