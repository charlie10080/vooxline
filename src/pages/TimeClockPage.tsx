import React, { useState } from 'react';
import type { TimeEntry, EntryStatus, ActionResult, GeoCheck } from '@/types';
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
  readBrowserLocation,
  checkLocation,
  getEntryLocationFlags,
  describeGeoCheck,
  geoCheckWarning,
  DEFAULT_RADIUS_M,
} from '@/lib/geo';
import type { GeoReading } from '@/lib/geo';
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
  PageHeader,
  Card,
  Button,
  Badge,
  StatCard,
  Avatar,
  EmptyState,
  Modal,
  Input,
  Select,
  Tabs,
  Notice,
} from '@/components/ui';
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
  Sparkles,
  MapPin,
  Inbox,
} from 'lucide-react';

type TabFilter = 'all' | EntryStatus;

const NOTICE_TONE = {
  success: 'success',
  warning: 'warning',
  error: 'danger',
  info: 'info',
} as const;

const GeoBadge: React.FC<{ check: GeoCheck }> = ({ check }) => {
  const color =
    check.status === 'inside'
      ? 'text-vx-success'
      : check.status === 'no_reference'
        ? 'text-vx-text-2/50'
        : 'text-vx-warning';
  return (
    <div
      className={`flex items-center gap-1 text-xs mt-0.5 ${color}`}
      title={check.accuracyM !== null ? `Precisión ±${check.accuracyM} m` : undefined}
    >
      <MapPin className="w-3 h-3 shrink-0" />
      <span>{describeGeoCheck(check)}</span>
    </div>
  );
};

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
    setAuthorizedLocation,
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
  // Agente cuya ubicación se está leyendo (bloquea sus botones mientras responde el navegador)
  const [locatingAgentId, setLocatingAgentId] = useState<string | null>(null);

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
  // Avisa al supervisor si la ubicación de la marca quedó como alerta
  const geoWarning = (reading: GeoReading, agentId: string): string => {
    const warning = geoCheckWarning(checkLocation(reading, agentMap.get(agentId)?.authorizedLocation));
    return warning ? ` ${warning}` : '';
  };

  const handleAgentClockIn = async (agentId: string) => {
    setLocatingAgentId(agentId);
    const reading = await readBrowserLocation();
    setLocatingAgentId(null);
    const today = todayStr();
    const scheduled = getScheduledMinutesFor(shifts, agentId, today);
    const res = clockIn(agentId, scheduled ?? undefined, reading);
    const agent = agentMap.get(agentId);
    if (res.ok) {
      const warning = geoWarning(reading, agentId);
      setActionAlert({
        type: warning ? 'warning' : 'success',
        message: `Turno iniciado para ${agent?.name ?? 'agente'}. Entrada registrada ahora.${warning}`,
      });
    } else {
      setActionAlert({
        type: 'warning',
        message: `No se pudo marcar entrada: ${res.reason === 'already_clocked_in' ? 'El agente ya tiene un turno abierto.' : res.reason}`,
      });
    }
  };

  const handleSetAuthorizedLocation = async (agentId: string) => {
    setLocatingAgentId(agentId);
    const reading = await readBrowserLocation();
    setLocatingAgentId(null);
    const agent = agentMap.get(agentId);
    if (reading === 'denied' || reading === 'unavailable') {
      setActionAlert({
        type: 'error',
        message: reading === 'denied'
          ? 'El navegador negó el permiso de ubicación. Actívalo para fijar la ubicación autorizada.'
          : 'No se pudo obtener la ubicación actual. Inténtalo de nuevo.',
      });
      return;
    }
    const res = setAuthorizedLocation(agentId, reading.point);
    setActionAlert(
      res.ok
        ? {
            type: 'success',
            message: `Ubicación autorizada de ${agent?.name ?? 'agente'} fijada aquí (radio ${DEFAULT_RADIUS_M} m, precisión ±${reading.accuracyM} m).`,
          }
        : { type: 'error', message: 'No se encontró al agente.' },
    );
  };

  const handleAgentClockOut =async (agentId: string) => {
    setLocatingAgentId(agentId);
    const reading = await readBrowserLocation();
    setLocatingAgentId(null);
    const res = clockOut(agentId, reading);
    const agent = agentMap.get(agentId);
    if (res.ok) {
      const warning = geoWarning(reading, agentId);
      setActionAlert({
        type: warning ? 'warning' : 'success',
        message: `Turno finalizado para ${agent?.name ?? 'agente'}. Salida registrada ahora.${warning}`,
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
      <PageHeader
        icon={Clock}
        eyebrow="OPERACIONES · ASISTENCIA"
        title="Time Clock y aprobación"
        description={`Control horario de agentes, aprobación de marcajes y cierre para nómina. Tolerancia operativa: ±${REVIEW_THRESHOLD_MIN} min.`}
        actions={
          <>
            <Button icon={Users} onClick={() => setIsClockModalOpen(true)}>
              Marcar entrada / salida
            </Button>
            <Button
              variant="primary"
              icon={CheckCheck}
              onClick={handleApproveBatch}
              disabled={countPending === 0}
            >
              Aprobar lote ({countPending})
            </Button>
            <Button
              variant="ghost"
              icon={RotateCcw}
              aria-label="Reiniciar todos los datos de demostración"
              title="Reiniciar todos los datos de demostración"
              onClick={() => {
                if (window.confirm('¿Reiniciar todos los datos de demostración? Se restablecerán asistencias, usuarios, turnos y llamadas a su estado inicial.')) {
                  resetApplicationState();
                }
              }}
            />
          </>
        }
      />

      {/* Panel Superior: Alertas de Asistencia */}
      <Card
        title={
          <span className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-vx-warning" />
            <span>Alertas de asistencia</span>
            <Badge tone="warning">{attendanceAlerts.length}</Badge>
          </span>
        }
        subtitle="Puntualidad en turnos programados, demoras, salidas anticipadas y ausencias sin marcaje."
        actions={
          <div className="flex flex-wrap items-center gap-1.5">
            {(Object.keys(ALERT_KIND_LABELS) as AttendanceAlertKind[]).map((kind) => {
              const count = alertCounts[kind];
              return (
                <Badge key={kind} tone={count > 0 ? 'warning' : 'neutral'}>
                  {ALERT_KIND_LABELS[kind]}: <span className={count > 0 ? 'text-vx-text' : ''}>{count}</span>
                </Badge>
              );
            })}
          </div>
        }
      >
        {attendanceAlerts.length === 0 ? (
          <div className="flex items-center gap-2 py-2 text-[13px] text-vx-success tabular-nums">
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
                  className="flex items-center justify-between p-3 rounded-xl bg-vx-bg border border-vx-border hover:border-vx-warning/40 transition-colors text-[13px]"
                >
                  <div className="min-w-0 mr-2">
                    <div className="font-semibold text-vx-text truncate">
                      {agent?.name ?? 'Desconocido'}
                    </div>
                    <div className="text-xs text-vx-text-2/50 tabular-nums">
                      {alert.date} • {agent?.employeeCode}
                    </div>
                  </div>

                  <Badge tone="warning" className="shrink-0">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    <span>{describeAlert(alert.kind, alert.minutes)}</span>
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Action Notification Alert */}
      {actionAlert && (
        <Notice tone={NOTICE_TONE[actionAlert.type]} onClose={() => setActionAlert(null)}>
          {actionAlert.message}
        </Notice>
      )}

      {/* Batch Notice Banner */}
      {batchNotice && (
        <div role="status" className="bg-vx-surface border border-vx-accent/40 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2.5 rounded-xl bg-vx-accent/15 text-vx-accent border border-vx-accent/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-vx-text">Resultado del Proceso en Lote</h2>
                <p className="text-[13px] text-vx-text-2 mt-0.5">
                  Se aprobaron automáticamente <strong className="text-vx-accent font-semibold">{batchNotice.approved}</strong> entradas sin incidencias.
                </p>
                {batchNotice.blockedCount > 0 ? (
                  <div className="flex items-center gap-2 mt-2 text-[13px] text-vx-warning bg-vx-warning/10 px-3 py-1.5 rounded-lg border border-vx-warning/20">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>
                      <strong>{batchNotice.blockedCount} entradas quedaron bloqueadas</strong> por presentar desviación mayor a 15 minutos o por ser turnos abiertos. Requieren confirmación manual del supervisor.
                    </span>
                  </div>
                ) : (
                  <p className="text-[13px] text-vx-success mt-1">
                    ✓ No quedaron entradas bloqueadas en este lote.
                  </p>
                )}
              </div>
            </div>

            <Button size="sm" onClick={() => setBatchNotice(null)} className="self-end sm:self-center">
              Entendido
            </Button>
          </div>
        </div>
      )}

      {/* Stats Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4">
        <StatCard label="Total registros" value={countAll} icon={Clock} tone="accent" />
        <StatCard label="Pendientes" value={countPending} icon={AlertTriangle} tone="warning" />
        <StatCard label="Aprobadas" value={countApproved} icon={CheckCircle2} tone="success" />
        <StatCard label="Rechazadas" value={countRejected} icon={XCircle} tone="danger" />
      </div>

      {/* Main Table Card: Motor de Aprobación y Asistencia */}
      <Card
        title="Aprobación de marcajes"
        subtitle={`${filteredEntries.length} registros listados · revisión de supervisor si la desviación supera ${REVIEW_THRESHOLD_MIN} min`}
        bodyClassName=""
      >
        {/* Controls Bar: Tabs + Search + Campaign Filter */}
        <div className="flex flex-col justify-between gap-3 border-b border-vx-border p-4 md:flex-row md:items-center">
          <Tabs
            value={activeTab}
            onChange={setActiveTab}
            options={[
              { value: 'all', label: 'Todas', count: countAll },
              { value: 'pending', label: 'Pendientes', count: countPending },
              { value: 'approved', label: 'Aprobadas', count: countApproved },
              { value: 'rejected', label: 'Rechazadas', count: countRejected },
            ]}
          />
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
            <Select
              aria-label="Filtrar por campaña"
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              className="sm:w-48"
            >
              <option value="all">Todas las campañas</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <div className="relative flex-1 sm:w-60">
              <Search className="pointer-events-none w-3.5 h-3.5 text-vx-text-2/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="search"
                aria-label="Buscar registros"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar agente o código..."
                className="pl-9"
              />
            </div>
          </div>
        </div>

        {filteredEntries.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="Sin registros"
            description="No se encontraron marcajes para los filtros seleccionados."
          />
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-left border-collapse">
            <thead>
              <tr className="border-b border-vx-border bg-vx-bg/60 text-xs tabular-nums text-vx-text-2/60">
                <th scope="col" className="py-3 px-4">Agente</th>
                <th scope="col" className="py-3 px-4">Campaña</th>
                <th scope="col" className="py-3 px-4">Entrada</th>
                <th scope="col" className="py-3 px-4">Salida</th>
                <th scope="col" className="py-3 px-4">Horas</th>
                <th scope="col" className="py-3 px-4">Dif. turno</th>
                <th scope="col" className="py-3 px-4">Puntualidad</th>
                <th scope="col" className="py-3 px-4">Estado</th>
                <th scope="col" className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-vx-border/60 text-[13px]">
              {(
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
                      className="hover:bg-vx-raised/40 transition-colors"
                    >
                      {/* Agente */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={agent?.name ?? '?'} size="sm" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-vx-text">
                                {agent?.name ?? 'Desconocido'}
                              </span>
                              {agent?.isVip && <Badge tone="warning">VIP</Badge>}
                            </div>
                            <div className="text-xs text-vx-text-2/60 tabular-nums flex items-center gap-1.5 mt-0.5">
                              <span>{agent?.employeeCode}</span>
                              <span>•</span>
                              <span>{agent?.level}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Campaña */}
                      <td className="py-3.5 px-4 font-medium text-vx-text/90">
                        {campaign?.name ?? 'Sin Asignar'}
                      </td>

                      {/* Entrada */}
                      <td className="py-3.5 px-4 tabular-nums text-vx-text-2">
                        <div className="text-vx-text font-medium">
                          {formatClock(entry.clockIn)}
                        </div>
                        <div className="text-xs text-vx-text-2/50">
                          {new Date(entry.clockIn).toLocaleDateString('es-MX', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                        {entry.clockInGeo && <GeoBadge check={entry.clockInGeo} />}
                      </td>

                      {/* Salida */}
                      <td className="py-3.5 px-4 tabular-nums">
                        {isOpen ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-vx-success/15 text-vx-success border border-vx-success/30 text-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-vx-success animate-pulse" />
                            <span>En turno</span>
                          </div>
                        ) : (
                          <div>
                            <div className="text-vx-text font-medium">
                              {formatClock(entry.clockOut!)}
                            </div>
                            <div className="text-xs text-vx-text-2/50">
                              {new Date(entry.clockOut!).toLocaleDateString('es-MX', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </div>
                            {entry.clockOutGeo && <GeoBadge check={entry.clockOutGeo} />}
                          </div>
                        )}
                      </td>

                      {/* Horas Trabajadas */}
                      <td className="py-3.5 px-4 tabular-nums">
                        <span className="text-vx-text font-semibold">
                          {formatDuration(workedMinutes)}
                        </span>
                        {entry.breakMinutes > 0 && (
                          <span className="text-xs text-vx-text-2/50 block">
                            (descanso {entry.breakMinutes}m)
                          </span>
                        )}
                      </td>

                      {/* Dif. Turno (Desviación) */}
                      <td className="py-3.5 px-4 tabular-nums">
                        {isOpen ? (
                          <span className="text-vx-text-2/50 text-[13px]">--</span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded tabular-nums text-[13px] font-semibold ${
                                needsReview
                                  ? 'bg-vx-warning/20 text-vx-warning border border-vx-warning/40'
                                  : deviationMinutes === 0
                                    ? 'bg-vx-raised text-vx-text-2'
                                    : 'bg-vx-raised text-vx-accent'
                              }`}
                            >
                              {formatDeviation(deviationMinutes)}
                            </span>

                            {needsReview && (
                              <span
                                title={`Desviación de ${Math.abs(deviationMinutes)} min excede el umbral de 15 min`}
                                className="text-vx-warning"
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
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs tabular-nums text-vx-text-2/50 bg-vx-raised/60 border border-vx-border">
                                Sin turno
                              </span>
                            );
                          }
                          if (punctuality.flags.length === 0) {
                            return (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs tabular-nums font-medium text-vx-success bg-vx-success/15 border border-vx-success/30">
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
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs tabular-nums font-semibold bg-vx-warning/15 text-vx-warning border border-vx-warning/30 whitespace-nowrap"
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
                          <Badge tone="warning">
                            <span className="w-1.5 h-1.5 rounded-full bg-vx-warning" />
                            Pendiente
                          </Badge>
                        )}
                        {entry.status === 'approved' && (
                          <Badge tone="success">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Aprobada
                          </Badge>
                        )}
                        {entry.status === 'rejected' && (
                          <Badge tone="danger">
                            <XCircle className="w-3.5 h-3.5" />
                            Rechazada
                          </Badge>
                        )}

                        {entry.note && (
                          <p className="text-xs text-vx-text-2/60 mt-1 max-w-[140px] truncate" title={entry.note}>
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
                              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-all ${
                                isOpen
                                  ? 'bg-vx-raised text-vx-text-2/40 border border-vx-border cursor-not-allowed'
                                  : 'bg-vx-accent/10 text-vx-accent border border-vx-accent/30 hover:bg-vx-accent hover:text-vx-bg'
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
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[13px] font-medium text-vx-danger bg-vx-danger/10 hover:bg-vx-danger hover:text-vx-text border border-vx-danger/20 transition-all"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Rechazar</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-vx-text-2/50 tabular-nums">
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
        )}
      </Card>

      {/* Modal de Confirmación de Supervisor */}
      <Modal
        open={pendingConfirmationEntry !== null}
        onClose={() => setPendingConfirmationEntry(null)}
        title="Confirmación de supervisor requerida"
        description={`Este marcaje excede la tolerancia operativa de ±${REVIEW_THRESHOLD_MIN} minutos o tiene incidencias.`}
        footer={
          pendingConfirmationEntry && (
            <>
              <Button variant="ghost" onClick={() => setPendingConfirmationEntry(null)}>
                Cancelar
              </Button>
              <Button
                icon={ShieldAlert}
                onClick={() => handleApprove(pendingConfirmationEntry.id, true)}
                className="bg-vx-warning font-bold text-vx-bg border-vx-warning hover:bg-vx-warning/90 hover:border-vx-warning"
              >
                Confirmar y aprobar
              </Button>
            </>
          )
        }
      >
      {pendingConfirmationEntry && (
          <div className="space-y-5">
            {/* Entry Audit Card */}
            <div className="bg-vx-bg rounded-xl border border-vx-border p-4 space-y-3 text-[13px]">
              <div className="flex items-center justify-between border-b border-vx-border pb-2">
                <span className="text-vx-text-2/60">Agente:</span>
                <span className="font-semibold text-vx-text">
                  {agentMap.get(pendingConfirmationEntry.agentId)?.name ?? 'Agente'} (
                  {agentMap.get(pendingConfirmationEntry.agentId)?.employeeCode})
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-vx-border pb-2">
                <span className="text-vx-text-2/60">Campaña:</span>
                <span className="text-vx-text">
                  {campaignMap.get(pendingConfirmationEntry.campaignId)?.name}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-vx-border pb-2">
                <span className="text-vx-text-2/60">Turno Programado:</span>
                <span className="tabular-nums text-vx-text">
                  {formatDuration(pendingConfirmationEntry.scheduledMinutes)}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-vx-border pb-2">
                <span className="text-vx-text-2/60">Horas Trabajadas:</span>
                <span className="tabular-nums text-vx-text font-semibold">
                  {formatDuration(getWorkedMinutes(pendingConfirmationEntry))}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-vx-warning font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  Desviación Detectada:
                </span>
                <span className="tabular-nums text-sm font-bold text-vx-warning bg-vx-warning/10 px-2 py-0.5 rounded border border-vx-warning/30">
                  {formatDeviation(getDeviationMinutes(pendingConfirmationEntry))}
                </span>
              </div>

              {(() => {
                const p = getEntryPunctuality(pendingConfirmationEntry, shifts);
                if (p.flags.length === 0) return null;
                return (
                  <div className="pt-2 border-t border-vx-border/60 space-y-1.5">
                    <span className="text-vx-text-2/70 font-medium block">
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
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs tabular-nums font-semibold bg-vx-warning/15 text-vx-warning border border-vx-warning/30"
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

              {getEntryLocationFlags(pendingConfirmationEntry).length > 0 && (
                <div className="pt-2 border-t border-vx-border/60 space-y-1.5">
                  <span className="text-vx-text-2/70 font-medium block">
                    Incidencias de Ubicación:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {getEntryLocationFlags(pendingConfirmationEntry).map((flag) => (
                      <span
                        key={flag}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs tabular-nums font-semibold bg-vx-warning/15 text-vx-warning border border-vx-warning/30"
                      >
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span>{describeAlert(flag, null)}</span>
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-vx-text-2/50">
                    En computadora la ubicación se estima por wifi o IP y puede fallar por decenas de metros. Revisa antes de decidir.
                  </p>
                </div>
              )}

              {pendingConfirmationEntry.note && (
                <div className="pt-2 text-xs text-vx-text-2/70 italic bg-vx-raised/40 p-2 rounded">
                  Nota del sistema: "{pendingConfirmationEntry.note}"
                </div>
              )}
            </div>

            <p className="text-[13px] text-vx-text-2/80">
              ¿Deseas autorizar formalmente esta desviación y validar el cómputo de horas para nómina y rentabilidad del cliente?
            </p>
          </div>
      )}
      </Modal>

      {/* Modal / Panel de Control de Agentes (Clock In / Clock Out) */}
      <Modal
        open={isClockModalOpen}
        onClose={() => setIsClockModalOpen(false)}
        title="Control de asistencia de agentes"
        description="Marca entradas y salidas en tiempo real. El pin fija la ubicación autorizada de cada agente."
        size="lg"
        footer={
          <Button onClick={() => setIsClockModalOpen(false)}>Cerrar panel</Button>
        }
      >
            {/* List of agents with their active clock-in/out status */}
            <div className="space-y-2.5">
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
                    className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-vx-bg border border-vx-border hover:border-vx-accent/30 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={agent.name} />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-vx-text text-[13px]">
                            {agent.name}
                          </span>
                          <span className="text-xs tabular-nums text-vx-text-2/50">
                            {agent.employeeCode}
                          </span>
                          {todayShift ? (
                            <Badge tone="accent">
                              Hoy {todayShift.startTime}-{todayShift.endTime}
                            </Badge>
                          ) : (
                            <Badge tone="warning">Sin turno programado hoy</Badge>
                          )}
                        </div>
                        <div className="text-xs text-vx-text-2/70 mt-0.5">
                          {campaign?.name} • Ext: {agent.sipExtension}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 ml-auto">
                      <button
                        type="button"
                        aria-label={`Fijar ubicación autorizada de ${agent.name} en la ubicación actual`}
                        onClick={() => handleSetAuthorizedLocation(agent.id)}
                        disabled={locatingAgentId !== null}
                        title={
                          agent.authorizedLocation
                            ? `Ubicación autorizada fijada (radio ${agent.authorizedLocation.radiusM} m). Clic para fijarla de nuevo aquí.`
                            : 'Sin ubicación autorizada. Clic para fijarla en la ubicación actual.'
                        }
                        className={`p-1.5 rounded-lg border transition-colors disabled:opacity-40 ${
                          agent.authorizedLocation
                            ? 'text-vx-success border-vx-success/30 hover:bg-vx-success/10'
                            : 'text-vx-text-2/50 border-vx-border hover:text-vx-text hover:bg-white/5'
                        }`}
                      >
                        <MapPin className="w-3.5 h-3.5" />
                      </button>
                      {isClockedIn ? (
                        <div className="flex items-center gap-2">
                          <Badge tone="success">
                            <span className="w-1.5 h-1.5 rounded-full bg-vx-success animate-pulse" />
                            Turno activo
                          </Badge>
                          <button
                            type="button"
                            onClick={() => handleAgentClockOut(agent.id)}
                            disabled={locatingAgentId !== null}
                            className="disabled:opacity-40 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-vx-danger/15 hover:bg-vx-danger text-vx-danger hover:text-vx-text border border-vx-danger/30 text-[13px] font-semibold transition-all"
                          >
                            <Square className="w-3.5 h-3.5" />
                            <span>{locatingAgentId === agent.id ? 'Ubicando…' : 'Marcar Salida'}</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-xs tabular-nums text-vx-text-2/50">
                            Fuera de turno
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAgentClockIn(agent.id)}
                            disabled={locatingAgentId !== null}
                            className="disabled:opacity-40 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-vx-accent/10 hover:bg-vx-accent text-vx-accent hover:text-vx-bg border border-vx-accent/30 text-[13px] font-semibold transition-all"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>{locatingAgentId === agent.id ? 'Ubicando…' : 'Marcar Entrada'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
      </Modal>
    </div>
  );
};
