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
  X,
  History,
} from 'lucide-react';

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
        message: `Supervisión iniciada en modo "${mode === 'listen' ? 'Escuchar' : 'Whisper'}".`,
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
        message: `Modo de supervisión cambiado a "${mode === 'listen' ? 'Escuchar' : 'Whisper'}".`,
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
      {/* 2. Banner Fijo "Modo simulado: sin audio real" */}
      <div className="bg-[#1F2833]/70 border border-[#242E3B] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#66FCF1]/10 text-[#66FCF1] flex items-center justify-center border border-[#66FCF1]/30 shrink-0">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Modo simulado: sin audio real
              </span>
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            </div>
            <p className="text-xs text-[#C5C6C7]/70">
              Las llamadas, latencias SIP, análisis de sentimiento y puntajes QA son generados por el motor de simulación para pruebas operativas.
            </p>
          </div>
        </div>

        {/* 1. Interruptor Simulación ON/OFF */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setSimulationEnabled(!simulationEnabled)}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all border ${
              simulationEnabled
                ? 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                : 'bg-[#1F2833] text-[#C5C6C7]/60 border-[#242E3B]'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                simulationEnabled ? 'bg-[#10B981] animate-ping' : 'bg-[#C5C6C7]/40'
              }`}
            />
            <span>{simulationEnabled ? 'Simulación ACTIVA' : 'Simulación PAUSADA'}</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            title="Reiniciar datos de simulación"
            className="p-2 rounded-xl bg-[#1F2833] hover:bg-[#253240] text-[#C5C6C7] hover:text-white border border-[#242E3B] transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Encabezado */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-[#13151c] border border-[#242E3B] rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-[#66FCF1]/5 to-transparent pointer-events-none" />

        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-[#66FCF1]/10 text-[#66FCF1] border border-[#66FCF1]/30">
              GENERAL
            </span>
            <span className="text-xs text-[#C5C6C7]/50 font-mono">
              Consola de Monitoreo & Supervisión en Vivo
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Headphones className="w-7 h-7 text-[#66FCF1]" />
            <span>Monitor en Vivo</span>
          </h1>
          <p className="text-sm text-[#C5C6C7]/80">
            Seguimiento de agentes, canales de audio en tiempo real y herramientas de supervisión activa.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10 text-xs font-mono text-[#C5C6C7]/70">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0B0C10] border border-[#242E3B]">
            <Sparkles className="w-3.5 h-3.5 text-[#66FCF1]" />
            <span>Ciclo: cada {TICK_MS / 1000}s</span>
          </div>
        </div>
      </div>

      {/* Alerta de notificación / error */}
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
            className="text-xs opacity-70 hover:opacity-100 uppercase tracking-wider font-mono ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* 6. Panel "Supervisión activa" (cuando monitoring no es null y llamada activa) */}
      {currentMonitoredCall && currentMonitoredAgent && (
        <div className="bg-[#13151c] border-2 border-[#66FCF1] rounded-2xl p-5 shadow-[0_0_20px_rgba(102,252,241,0.15)] relative overflow-hidden animate-fadeIn">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start md:items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#66FCF1]/20 text-[#66FCF1] flex items-center justify-center border border-[#66FCF1]/40 shrink-0">
                {monitoring?.mode === 'intervene' ? (
                  <PhoneCall className="w-5 h-5 text-[#EF4444] animate-bounce" />
                ) : monitoring?.mode === 'whisper' ? (
                  <Mic className="w-5 h-5 text-[#38BDF8]" />
                ) : (
                  <Volume2 className="w-5 h-5 text-[#66FCF1]" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#66FCF1]">
                    Supervisión en Curso
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border bg-[#1F2833] text-white">
                    Modo: {monitoring?.mode.toUpperCase()}
                  </span>
                </div>

                <div className="text-sm font-bold text-white mt-0.5 flex flex-wrap items-center gap-2">
                  <span>{currentMonitoredAgent.name}</span>
                  <span className="text-[#C5C6C7]/50 font-normal font-mono">•</span>
                  <span className="text-[#66FCF1] font-mono">{currentMonitoredCall.customerLabel}</span>
                  {currentMonitoredCall.isVip && (
                    <span className="px-1.5 py-0.5 rounded bg-[#F59E0B]/20 text-[#F59E0B] text-[10px] font-mono border border-[#F59E0B]/40 font-bold">
                      VIP
                    </span>
                  )}
                </div>

                <div className="text-xs text-[#C5C6C7]/70 font-mono mt-1 flex items-center gap-2">
                  <span>Tiempo en supervisión:</span>
                  <strong className="text-white">
                    {monitoring ? formatTimer(Math.max(0, Math.round((now.getTime() - new Date(monitoring.startedAt).getTime()) / 1000))) : '00:00'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Controles del panel de supervisión */}
            <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0">
              <span className="text-xs text-[#C5C6C7]/60 font-mono mr-1">Cambiar modo:</span>
              <button
                type="button"
                onClick={() => handleChangeMonitorMode('listen')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all border ${
                  monitoring?.mode === 'listen'
                    ? 'bg-[#66FCF1] text-[#0B0C10] border-[#66FCF1] font-bold'
                    : 'bg-[#1F2833] text-[#C5C6C7] hover:text-white border-[#242E3B]'
                }`}
              >
                Escuchar
              </button>

              <button
                type="button"
                onClick={() => handleChangeMonitorMode('whisper')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all border ${
                  monitoring?.mode === 'whisper'
                    ? 'bg-[#38BDF8] text-[#0B0C10] border-[#38BDF8] font-bold'
                    : 'bg-[#1F2833] text-[#C5C6C7] hover:text-white border-[#242E3B]'
                }`}
              >
                Whisper
              </button>

              <button
                type="button"
                onClick={() => handleChangeMonitorMode('intervene')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all border ${
                  monitoring?.mode === 'intervene'
                    ? 'bg-[#EF4444] text-white border-[#EF4444] font-bold animate-pulse'
                    : 'bg-[#EF4444]/15 text-[#EF4444] hover:bg-[#EF4444] hover:text-white border-[#EF4444]/30'
                }`}
              >
                Intervenir
              </button>

              <button
                type="button"
                onClick={stopMonitoring}
                className="ml-2 px-3.5 py-1.5 rounded-lg bg-[#1F2833] hover:bg-[#253240] text-xs font-semibold text-white border border-[#242E3B] transition-colors"
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
        <div className="bg-[#13151c] border border-[#242E3B] rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#C5C6C7]/70 font-mono uppercase tracking-wider">
              Llamadas Activas
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#66FCF1]/15 text-[#66FCF1] flex items-center justify-center border border-[#66FCF1]/30">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">
              {summary.activeCalls}
            </span>
            <span className="text-xs text-[#66FCF1] font-mono">en curso</span>
          </div>

          <div className="mt-3 pt-2.5 border-t border-[#242E3B]/60 flex items-center justify-between text-[11px] font-mono text-[#C5C6C7]/70">
            <span>Sentimiento:</span>
            <div className="flex items-center gap-2">
              <span className="text-[#10B981]" title="Positivo">+{summary.sentiment.positive}</span>
              <span className="text-[#C5C6C7]" title="Neutral">~{summary.sentiment.neutral}</span>
              <span className="text-[#EF4444]" title="Negativo">-{summary.sentiment.negative}</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Duración promedio */}
        <div className="bg-[#13151c] border border-[#242E3B] rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#C5C6C7]/70 font-mono uppercase tracking-wider">
              Duración Promedio
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#38BDF8]/15 text-[#38BDF8] flex items-center justify-center border border-[#38BDF8]/30">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">
              {formatTimer(summary.avgSeconds)}
            </span>
            <span className="text-xs text-[#38BDF8] font-mono">MM:SS</span>
          </div>
          <p className="text-[11px] text-[#C5C6C7]/50 mt-3 pt-2.5 border-t border-[#242E3B]/60 font-mono">
            Calculado sobre llamadas activas
          </p>
        </div>

        {/* KPI 3: Agentes por estado */}
        <div className="bg-[#13151c] border border-[#242E3B] rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#C5C6C7]/70 font-mono uppercase tracking-wider">
              Estado de Agentes
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#10B981]/15 text-[#10B981] flex items-center justify-center border border-[#10B981]/30">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#66FCF1] animate-pulse" />
              <span className="text-[#C5C6C7]/70">Llamada:</span>
              <strong className="text-white">{summary.byStatus.on_call}</strong>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#10B981]" />
              <span className="text-[#C5C6C7]/70">Libre:</span>
              <strong className="text-white">{summary.byStatus.available}</strong>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
              <span className="text-[#C5C6C7]/70">Pausa:</span>
              <strong className="text-white">{summary.byStatus.break}</strong>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#C5C6C7]/40" />
              <span className="text-[#C5C6C7]/70">Offline:</span>
              <strong className="text-white">{summary.byStatus.offline}</strong>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-[#242E3B]/60 text-[11px] font-mono text-[#C5C6C7]/50">
            Total plantilla: {agents.length} agentes
          </div>
        </div>

        {/* KPI 4: Estado de Supervisión */}
        <div className="bg-[#13151c] border border-[#242E3B] rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#C5C6C7]/70 font-mono uppercase tracking-wider">
                Supervisión
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#1F2833] text-[#66FCF1] flex items-center justify-center border border-[#242E3B]">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-white">
                {monitoring ? monitoring.mode.toUpperCase() : 'INACTIVA'}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-[#C5C6C7]/50 mt-3 pt-2.5 border-t border-[#242E3B]/60 font-mono">
            {monitoring ? 'Canal de monitoreo enlazado' : 'Sin llamadas bajo supervisión'}
          </p>
        </div>
      </div>

      {/* 4. Tabla de Agentes en Vivo */}
      <div className="bg-[#13151c] border border-[#242E3B] rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-[#242E3B] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Matriz Operativa de Agentes</h2>
            <p className="text-xs text-[#C5C6C7]/60 font-mono">
              Estados SIP, llamadas activas y controles de intervención en tiempo real.
            </p>
          </div>
          <span className="text-xs font-mono text-[#66FCF1] bg-[#66FCF1]/10 px-2.5 py-1 rounded-lg border border-[#66FCF1]/20">
            {activeCalls.length} llamadas simultáneas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#242E3B] bg-[#0B0C10]/80 text-[11px] font-mono text-[#C5C6C7]/60 uppercase tracking-wider">
                <th className="py-3 px-4">Agente</th>
                <th className="py-3 px-4">Campaña / Ext</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4">Tiempo</th>
                <th className="py-3 px-4">Detalle de Llamada</th>
                <th className="py-3 px-4 text-center">Supervisión</th>
                <th className="py-3 px-4 text-right">Controles</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#242E3B]/60">
              {agents.map((agent) => {
                const campaign = campaignMap.get(agent.campaignId);
                const currentCall = activeCallMap.get(agent.id);
                const isOnCall = agent.status === 'on_call' && Boolean(currentCall);
                const isUnderMonitoring = monitoring?.callId === currentCall?.id;

                return (
                  <tr
                    key={agent.id}
                    className={`transition-colors hover:bg-[#1A202C]/40 ${
                      isUnderMonitoring ? 'bg-[#66FCF1]/5' : ''
                    }`}
                  >
                    {/* Agente */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#1F2833] flex items-center justify-center font-bold text-xs text-[#66FCF1] font-mono shrink-0">
                          {agent.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-white truncate max-w-[150px]">
                            {agent.name}
                          </div>
                          <div className="text-[10px] text-[#C5C6C7]/50 font-mono">
                            {agent.employeeCode}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Campaña & Ext */}
                    <td className="py-3 px-4 font-mono">
                      <div className="text-white/90 truncate max-w-[140px]">
                        {campaign?.name ?? 'Sin campaña'}
                      </div>
                      <div className="text-[10px] text-[#C5C6C7]/50">
                        {agent.sipExtension} • {agent.sipTrunk}
                      </div>
                    </td>

                    {/* Estado */}
                    <td className="py-3 px-4">
                      {agent.status === 'on_call' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-[#66FCF1]/15 text-[#66FCF1] border border-[#66FCF1]/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#66FCF1] animate-pulse" />
                          En llamada
                        </span>
                      )}
                      {agent.status === 'available' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                          Disponible
                        </span>
                      )}
                      {agent.status === 'break' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30">
                          <Coffee className="w-3 h-3" />
                          En pausa
                        </span>
                      )}
                      {agent.status === 'offline' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-[#1F2833] text-[#C5C6C7]/60 border border-[#242E3B]">
                          Desconectado
                        </span>
                      )}
                    </td>

                    {/* Tiempo en estado */}
                    <td className="py-3 px-4 font-mono text-white/90">
                      {formatTimeSince(agent.statusSince)}
                    </td>

                    {/* Detalle de Llamada */}
                    <td className="py-3 px-4 font-mono">
                      {isOnCall && currentCall ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[#66FCF1] font-bold text-xs">
                              {formatTimer(getCallSeconds(currentCall, now))}
                            </span>
                            <span className="text-[#C5C6C7]/70 text-[11px]">
                              {currentCall.customerLabel}
                            </span>
                            {currentCall.isVip && (
                              <span className="px-1.5 py-0.2 rounded bg-[#F59E0B]/20 text-[#F59E0B] text-[9px] border border-[#F59E0B]/40 font-bold">
                                VIP
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px]">
                            <span
                              className={`px-1.5 py-0.5 rounded border ${
                                currentCall.sentiment === 'positive'
                                  ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30'
                                  : currentCall.sentiment === 'negative'
                                    ? 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30'
                                    : 'bg-[#C5C6C7]/10 text-[#C5C6C7] border-[#242E3B]'
                              }`}
                            >
                              {currentCall.sentiment}
                            </span>
                            <span className="text-[#C5C6C7]/60">
                              QA: <strong className="text-white">{currentCall.qaScore}</strong>
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[#C5C6C7]/40 text-xs">--</span>
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
                            className="p-1.5 rounded-lg bg-[#1F2833] hover:bg-[#66FCF1] hover:text-[#0B0C10] text-[#C5C6C7] border border-[#242E3B] transition-colors"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStartMonitor(currentCall.id, 'whisper')}
                            title="Hablar solo al agente (Whisper)"
                            className="p-1.5 rounded-lg bg-[#1F2833] hover:bg-[#38BDF8] hover:text-[#0B0C10] text-[#C5C6C7] border border-[#242E3B] transition-colors"
                          >
                            <Mic className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStartMonitor(currentCall.id, 'intervene')}
                            title="Intervenir en vivo (tripartita)"
                            className="p-1.5 rounded-lg bg-[#EF4444]/15 hover:bg-[#EF4444] hover:text-white text-[#EF4444] border border-[#EF4444]/30 transition-colors"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEndCall(currentCall.id)}
                            title="Colgar / Terminar llamada"
                            className="p-1.5 rounded-lg bg-[#1F2833] hover:bg-[#EF4444] hover:text-white text-[#C5C6C7] border border-[#242E3B] transition-colors ml-1"
                          >
                            <PhoneOff className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[#C5C6C7]/30 text-xs">--</span>
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
                              className={`p-1.5 rounded-lg text-xs border transition-colors ${
                                agent.status === 'break'
                                  ? 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/40 hover:bg-[#F59E0B] hover:text-[#0B0C10]'
                                  : 'bg-[#1F2833] text-[#C5C6C7] hover:text-white border-[#242E3B]'
                              }`}
                              title={agent.status === 'break' ? 'Reanudar disponibilidad' : 'Poner en pausa / descanso'}
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
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#66FCF1]/10 text-[#66FCF1] hover:bg-[#66FCF1] hover:text-[#0B0C10] border border-[#66FCF1]/30 transition-all font-mono"
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
      <div className="bg-[#13151c] border border-[#242E3B] rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#242E3B] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#66FCF1]/10 text-[#66FCF1] flex items-center justify-center border border-[#66FCF1]/30">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Registro de Auditoría de Supervisión</h2>
              <p className="text-xs text-[#C5C6C7]/60 font-mono">
                Trazabilidad de sesiones de escucha, whisper e intervenciones en vivo.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-[#C5C6C7]/50">
            {monitorLog.length} eventos registrados
          </span>
        </div>

        {monitorLog.length === 0 ? (
          <div className="py-6 text-center text-xs text-[#C5C6C7]/50 font-mono">
            No se han registrado eventos de supervisión en esta sesión.
          </div>
        ) : (
          <div className="divide-y divide-[#242E3B]/50">
            {monitorLog.slice(0, 10).map((log) => {
              const agent = agentMap.get(log.agentId);
              return (
                <div key={log.id} className="py-2.5 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-3">
                    <span className="text-[#C5C6C7]/50 text-[11px]">
                      {new Date(log.at).toLocaleTimeString('es-MX', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                    <span className="font-semibold text-white">
                      {agent?.name ?? 'Agente desconocido'}
                    </span>
                    <span className="text-[#C5C6C7]/70">
                      {log.action === 'start' && 'Inició supervisión'}
                      {log.action === 'mode_change' && 'Cambió modo de supervisión'}
                      {log.action === 'stop' && 'Detuvo supervisión'}
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                      log.mode === 'intervene'
                        ? 'bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/40'
                        : log.mode === 'whisper'
                          ? 'bg-[#38BDF8]/20 text-[#38BDF8] border-[#38BDF8]/40'
                          : 'bg-[#66FCF1]/20 text-[#66FCF1] border-[#66FCF1]/40'
                    }`}
                  >
                    {log.mode}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Modal de Confirmación para Intervenir */}
      {interveneTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#13151c] border border-[#EF4444]/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#242E3B] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#EF4444]/20 text-[#EF4444] flex items-center justify-center border border-[#EF4444]/40">
                  <PhoneCall className="w-4 h-4 animate-bounce" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Confirmar Intervención</h3>
                  <p className="text-[11px] text-[#EF4444] font-mono">Acción sensible de control</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInterveneTarget(null)}
                className="p-1 rounded-lg text-[#C5C6C7] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 space-y-2 text-xs text-[#C5C6C7]">
              <p className="text-white font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-[#EF4444] shrink-0" />
                <span>¿Estás seguro de intervenir en esta llamada?</span>
              </p>
              <p>
                Al intervenir, tu micrófono se abrirá tanto para el <strong>agente ({agentMap.get(interveneTarget.agentId)?.name})</strong> como para el <strong>cliente</strong>, convirtiéndose en una llamada tripartita.
              </p>
              <p className="text-[11px] text-[#C5C6C7]/60 italic font-mono pt-1 border-t border-[#EF4444]/20">
                Esta acción queda registrada de forma permanente en la bitácora de auditoría.
              </p>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setInterveneTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#C5C6C7] hover:text-white bg-[#1F2833] hover:bg-[#253240]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmIntervene}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#EF4444] hover:bg-[#dc2626] shadow-[0_0_15px_rgba(239,68,68,0.35)]"
              >
                Sí, entrar a intervenir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
