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
import { PageHeader, Card, Button, Badge, EmptyState, Modal } from '@/components/ui';

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
    badgeBg: 'bg-vx-success/10',
    badgeText: 'text-vx-success',
    badgeBorder: 'border-vx-success/30',
    dotColor: 'bg-vx-success',
  },
  {
    key: 'time_off',
    label: 'Permisos',
    icon: CalendarOff,
    badgeBg: 'bg-vx-warning/10',
    badgeText: 'text-vx-warning',
    badgeBorder: 'border-vx-warning/30',
    dotColor: 'bg-vx-warning',
  },
  {
    key: 'users',
    label: 'Usuarios',
    icon: Users,
    badgeBg: 'bg-vx-info/10',
    badgeText: 'text-vx-info',
    badgeBorder: 'border-vx-info/30',
    dotColor: 'bg-vx-info',
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
    badgeBg: 'bg-vx-accent/10',
    badgeText: 'text-vx-accent',
    badgeBorder: 'border-vx-accent/30',
    dotColor: 'bg-vx-accent',
  },
  {
    key: 'supervision',
    label: 'Supervisión',
    icon: Headphones,
    badgeBg: 'bg-vx-danger/10',
    badgeText: 'text-vx-danger',
    badgeBorder: 'border-vx-danger/30',
    dotColor: 'bg-vx-danger',
  },
  {
    key: 'system',
    label: 'Sistema',
    icon: Cpu,
    badgeBg: 'bg-vx-raised',
    badgeText: 'text-vx-text-2',
    badgeBorder: 'border-vx-border',
    dotColor: 'bg-vx-text-2',
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
      <PageHeader
        icon={Activity}
        eyebrow="BITÁCORA · AUDITORÍA"
        title="Actividad"
        description="Registro cronológico en tiempo real de operaciones, asistencias, turnos, llamadas y cambios de estado."
        actions={
          <>
            <Badge className="px-3 py-1.5">
              Eventos guardados: <strong className="text-vx-text">{events.length}</strong> / 300
            </Badge>
            {events.length > 0 && (
              <Button variant="danger" icon={Trash2} onClick={() => setConfirmClearOpen(true)}>
                Limpiar historial
              </Button>
            )}
          </>
        }
      />

      {/* Barra de Filtros */}
      <div className="bg-vx-surface border border-vx-border rounded-2xl p-5 space-y-4">
        {/* Fila 1: Búsqueda de texto y selector de agente */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Buscador */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-vx-text-2/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Buscar eventos"
              placeholder="Buscar en la descripción de los eventos (ej. Sofía, vacaciones, turno)..."
              className="w-full pl-10 pr-9 py-2 rounded-xl bg-vx-bg border border-vx-border text-[13px] text-vx-text placeholder-vx-text-2/40 focus:outline-none focus:border-vx-accent/50 tabular-nums transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Limpiar búsqueda"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-vx-text-2/50 hover:text-vx-text"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Selector de agente */}
          <div className="relative">
            <User className="w-4 h-4 text-vx-text-2/50 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              aria-label="Filtrar por agente"
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-vx-bg border border-vx-border text-[13px] text-vx-text focus:outline-none focus:border-vx-accent/50 tabular-nums appearance-none transition-colors cursor-pointer"
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
        <div className="pt-2 border-t border-vx-border/60 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[13px] tabular-nums text-vx-text-2/70">
              <Filter className="w-3.5 h-3.5 text-vx-accent" />
              <span>Filtrar por categoría ({activeCategoryCount} activas):</span>
            </div>

            <div className="flex items-center gap-2 text-xs tabular-nums">
              <button
                type="button"
                onClick={() => handleSelectAllCategories(true)}
                className="text-vx-accent hover:underline"
              >
                Activar todas
              </button>
              <span className="text-vx-text-2/30">•</span>
              <button
                type="button"
                onClick={() => handleSelectAllCategories(false)}
                className="text-vx-text-2/60 hover:text-vx-text"
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
                  aria-pressed={isActive}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[13px] tabular-nums font-medium transition-all border ${
                    isActive
                      ? `${cat.badgeBg} ${cat.badgeText} ${cat.badgeBorder} shadow-[0_0_10px_rgba(0,0,0,0.2)]`
                      : 'bg-vx-bg/60 text-vx-text-2/40 border-vx-border hover:text-vx-text-2 hover:border-vx-border/80'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? cat.badgeText : 'text-vx-text-2/40'}`} />
                  <span>{cat.label}</span>
                  {isActive && <Check className="w-3 h-3 ml-0.5 opacity-80" />}
                </button>
              );
            })}
          </div>

          {!isCallsActive && (
            <p className="text-xs text-vx-text-2/50 tabular-nums italic pt-1">
              Nota: el filtro de <strong>Llamadas</strong> está desactivado por defecto para evitar saturación por eventos del simulador en vivo. Actívalo para inspeccionar el flujo telefónico.
            </p>
          )}
        </div>

        {/* Resumen de conteo */}
        <div className="pt-2 border-t border-vx-border/60 flex flex-wrap items-center justify-between gap-2 text-[13px] tabular-nums text-vx-text-2/60">
          <span>
            Mostrando <strong className="text-vx-text">{filteredEvents.length}</strong> de{' '}
            <strong className="text-vx-text">{events.length}</strong> eventos registrados
          </span>
          {(searchQuery || selectedAgentId !== 'all' || !isCallsActive) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-xs text-vx-accent hover:underline"
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
        <Card bodyClassName="">
          <EmptyState
            icon={Activity}
            title="Aún no hay actividad: haz una acción en la app y aparecerá aquí"
            description="La bitácora registra los cambios de asistencia, turnos, nómina, permisos y supervisión."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Badge>Marcajes en Time Clock</Badge>
                <Badge>Aprobaciones de permisos</Badge>
                <Badge>Programación de turnos</Badge>
                <Badge>Llamadas en el monitor en vivo</Badge>
              </div>
            }
          />
        </Card>
      ) : filteredEvents.length === 0 ? (
        // Estado vacío por filtros
        <Card bodyClassName="">
          <EmptyState
            icon={Search}
            title="No se encontraron eventos con los filtros seleccionados"
            description="Prueba cambiando las categorías seleccionadas, el agente o el término de búsqueda."
            action={
              <Button variant="primary" icon={RotateCcw} onClick={handleResetFilters}>
                Restablecer filtros
              </Button>
            }
          />
        </Card>
      ) : (
        // Lista cronológica con grupos de día
        <div className="space-y-6">
          {groupedEvents.map((group) => (
            <div key={group.dayLabel} className="space-y-3">
              {/* Encabezado del día */}
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-lg bg-vx-raised text-[13px] font-bold tabular-nums text-vx-text border border-vx-border">
                  {group.dayLabel}
                </span>
                <div className="h-px bg-gradient-to-r from-vx-border to-transparent flex-1" />
                <span className="text-xs tabular-nums text-vx-text-2/50">
                  {group.items.length} {group.items.length === 1 ? 'evento' : 'eventos'}
                </span>
              </div>

              {/* Tarjetas de eventos */}
              <div className="bg-vx-surface border border-vx-border rounded-2xl divide-y divide-vx-border/60 overflow-hidden">
                {group.items.map((ev) => {
                  const cfg = CATEGORY_MAP.get(ev.category) ?? CATEGORIES[0];
                  const Icon = cfg.icon;

                  return (
                    <div
                      key={ev.id}
                      className="p-4 flex items-start sm:items-center justify-between gap-3 hover:bg-vx-raised/40 transition-colors"
                    >
                      <div className="flex min-w-0 items-start sm:items-center gap-3.5">
                        {/* Ícono de categoría */}
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${cfg.badgeBg} ${cfg.badgeBorder} ${cfg.badgeText}`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>

                        {/* Mensaje & detalles */}
                        <div className="min-w-0 space-y-0.5">
                          <div className="text-sm font-medium text-vx-text break-words flex flex-wrap items-center gap-2">
                            <span>{ev.message}</span>
                          </div>

                          <div className="flex items-center gap-2 text-[13px] tabular-nums text-vx-text-2/50">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-bold border ${cfg.badgeBg} ${cfg.badgeText} ${cfg.badgeBorder}`}
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
                        <span className="text-[13px] tabular-nums text-vx-text-2/60">
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
      <Modal
        open={confirmClearOpen}
        onClose={() => setConfirmClearOpen(false)}
        title="Confirmar limpieza"
        description="Esta acción vacía el historial de actividad."
        footer={
          <>
            <Button onClick={() => setConfirmClearOpen(false)}>Cancelar</Button>
            <Button
              variant="danger"
              icon={Trash2}
              onClick={() => {
                clearActivity();
                setConfirmClearOpen(false);
              }}
            >
              Sí, limpiar historial
            </Button>
          </>
        }
      >
            <div className="p-3.5 rounded-xl bg-vx-danger/10 border border-vx-danger/30 space-y-2 text-[13px] text-vx-text-2">
              <p className="text-vx-text font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-vx-danger shrink-0" />
                <span>¿Estás seguro de vaciar la bitácora de actividad?</span>
              </p>
              <p>
                Se eliminarán permanentemente los <strong>{events.length}</strong> eventos registrados en la memoria local del navegador.
              </p>
              <p className="text-xs text-vx-text-2/60 italic tabular-nums pt-1 border-t border-vx-danger/20">
                El observador continuará activo y registrará los nuevos eventos a partir de este momento.
              </p>
            </div>
      </Modal>
    </div>
  );
};
