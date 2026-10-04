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
        on_call: 'En llamada (on_call)',
        available: 'Disponible',
        break: 'En descanso (break)',
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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-[#13151c] border border-[#242E3B] rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-[#66FCF1]/5 to-transparent pointer-events-none" />

        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-[#66FCF1]/10 text-[#66FCF1] border border-[#66FCF1]/30">
              USERS & GROUPS
            </span>
            <span className="text-xs text-[#C5C6C7]/50 font-mono">
              Segmentación Inteligente & Grupos Dinámicos
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Layers className="w-7 h-7 text-[#66FCF1]" />
            <span>Smart Groups & Equipos</span>
          </h1>
          <p className="text-sm text-[#C5C6C7]/80">
            Grupos inteligentes automáticos calculados por reglas operativas y listas manuales.
          </p>
        </div>

        {/* Acciones */}
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#66FCF1] hover:bg-[#52e0d6] text-[#0B0C10] text-xs font-bold transition-all shadow-[0_0_16px_rgba(102,252,241,0.25)] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Grupo</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (window.confirm('¿Reiniciar todos los datos de demostración? Se restablecerán asistencias, usuarios, turnos y llamadas a su estado inicial.')) {
                resetApplicationState();
              }
            }}
            title="Reiniciar todos los datos de prueba"
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
            placeholder="Buscar grupo por nombre o descripción..."
            className="w-full bg-[#0B0C10] border border-[#242E3B] text-xs text-white rounded-xl pl-9 pr-3 py-2 placeholder:text-[#C5C6C7]/40 focus:outline-none focus:border-[#66FCF1]"
          />
        </div>

        {/* Filtro por Tipo */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#C5C6C7]/60 font-mono">Tipo:</span>
          <div className="flex items-center gap-1 bg-[#0B0C10] p-1 rounded-xl border border-[#242E3B]">
            <button
              type="button"
              onClick={() => setSelectedKind('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedKind === 'all'
                  ? 'bg-[#66FCF1] text-[#0B0C10]'
                  : 'text-[#C5C6C7]/70 hover:text-white'
              }`}
            >
              Todos ({groups.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedKind('smart')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedKind === 'smart'
                  ? 'bg-[#66FCF1] text-[#0B0C10]'
                  : 'text-[#C5C6C7]/70 hover:text-white'
              }`}
            >
              Smart ({groups.filter((g) => g.kind === 'smart').length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedKind('manual')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedKind === 'manual'
                  ? 'bg-[#66FCF1] text-[#0B0C10]'
                  : 'text-[#C5C6C7]/70 hover:text-white'
              }`}
            >
              Manual ({groups.filter((g) => g.kind === 'manual').length})
            </button>
          </div>
        </div>
      </div>

      {/* 1. Tarjetas de Grupos (Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGroups.map((group) => {
          const members = getGroupMembers(group, agents, profiles);
          const isSelected = selectedGroup?.id === group.id;

          return (
            <div
              key={group.id}
              onClick={() => setSelectedGroup(group)}
              className={`p-5 rounded-2xl bg-[#13151c] border transition-all cursor-pointer relative group flex flex-col justify-between ${
                isSelected
                  ? 'border-[#66FCF1] shadow-[0_0_20px_rgba(102,252,241,0.15)] ring-1 ring-[#66FCF1]'
                  : 'border-[#242E3B] hover:border-[#66FCF1]/40 hover:bg-[#151821]'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${
                        group.kind === 'smart'
                          ? 'bg-[#66FCF1]/10 text-[#66FCF1] border-[#66FCF1]/30'
                          : 'bg-[#A78BFA]/10 text-[#A78BFA] border-[#A78BFA]/30'
                      }`}
                    >
                      {group.kind === 'smart' ? (
                        <Zap className="w-4 h-4" />
                      ) : (
                        <Users className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-[#66FCF1] transition-colors">
                        {group.name}
                      </h3>
                      <span className="text-[10px] font-mono text-[#C5C6C7]/60 block">
                        {group.kind === 'smart'
                          ? `Smart (${group.match === 'all' ? 'Todas' : 'Alguna'})`
                          : 'Manual (Fija)'}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border uppercase ${
                      group.kind === 'smart'
                        ? 'bg-[#66FCF1]/15 text-[#66FCF1] border-[#66FCF1]/30'
                        : 'bg-[#A78BFA]/15 text-[#A78BFA] border-[#A78BFA]/30'
                    }`}
                  >
                    {group.kind}
                  </span>
                </div>

                <p className="text-xs text-[#C5C6C7]/75 line-clamp-2">
                  {group.description || 'Sin descripción asignada.'}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-[#242E3B] flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-mono">
                  <UserCheck className="w-4 h-4 text-[#66FCF1]" />
                  <span className="text-white font-bold">{members.length}</span>
                  <span className="text-[#C5C6C7]/60">miembros</span>
                </div>

                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={(e) => handleOpenEditModal(group, e)}
                    title="Editar grupo"
                    className="p-1.5 rounded-lg bg-[#1F2833] hover:bg-[#253240] text-[#C5C6C7] hover:text-white border border-[#242E3B] transition-colors"
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
                    className="p-1.5 rounded-lg bg-[#EF4444]/10 hover:bg-[#EF4444] text-[#EF4444] hover:text-white border border-[#EF4444]/20 transition-colors"
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
        <div className="bg-[#13151c] border border-[#66FCF1]/40 rounded-2xl shadow-2xl p-6 space-y-5 animate-fadeIn">
          {(() => {
            const currentGroup = groups.find((g) => g.id === selectedGroup.id) ?? selectedGroup;
            const currentMembers = getGroupMembers(currentGroup, agents, profiles);

            return (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#242E3B] pb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
                        currentGroup.kind === 'smart'
                          ? 'bg-[#66FCF1]/15 text-[#66FCF1] border-[#66FCF1]/30'
                          : 'bg-[#A78BFA]/15 text-[#A78BFA] border-[#A78BFA]/30'
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
                        <h2 className="text-lg font-bold text-white">{currentGroup.name}</h2>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#1F2833] text-[#66FCF1] border border-[#242E3B]">
                          {currentGroup.kind}
                        </span>
                      </div>
                      <p className="text-xs text-[#C5C6C7]/70 mt-0.5">{currentGroup.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(currentGroup)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1F2833] hover:bg-[#253240] text-xs font-semibold text-white border border-[#242E3B] transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedGroup(null)}
                      className="p-1.5 rounded-lg text-[#C5C6C7] hover:text-white hover:bg-white/5"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Si es Smart: mostrar reglas en lenguaje legible */}
                {currentGroup.kind === 'smart' && (
                  <div className="p-4 rounded-xl bg-[#0B0C10] border border-[#242E3B] space-y-2">
                    <div className="flex items-center gap-2 text-xs font-mono text-[#66FCF1]">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>
                        Reglas de segmentación automática ({currentGroup.match === 'all' ? 'Cumple TODAS' : 'Cumple ALGUNA'}):
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {currentGroup.rules.map((rule) => (
                        <span
                          key={rule.id}
                          className="px-2.5 py-1 rounded-lg bg-[#1F2833] border border-[#242E3B] text-xs font-mono text-white"
                        >
                          {formatRuleReadable(rule)}
                        </span>
                      ))}
                    </div>
                    <p className="text-[11px] text-[#C5C6C7]/50 pt-1">
                      * Este grupo es dinámico y de solo lectura. Los agentes entran o salen automáticamente según cumplan las condiciones.
                    </p>
                  </div>
                )}

                {/* Si es Manual: Selector para agregar miembros */}
                {currentGroup.kind === 'manual' && (
                  <div className="p-4 rounded-xl bg-[#0B0C10] border border-[#242E3B] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-[#A78BFA] font-bold">
                        Gestión de Miembros Manuales:
                      </span>
                      <span className="text-[11px] text-[#C5C6C7]/50 font-mono">
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
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              isMember
                                ? 'bg-[#66FCF1]/20 text-[#66FCF1] border border-[#66FCF1]/40'
                                : 'bg-[#1F2833]/60 text-[#C5C6C7]/60 border border-[#242E3B] hover:text-white'
                            }`}
                          >
                            {isMember ? (
                              <UserMinus className="w-3 h-3 text-[#EF4444]" />
                            ) : (
                              <UserPlus className="w-3 h-3 text-[#66FCF1]" />
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
                  <h3 className="text-xs font-mono text-[#C5C6C7]/70 uppercase tracking-wider">
                    Miembros Actuales ({currentMembers.length})
                  </h3>

                  <div className="overflow-x-auto rounded-xl border border-[#242E3B]">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[#242E3B] bg-[#0B0C10]/60 text-[11px] font-mono text-[#C5C6C7]/60 uppercase">
                          <th className="py-2.5 px-4">Agente</th>
                          <th className="py-2.5 px-4">Código</th>
                          <th className="py-2.5 px-4">Campaña</th>
                          <th className="py-2.5 px-4">Nivel</th>
                          <th className="py-2.5 px-4">Estado Operativo</th>
                          {currentGroup.kind === 'manual' && (
                            <th className="py-2.5 px-4 text-right">Acción</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#242E3B]/40">
                        {currentMembers.length === 0 ? (
                          <tr>
                            <td
                              colSpan={currentGroup.kind === 'manual' ? 6 : 5}
                              className="py-8 text-center text-[#C5C6C7]/50 font-mono"
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
                                className="hover:bg-[#1A202C]/40 transition-colors"
                              >
                                <td className="py-2.5 px-4 font-semibold text-white">
                                  {agent.name}
                                </td>
                                <td className="py-2.5 px-4 font-mono text-[#C5C6C7]">
                                  {agent.employeeCode}
                                </td>
                                <td className="py-2.5 px-4 text-[#C5C6C7]">
                                  {campaign?.name ?? 'Sin Asignar'}
                                </td>
                                <td className="py-2.5 px-4 text-[#C5C6C7]">
                                  {agent.level}
                                </td>
                                <td className="py-2.5 px-4">
                                  <span
                                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono ${
                                      agent.status === 'on_call'
                                        ? 'bg-[#38BDF8]/15 text-[#38BDF8]'
                                        : agent.status === 'available'
                                          ? 'bg-[#10B981]/15 text-[#10B981]'
                                          : agent.status === 'break'
                                            ? 'bg-[#F59E0B]/15 text-[#F59E0B]'
                                            : 'bg-[#C5C6C7]/10 text-[#C5C6C7]/60'
                                    }`}
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        agent.status === 'on_call'
                                          ? 'bg-[#38BDF8]'
                                          : agent.status === 'available'
                                            ? 'bg-[#10B981]'
                                            : agent.status === 'break'
                                              ? 'bg-[#F59E0B]'
                                              : 'bg-[#C5C6C7]/40'
                                      }`}
                                    />
                                    {agent.status}
                                  </span>
                                </td>
                                {currentGroup.kind === 'manual' && (
                                  <td className="py-2.5 px-4 text-right">
                                    <button
                                      type="button"
                                      onClick={() => toggleGroupMember(currentGroup.id, agent.id)}
                                      className="px-2 py-1 rounded bg-[#EF4444]/10 hover:bg-[#EF4444] text-[#EF4444] hover:text-white border border-[#EF4444]/20 text-[11px] transition-colors"
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
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#13151c] border border-[#242E3B] rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#242E3B] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#66FCF1]/15 text-[#66FCF1] flex items-center justify-center border border-[#66FCF1]/30">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingGroupId ? 'Editar Grupo' : 'Crear Nuevo Grupo'}
                  </h3>
                  <p className="text-[11px] text-[#C5C6C7]/60">
                    Configura segmentación inteligente o asignación manual.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="p-1 rounded-lg text-[#C5C6C7] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#C5C6C7] font-medium mb-1">Nombre del Grupo</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ej: Bilingües, Supervisión, etc."
                    className="w-full bg-[#0B0C10] border border-[#242E3B] text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#66FCF1]"
                  />
                </div>

                <div>
                  <label className="block text-[#C5C6C7] font-medium mb-1">Tipo de Grupo</label>
                  <select
                    value={formKind}
                    onChange={(e) => setFormKind(e.target.value as GroupKind)}
                    className="w-full bg-[#0B0C10] border border-[#242E3B] text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#66FCF1]"
                  >
                    <option value="smart">Smart (Reglas Automáticas)</option>
                    <option value="manual">Manual (Lista Fija)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#C5C6C7] font-medium mb-1">Descripción</label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Ej: Agentes con nivel bilingüe asignados a cuentas globales"
                  className="w-full bg-[#0B0C10] border border-[#242E3B] text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#66FCF1]"
                />
              </div>

              {/* Si es Smart: Editor de Reglas */}
              {formKind === 'smart' && (
                <div className="p-4 rounded-xl bg-[#0B0C10] border border-[#242E3B] space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#242E3B] pb-2">
                    <span className="font-semibold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#66FCF1]" />
                      Condición de Coincidencia:
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setFormMatch('all')}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                          formMatch === 'all'
                            ? 'bg-[#66FCF1] text-[#0B0C10]'
                            : 'bg-[#1F2833] text-[#C5C6C7]'
                        }`}
                      >
                        Cumple TODAS (AND)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormMatch('any')}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                          formMatch === 'any'
                            ? 'bg-[#66FCF1] text-[#0B0C10]'
                            : 'bg-[#1F2833] text-[#C5C6C7]'
                        }`}
                      >
                        Cumple ALGUNA (OR)
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {formRules.map((rule) => (
                      <div
                        key={rule.id}
                        className="flex flex-wrap sm:flex-nowrap items-center gap-2 p-2 rounded-lg bg-[#13151c] border border-[#242E3B]"
                      >
                        {/* Campo */}
                        <select
                          value={rule.field}
                          onChange={(e) =>
                            handleUpdateRule(rule.id, e.target.value as RuleField)
                          }
                          className="bg-[#0B0C10] border border-[#242E3B] text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#66FCF1]"
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
                          onChange={(e) =>
                            handleUpdateRuleOperator(
                              rule.id,
                              e.target.value as RuleOperator,
                            )
                          }
                          className="bg-[#0B0C10] border border-[#242E3B] text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#66FCF1]"
                        >
                          <option value="is">es</option>
                          <option value="is_not">no es</option>
                          <option value="contains">contiene</option>
                        </select>

                        {/* Valor: Selects reales para campaña, estado, rol y activo */}
                        {rule.field === 'campaign' && (
                          <select
                            value={rule.value}
                            onChange={(e) => handleUpdateRuleValue(rule.id, e.target.value)}
                            className="flex-1 bg-[#0B0C10] border border-[#242E3B] text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#66FCF1]"
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
                            onChange={(e) => handleUpdateRuleValue(rule.id, e.target.value)}
                            className="flex-1 bg-[#0B0C10] border border-[#242E3B] text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#66FCF1]"
                          >
                            <option value="on_call">En llamada (on_call)</option>
                            <option value="available">Disponible</option>
                            <option value="break">En descanso (break)</option>
                            <option value="offline">Desconectado (offline)</option>
                          </select>
                        )}

                        {rule.field === 'role' && (
                          <select
                            value={rule.value}
                            onChange={(e) => handleUpdateRuleValue(rule.id, e.target.value)}
                            className="flex-1 bg-[#0B0C10] border border-[#242E3B] text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#66FCF1]"
                          >
                            <option value="agent">Agente</option>
                            <option value="supervisor">Supervisor</option>
                            <option value="admin">Administrador</option>
                          </select>
                        )}

                        {rule.field === 'active' && (
                          <select
                            value={rule.value}
                            onChange={(e) => handleUpdateRuleValue(rule.id, e.target.value)}
                            className="flex-1 bg-[#0B0C10] border border-[#242E3B] text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#66FCF1]"
                          >
                            <option value="true">Activo</option>
                            <option value="false">Inactivo</option>
                          </select>
                        )}

                        {rule.field === 'level' && (
                          <input
                            type="text"
                            value={rule.value}
                            onChange={(e) => handleUpdateRuleValue(rule.id, e.target.value)}
                            placeholder="Ej: bilingüe, Senior QA"
                            className="flex-1 bg-[#0B0C10] border border-[#242E3B] text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#66FCF1]"
                          />
                        )}

                        {formRules.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveRule(rule.id)}
                            className="p-1.5 rounded-lg text-[#EF4444] hover:bg-[#EF4444]/10"
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
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1F2833] hover:bg-[#253240] text-xs font-semibold text-white border border-[#242E3B] transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#66FCF1]" />
                    <span>Agregar otra regla</span>
                  </button>
                </div>
              )}

              {/* Vista Previa en Vivo de Miembros */}
              <div className="p-3.5 rounded-xl bg-[#0B0C10] border border-[#66FCF1]/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-[#66FCF1] font-semibold flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5" />
                    Vista Previa en Vivo ({livePreviewMembers.length} coinciden):
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {livePreviewMembers.length === 0 ? (
                    <span className="text-[11px] text-[#C5C6C7]/50 font-mono italic">
                      Ningún agente coincide con estas reglas en este momento.
                    </span>
                  ) : (
                    livePreviewMembers.map((m) => (
                      <span
                        key={m.id}
                        className="px-2 py-0.5 rounded bg-[#1F2833] text-[#66FCF1] border border-[#242E3B] text-[11px] font-mono"
                      >
                        {m.name}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Botones */}
              <div className="pt-3 border-t border-[#242E3B] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#C5C6C7] hover:text-white bg-[#1F2833] hover:bg-[#253240]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-[#0B0C10] bg-[#66FCF1] hover:bg-[#52e0d6] shadow-[0_0_12px_rgba(102,252,241,0.25)]"
                >
                  {editingGroupId ? 'Guardar Cambios' : 'Crear Grupo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Modal Confirmación de Eliminación */}
      {deletingGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#13151c] border border-[#EF4444]/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#EF4444]/15 text-[#EF4444] flex items-center justify-center border border-[#EF4444]/30">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">¿Eliminar este grupo?</h3>
                <p className="text-xs text-[#C5C6C7]/70">
                  Esta acción eliminará el grupo "{deletingGroup.name}".
                </p>
              </div>
            </div>

            <p className="text-xs text-[#C5C6C7]/80">
              Los agentes pertenecientes no se eliminarán del sistema, únicamente se desvinculará este agrupador.
            </p>

            <div className="pt-3 border-t border-[#242E3B] flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingGroup(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#C5C6C7] hover:text-white bg-[#1F2833] hover:bg-[#253240]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#EF4444] hover:bg-[#dc2626] shadow-[0_0_12px_rgba(239,68,68,0.3)]"
              >
                Confirmar y Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
