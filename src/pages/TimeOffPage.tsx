import React, { useState } from 'react';
import type { TimeOffType, TimeOffStatus, ActionResult } from '@/types';
import { useWorkforceStore } from '@/store/useWorkforceStore';
import { resetApplicationState } from '@/lib/globalReset';
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
  Building2,
  Calendar,
  Clock,
  Info,
} from 'lucide-react';

type TabFilter = 'all' | TimeOffStatus;

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

    createTimeOff({
      agentId: formAgentId,
      type: formType,
      startDate: formStartDate,
      endDate: formEndDate,
      hours: hoursNum,
      reason: formReason.trim(),
      attachmentName: null,
    });

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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#66FCF1]/10 text-[#66FCF1] border border-[#66FCF1]/30">
            <Palmtree className="w-3.5 h-3.5" />
            Vacaciones PTO
          </span>
        );
      case 'medical':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/30">
            <Stethoscope className="w-3.5 h-3.5" />
            Permiso Médico
          </span>
        );
      case 'personal':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#A78BFA]/10 text-[#A78BFA] border border-[#A78BFA]/30">
            <User className="w-3.5 h-3.5" />
            Personal
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado Principal */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-[#13171F] border border-[#242E3B] rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-[#66FCF1]/5 to-transparent pointer-events-none" />

        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-[#66FCF1]/10 text-[#66FCF1] border border-[#66FCF1]/30">
              HR & TALENTO
            </span>
            <span className="text-xs text-[#C5C6C7]/50 font-mono">Gestión de Ausencias & PTO</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <CalendarOff className="w-7 h-7 text-[#66FCF1]" />
            <span>Time Off & Solicitudes</span>
          </h1>
          <p className="text-sm text-[#C5C6C7]/80">
            Aprobación de vacaciones, permisos médicos y control reactivo de saldos de horas PTO.
          </p>
        </div>

        {/* Acciones del encabezado */}
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#66FCF1] hover:bg-[#52e0d6] text-[#0B0C10] text-xs font-bold transition-all shadow-[0_0_16px_rgba(102,252,241,0.25)] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Solicitud</span>
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

      {/* Alerta de notificación de acciones */}
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
            {alertNotice.type === 'error' && <XCircle className="w-5 h-5 shrink-0" />}
            {alertNotice.type === 'info' && <Info className="w-5 h-5 shrink-0" />}
            <span className="font-medium">{alertNotice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setAlertNotice(null)}
            className="text-xs opacity-70 hover:opacity-100 uppercase tracking-wider font-mono ml-4"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Panel "Saldos de PTO" (Arriba, con una fila por agente y ptoBalanceHours en horas) */}
      <div className="bg-[#13171F] border border-[#242E3B] rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#242E3B] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#66FCF1]" />
            <h2 className="text-base font-bold text-white tracking-wide">
              Saldos de PTO
            </h2>
            <span className="text-xs font-mono text-[#C5C6C7]/60">
              ({agents.length} agentes registrados)
            </span>
          </div>
          <span className="text-xs font-mono text-[#66FCF1]/80 hidden sm:inline">
            Descuento automático al aprobar vacaciones
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#242E3B] bg-[#0B0C10]/60 text-[11px] font-mono text-[#C5C6C7]/60 uppercase tracking-wider">
                <th className="py-2.5 px-4">Agente</th>
                <th className="py-2.5 px-4">Código</th>
                <th className="py-2.5 px-4">Campaña</th>
                <th className="py-2.5 px-4">Nivel</th>
                <th className="py-2.5 px-4 text-right">Saldo PTO Disponible</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#242E3B]/60 text-xs">
              {agents.map((agent) => {
                const campaign = campaignMap.get(agent.campaignId);
                return (
                  <tr
                    key={agent.id}
                    className="hover:bg-[#1A202C]/40 transition-colors"
                  >
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-[#1F2833] border border-[#242E3B] flex items-center justify-center text-[#66FCF1] font-mono font-bold text-xs shrink-0">
                          {agent.name.charAt(0)}
                        </div>
                        <span className="font-semibold text-white">
                          {agent.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[#C5C6C7]">
                      {agent.employeeCode}
                    </td>
                    <td className="py-2.5 px-4 text-[#C5C6C7]">
                      {campaign?.name ?? 'Sin asignar'}
                    </td>
                    <td className="py-2.5 px-4 text-[#C5C6C7]/70">
                      {agent.level}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#66FCF1]/10 text-[#66FCF1] border border-[#66FCF1]/30 font-mono font-bold text-xs shadow-sm">
                        <Clock className="w-3 h-3" />
                        {agent.ptoBalanceHours} hrs
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Barra de Filtros: Tabs + Campaña + Búsqueda */}
      <div className="bg-[#13171F] border border-[#242E3B] rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Tabs con contadores reales (por defecto: 'Pendientes') */}
        <div className="flex items-center gap-1.5 bg-[#0B0C10] p-1 rounded-xl border border-[#242E3B] overflow-x-auto">
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
        </div>

        {/* Filtros de Campaña y Búsqueda */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
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

          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 text-[#C5C6C7]/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar agente, motivo..."
              className="w-full bg-[#0B0C10] border border-[#242E3B] text-xs text-white rounded-xl pl-9 pr-3 py-2 placeholder:text-[#C5C6C7]/40 focus:outline-none focus:border-[#66FCF1]"
            />
          </div>
        </div>
      </div>

      {/* Lista / Tabla de Solicitudes */}
      <div className="bg-[#13171F] border border-[#242E3B] rounded-2xl shadow-xl overflow-hidden">
        <div className="p-5 border-b border-[#242E3B] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#66FCF1]" />
            <h2 className="text-base font-bold text-white tracking-wide">
              Solicitudes de Ausencia
            </h2>
            <span className="text-xs font-mono text-[#C5C6C7]/60">
              ({filteredRequests.length} mostradas)
            </span>
          </div>

          <span className="text-xs font-mono text-[#C5C6C7]/60">
            Pestaña activa:{' '}
            <strong className="text-white uppercase">{activeTab}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#242E3B] bg-[#0B0C10]/60 text-[11px] font-mono text-[#C5C6C7]/60 uppercase tracking-wider">
                <th className="py-3 px-4">Agente</th>
                <th className="py-3 px-4">Campaña</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Período</th>
                <th className="py-3 px-4">Horas</th>
                <th className="py-3 px-4">Motivo</th>
                <th className="py-3 px-4">Adjunto</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#242E3B]/60 text-xs">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#C5C6C7]/50 font-mono">
                    No hay solicitudes en la pestaña "{activeTab}".
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => {
                  const agent = agentMap.get(req.agentId);
                  const campaign = agent ? campaignMap.get(agent.campaignId) : null;

                  return (
                    <tr
                      key={req.id}
                      className="hover:bg-[#1A202C]/50 transition-colors group"
                    >
                      {/* Agente */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#1F2833] border border-[#242E3B] flex items-center justify-center text-[#66FCF1] font-mono font-bold text-xs shrink-0">
                            {agent ? agent.name.charAt(0) : '?'}
                          </div>
                          <div>
                            <div className="font-semibold text-white">
                              {agent?.name ?? 'Desconocido'}
                            </div>
                            <div className="text-[11px] text-[#C5C6C7]/60 font-mono mt-0.5">
                              {agent?.employeeCode}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Campaña */}
                      <td className="py-3.5 px-4 text-white/90">
                        {campaign?.name ?? 'Sin Asignar'}
                      </td>

                      {/* Tipo */}
                      <td className="py-3.5 px-4">
                        {renderTypeBadge(req.type)}
                      </td>

                      {/* Fechas */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="flex items-center gap-1.5 text-white">
                          <Calendar className="w-3.5 h-3.5 text-[#66FCF1]/70" />
                          <span>{req.startDate}</span>
                          <span className="text-[#C5C6C7]/50">→</span>
                          <span>{req.endDate}</span>
                        </div>
                      </td>

                      {/* Horas */}
                      <td className="py-3.5 px-4 font-mono">
                        <span className="text-white font-bold bg-[#1F2833] px-2 py-0.5 rounded">
                          {req.hours} hrs
                        </span>
                      </td>

                      {/* Motivo */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-xs text-[#C5C6C7] line-clamp-2" title={req.reason}>
                          {req.reason}
                        </p>
                      </td>

                      {/* Adjunto */}
                      <td className="py-3.5 px-4">
                        {req.attachmentName ? (
                          <div
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[#1F2833] border border-[#242E3B] text-[11px] text-[#66FCF1] font-mono"
                            title={req.attachmentName}
                          >
                            <FileText className="w-3.5 h-3.5 shrink-0" />
                            <span className="max-w-[120px] truncate">{req.attachmentName}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#C5C6C7]/40 font-mono">—</span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-4">
                        {req.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30 font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                            Pendiente
                          </span>
                        )}
                        {req.status === 'approved' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30 font-mono">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                            Aprobada
                          </span>
                        )}
                        {req.status === 'rejected' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30 font-mono">
                            <XCircle className="w-3.5 h-3.5 text-[#EF4444]" />
                            Rechazada
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-4 text-right">
                        {req.status === 'pending' ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleApprove(req.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#66FCF1]/10 text-[#66FCF1] border border-[#66FCF1]/30 hover:bg-[#66FCF1] hover:text-[#0B0C10] transition-all shadow-[0_0_10px_rgba(102,252,241,0.15)]"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Aprobar</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleReject(req.id)}
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

      {/* Modal Formulario "Nueva Solicitud" */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#13171F] border border-[#242E3B] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative">
            <div className="flex items-center justify-between border-b border-[#242E3B] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#66FCF1]/15 text-[#66FCF1] flex items-center justify-center border border-[#66FCF1]/30">
                  <CalendarOff className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Nueva Solicitud de Ausencia
                  </h3>
                  <p className="text-xs text-[#C5C6C7]/70">
                    Registra solicitud para revisión y cómputo de saldo PTO.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setFormError(null);
                }}
                className="p-1.5 rounded-lg text-[#C5C6C7] hover:text-white hover:bg-white/5"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitNewRequest} className="space-y-4 text-xs">
              {/* Agente */}
              <div>
                <label className="block text-[#C5C6C7] font-medium mb-1.5">
                  Agente
                </label>
                <select
                  value={formAgentId}
                  onChange={(e) => setFormAgentId(e.target.value)}
                  className="w-full bg-[#0B0C10] border border-[#242E3B] text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#66FCF1]"
                >
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.employeeCode}) — Saldo PTO: {a.ptoBalanceHours} hrs
                    </option>
                  ))}
                </select>
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-[#C5C6C7] font-medium mb-1.5">
                  Tipo de Solicitud
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormType('vacation')}
                    className={`py-2 px-3 rounded-xl border text-center transition-all ${
                      formType === 'vacation'
                        ? 'bg-[#66FCF1]/15 text-[#66FCF1] border-[#66FCF1]/40 font-semibold'
                        : 'bg-[#0B0C10] text-[#C5C6C7]/70 border-[#242E3B] hover:text-white'
                    }`}
                  >
                    Vacaciones PTO
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType('medical')}
                    className={`py-2 px-3 rounded-xl border text-center transition-all ${
                      formType === 'medical'
                        ? 'bg-[#38BDF8]/15 text-[#38BDF8] border-[#38BDF8]/40 font-semibold'
                        : 'bg-[#0B0C10] text-[#C5C6C7]/70 border-[#242E3B] hover:text-white'
                    }`}
                  >
                    Médico
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType('personal')}
                    className={`py-2 px-3 rounded-xl border text-center transition-all ${
                      formType === 'personal'
                        ? 'bg-[#A78BFA]/15 text-[#A78BFA] border-[#A78BFA]/40 font-semibold'
                        : 'bg-[#0B0C10] text-[#C5C6C7]/70 border-[#242E3B] hover:text-white'
                    }`}
                  >
                    Personal
                  </button>
                </div>
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#C5C6C7] font-medium mb-1.5">
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full bg-[#0B0C10] border border-[#242E3B] text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#66FCF1] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[#C5C6C7] font-medium mb-1.5">
                    Fecha Fin
                  </label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full bg-[#0B0C10] border border-[#242E3B] text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#66FCF1] font-mono"
                  />
                </div>
              </div>

              {/* Horas */}
              <div>
                <label className="block text-[#C5C6C7] font-medium mb-1.5">
                  Horas Totales a Cargar
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={formHours}
                  onChange={(e) => setFormHours(e.target.value)}
                  placeholder="Ej: 8, 16, 24"
                  className="w-full bg-[#0B0C10] border border-[#242E3B] text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#66FCF1] font-mono"
                />
                {formType === 'vacation' && (
                  <p className="text-[11px] text-[#C5C6C7]/50 mt-1">
                    * Al ser vacaciones, estas horas se descontarán del saldo de PTO si la solicitud es aprobada.
                  </p>
                )}
              </div>

              {/* Motivo */}
              <div>
                <label className="block text-[#C5C6C7] font-medium mb-1.5">
                  Motivo / Justificación
                </label>
                <textarea
                  rows={3}
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  placeholder="Describe la causa de la ausencia o detalles del viaje..."
                  className="w-full bg-[#0B0C10] border border-[#242E3B] text-white rounded-xl p-3 focus:outline-none focus:border-[#66FCF1] resize-none"
                />
              </div>

              {/* Botones de acción */}
              <div className="pt-3 border-t border-[#242E3B] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setFormError(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#C5C6C7] hover:text-white bg-[#1F2833] hover:bg-[#253240] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-[#0B0C10] bg-[#66FCF1] hover:bg-[#52e0d6] transition-all shadow-[0_0_12px_rgba(102,252,241,0.25)]"
                >
                  Crear Solicitud
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
