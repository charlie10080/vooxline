import React, { useState } from 'react';
import { Avatar } from '@/components/ui';
import { Link, useNavigate } from 'react-router-dom';
import { useSessionStore } from '@/store/useSessionStore';
import { VooxlineLogo } from '@/components/common/VooxlineLogo';

export const ClientDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const logout = useSessionStore((s) => s.logout);
  // Estado para la pestaña de navegación lateral activa
  const [activeNav, setActiveNav] = useState<string>('resumen-operativo');

  // Estado para el intervalo de tiempo en la gráfica
  const [timeInterval, setTimeInterval] = useState<'1h' | '6h' | '24h' | '7d'>('24h');

  // Estado para el filtro de agentes en la tabla
  const [agentFilter, setAgentFilter] = useState<'todos' | 'en-llamada' | 'disponible' | 'pausa'>('todos');

  // Estado para simulación de escucha/monitoreo en vivo
  const [listeningAgent, setListeningAgent] = useState<string | null>(null);

  // Estado de exportación de informe
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
    }, 1800);
  };

  const navItems = [
    { id: 'resumen-operativo', label: 'Resumen Operativo', icon: 'dashboard' },
    { id: 'calidad-y-grabaciones', label: 'Calidad y Grabaciones', icon: 'graphic_eq' },
    { id: 'reportes-analiticos', label: 'Reportes Analíticos', icon: 'analytics' },
    { id: 'facturacion', label: 'Facturación', icon: 'receipt_long' },
  ];

  return (
    <div className="bg-surface text-on-surface font-body-md text-body-md min-h-screen">
      {/* Sidebar Fijo del Cliente B2B */}
      <aside className="fixed left-0 top-0 h-full w-72 bg-surface-container-lowest/90 backdrop-blur-xl z-50 flex flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-r border-white/5">
        <div className="flex flex-col">
          {/* Header del Sidebar con Logo Oficial */}
          <div className="px-gutter pt-space-lg pb-space-md">
            <Link to="/" className="flex items-center gap-space-sm mb-space-xs" title="Ir a inicio">
              <VooxlineLogo size="sm" showSubtitle={false} />
            </Link>
            <div className="inline-flex items-center gap-space-xs px-space-sm py-space-xs rounded-full bg-surface-container-high">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
              <span className="font-label-code text-label-code text-secondary uppercase tracking-wider font-semibold">
                B2B Client Portal / Enterprise
              </span>
            </div>
          </div>

          {/* Menú de Navegación Lateral */}
          <nav className="flex flex-col gap-space-xs px-space-md mt-space-md">
            {navItems.map((item) => {
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveNav(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-space-md px-space-md py-space-sm rounded-lg transition-all group cursor-pointer text-left w-full ${
                    isActive
                      ? 'bg-surface-container-high text-primary shadow-[0_0_24px_-2px_rgba(0,230,118,0.35)]'
                      : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                  }`}
                  type="button"
                >
                  <span className="material-symbols-outlined text-inherit">{item.icon}</span>
                  <span className="font-body-md text-body-md font-medium flex-1">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer del Sidebar con Uptime & Salida */}
        <div className="p-space-md flex flex-col gap-space-sm">
          <div className="p-space-sm rounded-lg bg-surface-container-low/60 flex flex-col gap-space-xs border border-white/5">
            <div className="flex items-center justify-between">
              <span className="font-label-code text-label-code text-on-surface-variant">SISTEMA LIVE</span>
              <span className="flex items-center gap-space-xs font-label-code text-label-code text-primary">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                99.98%
              </span>
            </div>
            <div className="font-label-code text-label-code text-on-surface-variant">
              Vooxline Core v3.2 - Uptime OK
            </div>
          </div>
          <a
            className="flex items-center gap-space-md px-space-md py-space-sm rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all"
            href="#"
          >
            <span className="material-symbols-outlined text-inherit">support_agent</span>
            <span className="font-body-sm text-body-sm font-medium">Centro de Soporte B2B</span>
          </a>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/inicio');
            }}
            className="flex items-center gap-space-md px-space-md py-space-sm rounded-lg text-error hover:bg-surface-container-high transition-all"
          >
            <span className="material-symbols-outlined text-inherit">logout</span>
            <span className="font-body-sm text-body-sm font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Contenedor Principal con Margen Izquierdo de Sidebar */}
      <div className="pl-72 min-h-screen flex flex-col">
        {/* Barra Superior Fija del Dashboard */}
        <header className="fixed top-0 left-72 right-0 z-40 bg-surface-dim/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-white/5">
          <div className="h-20 w-full px-gutter flex items-center justify-between gap-space-md">
            <div className="flex items-center gap-space-lg flex-1">
              <div className="flex items-center gap-space-sm bg-surface-container px-space-md py-space-sm rounded-lg">
                <span className="material-symbols-outlined text-secondary text-sm">campaign</span>
                <div className="flex flex-col">
                  <span className="font-label-code text-label-code text-on-surface-variant uppercase">
                    Campaña Activa
                  </span>
                  <span className="font-body-sm text-body-sm font-medium text-on-surface">
                    Atención a Clientes VIP
                  </span>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant text-sm ml-space-xs">
                  expand_more
                </span>
              </div>
              <div className="hidden xl:flex items-center gap-space-sm px-space-md py-space-sm rounded-lg bg-surface-container-low border border-white/5">
                <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_16px_-2px_rgba(0,230,118,0.35)]" />
                <span className="font-label-code text-label-code text-on-surface">
                  Canal Troncal: SIP Dedicado
                </span>
                <span className="text-on-surface-variant font-label-code text-label-code">•</span>
                <span className="font-label-numeric text-label-numeric text-secondary font-semibold">
                  18ms
                </span>
              </div>
            </div>

            <div className="flex items-center gap-space-lg">
              <div className="flex items-center gap-space-xs bg-surface-container px-space-md py-space-sm rounded-lg text-on-surface-variant">
                <span className="material-symbols-outlined text-sm">calendar_today</span>
                <span className="font-label-numeric text-label-numeric text-on-surface font-medium">
                  Hoy, 28 de Septiembre
                </span>
                <span className="material-symbols-outlined text-sm ml-space-xs">arrow_drop_down</span>
              </div>
              <div className="flex items-center gap-space-md pl-space-md">
                <div className="flex flex-col text-right">
                  <span className="font-body-sm text-body-sm font-semibold text-on-surface">
                    Director de Operaciones
                  </span>
                  <span className="font-label-code text-label-code text-on-surface-variant">
                    Grupo FinTech B2B
                  </span>
                  <span className="inline-flex items-center justify-end gap-space-xs font-label-tag text-label-tag text-primary">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Monitoreo Activo
                  </span>
                </div>
                <Avatar name="Cliente B2B" />
              </div>
            </div>
          </div>
        </header>

        {/* Contenido Principal */}
        <main className="w-full pt-20 px-gutter bg-surface flex-1">
          <div className="flex flex-col w-full pb-space-xl">
            {/* Dynamic Ambient Glow Overlays */}
            <div className="relative w-full">
              <div className="absolute -top-12 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10" />
              <div className="absolute top-20 right-10 w-80 h-80 bg-secondary/10 rounded-full blur-[100px] pointer-events-none -z-10" />
              <div className="absolute top-96 left-1/3 w-[500px] h-64 bg-primary/5 rounded-full blur-[140px] pointer-events-none -z-10" />

              {/* Executive Sub-Header Bar */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md py-space-md mb-space-lg">
                <div className="flex flex-col gap-space-xs">
                  <div className="flex items-center gap-space-sm">
                    <span className="inline-flex items-center gap-space-xs px-space-sm py-space-xs rounded-full bg-surface-container-high border-0 shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                      <span className="font-label-code text-label-code text-primary uppercase tracking-wider font-semibold">
                        Telemetría B2B Activa
                      </span>
                    </span>
                    <span className="font-label-code text-label-code text-on-surface-variant font-medium">
                      Sincronización Cloud SIP Dedicada • Cluster MX-Central
                    </span>
                  </div>
                  <div className="flex items-baseline gap-space-md">
                    <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight">
                      Resumen Operativo
                    </h1>
                    <span className="font-label-numeric text-label-numeric text-secondary font-medium">
                      Auto-refresh 5s
                    </span>
                  </div>
                </div>

                {/* Quick Action Controls */}
                <div className="flex items-center gap-space-sm flex-wrap">
                  <div className="flex items-center bg-surface-container-low rounded-full p-1 shadow-sm border border-white/5">
                    <button
                      className="px-space-md py-1.5 rounded-full text-on-surface font-body-sm text-body-sm font-semibold bg-surface-container-high shadow-[0_0_16px_-2px_rgba(102,252,241,0.2)] text-secondary transition-all cursor-pointer"
                      type="button"
                    >
                      Vista Global
                    </button>
                    <button
                      className="px-space-md py-1.5 rounded-full text-on-surface-variant hover:text-on-surface font-body-sm text-body-sm font-medium transition-all cursor-pointer"
                      type="button"
                    >
                      Colas VIP
                    </button>
                    <button
                      className="px-space-md py-1.5 rounded-full text-on-surface-variant hover:text-on-surface font-body-sm text-body-sm font-medium transition-all cursor-pointer"
                      type="button"
                    >
                      Nivel Técnico
                    </button>
                  </div>
                  <button
                    onClick={handleExport}
                    className="flex items-center gap-space-xs px-space-md py-2 rounded-full bg-primary text-on-primary font-body-sm text-body-sm font-bold shadow-[0_0_24px_-2px_rgba(0,230,118,0.35)] hover:brightness-105 active:scale-95 transition-all cursor-pointer"
                    type="button"
                  >
                    <span
                      className={`material-symbols-outlined text-inherit ${isExporting ? 'animate-spin' : ''}`}
                      style={{ fontSize: '18px' }}
                    >
                      {isExporting ? 'sync' : 'cloud_download'}
                    </span>
                    <span>{isExporting ? 'Generando PDF...' : 'Exportar Informe'}</span>
                  </button>
                </div>
              </div>

              {/* 1. Top 4 Critical KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-md mb-space-xl">
                {/* Card 1: SLA */}
                <div className="relative overflow-hidden rounded-xl bg-surface-container/70 backdrop-blur-xl p-space-lg shadow-md flex flex-col justify-between group hover:bg-surface-container-high/80 transition-all duration-300 border border-white/5">
                  <div className="absolute -right-8 -top-8 w-28 h-28 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all" />
                  <div className="flex items-center justify-between mb-space-sm">
                    <div className="flex items-center gap-space-xs">
                      <span className="material-symbols-outlined text-primary text-sm">verified_user</span>
                      <span className="font-label-code text-label-code text-on-surface-variant uppercase tracking-wider">
                        Nivel de Servicio (SLA)
                      </span>
                    </div>
                    <span className="font-label-tag text-label-tag px-space-xs py-0.5 rounded-full bg-primary/10 text-primary font-bold shadow-[0_0_12px_rgba(0,230,118,0.2)]">
                      Objetivo 95%
                    </span>
                  </div>
                  <div className="flex items-baseline gap-space-sm my-space-xs">
                    <span className="font-display-hero text-display-hero font-bold tracking-tight text-secondary drop-shadow-[0_0_16px_rgba(102,252,241,0.3)]">
                      96.5%
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-space-xs">
                    <div className="flex items-center gap-1 font-label-code text-label-code text-primary font-medium">
                      <span className="material-symbols-outlined text-sm">trending_up</span>
                      <span>+1.8% vs. meta</span>
                    </div>
                    {/* Sparkline SLA */}
                    <svg className="w-20 h-6 text-primary overflow-visible" fill="none" viewBox="0 0 60 20">
                      <path
                        d="M0 16 L12 14 L24 15 L36 10 L48 11 L60 3"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                      />
                      <circle className="animate-pulse" cx={60} cy={3} fill="#75ff9e" r={2.5} />
                    </svg>
                  </div>
                </div>

                {/* Card 2: TMO */}
                <div className="relative overflow-hidden rounded-xl bg-surface-container/70 backdrop-blur-xl p-space-lg shadow-md flex flex-col justify-between group hover:bg-surface-container-high/80 transition-all duration-300 border border-white/5">
                  <div className="absolute -right-8 -top-8 w-28 h-28 bg-secondary/10 rounded-full blur-2xl group-hover:bg-secondary/20 transition-all" />
                  <div className="flex items-center justify-between mb-space-sm">
                    <div className="flex items-center gap-space-xs">
                      <span className="material-symbols-outlined text-secondary text-sm">schedule</span>
                      <span className="font-label-code text-label-code text-on-surface-variant uppercase tracking-wider">
                        TMO (Tiempo Medio)
                      </span>
                    </div>
                    <span className="font-label-tag text-label-tag px-space-xs py-0.5 rounded-full bg-secondary/10 text-secondary font-bold">
                      ≤ 03:30 min
                    </span>
                  </div>
                  <div className="flex items-baseline gap-space-sm my-space-xs">
                    <span className="font-display-hero text-display-hero font-bold tracking-tight text-on-surface">
                      03:15
                    </span>
                    <span className="font-body-md text-body-md text-on-surface-variant font-medium">min</span>
                  </div>
                  <div className="flex items-center justify-between pt-space-xs">
                    <div className="flex items-center gap-1 font-label-code text-label-code text-primary font-medium">
                      <span className="material-symbols-outlined text-sm">arrow_downward</span>
                      <span>-12s vs. ayer</span>
                    </div>
                    {/* Sparkline TMO */}
                    <svg className="w-20 h-6 text-secondary overflow-visible" fill="none" viewBox="0 0 60 20">
                      <path
                        d="M0 6 L12 8 L24 14 L36 12 L48 16 L60 17"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                      />
                      <circle cx={60} cy={17} fill="#44e2d7" r={2.5} />
                    </svg>
                  </div>
                </div>

                {/* Card 3: Tasa de Abandono */}
                <div className="relative overflow-hidden rounded-xl bg-surface-container/70 backdrop-blur-xl p-space-lg shadow-md flex flex-col justify-between group hover:bg-surface-container-high/80 transition-all duration-300 border border-white/5">
                  <div className="absolute -right-8 -top-8 w-28 h-28 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all" />
                  <div className="flex items-center justify-between mb-space-sm">
                    <div className="flex items-center gap-space-xs">
                      <span className="material-symbols-outlined text-primary text-sm">call_missed</span>
                      <span className="font-label-code text-label-code text-on-surface-variant uppercase tracking-wider">
                        Tasa de Abandono
                      </span>
                    </div>
                    <span className="font-label-tag text-label-tag px-space-xs py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant font-semibold">
                      Máx 3.0%
                    </span>
                  </div>
                  <div className="flex items-baseline gap-space-sm my-space-xs">
                    <span className="font-display-hero text-display-hero font-bold tracking-tight text-primary drop-shadow-[0_0_12px_rgba(0,230,118,0.2)]">
                      1.2%
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-space-xs">
                    <div className="flex items-center gap-1 font-label-code text-label-code text-primary font-medium">
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      <span>Control óptimo colas</span>
                    </div>
                    <div className="w-16 bg-surface-container-highest h-2 rounded-full overflow-hidden">
                      <div className="bg-primary h-full rounded-full" style={{ width: '40%' }} />
                    </div>
                  </div>
                </div>

                {/* Card 4: Satisfacción CSAT */}
                <div className="relative overflow-hidden rounded-xl bg-surface-container/70 backdrop-blur-xl p-space-lg shadow-md flex flex-col justify-between group hover:bg-surface-container-high/80 transition-all duration-300 border border-white/5">
                  <div className="absolute -right-8 -top-8 w-28 h-28 bg-secondary/10 rounded-full blur-2xl group-hover:bg-secondary/20 transition-all" />
                  <div className="flex items-center justify-between mb-space-sm">
                    <div className="flex items-center gap-space-xs">
                      <span className="material-symbols-outlined text-secondary text-sm">hotel_class</span>
                      <span className="font-label-code text-label-code text-on-surface-variant uppercase tracking-wider">
                        Satisfacción (CSAT)
                      </span>
                    </div>
                    <span className="font-label-tag text-label-tag px-space-xs py-0.5 rounded-full bg-secondary/10 text-secondary font-bold">
                      428 Muestras
                    </span>
                  </div>
                  <div className="flex items-baseline gap-space-sm my-space-xs">
                    <span className="font-display-hero text-display-hero font-bold tracking-tight text-on-surface">
                      4.8
                    </span>
                    <span className="font-body-md text-body-md text-on-surface-variant font-medium">/ 5.0</span>
                  </div>
                  <div className="flex items-center justify-between pt-space-xs">
                    <div className="flex items-center gap-0.5 text-secondary">
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                        star
                      </span>
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                        star
                      </span>
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                        star
                      </span>
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                        star
                      </span>
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                        star_half
                      </span>
                    </div>
                    <span className="font-label-code text-label-code text-on-surface-variant">97.2% Positivo</span>
                  </div>
                </div>
              </div>

              {/* 2. Central Section: High-Fidelity Call Volume Chart & Telemetry Bento */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-md mb-space-xl">
                {/* Main Chart (8 Columns) */}
                <div className="xl:col-span-8 rounded-xl bg-surface-container/70 backdrop-blur-xl p-space-lg shadow-md flex flex-col justify-between border border-white/5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm mb-space-lg pb-space-sm">
                    <div>
                      <div className="flex items-center gap-space-xs mb-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-secondary shadow-[0_0_12px_rgba(102,252,241,0.5)]" />
                        <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                          Volumen de Llamadas Entrantes vs. Atendidas
                        </h2>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        Flujo en tiempo real con granularidad horaria (Últimas 24 Horas)
                      </p>
                    </div>

                    <div className="flex items-center gap-space-md flex-wrap">
                      {/* Legend */}
                      <div className="flex items-center gap-space-md">
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full bg-secondary" />
                          <span className="font-label-code text-label-code text-on-surface-variant">Entrantes</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full bg-primary shadow-[0_0_8px_rgba(0,230,118,0.6)]" />
                          <span className="font-label-code text-label-code text-on-surface">Atendidas</span>
                        </div>
                      </div>

                      {/* Time Intervals Selector */}
                      <div className="flex items-center bg-surface-container-low rounded-lg p-1 border border-white/5">
                        {(['1h', '6h', '24h', '7d'] as const).map((interval) => (
                          <button
                            key={interval}
                            onClick={() => setTimeInterval(interval)}
                            className={`px-space-sm py-1 rounded font-label-code text-label-code transition-all cursor-pointer ${
                              timeInterval === interval
                                ? 'bg-surface-container-high text-primary font-bold shadow-sm'
                                : 'text-on-surface-variant hover:text-on-surface'
                            }`}
                            type="button"
                          >
                            {interval}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* SVG Visualizer Canvas */}
                  <div className="relative w-full h-72 sm:h-80 my-space-xs flex items-center justify-center">
                    <svg
                      className="w-full h-full overflow-visible"
                      preserveAspectRatio="none"
                      viewBox="0 0 760 260"
                    >
                      <defs>
                        {/* Gradient Area Cyan (Incoming) */}
                        <linearGradient id="cyanGrad" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#44e2d7" stopOpacity={0.25} />
                          <stop offset="90%" stopColor="#44e2d7" stopOpacity={0.0} />
                        </linearGradient>
                        {/* Gradient Area Emerald (Answered) */}
                        <linearGradient id="emeraldGrad" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#00e676" stopOpacity={0.35} />
                          <stop offset="90%" stopColor="#00e676" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>

                      {/* Horizontal Grid Lines */}
                      <line
                        opacity={0.6}
                        stroke="#343439"
                        strokeDasharray="4 4"
                        strokeWidth={1}
                        x1={40}
                        x2={750}
                        y1={30}
                        y2={30}
                      />
                      <line
                        opacity={0.6}
                        stroke="#343439"
                        strokeDasharray="4 4"
                        strokeWidth={1}
                        x1={40}
                        x2={750}
                        y1={90}
                        y2={90}
                      />
                      <line
                        opacity={0.6}
                        stroke="#343439"
                        strokeDasharray="4 4"
                        strokeWidth={1}
                        x1={40}
                        x2={750}
                        y1={150}
                        y2={150}
                      />
                      <line opacity={0.8} stroke="#343439" strokeWidth={1} x1={40} x2={750} y1={210} y2={210} />

                      {/* Y Axis Labels */}
                      <text fill="#bacbb9" fontFamily="JetBrains Mono" fontSize={11} x={5} y={34}>
                        200
                      </text>
                      <text fill="#bacbb9" fontFamily="JetBrains Mono" fontSize={11} x={5} y={94}>
                        150
                      </text>
                      <text fill="#bacbb9" fontFamily="JetBrains Mono" fontSize={11} x={5} y={154}>
                        100
                      </text>
                      <text fill="#bacbb9" fontFamily="JetBrains Mono" fontSize={11} x={12} y={214}>
                        0
                      </text>

                      {/* Area Path 1: Incoming (Cyan) */}
                      <path
                        d="M 50 195 Q 120 185, 170 145 T 290 85 T 410 40 T 530 115 T 650 90 T 745 140 L 745 210 L 50 210 Z"
                        fill="url(#cyanGrad)"
                      />
                      {/* Line Path 1: Incoming */}
                      <path
                        d="M 50 195 Q 120 185, 170 145 T 290 85 T 410 40 T 530 115 T 650 90 T 745 140"
                        fill="none"
                        opacity={0.85}
                        stroke="#44e2d7"
                        strokeLinecap="round"
                        strokeWidth={2.5}
                      />

                      {/* Area Path 2: Answered (Emerald Glow) */}
                      <path
                        d="M 50 200 Q 120 190, 170 152 T 290 92 T 410 46 T 530 120 T 650 96 T 745 145 L 745 210 L 50 210 Z"
                        fill="url(#emeraldGrad)"
                      />
                      {/* Line Path 2: Answered */}
                      <path
                        d="M 50 200 Q 120 190, 170 152 T 290 92 T 410 46 T 530 120 T 650 96 T 745 145"
                        fill="none"
                        stroke="#00e676"
                        strokeLinecap="round"
                        strokeWidth={3}
                      />

                      {/* Active Peak Data Node (11:30 Peak) */}
                      <g className="cursor-pointer group">
                        <line
                          stroke="#75ff9e"
                          strokeDasharray="3 3"
                          strokeWidth={1.5}
                          x1={410}
                          x2={410}
                          y1={40}
                          y2={210}
                        />
                        <circle cx={410} cy={40} fill="#0d0e12" r={6} stroke="#44e2d7" strokeWidth={2.5} />
                        <circle
                          cx={410}
                          cy={46}
                          fill="#75ff9e"
                          filter="drop-shadow(0 0 8px #00e676)"
                          r={6}
                          stroke="#003918"
                          strokeWidth={2.5}
                        />
                      </g>

                      {/* Real-time HUD Callout Card (Floating over chart) */}
                      <foreignObject height="90" width="200" x="345" y="55">
                        <div className="bg-surface-container-lowest/90 backdrop-blur-md p-2.5 rounded-lg shadow-xl text-left border border-white/10">
                          <div className="flex items-center justify-between font-label-code text-[11px] text-on-surface-variant border-b border-surface-container-highest pb-1">
                            <span>Pico 11:30 hrs</span>
                            <span className="text-primary font-bold">98.4% SLA</span>
                          </div>
                          <div className="mt-1 font-label-code text-[11px] flex justify-between">
                            <span className="text-secondary">Entrantes: 184</span>
                            <span className="text-primary font-semibold">Atendidas: 181</span>
                          </div>
                          <div className="font-body-sm text-[10px] text-on-surface-variant mt-0.5">
                            Espera media: 14s
                          </div>
                        </div>
                      </foreignObject>

                      {/* X Axis Timestamps */}
                      <text fill="#bacbb9" fontFamily="JetBrains Mono" fontSize={11} x={45} y={235}>
                        00:00
                      </text>
                      <text fill="#bacbb9" fontFamily="JetBrains Mono" fontSize={11} x={160} y={235}>
                        04:00
                      </text>
                      <text fill="#bacbb9" fontFamily="JetBrains Mono" fontSize={11} x={280} y={235}>
                        08:00
                      </text>
                      <text
                        fill="#75ff9e"
                        fontFamily="JetBrains Mono"
                        fontSize={11}
                        fontWeight="bold"
                        x={400}
                        y={235}
                      >
                        12:00
                      </text>
                      <text fill="#bacbb9" fontFamily="JetBrains Mono" fontSize={11} x={520} y={235}>
                        16:00
                      </text>
                      <text fill="#bacbb9" fontFamily="JetBrains Mono" fontSize={11} x={640} y={235}>
                        20:00
                      </text>
                      <text fill="#bacbb9" fontFamily="JetBrains Mono" fontSize={11} x={725} y={235}>
                        23:59
                      </text>
                    </svg>
                  </div>

                  {/* Metrics Strip below chart */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-space-sm pt-space-md mt-space-sm bg-surface-container-low/50 rounded-lg p-space-md border border-white/5">
                    <div className="flex flex-col">
                      <span className="font-label-code text-label-code text-on-surface-variant">Pico Máximo</span>
                      <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                        184 <span className="font-body-sm text-body-sm font-normal text-on-surface-variant">llamadas/h</span>
                      </span>
                      <span className="font-label-code text-label-code text-secondary">A las 11:30 hrs</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-label-code text-label-code text-on-surface-variant">Total Día Procesado</span>
                      <span className="font-headline-sm text-headline-sm font-bold text-primary">2,410</span>
                      <span className="font-label-code text-label-code text-on-surface-variant">98.8% efectividad</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-label-code text-label-code text-on-surface-variant">En Cola Activa</span>
                      <span className="font-headline-sm text-headline-sm font-bold text-secondary">4</span>
                      <span className="font-label-code text-label-code text-primary">Espera prom: 08 seg</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-label-code text-label-code text-on-surface-variant">Troncales SIP</span>
                      <span className="font-headline-sm text-headline-sm font-bold text-on-surface">16 / 32</span>
                      <span className="font-label-code text-label-code text-primary">50% Capacidad Dedicada</span>
                    </div>
                  </div>
                </div>

                {/* Infrastructure & Codec Telemetry Bento (4 Columns) */}
                <div className="xl:col-span-4 flex flex-col gap-space-md">
                  {/* System Latency Card */}
                  <div className="rounded-xl bg-surface-container/70 backdrop-blur-xl p-space-md shadow-md flex items-center justify-between border border-white/5">
                    <div className="flex items-center gap-space-md">
                      <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-primary shadow-[0_0_16px_rgba(0,230,118,0.2)]">
                        <span className="material-symbols-outlined">network_check</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-code text-label-code text-on-surface-variant">
                          LATENCIA CODEC G.711
                        </span>
                        <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                          14.2 ms <span className="font-body-sm text-body-sm text-primary font-normal">Óptimo</span>
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-label-tag text-label-tag px-space-sm py-1 rounded-full bg-primary/10 text-primary font-semibold">
                        MOS: 4.41 / 4.5
                      </span>
                    </div>
                  </div>

                  {/* Audio Listening Active Status Feedback */}
                  {listeningAgent && (
                    <div className="rounded-xl bg-secondary/10 border border-secondary/30 p-space-md backdrop-blur-xl shadow-lg flex items-center justify-between animate-fadeIn">
                      <div className="flex items-center gap-3">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary" />
                        </span>
                        <div className="flex flex-col">
                          <span className="font-body-sm text-body-sm font-bold text-on-surface">
                            Canal WebRTC Activo: {listeningAgent}
                          </span>
                          <span className="font-label-code text-[11px] text-secondary">
                            Streaming estéreo 48kHz • Jitter 1.2ms
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setListeningAgent(null)}
                        className="px-2.5 py-1 rounded-md bg-surface-container-highest hover:bg-error-container text-xs text-on-surface-variant hover:text-error transition-colors cursor-pointer"
                        type="button"
                      >
                        Desconectar
                      </button>
                    </div>
                  )}

                  {/* Pipeline Quick Health Box */}
                  <div className="rounded-xl bg-surface-container/70 backdrop-blur-xl p-space-md shadow-md border border-white/5 flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="font-label-code text-label-code text-on-surface-variant uppercase">
                        Garantía SLA B2B
                      </span>
                      <span className="text-primary font-label-code text-xs font-bold">Cumplimiento 100%</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-label-code text-on-surface-variant">
                      <span>Ruta Segura SIP Trunk</span>
                      <span className="text-secondary">TLS 1.3 / SRTP</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-label-code text-on-surface-variant">
                      <span>Cluster de Respaldo</span>
                      <span className="text-on-surface">US-East (Failover Auto)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Remote Talent Live Monitoring Table (Bottom Master Unit) */}
              <div className="rounded-xl bg-surface-container/70 backdrop-blur-xl p-space-lg shadow-md flex flex-col border border-white/5">
                {/* Table Header & Filters */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md mb-space-lg">
                  <div>
                    <div className="flex items-center gap-space-sm">
                      <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                        Monitoreo de Talento Remoto en Tiempo Real
                      </h2>
                      <span className="font-label-tag text-label-tag px-space-sm py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                        18 Agentes Asignados
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Campaña activa:{' '}
                      <strong className="text-on-surface font-semibold">Atención a Clientes VIP</strong> • Protocolo WebRTC / SIP Dedicado
                    </p>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-space-xs flex-wrap">
                    <button
                      onClick={() => setAgentFilter('todos')}
                      className={`px-space-md py-1.5 rounded-full font-label-code text-label-code font-bold transition-all cursor-pointer ${
                        agentFilter === 'todos'
                          ? 'bg-surface-container-high text-primary shadow-[0_0_16px_-2px_rgba(0,230,118,0.35)]'
                          : 'bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant'
                      }`}
                      type="button"
                    >
                      Todos (18)
                    </button>
                    <button
                      onClick={() => setAgentFilter('en-llamada')}
                      className={`px-space-md py-1.5 rounded-full font-label-code text-label-code transition-all flex items-center gap-1.5 cursor-pointer ${
                        agentFilter === 'en-llamada'
                          ? 'bg-surface-container-high text-secondary font-bold shadow-[0_0_16px_-2px_rgba(102,252,241,0.35)]'
                          : 'bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant hover:text-secondary'
                      }`}
                      type="button"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> En llamada (11)
                    </button>
                    <button
                      onClick={() => setAgentFilter('disponible')}
                      className={`px-space-md py-1.5 rounded-full font-label-code text-label-code transition-all flex items-center gap-1.5 cursor-pointer ${
                        agentFilter === 'disponible'
                          ? 'bg-surface-container-high text-primary font-bold shadow-[0_0_16px_-2px_rgba(0,230,118,0.35)]'
                          : 'bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant hover:text-primary'
                      }`}
                      type="button"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Disponible (5)
                    </button>
                    <button
                      onClick={() => setAgentFilter('pausa')}
                      className={`px-space-md py-1.5 rounded-full font-label-code text-label-code transition-all flex items-center gap-1.5 cursor-pointer ${
                        agentFilter === 'pausa'
                          ? 'bg-surface-container-high text-on-surface font-bold'
                          : 'bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                      }`}
                      type="button"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-tertiary-container" /> Pausa/ACW (2)
                    </button>
                  </div>
                </div>

                {/* Agent Worklist Table */}
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low/70">
                        <th className="py-space-sm px-space-md font-label-code text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold rounded-l-lg">
                          Agente &amp; Ubicación
                        </th>
                        <th className="py-space-sm px-space-md font-label-code text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
                          Canal / Extensión
                        </th>
                        <th className="py-space-sm px-space-md font-label-code text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
                          Estado ACD
                        </th>
                        <th className="py-space-sm px-space-md font-label-code text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
                          Tiempo en Estado
                        </th>
                        <th className="py-space-sm px-space-md font-label-code text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold text-center">
                          Llamadas Hoy
                        </th>
                        <th className="py-space-sm px-space-md font-label-code text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold text-center">
                          Calidad CSAT
                        </th>
                        <th className="py-space-sm px-space-md font-label-code text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold text-right rounded-r-lg">
                          Acción Operativa
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-0">
                      {/* Row 1: María López */}
                      <tr className="group hover:bg-surface-container-high/60 transition-colors">
                        <td className="py-space-md px-space-md">
                          <div className="flex items-center gap-space-sm">
                            <div className="w-9 h-9 rounded-full bg-primary/20 text-primary font-headline-sm text-xs font-bold flex items-center justify-center ring-1 ring-primary/40 shadow-[0_0_12px_rgba(0,230,118,0.2)]">
                              ML
                            </div>
                            <div className="flex flex-col">
                              <span className="font-body-md text-body-md font-semibold text-on-surface group-hover:text-primary transition-colors">
                                María López
                              </span>
                              <span className="font-label-code text-[11px] text-on-surface-variant">
                                Morelia, MX • Nodo Bajío
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-space-md px-space-md">
                          <div className="flex items-center gap-1.5 font-label-code text-label-code text-on-surface">
                            <span className="material-symbols-outlined text-xs text-on-surface-variant">phone_in_talk</span>
                            <span>SIP Ext 401</span>
                          </div>
                        </td>
                        <td className="py-space-md px-space-md">
                          <span className="inline-flex items-center gap-1.5 px-space-sm py-1 rounded-full bg-primary/10 text-primary font-label-tag text-label-tag font-bold shadow-[0_0_12px_rgba(0,230,118,0.25)]">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            Disponible
                          </span>
                        </td>
                        <td className="py-space-md px-space-md">
                          <span className="font-label-numeric text-label-numeric text-on-surface">04m 12s</span>
                        </td>
                        <td className="py-space-md px-space-md text-center">
                          <span className="font-label-numeric text-label-numeric font-bold text-on-surface">34</span>
                        </td>
                        <td className="py-space-md px-space-md text-center">
                          <span className="inline-flex items-center gap-1 font-label-numeric text-label-numeric text-secondary font-bold">
                            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                              star
                            </span>
                            4.95
                          </span>
                        </td>
                        <td className="py-space-md px-space-md text-right">
                          <div className="inline-flex items-center gap-space-xs">
                            <button
                              onClick={() => setListeningAgent('María López (Whisper)')}
                              className="px-space-sm py-1 rounded-md bg-surface-container-high hover:bg-surface-bright text-on-surface font-body-sm text-body-sm font-medium transition-all cursor-pointer"
                              title="Susurrar al agente"
                              type="button"
                            >
                              Whisper
                            </button>
                            <button
                              onClick={() => setListeningAgent('María López (Monitoreo)')}
                              className="px-space-sm py-1 rounded-md bg-secondary/10 hover:bg-secondary/20 text-secondary font-body-sm text-body-sm font-semibold transition-all cursor-pointer"
                              type="button"
                            >
                              Monitorear
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Row 2: Carlos Mendoza */}
                      <tr className="group hover:bg-surface-container-high/60 transition-colors">
                        <td className="py-space-md px-space-md">
                          <div className="flex items-center gap-space-sm">
                            <div className="w-9 h-9 rounded-full bg-secondary/20 text-secondary font-headline-sm text-xs font-bold flex items-center justify-center ring-1 ring-secondary/40 shadow-[0_0_12px_rgba(102,252,241,0.2)]">
                              CM
                            </div>
                            <div className="flex flex-col">
                              <span className="font-body-md text-body-md font-semibold text-on-surface group-hover:text-secondary transition-colors">
                                Carlos Mendoza
                              </span>
                              <span className="font-label-code text-[11px] text-on-surface-variant">
                                CDMX, MX • Corporativo Santa Fe
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-space-md px-space-md">
                          <div className="flex items-center gap-1.5 font-label-code text-label-code text-on-surface">
                            <span className="material-symbols-outlined text-xs text-on-surface-variant">phone_in_talk</span>
                            <span>SIP Ext 402</span>
                          </div>
                        </td>
                        <td className="py-space-md px-space-md">
                          <span className="inline-flex items-center gap-1.5 px-space-sm py-1 rounded-full bg-secondary/15 text-secondary font-label-tag text-label-tag font-bold shadow-[0_0_12px_rgba(102,252,241,0.25)]">
                            <span className="material-symbols-outlined text-xs animate-bounce">call</span>
                            En llamada
                          </span>
                        </td>
                        <td className="py-space-md px-space-md">
                          <span className="font-label-numeric text-label-numeric text-secondary font-semibold">02m 45s</span>
                        </td>
                        <td className="py-space-md px-space-md text-center">
                          <span className="font-label-numeric text-label-numeric font-bold text-on-surface">41</span>
                        </td>
                        <td className="py-space-md px-space-md text-center">
                          <span className="inline-flex items-center gap-1 font-label-numeric text-label-numeric text-secondary font-bold">
                            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                              star
                            </span>
                            4.88
                          </span>
                        </td>
                        <td className="py-space-md px-space-md text-right">
                          <button
                            onClick={() => setListeningAgent('Carlos Mendoza (Llamada VIP)')}
                            className="px-space-md py-1 rounded-md bg-secondary text-on-secondary font-body-sm text-body-sm font-semibold shadow-[0_0_16px_rgba(102,252,241,0.3)] hover:brightness-110 active:scale-95 transition-all inline-flex items-center gap-1 cursor-pointer"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-sm">headphones</span>
                            Escuchar en Vivo
                          </button>
                        </td>
                      </tr>

                      {/* Row 3: Valeria Ríos */}
                      <tr className="group hover:bg-surface-container-high/60 transition-colors">
                        <td className="py-space-md px-space-md">
                          <div className="flex items-center gap-space-sm">
                            <div className="w-9 h-9 rounded-full bg-secondary/20 text-secondary font-headline-sm text-xs font-bold flex items-center justify-center ring-1 ring-secondary/40">
                              VR
                            </div>
                            <div className="flex flex-col">
                              <span className="font-body-md text-body-md font-semibold text-on-surface group-hover:text-secondary transition-colors">
                                Valeria Ríos
                              </span>
                              <span className="font-label-code text-[11px] text-on-surface-variant">
                                Guadalajara, MX • Hub Occidente
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-space-md px-space-md">
                          <div className="flex items-center gap-1.5 font-label-code text-label-code text-on-surface">
                            <span className="material-symbols-outlined text-xs text-on-surface-variant">phone_in_talk</span>
                            <span>SIP Ext 405</span>
                          </div>
                        </td>
                        <td className="py-space-md px-space-md">
                          <span className="inline-flex items-center gap-1.5 px-space-sm py-1 rounded-full bg-secondary/15 text-secondary font-label-tag text-label-tag font-bold shadow-[0_0_12px_rgba(102,252,241,0.25)]">
                            <span className="material-symbols-outlined text-xs animate-bounce">call</span>
                            En llamada
                          </span>
                        </td>
                        <td className="py-space-md px-space-md">
                          <span className="font-label-numeric text-label-numeric text-secondary font-semibold">06m 18s</span>
                        </td>
                        <td className="py-space-md px-space-md text-center">
                          <span className="font-label-numeric text-label-numeric font-bold text-on-surface">29</span>
                        </td>
                        <td className="py-space-md px-space-md text-center">
                          <span className="inline-flex items-center gap-1 font-label-numeric text-label-numeric text-secondary font-bold">
                            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                              star
                            </span>
                            4.92
                          </span>
                        </td>
                        <td className="py-space-md px-space-md text-right">
                          <button
                            onClick={() => setListeningAgent('Valeria Ríos (Llamada VIP)')}
                            className="px-space-md py-1 rounded-md bg-secondary text-on-secondary font-body-sm text-body-sm font-semibold shadow-[0_0_16px_rgba(102,252,241,0.3)] hover:brightness-110 active:scale-95 transition-all inline-flex items-center gap-1 cursor-pointer"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-sm">headphones</span>
                            Escuchar en Vivo
                          </button>
                        </td>
                      </tr>

                      {/* Row 4: Alejandro Torres */}
                      <tr className="group hover:bg-surface-container-high/60 transition-colors">
                        <td className="py-space-md px-space-md">
                          <div className="flex items-center gap-space-sm">
                            <div className="w-9 h-9 rounded-full bg-primary/20 text-primary font-headline-sm text-xs font-bold flex items-center justify-center ring-1 ring-primary/40">
                              AT
                            </div>
                            <div className="flex flex-col">
                              <span className="font-body-md text-body-md font-semibold text-on-surface group-hover:text-primary transition-colors">
                                Alejandro Torres
                              </span>
                              <span className="font-label-code text-[11px] text-on-surface-variant">
                                Monterrey, MX • Nodo Norte
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-space-md px-space-md">
                          <div className="flex items-center gap-1.5 font-label-code text-label-code text-on-surface">
                            <span className="material-symbols-outlined text-xs text-on-surface-variant">phone_in_talk</span>
                            <span>SIP Ext 408</span>
                          </div>
                        </td>
                        <td className="py-space-md px-space-md">
                          <span className="inline-flex items-center gap-1.5 px-space-sm py-1 rounded-full bg-primary/10 text-primary font-label-tag text-label-tag font-bold shadow-[0_0_12px_rgba(0,230,118,0.25)]">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            Disponible
                          </span>
                        </td>
                        <td className="py-space-md px-space-md">
                          <span className="font-label-numeric text-label-numeric text-on-surface">01m 05s</span>
                        </td>
                        <td className="py-space-md px-space-md text-center">
                          <span className="font-label-numeric text-label-numeric font-bold text-on-surface">38</span>
                        </td>
                        <td className="py-space-md px-space-md text-center">
                          <span className="inline-flex items-center gap-1 font-label-numeric text-label-numeric text-secondary font-bold">
                            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                              star
                            </span>
                            4.80
                          </span>
                        </td>
                        <td className="py-space-md px-space-md text-right">
                          <div className="inline-flex items-center gap-space-xs">
                            <button
                              onClick={() => setListeningAgent('Alejandro Torres (Whisper)')}
                              className="px-space-sm py-1 rounded-md bg-surface-container-high hover:bg-surface-bright text-on-surface font-body-sm text-body-sm font-medium transition-all cursor-pointer"
                              type="button"
                            >
                              Whisper
                            </button>
                            <button
                              onClick={() => setListeningAgent('Alejandro Torres (Monitoreo)')}
                              className="px-space-sm py-1 rounded-md bg-secondary/10 hover:bg-secondary/20 text-secondary font-body-sm text-body-sm font-semibold transition-all cursor-pointer"
                              type="button"
                            >
                              Monitorear
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Row 5: Sofía Navarro */}
                      <tr className="group hover:bg-surface-container-high/60 transition-colors">
                        <td className="py-space-md px-space-md">
                          <div className="flex items-center gap-space-sm">
                            <div className="w-9 h-9 rounded-full bg-secondary/20 text-secondary font-headline-sm text-xs font-bold flex items-center justify-center ring-1 ring-secondary/40">
                              SN
                            </div>
                            <div className="flex flex-col">
                              <span className="font-body-md text-body-md font-semibold text-on-surface group-hover:text-secondary transition-colors">
                                Sofía Navarro
                              </span>
                              <span className="font-label-code text-[11px] text-on-surface-variant">
                                Querétaro, MX • Nodo Central
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-space-md px-space-md">
                          <div className="flex items-center gap-1.5 font-label-code text-label-code text-on-surface">
                            <span className="material-symbols-outlined text-xs text-on-surface-variant">phone_in_talk</span>
                            <span>SIP Ext 412</span>
                          </div>
                        </td>
                        <td className="py-space-md px-space-md">
                          <span className="inline-flex items-center gap-1.5 px-space-sm py-1 rounded-full bg-secondary/15 text-secondary font-label-tag text-label-tag font-bold shadow-[0_0_12px_rgba(102,252,241,0.25)]">
                            <span className="material-symbols-outlined text-xs animate-bounce">call</span>
                            En llamada
                          </span>
                        </td>
                        <td className="py-space-md px-space-md">
                          <span className="font-label-numeric text-label-numeric text-secondary font-semibold">01m 30s</span>
                        </td>
                        <td className="py-space-md px-space-md text-center">
                          <span className="font-label-numeric text-label-numeric font-bold text-on-surface">36</span>
                        </td>
                        <td className="py-space-md px-space-md text-center">
                          <span className="inline-flex items-center gap-1 font-label-numeric text-label-numeric text-secondary font-bold">
                            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                              star
                            </span>
                            4.85
                          </span>
                        </td>
                        <td className="py-space-md px-space-md text-right">
                          <button
                            onClick={() => setListeningAgent('Sofía Navarro (Llamada VIP)')}
                            className="px-space-md py-1 rounded-md bg-secondary text-on-secondary font-body-sm text-body-sm font-semibold shadow-[0_0_16px_rgba(102,252,241,0.3)] hover:brightness-110 active:scale-95 transition-all inline-flex items-center gap-1 cursor-pointer"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-sm">headphones</span>
                            Escuchar en Vivo
                          </button>
                        </td>
                      </tr>

                      {/* Row 6: David Morales */}
                      <tr className="group hover:bg-surface-container-high/60 transition-colors">
                        <td className="py-space-md px-space-md">
                          <div className="flex items-center gap-space-sm">
                            <div className="w-9 h-9 rounded-full bg-surface-container-highest text-on-surface-variant font-headline-sm text-xs font-bold flex items-center justify-center">
                              DM
                            </div>
                            <div className="flex flex-col">
                              <span className="font-body-md text-body-md font-semibold text-on-surface group-hover:text-on-surface transition-colors">
                                David Morales
                              </span>
                              <span className="font-label-code text-[11px] text-on-surface-variant">
                                Puebla, MX • Angelópolis
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-space-md px-space-md">
                          <div className="flex items-center gap-1.5 font-label-code text-label-code text-on-surface">
                            <span className="material-symbols-outlined text-xs text-on-surface-variant">phone_in_talk</span>
                            <span>SIP Ext 415</span>
                          </div>
                        </td>
                        <td className="py-space-md px-space-md">
                          <span className="inline-flex items-center gap-1.5 px-space-sm py-1 rounded-full bg-surface-container-highest text-on-surface-variant font-label-tag text-label-tag font-semibold">
                            <span className="w-2 h-2 rounded-full bg-outline" />
                            Pausa (ACW)
                          </span>
                        </td>
                        <td className="py-space-md px-space-md">
                          <span className="font-label-numeric text-label-numeric text-on-surface-variant">00m 52s</span>
                        </td>
                        <td className="py-space-md px-space-md text-center">
                          <span className="font-label-numeric text-label-numeric font-bold text-on-surface">31</span>
                        </td>
                        <td className="py-space-md px-space-md text-center">
                          <span className="inline-flex items-center gap-1 font-label-numeric text-label-numeric text-on-surface-variant font-bold">
                            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                              star
                            </span>
                            4.79
                          </span>
                        </td>
                        <td className="py-space-md px-space-md text-right">
                          <button
                            className="px-space-md py-1 rounded-md bg-surface-container-high hover:bg-surface-bright text-on-surface-variant hover:text-on-surface font-body-sm text-body-sm font-medium transition-all inline-flex items-center gap-1 cursor-pointer"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-sm">history</span>
                            Ver Registro
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Table Footer Telemetry */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-space-sm pt-space-lg mt-space-md bg-surface-container-low/40 rounded-lg px-space-md py-space-sm border border-white/5">
                  <div className="flex items-center gap-space-sm">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="font-label-code text-label-code text-on-surface-variant">
                      Sincronización WebRTC en caliente:{' '}
                      <strong className="text-on-surface">0 paquetes perdidos</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-space-md">
                    <span className="font-label-code text-label-code text-on-surface-variant">
                      Mostrando 6 de 18 agentes asignados
                    </span>
                    <button
                      className="px-space-md py-1 rounded-md bg-surface-container-high hover:bg-surface-bright text-secondary font-label-code text-label-code font-bold transition-all cursor-pointer"
                      type="button"
                    >
                      Ver Plantilla Completa (18) →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
        <Link to="/cliente" className="text-secondary hover:text-white font-bold hover:underline">
          /cliente
        </Link>
        <span className="text-white/20">|</span>
        <Link to="/agente" className="text-on-surface-variant hover:text-white">
          /agente
        </Link>
      </div>
    </div>
  );
};

export default ClientDashboardPage;
