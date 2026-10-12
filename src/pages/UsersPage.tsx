import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import type { UserRole } from '@/types/directory';
import type { Agent } from '@/types';
import { useWorkforceStore } from '@/store/useWorkforceStore';
import { useDirectoryStore } from '@/store/useDirectoryStore';
import { resetApplicationState } from '@/lib/globalReset';
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
} from 'lucide-react';
import { PageHeader, Card, Button, Badge, Avatar, EmptyState, Modal, Field, Input, Select, Notice } from '@/components/ui';

export const UsersPage: React.FC = () => {
  const { agents, campaigns } = useWorkforceStore();
  const {
    profiles,
    groups,
    createUser,
    updateUser,
    setUserActive,
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
      <PageHeader
        icon={Users}
        eyebrow="USUARIOS Y GRUPOS"
        title="Usuarios y perfiles"
        description="Administra cuentas, roles, campañas y la pertenencia de cada agente a sus grupos."
        actions={
          <>
            <Button
              variant="primary"
              icon={UserPlus}
              onClick={() => {
                setNewUserName('');
                setNewUserEmail('');
                setNewUserLevel('');
                setNewUserRole('agent');
                setNewUserCampaignId(campaigns[0]?.id ?? '');
                setNewUserError(null);
                setIsNewUserModalOpen(true);
              }}
            >
              Nuevo usuario
            </Button>
            <Button
              icon={RotateCcw}
              onClick={() => {
                if (window.confirm('¿Reiniciar todos los datos de demostración? Se restablecerán asistencias, usuarios, turnos y llamadas a su estado inicial.')) {
                  resetApplicationState();
                }
              }}
              title="Reiniciar todos los datos de prueba"
              aria-label="Reiniciar todos los datos de prueba"
            />
          </>
        }
      />

      {/* Alerta de notificación */}
      {alertNotice && (
        <Notice
          tone={alertNotice.type === 'error' ? 'danger' : alertNotice.type}
          onClose={() => setAlertNotice(null)}
        >
          <span className="flex flex-wrap items-center gap-2.5">
            {alertNotice.type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0" />}
            {alertNotice.type === 'warning' && <AlertTriangle className="w-5 h-5 shrink-0" />}
            <span>{alertNotice.message}</span>
            {alertNotice.actionUrl && (
              <NavLink
                to={alertNotice.actionUrl}
                className="px-2.5 py-1 rounded-lg bg-[#F59E0B] text-[#0B0C10] font-bold text-xs hover:bg-[#d98206] transition-colors"
              >
                {alertNotice.actionLabel ?? 'Ir'}
              </NavLink>
            )}
          </span>
        </Notice>
      )}

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-[#13151c] border border-[#242E3B] rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Buscador */}
        <div className="relative flex-1 md:max-w-xs">
          <Search className="w-3.5 h-3.5 text-[#C5C6C7]/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            aria-label="Buscar usuarios"
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

          {/* Activo / Inactivo */}
          <div className="relative">
            <select
              value={selectedStatus}
              aria-label="Filtrar por estado"
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-[#0B0C10] border border-[#242E3B] text-xs text-[#C5C6C7] rounded-xl px-3 py-2 pr-8 focus:outline-none focus:border-[#66FCF1] appearance-none"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
            <Power className="w-3.5 h-3.5 text-[#C5C6C7]/40 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Tabla Principal de Usuarios */}
      <Card
        className="overflow-hidden"
        bodyClassName=""
        title={`Directorio de usuarios (${filteredAgents.length})`}
        subtitle="Sincronizado con la operación en vivo"
      >
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
                  <td colSpan={9}>
                    <EmptyState
                      icon={Search}
                      title="Sin resultados"
                      description="No se encontraron usuarios que coincidan con los filtros seleccionados."
                    />
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
                          <Avatar name={agent.name} size="sm" />
                          <div>
                            <span className="font-semibold text-white block whitespace-nowrap">
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
                        {profile.role === 'admin' && <Badge tone="danger">ADMIN</Badge>}
                        {profile.role === 'supervisor' && <Badge tone="warning">SUPERVISOR</Badge>}
                        {profile.role === 'agent' && <Badge tone="accent">AGENTE</Badge>}
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
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          {/* Editar */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(agent)}
                            title="Editar usuario"
                            aria-label={`Editar a ${agent.name}`}
                            className="p-1.5 rounded-lg bg-[#1F2833] hover:bg-[#253240] text-[#C5C6C7] hover:text-white border border-[#242E3B] transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Activar / Desactivar */}
                          <button
                            type="button"
                            onClick={() => handleToggleActive(agent.id, profile.active)}
                            title={profile.active ? 'Desactivar usuario' : 'Activar usuario'}
                            aria-label={`${profile.active ? 'Desactivar' : 'Activar'} a ${agent.name}`}
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
      </Card>

      {/* Modal Nuevo Usuario */}
      <Modal
        open={isNewUserModalOpen}
        onClose={() => setIsNewUserModalOpen(false)}
        title="Nuevo usuario"
        description="Crea un agente y su perfil de acceso corporativo."
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsNewUserModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" form="new-user-form">
              Crear usuario
            </Button>
          </>
        }
      >
        {newUserError && (
          <div className="mb-4">
            <Notice tone="danger">{newUserError}</Notice>
          </div>
        )}

        <form id="new-user-form" onSubmit={handleCreateUser} className="space-y-4">
          <Field label="Nombre completo">
            <Input
              type="text"
              required
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              placeholder="Ej: Laura Sánchez"
            />
          </Field>

          <Field label="Correo electrónico">
            <Input
              type="email"
              required
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              placeholder="ej: laura.sanchez@vooxline.com"
              className="font-mono"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Campaña asignada">
              <Select value={newUserCampaignId} onChange={(e) => setNewUserCampaignId(e.target.value)}>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Rol">
              <Select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value as UserRole)}>
                <option value="agent">Agente</option>
                <option value="supervisor">Supervisor</option>
                <option value="admin">Administrador</option>
              </Select>
            </Field>
          </div>

          <Field label="Nivel / especialidad">
            <Input
              type="text"
              required
              value={newUserLevel}
              onChange={(e) => setNewUserLevel(e.target.value)}
              placeholder="Ej: Nivel 2 Bilingüe, Senior QA, Soporte"
            />
          </Field>
        </form>
      </Modal>

      {/* Modal Editar Usuario */}
      <Modal
        open={editingAgent !== null}
        onClose={() => setEditingAgent(null)}
        title="Editar usuario"
        description={editingAgent?.employeeCode}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditingAgent(null)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" form="edit-user-form">
              Guardar cambios
            </Button>
          </>
        }
      >
        {editError && (
          <div className="mb-4">
            <Notice tone="danger">{editError}</Notice>
          </div>
        )}

        <form id="edit-user-form" onSubmit={handleSaveEdit} className="space-y-4">
          <Field label="Nombre">
            <Input type="text" required value={editName} onChange={(e) => setEditName(e.target.value)} />
          </Field>

          <Field label="Correo electrónico">
            <Input
              type="email"
              required
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              className="font-mono"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Campaña">
              <Select value={editCampaignId} onChange={(e) => setEditCampaignId(e.target.value)}>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Rol">
              <Select value={editRole} onChange={(e) => setEditRole(e.target.value as UserRole)}>
                <option value="agent">Agente</option>
                <option value="supervisor">Supervisor</option>
                <option value="admin">Administrador</option>
              </Select>
            </Field>
          </div>

          <Field label="Nivel">
            <Input
              type="text"
              required
              value={editLevel}
              onChange={(e) => setEditLevel(e.target.value)}
              placeholder="Ej: Nivel 1 Bilingüe"
            />
          </Field>
        </form>
      </Modal>
    </div>
  );
};
