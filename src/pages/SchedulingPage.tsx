import React, { useState } from 'react';
import type { ScheduleError, ScheduleResult, Shift } from '@/types/scheduling';
import { useWorkforceStore } from '@/store/useWorkforceStore';
import { useDirectoryStore } from '@/store/useDirectoryStore';
import { useScheduleStore } from '@/store/useScheduleStore';
import { useCurrentUser } from '@/store/useSessionStore';
import { resetApplicationState } from '@/lib/globalReset';
import { getProfile } from '@/lib/groups';
import {
  startOfWeek,
  todayStr,
  addDays,
  weekDates,
  formatDayLabel,
  getWeekMinutes,
  isOnApprovedTimeOff,
  isUpcoming,
  SCHEDULE_ERROR_MESSAGES,
  SWAP_STATUS_META,
  CLAIM_STATUS_META,
} from '@/lib/schedule';
import { Badge, Button, Card, EmptyState, Field, Input, Modal, Select, Tabs, TextArea } from '@/components/ui';
import { formatDuration } from '@/lib/time';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Copy,
  Plus,
  Clock,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Ban,
  Edit3,
  X,
  Palmtree,
  Info,
} from 'lucide-react';

export const SchedulingPage: React.FC = () => {
  const { agents, campaigns, timeOffRequests } = useWorkforceStore();
  const { profiles } = useDirectoryStore();
  const {
    shifts,
    createShift,
    updateShift,
    cancelShift,
    deleteShift,
    copyWeek,
    claims,
    swaps,
  } = useScheduleStore();

  // Semana actual: lunes
  const [currentMonday, setCurrentMonday] = useState<string>(() => startOfWeek(todayStr()));

  // Fechas de la semana visible (lunes a domingo)
  const currentWeekDates = weekDates(currentMonday);
  const sundayDate = addDays(currentMonday, 6);

  // Alerta global de notificaciones
  const [alertNotice, setAlertNotice] = useState<{
    type: 'success' | 'warning' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Modal Nuevo Turno
  const [isNewShiftModalOpen, setIsNewShiftModalOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [shiftStartTime, setShiftStartTime] = useState<string>('08:00');
  const [shiftEndTime, setShiftEndTime] = useState<string>('17:00');
  const [shiftBreakMinutes, setShiftBreakMinutes] = useState<number>(60);
  const [shiftCampaignId, setShiftCampaignId] = useState<string>('');
  const [shiftNote, setShiftNote] = useState<string>('');
  const [newShiftError, setNewShiftError] = useState<string | null>(null);

  // Modal Editar / Ver Turno
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [editStartTime, setEditStartTime] = useState<string>('');
  const [editEndTime, setEditEndTime] = useState<string>('');
  const [editBreakMinutes, setEditBreakMinutes] = useState<number>(0);
  const [editNote, setEditNote] = useState<string>('');
  const [editCampaignId, setEditCampaignId] = useState<string>('');
  const [editError, setEditError] = useState<string | null>(null);
  const [isDeletingConfirm, setIsDeletingConfirm] = useState(false);

  const campaignMap = new Map(campaigns.map((c) => [c.id, c]));

  // Filtrar solo agentes activos según getProfile
  const activeAgents = agents.filter((agent) => {
    const profile = getProfile(profiles, agent.id);
    return profile.active;
  });

  const translateError = (reason: ScheduleError): string => SCHEDULE_ERROR_MESSAGES[reason];

  // Vista activa y avisos de los paneles de turnos abiertos / intercambios
  const [view, setView] = useState<'calendar' | 'open' | 'swaps'>('calendar');
  const pendingClaims = claims.filter((c) => c.status === 'pending').length;
  const pendingSwaps = swaps.filter((w) => w.status === 'pending_approval').length;
  const report = (res: ScheduleResult, success: string) =>
    setAlertNotice(res.ok ? { type: 'success', message: success } : { type: 'error', message: translateError(res.reason) });

  // Navegación de semanas
  const handlePrevWeek = () => {
    setCurrentMonday(addDays(currentMonday, -7));
  };

  const handleNextWeek = () => {
    setCurrentMonday(addDays(currentMonday, 7));
  };

  const handleToday = () => {
    setCurrentMonday(startOfWeek(todayStr()));
  };

  const handleResetDemo = () => {
    if (window.confirm('¿Reiniciar todos los datos de demostración? Se restablecerán asistencias, usuarios, turnos y llamadas a su estado inicial.')) {
      resetApplicationState();
      setAlertNotice({
        type: 'info',
        message: 'Todos los datos de demostración han sido restablecidos.',
      });
    }
  };

  // Copiar semana anterior
  const handleCopyWeek = () => {
    const fromMonday = addDays(currentMonday, -7);
    const result = copyWeek(fromMonday, currentMonday);

    setAlertNotice({
      type: result.created > 0 ? 'success' : 'info',
      message: `Copia de semana completada: ${result.created} turnos copiados. ${
        result.skipped > 0
          ? `${result.skipped} turnos omitidos por traslape, permisos aprobados o usuarios inactivos.`
          : 'Sin omisiones.'
      }`,
    });
  };

  // Abrir modal de nuevo turno para una celda
  const handleCellClick = (agentId: string, date: string) => {
    const agent = agents.find((a) => a.id === agentId);
    setSelectedAgentId(agentId);
    setSelectedDate(date);
    setShiftStartTime('08:00');
    setShiftEndTime('17:00');
    setShiftBreakMinutes(60);
    setShiftCampaignId(agent?.campaignId ?? campaigns[0]?.id ?? '');
    setShiftNote('');
    setNewShiftError(null);
    setIsNewShiftModalOpen(true);
  };

  // Crear turno
  const handleCreateShiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNewShiftError(null);

    const res = createShift({
      agentId: selectedAgentId,
      campaignId: shiftCampaignId,
      date: selectedDate,
      startTime: shiftStartTime,
      endTime: shiftEndTime,
      breakMinutes: Number(shiftBreakMinutes),
      note: shiftNote.trim() || undefined,
    });

    if (res.ok) {
      setIsNewShiftModalOpen(false);
      setAlertNotice({
        type: 'success',
        message: 'Turno programado exitosamente.',
      });
    } else {
      setNewShiftError(translateError(res.reason));
    }
  };

  // Abrir modal de turno existente
  const handleShiftClick = (shift: Shift, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingShift(shift);
    setEditStartTime(shift.startTime);
    setEditEndTime(shift.endTime);
    setEditBreakMinutes(shift.breakMinutes);
    setEditCampaignId(shift.campaignId);
    setEditNote(shift.note || '');
    setEditError(null);
    setIsDeletingConfirm(false);
  };

  // Guardar edición de turno
  const handleSaveShiftEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShift) return;
    setEditError(null);

    const res = updateShift(editingShift.id, {
      startTime: editStartTime,
      endTime: editEndTime,
      breakMinutes: Number(editBreakMinutes),
      campaignId: editCampaignId,
      note: editNote.trim() || undefined,
    });

    if (res.ok) {
      setEditingShift(null);
      setAlertNotice({
        type: 'success',
        message: 'Turno actualizado con éxito.',
      });
    } else {
      setEditError(translateError(res.reason));
    }
  };

  // Cancelar turno
  const handleCancelShift = () => {
    if (!editingShift) return;
    const res = cancelShift(editingShift.id);
    if (res.ok) {
      setEditingShift(null);
      setAlertNotice({
        type: 'info',
        message: 'El turno ha sido cancelado.',
      });
    } else {
      setEditError(translateError(res.reason));
    }
  };

  // Eliminar turno
  const handleDeleteShift = () => {
    if (!editingShift) return;
    const res = deleteShift(editingShift.id);
    if (res.ok) {
      setEditingShift(null);
      setAlertNotice({
        type: 'info',
        message: 'Turno eliminado del calendario.',
      });
    } else {
      setEditError(translateError(res.reason));
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-[#13151c] border border-[#242E3B] rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-[#66FCF1]/5 to-transparent pointer-events-none" />

        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-[#66FCF1]/10 text-[#66FCF1] border border-[#66FCF1]/30">
              OPERATIONS
            </span>
            <span className="text-xs text-[#C5C6C7]/50 font-mono">
              Planificación Semanal & Matriz Horaria
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Calendar className="w-7 h-7 text-[#66FCF1]" />
            <span>Job Scheduling</span>
          </h1>
          <p className="text-sm text-[#C5C6C7]/80">
            Control de turnos, matriz semanal de agentes activos y sincronización con permisos de ausencia.
          </p>
        </div>

        {/* Acciones del encabezado */}
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <button
            type="button"
            onClick={handleCopyWeek}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1F2833] hover:bg-[#253240] text-white text-xs font-semibold border border-[#242E3B] transition-all hover:border-[#66FCF1]/40"
          >
            <Copy className="w-4 h-4 text-[#66FCF1]" />
            <span>Copiar semana anterior</span>
          </button>

          <button
            type="button"
            onClick={handleResetDemo}
            title="Reiniciar turnos de demostración"
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
            {alertNotice.type === 'info' && <Info className="w-5 h-5 shrink-0" />}
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

      <Tabs
        value={view}
        onChange={setView}
        options={[
          { value: 'calendar', label: 'Calendario' },
          { value: 'open', label: 'Turnos abiertos', count: pendingClaims },
          { value: 'swaps', label: 'Intercambios', count: pendingSwaps },
        ]}
      />

      {view === 'open' && <OpenShiftsPanel report={report} />}
      {view === 'swaps' && <SwapsPanel report={report} />}

      {view === 'calendar' && (
      <>
      {/* 2. Barra de Navegación de Semana */}
      <div className="bg-[#13151c] border border-[#242E3B] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevWeek}
            className="p-2 rounded-xl bg-[#0B0C10] hover:bg-[#1F2833] text-[#C5C6C7] hover:text-white border border-[#242E3B] transition-colors"
            title="Semana anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleToday}
            className="px-3.5 py-1.5 rounded-xl bg-[#0B0C10] hover:bg-[#1F2833] text-xs font-mono font-semibold text-white border border-[#242E3B] transition-colors"
          >
            Hoy
          </button>

          <button
            type="button"
            onClick={handleNextWeek}
            className="p-2 rounded-xl bg-[#0B0C10] hover:bg-[#1F2833] text-[#C5C6C7] hover:text-white border border-[#242E3B] transition-colors"
            title="Semana siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="ml-2 flex items-center gap-2">
            <span className="text-sm font-bold text-white">
              Semana del {currentMonday} al {sundayDate}
            </span>
          </div>
        </div>

        <div className="text-xs text-[#C5C6C7]/60 font-mono">
          Mostrando {activeAgents.length} agentes activos
        </div>
      </div>

      {/* 1. Calendario Semanal */}
      <div className="bg-[#13151c] border border-[#242E3B] rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[960px]">
            <thead>
              <tr className="border-b border-[#242E3B] bg-[#0B0C10]/80 text-[11px] font-mono text-[#C5C6C7]/60 uppercase tracking-wider">
                <th className="py-3 px-4 w-48 sticky left-0 bg-[#0B0C10] z-10 border-r border-[#242E3B]">
                  Agente
                </th>
                {currentWeekDates.map((date) => (
                  <th key={date} className="py-3 px-3 border-r border-[#242E3B] text-center w-36">
                    <span className="block text-white font-semibold capitalize">
                      {formatDayLabel(date)}
                    </span>
                    <span className="text-[10px] text-[#C5C6C7]/50">{date.slice(5)}</span>
                  </th>
                ))}
                {/* 3. Columna final con horas programadas */}
                <th className="py-3 px-4 text-center w-28">Horas Sem.</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#242E3B]/60 text-xs">
              {activeAgents.map((agent) => {
                const campaign = campaignMap.get(agent.campaignId);
                const weekMinutes = getWeekMinutes(shifts, agent.id, currentWeekDates);

                return (
                  <tr key={agent.id} className="hover:bg-[#1A202C]/30 transition-colors">
                    {/* Columna Agente */}
                    <td className="py-3 px-4 sticky left-0 bg-[#13151c] z-10 border-r border-[#242E3B]">
                      <div className="font-semibold text-white truncate max-w-[170px]">
                        {agent.name}
                      </div>
                      <div className="text-[10px] text-[#C5C6C7]/50 font-mono truncate">
                        {agent.employeeCode} • {campaign?.name}
                      </div>
                    </td>

                    {/* 7 Celdas de días */}
                    {currentWeekDates.map((date) => {
                      const hasTimeOff = isOnApprovedTimeOff(timeOffRequests, agent.id, date);
                      const dayShifts = shifts.filter(
                        (s) => s.agentId === agent.id && s.date === date,
                      );

                      return (
                        <td
                          key={date}
                          onClick={() => handleCellClick(agent.id, date)}
                          className={`py-2 px-2 border-r border-[#242E3B] align-top transition-colors cursor-pointer group relative ${
                            hasTimeOff
                              ? 'bg-[#F59E0B]/5 hover:bg-[#F59E0B]/10'
                              : 'hover:bg-[#1F2833]/40'
                          }`}
                        >
                          {/* 4. Insignia Permiso Aprobado */}
                          {hasTimeOff && (
                            <div className="p-1.5 mb-1.5 rounded-lg bg-[#F59E0B]/15 border border-[#F59E0B]/30 text-center flex items-center justify-center gap-1.5 text-[11px] font-mono font-bold text-[#F59E0B]">
                              <Palmtree className="w-3.5 h-3.5 shrink-0" />
                              <span>Permiso</span>
                            </div>
                          )}

                          {dayShifts.length > 0 ? (
                            <div className="space-y-1.5">
                              {dayShifts.map((shift) => {
                                const isCancelled = shift.status === 'cancelled';
                                const cName = campaignMap.get(shift.campaignId)?.name ?? '';

                                return (
                                  <div
                                    key={shift.id}
                                    onClick={(e) => handleShiftClick(shift, e)}
                                    className={`p-2 rounded-lg border text-left transition-all hover:scale-[1.02] shadow-sm ${
                                      isCancelled
                                        ? 'bg-[#1F2833]/30 border-[#242E3B] line-through text-[#C5C6C7]/40'
                                        : 'bg-[#66FCF1]/10 border-[#66FCF1]/30 hover:border-[#66FCF1] text-white'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between font-mono font-bold text-[11px]">
                                      <span className={isCancelled ? 'line-through' : 'text-[#66FCF1]'}>
                                        {shift.startTime} - {shift.endTime}
                                      </span>
                                      {isCancelled && (
                                        <span className="text-[9px] text-[#EF4444] font-mono not-italic uppercase">
                                          Canc
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-[#C5C6C7]/60 font-mono truncate mt-0.5">
                                      {cName}
                                    </div>
                                    {shift.breakMinutes > 0 && (
                                      <div className="text-[9px] text-[#C5C6C7]/40 font-mono">
                                        Desc: {shift.breakMinutes}m
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="h-10 flex items-center justify-center text-[#C5C6C7]/20 group-hover:text-[#66FCF1]/60 transition-colors">
                              <Plus className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          )}
                        </td>
                      );
                    })}

                    {/* 3. Columna final con horas programadas */}
                    <td className="py-3 px-4 text-center font-mono font-bold text-white text-xs">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1F2833] border border-[#242E3B] text-[#66FCF1]">
                        <Clock className="w-3 h-3" />
                        {formatDuration(weekMinutes)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {/* 5. Modal "Nuevo Turno" */}
      {isNewShiftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#13151c] border border-[#242E3B] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#242E3B] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#66FCF1]/15 text-[#66FCF1] flex items-center justify-center border border-[#66FCF1]/30">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Nuevo Turno</h3>
                  <p className="text-[11px] text-[#C5C6C7]/60 font-mono">{selectedDate}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewShiftModalOpen(false)}
                className="p-1 rounded-lg text-[#C5C6C7] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {newShiftError && (
              <div className="p-3 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{newShiftError}</span>
              </div>
            )}

            <form onSubmit={handleCreateShiftSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#C5C6C7] font-medium mb-1">Agente</label>
                <select
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  className="w-full bg-[#0B0C10] border border-[#242E3B] text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#66FCF1]"
                >
                  {activeAgents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#C5C6C7] font-medium mb-1">Campaña</label>
                <select
                  value={shiftCampaignId}
                  onChange={(e) => setShiftCampaignId(e.target.value)}
                  className="w-full bg-[#0B0C10] border border-[#242E3B] text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#66FCF1]"
                >
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#C5C6C7] font-medium mb-1">Hora Inicio (HH:mm)</label>
                  <input
                    type="time"
                    required
                    value={shiftStartTime}
                    onChange={(e) => setShiftStartTime(e.target.value)}
                    className="w-full bg-[#0B0C10] border border-[#242E3B] text-white rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-[#66FCF1]"
                  />
                </div>

                <div>
                  <label className="block text-[#C5C6C7] font-medium mb-1">Hora Fin (HH:mm)</label>
                  <input
                    type="time"
                    required
                    value={shiftEndTime}
                    onChange={(e) => setShiftEndTime(e.target.value)}
                    className="w-full bg-[#0B0C10] border border-[#242E3B] text-white rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-[#66FCF1]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#C5C6C7] font-medium mb-1">Descanso (minutos)</label>
                <input
                  type="number"
                  min="0"
                  value={shiftBreakMinutes}
                  onChange={(e) => setShiftBreakMinutes(Number(e.target.value))}
                  className="w-full bg-[#0B0C10] border border-[#242E3B] text-white rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-[#66FCF1]"
                />
              </div>

              <div>
                <label className="block text-[#C5C6C7] font-medium mb-1">Nota (opcional)</label>
                <input
                  type="text"
                  value={shiftNote}
                  onChange={(e) => setShiftNote(e.target.value)}
                  placeholder="Ej: Turno rotativo o soporte especial"
                  className="w-full bg-[#0B0C10] border border-[#242E3B] text-white rounded-xl px-3 py-2 focus:outline-none focus:border-[#66FCF1]"
                />
              </div>

              <div className="pt-3 border-t border-[#242E3B] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewShiftModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#C5C6C7] hover:text-white bg-[#1F2833] hover:bg-[#253240]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-[#0B0C10] bg-[#66FCF1] hover:bg-[#52e0d6] shadow-[0_0_12px_rgba(102,252,241,0.25)]"
                >
                  Programar Turno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Modal "Editar / Gestionar Turno" */}
      {editingShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#13151c] border border-[#242E3B] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#242E3B] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#66FCF1]/15 text-[#66FCF1] flex items-center justify-center border border-[#66FCF1]/30">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Gestionar Turno</h3>
                  <p className="text-[11px] text-[#C5C6C7]/60 font-mono">
                    {agents.find((a) => a.id === editingShift.agentId)?.name} • {editingShift.date}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingShift(null)}
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

            {isDeletingConfirm ? (
              <div className="p-4 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 space-y-3">
                <p className="text-xs text-[#EF4444] font-semibold">
                  ¿Estás seguro de eliminar permanentemente este turno?
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDeletingConfirm(false)}
                    className="px-3 py-1.5 rounded-lg bg-[#1F2833] text-xs text-white"
                  >
                    No, volver
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteShift}
                    className="px-3 py-1.5 rounded-lg bg-[#EF4444] hover:bg-[#dc2626] text-xs font-bold text-white"
                  >
                    Sí, eliminar
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveShiftEdit} className="space-y-3.5 text-xs">
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#C5C6C7] font-medium mb-1">Hora Inicio</label>
                    <input
                      type="time"
                      required
                      value={editStartTime}
                      onChange={(e) => setEditStartTime(e.target.value)}
                      className="w-full bg-[#0B0C10] border border-[#242E3B] text-white rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-[#66FCF1]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#C5C6C7] font-medium mb-1">Hora Fin</label>
                    <input
                      type="time"
                      required
                      value={editEndTime}
                      onChange={(e) => setEditEndTime(e.target.value)}
                      className="w-full bg-[#0B0C10] border border-[#242E3B] text-white rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-[#66FCF1]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#C5C6C7] font-medium mb-1">Descanso (minutos)</label>
                  <input
                    type="number"
                    min="0"
                    value={editBreakMinutes}
                    onChange={(e) => setEditBreakMinutes(Number(e.target.value))}
                    className="w-full bg-[#0B0C10] border border-[#242E3B] text-white rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-[#66FCF1]"
                  />
                </div>

                <div>
                  <label className="block text-[#C5C6C7] font-medium mb-1">Nota</label>
                  <input
                    type="text"
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    className="w-full bg-[#0B0C10] border border-[#242E3B] text-white rounded-xl px-3 py-2 focus:outline-none focus:border-[#66FCF1]"
                  />
                </div>

                <div className="pt-3 border-t border-[#242E3B] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {editingShift.status === 'scheduled' && (
                      <button
                        type="button"
                        onClick={handleCancelShift}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#F59E0B]/10 hover:bg-[#F59E0B] text-[#F59E0B] hover:text-[#0B0C10] border border-[#F59E0B]/30 text-xs font-semibold transition-colors"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>Cancelar</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setIsDeletingConfirm(true)}
                      className="p-1.5 rounded-lg bg-[#EF4444]/10 hover:bg-[#EF4444] text-[#EF4444] hover:text-white border border-[#EF4444]/30 transition-colors"
                      title="Eliminar turno"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingShift(null)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#C5C6C7] hover:text-white bg-[#1F2833]"
                    >
                      Cerrar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl text-xs font-bold text-[#0B0C10] bg-[#66FCF1] hover:bg-[#52e0d6]"
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ---------- Turnos abiertos e intercambios (vista del supervisor) ----------

type Report = (res: ScheduleResult, success: string) => void;

const useNames = () => {
  const agents = useWorkforceStore((s) => s.agents);
  const campaigns = useWorkforceStore((s) => s.campaigns);
  return {
    agentName: (id: string | null) => agents.find((a) => a.id === id)?.name ?? 'Usuario desconocido',
    campaignName: (id: string) => campaigns.find((c) => c.id === id)?.name ?? id,
  };
};

const ShiftSummary: React.FC<{ date: string; startTime: string; endTime: string; campaign: string; breakMinutes: number }> = ({
  date,
  startTime,
  endTime,
  campaign,
  breakMinutes,
}) => (
  <div className="flex items-center gap-3">
    <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl border border-[#66FCF1]/25 bg-[#66FCF1]/10 font-mono text-[#66FCF1]">
      <span className="text-[10px] uppercase">{formatDayLabel(date).split(' ')[0]}</span>
      <span className="text-base font-bold leading-none">{date.slice(8)}</span>
    </div>
    <div>
      <div className="font-mono text-sm font-bold text-white">
        {startTime} – {endTime}
      </div>
      <div className="text-[11px] text-[#C5C6C7]/60">
        {campaign}
        {breakMinutes > 0 && ` · Descanso ${breakMinutes} min`}
      </div>
    </div>
  </div>
);

const emptyOpenShiftForm = () => ({
  campaignId: '',
  date: addDays(todayStr(), 1),
  startTime: '18:00',
  endTime: '22:00',
  breakMinutes: 0,
  requiresApproval: true,
  note: '',
});

const OpenShiftsPanel: React.FC<{ report: Report }> = ({ report }) => {
  const { profile } = useCurrentUser();
  const campaigns = useWorkforceStore((s) => s.campaigns);
  const { openShifts, claims, shifts, createOpenShift, deleteOpenShift, decideClaim } = useScheduleStore();
  const { agentName, campaignName } = useNames();
  const [form, setForm] = useState<ReturnType<typeof emptyOpenShiftForm> | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const sorted = [...openShifts].sort((a, b) =>
    a.status === b.status ? `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`) : a.status === 'open' ? -1 : 1,
  );

  const openForm = () => {
    setForm({ ...emptyOpenShiftForm(), campaignId: campaigns[0]?.id ?? '' });
    setFormError(null);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    const res = createOpenShift(profile.agentId, { ...form, breakMinutes: Number(form.breakMinutes) });
    if (!res.ok) return setFormError(SCHEDULE_ERROR_MESSAGES[res.reason]);
    setForm(null);
    report(res, 'Turno abierto publicado. Tu equipo ya puede tomarlo.');
  };

  return (
    <Card
      title="Turnos abiertos"
      subtitle="Publica turnos sin agente asignado para que tu equipo los tome. Cada turno abierto cubre un cupo."
      actions={
        <Button variant="primary" icon={Plus} onClick={openForm}>
          Publicar turno abierto
        </Button>
      }
      bodyClassName="p-0"
    >
      {sorted.length === 0 ? (
        <EmptyState icon={Calendar} title="No hay turnos abiertos" description="Publica uno para cubrir picos de llamadas o ausencias." />
      ) : (
        <ul className="divide-y divide-[#242E3B]">
          {sorted.map((os) => {
            const osClaims = claims.filter((c) => c.openShiftId === os.id);
            const filledBy = shifts.find((s) => s.id === os.filledShiftId)?.agentId ?? null;
            return (
              <li key={os.id} className="space-y-3 px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <ShiftSummary {...os} campaign={campaignName(os.campaignId)} />
                  <div className="flex flex-wrap items-center gap-2">
                    {os.requiresApproval ? <Badge tone="info">Requiere aprobación</Badge> : <Badge tone="accent">Asignación inmediata</Badge>}
                    {os.status === 'filled' ? (
                      <Badge tone="success">Cubierto · {agentName(filledBy)}</Badge>
                    ) : isUpcoming(os) ? (
                      <Badge tone="warning">Disponible</Badge>
                    ) : (
                      <Badge tone="neutral">Vencido</Badge>
                    )}
                    <button
                      type="button"
                      aria-label="Eliminar turno abierto"
                      title="Eliminar turno abierto"
                      onClick={() => report(deleteOpenShift(profile.agentId, os.id), 'Turno abierto eliminado.')}
                      className="rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/10 p-1.5 text-[#EF4444] transition-colors hover:bg-[#EF4444] hover:text-white"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {os.note && <p className="text-xs text-[#C5C6C7]/70">{os.note}</p>}
                {osClaims.length > 0 && (
                  <ul className="space-y-2 rounded-xl border border-[#242E3B] bg-[#0B0C10] p-3">
                    {osClaims.map((c) => (
                      <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="text-white">
                          <span className="font-semibold">{agentName(c.agentId)}</span>
                          <span className="text-[#C5C6C7]/60"> quiere tomar este turno</span>
                        </span>
                        {c.status === 'pending' ? (
                          <span className="flex gap-2">
                            <Button
                              size="sm"
                              variant="primary"
                              icon={CheckCircle2}
                              onClick={() => report(decideClaim(profile.agentId, c.id, true), `Turno asignado a ${agentName(c.agentId)}.`)}
                            >
                              Aprobar
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              icon={X}
                              onClick={() => report(decideClaim(profile.agentId, c.id, false), 'Solicitud rechazada.')}
                            >
                              Rechazar
                            </Button>
                          </span>
                        ) : (
                          <Badge tone={CLAIM_STATUS_META[c.status].tone}>{CLAIM_STATUS_META[c.status].label}</Badge>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        open={form !== null}
        onClose={() => setForm(null)}
        title="Publicar turno abierto"
        description="Sin agente asignado: lo toma quien esté disponible."
        footer={
          <>
            <Button variant="ghost" onClick={() => setForm(null)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" form="open-shift-form">
              Publicar
            </Button>
          </>
        }
      >
        {form && (
          <form id="open-shift-form" onSubmit={submit} className="space-y-3.5">
            {formError && (
              <div role="alert" className="flex items-center gap-2 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/15 p-3 text-xs text-[#EF4444]">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}
            <Field label="Campaña">
              <Select value={form.campaignId} onChange={(e) => setForm({ ...form, campaignId: e.target.value })}>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Fecha">
              <Input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Hora inicio">
                <Input type="time" required value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
              </Field>
              <Field label="Hora fin">
                <Input type="time" required value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
              </Field>
            </div>
            <Field label="Descanso (minutos)">
              <Input
                type="number"
                min={0}
                value={form.breakMinutes}
                onChange={(e) => setForm({ ...form, breakMinutes: Number(e.target.value) })}
              />
            </Field>
            <Field label="Nota (opcional)">
              <TextArea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Ej: refuerzo por campaña de cobranza" />
            </Field>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#242E3B] bg-[#0B0C10] p-3">
              <input
                type="checkbox"
                checked={form.requiresApproval}
                onChange={(e) => setForm({ ...form, requiresApproval: e.target.checked })}
                className="mt-0.5 h-4 w-4 accent-[#66FCF1]"
              />
              <span>
                <span className="block text-xs font-semibold text-white">Requiere mi aprobación</span>
                <span className="block text-[11px] text-[#C5C6C7]/60">
                  Si lo desmarcas, el turno se asigna al primer agente que lo tome.
                </span>
              </span>
            </label>
          </form>
        )}
      </Modal>
    </Card>
  );
};

const SwapsPanel: React.FC<{ report: Report }> = ({ report }) => {
  const { profile } = useCurrentUser();
  const { swaps, shifts, decideSwap } = useScheduleStore();
  const { agentName, campaignName } = useNames();
  const rank = (status: string) => (status === 'pending_approval' ? 0 : status === 'pending_peer' ? 1 : 2);
  const sorted = [...swaps].sort((a, b) => rank(a.status) - rank(b.status) || b.createdAt.localeCompare(a.createdAt));

  return (
    <Card title="Intercambios de turno" subtitle="Los agentes se ofrecen turnos entre sí; tú das la aprobación final." bodyClassName="p-0">
      {sorted.length === 0 ? (
        <EmptyState icon={Calendar} title="Sin solicitudes de intercambio" />
      ) : (
        <ul className="divide-y divide-[#242E3B]">
          {sorted.map((w) => {
            const shift = shifts.find((s) => s.id === w.shiftId);
            const target = w.acceptedBy ?? w.toAgentId;
            return (
              <li key={w.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                <div className="space-y-2">
                  {shift ? (
                    <ShiftSummary {...shift} campaign={campaignName(shift.campaignId)} />
                  ) : (
                    <span className="text-xs text-[#C5C6C7]/60">Turno eliminado</span>
                  )}
                  <div className="text-xs text-white">
                    <span className="font-semibold">{agentName(w.fromAgentId)}</span>
                    <span className="text-[#C5C6C7]/60"> → </span>
                    <span className="font-semibold">{target ? agentName(target) : 'Cualquiera de la campaña'}</span>
                  </div>
                  {w.note && <p className="text-[11px] text-[#C5C6C7]/60">“{w.note}”</p>}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={SWAP_STATUS_META[w.status].tone}>{SWAP_STATUS_META[w.status].label}</Badge>
                  {w.status === 'pending_approval' && (
                    <>
                      <Button
                        size="sm"
                        variant="primary"
                        icon={CheckCircle2}
                        onClick={() => report(decideSwap(profile.agentId, w.id, true), 'Intercambio aprobado: el turno cambió de agente.')}
                      >
                        Aprobar
                      </Button>
                      <Button size="sm" variant="danger" icon={X} onClick={() => report(decideSwap(profile.agentId, w.id, false), 'Intercambio rechazado.')}>
                        Rechazar
                      </Button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
};
