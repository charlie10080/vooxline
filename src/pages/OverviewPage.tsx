import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import type { TimeOffType, ActionResult } from '@/types';
import type { AttendanceAlertKind } from '@/lib/punctuality';
import { useWorkforceStore } from '@/store/useWorkforceStore';
import { useScheduleStore } from '@/store/useScheduleStore';
import { useDirectoryStore } from '@/store/useDirectoryStore';
import {
  getAttendanceAlerts,
  countAlertsByKind,
  getEntryPunctuality,
  describeAlert,
  ALERT_KIND_LABELS,
} from '@/lib/punctuality';
import {
  getCampaignStats,
  getPayrollTotals,
  getWorkedMinutes,
  getDeviationMinutes,
  REVIEW_THRESHOLD_MIN,
} from '@/lib/metrics';
import {
  formatUSD,
  formatDuration,
  formatClock,
} from '@/lib/time';
import {
  AlertCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  DollarSign,
  Palmtree,
  Stethoscope,
  User,
  Radio,
  CheckCircle2,
  XCircle,
  Activity,
  Layers,
} from 'lucide-react';

export const OverviewPage: React.FC = () => {
  const {
    timeEntries,
    timeOffRequests,
    campaigns,
    agents,
    approveEntry,
    approveTimeOff,
    rejectTimeOff,
  } = useWorkforceStore();
  const { shifts } = useScheduleStore();
  const { profiles } = useDirectoryStore();

  // Mapeos auxiliares
  const agentMap = new Map(agents.map((a) => [a.id, a]));

  // Mensaje de advertencia para el mini motor de aprobación
  const [approvalNotice, setApprovalNotice] = useState<{
    entryId: string;
    reason: string;
  } | null>(null);

  // Mensaje de advertencia para solicitudes de ausencia
  const [timeOffNotice, setTimeOffNotice] = useState<string | null>(null);

  // --- 1. TARJETAS KPI SUPERIORES ---
  // Atención Requerida: Conteo real de timeEntries con status 'pending'
  const countPendingEntries = timeEntries.filter((e) => e.status === 'pending').length;

  // Costo Laboral: Total real usando getPayrollTotals() pasando getCampaignStats()
  const campaignStats = getCampaignStats(campaigns, timeEntries);
  const totals = getPayrollTotals(campaignStats);

  // Alertas Asistencia: getAttendanceAlerts con desglose por tipo
  const attendanceAlerts = getAttendanceAlerts({
    entries: timeEntries,
    shifts,
    agents,
    profiles,
    timeOffRequests,
  });
  const countAttendanceAlertsTotal = attendanceAlerts.length;
  const attendanceAlertCounts = countAlertsByKind(attendanceAlerts);

  // Desviaciones de horas: timeEntries pending, CERRADAS (clockOut !== null) y con |desviación| > 15 min
  const assistanceAlertEntries = timeEntries.filter(
    (e) =>
      e.status === 'pending' &&
      e.clockOut !== null &&
      Math.abs(getDeviationMinutes(e)) > REVIEW_THRESHOLD_MIN,
  );
  const countHourDeviations = assistanceAlertEntries.length;

  // Conexiones en Vivo: Conteo real de agents agrupado por status (on_call, available, break, offline)
  const countOnCall = agents.filter((a) => a.status === 'on_call').length;
  const countAvailable = agents.filter((a) => a.status === 'available').length;
  const countBreak = agents.filter((a) => a.status === 'break').length;
  const countOffline = agents.filter((a) => a.status === 'offline').length;

  // --- 2. WIDGET: MOTOR DE APROBACIÓN (MINI) ---
  const pendingEntriesMini = timeEntries
    .filter((e) => e.status === 'pending')
    .slice(0, 5);

  const handleMiniApproveEntry = (entryId: string) => {
    const entry = timeEntries.find((e) => e.id === entryId);
    if (entry) {
      if (entry.clockOut === null) {
        setApprovalNotice({
          entryId,
          reason: 'Turno abierto en curso. El agente debe marcar salida primero.',
        });
        return;
      }
      const punctuality = getEntryPunctuality(entry, shifts);
      if (punctuality.flags.length > 0) {
        setApprovalNotice({
          entryId,
          reason: `Alerta de puntualidad (${punctuality.flags
            .map((f) => describeAlert(f, null))
            .join(', ')}). Requiere confirmación en Time Clock.`,
        });
        return;
      }
    }

    const res: ActionResult = approveEntry(entryId);
    if (res.ok) {
      setApprovalNotice(null);
    } else {
      if (res.reason === 'needs_confirmation') {
        setApprovalNotice({
          entryId,
          reason: `Desviación > ${REVIEW_THRESHOLD_MIN} min requiere autorización formal del supervisor.`,
        });
      } else if (res.reason === 'entry_open') {
        setApprovalNotice({
          entryId,
          reason: 'Turno abierto en curso. El agente debe marcar salida primero.',
        });
      } else {
        setApprovalNotice({
          entryId,
          reason: `No se pudo aprobar: ${res.reason}`,
        });
      }
    }
  };

  // --- 3. WIDGET: GESTIÓN DE PERMISOS (MINI) ---
  const pendingTimeOffMini = timeOffRequests
    .filter((r) => r.status === 'pending')
    .slice(0, 3);

  const handleMiniApproveTimeOff = (requestId: string) => {
    const req = timeOffRequests.find((r) => r.id === requestId);
    const agent = req ? agentMap.get(req.agentId) : null;
    const res = approveTimeOff(requestId);

    if (res.ok) {
      setTimeOffNotice(null);
    } else {
      if (res.reason === 'insufficient_pto') {
        setTimeOffNotice(
          `Saldo insuficiente: ${agent?.name ?? 'El agente'} solo dispone de ${agent?.ptoBalanceHours ?? 0}h de PTO para cubrir ${req?.hours ?? 0}h.`,
        );
      } else {
        setTimeOffNotice(`Error: ${res.reason}`);
      }
    }
  };

  const handleMiniRejectTimeOff = (requestId: string) => {
    const res = rejectTimeOff(requestId);
    if (res.ok) {
      setTimeOffNotice(null);
    }
  };

  // --- 4. WIDGET: RENTABILIDAD POR CAMPAÑA (MINI) ---
  // Ordena por USD facturado de mayor a menor y toma las 3 primeras
  const topCampaigns = [...campaignStats]
    .sort((a, b) => b.billed - a.billed)
    .slice(0, 3);

  // Helper para insignias de tipo de permiso
  const renderTimeOffBadge = (type: TimeOffType) => {
    switch (type) {
      case 'vacation':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[#66FCF1]/10 text-[#66FCF1] border border-[#66FCF1]/30">
            <Palmtree className="w-3 h-3" />
            Vacaciones
          </span>
        );
      case 'medical':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/30">
            <Stethoscope className="w-3 h-3" />
            Médico
          </span>
        );
      case 'personal':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[#A78BFA]/10 text-[#A78BFA] border border-[#A78BFA]/30">
            <User className="w-3 h-3" />
            Personal
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header del Overview */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-[#13151c] border border-[#242E3B] rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-[#66FCF1]/5 to-transparent pointer-events-none" />

        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-[#66FCF1]/10 text-[#66FCF1] border border-[#66FCF1]/30">
              CENTRO DE MANDO B2B
            </span>
            <span className="text-xs text-[#C5C6C7]/50 font-mono">
              Consola General • En tiempo real
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Activity className="w-7 h-7 text-[#66FCF1]" />
            <span>Dashboard Principal</span>
          </h1>
          <p className="text-sm text-[#C5C6C7]/80">
            Visión unificada de asistencia, contingencias operativas, rentabilidad por campaña y talento activo.
          </p>
        </div>

        <div className="flex items-center gap-2 relative z-10">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B0C10] border border-[#242E3B] text-xs font-mono text-[#66FCF1]">
            <Radio className="w-3.5 h-3.5 animate-pulse text-[#66FCF1]" />
            <span>Store Sincronizado</span>
          </span>
        </div>
      </div>

      {/* 1. TARJETAS KPI SUPERIORES (4 MÉTRICAS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Atención Requerida */}
        <div className="bg-[#13151c] border border-[#242E3B] rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#C5C6C7]/70 font-mono uppercase tracking-wider">
              Atención Requerida
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#F59E0B]/15 text-[#F59E0B] flex items-center justify-center border border-[#F59E0B]/30">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">
              {countPendingEntries}
            </span>
            <span className="text-xs text-[#F59E0B] font-mono">turnos pendientes</span>
          </div>
          <p className="text-[11px] text-[#C5C6C7]/50 mt-2 font-mono">
            Esperando validación en Time Clock
          </p>
        </div>

        {/* KPI 2: Costo Laboral */}
        <div className="bg-[#13151c] border border-[#242E3B] rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#C5C6C7]/70 font-mono uppercase tracking-wider">
              Costo Laboral
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#66FCF1]/15 text-[#66FCF1] flex items-center justify-center border border-[#66FCF1]/30">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">
              {formatUSD(totals.totalCost)}
            </span>
            <span className="text-xs text-[#66FCF1] font-mono">USD</span>
          </div>
          <p className="text-[11px] text-[#C5C6C7]/50 mt-2 font-mono">
            {totals.totalHours.toLocaleString('en-US', { maximumFractionDigits: 1 })} hrs acumuladas
          </p>
        </div>

        {/* KPI 3: Alertas Asistencia */}
        <div className="bg-[#13151c] border border-[#242E3B] rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#C5C6C7]/70 font-mono uppercase tracking-wider">
                Alertas Asistencia
              </span>
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                  countAttendanceAlertsTotal > 0
                    ? 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30'
                    : 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-3xl font-extrabold font-mono ${
                    countAttendanceAlertsTotal > 0 ? 'text-[#EF4444]' : 'text-[#10B981]'
                  }`}
                >
                  {countAttendanceAlertsTotal}
                </span>
                <span className="text-xs text-[#C5C6C7]/60 font-mono">alertas</span>
              </div>

              <NavLink
                to="/time-clock"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#66FCF1]/10 text-[#66FCF1] hover:bg-[#66FCF1] hover:text-[#0B0C10] border border-[#66FCF1]/30 transition-all shrink-0"
              >
                <span>Resolver</span>
                <ArrowRight className="w-3 h-3" />
              </NavLink>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-[#242E3B]/60 space-y-1 text-[11px] font-mono">
            {(Object.keys(ALERT_KIND_LABELS) as AttendanceAlertKind[]).map((kind) => {
              const count = attendanceAlertCounts[kind];
              if (count === 0) return null;
              return (
                <div key={kind} className="flex items-center justify-between text-[#C5C6C7]/80">
                  <span>{ALERT_KIND_LABELS[kind]}:</span>
                  <span className="text-[#F59E0B] font-bold">{count}</span>
                </div>
              );
            })}
            <div className="flex items-center justify-between text-[#C5C6C7]/60 pt-0.5">
              <span>Desviaciones de horas:</span>
              <span className="text-white font-bold">{countHourDeviations}</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Conexiones en Vivo */}
        <div className="bg-[#13151c] border border-[#242E3B] rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#C5C6C7]/70 font-mono uppercase tracking-wider">
              Conexiones en Vivo
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#1F2833] text-[#66FCF1] flex items-center justify-center border border-[#242E3B]">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                <span className="text-[#C5C6C7]/70">Llamada:</span>
                <strong className="text-white font-bold">{countOnCall}</strong>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#66FCF1]" />
                <span className="text-[#C5C6C7]/70">Libre:</span>
                <strong className="text-white font-bold">{countAvailable}</strong>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                <span className="text-[#C5C6C7]/70">Break:</span>
                <strong className="text-white font-bold">{countBreak}</strong>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#C5C6C7]/40" />
                <span className="text-[#C5C6C7]/70">Offline:</span>
                <strong className="text-white font-bold">{countOffline}</strong>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-[#C5C6C7]/50 mt-2 font-mono">
            {agents.length} agentes registrados en total
          </p>
        </div>
      </div>

      {/* GRID DE WIDGETS PRINCIPALES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 2. WIDGET: MOTOR DE APROBACIÓN (MINI) - 7 cols */}
        <div className="lg:col-span-7 bg-[#13151c] border border-[#242E3B] rounded-2xl shadow-xl p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#242E3B] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                <h2 className="text-sm font-bold text-white tracking-wide">
                  Motor de Aprobación (Turnos Pendientes)
                </h2>
              </div>
              <NavLink
                to="/time-clock"
                className="text-xs font-mono text-[#66FCF1] hover:underline inline-flex items-center gap-1"
              >
                <span>Ver todos</span>
                <ArrowRight className="w-3 h-3" />
              </NavLink>
            </div>

            {/* Aviso contextual si la aprobación requiere confirmación */}
            {approvalNotice && (
              <div className="p-3 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-xs text-[#F59E0B] flex items-center justify-between gap-3 animate-fadeIn">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{approvalNotice.reason}</span>
                </div>
                <NavLink
                  to="/time-clock"
                  className="px-2.5 py-1 rounded bg-[#F59E0B] text-[#0B0C10] font-bold text-[11px] hover:bg-[#d98206] shrink-0"
                >
                  Ir a Time Clock
                </NavLink>
              </div>
            )}

            {/* Tabla simple */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#242E3B] text-[11px] font-mono text-[#C5C6C7]/60 uppercase">
                    <th className="py-2 px-3">Agente</th>
                    <th className="py-2 px-3">Entrada</th>
                    <th className="py-2 px-3">Salida</th>
                    <th className="py-2 px-3">Horas</th>
                    <th className="py-2 px-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#242E3B]/50">
                  {pendingEntriesMini.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-[#C5C6C7]/50 font-mono">
                        No hay turnos pendientes por aprobar.
                      </td>
                    </tr>
                  ) : (
                    pendingEntriesMini.map((entry) => {
                      const agent = agentMap.get(entry.agentId);
                      const workedMinutes = getWorkedMinutes(entry);
                      const isOpen = entry.clockOut === null;

                      return (
                        <tr key={entry.id} className="hover:bg-[#1A202C]/40 transition-colors">
                          <td className="py-2.5 px-3">
                            <span className="font-semibold text-white block">
                              {agent?.name ?? 'Desconocido'}
                            </span>
                            <span className="text-[10px] text-[#C5C6C7]/50 font-mono">
                              {agent?.employeeCode}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[#C5C6C7]">
                            {formatClock(entry.clockIn)}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[#C5C6C7]">
                            {isOpen ? (
                              <span className="text-[#10B981] text-[11px]">En turno</span>
                            ) : (
                              formatClock(entry.clockOut!)
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-white font-medium">
                            {formatDuration(workedMinutes)}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleMiniApproveEntry(entry.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#66FCF1]/10 text-[#66FCF1] border border-[#66FCF1]/30 hover:bg-[#66FCF1] hover:text-[#0B0C10] transition-all"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Aprobar</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-[#242E3B]/60 text-[11px] text-[#C5C6C7]/50 flex justify-between items-center font-mono">
            <span>Mostrando {pendingEntriesMini.length} de {countPendingEntries} pendientes</span>
            <NavLink to="/time-clock" className="text-[#66FCF1] hover:underline">
              Gestor completo de asistencia →
            </NavLink>
          </div>
        </div>

        {/* 4. WIDGET: RENTABILIDAD POR CAMPAÑA (MINI) - 5 cols */}
        <div className="lg:col-span-5 bg-[#13151c] border border-[#242E3B] rounded-2xl shadow-xl p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#242E3B] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-[#10B981]" />
                <h2 className="text-sm font-bold text-white tracking-wide">
                  Top Rentabilidad por Cuenta
                </h2>
              </div>
              <NavLink
                to="/payroll"
                className="text-xs font-mono text-[#66FCF1] hover:underline inline-flex items-center gap-1"
              >
                <span>Ver Nómina</span>
                <ArrowRight className="w-3 h-3" />
              </NavLink>
            </div>

            <div className="space-y-3.5">
              {topCampaigns.map((stat, idx) => {
                const marginWidth = Math.min(100, Math.max(0, stat.marginPct));
                return (
                  <div
                    key={stat.campaign.id}
                    className="p-3 rounded-xl bg-[#0B0C10] border border-[#242E3B] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-[#1F2833] text-[#66FCF1] font-mono text-[11px] font-bold flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <span className="font-semibold text-white text-xs truncate max-w-[160px]">
                          {stat.campaign.name}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-white">
                        {formatUSD(stat.billed)}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-[#C5C6C7]/60">Margen bruto:</span>
                        <span className="text-[#10B981] font-semibold">
                          {stat.marginPct.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-[#1F2833] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-[#10B981] to-[#66FCF1] h-full rounded-full transition-all duration-500"
                          style={{ width: `${marginWidth}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-[#242E3B]/60 text-[11px] text-[#C5C6C7]/50 flex justify-between items-center font-mono">
            <span>Margen Promedio: {totals.avgMarginPct.toFixed(1)}%</span>
            <NavLink to="/payroll" className="text-[#66FCF1] hover:underline">
              Ver finanzas y conciliación →
            </NavLink>
          </div>
        </div>

        {/* 3. WIDGET: GESTIÓN DE PERMISOS (MINI) - 6 cols */}
        <div className="lg:col-span-6 bg-[#13151c] border border-[#242E3B] rounded-2xl shadow-xl p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#242E3B] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-[#66FCF1]" />
                <h2 className="text-sm font-bold text-white tracking-wide">
                  Gestión de Permisos (Pendientes)
                </h2>
              </div>
              <NavLink
                to="/time-off"
                className="text-xs font-mono text-[#66FCF1] hover:underline inline-flex items-center gap-1"
              >
                <span>Ir a Time Off</span>
                <ArrowRight className="w-3 h-3" />
              </NavLink>
            </div>

            {timeOffNotice && (
              <div className="p-3 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-xs text-[#F59E0B] flex items-center justify-between animate-fadeIn">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{timeOffNotice}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setTimeOffNotice(null)}
                  className="text-[10px] uppercase font-mono ml-2 hover:underline"
                >
                  Cerrar
                </button>
              </div>
            )}

            <div className="space-y-2.5">
              {pendingTimeOffMini.length === 0 ? (
                <div className="py-8 text-center text-[#C5C6C7]/50 font-mono text-xs">
                  No hay solicitudes de ausencia pendientes.
                </div>
              ) : (
                pendingTimeOffMini.map((req) => {
                  const agent = agentMap.get(req.agentId);
                  return (
                    <div
                      key={req.id}
                      className="p-3 rounded-xl bg-[#0B0C10] border border-[#242E3B] flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white truncate">
                            {agent?.name ?? 'Agente'}
                          </span>
                          {renderTimeOffBadge(req.type)}
                        </div>
                        <div className="text-[11px] text-[#C5C6C7]/60 font-mono">
                          {req.startDate} → {req.endDate} ({req.hours}h)
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMiniApproveTimeOff(req.id)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#66FCF1]/10 text-[#66FCF1] border border-[#66FCF1]/30 hover:bg-[#66FCF1] hover:text-[#0B0C10] transition-all"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMiniRejectTimeOff(req.id)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30 hover:bg-[#EF4444] hover:text-white transition-all"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-[#242E3B]/60 text-[11px] text-[#C5C6C7]/50 flex justify-between items-center font-mono">
            <span>{timeOffRequests.filter((r) => r.status === 'pending').length} solicitudes totales</span>
            <NavLink to="/time-off" className="text-[#66FCF1] hover:underline">
              Administrar saldos PTO →
            </NavLink>
          </div>
        </div>

        {/* 5. WIDGET: TELEMETRÍA DE NODOS (PLACEHOLDER VISUAL) - 6 cols */}
        <div className="lg:col-span-6 bg-[#13151c] border border-[#242E3B] rounded-2xl shadow-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#242E3B] pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-[#38BDF8]" />
                <h2 className="text-sm font-bold text-white tracking-wide">
                  Telemetría SIP & Geolocalización
                </h2>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#1F2833] text-[#66FCF1] border border-[#242E3B]">
                Simulado
              </span>
            </div>

            {/* Visual SVG Network Map */}
            <div className="relative w-full h-44 bg-[#0B0C10] rounded-xl border border-[#242E3B] overflow-hidden flex items-center justify-center p-2">
              {/* Subtle grid background */}
              <div
                className="absolute inset-0 opacity-15"
                style={{
                  backgroundImage:
                    'radial-gradient(rgba(102, 252, 241, 0.4) 1px, transparent 1px)',
                  backgroundSize: '16px 16px',
                }}
              />

              {/* Network SVG illustration */}
              <svg
                viewBox="0 0 400 160"
                className="w-full h-full relative z-10"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Connecting Lines */}
                <path
                  d="M 70 80 Q 140 30 200 70"
                  stroke="#242E3B"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
                <path
                  d="M 200 70 Q 260 110 330 65"
                  stroke="#242E3B"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
                <path
                  d="M 200 70 L 200 135"
                  stroke="#242E3B"
                  strokeWidth="2"
                />
                <path
                  d="M 70 80 L 200 135"
                  stroke="#242E3B"
                  strokeWidth="1.5"
                  strokeOpacity="0.5"
                />

                {/* Animated Glowing Connection Line */}
                <path
                  d="M 70 80 Q 140 30 200 70 T 330 65"
                  stroke="url(#neonGradient)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  opacity="0.8"
                />

                {/* Node 1: Morelia */}
                <g transform="translate(70, 80)">
                  <circle r="14" fill="#66FCF1" fillOpacity="0.1" />
                  <circle r="6" fill="#66FCF1" />
                  <text
                    x="0"
                    y="-12"
                    fill="#C5C6C7"
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    Morelia Hub
                  </text>
                </g>

                {/* Node 2: CDMX Core */}
                <g transform="translate(200, 70)">
                  <circle r="18" fill="#66FCF1" fillOpacity="0.15" />
                  <circle r="8" fill="#66FCF1" />
                  <circle r="4" fill="#0B0C10" />
                  <text
                    x="0"
                    y="-16"
                    fill="#FFFFFF"
                    fontWeight="bold"
                    fontSize="10"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    CDMX Central (SIP)
                  </text>
                </g>

                {/* Node 3: Cloud Edge */}
                <g transform="translate(330, 65)">
                  <circle r="14" fill="#38BDF8" fillOpacity="0.1" />
                  <circle r="6" fill="#38BDF8" />
                  <text
                    x="0"
                    y="-12"
                    fill="#C5C6C7"
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    US-East Cloud
                  </text>
                </g>

                {/* Node 4: Guadalajara Backup */}
                <g transform="translate(200, 135)">
                  <circle r="12" fill="#A78BFA" fillOpacity="0.1" />
                  <circle r="5" fill="#A78BFA" />
                  <text
                    x="0"
                    y="18"
                    fill="#C5C6C7"
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    GDL Trunk
                  </text>
                </g>

                {/* Gradients */}
                <defs>
                  <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#66FCF1" />
                    <stop offset="50%" stopColor="#38BDF8" />
                    <stop offset="100%" stopColor="#A78BFA" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-[#242E3B]/60 text-[11px] text-[#C5C6C7]/50 flex justify-between items-center font-mono">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#38BDF8]" />
              Topología SIP distribuida
            </span>
            <span className="text-[#C5C6C7]/40">Módulo en telemetría visual</span>
          </div>
        </div>
      </div>
    </div>
  );
};
