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
  entryNeedsReview,
} from '@/lib/punctuality';
import { getEntryLocationFlags } from '@/lib/geo';
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
import { PageHeader, Badge } from '@/components/ui';

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

  // Alertas de asistencia: getAttendanceAlerts con desglose por tipo
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
      if (entryNeedsReview(entry, shifts)) {
        const punctuality = getEntryPunctuality(entry, shifts);
        const locationFlags = getEntryLocationFlags(entry);
        const reason = punctuality.flags.length > 0
          ? `Alerta de puntualidad (${punctuality.flags
              .map((f) => describeAlert(f, null))
              .join(', ')}). Requiere confirmación en Time Clock.`
          : locationFlags.length > 0
            ? `Alerta de ubicación (${locationFlags
                .map((f) => describeAlert(f, null))
                .join(', ')}). Requiere confirmación en Time Clock.`
            : `Desviación > ${REVIEW_THRESHOLD_MIN} min requiere autorización formal del supervisor.`;
        setApprovalNotice({
          entryId,
          reason,
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
          <Badge tone="accent">
            <Palmtree className="w-3 h-3" aria-hidden="true" />
            Vacaciones
          </Badge>
        );
      case 'medical':
        return (
          <Badge tone="info">
            <Stethoscope className="w-3 h-3" aria-hidden="true" />
            Médico
          </Badge>
        );
      case 'personal':
        return (
          <Badge tone="neutral">
            <User className="w-3 h-3" aria-hidden="true" />
            Personal
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Activity}
        eyebrow="CENTRO DE MANDO · EN TIEMPO REAL"
        title="Panel general"
        description="Visión unificada de asistencia, contingencias operativas, rentabilidad por campaña y agentes conectados."
        actions={
          <Badge tone="accent" className="px-3 py-1.5">
            <Radio className="h-3.5 w-3.5 animate-pulse" aria-hidden="true" />
            Datos sincronizados
          </Badge>
        }
      />

      {/* 1. TARJETAS KPI SUPERIORES (4 MÉTRICAS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Atención Requerida */}
        <div className="bg-vx-surface border border-vx-border rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-vx-text-2/70 tabular-nums">
              Atención requerida
            </span>
            <div className="w-8 h-8 rounded-xl bg-vx-warning/15 text-vx-warning flex items-center justify-center border border-vx-warning/30">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-vx-text tabular-nums">
              {countPendingEntries}
            </span>
            <span className="text-[13px] text-vx-warning tabular-nums">turnos pendientes</span>
          </div>
          <p className="text-xs text-vx-text-2/50 mt-2 tabular-nums">
            Esperando validación en Time Clock
          </p>
        </div>

        {/* KPI 2: Costo Laboral */}
        <div className="bg-vx-surface border border-vx-border rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-vx-text-2/70 tabular-nums">
              Costo laboral
            </span>
            <div className="w-8 h-8 rounded-xl bg-vx-accent/15 text-vx-accent flex items-center justify-center border border-vx-accent/30">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-vx-text tabular-nums">
              {formatUSD(totals.totalCost)}
            </span>
            <span className="text-[13px] text-vx-accent tabular-nums">USD</span>
          </div>
          <p className="text-xs text-vx-text-2/50 mt-2 tabular-nums">
            {totals.totalHours.toLocaleString('en-US', { maximumFractionDigits: 1 })} hrs acumuladas
          </p>
        </div>

        {/* KPI 3: Alertas de asistencia */}
        <div className="bg-vx-surface border border-vx-border rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-vx-text-2/70 tabular-nums">
                Alertas de asistencia
              </span>
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                  countAttendanceAlertsTotal > 0
                    ? 'bg-vx-danger/15 text-vx-danger border-vx-danger/30'
                    : 'bg-vx-success/15 text-vx-success border-vx-success/30'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-3xl font-extrabold tabular-nums ${
                    countAttendanceAlertsTotal > 0 ? 'text-vx-danger' : 'text-vx-success'
                  }`}
                >
                  {countAttendanceAlertsTotal}
                </span>
                <span className="text-[13px] text-vx-text-2/60 tabular-nums">alertas</span>
              </div>

              <NavLink
                to="/time-clock"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[13px] font-semibold bg-vx-accent/10 text-vx-accent hover:bg-vx-accent hover:text-vx-bg border border-vx-accent/30 transition-all shrink-0"
              >
                <span>Resolver</span>
                <ArrowRight className="w-3 h-3" />
              </NavLink>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-vx-border/60 space-y-1 text-xs tabular-nums">
            {(Object.keys(ALERT_KIND_LABELS) as AttendanceAlertKind[]).map((kind) => {
              const count = attendanceAlertCounts[kind];
              if (count === 0) return null;
              return (
                <div key={kind} className="flex items-center justify-between text-vx-text-2/80">
                  <span>{ALERT_KIND_LABELS[kind]}:</span>
                  <span className="text-vx-warning font-bold">{count}</span>
                </div>
              );
            })}
            <div className="flex items-center justify-between text-vx-text-2/60 pt-0.5">
              <span>Desviaciones de horas:</span>
              <span className="text-vx-text font-bold">{countHourDeviations}</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Conexiones en Vivo */}
        <div className="bg-vx-surface border border-vx-border rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-vx-text-2/70 tabular-nums">
              Conexiones en vivo
            </span>
            <div className="w-8 h-8 rounded-xl bg-vx-raised text-vx-accent flex items-center justify-center border border-vx-border">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[13px] tabular-nums">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-vx-success animate-pulse" />
                <span className="text-vx-text-2/70">En llamada:</span>
                <strong className="text-vx-text font-bold">{countOnCall}</strong>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-vx-accent" />
                <span className="text-vx-text-2/70">Disponible:</span>
                <strong className="text-vx-text font-bold">{countAvailable}</strong>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-vx-warning" />
                <span className="text-vx-text-2/70">Descanso:</span>
                <strong className="text-vx-text font-bold">{countBreak}</strong>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-vx-text-2/40" />
                <span className="text-vx-text-2/70">Desconectado:</span>
                <strong className="text-vx-text font-bold">{countOffline}</strong>
              </div>
            </div>
          </div>
          <p className="text-xs text-vx-text-2/50 mt-2 tabular-nums">
            {agents.length} agentes registrados en total
          </p>
        </div>
      </div>

      {/* GRID DE WIDGETS PRINCIPALES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 2. WIDGET: MOTOR DE APROBACIÓN (MINI) - 7 cols */}
        <div className="lg:col-span-7 bg-vx-surface border border-vx-border rounded-2xl p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-vx-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-vx-warning" />
                <h2 className="text-sm font-bold text-vx-text">
                  Aprobación de turnos pendientes
                </h2>
              </div>
              <NavLink
                to="/time-clock"
                className="text-[13px] tabular-nums text-vx-accent hover:underline inline-flex items-center gap-1"
              >
                <span>Ver todos</span>
                <ArrowRight className="w-3 h-3" />
              </NavLink>
            </div>

            {/* Aviso contextual si la aprobación requiere confirmación */}
            {approvalNotice && (
              <div className="p-3 rounded-xl bg-vx-warning/10 border border-vx-warning/30 text-[13px] text-vx-warning flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{approvalNotice.reason}</span>
                </div>
                <NavLink
                  to="/time-clock"
                  className="px-2.5 py-1 rounded bg-vx-warning text-vx-bg font-bold text-xs hover:bg-vx-warning shrink-0"
                >
                  Ir a Time Clock
                </NavLink>
              </div>
            )}

            {/* Tabla simple */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-vx-border text-xs tabular-nums text-vx-text-2/60">
                    <th className="py-2 px-3">Agente</th>
                    <th className="py-2 px-3">Entrada</th>
                    <th className="py-2 px-3">Salida</th>
                    <th className="py-2 px-3">Horas</th>
                    <th className="py-2 px-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-vx-border/50">
                  {pendingEntriesMini.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-vx-text-2/50 tabular-nums">
                        No hay turnos pendientes por aprobar.
                      </td>
                    </tr>
                  ) : (
                    pendingEntriesMini.map((entry) => {
                      const agent = agentMap.get(entry.agentId);
                      const workedMinutes = getWorkedMinutes(entry);
                      const isOpen = entry.clockOut === null;

                      return (
                        <tr key={entry.id} className="hover:bg-vx-raised/40 transition-colors">
                          <td className="py-2.5 px-3">
                            <span className="font-semibold text-vx-text block">
                              {agent?.name ?? 'Desconocido'}
                            </span>
                            <span className="text-xs text-vx-text-2/50 tabular-nums">
                              {agent?.employeeCode}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 tabular-nums text-vx-text-2">
                            {formatClock(entry.clockIn)}
                          </td>
                          <td className="py-2.5 px-3 tabular-nums text-vx-text-2">
                            {isOpen ? (
                              <span className="text-vx-success text-xs">En turno</span>
                            ) : (
                              formatClock(entry.clockOut!)
                            )}
                          </td>
                          <td className="py-2.5 px-3 tabular-nums text-vx-text font-medium">
                            {formatDuration(workedMinutes)}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleMiniApproveEntry(entry.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[13px] font-semibold bg-vx-accent/10 text-vx-accent border border-vx-accent/30 hover:bg-vx-accent hover:text-vx-bg transition-all"
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

          <div className="pt-3 mt-3 border-t border-vx-border/60 text-xs text-vx-text-2/50 flex justify-between items-center tabular-nums">
            <span>Mostrando {pendingEntriesMini.length} de {countPendingEntries} pendientes</span>
            <NavLink to="/time-clock" className="text-vx-accent hover:underline">
              Gestor completo de asistencia →
            </NavLink>
          </div>
        </div>

        {/* 4. WIDGET: RENTABILIDAD POR CAMPAÑA (MINI) - 5 cols */}
        <div className="lg:col-span-5 bg-vx-surface border border-vx-border rounded-2xl p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-vx-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-vx-success" />
                <h2 className="text-sm font-bold text-vx-text">
                  Campañas más rentables
                </h2>
              </div>
              <NavLink
                to="/payroll"
                className="text-[13px] tabular-nums text-vx-accent hover:underline inline-flex items-center gap-1"
              >
                <span>Ver nómina</span>
                <ArrowRight className="w-3 h-3" />
              </NavLink>
            </div>

            <div className="space-y-3.5">
              {topCampaigns.map((stat, idx) => {
                const marginWidth = Math.min(100, Math.max(0, stat.marginPct));
                return (
                  <div
                    key={stat.campaign.id}
                    className="p-3 rounded-xl bg-vx-bg border border-vx-border space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-vx-raised text-vx-accent tabular-nums text-xs font-bold flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <span className="font-semibold text-vx-text text-[13px] truncate max-w-[160px]">
                          {stat.campaign.name}
                        </span>
                      </div>
                      <span className="text-[13px] tabular-nums font-bold text-vx-text">
                        {formatUSD(stat.billed)}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs tabular-nums">
                        <span className="text-vx-text-2/60">Margen bruto:</span>
                        <span className="text-vx-success font-semibold">
                          {stat.marginPct.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-vx-raised h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-vx-success to-vx-accent h-full rounded-full transition-all duration-500"
                          style={{ width: `${marginWidth}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-vx-border/60 text-xs text-vx-text-2/50 flex justify-between items-center tabular-nums">
            <span>Margen promedio: {totals.avgMarginPct.toFixed(1)}%</span>
            <NavLink to="/payroll" className="text-vx-accent hover:underline">
              Ver finanzas y conciliación →
            </NavLink>
          </div>
        </div>

        {/* 3. WIDGET: GESTIÓN DE PERMISOS (MINI) - 6 cols */}
        <div className="lg:col-span-6 bg-vx-surface border border-vx-border rounded-2xl p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-vx-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-vx-accent" />
                <h2 className="text-sm font-bold text-vx-text">
                  Solicitudes de ausencia pendientes
                </h2>
              </div>
              <NavLink
                to="/time-off"
                className="text-[13px] tabular-nums text-vx-accent hover:underline inline-flex items-center gap-1"
              >
                <span>Ir a Ausencias</span>
                <ArrowRight className="w-3 h-3" />
              </NavLink>
            </div>

            {timeOffNotice && (
              <div className="p-3 rounded-xl bg-vx-warning/10 border border-vx-warning/30 text-[13px] text-vx-warning flex flex-wrap items-center justify-between gap-2 animate-fadeIn">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{timeOffNotice}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setTimeOffNotice(null)}
                  className="text-xs tabular-nums ml-2 hover:underline"
                >
                  Cerrar
                </button>
              </div>
            )}

            <div className="space-y-2.5">
              {pendingTimeOffMini.length === 0 ? (
                <div className="py-8 text-center text-vx-text-2/50 tabular-nums text-[13px]">
                  No hay solicitudes de ausencia pendientes.
                </div>
              ) : (
                pendingTimeOffMini.map((req) => {
                  const agent = agentMap.get(req.agentId);
                  return (
                    <div
                      key={req.id}
                      className="p-3 rounded-xl bg-vx-bg border border-vx-border flex items-center justify-between gap-3 text-[13px]"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-vx-text truncate">
                            {agent?.name ?? 'Agente'}
                          </span>
                          {renderTimeOffBadge(req.type)}
                        </div>
                        <div className="text-xs text-vx-text-2/60 tabular-nums">
                          {req.startDate} → {req.endDate} ({req.hours}h)
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMiniApproveTimeOff(req.id)}
                          aria-label={`Aprobar solicitud de ${agent?.name ?? 'agente'}`}
                          className="px-2.5 py-1 rounded-lg text-[13px] font-semibold bg-vx-accent/10 text-vx-accent border border-vx-accent/30 hover:bg-vx-accent hover:text-vx-bg transition-all"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMiniRejectTimeOff(req.id)}
                          aria-label={`Rechazar solicitud de ${agent?.name ?? 'agente'}`}
                          className="px-2.5 py-1 rounded-lg text-[13px] font-semibold bg-vx-danger/10 text-vx-danger border border-vx-danger/30 hover:bg-vx-danger hover:text-vx-text transition-all"
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

          <div className="pt-3 mt-3 border-t border-vx-border/60 text-xs text-vx-text-2/50 flex justify-between items-center tabular-nums">
            <span>{timeOffRequests.filter((r) => r.status === 'pending').length} solicitudes totales</span>
            <NavLink to="/time-off" className="text-vx-accent hover:underline">
              Administrar saldos PTO →
            </NavLink>
          </div>
        </div>

        {/* 5. WIDGET: TELEMETRÍA DE NODOS (PLACEHOLDER VISUAL) - 6 cols */}
        <div className="lg:col-span-6 bg-vx-surface border border-vx-border rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-vx-border pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-vx-accent" />
                <h2 className="text-sm font-bold text-vx-text">
                  Telemetría SIP y geolocalización
                </h2>
              </div>
              <span className="px-2 py-0.5 rounded text-xs tabular-nums font-bold bg-vx-raised text-vx-accent border border-vx-border">
                Simulado
              </span>
            </div>

            {/* Visual SVG Network Map */}
            <div className="relative w-full h-44 bg-vx-bg rounded-xl border border-vx-border overflow-hidden flex items-center justify-center p-2">
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

          <div className="pt-3 mt-3 border-t border-vx-border/60 text-xs text-vx-text-2/50 flex justify-between items-center tabular-nums">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-vx-accent" />
              Topología SIP distribuida
            </span>
            <span className="text-vx-text-2/40">Vista ilustrativa</span>
          </div>
        </div>
      </div>
    </div>
  );
};
