import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import type { UserRole } from '@/types/directory';
import type { Agent } from '@/types';
import { useWorkforceStore } from '@/store/useWorkforceStore';
import { useDirectoryStore } from '@/store/useDirectoryStore';
import type { UserPatch } from '@/store/useDirectoryStore';
import { getProfile, getGroupMembers } from '@/lib/groups';
import {
  Users,
  UserPlus,
  Search,
  Building2,
  Shield,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Layers,
  Power,
  X,
} from 'lucide-react';

export const UsersPage: React.FC = () => {
  const { agents, campaigns } = useWorkforceStore();
  const {
    profiles,
    groups,
    createUser,
    updateUser,
    setUserActive,
    resetDirectoryDemo,
  } = useDirectoryStore();

  // Filtros y búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Estado para modal Nuevo Usuario
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserLevel, setNewUserLevel] = useState('');
  const [newUserCampaignId, setNewUserCampaignId] = useState(campaigns[0]?.id ?? '');
  const [newUserRole, setNewUserRole] = useState<UserRole>('agent');
  const [newUserError, setNewUserError] = useState<string | null>(null);

  // Estado para modal Editar Usuario
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editLevel, setEditLevel] = useState('');
  const [editCampaignId, setEditCampaignId] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('agent');
  const [editError, setEditError] = useState<string | null>(null);

  // Alerta informativa global
  const [alertNotice, setAlertNotice] = useState<{
    type: 'success' | 'warning' | 'error' | 'info';
    message: string;
    actionUrl?: string;
    actionLabel?: string;
  } | null>(null);

  const campaignMap = new Map(campaigns.map((c) => [c.id, c]));

  // Agentes filtrados
  const filteredAgents = agents.filter((agent) => {
    const profile = getProfile(profiles, agent.id);

    // Filtro por campaña
    if (selectedCampaignId !== 'all' && agent.campaignId !== selectedCampaignId) {
      return false;
    }

    // Filtro por rol
    if (selectedRole !== 'all' && profile.role !== selectedRole) {
      return false;
    }

    // Filtro por activo / inactivo
    if (selectedStatus === 'active' && !profile.active) return false;
    if (selectedStatus === 'inactive' && profile.active) return false;

    // Filtro por buscador
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = agent.name.toLowerCase();
      const code = agent.employeeCode.toLowerCase();
      const email = profile.email.toLowerCase();
      const level = agent.level.toLowerCase();

      return (
        name.includes(q) ||
        code.includes(q) ||
        email.includes(q) ||
        level.includes(q)
      );
    }

    return true;
  });

  // Manejar creación de nuevo usuario
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setNewUserError(null);

    const res = createUser({
      name: newUserName,
      email: newUserEmail,
      level: newUserLevel,
      campaignId: newUserCampaignId,
      role: newUserRole,
    });

    if (res.ok) {
      setIsNewUserModalOpen(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserLevel('');
      setNewUserRole('agent');
      setAlertNotice({
        type: 'success',
        message: 'Usuario y agente creados con éxito en el sistema.',
      });
    } else {
      if (res.reason === 'email_taken') {
        setNewUserError('El correo ingresado ya se encuentra registrado por otro usuario.');
      } else if (res.reason === 'invalid') {
        setNewUserError('Datos inválidos. Verifica que el nombre, correo y campaña sean válidos.');
      } else {
        setNewUserError(`Error al crear usuario: ${res.reason}`);
      }
    }
  };

  // Abrir modal de edición
  const handleOpenEdit = (agent: Agent) => {
    const profile = getProfile(profiles, agent.id);
    setEditingAgent(agent);
    setEditName(agent.name);
    setEditEmail(profile.email);
    setEditLevel(agent.level);
    setEditCampaignId(agent.campaignId);
    setEditRole(profile.role);
    setEditError(null);
  };

  // Guardar edición
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAgent) return;
    setEditError(null);

    const profile = getProfile(profiles, editingAgent.id);
    const patch: UserPatch = {};

    if (editName.trim() !== editingAgent.name) {
      patch.name = editName.trim();
    }
    if (editLevel.trim() !== editingAgent.level) {
      patch.level = editLevel.trim();
    }
    if (editCampaignId !== editingAgent.campaignId) {
      patch.campaignId = editCampaignId;
    }
    if (editEmail.trim() !== profile.email) {
      patch.email = editEmail.trim();
    }
    if (editRole !== profile.role) {
      patch.role = editRole;
    }

    // Si no hubo cambios, solo cerrar modal
    if (Object.keys(patch).length === 0) {
      setEditingAgent(null);
      return;
    }

    const res = updateUser(editingAgent.id, patch);

    if (res.ok) {
      setEditingAgent(null);
      setAlertNotice({
        type: 'success',
        message: `Usuario ${editName} actualizado exitosamente.`,
      });
    } else {
      if (res.reason === 'email_taken') {
        setEditError('El correo ingresado ya está en uso por otro usuario.');
      } else if (res.reason === 'invalid') {
        setEditError('Valores no válidos para actualizar el usuario.');
      } else {
        setEditError(`Error al actualizar: ${res.reason}`);
      }
    }
  };

  // Activar / Desactivar usuario
  const handleToggleActive = (agentId: string, currentActive: boolean) => {
    const res = setUserActive(agentId, !currentActive);
    const agent = agents.find((a) => a.id === agentId);

    if (res.ok) {
      setAlertNotice({
        type: 'success',
        message: `Usuario ${agent?.name ?? ''} ${!currentActive ? 'activado' : 'desactivado'} con éxito.`,
      });
    } else {
      if (res.reason === 'has_open_entry') {
        setAlertNotice({
          type: 'warning',
          message: `No es posible desactivar a ${agent?.name ?? 'este usuario'}: tiene un turno abierto en este momento. Primero debe marcar salida.`,
          actionUrl: '/time-clock',
          actionLabel: 'Ir a Time Clock',
        });
      } else {
        setAlertNotice({
          type: 'error',
          message: `Error al cambiar estado: ${res.reason}`,
        });
      }
    }
  };

  // Obtener nombres de grupos a los que pertenece el agente
  const getAgentGroupNames = (agentId: string): string[] => {
    return groups
      .filter((group) => {
        const members = getGroupMembers(group, agents, profiles);
        return members.some((m) => m.id === agentId);
      })
      .map((g) => g.name);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-[#13151c] border border-[#242E3B] rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-[#66FCF1]/5 to-transparent pointer-events-none" />

        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-[#66FCF1]/10 text-[#66FCF1] border border-[#66FCF1]/30">
              USERS & GROUPS
            </span>
            <span className="text-xs text-[#C5C6C7]/50 font-mono">
              Directorio Maestro de Personal
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-[#66FCF1]" />
            <span>Usuarios & Perfiles de Agentes</span>
          </h1>
          <p className="text-sm text-[#C5C6C7]/80">
            Administración de cuentas, perfiles de talento, roles y pertenencia a grupos inteligentes.
          </p>
        </div>

        {/* Acciones */}
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <button
            type="button"
            onClick={() => {
              setNewUserName('');
              setNewUserEmail('');
              setNewUserLevel('');
              setNewUserRole('agent');
              setNewUserCampaignId(campaigns[0]?.id ?? '');
              setNewUserError(null);
              setIsNewUserModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#66FCF1] hover:bg-[#52e0d6] text-[#0B0C10] text-xs font-bold transition-all shadow-[0_0_16px_rgba(102,252,241,0.25)] cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Nuevo Usuario</span>
          </button>

          <button
            type="button"
            onClick={resetDirectoryDemo}
            title="Reiniciar perfiles de demostración"
            className="p-2.5 rounded-xl bg-[#1F2833]/60 hover:bg-[#1F2833] text-[#C5C6C7] hover:text-white border border-[#242E3B] transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Alerta de notificación */}
      {alertNotice && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl border text-sm animate-fadeIn ${
            alertNotice.type === 'success'
              ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]'
              : alertNotice.type === 'warning'
                ? 'bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#F59E0B]'
                : alertNotice.type === 'error'
                  ? 'bg-[#EF4444]/10 border-[#EF4444]/30 text-[#EF4444]'
                  : 'bg-[#66FCF1]/10 border-[#66FCF1]/30 text-[#66FCF1]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {alertNotice.type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0" />}
            {alertNotice.type === 'warning' && <AlertTriangle className="w-5 h-5 shrink-0" />}
            <span className="font-medium">{alertNotice.message}</span>
            {alertNotice.actionUrl && (
              <NavLink
                to={alertNotice.actionUrl}
                className="ml-2 px-2.5 py-1 rounded bg-[#F59E0B] text-[#0B0C10] font-bold text-xs hover:bg-[#d98206] transition-colors"
              >
                {alertNotice.actionLabel ?? 'Ir'}
              </NavLink>
            )}
          </div>
          <button
            type="button"
            onClick={() => setAlertNotice(null)}
            className="text-xs opacity-70 hover:opacity-100 uppercase tracking-wider font-mono ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-[#13151c] border border-[#242E3B] rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Buscador */}
        <div className="relative flex-1 md:max-w-xs">
          <Search className="w-3.5 h-3.5 text-[#C5C6C7]/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, correo, código..."
            className="w-full bg-[#0B0C10] border border-[#242E3B] text-xs text-white rounded-xl pl-9 pr-3 py-2 placeholder:text-[#C5C6C7]/40 focus:outline-none focus:border-[#66FCF1]"
          />
        </div>

        {/* Selects de Filtrado */}
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

          {/* Activo / Inactivo */}
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-[#0B0C10] border border-[#242E3B] text-xs text-[#C5C6C7] rounded-xl px-3 py-2 pr-8 focus:outline-none focus:border-[#66FCF1] appearance-none"
            >
              <option value="all">Todos los Estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
            <Power className="w-3.5 h-3.5 text-[#C5C6C7]/40 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Tabla Principal de Usuarios */}
      <div className="bg-[#13151c] border border-[#242E3B] rounded-2xl shadow-xl overflow-hidden">
        <div className="p-5 border-b border-[#242E3B] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#66FCF1]" />
            <h2 className="text-base font-bold text-white tracking-wide">
              Directorio de Usuarios ({filteredAgents.length})
            </h2>
          </div>
          <span className="text-xs text-[#C5C6C7]/60 font-mono">
            Sincronizado con Store de Operaciones
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#242E3B] bg-[#0B0C10]/60 text-[11px] font-mono text-[#C5C6C7]/60 uppercase tracking-wider">
                <th className="py-3 px-4">Usuario / Nombre</th>
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Correo</th>
                <th className="py-3 px-4">Rol</th>
                <th className="py-3 px-4">Campaña</th>
                <th className="py-3 px-4">Nivel</th>
                <th className="py-3 px-4">Grupos</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#242E3B]/60 text-xs">
              {filteredAgents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#C5C6C7]/50 font-mono">
                    No se encontraron usuarios que coincidan con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredAgents.map((agent) => {
                  const profile = getProfile(profiles, agent.id);
                  const campaign = campaignMap.get(agent.campaignId);
                  const memberGroups = getAgentGroupNames(agent.id);

                  return (
                    <tr
                      key={agent.id}
                      className="hover:bg-[#1A202C]/50 transition-colors group"
                    >
                      {/* Nombre */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#1F2833] border border-[#242E3B] flex items-center justify-center text-[#66FCF1] font-mono font-bold text-xs shrink-0">
                            {agent.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-semibold text-white block">
                              {agent.name}
                            </span>
                            <span className="text-[10px] text-[#C5C6C7]/50 font-mono">
                              Ext: {agent.sipExtension}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Código */}
                      <td className="py-3 px-4 font-mono text-[#C5C6C7]">
                        {agent.employeeCode}
                      </td>

                      {/* Correo */}
                      <td className="py-3 px-4 text-[#C5C6C7] font-mono text-[11px]">
                        {profile.email || <span className="text-[#C5C6C7]/40">—</span>}
                      </td>

                      {/* Rol */}
                      <td className="py-3 px-4">
                        {profile.role === 'admin' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30">
                            ADMIN
                          </span>
                        )}
                        {profile.role === 'supervisor' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30">
                            SUPERVISOR
                          </span>
                        )}
                        {profile.role === 'agent' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full font-mono text-[10px] font-medium bg-[#66FCF1]/10 text-[#66FCF1] border border-[#66FCF1]/20">
                            AGENTE
                          </span>
                        )}
                      </td>

                      {/* Campaña */}
                      <td className="py-3 px-4 text-white/90">
                        {campaign?.name ?? 'Sin Asignar'}
                      </td>

                      {/* Nivel */}
                      <td className="py-3 px-4 text-[#C5C6C7]">
                        {agent.level}
                      </td>

                      {/* Grupos */}
                      <td className="py-3 px-4 max-w-xs">
                        {memberGroups.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {memberGroups.map((gName) => (
                              <span
                                key={gName}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#1F2833] text-[10px] text-[#66FCF1] font-mono border border-[#242E3B]"
                              >
                                <Layers className="w-2.5 h-2.5" />
                                {gName}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[#C5C6C7]/40 text-[11px] font-mono">—</span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="py-3 px-4">
                        {profile.active ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
                            Inactivo
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          {/* Editar */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(agent)}
                            title="Editar usuario"
                            className="p-1.5 rounded-lg bg-[#1F2833] hover:bg-[#253240] text-[#C5C6C7] hover:text-white border border-[#242E3B] transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Activar / Desactivar */}
                          <button
                            type="button"
                            onClick={() => handleToggleActive(agent.id, profile.active)}
                            title={profile.active ? 'Desactivar usuario' : 'Activar usuario'}
                            className={`p-1.5 rounded-lg border text-xs transition-colors ${
                              profile.active
                                ? 'bg-[#EF4444]/10 hover:bg-[#EF4444] text-[#EF4444] hover:text-white border-[#EF4444]/30'
                                : 'bg-[#10B981]/10 hover:bg-[#10B981] text-[#10B981] hover:text-[#0B0C10] border-[#10B981]/30'
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nuevo Usuario */}
      {isNewUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#13151c] border border-[#242E3B] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#242E3B] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#66FCF1]/15 text-[#66FCF1] flex items-center justify-center border border-[#66FCF1]/30">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Nuevo Usuario</h3>
                  <p className="text-[11px] text-[#C5C6C7]/60">
                    Crea un agente y su perfil de acceso corporativo.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewUserModalOpen(false)}
                className="p-1 rounded-lg text-[#C5C6C7] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {newUserError && (
              <div className="p-3 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{newUserError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#C5C6C7] font-medium mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Ej: Laura Sánchez"
                  className="w-full bg-[#0B0C10] border border-[#242E3B] text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#66FCF1]"
                />
              </div>

              <div>
                <label className="block text-[#C5C6C7] font-medium mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="ej: laura.sanchez@vooxline.com"
                  className="w-full bg-[#0B0C10] border border-[#242E3B] text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#66FCF1] font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#C5C6C7] font-medium mb-1">Campaña Asignada</label>
                  <select
                    value={newUserCampaignId}
                    onChange={(e) => setNewUserCampaignId(e.target.value)}
                    className="w-full bg-[#0B0C10] border border-[#242E3B] text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#66FCF1]"
                  >
                    {campaigns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#C5C6C7] font-medium mb-1">Rol Corporativo</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                    className="w-full bg-[#0B0C10] border border-[#242E3B] text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#66FCF1]"
                  >
                    <option value="agent">Agente</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#C5C6C7] font-medium mb-1">Nivel / Especialidad</label>
                <input
                  type="text"
                  required
                  value={newUserLevel}
                  onChange={(e) => setNewUserLevel(e.target.value)}
                  placeholder="Ej: Nivel 2 Bilingüe, Senior QA, Soporte"
                  className="w-full bg-[#0B0C10] border border-[#242E3B] text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#66FCF1]"
                />
              </div>

              <div className="pt-3 border-t border-[#242E3B] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#C5C6C7] hover:text-white bg-[#1F2833] hover:bg-[#253240]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-[#0B0C10] bg-[#66FCF1] hover:bg-[#52e0d6] shadow-[0_0_12px_rgba(102,252,241,0.25)]"
                >
                  Crear Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Usuario */}
      {editingAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#13151c] border border-[#242E3B] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#242E3B] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#66FCF1]/15 text-[#66FCF1] flex items-center justify-center border border-[#66FCF1]/30">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Editar Usuario</h3>
                  <p className="text-[11px] text-[#C5C6C7]/60 font-mono">
                    {editingAgent.employeeCode}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingAgent(null)}
                className="p-1 rounded-lg text-[#C5C6C7] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#C5C6C7] font-medium mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-[#0B0C10] border border-[#242E3B] text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#66FCF1]"
                />
              </div>

              <div>
                <label className="block text-[#C5C6C7] font-medium mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-[#0B0C10] border border-[#242E3B] text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#66FCF1] font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#C5C6C7] font-medium mb-1">Campaña</label>
                  <select
                    value={editCampaignId}
                    onChange={(e) => setEditCampaignId(e.target.value)}
                    className="w-full bg-[#0B0C10] border border-[#242E3B] text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#66FCF1]"
                  >
                    {campaigns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#C5C6C7] font-medium mb-1">Rol</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className="w-full bg-[#0B0C10] border border-[#242E3B] text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#66FCF1]"
                  >
                    <option value="agent">Agente</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#C5C6C7] font-medium mb-1">Nivel</label>
                <input
                  type="text"
                  required
                  value={editLevel}
                  onChange={(e) => setEditLevel(e.target.value)}
                  placeholder="Ej: Nivel 1 Bilingüe"
                  className="w-full bg-[#0B0C10] border border-[#242E3B] text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#66FCF1]"
                />
              </div>

              <div className="pt-3 border-t border-[#242E3B] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingAgent(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#C5C6C7] hover:text-white bg-[#1F2833] hover:bg-[#253240]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-[#0B0C10] bg-[#66FCF1] hover:bg-[#52e0d6] shadow-[0_0_12px_rgba(102,252,241,0.25)]"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
