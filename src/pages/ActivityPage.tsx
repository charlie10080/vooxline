import React, { useState, useMemo } from 'react';
import type { ActivityCategory, ActivityEvent } from '@/types/activity';
import { useActivityStore } from '@/store/useActivityStore';
import { useWorkforceStore } from '@/store/useWorkforceStore';
import {
  Activity,
  Clock,
  CalendarOff,
  Users,
  CalendarDays,
  PhoneCall,
  Headphones,
  Cpu,
  Search,
  User,
  Trash2,
  AlertTriangle,
  X,
  Filter,
  Check,
  RotateCcw,
} from 'lucide-react';

interface CategoryConfig {
  key: ActivityCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotColor: string;
}

const CATEGORIES: CategoryConfig[] = [
  {
    key: 'attendance',
    label: 'Asistencia',
    icon: Clock,
    badgeBg: 'bg-[#10B981]/10',
    badgeText: 'text-[#10B981]',
    badgeBorder: 'border-[#10B981]/30',
    dotColor: 'bg-[#10B981]',
  },
  {
    key: 'time_off',
    label: 'Permisos',
    icon: CalendarOff,
    badgeBg: 'bg-[#F59E0B]/10',
    badgeText: 'text-[#F59E0B]',
    badgeBorder: 'border-[#F59E0B]/30',
    dotColor: 'bg-[#F59E0B]',
  },
  {
    key: 'users',
    label: 'Usuarios',
    icon: Users,
    badgeBg: 'bg-[#A855F7]/10',
    badgeText: 'text-[#A855F7]',
    badgeBorder: 'border-[#A855F7]/30',
    dotColor: 'bg-[#A855F7]',
  },
  {
    key: 'schedule',
    label: 'Turnos',
    icon: CalendarDays,
    badgeBg: 'bg-[#38BDF8]/10',
    badgeText: 'text-[#38BDF8]',
    badgeBorder: 'border-[#38BDF8]/30',
    dotColor: 'bg-[#38BDF8]',
  },
  {
    key: 'calls',
    label: 'Llamadas',
    icon: PhoneCall,
    badgeBg: 'bg-[#66FCF1]/10',
    badgeText: 'text-[#66FCF1]',
    badgeBorder: 'border-[#66FCF1]/30',
    dotColor: 'bg-[#66FCF1]',
  },
  {
    key: 'supervision',
    label: 'Supervisión',
    icon: Headphones,
    badgeBg: 'bg-[#EF4444]/10',
    badgeText: 'text-[#EF4444]',
    badgeBorder: 'border-[#EF4444]/30',
    dotColor: 'bg-[#EF4444]',
  },
  {
    key: 'system',
    label: 'Sistema',
    icon: Cpu,
    badgeBg: 'bg-[#1F2833]',
    badgeText: 'text-[#C5C6C7]',
    badgeBorder: 'border-[#242E3B]',
    dotColor: 'bg-[#C5C6C7]',
  },
];

const CATEGORY_MAP = new Map(CATEGORIES.map((c) => [c.key, c]));

function getDayGroupLabel(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();

  const dY = date.getFullYear();
  const dM = date.getMonth();
  const dD = date.getDate();

  const nY = now.getFullYear();
  const nM = now.getMonth();
  const nD = now.getDate();

  if (dY === nY && dM === nM && dD === nD) {
    return 'Hoy';
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (
    dY === yesterday.getFullYear() &&
    dM === yesterday.getMonth() &&
    dD === yesterday.getDate()
  ) {
    return 'Ayer';
  }

  const formatted = new Intl.DateTimeFormat('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function formatTime(isoDate: string): string {
  return new Date(isoDate).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export const ActivityPage: React.FC = () => {
  const { events, clearActivity } = useActivityStore();
  const { agents } = useWorkforceStore();

  // Filtros: Categorías (Llamadas APAGADO por defecto, los demás encendidos)
  const [selectedCategories, setSelectedCategories] = useState<Record<ActivityCategory, boolean>>({
    attendance: true,
    time_off: true,
    users: true,
    schedule: true,
    calls: false, // Apagado por defecto por volumen de simulación
    supervision: true,
    system: true,
  });

  const [selectedAgentId, setSelectedAgentId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [confirmClearOpen, setConfirmClearOpen] = useState<boolean>(false);

  const toggleCategory = (cat: ActivityCategory) => {
    setSelectedCategories((prev) => ({
      ...prev,
      [cat]: !prev[cat],
    }));
  };

  const handleSelectAllCategories = (enabled: boolean) => {
    setSelectedCategories({
      attendance: enabled,
      time_off: enabled,
      users: enabled,
      schedule: enabled,
      calls: enabled,
      supervision: enabled,
      system: enabled,
    });
  };

  const handleResetFilters = () => {
    setSelectedCategories({
      attendance: true,
      time_off: true,
      users: true,
      schedule: true,
      calls: false,
      supervision: true,
      system: true,
    });
    setSelectedAgentId('all');
    setSearchQuery('');
  };

  // Filtrado de eventos
  const filteredEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return events.filter((ev) => {
      // 1. Categoría
      if (!selectedCategories[ev.category]) return false;

      // 2. Agente
      if (selectedAgentId !== 'all') {
        if (ev.agentId !== selectedAgentId) return false;
      }

      // 3. Búsqueda de texto sobre el mensaje
      if (q && !ev.message.toLowerCase().includes(q)) {
        return false;
      }

      return true;
    });
  }, [events, selectedCategories, selectedAgentId, searchQuery]);

  // Agrupamiento cronológico por día
  const groupedEvents = useMemo(() => {
    const groups: { dayLabel: string; items: ActivityEvent[] }[] = [];
    let currentLabel = '';
    let currentItems: ActivityEvent[] = [];

    for (const ev of filteredEvents) {
      const label = getDayGroupLabel(ev.at);
      if (label !== currentLabel) {
        if (currentItems.length > 0) {
          groups.push({ dayLabel: currentLabel, items: currentItems });
        }
        currentLabel = label;
        currentItems = [ev];
      } else {
        currentItems.push(ev);
      }
    }

    if (currentItems.length > 0) {
      groups.push({ dayLabel: currentLabel, items: currentItems });
    }

    return groups;
  }, [filteredEvents]);

  const activeCategoryCount = Object.values(selectedCategories).filter(Boolean).length;
  const isCallsActive = selectedCategories.calls;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-[#13151c] border border-[#242E3B] rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-[#66FCF1]/5 to-transparent pointer-events-none" />

        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-[#66FCF1]/10 text-[#66FCF1] border border-[#66FCF1]/30">
              GENERAL
            </span>
            <span className="text-xs text-[#C5C6C7]/50 font-mono">
              Bitácora Unificada & Trazabilidad de Auditoría
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Activity className="w-7 h-7 text-[#66FCF1]" />
            <span>Activity</span>
          </h1>
          <p className="text-sm text-[#C5C6C7]/80">
            Registro cronológico en tiempo real de operaciones, asistencias, turnos, llamadas y cambios de estado.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <div className="px-3.5 py-2 rounded-xl bg-[#0B0C10] border border-[#242E3B] text-xs font-mono text-[#C5C6C7]/80">
            Total en buffer:{' '}
            <strong className="text-white font-bold">{events.length}</strong> / 300
          </div>

          {events.length > 0 && (
            <button
              type="button"
              onClick={() => setConfirmClearOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#EF4444]/10 hover:bg-[#EF4444] text-[#EF4444] hover:text-white border border-[#EF4444]/30 transition-all font-mono"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpiar historial</span>
            </button>
          )}
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-[#13151c] border border-[#242E3B] rounded-2xl p-5 shadow-xl space-y-4">
        {/* Fila 1: Búsqueda de texto y selector de agente */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Buscador */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-[#C5C6C7]/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar en la descripción de los eventos (ej. Sofía, vacaciones, turno)..."
              className="w-full pl-10 pr-9 py-2 rounded-xl bg-[#0B0C10] border border-[#242E3B] text-xs text-white placeholder-[#C5C6C7]/40 focus:outline-none focus:border-[#66FCF1]/50 font-mono transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#C5C6C7]/50 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Selector de agente */}
          <div className="relative">
            <User className="w-4 h-4 text-[#C5C6C7]/50 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#0B0C10] border border-[#242E3B] text-xs text-white focus:outline-none focus:border-[#66FCF1]/50 font-mono appearance-none transition-colors cursor-pointer"
            >
              <option value="all">Todos los agentes ({agents.length})</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.employeeCode})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Fila 2: Chips de categorías */}
        <div className="pt-2 border-t border-[#242E3B]/60 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-mono text-[#C5C6C7]/70">
              <Filter className="w-3.5 h-3.5 text-[#66FCF1]" />
              <span>Filtrar por categoría ({activeCategoryCount} activas):</span>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono">
              <button
                type="button"
                onClick={() => handleSelectAllCategories(true)}
                className="text-[#66FCF1] hover:underline"
              >
                Activar todas
              </button>
              <span className="text-[#C5C6C7]/30">•</span>
              <button
                type="button"
                onClick={() => handleSelectAllCategories(false)}
                className="text-[#C5C6C7]/60 hover:text-white"
              >
                Desactivar todas
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategories[cat.key];

              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => toggleCategory(cat.key)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all border ${
                    isActive
                      ? `${cat.badgeBg} ${cat.badgeText} ${cat.badgeBorder} shadow-[0_0_10px_rgba(0,0,0,0.2)]`
                      : 'bg-[#0B0C10]/60 text-[#C5C6C7]/40 border-[#242E3B] hover:text-[#C5C6C7] hover:border-[#242E3B]/80'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? cat.badgeText : 'text-[#C5C6C7]/40'}`} />
                  <span>{cat.label}</span>
                  {isActive && <Check className="w-3 h-3 ml-0.5 opacity-80" />}
                </button>
              );
            })}
          </div>

          {!isCallsActive && (
            <p className="text-[11px] text-[#C5C6C7]/50 font-mono italic pt-1">
              Nota: el filtro de <strong>Llamadas</strong> está desactivado por defecto para evitar saturación por eventos del simulador en vivo. Actívalo para inspeccionar el flujo telefónico.
            </p>
          )}
        </div>

        {/* Resumen de conteo */}
        <div className="pt-2 border-t border-[#242E3B]/60 flex items-center justify-between text-xs font-mono text-[#C5C6C7]/60">
          <span>
            Mostrando <strong className="text-white">{filteredEvents.length}</strong> de{' '}
            <strong className="text-white">{events.length}</strong> eventos registrados
          </span>
          {(searchQuery || selectedAgentId !== 'all' || !isCallsActive) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-[11px] text-[#66FCF1] hover:underline"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restablecer filtros</span>
            </button>
          )}
        </div>
      </div>

      {/* Lista de Eventos Agrupados por Día */}
      {events.length === 0 ? (
        // Estado vacío global: aún no hay eventos
        <div className="bg-[#13151c] border border-[#242E3B] rounded-2xl p-12 text-center shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#66FCF1]/10 text-[#66FCF1] flex items-center justify-center mx-auto border border-[#66FCF1]/20">
            <Activity className="w-8 h-8 animate-pulse" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-base font-bold text-white">
              Aún no hay actividad: haz una acción en la app y aparecerá aquí
            </h3>
            <p className="text-xs text-[#C5C6C7]/70">
              El observador de actividad se encuentra activo escuchando todos los cambios de asistencia, turnos, nómina, permisos y supervisión.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap justify-center gap-2 text-xs font-mono text-[#C5C6C7]/50">
            <span className="px-2.5 py-1 rounded-lg bg-[#0B0C10] border border-[#242E3B]">
              Marcajes en Time Clock
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-[#0B0C10] border border-[#242E3B]">
              Aprobaciones de permisos
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-[#0B0C10] border border-[#242E3B]">
              Turnos en Job Scheduling
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-[#0B0C10] border border-[#242E3B]">
              Llamadas en Monitor en Vivo
            </span>
          </div>
        </div>
      ) : filteredEvents.length === 0 ? (
        // Estado vacío por filtros
        <div className="bg-[#13151c] border border-[#242E3B] rounded-2xl p-10 text-center shadow-xl space-y-3">
          <div className="w-12 h-12 rounded-xl bg-[#1F2833] text-[#C5C6C7] flex items-center justify-center mx-auto border border-[#242E3B]">
            <Search className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">
              No se encontraron eventos con los filtros seleccionados
            </h3>
            <p className="text-xs text-[#C5C6C7]/60">
              Prueba cambiando las categorías seleccionadas, el agente o el término de búsqueda.
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3.5 py-1.5 rounded-xl text-xs font-mono font-semibold bg-[#66FCF1] text-[#0B0C10] hover:bg-[#66FCF1]/90 transition-colors"
            >
              Restablecer filtros
            </button>
          </div>
        </div>
      ) : (
        // Lista cronológica con grupos de día
        <div className="space-y-6">
          {groupedEvents.map((group) => (
            <div key={group.dayLabel} className="space-y-3">
              {/* Encabezado del día */}
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-lg bg-[#1F2833] text-xs font-bold font-mono text-white border border-[#242E3B] uppercase tracking-wider">
                  {group.dayLabel}
                </span>
                <div className="h-px bg-gradient-to-r from-[#242E3B] to-transparent flex-1" />
                <span className="text-[11px] font-mono text-[#C5C6C7]/50">
                  {group.items.length} {group.items.length === 1 ? 'evento' : 'eventos'}
                </span>
              </div>

              {/* Tarjetas de eventos */}
              <div className="bg-[#13151c] border border-[#242E3B] rounded-2xl divide-y divide-[#242E3B]/60 shadow-xl overflow-hidden">
                {group.items.map((ev) => {
                  const cfg = CATEGORY_MAP.get(ev.category) ?? CATEGORIES[0];
                  const Icon = cfg.icon;

                  return (
                    <div
                      key={ev.id}
                      className="p-4 flex items-start sm:items-center justify-between gap-3 hover:bg-[#1A202C]/40 transition-colors"
                    >
                      <div className="flex items-start sm:items-center gap-3.5">
                        {/* Ícono de categoría */}
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${cfg.badgeBg} ${cfg.badgeBorder} ${cfg.badgeText}`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>

                        {/* Mensaje & detalles */}
                        <div className="space-y-0.5">
                          <div className="text-sm font-medium text-white flex flex-wrap items-center gap-2">
                            <span>{ev.message}</span>
                          </div>

                          <div className="flex items-center gap-2 text-xs font-mono text-[#C5C6C7]/50">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${cfg.badgeBg} ${cfg.badgeText} ${cfg.badgeBorder}`}
                            >
                              {cfg.label}
                            </span>
                            <span>•</span>
                            <span>{formatTime(ev.at)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Hora a la derecha para pantallas medianas/grandes */}
                      <div className="hidden sm:block text-right shrink-0">
                        <span className="text-xs font-mono text-[#C5C6C7]/60">
                          {formatTime(ev.at)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de confirmación: Limpiar Historial */}
      {confirmClearOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#13151c] border border-[#EF4444]/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#242E3B] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#EF4444]/20 text-[#EF4444] flex items-center justify-center border border-[#EF4444]/40">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Confirmar Limpieza</h3>
                  <p className="text-[11px] text-[#EF4444] font-mono">Acción destructiva de historial</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmClearOpen(false)}
                className="p-1 rounded-lg text-[#C5C6C7] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 space-y-2 text-xs text-[#C5C6C7]">
              <p className="text-white font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-[#EF4444] shrink-0" />
                <span>¿Estás seguro de vaciar la bitácora de actividad?</span>
              </p>
              <p>
                Se eliminarán permanentemente los <strong>{events.length}</strong> eventos registrados en la memoria local del navegador.
              </p>
              <p className="text-[11px] text-[#C5C6C7]/60 italic font-mono pt-1 border-t border-[#EF4444]/20">
                El observador continuará activo y registrará los nuevos eventos a partir de este momento.
              </p>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmClearOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#C5C6C7] hover:text-white bg-[#1F2833] hover:bg-[#253240]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  clearActivity();
                  setConfirmClearOpen(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#EF4444] hover:bg-[#dc2626] shadow-[0_0_15px_rgba(239,68,68,0.35)]"
              >
                Sí, limpiar historial
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
