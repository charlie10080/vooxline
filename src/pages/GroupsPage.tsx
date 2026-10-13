import React, { useState } from 'react';
import type {
  SmartGroup,
  GroupKind,
  GroupMatch,
  GroupRule,
  RuleField,
  RuleOperator,
} from '@/types/directory';
import type { Agent } from '@/types';
import { useWorkforceStore } from '@/store/useWorkforceStore';
import { useDirectoryStore } from '@/store/useDirectoryStore';
import { resetApplicationState } from '@/lib/globalReset';
import { getGroupMembers } from '@/lib/groups';
import {
  Layers,
  Plus,
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  UserCheck,
  Edit2,
  Trash2,
  X,
  UserMinus,
  UserPlus,
  Zap,
} from 'lucide-react';
import { PageHeader, Card, Button, Badge, EmptyState, Modal, Field, Input, Select, Tabs, Notice } from '@/components/ui';

export const GroupsPage: React.FC = () => {
  const { agents, campaigns } = useWorkforceStore();
  const {
    profiles,
    groups,
    createGroup,
    updateGroup,
    deleteGroup,
    toggleGroupMember,
  } = useDirectoryStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKind, setSelectedKind] = useState<string>('all');

  // Grupo seleccionado para ver detalle/miembros
  const [selectedGroup, setSelectedGroup] = useState<SmartGroup | null>(null);

  // Modal Crear / Editar Grupo
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formKind, setFormKind] = useState<GroupKind>('smart');
  const [formMatch, setFormMatch] = useState<GroupMatch>('all');
  const [formRules, setFormRules] = useState<GroupRule[]>([
    { id: 'r-temp-1', field: 'campaign', operator: 'is', value: campaigns[0]?.id ?? '' },
  ]);
  const [formMemberIds, setFormMemberIds] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  // Confirmación de eliminación
  const [deletingGroup, setDeletingGroup] = useState<SmartGroup | null>(null);

  // Alerta informativa global
  const [alertNotice, setAlertNotice] = useState<{
    type: 'success' | 'warning' | 'error' | 'info';
    message: string;
  } | null>(null);

  const campaignMap = new Map(campaigns.map((c) => [c.id, c]));

  // Grupos filtrados
  const filteredGroups = groups.filter((group) => {
    if (selectedKind !== 'all' && group.kind !== selectedKind) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        group.name.toLowerCase().includes(q) ||
        group.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Vista previa en vivo para el modal de creación/edición
  const previewGroup: SmartGroup = {
    id: editingGroupId ?? 'temp-preview',
    name: formName || 'Preview',
    description: formDescription,
    kind: formKind,
    match: formMatch,
    rules: formRules,
    memberIds: formMemberIds,
  };
  const livePreviewMembers: Agent[] = getGroupMembers(previewGroup, agents, profiles);

  // Abrir modal de creación
  const handleOpenCreateModal = () => {
    setEditingGroupId(null);
    setFormName('');
    setFormDescription('');
    setFormKind('smart');
    setFormMatch('all');
    setFormRules([
      { id: crypto.randomUUID(), field: 'campaign', operator: 'is', value: campaigns[0]?.id ?? '' },
    ]);
    setFormMemberIds([]);
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // Abrir modal de edición
  const handleOpenEditModal = (group: SmartGroup, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingGroupId(group.id);
    setFormName(group.name);
    setFormDescription(group.description);
    setFormKind(group.kind);
    setFormMatch(group.match);
    setFormRules([...group.rules]);
    setFormMemberIds([...group.memberIds]);
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // Guardar Grupo (Crear o Editar)
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim()) {
      setFormError('El nombre del grupo es obligatorio.');
      return;
    }

    if (formKind === 'smart' && formRules.length === 0) {
      setFormError('Un grupo inteligente debe tener al menos una regla.');
      return;
    }

    if (editingGroupId) {
      // Actualizar
      const res = updateGroup(editingGroupId, {
        name: formName.trim(),
        description: formDescription.trim(),
        kind: formKind,
        match: formMatch,
        rules: formRules,
        memberIds: formMemberIds,
      });

      if (res.ok) {
        setIsFormModalOpen(false);
        // Actualizar referencia si está abierto en detalle
        if (selectedGroup?.id === editingGroupId) {
          const updated = groups.find((g) => g.id === editingGroupId);
          if (updated) setSelectedGroup({ ...updated, name: formName, description: formDescription });
        }
        setAlertNotice({
          type: 'success',
          message: `Grupo "${formName}" actualizado con éxito.`,
        });
      } else {
        if (res.reason === 'name_taken') {
          setFormError('Ya existe un grupo con este nombre. Por favor elige otro.');
        } else {
          setFormError(`Error al actualizar grupo: ${res.reason}`);
        }
      }
    } else {
      // Crear
      const res = createGroup({
        name: formName.trim(),
        description: formDescription.trim(),
        kind: formKind,
        match: formMatch,
        rules: formRules,
        memberIds: formMemberIds,
      });

      if (res.ok) {
        setIsFormModalOpen(false);
        setAlertNotice({
          type: 'success',
          message: `Grupo "${formName}" creado con éxito.`,
        });
      } else {
        if (res.reason === 'name_taken') {
          setFormError('Ya existe un grupo con este nombre. Por favor elige otro.');
        } else {
          setFormError(`Error al crear grupo: ${res.reason}`);
        }
      }
    }
  };

  // Eliminar grupo
  const handleConfirmDelete = () => {
    if (!deletingGroup) return;
    const name = deletingGroup.name;
    const res = deleteGroup(deletingGroup.id);
    if (res.ok) {
      if (selectedGroup?.id === deletingGroup.id) {
        setSelectedGroup(null);
      }
      setDeletingGroup(null);
      setAlertNotice({
        type: 'info',
        message: `Grupo "${name}" eliminado.`,
      });
    } else {
      setAlertNotice({
        type: 'error',
        message: `No se pudo eliminar el grupo: ${res.reason}`,
      });
    }
  };

  // Helper para añadir una regla en el formulario
  const handleAddRule = () => {
    setFormRules([
      ...formRules,
      {
        id: crypto.randomUUID(),
        field: 'campaign',
        operator: 'is',
        value: campaigns[0]?.id ?? '',
      },
    ]);
  };

  // Helper para modificar una regla
  const handleUpdateRule = (ruleId: string, field: RuleField) => {
    let defaultValue = '';
    if (field === 'campaign') defaultValue = campaigns[0]?.id ?? '';
    if (field === 'status') defaultValue = 'on_call';
    if (field === 'role') defaultValue = 'supervisor';
    if (field === 'active') defaultValue = 'true';
    if (field === 'level') defaultValue = 'bilingüe';

    setFormRules(
      formRules.map((r) =>
        r.id === ruleId ? { ...r, field, value: defaultValue } : r,
      ),
    );
  };

  const handleUpdateRuleOperator = (ruleId: string, operator: RuleOperator) => {
    setFormRules(
      formRules.map((r) => (r.id === ruleId ? { ...r, operator } : r)),
    );
  };

  const handleUpdateRuleValue = (ruleId: string, value: string) => {
    setFormRules(
      formRules.map((r) => (r.id === ruleId ? { ...r, value } : r)),
    );
  };

  const handleRemoveRule = (ruleId: string) => {
    setFormRules(formRules.filter((r) => r.id !== ruleId));
  };

  // Formato legible para reglas en pantalla
  const formatRuleReadable = (rule: GroupRule): string => {
    const operatorText =
      rule.operator === 'is' ? 'es' : rule.operator === 'is_not' ? 'no es' : 'contiene';

    let valueText = rule.value;
    if (rule.field === 'campaign') {
      valueText = campaignMap.get(rule.value)?.name ?? rule.value;
    } else if (rule.field === 'status') {
      const statusLabels: Record<string, string> = {
        on_call: 'En llamada',
        available: 'Disponible',
        break: 'En pausa',
        offline: 'Desconectado',
      };
      valueText = statusLabels[rule.value] ?? rule.value;
    } else if (rule.field === 'role') {
      const roleLabels: Record<string, string> = {
        agent: 'Agente',
        supervisor: 'Supervisor',
        admin: 'Administrador',
      };
      valueText = roleLabels[rule.value] ?? rule.value;
    } else if (rule.field === 'active') {
      valueText = rule.value === 'true' ? 'Activo' : 'Inactivo';
    }

    const fieldLabels: Record<RuleField, string> = {
      campaign: 'Campaña',
      level: 'Nivel',
      status: 'Estado',
      role: 'Rol',
      active: 'Cuenta activa',
    };

    return `${fieldLabels[rule.field]} ${operatorText} "${valueText}"`;
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <PageHeader
        icon={Layers}
        eyebrow="USUARIOS Y GRUPOS"
        title="Grupos y equipos"
        description="Grupos inteligentes que se calculan solos por reglas operativas, y listas manuales fijas."
        actions={
          <>
            <Button variant="primary" icon={Plus} onClick={handleOpenCreateModal}>
              Crear grupo
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
          <span className="flex items-center gap-2.5">
            {alertNotice.type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0" />}
            {alertNotice.type === 'warning' && <AlertTriangle className="w-5 h-5 shrink-0" />}
            <span>{alertNotice.message}</span>
          </span>
        </Notice>
      )}

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-vx-surface border border-vx-border rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Buscador */}
        <div className="relative flex-1 md:max-w-xs">
          <Search className="w-3.5 h-3.5 text-vx-text-2/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            aria-label="Buscar grupos"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar grupo por nombre o descripción..."
            className="w-full bg-vx-bg border border-vx-border text-[13px] text-vx-text rounded-xl pl-9 pr-3 py-2 placeholder:text-vx-text-2/40 focus:outline-none focus:border-vx-accent"
          />
        </div>

        {/* Filtro por Tipo */}
        <Tabs
          value={selectedKind}
          onChange={setSelectedKind}
          options={[
            { value: 'all', label: 'Todos', count: groups.length },
            { value: 'smart', label: 'Inteligentes', count: groups.filter((g) => g.kind === 'smart').length },
            { value: 'manual', label: 'Manuales', count: groups.filter((g) => g.kind === 'manual').length },
          ]}
        />
      </div>

      {/* 1. Tarjetas de Grupos (Grid) */}
      {filteredGroups.length === 0 && (
        <Card>
          <EmptyState icon={Layers} title="Sin grupos" description="No hay grupos que coincidan con la búsqueda o el filtro." />
        </Card>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGroups.map((group) => {
          const members = getGroupMembers(group, agents, profiles);
          const isSelected = selectedGroup?.id === group.id;

          return (
            <div
              key={group.id}
              role="button"
              tabIndex={0}
              aria-label={`Ver detalle del grupo ${group.name}`}
              onClick={() => setSelectedGroup(group)}
              onKeyDown={(e) => {
                if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  setSelectedGroup(group);
                }
              }}
              className={`p-5 rounded-2xl bg-vx-surface border transition-all cursor-pointer relative group flex flex-col justify-between ${
                isSelected
                  ? 'border-vx-accent ring-1 ring-vx-accent'
                  : 'border-vx-border hover:border-vx-accent/40 hover:bg-vx-surface'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${
                        group.kind === 'smart'
                          ? 'bg-vx-accent/10 text-vx-accent border-vx-accent/30'
                          : 'bg-vx-info/10 text-vx-info border-vx-info/30'
                      }`}
                    >
                      {group.kind === 'smart' ? (
                        <Zap className="w-4 h-4" />
                      ) : (
                        <Users className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-vx-text group-hover:text-vx-accent transition-colors">
                        {group.name}
                      </h3>
                      <span className="text-xs tabular-nums text-vx-text-2/60 block">
                        {group.kind === 'smart'
                          ? `Por reglas (${group.match === 'all' ? 'todas' : 'alguna'})`
                          : 'Lista fija'}
                      </span>
                    </div>
                  </div>

                  <Badge tone={group.kind === 'smart' ? 'accent' : 'info'}>
                    {group.kind === 'smart' ? 'INTELIGENTE' : 'MANUAL'}
                  </Badge>
                </div>

                <p className="text-[13px] text-vx-text-2/75 line-clamp-2">
                  {group.description || 'Sin descripción asignada.'}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-vx-border flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[13px] tabular-nums">
                  <UserCheck className="w-4 h-4 text-vx-accent" />
                  <span className="text-vx-text font-bold">{members.length}</span>
                  <span className="text-vx-text-2/60">miembros</span>
                </div>

                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={(e) => handleOpenEditModal(group, e)}
                    title="Editar grupo"
                    aria-label={`Editar grupo ${group.name}`}
                    className="p-1.5 rounded-lg bg-vx-raised hover:bg-vx-raised text-vx-text-2 hover:text-vx-text border border-vx-border transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingGroup(group);
                    }}
                    title="Eliminar grupo"
                    aria-label={`Eliminar grupo ${group.name}`}
                    className="p-1.5 rounded-lg bg-vx-danger/10 hover:bg-vx-danger text-vx-danger hover:text-vx-text border border-vx-danger/20 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Detalle del Grupo Seleccionado (Lista de Miembros & Reglas) */}
      {selectedGroup && (
        <div className="bg-vx-surface border border-vx-accent/40 rounded-2xl shadow-2xl p-6 space-y-5 animate-fadeIn">
          {(() => {
            const currentGroup = groups.find((g) => g.id === selectedGroup.id) ?? selectedGroup;
            const currentMembers = getGroupMembers(currentGroup, agents, profiles);

            return (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-vx-border pb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
                        currentGroup.kind === 'smart'
                          ? 'bg-vx-accent/15 text-vx-accent border-vx-accent/30'
                          : 'bg-vx-info/15 text-vx-info border-vx-info/30'
                      }`}
                    >
                      {currentGroup.kind === 'smart' ? (
                        <Zap className="w-5 h-5" />
                      ) : (
                        <Users className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-vx-text">{currentGroup.name}</h2>
                        <Badge tone={currentGroup.kind === 'smart' ? 'accent' : 'info'}>
                          {currentGroup.kind === 'smart' ? 'INTELIGENTE' : 'MANUAL'}
                        </Badge>
                      </div>
                      <p className="text-[13px] text-vx-text-2/70 mt-0.5">{currentGroup.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button size="sm" icon={Edit2} onClick={() => handleOpenEditModal(currentGroup)}>
                      Editar
                    </Button>
                    <button
                      type="button"
                      onClick={() => setSelectedGroup(null)}
                      aria-label="Cerrar detalle del grupo"
                      className="p-1.5 rounded-lg text-vx-text-2 hover:text-vx-text hover:bg-white/5"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Si es Smart: mostrar reglas en lenguaje legible */}
                {currentGroup.kind === 'smart' && (
                  <div className="p-4 rounded-xl bg-vx-bg border border-vx-border space-y-2">
                    <div className="flex items-center gap-2 text-[13px] tabular-nums text-vx-accent">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>
                        Reglas de segmentación automática ({currentGroup.match === 'all' ? 'cumple todas' : 'cumple alguna'}):
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {currentGroup.rules.map((rule) => (
                        <span
                          key={rule.id}
                          className="px-2.5 py-1 rounded-lg bg-vx-raised border border-vx-border text-[13px] tabular-nums text-vx-text"
                        >
                          {formatRuleReadable(rule)}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-vx-text-2/50 pt-1">
                      * Este grupo es dinámico y de solo lectura. Los agentes entran o salen automáticamente según cumplan las condiciones.
                    </p>
                  </div>
                )}

                {/* Si es Manual: Selector para agregar miembros */}
                {currentGroup.kind === 'manual' && (
                  <div className="p-4 rounded-xl bg-vx-bg border border-vx-border space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[13px] tabular-nums text-vx-info font-bold">
                        Gestión de miembros:
                      </span>
                      <span className="text-xs text-vx-text-2/50 tabular-nums">
                        Haz clic en un agente para agregarlo o removerlo
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {agents.map((agent) => {
                        const isMember = currentGroup.memberIds.includes(agent.id);
                        return (
                          <button
                            key={agent.id}
                            type="button"
                            onClick={() => toggleGroupMember(currentGroup.id, agent.id)}
                            aria-pressed={isMember}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                              isMember
                                ? 'bg-vx-accent/20 text-vx-accent border border-vx-accent/40'
                                : 'bg-vx-raised/60 text-vx-text-2/60 border border-vx-border hover:text-vx-text'
                            }`}
                          >
                            {isMember ? (
                              <UserMinus className="w-3 h-3 text-vx-danger" />
                            ) : (
                              <UserPlus className="w-3 h-3 text-vx-accent" />
                            )}
                            <span>{agent.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Tabla de Miembros del Grupo */}
                <div className="space-y-2">
                  <h3 className="text-[13px] tabular-nums text-vx-text-2/70">
                    Miembros actuales ({currentMembers.length})
                  </h3>

                  <div className="overflow-x-auto rounded-xl border border-vx-border">
                    <table className="w-full text-left border-collapse text-[13px]">
                      <thead>
                        <tr className="border-b border-vx-border bg-vx-bg/60 text-xs tabular-nums text-vx-text-2/60">
                          <th className="py-2.5 px-4">Agente</th>
                          <th className="py-2.5 px-4">Código</th>
                          <th className="py-2.5 px-4">Campaña</th>
                          <th className="py-2.5 px-4">Nivel</th>
                          <th className="py-2.5 px-4">Estado operativo</th>
                          {currentGroup.kind === 'manual' && (
                            <th className="py-2.5 px-4 text-right">Acción</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-vx-border/40">
                        {currentMembers.length === 0 ? (
                          <tr>
                            <td
                              colSpan={currentGroup.kind === 'manual' ? 6 : 5}
                              className="py-8 text-center text-vx-text-2/50 tabular-nums"
                            >
                              Este grupo no tiene miembros que cumplan las condiciones actualmente.
                            </td>
                          </tr>
                        ) : (
                          currentMembers.map((agent) => {
                            const campaign = campaignMap.get(agent.campaignId);
                            return (
                              <tr
                                key={agent.id}
                                className="hover:bg-vx-raised/40 transition-colors"
                              >
                                <td className="py-2.5 px-4 font-semibold text-vx-text whitespace-nowrap">
                                  {agent.name}
                                </td>
                                <td className="py-2.5 px-4 tabular-nums text-vx-text-2">
                                  {agent.employeeCode}
                                </td>
                                <td className="py-2.5 px-4 text-vx-text-2">
                                  {campaign?.name ?? 'Sin Asignar'}
                                </td>
                                <td className="py-2.5 px-4 text-vx-text-2">
                                  {agent.level}
                                </td>
                                <td className="py-2.5 px-4">
                                  <Badge
                                    tone={
                                      agent.status === 'on_call'
                                        ? 'accent'
                                        : agent.status === 'available'
                                          ? 'success'
                                          : agent.status === 'break'
                                            ? 'warning'
                                            : 'neutral'
                                    }
                                  >
                                    {agent.status === 'on_call'
                                      ? 'En llamada'
                                      : agent.status === 'available'
                                        ? 'Disponible'
                                        : agent.status === 'break'
                                          ? 'En pausa'
                                          : 'Desconectado'}
                                  </Badge>
                                </td>
                                {currentGroup.kind === 'manual' && (
                                  <td className="py-2.5 px-4 text-right">
                                    <button
                                      type="button"
                                      onClick={() => toggleGroupMember(currentGroup.id, agent.id)}
                                      aria-label={`Quitar a ${agent.name} del grupo`}
                                      className="px-2 py-1 rounded bg-vx-danger/10 hover:bg-vx-danger text-vx-danger hover:text-vx-text border border-vx-danger/20 text-xs transition-colors"
                                    >
                                      Quitar
                                    </button>
                                  </td>
                                )}
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* 3. Modal Crear / Editar Grupo */}
      <Modal
        open={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        size="lg"
        title={editingGroupId ? 'Editar grupo' : 'Crear nuevo grupo'}
        description="Configura segmentación inteligente o asignación manual."
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsFormModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" form="group-form">
              {editingGroupId ? 'Guardar cambios' : 'Crear grupo'}
            </Button>
          </>
        }
      >
            {formError && (
              <div className="mb-4">
                <Notice tone="danger">{formError}</Notice>
              </div>
            )}

            <form id="group-form" onSubmit={handleSubmitForm} className="space-y-4 text-[13px]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Nombre del grupo">
                  <Input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ej: Bilingües, Supervisión, etc."
                  />
                </Field>

                <Field label="Tipo de grupo">
                  <Select value={formKind} onChange={(e) => setFormKind(e.target.value as GroupKind)}>
                    <option value="smart">Inteligente (reglas automáticas)</option>
                    <option value="manual">Manual (lista fija)</option>
                  </Select>
                </Field>
              </div>

              <Field label="Descripción">
                <Input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Ej: Agentes con nivel bilingüe asignados a cuentas globales"
                />
              </Field>

              {/* Si es Smart: Editor de Reglas */}
              {formKind === 'smart' && (
                <div className="p-4 rounded-xl bg-vx-bg border border-vx-border space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-vx-border pb-2">
                    <span className="font-semibold text-vx-text flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-vx-accent" />
                      Condición de coincidencia:
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setFormMatch('all')}
                        className={`px-3 py-1 rounded-lg text-[13px] font-semibold ${
                          formMatch === 'all'
                            ? 'bg-vx-accent text-vx-bg'
                            : 'bg-vx-raised text-vx-text-2'
                        }`}
                      >
                        Cumple todas
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormMatch('any')}
                        className={`px-3 py-1 rounded-lg text-[13px] font-semibold ${
                          formMatch === 'any'
                            ? 'bg-vx-accent text-vx-bg'
                            : 'bg-vx-raised text-vx-text-2'
                        }`}
                      >
                        Cumple alguna
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {formRules.map((rule) => (
                      <div
                        key={rule.id}
                        className="flex flex-wrap sm:flex-nowrap items-center gap-2 p-2 rounded-lg bg-vx-surface border border-vx-border"
                      >
                        {/* Campo */}
                        <select
                          value={rule.field}
                          aria-label="Campo de la regla"
                          onChange={(e) =>
                            handleUpdateRule(rule.id, e.target.value as RuleField)
                          }
                          className="bg-vx-bg border border-vx-border text-vx-text rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-vx-accent"
                        >
                          <option value="campaign">Campaña</option>
                          <option value="level">Nivel</option>
                          <option value="status">Estado</option>
                          <option value="role">Rol</option>
                          <option value="active">Activo</option>
                        </select>

                        {/* Operador */}
                        <select
                          value={rule.operator}
                          aria-label="Operador de la regla"
                          onChange={(e) =>
                            handleUpdateRuleOperator(
                              rule.id,
                              e.target.value as RuleOperator,
                            )
                          }
                          className="bg-vx-bg border border-vx-border text-vx-text rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-vx-accent"
                        >
                          <option value="is">es</option>
                          <option value="is_not">no es</option>
                          <option value="contains">contiene</option>
                        </select>

                        {/* Valor: Selects reales para campaña, estado, rol y activo */}
                        {rule.field === 'campaign' && (
                          <select
                            value={rule.value}
                            aria-label="Valor de la regla"
                            onChange={(e) => handleUpdateRuleValue(rule.id, e.target.value)}
                            className="flex-1 bg-vx-bg border border-vx-border text-vx-text rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-vx-accent"
                          >
                            {campaigns.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        )}

                        {rule.field === 'status' && (
                          <select
                            value={rule.value}
                            aria-label="Valor de la regla"
                            onChange={(e) => handleUpdateRuleValue(rule.id, e.target.value)}
                            className="flex-1 bg-vx-bg border border-vx-border text-vx-text rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-vx-accent"
                          >
                            <option value="on_call">En llamada</option>
                            <option value="available">Disponible</option>
                            <option value="break">En pausa</option>
                            <option value="offline">Desconectado</option>
                          </select>
                        )}

                        {rule.field === 'role' && (
                          <select
                            value={rule.value}
                            aria-label="Valor de la regla"
                            onChange={(e) => handleUpdateRuleValue(rule.id, e.target.value)}
                            className="flex-1 bg-vx-bg border border-vx-border text-vx-text rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-vx-accent"
                          >
                            <option value="agent">Agente</option>
                            <option value="supervisor">Supervisor</option>
                            <option value="admin">Administrador</option>
                          </select>
                        )}

                        {rule.field === 'active' && (
                          <select
                            value={rule.value}
                            aria-label="Valor de la regla"
                            onChange={(e) => handleUpdateRuleValue(rule.id, e.target.value)}
                            className="flex-1 bg-vx-bg border border-vx-border text-vx-text rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-vx-accent"
                          >
                            <option value="true">Activo</option>
                            <option value="false">Inactivo</option>
                          </select>
                        )}

                        {rule.field === 'level' && (
                          <input
                            type="text"
                            value={rule.value}
                            aria-label="Valor de la regla"
                            onChange={(e) => handleUpdateRuleValue(rule.id, e.target.value)}
                            placeholder="Ej: bilingüe, Senior QA"
                            className="flex-1 bg-vx-bg border border-vx-border text-vx-text rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-vx-accent"
                          />
                        )}

                        {formRules.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveRule(rule.id)}
                            aria-label="Quitar regla"
                            className="p-1.5 rounded-lg text-vx-danger hover:bg-vx-danger/10"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleAddRule}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-vx-raised hover:bg-vx-raised text-[13px] font-semibold text-vx-text border border-vx-border transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-vx-accent" />
                    <span>Agregar otra regla</span>
                  </button>
                </div>
              )}

              {/* Vista Previa en Vivo de Miembros */}
              <div className="p-3.5 rounded-xl bg-vx-bg border border-vx-accent/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] tabular-nums text-vx-accent font-semibold flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5" />
                    Vista previa en vivo ({livePreviewMembers.length} coinciden):
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {livePreviewMembers.length === 0 ? (
                    <span className="text-xs text-vx-text-2/50 tabular-nums italic">
                      Ningún agente coincide con estas reglas en este momento.
                    </span>
                  ) : (
                    livePreviewMembers.map((m) => (
                      <span
                        key={m.id}
                        className="px-2 py-0.5 rounded bg-vx-raised text-vx-accent border border-vx-border text-xs tabular-nums"
                      >
                        {m.name}
                      </span>
                    ))
                  )}
                </div>
              </div>

            </form>
      </Modal>

      {/* 4. Modal Confirmación de Eliminación */}
      <Modal
        open={deletingGroup !== null}
        onClose={() => setDeletingGroup(null)}
        title="¿Eliminar este grupo?"
        description={deletingGroup ? `Esta acción eliminará el grupo "${deletingGroup.name}".` : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeletingGroup(null)}>
              Cancelar
            </Button>
            <Button variant="danger" icon={Trash2} onClick={handleConfirmDelete}>
              Confirmar y eliminar
            </Button>
          </>
        }
      >
        <p className="text-[13px] text-vx-text-2/80">
          Los agentes pertenecientes no se eliminarán del sistema, únicamente se desvinculará este agrupador.
        </p>
      </Modal>
    </div>
  );
};
