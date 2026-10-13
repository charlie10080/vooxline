import React, { useState } from 'react';
import type { TimeOffType, TimeOffStatus, ActionResult } from '@/types';
import { useWorkforceStore } from '@/store/useWorkforceStore';
import { resetApplicationState } from '@/lib/globalReset';
import {
  PageHeader,
  Card,
  Button,
  Badge,
  StatCard,
  Avatar,
  EmptyState,
  Modal,
  Field,
  Input,
  TextArea,
  Select,
  Tabs,
  Notice,
} from '@/components/ui';
import {
  CalendarOff,
  Plus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Palmtree,
  Stethoscope,
  User,
  RotateCcw,
  Search,
  Calendar,
  Clock,
  Inbox,
  ListChecks,
} from 'lucide-react';

type TabFilter = 'all' | TimeOffStatus;

const TAB_LABELS: Record<TabFilter, string> = {
  pending: 'Pendientes',
  approved: 'Aprobadas',
  rejected: 'Rechazadas',
  all: 'Todas',
};

const NOTICE_TONE = {
  success: 'success',
  warning: 'warning',
  error: 'danger',
  info: 'info',
} as const;

const CREATE_ERRORS: Record<string, string> = {
  invalid: 'Revisa los datos: fechas, horas o motivo no son válidos.',
  not_found: 'El agente seleccionado ya no existe.',
};

export const TimeOffPage: React.FC = () => {
  const {
    agents,
    campaigns,
    timeOffRequests,
    createTimeOff,
    approveTimeOff,
    rejectTimeOff,
  } = useWorkforceStore();

  // Tab por defecto: 'pending' (como se solicita)
  const [activeTab, setActiveTab] = useState<TabFilter>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('all');

  // Modal para nueva solicitud
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Alerta de feedback / errores (ej: insufficient_pto)
  const [alertNotice, setAlertNotice] = useState<{
    type: 'success' | 'warning' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Estado del formulario de nueva solicitud
  const [formAgentId, setFormAgentId] = useState<string>(agents[0]?.id ?? '');
  const [formType, setFormType] = useState<TimeOffType>('vacation');
  const [formStartDate, setFormStartDate] = useState<string>('');
  const [formEndDate, setFormEndDate] = useState<string>('');
  const [formHours, setFormHours] = useState<string>('8');
  const [formReason, setFormReason] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // Mapeos auxiliares para visualización
  const agentMap = new Map(agents.map((a) => [a.id, a]));
  const campaignMap = new Map(campaigns.map((c) => [c.id, c]));

  // Contadores reales para los tabs
  const countAll = timeOffRequests.length;
  const countPending = timeOffRequests.filter((r) => r.status === 'pending').length;
  const countApproved = timeOffRequests.filter((r) => r.status === 'approved').length;
  const countRejected = timeOffRequests.filter((r) => r.status === 'rejected').length;

  // Filtrado de solicitudes
  const filteredRequests = timeOffRequests.filter((req) => {
    // Filtro por tab
    if (activeTab !== 'all' && req.status !== activeTab) {
      return false;
    }

    const agent = agentMap.get(req.agentId);

    // Filtro por campaña
    if (selectedCampaignId !== 'all' && agent?.campaignId !== selectedCampaignId) {
      return false;
    }

    // Filtro por búsqueda
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const agentName = agent?.name.toLowerCase() ?? '';
      const employeeCode = agent?.employeeCode.toLowerCase() ?? '';
      const reason = req.reason.toLowerCase();
      const attachment = req.attachmentName?.toLowerCase() ?? '';

      return (
        agentName.includes(q) ||
        employeeCode.includes(q) ||
        reason.includes(q) ||
        attachment.includes(q)
      );
    }

    return true;
  });

  // Manejador para aprobar solicitud
  const handleApprove = (requestId: string) => {
    const req = timeOffRequests.find((r) => r.id === requestId);
    const agent = req ? agentMap.get(req.agentId) : null;
    const res: ActionResult = approveTimeOff(requestId);

    if (res.ok) {
      setAlertNotice({
        type: 'success',
        message: `Solicitud de ${req?.type === 'vacation' ? 'vacaciones' : 'permiso'} aprobada con éxito.`,
      });
    } else {
      if (res.reason === 'insufficient_pto') {
        setAlertNotice({
          type: 'warning',
          message: `Saldo insuficiente de PTO: ${agent?.name ?? 'El agente'} solo dispone de ${agent?.ptoBalanceHours ?? 0}h de PTO para cubrir una solicitud de ${req?.hours ?? 0}h.`,
        });
      } else {
        setAlertNotice({
          type: 'error',
          message: `Error al procesar la solicitud: ${res.reason}`,
        });
      }
    }
  };

  // Manejador para rechazar solicitud
  const handleReject = (requestId: string) => {
    const res: ActionResult = rejectTimeOff(requestId);
    if (res.ok) {
      setAlertNotice({
        type: 'info',
        message: 'Solicitud rechazada.',
      });
    } else {
      setAlertNotice({
        type: 'error',
        message: `Error al rechazar: ${res.reason}`,
      });
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormError(null);
  };

  // Manejador para enviar nueva solicitud
  const handleSubmitNewRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formAgentId) {
      setFormError('Por favor selecciona un agente.');
      return;
    }
    if (!formStartDate) {
      setFormError('Ingresa la fecha de inicio.');
      return;
    }
    if (!formEndDate) {
      setFormError('Ingresa la fecha de fin.');
      return;
    }
    if (formEndDate < formStartDate) {
      setFormError('La fecha de fin no puede ser anterior a la fecha de inicio.');
      return;
    }
    const hoursNum = Number(formHours);
    if (isNaN(hoursNum) || hoursNum <= 0) {
      setFormError('Las horas deben ser un número mayor a 0.');
      return;
    }
    if (!formReason.trim()) {
      setFormError('Ingresa el motivo de la solicitud.');
      return;
    }

    const res: ActionResult = createTimeOff({
      agentId: formAgentId,
      type: formType,
      startDate: formStartDate,
      endDate: formEndDate,
      hours: hoursNum,
      reason: formReason.trim(),
      attachmentName: null,
    });
    if (!res.ok) {
      setFormError(CREATE_ERRORS[res.reason] ?? 'No se pudo registrar la solicitud. Inténtalo de nuevo.');
      return;
    }

    setIsModalOpen(false);
    setAlertNotice({
      type: 'success',
      message: 'Nueva solicitud registrada en estado pendiente.',
    });

    // Reset campos
    setFormReason('');
    setFormStartDate('');
    setFormEndDate('');
    setFormHours('8');
  };

  // Helper para renderizar etiqueta de tipo
  const renderTypeBadge = (type: TimeOffType) => {
    switch (type) {
      case 'vacation':
        return (
          <Badge tone="accent">
            <Palmtree className="h-3.5 w-3.5" />
            Vacaciones PTO
          </Badge>
        );
      case 'medical':
        return (
          <Badge tone="info">
            <Stethoscope className="h-3.5 w-3.5" />
            Permiso médico
          </Badge>
        );
      case 'personal':
        return (
          <Badge tone="neutral">
            <User className="h-3.5 w-3.5" />
            Personal
          </Badge>
        );
    }
  };

  const TYPE_OPTIONS: Array<{ value: TimeOffType; label: string }> = [
    { value: 'vacation', label: 'Vacaciones PTO' },
    { value: 'medical', label: 'Médico' },
    { value: 'personal', label: 'Personal' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={CalendarOff}
        eyebrow="RR. HH. · AUSENCIAS Y PTO"
        title="Ausencias y solicitudes"
        description="Aprobación de vacaciones, permisos médicos y control en tiempo real de los saldos de horas PTO."
        actions={
          <>
            <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)}>
              Nueva solicitud
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

      {alertNotice && (
        <Notice tone={NOTICE_TONE[alertNotice.type]} onClose={() => setAlertNotice(null)}>
          {alertNotice.message}
        </Notice>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
        <StatCard label="Total solicitudes" value={countAll} icon={ListChecks} tone="accent" />
        <StatCard label="Pendientes" value={countPending} icon={Clock} tone="warning" />
        <StatCard label="Aprobadas" value={countApproved} icon={CheckCircle2} tone="success" />
        <StatCard label="Rechazadas" value={countRejected} icon={XCircle} tone="danger" />
      </div>

      {/* Saldos de PTO: una fila por agente */}
      <Card
        title="Saldos de PTO"
        subtitle={`${agents.length} agentes registrados · se descuenta automáticamente al aprobar vacaciones`}
        bodyClassName="overflow-x-auto"
      >
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead>
            <tr className="border-b border-vx-border bg-vx-bg/60 tabular-nums text-xs text-vx-text-2/60">
              <th scope="col" className="px-4 py-2.5">Agente</th>
              <th scope="col" className="px-4 py-2.5">Código</th>
              <th scope="col" className="px-4 py-2.5">Campaña</th>
              <th scope="col" className="px-4 py-2.5">Nivel</th>
              <th scope="col" className="px-4 py-2.5 text-right">Saldo PTO disponible</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-vx-border/60 text-[13px]">
            {agents.map((agent) => {
              const campaign = campaignMap.get(agent.campaignId);
              return (
                <tr key={agent.id} className="transition-colors hover:bg-vx-raised/40">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={agent.name} size="sm" />
                      <span className="font-semibold text-vx-text">{agent.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 tabular-nums text-vx-text-2">{agent.employeeCode}</td>
                  <td className="px-4 py-2.5 text-vx-text-2">{campaign?.name ?? 'Sin asignar'}</td>
                  <td className="px-4 py-2.5 text-vx-text-2/70">{agent.level}</td>
                  <td className="px-4 py-2.5 text-right">
                    <Badge tone="accent">
                      <Clock className="h-3 w-3" />
                      {agent.ptoBalanceHours} h
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {/* Solicitudes con filtros */}
      <Card
        title="Solicitudes de ausencia"
        subtitle={`${filteredRequests.length} mostradas · ${TAB_LABELS[activeTab]}`}
        bodyClassName=""
      >
        <div className="flex flex-col justify-between gap-3 border-b border-vx-border p-4 md:flex-row md:items-center">
          <Tabs
            value={activeTab}
            onChange={setActiveTab}
            options={[
              { value: 'pending', label: 'Pendientes', count: countPending },
              { value: 'approved', label: 'Aprobadas', count: countApproved },
              { value: 'rejected', label: 'Rechazadas', count: countRejected },
              { value: 'all', label: 'Todas', count: countAll },
            ]}
          />
          <div className="flex flex-wrap items-center gap-2.5 sm:flex-nowrap">
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
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-vx-text-2/40" />
              <Input
                type="search"
                aria-label="Buscar solicitudes"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar agente, motivo..."
                className="pl-9"
              />
            </div>
          </div>
        </div>

        {filteredRequests.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="Sin solicitudes"
            description={`No hay solicitudes en "${TAB_LABELS[activeTab]}" para los filtros seleccionados.`}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] border-collapse text-left">
              <thead>
                <tr className="border-b border-vx-border bg-vx-bg/60 tabular-nums text-xs text-vx-text-2/60">
                  <th scope="col" className="px-4 py-3">Agente</th>
                  <th scope="col" className="px-4 py-3">Campaña</th>
                  <th scope="col" className="px-4 py-3">Tipo</th>
                  <th scope="col" className="px-4 py-3">Período</th>
                  <th scope="col" className="px-4 py-3">Horas</th>
                  <th scope="col" className="px-4 py-3">Motivo</th>
                  <th scope="col" className="px-4 py-3">Adjunto</th>
                  <th scope="col" className="px-4 py-3">Estado</th>
                  <th scope="col" className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-vx-border/60 text-[13px]">
                {filteredRequests.map((req) => {
                  const agent = agentMap.get(req.agentId);
                  const campaign = agent ? campaignMap.get(agent.campaignId) : null;

                  return (
                    <tr key={req.id} className="transition-colors hover:bg-vx-raised/40">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={agent?.name ?? '?'} size="sm" />
                          <div>
                            <div className="font-semibold text-vx-text">{agent?.name ?? 'Desconocido'}</div>
                            <div className="mt-0.5 tabular-nums text-xs text-vx-text-2/60">{agent?.employeeCode}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-vx-text/90">{campaign?.name ?? 'Sin asignar'}</td>
                      <td className="px-4 py-3.5">{renderTypeBadge(req.type)}</td>
                      <td className="px-4 py-3.5 tabular-nums">
                        <div className="flex items-center gap-1.5 whitespace-nowrap text-vx-text">
                          <Calendar className="h-3.5 w-3.5 text-vx-accent/70" />
                          <span>{req.startDate}</span>
                          <span className="text-vx-text-2/50">→</span>
                          <span>{req.endDate}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge>{req.hours} h</Badge>
                      </td>
                      <td className="max-w-xs px-4 py-3.5">
                        <p className="line-clamp-2 text-[13px] text-vx-text-2" title={req.reason}>
                          {req.reason}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        {req.attachmentName ? (
                          <Badge tone="accent" className="max-w-[140px]">
                            <FileText className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate" title={req.attachmentName}>{req.attachmentName}</span>
                          </Badge>
                        ) : (
                          <span className="tabular-nums text-xs text-vx-text-2/40">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {req.status === 'pending' && (
                          <Badge tone="warning">
                            <span className="h-1.5 w-1.5 rounded-full bg-vx-warning" />
                            Pendiente
                          </Badge>
                        )}
                        {req.status === 'approved' && (
                          <Badge tone="success">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Aprobada
                          </Badge>
                        )}
                        {req.status === 'rejected' && (
                          <Badge tone="danger">
                            <XCircle className="h-3.5 w-3.5" />
                            Rechazada
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {req.status === 'pending' ? (
                          <div className="inline-flex items-center gap-1.5">
                            <Button
                              size="sm"
                              variant="primary"
                              icon={CheckCircle2}
                              onClick={() => handleApprove(req.id)}
                            >
                              Aprobar
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              icon={XCircle}
                              onClick={() => handleReject(req.id)}
                            >
                              Rechazar
                            </Button>
                          </div>
                        ) : (
                          <span className="tabular-nums text-xs text-vx-text-2/50">Procesada</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal "Nueva solicitud" */}
      <Modal
        open={isModalOpen}
        onClose={closeModal}
        title="Nueva solicitud de ausencia"
        description="Registra la solicitud para revisión y cómputo del saldo PTO."
      >
        <form onSubmit={handleSubmitNewRequest} className="space-y-4">
          {formError && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-xl border border-vx-danger/30 bg-vx-danger/10 p-3 text-[13px] text-vx-danger"
            >
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <Field label="Agente">
            <Select value={formAgentId} onChange={(e) => setFormAgentId(e.target.value)}>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.employeeCode}) — Saldo PTO: {a.ptoBalanceHours} h
                </option>
              ))}
            </Select>
          </Field>

          <fieldset className="space-y-1.5">
            <legend className="mb-1.5 text-[13px] font-medium text-vx-text-2">Tipo de solicitud</legend>
            <div className="grid grid-cols-3 gap-2">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={formType === opt.value}
                  onClick={() => setFormType(opt.value)}
                  className={`rounded-xl border px-3 py-2 text-center text-[13px] transition-all ${
                    formType === opt.value
                      ? 'border-vx-accent/40 bg-vx-accent/15 font-semibold text-vx-accent'
                      : 'border-vx-border bg-vx-bg text-vx-text-2/70 hover:text-vx-text'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Fecha de inicio">
              <Input
                type="date"
                value={formStartDate}
                onChange={(e) => setFormStartDate(e.target.value)}
                className="tabular-nums"
              />
            </Field>
            <Field label="Fecha de fin">
              <Input
                type="date"
                value={formEndDate}
                onChange={(e) => setFormEndDate(e.target.value)}
                className="tabular-nums"
              />
            </Field>
          </div>

          <Field
            label="Horas totales a cargar"
            hint={
              formType === 'vacation'
                ? 'Al ser vacaciones, estas horas se descontarán del saldo de PTO si la solicitud es aprobada.'
                : undefined
            }
          >
            <Input
              type="number"
              min="1"
              step="1"
              value={formHours}
              onChange={(e) => setFormHours(e.target.value)}
              placeholder="Ej: 8, 16, 24"
              className="tabular-nums"
            />
          </Field>

          <Field label="Motivo / justificación">
            <TextArea
              rows={3}
              value={formReason}
              onChange={(e) => setFormReason(e.target.value)}
              placeholder="Describe la causa de la ausencia o los detalles del viaje..."
            />
          </Field>

          <div className="flex items-center justify-end gap-2.5 border-t border-vx-border pt-4">
            <Button variant="ghost" onClick={closeModal}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Crear solicitud
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
