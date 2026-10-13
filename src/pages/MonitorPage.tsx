import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import type { MonitorMode, LiveError } from '@/types/live';
import { useLiveStore, TICK_MS } from '@/store/useLiveStore';
import { resetApplicationState } from '@/lib/globalReset';
import { useWorkforceStore } from '@/store/useWorkforceStore';
import {
  getActiveCalls,
  getCallSeconds,
  formatTimer,
  getLiveSummary,
} from '@/lib/live';
import {
  Radio,
  RotateCcw,
  Volume2,
  Mic,
  PhoneCall,
  PhoneOff,
  Coffee,
  Play,
  Pause,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  ShieldAlert,
  Headphones,
  Sparkles,
  ArrowRight,
  History,
} from 'lucide-react';
import { PageHeader, Button, Badge, Modal } from '@/components/ui';

// Etiquetas visibles (solo presentación)
const MODE_LABELS: Record<MonitorMode, string> = {
  listen: 'Escucha',
  whisper: 'Susurro',
  intervene: 'Intervención',
};
const SENTIMENT_LABELS: Record<string, string> = {
  positive: 'Positivo',
  neutral: 'Neutral',
  negative: 'Negativo',
};

export const MonitorPage: React.FC = () => {
  const { agents, campaigns } = useWorkforceStore();
  const {
    calls,
    monitoring,
    monitorLog,
    simulationEnabled,
    startCall,
    endCall,
    setBreak,
    startMonitoring,
    setMonitorMode,
    stopMonitoring,
    setSimulationEnabled,
    tick,
  } = useLiveStore();

  // 1) Reloj local para que los cronómetros avancen continuamente cada 1 s
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const clockTimer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  // 2) Simulación automática cada TICK_MS mientras la página esté montada y la simulación activa
  useEffect(() => {
    if (!simulationEnabled) return;
    const simTimer = setInterval(() => {
      tick();
    }, TICK_MS);
    return () => clearInterval(simTimer);
  }, [simulationEnabled, tick]);

  // Alerta global de acción o error
  const [actionAlert, setActionAlert] = useState<{
    type: 'success' | 'warning' | 'error' | 'info';
    message: string;
    actionLink?: { label: string; to: string };
  } | null>(null);

  // Modal de confirmación para Intervenir
  const [interveneTarget, setInterveneTarget] = useState<{
    callId: string;
    agentId: string;
  } | null>(null);

  const campaignMap = new Map(campaigns.map((c) => [c.id, c]));
  const agentMap = new Map(agents.map((a) => [a.id, a]));
  const activeCalls = getActiveCalls(calls);
  const activeCallMap = new Map(activeCalls.map((c) => [c.agentId, c]));
  const summary = getLiveSummary(calls, agents, now);

  // Llamada bajo supervisión actual
  const currentMonitoredCall = monitoring
    ? activeCalls.find((c) => c.id === monitoring.callId) ?? null
    : null;
  const currentMonitoredAgent = currentMonitoredCall
    ? agentMap.get(currentMonitoredCall.agentId)
    : null;

  // Manejador centralizado de errores
  const handleError = (reason: LiveError | string, agentName?: string) => {
    switch (reason) {
      case 'not_clocked_in':
        setActionAlert({
          type: 'warning',
          message: `${agentName ?? 'El agente'} no tiene turno abierto en Time Clock. Debe marcar entrada para recibir o iniciar llamadas.`,
          actionLink: { label: 'Ir a Time Clock', to: '/time-clock' },
        });
        break;
      case 'busy':
        setActionAlert({
          type: 'warning',
          message: `${agentName ?? 'El agente'} no está disponible en este momento (está en llamada, en pausa o fuera de línea).`,
        });
        break;
      case 'on_call':
        setActionAlert({
          type: 'warning',
          message: `${agentName ?? 'El agente'} está actualmente en una llamada activa y no puede pasar a descanso.`,
        });
        break;
      case 'call_ended':
        setActionAlert({
          type: 'info',
          message: 'La llamada ya ha finalizado.',
        });
        break;
      case 'not_found':
        setActionAlert({
          type: 'error',
          message: 'Agente o llamada no encontrada en el sistema.',
        });
        break;
      default:
        setActionAlert({
          type: 'error',
          message: `Error operativo: ${reason}`,
        });
    }
  };

  // Acciones sobre llamadas
  const handleStartCall = (agentId: string) => {
    const res = startCall(agentId);
    const agent = agentMap.get(agentId);
    if (res.ok) {
      setActionAlert({
        type: 'success',
        message: `Llamada simulada iniciada para ${agent?.name ?? 'agente'}.`,
      });
    } else {
      handleError(res.reason, agent?.name);
    }
  };

  const handleEndCall = (callId: string) => {
    const call = calls.find((c) => c.id === callId);
    const agent = call ? agentMap.get(call.agentId) : null;
    const res = endCall(callId);
    if (res.ok) {
      setActionAlert({
        type: 'info',
        message: `Llamada finalizada para ${agent?.name ?? 'agente'}.`,
      });
    } else {
      handleError(res.reason, agent?.name);
    }
  };

  const handleToggleBreak = (agentId: string, currentStatus: string) => {
    const agent = agentMap.get(agentId);
    const toBreak = currentStatus !== 'break';
    const res = setBreak(agentId, toBreak);
    if (res.ok) {
      setActionAlert({
        type: 'info',
        message: toBreak
          ? `${agent?.name ?? 'Agente'} en pausa / descanso.`
          : `${agent?.name ?? 'Agente'} reanudó disponibilidad.`,
      });
    } else {
      handleError(res.reason, agent?.name);
    }
  };

  // Solicitud de supervisión
  const handleStartMonitor = (callId: string, mode: MonitorMode) => {
    const call = calls.find((c) => c.id === callId);
    if (mode === 'intervene') {
      setInterveneTarget({ callId, agentId: call?.agentId ?? '' });
      return;
    }

    const res = startMonitoring(callId, mode);
    if (res.ok) {
      setActionAlert({
        type: 'success',
        message: `Supervisión iniciada en modo "${MODE_LABELS[mode]}".`,
      });
    } else {
      handleError(res.reason);
    }
  };

  const handleChangeMonitorMode = (mode: MonitorMode) => {
    if (!monitoring) return;
    if (mode === 'intervene') {
      const call = calls.find((c) => c.id === monitoring.callId);
      setInterveneTarget({ callId: monitoring.callId, agentId: call?.agentId ?? '' });
      return;
    }

    const res = setMonitorMode(mode);
    if (res.ok) {
      setActionAlert({
        type: 'success',
        message: `Modo de supervisión cambiado a "${MODE_LABELS[mode]}".`,
      });
    } else {
      handleError(res.reason);
    }
  };

  const handleConfirmIntervene = () => {
    if (!interveneTarget) return;
    const { callId } = interveneTarget;

    if (monitoring && monitoring.callId === callId) {
      const res = setMonitorMode('intervene');
      if (res.ok) {
        setActionAlert({
          type: 'warning',
          message: 'Canal de intervención activado: audio bidireccional en llamada.',
        });
      } else {
        handleError(res.reason);
      }
    } else {
      const res = startMonitoring(callId, 'intervene');
      if (res.ok) {
        setActionAlert({
          type: 'warning',
          message: 'Intervención iniciada: ahora estás en vivo en la llamada.',
        });
      } else {
        handleError(res.reason);
      }
    }
    setInterveneTarget(null);
  };

  const handleReset = () => {
    if (window.confirm('¿Reiniciar todos los datos de demostración? Se restablecerán asistencias, usuarios, turnos y llamadas a su estado inicial.')) {
      resetApplicationState();
      setActionAlert({
        type: 'info',
        message: 'Todos los datos de demostración han sido restablecidos.',
      });
    }
  };

  // Helper para tiempo en estado
  const formatTimeSince = (isoDate: string): string => {
    const start = new Date(isoDate).getTime();
    const diffSec = Math.max(0, Math.round((now.getTime() - start) / 1000));
    return formatTimer(diffSec);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Headphones}
        eyebrow="SUPERVISIÓN EN VIVO"
        title="Monitor en vivo"
        description="Seguimiento de agentes, canales de audio en tiempo real y herramientas de supervisión activa."
        actions={
          <>
            <Badge className="px-3 py-1.5">
              <Sparkles className="h-3.5 w-3.5 text-vx-accent" aria-hidden="true" />
              Ciclo: cada {TICK_MS / 1000}s
            </Badge>
            {/* 1. Interruptor Simulación ON/OFF */}
            <button
              type="button"
              onClick={() => setSimulationEnabled(!simulationEnabled)}
              aria-pressed={simulationEnabled}
              className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-[13px] tabular-nums font-bold transition-all border ${
                simulationEnabled
                  ? 'bg-vx-success/20 text-vx-success border-vx-success/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                  : 'bg-vx-raised text-vx-text-2/60 border-vx-border'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  simulationEnabled ? 'bg-vx-success animate-ping' : 'bg-vx-text-2/40'
                }`}
              />
              <span>{simulationEnabled ? 'Simulación activa' : 'Simulación en pausa'}</span>
            </button>
            <Button
              icon={RotateCcw}
              onClick={handleReset}
              title="Reiniciar datos de simulación"
              aria-label="Reiniciar datos de simulación"
            />
          </>
        }
      />

      {/* 2. Banner Fijo "Modo simulado: sin audio real" */}
      <div className="bg-vx-raised/70 border border-vx-border rounded-2xl p-4 flex items-start sm:items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-vx-accent/10 text-vx-accent flex items-center justify-center border border-vx-accent/30 shrink-0">
          <Radio className="w-4 h-4" aria-hidden="true" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-vx-text tabular-nums">
              Modo simulado: sin audio real
            </span>
            <span className="w-2 h-2 rounded-full bg-vx-success animate-pulse" />
          </div>
          <p className="text-[13px] text-vx-text-2/70">
            Las llamadas, latencias SIP, análisis de sentimiento y puntajes de calidad son generados por el motor de simulación para pruebas operativas.
          </p>
        </div>
      </div>

      {/* Alerta de notificación / error */}
      {actionAlert && (
        <div
          role="status"
          className={`flex items-center justify-between p-4 rounded-xl border text-sm animate-fadeIn ${
            actionAlert.type === 'success'
              ? 'bg-vx-success/10 border-vx-success/30 text-vx-success'
              : actionAlert.type === 'warning'
                ? 'bg-vx-warning/10 border-vx-warning/30 text-vx-warning'
                : actionAlert.type === 'error'
                  ? 'bg-vx-danger/10 border-vx-danger/30 text-vx-danger'
                  : 'bg-vx-accent/10 border-vx-accent/30 text-vx-accent'
          }`}
        >
          <div className="flex items-center gap-3">
            {actionAlert.type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0" />}
            {actionAlert.type === 'warning' && <AlertTriangle className="w-5 h-5 shrink-0" />}
            {actionAlert.type === 'error' && <XCircle className="w-5 h-5 shrink-0" />}
            {actionAlert.type === 'info' && <Info className="w-5 h-5 shrink-0" />}
            <div>
              <span className="font-medium">{actionAlert.message}</span>
              {actionAlert.actionLink && (
                <NavLink
                  to={actionAlert.actionLink.to}
                  className="ml-3 inline-flex items-center gap-1 font-bold underline hover:opacity-80"
                >
                  <span>{actionAlert.actionLink.label}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </NavLink>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActionAlert(null)}
            aria-label="Cerrar aviso"
            className="text-[13px] opacity-70 hover:opacity-100 tabular-nums ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* 6. Panel "Supervisión activa" (cuando monitoring no es null y llamada activa) */}
      {currentMonitoredCall && currentMonitoredAgent && (
        <div className="bg-vx-surface border-2 border-vx-accent rounded-2xl p-5 relative overflow-hidden animate-fadeIn">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start md:items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-vx-accent/20 text-vx-accent flex items-center justify-center border border-vx-accent/40 shrink-0">
                {monitoring?.mode === 'intervene' ? (
                  <PhoneCall className="w-5 h-5 text-vx-danger animate-bounce" />
                ) : monitoring?.mode === 'whisper' ? (
                  <Mic className="w-5 h-5 text-vx-info" />
                ) : (
                  <Volume2 className="w-5 h-5 text-vx-accent" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] tabular-nums font-bold text-vx-accent">
                    Supervisión en curso
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs tabular-nums font-bold border border-vx-border bg-vx-raised text-vx-text">
                    Modo: {monitoring ? MODE_LABELS[monitoring.mode] : ''}
                  </span>
                </div>

                <div className="text-sm font-bold text-vx-text mt-0.5 flex flex-wrap items-center gap-2">
                  <span>{currentMonitoredAgent.name}</span>
                  <span className="text-vx-text-2/50 font-normal tabular-nums">•</span>
                  <span className="text-vx-accent tabular-nums">{currentMonitoredCall.customerLabel}</span>
                  {currentMonitoredCall.isVip && (
                    <span className="px-1.5 py-0.5 rounded bg-vx-warning/20 text-vx-warning text-xs tabular-nums border border-vx-warning/40 font-bold">
                      VIP
                    </span>
                  )}
                </div>

                <div className="text-[13px] text-vx-text-2/70 tabular-nums mt-1 flex items-center gap-2">
                  <span>Tiempo en supervisión:</span>
                  <strong className="text-vx-text">
                    {monitoring ? formatTimer(Math.max(0, Math.round((now.getTime() - new Date(monitoring.startedAt).getTime()) / 1000))) : '00:00'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Controles del panel de supervisión */}
            <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0">
              <span className="text-[13px] text-vx-text-2/60 tabular-nums mr-1">Cambiar modo:</span>
              <button
                type="button"
                onClick={() => handleChangeMonitorMode('listen')}
                aria-pressed={monitoring?.mode === 'listen'}
                className={`px-3 py-1.5 rounded-lg text-[13px] tabular-nums font-semibold transition-all border ${
                  monitoring?.mode === 'listen'
                    ? 'bg-vx-accent text-vx-bg border-vx-accent font-bold'
                    : 'bg-vx-raised text-vx-text-2 hover:text-vx-text border-vx-border'
                }`}
              >
                Escuchar
              </button>

              <button
                type="button"
                onClick={() => handleChangeMonitorMode('whisper')}
                aria-pressed={monitoring?.mode === 'whisper'}
                className={`px-3 py-1.5 rounded-lg text-[13px] tabular-nums font-semibold transition-all border ${
                  monitoring?.mode === 'whisper'
                    ? 'bg-vx-info text-vx-bg border-vx-info font-bold'
                    : 'bg-vx-raised text-vx-text-2 hover:text-vx-text border-vx-border'
                }`}
              >
                Susurro
              </button>

              <button
                type="button"
                onClick={() => handleChangeMonitorMode('intervene')}
                aria-pressed={monitoring?.mode === 'intervene'}
                className={`px-3 py-1.5 rounded-lg text-[13px] tabular-nums font-semibold transition-all border ${
                  monitoring?.mode === 'intervene'
                    ? 'bg-vx-danger text-vx-text border-vx-danger font-bold animate-pulse'
                    : 'bg-vx-danger/15 text-vx-danger hover:bg-vx-danger hover:text-vx-text border-vx-danger/30'
                }`}
              >
                Intervenir
              </button>

              <button
                type="button"
                onClick={stopMonitoring}
                className="ml-2 px-3.5 py-1.5 rounded-lg bg-vx-raised hover:bg-vx-raised text-[13px] font-semibold text-vx-text border border-vx-border transition-colors"
              >
                Detener
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Tarjetas superiores con getLiveSummary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Llamadas activas */}
        <div className="bg-vx-surface border border-vx-border rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-vx-text-2/70 tabular-nums">
              Llamadas activas
            </span>
            <div className="w-8 h-8 rounded-xl bg-vx-accent/15 text-vx-accent flex items-center justify-center border border-vx-accent/30">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-vx-text tabular-nums">
              {summary.activeCalls}
            </span>
            <span className="text-[13px] text-vx-accent tabular-nums">en curso</span>
          </div>

          <div className="mt-3 pt-2.5 border-t border-vx-border/60 flex items-center justify-between text-xs tabular-nums text-vx-text-2/70">
            <span>Sentimiento:</span>
            <div className="flex items-center gap-2">
              <span className="text-vx-success" title="Positivo">+{summary.sentiment.positive}</span>
              <span className="text-vx-text-2" title="Neutral">~{summary.sentiment.neutral}</span>
              <span className="text-vx-danger" title="Negativo">-{summary.sentiment.negative}</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Duración promedio */}
        <div className="bg-vx-surface border border-vx-border rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-vx-text-2/70 tabular-nums">
              Duración promedio
            </span>
            <div className="w-8 h-8 rounded-xl bg-vx-info/15 text-vx-info flex items-center justify-center border border-vx-info/30">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-vx-text tabular-nums">
              {formatTimer(summary.avgSeconds)}
            </span>
            <span className="text-[13px] text-vx-info tabular-nums">min:seg</span>
          </div>
          <p className="text-xs text-vx-text-2/50 mt-3 pt-2.5 border-t border-vx-border/60 tabular-nums">
            Calculado sobre llamadas activas
          </p>
        </div>

        {/* KPI 3: Agentes por estado */}
        <div className="bg-vx-surface border border-vx-border rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-vx-text-2/70 tabular-nums">
              Estado de agentes
            </span>
            <div className="w-8 h-8 rounded-xl bg-vx-success/15 text-vx-success flex items-center justify-center border border-vx-success/30">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1 text-[13px] tabular-nums">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-vx-accent animate-pulse" />
              <span className="text-vx-text-2/70">En llamada:</span>
              <strong className="text-vx-text">{summary.byStatus.on_call}</strong>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-vx-success" />
              <span className="text-vx-text-2/70">Disponible:</span>
              <strong className="text-vx-text">{summary.byStatus.available}</strong>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-vx-warning" />
              <span className="text-vx-text-2/70">Pausa:</span>
              <strong className="text-vx-text">{summary.byStatus.break}</strong>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-vx-text-2/40" />
              <span className="text-vx-text-2/70">Desconectado:</span>
              <strong className="text-vx-text">{summary.byStatus.offline}</strong>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-vx-border/60 text-xs tabular-nums text-vx-text-2/50">
            Total plantilla: {agents.length} agentes
          </div>
        </div>

        {/* KPI 4: Estado de Supervisión */}
        <div className="bg-vx-surface border border-vx-border rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-vx-text-2/70 tabular-nums">
                Supervisión
              </span>
              <div className="w-8 h-8 rounded-xl bg-vx-raised text-vx-accent flex items-center justify-center border border-vx-border">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold tabular-nums text-vx-text">
                {monitoring ? MODE_LABELS[monitoring.mode] : 'Inactiva'}
              </span>
            </div>
          </div>
          <p className="text-xs text-vx-text-2/50 mt-3 pt-2.5 border-t border-vx-border/60 tabular-nums">
            {monitoring ? 'Canal de monitoreo enlazado' : 'Sin llamadas bajo supervisión'}
          </p>
        </div>
      </div>

      {/* 4. Tabla de Agentes en Vivo */}
      <div className="bg-vx-surface border border-vx-border rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-vx-border flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-vx-text">Matriz operativa de agentes</h2>
            <p className="text-[13px] text-vx-text-2/60 tabular-nums">
              Estados SIP, llamadas activas y controles de intervención en tiempo real.
            </p>
          </div>
          <span className="text-[13px] tabular-nums text-vx-accent bg-vx-accent/10 px-2.5 py-1 rounded-lg border border-vx-accent/20">
            {activeCalls.length} llamadas simultáneas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-vx-border bg-vx-bg/80 text-xs tabular-nums text-vx-text-2/60">
                <th className="py-3 px-4">Agente</th>
                <th className="py-3 px-4">Campaña / Ext.</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4">Tiempo</th>
                <th className="py-3 px-4">Detalle de llamada</th>
                <th className="py-3 px-4 text-center">Supervisión</th>
                <th className="py-3 px-4 text-right">Controles</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-vx-border/60">
              {agents.map((agent) => {
                const campaign = campaignMap.get(agent.campaignId);
                const currentCall = activeCallMap.get(agent.id);
                const isOnCall = agent.status === 'on_call' && Boolean(currentCall);
                const isUnderMonitoring = monitoring?.callId === currentCall?.id;

                return (
                  <tr
                    key={agent.id}
                    className={`transition-colors hover:bg-vx-raised/40 ${
                      isUnderMonitoring ? 'bg-vx-accent/5' : ''
                    }`}
                  >
                    {/* Agente */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-vx-raised flex items-center justify-center font-bold text-[13px] text-vx-accent tabular-nums shrink-0">
                          {agent.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-vx-text truncate max-w-[150px]">
                            {agent.name}
                          </div>
                          <div className="text-xs text-vx-text-2/50 tabular-nums">
                            {agent.employeeCode}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Campaña & Ext */}
                    <td className="py-3 px-4 tabular-nums">
                      <div className="text-vx-text/90 truncate max-w-[140px]">
                        {campaign?.name ?? 'Sin campaña'}
                      </div>
                      <div className="text-xs text-vx-text-2/50">
                        {agent.sipExtension} • {agent.sipTrunk}
                      </div>
                    </td>

                    {/* Estado */}
                    <td className="py-3 px-4">
                      {agent.status === 'on_call' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[13px] tabular-nums font-bold bg-vx-accent/15 text-vx-accent border border-vx-accent/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-vx-accent animate-pulse" />
                          En llamada
                        </span>
                      )}
                      {agent.status === 'available' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[13px] tabular-nums font-medium bg-vx-success/15 text-vx-success border border-vx-success/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-vx-success" />
                          Disponible
                        </span>
                      )}
                      {agent.status === 'break' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[13px] tabular-nums font-medium bg-vx-warning/15 text-vx-warning border border-vx-warning/30">
                          <Coffee className="w-3 h-3" />
                          En pausa
                        </span>
                      )}
                      {agent.status === 'offline' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[13px] tabular-nums font-medium bg-vx-raised text-vx-text-2/60 border border-vx-border">
                          Desconectado
                        </span>
                      )}
                    </td>

                    {/* Tiempo en estado */}
                    <td className="py-3 px-4 tabular-nums text-vx-text/90">
                      {formatTimeSince(agent.statusSince)}
                    </td>

                    {/* Detalle de Llamada */}
                    <td className="py-3 px-4 tabular-nums">
                      {isOnCall && currentCall ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-vx-accent font-bold text-[13px]">
                              {formatTimer(getCallSeconds(currentCall, now))}
                            </span>
                            <span className="text-vx-text-2/70 text-xs">
                              {currentCall.customerLabel}
                            </span>
                            {currentCall.isVip && (
                              <span className="px-1.5 py-0.2 rounded bg-vx-warning/20 text-vx-warning text-xs border border-vx-warning/40 font-bold">
                                VIP
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span
                              className={`px-1.5 py-0.5 rounded border ${
                                currentCall.sentiment === 'positive'
                                  ? 'bg-vx-success/15 text-vx-success border-vx-success/30'
                                  : currentCall.sentiment === 'negative'
                                    ? 'bg-vx-danger/15 text-vx-danger border-vx-danger/30'
                                    : 'bg-vx-text-2/10 text-vx-text-2 border-vx-border'
                              }`}
                            >
                              {SENTIMENT_LABELS[currentCall.sentiment] ?? currentCall.sentiment}
                            </span>
                            <span className="text-vx-text-2/60">
                              Calidad: <strong className="text-vx-text">{currentCall.qaScore}</strong>
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-vx-text-2/40 text-[13px]">--</span>
                      )}
                    </td>

                    {/* 5. Acciones de Supervisión por agente en llamada */}
                    <td className="py-3 px-4 text-center">
                      {isOnCall && currentCall ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStartMonitor(currentCall.id, 'listen')}
                            title="Escuchar silenciosamente"
                            aria-label={`Escuchar llamada de ${agent.name}`}
                            className="p-1.5 rounded-lg bg-vx-raised hover:bg-vx-accent hover:text-vx-bg text-vx-text-2 border border-vx-border transition-colors"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStartMonitor(currentCall.id, 'whisper')}
                            title="Hablar solo al agente (susurro)"
                            aria-label={`Susurrar al agente ${agent.name}`}
                            className="p-1.5 rounded-lg bg-vx-raised hover:bg-vx-info hover:text-vx-bg text-vx-text-2 border border-vx-border transition-colors"
                          >
                            <Mic className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStartMonitor(currentCall.id, 'intervene')}
                            title="Intervenir en vivo (tripartita)"
                            aria-label={`Intervenir llamada de ${agent.name}`}
                            className="p-1.5 rounded-lg bg-vx-danger/15 hover:bg-vx-danger hover:text-vx-text text-vx-danger border border-vx-danger/30 transition-colors"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEndCall(currentCall.id)}
                            title="Colgar / Terminar llamada"
                            aria-label={`Terminar llamada de ${agent.name}`}
                            className="p-1.5 rounded-lg bg-vx-raised hover:bg-vx-danger hover:text-vx-text text-vx-text-2 border border-vx-border transition-colors ml-1"
                          >
                            <PhoneOff className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-vx-text-2/30 text-[13px]">--</span>
                      )}
                    </td>

                    {/* 7. Controles manuales por agente */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        {agent.status !== 'on_call' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleToggleBreak(agent.id, agent.status)}
                              className={`p-1.5 rounded-lg text-[13px] border transition-colors ${
                                agent.status === 'break'
                                  ? 'bg-vx-warning/20 text-vx-warning border-vx-warning/40 hover:bg-vx-warning hover:text-vx-bg'
                                  : 'bg-vx-raised text-vx-text-2 hover:text-vx-text border-vx-border'
                              }`}
                              title={agent.status === 'break' ? 'Reanudar disponibilidad' : 'Poner en pausa / descanso'}
                              aria-label={agent.status === 'break' ? `Reanudar disponibilidad de ${agent.name}` : `Poner en pausa a ${agent.name}`}
                            >
                              {agent.status === 'break' ? (
                                <Play className="w-3.5 h-3.5" />
                              ) : (
                                <Pause className="w-3.5 h-3.5" />
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleStartCall(agent.id)}
                              className="px-2.5 py-1 rounded-lg text-[13px] font-semibold bg-vx-accent/10 text-vx-accent hover:bg-vx-accent hover:text-vx-bg border border-vx-accent/30 transition-all tabular-nums"
                            >
                              Simular llamada
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 9. Panel "Registro de supervisión" con las últimas 10 entradas */}
      <div className="bg-vx-surface border border-vx-border rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-vx-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-vx-accent/10 text-vx-accent flex items-center justify-center border border-vx-accent/30">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-vx-text">Registro de auditoría de supervisión</h2>
              <p className="text-[13px] text-vx-text-2/60 tabular-nums">
                Trazabilidad de sesiones de escucha, susurro e intervenciones en vivo.
              </p>
            </div>
          </div>
          <span className="text-[13px] tabular-nums text-vx-text-2/50">
            {monitorLog.length} eventos registrados
          </span>
        </div>

        {monitorLog.length === 0 ? (
          <div className="py-6 text-center text-[13px] text-vx-text-2/50 tabular-nums">
            No se han registrado eventos de supervisión en esta sesión.
          </div>
        ) : (
          <div className="divide-y divide-vx-border/50">
            {monitorLog.slice(0, 10).map((log) => {
              const agent = agentMap.get(log.agentId);
              return (
                <div key={log.id} className="py-2.5 flex items-center justify-between gap-3 text-[13px] tabular-nums">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                    <span className="text-vx-text-2/50 text-xs">
                      {new Date(log.at).toLocaleTimeString('es-MX', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                    <span className="font-semibold text-vx-text">
                      {agent?.name ?? 'Agente desconocido'}
                    </span>
                    <span className="text-vx-text-2/70">
                      {log.action === 'start' && 'Inició supervisión'}
                      {log.action === 'mode_change' && 'Cambió modo de supervisión'}
                      {log.action === 'stop' && 'Detuvo supervisión'}
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-xs font-bold border ${
                      log.mode === 'intervene'
                        ? 'bg-vx-danger/20 text-vx-danger border-vx-danger/40'
                        : log.mode === 'whisper'
                          ? 'bg-vx-info/20 text-vx-info border-vx-info/40'
                          : 'bg-vx-accent/20 text-vx-accent border-vx-accent/40'
                    }`}
                  >
                    {MODE_LABELS[log.mode]}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Modal de Confirmación para Intervenir */}
      {interveneTarget && (
        <Modal
          open
          onClose={() => setInterveneTarget(null)}
          title="Confirmar intervención"
          description="Acción sensible de control."
          footer={
            <>
              <Button onClick={() => setInterveneTarget(null)}>Cancelar</Button>
              <Button variant="danger" icon={PhoneCall} onClick={handleConfirmIntervene}>
                Sí, entrar a intervenir
              </Button>
            </>
          }
        >
            <div className="p-3.5 rounded-xl bg-vx-danger/10 border border-vx-danger/30 space-y-2 text-[13px] text-vx-text-2">
              <p className="text-vx-text font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-vx-danger shrink-0" />
                <span>¿Estás seguro de intervenir en esta llamada?</span>
              </p>
              <p>
                Al intervenir, tu micrófono se abrirá tanto para el <strong>agente ({agentMap.get(interveneTarget.agentId)?.name})</strong> como para el <strong>cliente</strong>, convirtiéndose en una llamada tripartita.
              </p>
              <p className="text-xs text-vx-text-2/60 italic tabular-nums pt-1 border-t border-vx-danger/20">
                Esta acción queda registrada de forma permanente en la bitácora de auditoría.
              </p>
            </div>
        </Modal>
      )}
    </div>
  );
};
