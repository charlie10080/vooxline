import React, { useState } from 'react';
import type { TimeEntry, EntryStatus, ActionResult } from '@/types';
import type { AttendanceAlertKind } from '@/lib/punctuality';
import { useWorkforceStore } from '@/store/useWorkforceStore';
import { useScheduleStore } from '@/store/useScheduleStore';
import { useDirectoryStore } from '@/store/useDirectoryStore';
import { getScheduledMinutesFor, todayStr } from '@/lib/schedule';
import {
  getEntryPunctuality,
  getAttendanceAlerts,
  countAlertsByKind,
  describeAlert,
  ALERT_KIND_LABELS,
  entryNeedsReview,
} from '@/lib/punctuality';
import { resetApplicationState } from '@/lib/globalReset';
import {
  formatClock,
  formatDuration,
  formatDeviation,
} from '@/lib/time';
import {
  getWorkedMinutes,
  getDeviationMinutes,
  REVIEW_THRESHOLD_MIN,
} from '@/lib/metrics';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  Square,
  Users,
  Search,
  RotateCcw,
  CheckCheck,
  ShieldAlert,
  Info,
  Sparkles,
  UserCheck,
  Building2,
} from 'lucide-react';

type TabFilter = 'all' | EntryStatus;

export const TimeClockPage: React.FC = () => {
  const {
    timeEntries,
    timeOffRequests,
    agents,
    campaigns,
    approveEntry,
    rejectEntry,
    clockIn,
    clockOut,
  } = useWorkforceStore();
  const { shifts } = useScheduleStore();
  const { profiles } = useDirectoryStore();

  const attendanceAlerts = getAttendanceAlerts({
    entries: timeEntries,
    shifts,
    agents,
    profiles,
    timeOffRequests,
  });
  const alertCounts = countAlertsByKind(attendanceAlerts);

  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('all');

  // Confirmation modal state
  const [pendingConfirmationEntry, setPendingConfirmationEntry] = useState<TimeEntry | null>(null);

  // Batch action notice
  const [batchNotice, setBatchNotice] = useState<{
    approved: number;
    blockedCount: number;
  } | null>(null);

  // Notification / Alert message for quick feedback
  const [actionAlert, setActionAlert] = useState<{
    type: 'success' | 'warning' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Drawer / Modal for Agent Clock In / Clock Out
  const [isClockModalOpen, setIsClockModalOpen] = useState(false);

  // Agent & Campaign lookup helpers
  const agentMap = new Map(agents.map((a) => [a.id, a]));
  const campaignMap = new Map(campaigns.map((c) => [c.id, c]));

  // Counters for tabs
  const countAll = timeEntries.length;
  const countPending = timeEntries.filter((e) => e.status === 'pending').length;
  const countApproved = timeEntries.filter((e) => e.status === 'approved').length;
  const countRejected = timeEntries.filter((e) => e.status === 'rejected').length;

  // Filtered entries
  const filteredEntries = timeEntries.filter((entry) => {
    // Tab filter
    if (activeTab !== 'all' && entry.status !== activeTab) {
      return false;
    }

    // Campaign filter
    if (selectedCampaignId !== 'all' && entry.campaignId !== selectedCampaignId) {
      return false;
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const agent = agentMap.get(entry.agentId);
      const campaign = campaignMap.get(entry.campaignId);
      const agentName = agent?.name.toLowerCase() ?? '';
      const employeeCode = agent?.employeeCode.toLowerCase() ?? '';
      const campaignName = campaign?.name.toLowerCase() ?? '';
      const note = entry.note?.toLowerCase() ?? '';

      return (
        agentName.includes(q) ||
        employeeCode.includes(q) ||
        campaignName.includes(q) ||
        note.includes(q)
      );
    }

    return true;
  });

  // Handler for approving a single entry
  const handleApprove = (entryId: string, supervisorConfirmed = false) => {
    // Si no está confirmado por el supervisor, validar banderas de puntualidad
    if (!supervisorConfirmed) {
      const entry = timeEntries.find((e) => e.id === entryId);
      if (entry) {
        if (entry.clockOut === null) {
          setActionAlert({
            type: 'warning',
            message: 'No se puede aprobar un turno abierto. El agente debe marcar salida primero.',
          });
          return;
        }
        if (entryNeedsReview(entry, shifts)) {
          setPendingConfirmationEntry(entry);
          return;
        }
      }
    }

    const res: ActionResult = approveEntry(entryId, supervisorConfirmed);
    if (res.ok) {
      setActionAlert({
        type: 'success',
        message: 'Entrada horaria aprobada con éxito.',
      });
      setPendingConfirmationEntry(null);
    } else {
      if (res.reason === 'needs_confirmation') {
        const entry = timeEntries.find((e) => e.id === entryId);
        if (entry) {
          setPendingConfirmationEntry(entry);
        }
      } else if (res.reason === 'entry_open') {
        setActionAlert({
          type: 'warning',
          message: 'No se puede aprobar un turno abierto. El agente debe marcar salida primero.',
        });
      } else if (res.reason === 'already_processed') {
        setActionAlert({
          type: 'info',
          message: 'Esta entrada ya fue procesada anteriormente.',
        });
      } else {
        setActionAlert({
          type: 'error',
          message: `Error al aprobar: ${res.reason}`,
        });
      }
    }
  };

  // Handler for rejecting an entry
  const handleReject = (entryId: string) => {
    const res: ActionResult = rejectEntry(entryId);
    if (res.ok) {
      setActionAlert({
        type: 'info',
        message: 'Entrada horaria marcada como rechazada.',
      });
    } else {
      setActionAlert({
        type: 'error',
        message: `Error al rechazar: ${res.reason}`,
      });
    }
  };

  // Handler for Batch Approval: NO llama a approveBatch
  // Recorre las pendientes y cerradas, y solo para las que NO tengan banderas llama a approveEntry(id)
  const handleApproveBatch = () => {
    const pendingClosed = timeEntries.filter(
      (e) => e.status === 'pending' && e.clockOut !== null,
    );
    let approved = 0;
    let blockedCount = 0;

    for (const entry of pendingClosed) {
      if (entryNeedsReview(entry, shifts)) {
        blockedCount += 1;
        continue;
      }
      const res = approveEntry(entry.id);
      if (res.ok) {
        approved += 1;
      } else {
        blockedCount += 1;
      }
    }

    setBatchNotice({
      approved,
      blockedCount,
    });
  };

  // Handler for Clock In / Clock Out per agent
  const handleAgentClockIn = (agentId: string) => {
    const today = todayStr();
    const scheduled = getScheduledMinutesFor(shifts, agentId, today);
    const res = clockIn(agentId, scheduled ?? undefined);
    const agent = agentMap.get(agentId);
    if (res.ok) {
      setActionAlert({
        type: 'success',
        message: `Turno iniciado para ${agent?.name ?? 'agente'}. Entrada registrada ahora.`,
      });
    } else {
      setActionAlert({
        type: 'warning',
        message: `No se pudo marcar entrada: ${res.reason === 'already_clocked_in' ? 'El agente ya tiene un turno abierto.' : res.reason}`,
      });
    }
  };

  const handleAgentClockOut = (agentId: string) => {
    const res = clockOut(agentId);
    const agent = agentMap.get(agentId);
    if (res.ok) {
      setActionAlert({
        type: 'success',
        message: `Turno finalizado para ${agent?.name ?? 'agente'}. Salida registrada ahora.`,
      });
    } else {
      setActionAlert({
        type: 'warning',
        message: `No se pudo marcar salida: ${res.reason === 'not_clocked_in' ? 'El agente no tiene turno abierto.' : res.reason}`,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-[#13171F] border border-[#242E3B] rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-[#66FCF1]/5 to-transparent pointer-events-none" />

        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-[#66FCF1]/10 text-[#66FCF1] border border-[#66FCF1]/30">
              OPERACIONES & ASISTENCIA
            </span>
            <span className="text-xs text-[#C5C6C7]/50 font-mono">Regla de Negocio: ±15 min</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Clock className="w-7 h-7 text-[#66FCF1]" />
            <span>Time Clock & Aprobación</span>
          </h1>
          <p className="text-sm text-[#C5C6C7]/80">
            Control horario de agentes B2B, motor de aprobación de turnos y sincronización con nómina.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          {/* Botón Marcar Entrada/Salida por Agente */}
          <button
            type="button"
            onClick={() => setIsClockModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1F2833] hover:bg-[#253240] text-white text-xs font-semibold border border-[#242E3B] transition-all hover:border-[#66FCF1]/40 shadow-sm"
          >
            <Users className="w-4 h-4 text-[#66FCF1]" />
            <span>Marcar Entrada / Salida</span>
          </button>

          {/* Botón Aprobar Lote */}
          <button
            type="button"
            onClick={handleApproveBatch}
            disabled={countPending === 0}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
              countPending > 0
                ? 'bg-[#66FCF1] text-[#0B0C10] hover:bg-[#52e0d6] shadow-[0_0_16px_rgba(102,252,241,0.25)] cursor-pointer'
                : 'bg-[#1F2833] text-[#C5C6C7]/40 border border-[#242E3B] cursor-not-allowed'
            }`}
          >
            <CheckCheck className="w-4 h-4" />
            <span>Aprobar Lote ({countPending})</span>
          </button>

          {/* Botón Reset Demo */}
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

      {/* Panel Superior: Alertas de Asistencia */}
      <div className="bg-[#13171F] border border-[#242E3B] rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#242E3B] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/15 text-[#F59E0B] flex items-center justify-center border border-[#F59E0B]/30">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Alertas de Asistencia</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30">
                  {attendanceAlerts.length}
                </span>
              </h2>
              <p className="text-xs text-[#C5C6C7]/70">
                Puntualidad en turnos programados, demoras, salidas anticipadas y ausencias sin marcaje.
              </p>
            </div>
          </div>

          {/* Chips de conteo por tipo */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(Object.keys(ALERT_KIND_LABELS) as AttendanceAlertKind[]).map((kind) => {
              const count = alertCounts[kind];
              return (
                <span
                  key={kind}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono border ${
                    count > 0
                      ? 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30 font-semibold'
                      : 'bg-[#1F2833]/40 text-[#C5C6C7]/50 border-[#242E3B]'
                  }`}
                >
                  <span>{ALERT_KIND_LABELS[kind]}:</span>
                  <span className={count > 0 ? 'text-white font-bold' : ''}>{count}</span>
                </span>
              );
            })}
          </div>
        </div>

        {attendanceAlerts.length === 0 ? (
          <div className="flex items-center gap-2 py-2 text-xs text-[#10B981] font-mono">
            <CheckCircle2 className="w-4 h-4" />
            <span>Sin alertas</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {attendanceAlerts.map((alert) => {
              const agent = agentMap.get(alert.agentId);
              return (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#0B0C10] border border-[#242E3B] hover:border-[#F59E0B]/40 transition-colors text-xs"
                >
                  <div className="min-w-0 mr-2">
                    <div className="font-semibold text-white truncate">
                      {agent?.name ?? 'Desconocido'}
                    </div>
                    <div className="text-[10px] text-[#C5C6C7]/50 font-mono">
                      {alert.date} • {agent?.employeeCode}
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 shrink-0">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    <span>{describeAlert(alert.kind, alert.minutes)}</span>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Notification Alert */}
      {actionAlert && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl border text-sm animate-fadeIn ${
            actionAlert.type === 'success'
              ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]'
              : actionAlert.type === 'warning'
                ? 'bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#F59E0B]'
                : actionAlert.type === 'error'
                  ? 'bg-[#EF4444]/10 border-[#EF4444]/30 text-[#EF4444]'
                  : 'bg-[#66FCF1]/10 border-[#66FCF1]/30 text-[#66FCF1]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {actionAlert.type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0" />}
            {actionAlert.type === 'warning' && <AlertTriangle className="w-5 h-5 shrink-0" />}
            {actionAlert.type === 'error' && <XCircle className="w-5 h-5 shrink-0" />}
            {actionAlert.type === 'info' && <Info className="w-5 h-5 shrink-0" />}
            <span className="font-medium">{actionAlert.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionAlert(null)}
            className="text-xs opacity-70 hover:opacity-100 uppercase tracking-wider font-mono ml-4"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Batch Notice Banner */}
      {batchNotice && (
        <div className="bg-[#13171F] border border-[#66FCF1]/40 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#66FCF1]/15 text-[#66FCF1] border border-[#66FCF1]/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Resultado del Proceso en Lote</h2>
                <p className="text-xs text-[#C5C6C7] mt-0.5">
                  Se aprobaron automáticamente <strong className="text-[#66FCF1] font-semibold">{batchNotice.approved}</strong> entradas sin incidencias.
                </p>
                {batchNotice.blockedCount > 0 ? (
                  <div className="flex items-center gap-2 mt-2 text-xs text-[#F59E0B] bg-[#F59E0B]/10 px-3 py-1.5 rounded-lg border border-[#F59E0B]/20">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>
                      <strong>{batchNotice.blockedCount} entradas quedaron bloqueadas</strong> por presentar desviación mayor a 15 minutos o por ser turnos abiertos. Requieren confirmación manual del supervisor.
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-[#10B981] mt-1">
                    ✓ No quedaron entradas bloqueadas en este lote.
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setBatchNotice(null)}
              className="px-3.5 py-1.5 rounded-lg bg-[#1F2833] hover:bg-[#253240] text-xs font-semibold text-white border border-[#242E3B] transition-colors self-end sm:self-center"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Stats Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4">
        <div className="bg-[#13171F] border border-[#242E3B] rounded-xl p-4">
          <span className="text-xs text-[#C5C6C7]/60 font-mono block">Total Registros</span>
          <span className="text-2xl font-bold text-white font-mono mt-1 block">{countAll}</span>
        </div>

        <div className="bg-[#13171F] border border-[#242E3B] rounded-xl p-4 relative">
          <span className="text-xs text-[#F59E0B] font-mono block flex items-center justify-between">
            <span>Pendientes</span>
            {countPending > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-ping" />
            )}
          </span>
          <span className="text-2xl font-bold text-[#F59E0B] font-mono mt-1 block">
            {countPending}
          </span>
        </div>

        <div className="bg-[#13171F] border border-[#242E3B] rounded-xl p-4">
          <span className="text-xs text-[#10B981] font-mono block">Aprobadas</span>
          <span className="text-2xl font-bold text-[#10B981] font-mono mt-1 block">
            {countApproved}
          </span>
        </div>

        <div className="bg-[#13171F] border border-[#242E3B] rounded-xl p-4">
          <span className="text-xs text-[#EF4444] font-mono block">Rechazadas</span>
          <span className="text-2xl font-bold text-[#EF4444] font-mono mt-1 block">
            {countRejected}
          </span>
        </div>
      </div>

      {/* Controls Bar: Tabs + Search + Campaign Filter */}
      <div className="bg-[#13171F] border border-[#242E3B] rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Tabs con contadores reales */}
        <div className="flex items-center gap-1.5 bg-[#0B0C10] p-1 rounded-xl border border-[#242E3B] overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'all'
                ? 'bg-[#66FCF1] text-[#0B0C10] shadow-sm'
                : 'text-[#C5C6C7]/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>Todas</span>
            <span
              className={`px-1.5 py-0.2 rounded font-mono text-[11px] ${
                activeTab === 'all'
                  ? 'bg-[#0B0C10]/20 text-[#0B0C10]'
                  : 'bg-[#1F2833] text-[#C5C6C7]'
              }`}
            >
              {countAll}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'pending'
                ? 'bg-[#F59E0B] text-[#0B0C10] shadow-sm'
                : 'text-[#C5C6C7]/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>Pendientes</span>
            <span
              className={`px-1.5 py-0.2 rounded font-mono text-[11px] ${
                activeTab === 'pending'
                  ? 'bg-[#0B0C10]/20 text-[#0B0C10]'
                  : 'bg-[#1F2833] text-[#F59E0B]'
              }`}
            >
              {countPending}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('approved')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'approved'
                ? 'bg-[#10B981] text-[#0B0C10] shadow-sm'
                : 'text-[#C5C6C7]/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>Aprobadas</span>
            <span
              className={`px-1.5 py-0.2 rounded font-mono text-[11px] ${
                activeTab === 'approved'
                  ? 'bg-[#0B0C10]/20 text-[#0B0C10]'
                  : 'bg-[#1F2833] text-[#10B981]'
              }`}
            >
              {countApproved}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rejected')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'rejected'
                ? 'bg-[#EF4444] text-white shadow-sm'
                : 'text-[#C5C6C7]/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>Rechazadas</span>
            <span
              className={`px-1.5 py-0.2 rounded font-mono text-[11px] ${
                activeTab === 'rejected'
                  ? 'bg-[#0B0C10]/20 text-white'
                  : 'bg-[#1F2833] text-[#EF4444]'
              }`}
            >
              {countRejected}
            </span>
          </button>
        </div>

        {/* Filter inputs */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
          {/* Selector de campaña */}
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

          {/* Search box */}
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 text-[#C5C6C7]/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar agente o código..."
              className="w-full bg-[#0B0C10] border border-[#242E3B] text-xs text-white rounded-xl pl-9 pr-3 py-2 placeholder:text-[#C5C6C7]/40 focus:outline-none focus:border-[#66FCF1]"
            />
          </div>
        </div>
      </div>

      {/* Main Table Card: Motor de Aprobación y Asistencia */}
      <div className="bg-[#13171F] border border-[#242E3B] rounded-2xl shadow-xl overflow-hidden">
        <div className="p-5 border-b border-[#242E3B] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#66FCF1]" />
            <h2 className="text-base font-bold text-white tracking-wide">
              Motor de Aprobación y Asistencia
            </h2>
            <span className="text-xs font-mono text-[#C5C6C7]/60">
              ({filteredEntries.length} entradas listadas)
            </span>
          </div>

          <div className="text-xs text-[#C5C6C7]/60 font-mono hidden md:block">
            Umbral de revisión supervisor: &gt; {REVIEW_THRESHOLD_MIN} min
          </div>
        </div>

        {/* Table content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#242E3B] bg-[#0B0C10]/60 text-[11px] font-mono text-[#C5C6C7]/60 uppercase tracking-wider">
                <th className="py-3 px-4">Agente</th>
                <th className="py-3 px-4">Campaña</th>
                <th className="py-3 px-4">Entrada</th>
                <th className="py-3 px-4">Salida</th>
                <th className="py-3 px-4">Horas</th>
                <th className="py-3 px-4">Dif. Turno</th>
                <th className="py-3 px-4">Puntualidad</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#242E3B]/60 text-xs">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#C5C6C7]/50 font-mono">
                    No se encontraron registros de turnos para los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => {
                  const agent = agentMap.get(entry.agentId);
                  const campaign = campaignMap.get(entry.campaignId);
                  const isOpen = entry.clockOut === null;
                  const workedMinutes = getWorkedMinutes(entry);
                  const deviationMinutes = getDeviationMinutes(entry);
                  const needsReview = entryNeedsReview(entry, shifts);

                  return (
                    <tr
                      key={entry.id}
                      className="hover:bg-[#1A202C]/50 transition-colors group"
                    >
                      {/* Agente */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#1F2833] border border-[#242E3B] flex items-center justify-center text-[#66FCF1] font-mono font-bold text-xs shrink-0">
                            {agent ? agent.name.charAt(0) : '?'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white">
                                {agent?.name ?? 'Desconocido'}
                              </span>
                              {agent?.isVip && (
                                <span className="px-1.5 py-0.2 rounded bg-[#F59E0B]/15 text-[#F59E0B] text-[10px] font-mono border border-[#F59E0B]/30">
                                  VIP
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#C5C6C7]/60 font-mono flex items-center gap-1.5 mt-0.5">
                              <span>{agent?.employeeCode}</span>
                              <span>•</span>
                              <span>{agent?.level}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Campaña */}
                      <td className="py-3.5 px-4 font-medium text-white/90">
                        {campaign?.name ?? 'Sin Asignar'}
                      </td>

                      {/* Entrada */}
                      <td className="py-3.5 px-4 font-mono text-[#C5C6C7]">
                        <div className="text-white font-medium">
                          {formatClock(entry.clockIn)}
                        </div>
                        <div className="text-[10px] text-[#C5C6C7]/50">
                          {new Date(entry.clockIn).toLocaleDateString('es-MX', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                      </td>

                      {/* Salida */}
                      <td className="py-3.5 px-4 font-mono">
                        {isOpen ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                            <span>En turno</span>
                          </div>
                        ) : (
                          <div>
                            <div className="text-white font-medium">
                              {formatClock(entry.clockOut!)}
                            </div>
                            <div className="text-[10px] text-[#C5C6C7]/50">
                              {new Date(entry.clockOut!).toLocaleDateString('es-MX', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Horas Trabajadas */}
                      <td className="py-3.5 px-4 font-mono">
                        <span className="text-white font-semibold">
                          {formatDuration(workedMinutes)}
                        </span>
                        {entry.breakMinutes > 0 && (
                          <span className="text-[10px] text-[#C5C6C7]/50 block">
                            (descanso {entry.breakMinutes}m)
                          </span>
                        )}
                      </td>

                      {/* Dif. Turno (Desviación) */}
                      <td className="py-3.5 px-4 font-mono">
                        {isOpen ? (
                          <span className="text-[#C5C6C7]/50 text-xs">--</span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded font-mono text-xs font-semibold ${
                                needsReview
                                  ? 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40'
                                  : deviationMinutes === 0
                                    ? 'bg-[#1F2833] text-[#C5C6C7]'
                                    : 'bg-[#1F2833] text-[#66FCF1]'
                              }`}
                            >
                              {formatDeviation(deviationMinutes)}
                            </span>

                            {needsReview && (
                              <span
                                title={`Desviación de ${Math.abs(deviationMinutes)} min excede el umbral de 15 min`}
                                className="text-[#F59E0B]"
                              >
                                <AlertTriangle className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Puntualidad */}
                      <td className="py-3.5 px-4">
                        {(() => {
                          const punctuality = getEntryPunctuality(entry, shifts);
                          if (!punctuality.shift) {
                            return (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono text-[#C5C6C7]/50 bg-[#1F2833]/60 border border-[#242E3B]">
                                Sin turno
                              </span>
                            );
                          }
                          if (punctuality.flags.length === 0) {
                            return (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium text-[#10B981] bg-[#10B981]/15 border border-[#10B981]/30">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>A tiempo</span>
                              </span>
                            );
                          }
                          return (
                            <div className="flex flex-col gap-1">
                              {punctuality.flags.map((flag) => {
                                let mins: number | null = null;
                                if (flag === 'late_arrival') mins = punctuality.arrivalMinutes;
                                else if (flag === 'early_leave') mins = punctuality.departureMinutes === null ? null : Math.abs(punctuality.departureMinutes);
                                else if (flag === 'late_leave') mins = punctuality.departureMinutes;
                                else mins = punctuality.openOverdueMinutes;

                                return (
                                  <span
                                    key={flag}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 whitespace-nowrap"
                                  >
                                    <AlertTriangle className="w-3 h-3 shrink-0" />
                                    <span>{describeAlert(flag, mins)}</span>
                                  </span>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-4">
                        {entry.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30 font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                            Pendiente
                          </span>
                        )}
                        {entry.status === 'approved' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30 font-mono">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                            Aprobada
                          </span>
                        )}
                        {entry.status === 'rejected' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30 font-mono">
                            <XCircle className="w-3.5 h-3.5 text-[#EF4444]" />
                            Rechazada
                          </span>
                        )}

                        {entry.note && (
                          <p className="text-[10px] text-[#C5C6C7]/60 mt-1 max-w-[140px] truncate" title={entry.note}>
                            {entry.note}
                          </p>
                        )}
                      </td>

                      {/* Botones de Acción por fila */}
                      <td className="py-3.5 px-4 text-right">
                        {entry.status === 'pending' ? (
                          <div className="inline-flex items-center gap-1.5">
                            {/* Aprobar */}
                            <button
                              type="button"
                              onClick={() => handleApprove(entry.id, false)}
                              title={
                                isOpen
                                  ? 'Turno abierto. Debe marcar salida primero'
                                  : 'Aprobar entrada horaria'
                              }
                              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                isOpen
                                  ? 'bg-[#1F2833] text-[#C5C6C7]/40 border border-[#242E3B] cursor-not-allowed'
                                  : 'bg-[#66FCF1]/10 text-[#66FCF1] border border-[#66FCF1]/30 hover:bg-[#66FCF1] hover:text-[#0B0C10] shadow-[0_0_10px_rgba(102,252,241,0.15)]'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Aprobar</span>
                            </button>

                            {/* Rechazar */}
                            <button
                              type="button"
                              onClick={() => handleReject(entry.id)}
                              title="Rechazar entrada horaria"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#EF4444] bg-[#EF4444]/10 hover:bg-[#EF4444] hover:text-white border border-[#EF4444]/20 transition-all"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Rechazar</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#C5C6C7]/50 font-mono">
                            Procesada
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Confirmación de Supervisor */}
      {pendingConfirmationEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#13171F] border border-[#F59E0B]/50 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#F59E0B]/15 border border-[#F59E0B]/30 flex items-center justify-center text-[#F59E0B] shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">
                  Confirmación de Supervisor Requerida
                </h3>
                <p className="text-xs text-[#C5C6C7]/70">
                  Esta entrada excede la regla de tolerancia operativa de ±{REVIEW_THRESHOLD_MIN} minutos.
                </p>
              </div>
            </div>

            {/* Entry Audit Card */}
            <div className="bg-[#0B0C10] rounded-xl border border-[#242E3B] p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-[#242E3B] pb-2">
                <span className="text-[#C5C6C7]/60">Agente:</span>
                <span className="font-semibold text-white">
                  {agentMap.get(pendingConfirmationEntry.agentId)?.name ?? 'Agente'} (
                  {agentMap.get(pendingConfirmationEntry.agentId)?.employeeCode})
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-[#242E3B] pb-2">
                <span className="text-[#C5C6C7]/60">Campaña:</span>
                <span className="text-white">
                  {campaignMap.get(pendingConfirmationEntry.campaignId)?.name}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-[#242E3B] pb-2">
                <span className="text-[#C5C6C7]/60">Turno Programado:</span>
                <span className="font-mono text-white">
                  {formatDuration(pendingConfirmationEntry.scheduledMinutes)}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-[#242E3B] pb-2">
                <span className="text-[#C5C6C7]/60">Horas Trabajadas:</span>
                <span className="font-mono text-white font-semibold">
                  {formatDuration(getWorkedMinutes(pendingConfirmationEntry))}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[#F59E0B] font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  Desviación Detectada:
                </span>
                <span className="font-mono text-sm font-bold text-[#F59E0B] bg-[#F59E0B]/10 px-2 py-0.5 rounded border border-[#F59E0B]/30">
                  {formatDeviation(getDeviationMinutes(pendingConfirmationEntry))}
                </span>
              </div>

              {(() => {
                const p = getEntryPunctuality(pendingConfirmationEntry, shifts);
                if (p.flags.length === 0) return null;
                return (
                  <div className="pt-2 border-t border-[#242E3B]/60 space-y-1.5">
                    <span className="text-[#C5C6C7]/70 font-medium block">
                      Incidencias de Puntualidad:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {p.flags.map((flag) => {
                        let mins: number | null = null;
                        if (flag === 'late_arrival') mins = p.arrivalMinutes;
                        else if (flag === 'early_leave') mins = p.departureMinutes === null ? null : Math.abs(p.departureMinutes);
                        else if (flag === 'late_leave') mins = p.departureMinutes;
                        else mins = p.openOverdueMinutes;

                        return (
                          <span
                            key={flag}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30"
                          >
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            <span>{describeAlert(flag, mins)}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {pendingConfirmationEntry.note && (
                <div className="pt-2 text-[11px] text-[#C5C6C7]/70 italic bg-[#1F2833]/40 p-2 rounded">
                  Nota del sistema: "{pendingConfirmationEntry.note}"
                </div>
              )}
            </div>

            <p className="text-xs text-[#C5C6C7]/80">
              ¿Deseas autorizar formalmente esta desviación y validar el cómputo de horas para nómina y rentabilidad del cliente?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPendingConfirmationEntry(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-[#C5C6C7] hover:text-white bg-[#1F2833] hover:bg-[#253240] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleApprove(pendingConfirmationEntry.id, true)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#0B0C10] bg-[#F59E0B] hover:bg-[#d98206] transition-all shadow-[0_0_12px_rgba(245,158,11,0.3)]"
              >
                Confirmar y Aprobar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal / Panel de Control de Agentes (Clock In / Clock Out) */}
      {isClockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#13171F] border border-[#242E3B] rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#242E3B] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#66FCF1]/15 text-[#66FCF1] flex items-center justify-center border border-[#66FCF1]/30">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Control de Asistencia de Agentes
                  </h3>
                  <p className="text-xs text-[#C5C6C7]/70">
                    Marca entradas y salidas en tiempo real sobre el store de Vooxline.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsClockModalOpen(false)}
                className="p-1.5 rounded-lg text-[#C5C6C7] hover:text-white hover:bg-white/5"
              >
                ✕
              </button>
            </div>

            {/* List of agents with their active clock-in/out status */}
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {agents.map((agent) => {
                const openEntry = timeEntries.find(
                  (e) => e.agentId === agent.id && e.clockOut === null,
                );
                const isClockedIn = Boolean(openEntry);
                const campaign = campaignMap.get(agent.campaignId);
                const today = todayStr();
                const todayShift = shifts.find(
                  (s) => s.agentId === agent.id && s.date === today && s.status === 'scheduled',
                );

                return (
                  <div
                    key={agent.id}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-[#0B0C10] border border-[#242E3B] hover:border-[#66FCF1]/30 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#1F2833] flex items-center justify-center font-bold text-xs text-[#66FCF1] font-mono">
                        {agent.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-white text-xs">
                            {agent.name}
                          </span>
                          <span className="text-[10px] font-mono text-[#C5C6C7]/50">
                            {agent.employeeCode}
                          </span>
                          {todayShift ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#66FCF1]/10 text-[#66FCF1] border border-[#66FCF1]/30">
                              Hoy {todayShift.startTime}-{todayShift.endTime}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30">
                              Sin turno programado hoy
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#C5C6C7]/70 mt-0.5">
                          {campaign?.name} • Ext: {agent.sipExtension}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isClockedIn ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                            Turno Activo
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAgentClockOut(agent.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EF4444]/15 hover:bg-[#EF4444] text-[#EF4444] hover:text-white border border-[#EF4444]/30 text-xs font-semibold transition-all"
                          >
                            <Square className="w-3.5 h-3.5" />
                            <span>Marcar Salida</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-[#C5C6C7]/50">
                            Fuera de turno
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAgentClockIn(agent.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#66FCF1]/10 hover:bg-[#66FCF1] text-[#66FCF1] hover:text-[#0B0C10] border border-[#66FCF1]/30 text-xs font-semibold transition-all shadow-[0_0_10px_rgba(102,252,241,0.15)]"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>Marcar Entrada</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-[#242E3B] flex justify-end">
              <button
                type="button"
                onClick={() => setIsClockModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#1F2833] hover:bg-[#253240] text-xs font-semibold text-white transition-colors"
              >
                Cerrar Panel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
