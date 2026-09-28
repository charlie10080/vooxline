import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { VooxlineLogo } from '@/components/common/VooxlineLogo';

type AgentState = 'Desconectado' | 'Disponible' | 'En Llamada' | 'After Call Work' | 'Pausa / Receso';

export const AgentPortalPage: React.FC = () => {
  // Reloj digital en vivo
  const [currentTime, setCurrentTime] = useState<{
    hours: string;
    minutes: string;
    seconds: string;
    ampm: string;
  }>({
    hours: '10',
    minutes: '00',
    seconds: '00',
    ampm: 'PM',
  });

  // Fecha actual en español
  const getFormattedDate = () => {
    try {
      const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' };
      const formatted = new Intl.DateTimeFormat('es-ES', options).format(new Date());
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    } catch {
      return 'Lunes, 28 de Septiembre';
    }
  };

  const currentDate = getFormattedDate();

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const formattedHours = String(hours).padStart(2, '0');

      setCurrentTime({
        hours: formattedHours,
        minutes,
        seconds,
        ampm,
      });
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);

    return () => clearInterval(interval);
  }, []);

  // Estado del Turno y Checador
  const [agentState, setAgentState] = useState<AgentState>('Desconectado');
  const [isClockedIn, setIsClockedIn] = useState<boolean>(false);
  const [shiftSeconds, setShiftSeconds] = useState<number>(0);
  const [lastRecord, setLastRecord] = useState<string>('Sin registrar hoy');
  const [callsCount, setCallsCount] = useState<number>(0);
  const [activeSidebarNav, setActiveSidebarNav] = useState<string>('turno');

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isClockedIn && agentState !== 'Desconectado') {
      interval = setInterval(() => {
        setShiftSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isClockedIn, agentState]);

  const getTimeString = () => {
    return new Date().toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const handleClockIn = () => {
    setAgentState('Disponible');
    setIsClockedIn(true);
    setLastRecord('Clock In a las ' + getTimeString());
    if (callsCount === 0) setCallsCount(1);
  };

  const handleLunchBreak = () => {
    setAgentState('Pausa / Receso');
    setLastRecord('Receso Lunch a las ' + getTimeString());
  };

  const handleClockOut = () => {
    setAgentState('Desconectado');
    setIsClockedIn(false);
    setLastRecord('Salida a las ' + getTimeString());
  };

  // Cálculo de tiempos de jornada
  const h = String(Math.floor(shiftSeconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((shiftSeconds % 3600) / 60)).padStart(2, '0');
  const s = String(shiftSeconds % 60).padStart(2, '0');
  const formattedShiftTime = `${h}:${m}:${s}`;
  const accumulatedLabel = `${h}h ${m}m / 08h 00m`;
  const progressPercent = Math.min(100, Math.max(4, Math.round((shiftSeconds / 28800) * 100)));

  // Estilos y badges según el estado
  const getStatusConfig = () => {
    switch (agentState) {
      case 'Disponible':
      case 'En Llamada':
        return {
          containerClass:
            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/15 border border-primary/30 text-primary text-[11px]',
          dotClass: 'w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_#00e676]',
          priority: agentState === 'Disponible' ? 'Alta (Routing ACD)' : 'Ocupado (N2)',
        };
      case 'Pausa / Receso':
        return {
          containerClass:
            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary/15 border border-secondary/30 text-secondary text-[11px]',
          dotClass: 'w-2 h-2 rounded-full bg-secondary',
          priority: 'En Pausa',
        };
      case 'After Call Work':
        return {
          containerClass:
            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-tertiary-container/30 border border-tertiary/30 text-tertiary text-[11px]',
          dotClass: 'w-2 h-2 rounded-full bg-tertiary',
          priority: 'Tipificando',
        };
      default:
        return {
          containerClass:
            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-highest border border-white/10 text-on-surface text-[11px]',
          dotClass: 'w-2 h-2 rounded-full bg-outline',
          priority: 'Standby',
        };
    }
  };

  const statusConfig = getStatusConfig();

  const sidebarLinks = [
    { id: 'turno', label: 'Turno / Asistencia', icon: 'timer' },
    { id: 'telefonia', label: 'Telefonía & Llamadas', icon: 'call' },
    { id: 'metricas', label: 'Métricas & Desempeño', icon: 'query_stats' },
    { id: 'cola', label: 'Cola Omnicanal', icon: 'hub', badge: '3' },
    { id: 'grabaciones', label: 'Grabaciones', icon: 'mic' },
    { id: 'ajustes', label: 'Ajustes de Audio / SIP', icon: 'tune' },
  ];

  return (
    <div className="bg-[#0b0c10] font-body-md text-on-surface min-h-screen flex selection:bg-primary-container selection:text-on-primary-container overflow-x-hidden">
      {/* Desktop Fixed Sidebar */}
      <aside className="w-64 h-screen sticky top-0 bg-[#121317]/90 backdrop-blur-xl border-r border-white/10 flex flex-col justify-between shrink-0 z-40">
        <div className="flex flex-col">
          {/* Brand Logo Header */}
          <div className="h-16 px-5 border-b border-white/10 flex items-center justify-between">
            <Link to="/" title="Ir a inicio">
              <VooxlineLogo size="sm" showSubtitle={false} />
            </Link>
            <span className="font-label-code text-[11px] px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-bold">
              B2B PRO
            </span>
          </div>

          {/* Quick Agent Status in Sidebar */}
          <div className="px-4 py-3 mx-3 my-3 rounded-lg bg-surface-container-low/70 border border-white/5 flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary text-[20px]">person</span>
              <span
                className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#121317] ${
                  isClockedIn ? 'bg-primary animate-pulse' : 'bg-outline'
                }`}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-white truncate">María López</div>
              <div className="text-[11px] text-primary flex items-center gap-1 font-label-code">
                <span className={`w-1.5 h-1.5 rounded-full inline-block ${isClockedIn ? 'bg-primary' : 'bg-outline'}`} />
                <span>{agentState}</span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 flex flex-col gap-1 mt-1 font-medium text-[13px]">
            {sidebarLinks.map((link) => {
              const isActive = activeSidebarNav === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => setActiveSidebarNav(link.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left w-full cursor-pointer ${
                    isActive
                      ? 'bg-primary/15 text-primary border border-primary/30 shadow-[0_0_14px_rgba(0,230,118,0.15)] font-semibold'
                      : 'text-on-surface-variant hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
                  <span className="flex-1">{link.label}</span>
                  {link.badge && (
                    <span className="px-1.5 py-0.5 rounded-full bg-secondary/15 text-secondary text-[11px] font-label-numeric font-semibold">
                      {link.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Telemetry & Logout Shortcut */}
        <div className="p-3 border-t border-white/10 space-y-2">
          <div className="px-3 py-2 rounded-lg bg-surface-container-lowest/80 border border-white/5 flex items-center justify-between text-[11px] font-label-code text-on-surface-variant">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
              WebRTC v2.4
            </span>
            <span className="text-secondary font-semibold">24ms</span>
          </div>
          <Link
            to="/"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-[12px] rounded-lg text-error/80 hover:text-error hover:bg-error/10 border border-transparent hover:border-error/20 transition-all font-label-tag"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span>Cerrar Sesión</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Desktop Header / Status Bar */}
        <header className="h-16 sticky top-0 z-30 bg-[#121317]/80 backdrop-blur-xl border-b border-white/10 px-8 flex items-center justify-between shadow-[0_1px_12px_rgba(0,0,0,0.3)]">
          <div className="flex items-center gap-6">
            <h1 className="font-headline-sm text-[17px] font-bold text-white tracking-wide flex items-center gap-2">
              <span>Portal del Agente Vooxline</span>
              <span className="text-white/20">|</span>
              <span className="text-[13px] font-normal text-on-surface-variant">Centro de Control de Turno</span>
            </h1>
            <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[12px]">
              <span className="material-symbols-outlined text-primary text-[16px]">campaign</span>
              <span className="text-on-surface-variant">Campaña:</span>
              <span className="font-semibold text-white">Soporte Nivel 2 B2B</span>
            </div>
          </div>

          {/* Right Header Status Hub */}
          <div className="flex items-center gap-4">
            {/* SIP Status Indicator */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-[12px] font-label-code">
              <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_#00e676]" />
              <span>SIP: Conectado (WebRTC)</span>
            </div>

            {/* Live Header Date */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high border border-white/5 text-[12px] text-on-surface-variant font-label-tag">
              <span className="material-symbols-outlined text-[15px] text-primary">calendar_today</span>
              <span>{currentDate}</span>
            </div>

            {/* Agent Profile Pill */}
            <div className="flex items-center gap-3 pl-2 border-l border-white/10">
              <div className="text-right">
                <div className="font-label-tag text-[13px] font-bold text-white leading-tight">María López</div>
                <div className="font-label-code text-[11px] text-primary">Agente Nivel 2</div>
              </div>
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center font-bold text-on-primary text-[14px] shadow-[0_0_12px_rgba(0,230,118,0.3)]">
                ML
              </div>
            </div>
          </div>
        </header>

        {/* Operational Dashboard Canvas */}
        <main className="flex-1 p-8 space-y-6 max-w-[1600px] w-full mx-auto">
          {/* Ambient Glow Decorators */}
          <div className="relative w-full">
            <div className="absolute -top-10 left-1/3 w-96 h-36 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -top-8 right-1/4 w-80 h-40 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />
          </div>

          {/* MODULE: Conexión y Seguridad (Remote Talent Telemetry Card) */}
          <section className="w-full bg-[#16181f]/85 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shrink-0 shadow-[0_0_12px_rgba(0,230,118,0.2)]">
                  <span className="material-symbols-outlined text-[22px]">verified_user</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-bold text-white tracking-wide">Conexión y Seguridad</span>
                    <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-primary/15 text-primary border border-primary/20">
                      Telemetría Remota B2B
                    </span>
                  </div>
                  <p className="text-[12px] text-on-surface-variant">
                    Monitoreo continuo de red y periféricos corporativos autorizados
                  </p>
                </div>
              </div>

              {/* Telemetry Data Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:flex lg:items-center gap-3 lg:gap-6 text-[12px]">
                {/* IP Actual */}
                <div className="px-3.5 py-2 rounded-xl bg-surface-container/60 border border-white/5">
                  <span className="text-on-surface-variant block text-[11px] font-label-tag">IP Actual</span>
                  <span className="font-label-code text-white font-semibold flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    189.215.42.10
                  </span>
                </div>

                {/* Ubicación */}
                <div className="px-3.5 py-2 rounded-xl bg-surface-container/60 border border-white/5">
                  <span className="text-on-surface-variant block text-[11px] font-label-tag">Ubicación Geográfica</span>
                  <span className="font-medium text-white flex items-center gap-1 mt-0.5">
                    <span className="material-symbols-outlined text-[15px] text-secondary">location_on</span>
                    Morelia, Michoacán, MX
                  </span>
                </div>

                {/* Latencia / Ping */}
                <div className="px-3.5 py-2 rounded-xl bg-surface-container/60 border border-white/5">
                  <span className="text-on-surface-variant block text-[11px] font-label-tag">Latencia / Ping</span>
                  <span className="font-label-code text-primary font-semibold flex items-center gap-1.5 mt-0.5">
                    <span className="material-symbols-outlined text-[16px] text-primary">network_check</span>
                    24ms <span className="text-[10px] text-on-surface-variant font-normal">(Conexión Estable)</span>
                  </span>
                </div>

                {/* ISP / Red */}
                <div className="px-3.5 py-2 rounded-xl bg-surface-container/60 border border-white/5">
                  <span className="text-on-surface-variant block text-[11px] font-label-tag">ISP &amp; Cifrado</span>
                  <span className="font-label-code text-on-surface text-[11px] flex items-center gap-1 mt-0.5">
                    <span className="material-symbols-outlined text-[15px] text-tertiary">lock</span>
                    Fibra B2B · TLS 1.3 / SRTP
                  </span>
                </div>

                {/* Device Audio Check */}
                <div className="col-span-2 md:col-span-4 lg:col-span-1 px-3.5 py-2 rounded-xl bg-surface-container/60 border border-white/5 flex items-center justify-between lg:justify-start gap-2">
                  <div>
                    <span className="text-on-surface-variant block text-[11px] font-label-tag">Dispositivo Audio</span>
                    <span className="text-white text-[12px] flex items-center gap-1 font-medium mt-0.5">
                      <span className="material-symbols-outlined text-[15px] text-primary">headset_mic</span>
                      Jabra Evolve2 65 (Mic OK)
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-outline text-[18px] hover:text-white cursor-pointer ml-2">
                    tune
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Center Checador (Turn Clock & Attendance Glass Panel) */}
          <section className="w-full bg-[#13151c]/90 backdrop-blur-2xl rounded-2xl border border-white/10 p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-20 -top-20 w-80 h-80 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto">
              {/* Date Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-on-surface-variant text-[13px] mb-3">
                <span className="material-symbols-outlined text-[18px] text-primary">calendar_today</span>
                <span className="font-label-tag uppercase tracking-wider font-semibold">{currentDate}</span>
              </div>

              {/* High-Impact Digital Clock */}
              <div className="my-2 flex flex-col items-center">
                <div className="font-display-hero text-[58px] md:text-[68px] leading-tight text-white font-label-numeric font-bold tracking-tight drop-shadow-[0_0_24px_rgba(102,252,241,0.25)]">
                  {currentTime.hours}:{currentTime.minutes}:{currentTime.seconds}{' '}
                  <span className="font-headline-lg text-[32px] md:text-[38px] text-secondary font-bold">
                    {currentTime.ampm}
                  </span>
                </div>
                <div className="font-label-code text-[13px] text-on-surface-variant flex items-center gap-2 mt-1">
                  <span className="material-symbols-outlined text-[16px] text-secondary">schedule</span>
                  <span>
                    Zona Horaria: <span className="text-white">America/Mexico_City (GMT-6)</span>
                  </span>
                </div>
              </div>

              {/* 3 Primary Action Buttons in Ergonomic Horizontal Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mt-7">
                {/* 1. Clock In (Neon Green CTA) */}
                <button
                  onClick={handleClockIn}
                  className={`h-14 px-6 rounded-xl font-headline-sm text-[16px] font-bold flex items-center justify-center gap-3 shadow-[0_0_24px_rgba(0,230,118,0.45)] hover:shadow-[0_0_36px_rgba(0,230,118,0.7)] active:scale-[0.98] transition-all cursor-pointer ${
                    isClockedIn && agentState === 'Disponible'
                      ? 'bg-primary-container text-on-primary-container ring-2 ring-white/30'
                      : 'bg-primary-container hover:bg-[#00f880] text-on-primary-container'
                  }`}
                  id="btn-clock-in"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[26px]">play_circle</span>
                  <span>Clock In (Entrada)</span>
                </button>

                {/* 2. Lunch Break */}
                <button
                  onClick={handleLunchBreak}
                  className={`h-14 px-6 rounded-xl font-headline-sm text-[16px] font-semibold flex items-center justify-center gap-3 shadow-md hover:border-secondary/40 active:scale-[0.98] transition-all cursor-pointer ${
                    agentState === 'Pausa / Receso'
                      ? 'bg-secondary/20 text-secondary border border-secondary ring-2 ring-secondary/30'
                      : 'bg-[#1E222D] hover:bg-[#252a38] text-white border border-white/10'
                  }`}
                  id="btn-lunch-break"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[22px] text-secondary">coffee</span>
                  <span>Lunch Break</span>
                </button>

                {/* 3. Clock Out */}
                <button
                  onClick={handleClockOut}
                  className={`h-14 px-6 rounded-xl font-headline-sm text-[16px] font-semibold flex items-center justify-center gap-3 shadow-md active:scale-[0.98] transition-all cursor-pointer ${
                    !isClockedIn
                      ? 'bg-[#381A20]/80 text-error border border-error/30 opacity-70'
                      : 'bg-[#381A20]/80 hover:bg-[#4a1f28] text-error border border-error/30'
                  }`}
                  id="btn-clock-out"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[22px]">stop_circle</span>
                  <span>Clock Out (Salida)</span>
                </button>
              </div>

              {/* Shift Summary Sub-Bar */}
              <div className="mt-6 pt-4 w-full border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                <div className="flex items-center gap-2 text-on-surface-variant font-label-code text-[12px] bg-white/[0.02] p-2.5 rounded-lg border border-white/5">
                  <span className="material-symbols-outlined text-[16px] text-primary">history</span>
                  <div>
                    <span className="text-white/60 block text-[10px]">ÚLTIMO MARCAJE</span>
                    <span className="text-white font-medium">{lastRecord}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-on-surface-variant font-label-code text-[12px] bg-white/[0.02] p-2.5 rounded-lg border border-white/5">
                  <span className="material-symbols-outlined text-[16px] text-secondary">timelapse</span>
                  <div>
                    <span className="text-white/60 block text-[10px]">HORAS ACUMULADAS</span>
                    <span className="text-white font-medium">{accumulatedLabel}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-on-surface-variant font-label-code text-[12px] bg-white/[0.02] p-2.5 rounded-lg border border-white/5">
                  <span className="material-symbols-outlined text-[16px] text-tertiary">restaurant</span>
                  <div>
                    <span className="text-white/60 block text-[10px]">TIEMPO PARA RECESO</span>
                    <span className="text-white font-medium">Programado: 01:30 PM (45 min)</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Desktop KPIs & Widgets Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 w-full">
            {/* KPI 1: Horas Hoy */}
            <div className="bg-[#14161f]/85 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-lg flex flex-col justify-between hover:border-white/20 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center text-primary shadow-[0_0_12px_rgba(0,230,118,0.2)]">
                    <span className="material-symbols-outlined text-[22px]">hourglass_top</span>
                  </div>
                  <div>
                    <span className="font-label-tag text-[12px] text-on-surface-variant uppercase tracking-wider block">
                      Horas Hoy
                    </span>
                    <span className="text-[11px] font-label-code text-primary font-medium">
                      {isClockedIn ? 'Jornada Activa' : 'Pausada'}
                    </span>
                  </div>
                </div>
                <span className="font-label-code text-[11px] text-primary-fixed-dim bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full">
                  Meta: 8h
                </span>
              </div>
              <div className="my-4">
                <div className="font-headline-lg text-[32px] font-label-numeric font-bold text-white tracking-tight">
                  {formattedShiftTime}
                </div>
                {/* Progress Bar */}
                <div className="w-full h-2 bg-surface-container-highest/80 rounded-full mt-2.5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-[12px] font-label-code text-on-surface-variant pt-2 border-t border-white/5">
                <span>
                  Cumplimiento: <span className="text-white font-semibold">{progressPercent}%</span>
                </span>
                <span className="text-secondary font-medium">Restante: {8 - Math.floor(shiftSeconds / 3600)}h</span>
              </div>
            </div>

            {/* KPI 2: Llamadas Atendidas */}
            <div className="bg-[#14161f]/85 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-lg flex flex-col justify-between hover:border-white/20 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary/15 border border-secondary/25 flex items-center justify-center text-secondary shadow-[0_0_12px_rgba(68,226,215,0.2)]">
                    <span className="material-symbols-outlined text-[22px]">support_agent</span>
                  </div>
                  <div>
                    <span className="font-label-tag text-[12px] text-on-surface-variant uppercase tracking-wider block">
                      Llamadas Atendidas
                    </span>
                    <span className="text-[11px] font-label-code text-secondary font-medium">Inbound N2</span>
                  </div>
                </div>
                <span className="font-label-code text-[11px] text-white/70 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                  Diario: 45
                </span>
              </div>
              <div className="my-4 flex items-baseline gap-2">
                <span className="font-headline-lg text-[32px] font-label-numeric font-bold text-white tracking-tight">
                  {callsCount}
                </span>
                <span className="font-label-code text-on-surface-variant text-[14px]">/ 45 objetivo</span>
              </div>
              <div className="flex items-center justify-between text-[12px] font-label-code text-on-surface-variant pt-2 border-t border-white/5">
                <span>
                  Resolución: <span className="text-primary font-semibold">98.2%</span>
                </span>
                <span className="text-secondary font-medium">CSAT: 4.9/5</span>
              </div>
            </div>

            {/* KPI 3: Estado del Agente con Selector Interactivo */}
            <div className="bg-[#14161f]/85 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-lg flex flex-col justify-between hover:border-white/20 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-surface-container-high border border-white/10 flex items-center justify-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-[22px]">radio_button_checked</span>
                  </div>
                  <div>
                    <span className="font-label-tag text-[12px] text-on-surface-variant uppercase tracking-wider block">
                      Estado del Agente
                    </span>
                    <span className="text-[11px] font-label-code text-white/60">Disponibilidad ACD</span>
                  </div>
                </div>
                <div className={statusConfig.containerClass}>
                  <span className={statusConfig.dotClass} />
                  <span className="font-label-code font-medium text-white">{agentState}</span>
                </div>
              </div>

              {/* Selector de Estado para el Operador */}
              <div className="my-3">
                <label className="block text-[11px] font-label-tag text-on-surface-variant mb-1.5" htmlFor="agent-status-select">
                  Cambiar Estado ACD:
                </label>
                <select
                  id="agent-status-select"
                  value={agentState}
                  onChange={(e) => setAgentState(e.target.value as AgentState)}
                  className="w-full bg-[#1c1f2b] border border-white/15 text-white text-[13px] rounded-lg px-3 py-2 focus:ring-1 focus:ring-primary focus:border-primary outline-none cursor-pointer"
                >
                  <option value="Desconectado">Desconectado (Off-shift)</option>
                  <option value="Disponible">Disponible (Ready)</option>
                  <option value="En Llamada">En Llamada (Busy)</option>
                  <option value="After Call Work">After Call Work (ACW)</option>
                  <option value="Pausa / Receso">Pausa / Receso (Break)</option>
                </select>
              </div>

              <div className="flex items-center justify-between text-[12px] font-label-code text-on-surface-variant pt-2 border-t border-white/5">
                <span>Prioridad de Cola:</span>
                <span className="text-white font-semibold">{statusConfig.priority}</span>
              </div>
            </div>

            {/* KPI 4: Cola Vooxline Omnicanal Telemetría */}
            <div className="bg-[#14161f]/85 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-lg flex flex-col justify-between hover:border-white/20 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary/15 border border-secondary/25 flex items-center justify-center text-secondary shadow-[0_0_12px_rgba(68,226,215,0.2)]">
                    <span className="material-symbols-outlined text-[22px]">hub</span>
                  </div>
                  <div>
                    <span className="font-label-tag text-[12px] text-on-surface-variant uppercase tracking-wider block">
                      Cola Omnicanal
                    </span>
                    <span className="text-[11px] font-label-code text-secondary">Troncal 04</span>
                  </div>
                </div>
                <span className="font-label-code text-[11px] text-secondary bg-secondary/10 border border-secondary/20 px-2.5 py-1 rounded-full">
                  SLA: 94.2%
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 my-3">
                <div className="bg-surface-container/60 rounded-xl p-2.5 border border-white/5">
                  <span className="text-[11px] text-on-surface-variant block font-label-tag">En Espera</span>
                  <div className="font-headline-sm text-[20px] font-label-numeric font-bold text-secondary flex items-baseline gap-1 mt-0.5">
                    3 <span className="text-[11px] font-normal text-on-surface-variant">clientes</span>
                  </div>
                </div>
                <div className="bg-surface-container/60 rounded-xl p-2.5 border border-white/5">
                  <span className="text-[11px] text-on-surface-variant block font-label-tag">TMO Promedio</span>
                  <div className="font-headline-sm text-[20px] font-label-numeric font-bold text-primary mt-0.5">
                    2m 14s
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between text-[12px] font-label-code text-on-surface-variant pt-2 border-t border-white/5">
                <span className="flex items-center gap-1.5 text-white">
                  <span className="w-2 h-2 rounded-full bg-secondary" />
                  Nivel de Servicio: <span className="text-secondary font-semibold">94.2%</span>
                </span>
                <span className="text-primary hover:underline cursor-pointer">Ver Cola →</span>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* Floating Quick Navigation Switcher for Easy Testing */}
      <div className="fixed bottom-4 right-4 z-50 bg-[#13151c]/95 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2 shadow-2xl flex items-center gap-3 font-label-code text-xs">
        <span className="flex items-center gap-1.5 text-primary font-bold">
          <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
          RUTAS:
        </span>
        <Link to="/" className="text-on-surface-variant hover:text-white">
          / (Index)
        </Link>
        <span className="text-white/20">|</span>
        <Link to="/login" className="text-on-surface-variant hover:text-white">
          /login
        </Link>
        <span className="text-white/20">|</span>
        <Link to="/admin" className="text-on-surface-variant hover:text-white">
          /admin
        </Link>
        <span className="text-white/20">|</span>
        <Link to="/cliente" className="text-on-surface-variant hover:text-white">
          /cliente
        </Link>
        <span className="text-white/20">|</span>
        <Link to="/agente" className="text-secondary hover:text-white font-bold hover:underline">
          /agente
        </Link>
      </div>
    </div>
  );
};

export default AgentPortalPage;
