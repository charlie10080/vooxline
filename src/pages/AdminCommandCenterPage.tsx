import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAdminContext } from '@/layouts/adminContext';

interface TimeOffItem {
  id: string;
  name: string;
  typeEs: string;
  typeEn: string;
  typeColor: string;
  campaign: string;
  requestedAgoEs: string;
  requestedAgoEn: string;
  avatar: string;
  hoursEs: string;
  hoursEn: string;
  datesEs: string;
  datesEn: string;
  reasonEs: string;
  reasonEn: string;
  balanceEs: string;
  balanceEn: string;
  balanceIcon: string;
  isMedical?: boolean;
}

export const AdminCommandCenterPage: React.FC = () => {
  // 1. Sistema Bilingüe (Inglés / Español) proveniente del AdminLayout
  const adminContext = useAdminContext();
  const [localLang] = useState<'es' | 'en'>('es');
  const lang = adminContext?.lang || localLang;

  // 2. Cronómetros dinámicos para agentes en llamada (ej: inicia en 05:17 y avanza dinámicamente)
  const [mariaTime, setMariaTime] = useState<number>(317); // 05:17 -> 05:18
  const [carlosTime] = useState<number>(105); // 01:45
  const [valeriaTime] = useState<number>(728); // 12:08
  const [alejandroTime, setAlejandroTime] = useState<number>(242); // 04:02

  useEffect(() => {
    const interval = setInterval(() => {
      // Incrementar automáticamente cronómetros de agentes que están 'En Llamada'
      setMariaTime((prev) => prev + 1);
      setAlejandroTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatSeconds = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 3. Estado del Motor de Aprobación de Nómina
  const [approvedPayments, setApprovedPayments] = useState<Record<string, boolean>>({
    'VX-8812': true, // Valeria Ríos ya aprobada por defecto
    'VX-7734': true, // Sofía Navarro ya aprobada por defecto
  });

  const handleApprovePayment = (id: string) => {
    setApprovedPayments((prev) => ({
      ...prev,
      [id]: true,
    }));
  };

  const handleApproveAll = () => {
    setApprovedPayments({
      'VX-9921': true,
      'VX-8812': true,
      'VX-4109': true,
      'VX-7734': true,
    });
  };

  // 4. Gestión de Permisos (Time Off) con transición de salida
  const [timeOffList, setTimeOffList] = useState<TimeOffItem[]>([
    {
      id: 'alejandra',
      name: 'Alejandra Moreno',
      typeEs: 'Vacaciones PTO',
      typeEn: 'PTO Vacation',
      typeColor: 'text-secondary',
      campaign: 'Fidelis Manager',
      requestedAgoEs: 'Solicitado hace 3h',
      requestedAgoEn: 'Requested 3h ago',
      avatar:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCSLwy9wHR5oLLswlB1RHIMt_PodeMAGKE-NN4L4csUIFGFDe_yOrACn__rpwOi0jOSDq0w_ZMKZXy84e_gGaZGMUEd1bTxHeNC3vdXeCsWs2ZgnYRVhsBOGPA0iifoh9yjwiFtVlsxzqxAEusfsdA_FogodrpnrmpgkUtdGY7M0yYNzyEzUjuP8S7MrSUUdutGHIFsJqIA0Y6zvM78Z_EWZqCeSbCV0KLiNW5CqofS5i3iVp_1eKI',
      hoursEs: '24 Horas',
      hoursEn: '24 Hours',
      datesEs: '04 Octubre - 07 Octubre 2024',
      datesEn: 'Oct 04 - Oct 07, 2024',
      reasonEs: '“Viaje familiar programado anual. Horas cubiertas previamente con soporte extendido.”',
      reasonEn: '“Annual family trip scheduled. Hours covered beforehand with extended support.”',
      balanceEs: '6 días PTO disponibles de saldo',
      balanceEn: '6 days PTO balance available',
      balanceIcon: 'account_balance',
    },
    {
      id: 'david',
      name: 'David Morales',
      typeEs: 'Permiso Médico',
      typeEn: 'Medical Leave',
      typeColor: 'text-error',
      campaign: 'National Assemblers',
      requestedAgoEs: 'Solicitado hace 1h',
      requestedAgoEn: 'Requested 1h ago',
      avatar:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDonmzzHjPmHRBRorZPnhpKrar_ngyMMJHjOGi8b7gpKKlfhSx2O2nwepoY8dtIQwBHbDVMhUZgg-bWcqA6mr-NgHZk3oUPD_w2ULo4_3SWtsxNM7Ynw2lwrZsj0CqzhoBF5sifHYPbO3WzzkbTHyJ950nAg3p7HUpYm1V8khO0FxQoeuYZCnP43A3LldKABFz9Atmtj9-_HvPK5_pBMPXl_ANWwvkYgwdmJQGPkln7k10mPSap5tA',
      hoursEs: '4 Horas',
      hoursEn: '4 Hours',
      datesEs: 'Mañana, 28 Sep (09:00 - 13:00)',
      datesEn: 'Tomorrow, Sep 28 (09:00 - 13:00)',
      reasonEs: '“Cita con especialista clínico IMSS. Adjunto comprobante médico y citatorio formal.”',
      reasonEn: '“Appointment with clinical specialist IMSS. Medical proof and official summons attached.”',
      balanceEs: 'Constancia_IMSS_Sep28.pdf',
      balanceEn: 'Medical_Proof_Sep28.pdf',
      balanceIcon: 'attachment',
      isMedical: true,
    },
  ]);

  const [dismissingIds, setDismissingIds] = useState<Record<string, 'approved' | 'rejected'>>({});

  const handleTimeOffAction = (id: string, action: 'approved' | 'rejected') => {
    setDismissingIds((prev) => ({ ...prev, [id]: action }));
    setTimeout(() => {
      setTimeOffList((prev) => prev.filter((item) => item.id !== id));
      setDismissingIds((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    }, 450);
  };

  return (
    <>
      {/* Layout de Dashboard Principal (Gestionado por AdminLayout) */}
      <main className="w-full pt-24 px-gutter min-h-screen bg-[#0B0C10]">
          <div className="flex flex-col w-full gap-space-lg pb-space-xl">
            {/* Top Command Bar / Metric Sub-header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md bg-surface-container-low/70 backdrop-blur-xl p-space-md rounded-xl shadow-[0_12px_32px_-4px_rgba(0,0,0,0.6)]">
              <div className="flex items-center gap-space-md">
                <div className="w-11 h-11 rounded-lg bg-surface-container-high flex items-center justify-center shadow-[0_0_20px_rgba(102,252,241,0.2)]">
                  <span className="material-symbols-outlined text-secondary text-[24px]">hub</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-space-xs">
                    <span className="font-headline-sm text-headline-sm text-on-surface">
                      {lang === 'es'
                        ? 'Consola Maestra de Fuerza Laboral'
                        : 'Workforce Master Console'}
                    </span>
                    <span className="px-space-xs py-0.5 rounded-full bg-primary-container/20 text-primary font-label-code text-label-code uppercase tracking-wider">
                      v4.8 Live
                    </span>
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    {lang === 'es'
                      ? 'Supervisión en tiempo real de asistencia, dispersión nómina, nodos IP y SLA por cliente.'
                      : 'Real-time supervision of attendance, payroll dispersion, IP nodes, and client SLAs.'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-space-sm flex-wrap">
                <div className="flex items-center gap-space-xs px-space-md py-space-xs rounded-full bg-surface-container-high">
                  <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                  <span className="font-label-code text-label-code text-primary">
                    {lang === 'es' ? 'Sincronización WebRTC 1.2s' : 'WebRTC Sync 1.2s'}
                  </span>
                </div>
                <button
                  className="flex items-center gap-space-xs px-space-md py-space-sm rounded-full bg-surface-container-high hover:bg-surface-variant text-on-surface font-label-tag text-label-tag transition-all cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[16px]">tune</span>
                  {lang === 'es' ? 'Configuración Umbrales' : 'Threshold Settings'}
                </button>
                <button
                  className="flex items-center gap-space-xs px-space-md py-space-sm rounded-full bg-primary-container hover:brightness-110 text-on-primary-container font-label-tag text-label-tag font-bold shadow-[0_0_20px_rgba(0,230,118,0.35)] transition-all cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                  {lang === 'es' ? 'Cerrar Ciclo Nómina' : 'Close Payroll Cycle'}
                </button>
              </div>
            </div>

            {/* ROW 1: CRITICAL OPERATIONAL HEALTH KPIS */}
            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-md">
              {/* Card 1: Atención Requerida */}
              <div className="relative overflow-hidden bg-surface-container-low/80 backdrop-blur-xl p-space-md rounded-xl shadow-[0_12px_32px_-4px_rgba(0,0,0,0.6)] flex flex-col justify-between group hover:bg-surface-container-high/60 transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-space-sm">
                    <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-error shadow-[0_0_16px_rgba(255,180,171,0.25)]">
                      <span className="material-symbols-outlined text-[22px]">warning</span>
                    </div>
                    <div>
                      <span className="font-label-code text-label-code uppercase tracking-wider text-on-surface-variant">
                        {lang === 'es' ? 'Atención Requerida' : 'Action Required'}
                      </span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="px-space-xs py-0.5 rounded-full bg-error-container text-on-error-container font-label-tag text-label-tag">
                          {lang === 'es' ? 'Auditoría Bloqueante' : 'Blocking Audit'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant opacity-40">
                    flag
                  </span>
                </div>
                <div className="my-space-md">
                  <div className="font-headline-sm text-headline-sm font-bold text-on-surface">
                    {lang === 'es' ? '2 Hojas de tiempo' : '2 Timesheets'}
                  </div>
                  <p className="font-body-sm text-body-sm text-error mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">pending_actions</span>
                    {lang === 'es' ? 'Pendientes de aprobación manual' : 'Pending manual approval'}
                  </p>
                </div>
                <div className="pt-space-xs flex items-center justify-between text-on-surface-variant">
                  <span className="font-label-code text-label-code">
                    {lang === 'es' ? 'Límite corte: Hoy 23:59 CST' : 'Cutoff limit: Today 23:59 CST'}
                  </span>
                  <button
                    className="text-secondary font-label-tag text-label-tag flex items-center gap-0.5 hover:underline cursor-pointer"
                    type="button"
                  >
                    {lang === 'es' ? 'Revisar' : 'Review'}{' '}
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </button>
                </div>
              </div>

              {/* Card 2: Costo Laboral Real */}
              <div className="relative overflow-hidden bg-surface-container-low/80 backdrop-blur-xl p-space-md rounded-xl shadow-[0_12px_32px_-4px_rgba(0,0,0,0.6)] flex flex-col justify-between group hover:bg-surface-container-high/60 transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-space-sm">
                    <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-secondary shadow-[0_0_16px_rgba(68,226,215,0.25)]">
                      <span className="material-symbols-outlined text-[22px]">
                        account_balance_wallet
                      </span>
                    </div>
                    <div>
                      <span className="font-label-code text-label-code uppercase tracking-wider text-on-surface-variant">
                        {lang === 'es' ? 'Costo Laboral Real' : 'Actual Labor Cost'}
                      </span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="px-space-xs py-0.5 rounded-full bg-secondary-container/20 text-secondary font-label-tag text-label-tag">
                          +7.1% {lang === 'es' ? 'vs Programado' : 'vs Scheduled'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant opacity-40">
                    trending_up
                  </span>
                </div>
                <div className="my-space-md">
                  <div className="flex items-baseline gap-2">
                    <span className="font-headline-sm text-headline-sm font-bold text-on-surface font-label-numeric">
                      $6,117.79
                    </span>
                    <span className="font-label-code text-label-code text-on-surface-variant">
                      {lang === 'es' ? 'USD Real' : 'Real USD'}
                    </span>
                  </div>
                  <div className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                    {lang === 'es' ? 'Programado:' : 'Scheduled:'}{' '}
                    <span className="text-on-surface font-label-numeric">$5,709.75 USD</span>
                  </div>
                </div>
                <div>
                  <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden flex">
                    <div className="bg-secondary h-full rounded-l-full" style={{ width: '78%' }} />
                    <div className="bg-primary h-full rounded-r-full" style={{ width: '22%' }} />
                  </div>
                  <div className="flex justify-between font-label-code text-label-code text-on-surface-variant mt-1.5">
                    <span>{lang === 'es' ? 'Base 92.9%' : 'Base 92.9%'}</span>
                    <span className="text-primary font-medium">
                      {lang === 'es' ? 'Extra autorizada 7.1%' : 'Authorized OT 7.1%'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 3: Alertas de Asistencia */}
              <div className="relative overflow-hidden bg-surface-container-low/80 backdrop-blur-xl p-space-md rounded-xl shadow-[0_12px_32px_-4px_rgba(0,0,0,0.6)] flex flex-col justify-between group hover:bg-surface-container-high/60 transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-space-sm">
                    <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-error shadow-[0_0_16px_rgba(255,180,171,0.25)]">
                      <span className="material-symbols-outlined text-[22px]">alarm_on</span>
                    </div>
                    <div>
                      <span className="font-label-code text-label-code uppercase tracking-wider text-on-surface-variant">
                        {lang === 'es' ? 'Alertas Asistencia' : 'Attendance Alerts'}
                      </span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="px-space-xs py-0.5 rounded-full bg-surface-container-highest text-error font-label-tag text-label-tag">
                          {lang === 'es' ? '3 Incidentes Hoy' : '3 Incidents Today'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant opacity-40">
                    nest_clock_farsight_analog
                  </span>
                </div>
                <div className="my-space-md">
                  <div className="font-headline-sm text-headline-sm font-bold text-on-surface">
                    {lang === 'es' ? '3 Salidas Tardías' : '3 Late Clock-Outs'}
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                    {lang === 'es'
                      ? '2 olvidos marcaje • 1 turno extendido sin prepago'
                      : '2 missed clock-outs • 1 extended shift without prepaid'}
                  </p>
                </div>
                <div className="pt-space-xs flex items-center justify-between text-on-surface-variant">
                  <span className="font-label-code text-label-code flex items-center gap-1 text-on-surface-variant">
                    <span className="w-1.5 h-1.5 rounded-full bg-error" />{' '}
                    {lang === 'es' ? 'SLA Asistencia 96.8%' : 'Attendance SLA 96.8%'}
                  </span>
                  <button className="text-primary font-label-tag text-label-tag hover:underline cursor-pointer" type="button">
                    {lang === 'es' ? 'Resolver Todo' : 'Resolve All'}
                  </button>
                </div>
              </div>

              {/* Card 4: Conexiones en Vivo */}
              <div className="relative overflow-hidden bg-surface-container-low/80 backdrop-blur-xl p-space-md rounded-xl shadow-[0_12px_32px_-4px_rgba(0,0,0,0.6)] flex flex-col justify-between group hover:bg-surface-container-high/60 transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-space-sm">
                    <div className="relative w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary shadow-[0_0_20px_rgba(117,255,158,0.35)]">
                      <span className="material-symbols-outlined text-[22px]">cell_tower</span>
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary animate-ping" />
                    </div>
                    <div>
                      <span className="font-label-code text-label-code uppercase tracking-wider text-on-surface-variant">
                        {lang === 'es' ? 'Conexiones en Vivo' : 'Live Connections'}
                      </span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="px-space-xs py-0.5 rounded-full bg-primary/10 text-primary font-label-tag text-label-tag">
                          {lang === 'es' ? 'Sincronizado' : 'Synchronized'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-secondary text-[20px]">sensors</span>
                </div>
                <div className="my-space-md">
                  <div className="flex items-baseline gap-2">
                    <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                      {lang === 'es' ? '18 Agentes' : '18 Agents'}
                    </span>
                    <span className="font-label-tag text-label-tag text-primary">
                      {lang === 'es' ? '100% Verificados' : '100% Verified'}
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                    {lang === 'es'
                      ? '14 en llamada activa • 4 en disponibilidad SIP'
                      : '14 active in call • 4 in SIP ready state'}
                  </p>
                </div>
                <div className="pt-space-xs flex items-center justify-between text-on-surface-variant">
                  <div className="flex items-center gap-1 font-label-code text-label-code text-secondary">
                    <span className="material-symbols-outlined text-[14px]">format_image_left</span>{' '}
                    {lang === 'es' ? 'Geocerca perimetral OK' : 'Perimeter Geofence OK'}
                  </div>
                  <span className="font-label-code text-label-code text-on-surface-variant">
                    {lang === 'es' ? '0 Desconectados' : '0 Disconnected'}
                  </span>
                </div>
              </div>
            </section>

            {/* ROW 2: MONITOREO DE OPERACIONES EN TIEMPO REAL (LIVE OPS STREAM - FULL WIDTH) */}
            <section className="w-full bg-surface-container-low/80 backdrop-blur-xl p-space-lg rounded-xl border border-white/10 shadow-[0_12px_32px_-4px_rgba(0,0,0,0.6)] flex flex-col gap-space-md">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm border-b border-white/5 pb-space-sm">
                <div className="flex flex-col">
                  <div className="flex items-center gap-space-sm">
                    <div className="w-9 h-9 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary shadow-[0_0_16px_rgba(0,230,118,0.25)]">
                      <span className="material-symbols-outlined text-[20px]">support_agent</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-space-xs">
                        <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                          {lang === 'es'
                            ? 'Monitoreo de Operaciones en Tiempo Real'
                            : 'Real-Time Operations Monitoring'}
                        </h2>
                        <span className="flex items-center gap-1 px-space-xs py-0.5 rounded-full bg-primary-container/20 text-primary font-label-code text-label-code uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                          {lang === 'es' ? 'Streaming WebRTC SIP Activo' : 'Active WebRTC SIP Streaming'}
                        </span>
                      </div>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        {lang === 'es'
                          ? 'Supervisión activa de audio, coaching silencioso (Whisper) e intervención directa en llamadas.'
                          : 'Active audio supervision, silent whisper coaching, and direct call barge-in.'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-space-xs flex-wrap">
                  <div className="px-space-md py-1 rounded-full bg-surface-container-high text-on-surface-variant font-label-code text-label-code">
                    <span className="text-primary font-bold">
                      {lang === 'es' ? '18 Conectados' : '18 Connected'}
                    </span>{' '}
                    • {lang === 'es' ? '14 en llamada' : '14 on call'} • {lang === 'es' ? '3 disponibles' : '3 ready'} •{' '}
                    {lang === 'es' ? '1 en pausa' : '1 on break'}
                  </div>
                  <div className="flex items-center gap-1 p-1 bg-surface-container rounded-lg">
                    <button className="px-space-sm py-1 rounded bg-surface-container-high text-primary font-label-tag text-label-tag cursor-pointer" type="button">
                      {lang === 'es' ? 'Todos (18)' : 'All (18)'}
                    </button>
                    <button className="px-space-sm py-1 rounded text-on-surface-variant hover:text-on-surface font-label-tag text-label-tag transition-colors cursor-pointer" type="button">
                      {lang === 'es' ? 'En Llamada (14)' : 'On Call (14)'}
                    </button>
                    <button className="px-space-sm py-1 rounded text-on-surface-variant hover:text-on-surface font-label-tag text-label-tag transition-colors cursor-pointer" type="button">
                      {lang === 'es' ? 'Disponibles (3)' : 'Available (3)'}
                    </button>
                    <button className="px-space-sm py-1 rounded text-on-surface-variant hover:text-on-surface font-label-tag text-label-tag transition-colors cursor-pointer" type="button">
                      {lang === 'es' ? 'En Pausa (1)' : 'On Break (1)'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Live Agents Stream Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left font-body-sm text-body-sm">
                  <thead>
                    <tr className="bg-surface-container-high/40 text-on-surface-variant font-label-code text-label-code uppercase tracking-wider">
                      <th className="py-space-sm px-space-sm rounded-l-lg">
                        {lang === 'es' ? 'Agente & Nivel' : 'Agent & Tier'}
                      </th>
                      <th className="py-space-sm px-space-sm">
                        {lang === 'es' ? 'Campaña Asignada' : 'Assigned Campaign'}
                      </th>
                      <th className="py-space-sm px-space-sm">
                        {lang === 'es' ? 'Troncal SIP / Latencia' : 'SIP Trunk / Latency'}
                      </th>
                      <th className="py-space-sm px-space-sm">
                        {lang === 'es' ? 'Estado Actual' : 'Current Status'}
                      </th>
                      <th className="py-space-sm px-space-sm text-center">
                        {lang === 'es' ? 'Tiempo Estado' : 'Status Time'}
                      </th>
                      <th className="py-space-sm px-space-sm text-center">
                        {lang === 'es' ? 'Calidad QA / Sentimiento' : 'QA Quality / Sentiment'}
                      </th>
                      <th className="py-space-sm px-space-sm text-right rounded-r-lg">
                        {lang === 'es' ? 'Acciones' : 'Actions'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-high/40 text-on-surface">
                    {/* Agente 1: María López (En Llamada VIP - Contador Dinámico) */}
                    <tr className="hover:bg-surface-container-high/40 transition-colors group">
                      <td className="py-space-sm px-space-sm">
                        <div className="flex items-center gap-space-sm">
                          <img
                            className="w-9 h-9 rounded-full object-cover shadow-[0_0_8px_rgba(0,0,0,0.5)]"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCvPHa2-jP_RD3Rw4IZarjza8VKRGTSWHQ2JAf6K4SLDQwrws4qpvLS_GJV43z2ZST7YJDUJ20BhPHgnfwiog9mxbXJ7a9zBe_fN01OFyA8TlFkX1dFseb0pf0I9Y7FWjY7oQp6vO0xs-p9qMPpO4KLEuzHu1kKdLtFSBtgfK55Qhe2BPzsDcP-qbttY-IJf8YX1_b9Rhe5GD-czukEgEx0zRbBaTs5_WEY44gof8TIId1lTndygSQ"
                            alt="María López"
                          />
                          <div className="flex flex-col">
                            <span className="font-semibold text-on-surface group-hover:text-primary transition-colors">
                              María López
                            </span>
                            <span className="font-label-code text-label-code text-on-surface-variant">
                              Nivel 2 Bilingüe • SIP-104
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-space-sm px-space-sm">
                        <span className="px-space-xs py-0.5 rounded bg-surface-container-high text-on-surface font-label-tag text-label-tag">
                          National Assemblers
                        </span>
                      </td>
                      <td className="py-space-sm px-space-sm">
                        <div className="flex items-center gap-1 font-label-code text-label-code text-secondary">
                          <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                          <span>WebRTC Trunk-01</span>
                          <span className="text-on-surface-variant">(18ms)</span>
                        </div>
                      </td>
                      <td className="py-space-sm px-space-sm">
                        <span className="inline-flex items-center gap-1.5 px-space-xs py-0.5 rounded-full bg-error-container/30 text-error font-label-code text-label-code font-semibold border border-error/30">
                          <span className="w-2 h-2 rounded-full bg-error animate-ping" />
                          En Llamada VIP
                        </span>
                      </td>
                      <td className="py-space-sm px-space-sm text-center font-label-numeric text-label-numeric font-bold text-on-surface">
                        {formatSeconds(mariaTime)}
                      </td>
                      <td className="py-space-sm px-space-sm text-center">
                        <div className="inline-flex items-center gap-1 px-space-xs py-0.5 rounded bg-primary/10 text-primary font-label-code text-label-code font-semibold">
                          <span className="material-symbols-outlined text-[14px]">graphic_eq</span>
                          98% Score • Óptimo
                        </div>
                      </td>
                      <td className="py-space-sm px-space-sm text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-high hover:bg-surface-variant text-secondary font-label-tag text-label-tag transition-all shadow-[0_0_8px_rgba(68,226,215,0.2)] cursor-pointer"
                            title="Escuchar llamada en vivo"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[15px]">headphones</span>
                            <span>Escuchar</span>
                          </button>
                          <button
                            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-high hover:bg-surface-variant text-primary font-label-tag text-label-tag transition-all shadow-[0_0_8px_rgba(117,255,158,0.2)] cursor-pointer"
                            title="Coaching privado (Whisper)"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[15px]">mic</span>
                            <span>Whisper</span>
                          </button>
                          <button
                            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-error-container/40 hover:bg-error-container text-error font-label-tag text-label-tag transition-all cursor-pointer"
                            title="Intervenir llamada (Barge-In)"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[15px]">call_merge</span>
                            <span>Intervenir</span>
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Agente 2: Carlos Mendoza */}
                    <tr className="hover:bg-surface-container-high/40 transition-colors group">
                      <td className="py-space-sm px-space-sm">
                        <div className="flex items-center gap-space-sm">
                          <img
                            className="w-9 h-9 rounded-full object-cover shadow-[0_0_8px_rgba(0,0,0,0.5)]"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuD2ldRREhZv-AFDC2Nh4xCF_JXRRDhTefX5fg4gN9KOdwMJwpMk6tqBM3PsilE-_IB8qUheC49bRccKX8BXC3sEQUSXEvIdS9kT20dG6D5duy8IP01cziguDAXFRaRKrISusZUGJ7jouAY6qtpM6RO16uDNtGjvXU45pRhR80CQbocZEQGc-aZoxkrjKdwHhDMErBux2y7mq3zvv25zNg3byhgRZ85Jq-LOY5-gyVsrvOfN5Y5-VaM"
                            alt="Carlos Mendoza"
                          />
                          <div className="flex flex-col">
                            <span className="font-semibold text-on-surface group-hover:text-primary transition-colors">
                              Carlos Mendoza
                            </span>
                            <span className="font-label-code text-label-code text-on-surface-variant">
                              Senior QA • SIP-112
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-space-sm px-space-sm">
                        <span className="px-space-xs py-0.5 rounded bg-surface-container-high text-on-surface font-label-tag text-label-tag">
                          Fidelis Manager
                        </span>
                      </td>
                      <td className="py-space-sm px-space-sm">
                        <div className="flex items-center gap-1 font-label-code text-label-code text-secondary">
                          <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                          <span>WebRTC Trunk-02</span>
                          <span className="text-on-surface-variant">(22ms)</span>
                        </div>
                      </td>
                      <td className="py-space-sm px-space-sm">
                        <span className="inline-flex items-center gap-1.5 px-space-xs py-0.5 rounded-full bg-primary-container/20 text-primary font-label-code text-label-code font-semibold border border-primary/30">
                          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                          Disponible
                        </span>
                      </td>
                      <td className="py-space-sm px-space-sm text-center font-label-numeric text-label-numeric font-bold text-primary">
                        {formatSeconds(carlosTime)}
                      </td>
                      <td className="py-space-sm px-space-sm text-center">
                        <div className="inline-flex items-center gap-1 px-space-xs py-0.5 rounded bg-surface-container-high text-on-surface-variant font-label-code text-label-code">
                          <span className="material-symbols-outlined text-[14px]">check</span>
                          En espera ACD
                        </div>
                      </td>
                      <td className="py-space-sm px-space-sm text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-high hover:bg-surface-variant text-on-surface-variant font-label-tag text-label-tag transition-all cursor-pointer"
                            title="Forzar pausa"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[15px]">pause_circle</span>
                            <span>Forzar Pausa</span>
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Agente 3: Valeria Ríos (En Llamada - Contador Dinámico) */}
                    <tr className="hover:bg-surface-container-high/40 transition-colors group">
                      <td className="py-space-sm px-space-sm">
                        <div className="flex items-center gap-space-sm">
                          <img
                            className="w-9 h-9 rounded-full object-cover shadow-[0_0_8px_rgba(0,0,0,0.5)]"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAdlFAXQMK5SNFENukgDoQxHAyj4a3Sx0iTQdCrJOt2cOZs7zR92HucqlmkcW_hEv3gefVeDR-HqeCSoM6MMavp_kr9uzeEoLK2D1jPXCipU8Ymc7W__o5AQqQzpSKBskAHs8ha5QMI_kVAXvH6PNiWXVjrlMYku72vHZMOsBqIx5MK5I4bsWWqgDivxAuf-gvP9epqdiJ-QIy5YAEoGnNdT7SRbKCbiM9mtR44TeAAL7d64ZkreuE"
                            alt="Valeria Ríos"
                          />
                          <div className="flex flex-col">
                            <span className="font-semibold text-on-surface group-hover:text-primary transition-colors">
                              Valeria Ríos
                            </span>
                            <span className="font-label-code text-label-code text-on-surface-variant">
                              Team Lead • SIP-108
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-space-sm px-space-sm">
                        <span className="px-space-xs py-0.5 rounded bg-surface-container-high text-on-surface font-label-tag text-label-tag">
                          VOG Firma Legal
                        </span>
                      </td>
                      <td className="py-space-sm px-space-sm">
                        <div className="flex items-center gap-1 font-label-code text-label-code text-secondary">
                          <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                          <span>WebRTC Trunk-01</span>
                          <span className="text-on-surface-variant">(15ms)</span>
                        </div>
                      </td>
                      <td className="py-space-sm px-space-sm">
                        <span className="inline-flex items-center gap-1.5 px-space-xs py-0.5 rounded-full bg-error-container/30 text-error font-label-code text-label-code font-semibold border border-error/30">
                          <span className="w-2 h-2 rounded-full bg-error animate-ping" />
                          En Llamada
                        </span>
                      </td>
                      <td className="py-space-sm px-space-sm text-center font-label-numeric text-label-numeric font-bold text-on-surface">
                        {formatSeconds(valeriaTime)}
                      </td>
                      <td className="py-space-sm px-space-sm text-center">
                        <div className="inline-flex items-center gap-1 px-space-xs py-0.5 rounded bg-primary/10 text-primary font-label-code text-label-code font-semibold">
                          <span className="material-symbols-outlined text-[14px]">graphic_eq</span>
                          95% Score • Audio Claro
                        </div>
                      </td>
                      <td className="py-space-sm px-space-sm text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-high hover:bg-surface-variant text-secondary font-label-tag text-label-tag transition-all shadow-[0_0_8px_rgba(68,226,215,0.2)] cursor-pointer"
                            title="Escuchar llamada en vivo"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[15px]">headphones</span>
                            <span>Escuchar</span>
                          </button>
                          <button
                            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-high hover:bg-surface-variant text-primary font-label-tag text-label-tag transition-all shadow-[0_0_8px_rgba(117,255,158,0.2)] cursor-pointer"
                            title="Coaching privado (Whisper)"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[15px]">mic</span>
                            <span>Whisper</span>
                          </button>
                          <button
                            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-error-container/40 hover:bg-error-container text-error font-label-tag text-label-tag transition-all cursor-pointer"
                            title="Intervenir llamada (Barge-In)"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[15px]">call_merge</span>
                            <span>Intervenir</span>
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Agente 4: Alejandro Torres */}
                    <tr className="hover:bg-surface-container-high/40 transition-colors group">
                      <td className="py-space-sm px-space-sm">
                        <div className="flex items-center gap-space-sm">
                          <img
                            className="w-9 h-9 rounded-full object-cover shadow-[0_0_8px_rgba(0,0,0,0.5)]"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCG-AyqRNjmDl5fMEXPwAKIFTpf4zyFUVAtZHTAX8y8kt4_IF1lane1JxrNbVzjHLQelG3AODYV4t89_6WF_WKdD2_R9sNxTcPgfCx6lMGhDGpOtz1YuSUJBv36Zq6m1ikwTE6sPmjs4UgNo_8qXdQD0zZPaTow2cGlhckWIt6Va9XgmauaRlCVvZAX1rnPe_ATZqyONZKnxKwFlx5A3bvK_86D-M8vCKR885wU9JUVsKemciTIJrU"
                            alt="Alejandro Torres"
                          />
                          <div className="flex flex-col">
                            <span className="font-semibold text-on-surface group-hover:text-primary transition-colors">
                              Alejandro Torres
                            </span>
                            <span className="font-label-code text-label-code text-on-surface-variant">
                              Soporte FinTech • SIP-115
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-space-sm px-space-sm">
                        <span className="px-space-xs py-0.5 rounded bg-surface-container-high text-on-surface font-label-tag text-label-tag">
                          FinTech Enterprise
                        </span>
                      </td>
                      <td className="py-space-sm px-space-sm">
                        <div className="flex items-center gap-1 font-label-code text-label-code text-secondary">
                          <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                          <span>WebRTC Trunk-03</span>
                          <span className="text-on-surface-variant">(19ms)</span>
                        </div>
                      </td>
                      <td className="py-space-sm px-space-sm">
                        <span className="inline-flex items-center gap-1.5 px-space-xs py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant font-label-code text-label-code font-semibold border border-white/10">
                          <span className="w-2 h-2 rounded-full bg-outline" />
                          Pausa / Break
                        </span>
                      </td>
                      <td className="py-space-sm px-space-sm text-center font-label-numeric text-label-numeric font-bold text-on-surface-variant">
                        {formatSeconds(alejandroTime)}
                      </td>
                      <td className="py-space-sm px-space-sm text-center">
                        <div className="inline-flex items-center gap-1 px-space-xs py-0.5 rounded bg-surface-container-high text-on-surface-variant font-label-code text-label-code">
                          <span className="material-symbols-outlined text-[14px]">coffee</span>
                          Descanso Programado
                        </div>
                      </td>
                      <td className="py-space-sm px-space-sm text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-container/20 hover:bg-primary-container hover:text-on-primary-container text-primary font-label-tag text-label-tag transition-all cursor-pointer"
                            title="Reanudar agente a disponible"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[15px]">play_arrow</span>
                            <span>Reanudar</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* ROW 2: MOTOR DE APROBACIÓN Y ASISTENCIA (7 cols) + RENTABILIDAD POR CAMPAÑA (5 cols) */}
            <section className="grid grid-cols-1 xl:grid-cols-12 gap-space-md">
              {/* LEFT: Timesheets Engine (7 cols) */}
              <div className="xl:col-span-7 bg-surface-container-low/80 backdrop-blur-xl p-space-lg rounded-xl shadow-[0_12px_32px_-4px_rgba(0,0,0,0.6)] flex flex-col justify-between">
                <div>
                  {/* Table Header and Filter Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm mb-space-md pb-space-sm">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-space-sm">
                        <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                          {lang === 'es'
                            ? 'Motor de Aprobación y Asistencia'
                            : 'Approval & Attendance Engine'}
                        </h2>
                        <span className="px-space-xs py-0.5 rounded-full bg-surface-container-high text-secondary font-label-tag text-label-tag">
                          {lang === 'es' ? 'Corte Semanal Activo' : 'Active Weekly Cutoff'}
                        </span>
                      </div>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        {lang === 'es'
                          ? 'Registro granular de eventos de marcaje, tiempos efectivos y cálculo de desviaciones horarias.'
                          : 'Granular logging of punch events, effective times, and schedule variance calculation.'}
                      </span>
                    </div>

                    {/* Quick Filters */}
                    <div className="flex items-center gap-1 p-1 bg-surface-container rounded-lg self-start sm:self-auto">
                      <button className="px-space-sm py-1 rounded bg-surface-container-high text-primary font-label-tag text-label-tag cursor-pointer" type="button">
                        {lang === 'es' ? 'Todas (5)' : 'All (5)'}
                      </button>
                      <button className="px-space-sm py-1 rounded text-on-surface-variant hover:text-on-surface font-label-tag text-label-tag transition-colors cursor-pointer" type="button">
                        {lang === 'es' ? 'Pendientes (2)' : 'Pending (2)'}
                      </button>
                      <button className="px-space-sm py-1 rounded text-on-surface-variant hover:text-on-surface font-label-tag text-label-tag transition-colors cursor-pointer" type="button">
                        {lang === 'es' ? 'Aprobadas (3)' : 'Approved (3)'}
                      </button>
                    </div>
                  </div>

                  {/* Timesheet Worklist Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-body-sm text-body-sm">
                      <thead>
                        <tr className="bg-surface-container-high/40 text-on-surface-variant font-label-code text-label-code uppercase tracking-wider">
                          <th className="py-space-sm px-space-sm rounded-l-lg">
                            {lang === 'es' ? 'Agente' : 'Agent'}
                          </th>
                          <th className="py-space-sm px-space-sm">
                            {lang === 'es' ? 'Campaña' : 'Campaign'}
                          </th>
                          <th className="py-space-sm px-space-sm">
                            {lang === 'es' ? 'Entrada' : 'In'}
                          </th>
                          <th className="py-space-sm px-space-sm">
                            {lang === 'es' ? 'Salida' : 'Out'}
                          </th>
                          <th className="py-space-sm px-space-sm text-right">
                            {lang === 'es' ? 'Horas' : 'Hours'}
                          </th>
                          <th className="py-space-sm px-space-sm text-center">
                            {lang === 'es' ? 'Dif. Turno' : 'Shift Diff'}
                          </th>
                          <th className="py-space-sm px-space-sm">
                            {lang === 'es' ? 'Auditoría / Notas' : 'Audit / Notes'}
                          </th>
                          <th className="py-space-sm px-space-sm text-center rounded-r-lg">
                            {lang === 'es' ? 'Acción' : 'Action'}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-container-high/40 text-on-surface">
                        {/* Row 1: María López */}
                        <tr className="hover:bg-surface-container-high/40 transition-colors group">
                          <td className="py-space-sm px-space-sm">
                            <div className="flex items-center gap-space-sm">
                              <img
                                className="w-9 h-9 rounded-full object-cover shadow-[0_0_8px_rgba(0,0,0,0.5)]"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCvPHa2-jP_RD3Rw4IZarjza8VKRGTSWHQ2JAf6K4SLDQwrws4qpvLS_GJV43z2ZST7YJDUJ20BhPHgnfwiog9mxbXJ7a9zBe_fN01OFyA8TlFkX1dFseb0pf0I9Y7FWjY7oQp6vO0xs-p9qMPpO4KLEuzHu1kKdLtFSBtgfK55Qhe2BPzsDcP-qbttY-IJf8YX1_b9Rhe5GD-czukEgEx0zRbBaTs5_WEY44gof8TIId1lTndygSQ"
                                alt="María López"
                              />
                              <div className="flex flex-col">
                                <span className="font-semibold text-on-surface group-hover:text-primary transition-colors">
                                  María López
                                </span>
                                <span className="font-label-code text-label-code text-on-surface-variant">
                                  ID: VX-9921
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-space-sm px-space-sm">
                            <span className="px-space-xs py-0.5 rounded bg-surface-container-high text-on-surface font-label-tag text-label-tag">
                              National Assemblers
                            </span>
                          </td>
                          <td className="py-space-sm px-space-sm font-label-numeric text-label-numeric">08:02 AM</td>
                          <td className="py-space-sm px-space-sm font-label-numeric text-label-numeric">05:14 PM</td>
                          <td className="py-space-sm px-space-sm font-label-numeric text-label-numeric text-right font-semibold">
                            08h 12m
                          </td>
                          <td className="py-space-sm px-space-sm text-center">
                            <span className="inline-flex items-center gap-0.5 px-space-xs py-0.5 rounded-full bg-primary/10 text-primary font-label-code text-label-code font-semibold">
                              +00:12
                            </span>
                          </td>
                          <td className="py-space-sm px-space-sm">
                            <span className="px-space-xs py-0.5 rounded bg-surface-container-high/80 text-on-surface-variant font-label-code text-label-code">
                              Asistencia puntual
                            </span>
                          </td>
                          <td className="py-space-sm px-space-sm text-center">
                            {approvedPayments['VX-9921'] ? (
                              <button
                                disabled
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary font-label-tag text-label-tag font-semibold cursor-default opacity-90 transition-all"
                                type="button"
                              >
                                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                <span>{lang === 'es' ? 'Aprobado' : 'Approved'}</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleApprovePayment('VX-9921')}
                                className="px-space-sm py-1 rounded-full bg-primary-container hover:brightness-110 text-on-primary-container font-label-tag text-label-tag font-bold shadow-[0_0_12px_rgba(0,230,118,0.3)] transition-all cursor-pointer"
                                type="button"
                              >
                                {lang === 'es' ? 'Aprobar Pago' : 'Approve Payment'}
                              </button>
                            )}
                          </td>
                        </tr>

                        {/* Row 2: Carlos Mendoza (Exception: Missing clock out) */}
                        <tr className="hover:bg-surface-container-high/40 transition-colors group bg-error-container/5">
                          <td className="py-space-sm px-space-sm">
                            <div className="flex items-center gap-space-sm">
                              <img
                                className="w-9 h-9 rounded-full object-cover shadow-[0_0_8px_rgba(0,0,0,0.5)]"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD2ldRREhZv-AFDC2Nh4xCF_JXRRDhTefX5fg4gN9KOdwMJwpMk6tqBM3PsilE-_IB8qUheC49bRccKX8BXC3sEQUSXEvIdS9kT20dG6D5duy8IP01cziguDAXFRaRKrISusZUGJ7jouAY6qtpM6RO16uDNtGjvXU45pRhR80CQbocZEQGc-aZoxkrjKdwHhDMErBux2y7mq3zvv25zNg3byhgRZ85Jq-LOY5-gyVsrvOfN5Y5-VaM"
                                alt="Carlos Mendoza"
                              />
                              <div className="flex flex-col">
                                <span className="font-semibold text-on-surface group-hover:text-primary transition-colors">
                                  Carlos Mendoza
                                </span>
                                <span className="font-label-code text-label-code text-error">
                                  {lang === 'es' ? 'Revisión Requerida' : 'Review Required'}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-space-sm px-space-sm">
                            <span className="px-space-xs py-0.5 rounded bg-surface-container-high text-on-surface font-label-tag text-label-tag">
                              Fidelis Manager
                            </span>
                          </td>
                          <td className="py-space-sm px-space-sm font-label-numeric text-label-numeric">09:00 AM</td>
                          <td className="py-space-sm px-space-sm font-label-numeric text-label-numeric text-error font-medium">
                            {lang === 'es' ? 'En turno...' : 'On shift...'}
                          </td>
                          <td className="py-space-sm px-space-sm font-label-numeric text-label-numeric text-right font-semibold">
                            06h 45m
                          </td>
                          <td className="py-space-sm px-space-sm text-center">
                            <span className="inline-flex items-center gap-0.5 px-space-xs py-0.5 rounded-full bg-error-container/40 text-error font-label-code text-label-code font-semibold">
                              <span className="material-symbols-outlined text-[12px]">schedule</span>-03:58
                            </span>
                          </td>
                          <td className="py-space-sm px-space-sm">
                            <span className="px-space-xs py-0.5 rounded bg-error-container/30 text-error font-label-code text-label-code">
                              {lang === 'es' ? 'Olvidó marcar salida' : 'Forgot clock out'}
                            </span>
                          </td>
                          <td className="py-space-sm px-space-sm text-center">
                            <button
                              disabled={!!approvedPayments['VX-MENDOZA']}
                              onClick={() => handleApprovePayment('VX-MENDOZA')}
                              className={`px-space-sm py-1 rounded-full font-label-tag text-label-tag transition-all ${
                                approvedPayments['VX-MENDOZA']
                                  ? 'bg-primary/15 border border-primary/30 text-primary font-semibold cursor-default opacity-90 inline-flex items-center gap-1'
                                  : 'bg-surface-container-high hover:bg-error-container text-on-surface hover:text-on-error-container cursor-pointer'
                              }`}
                              type="button"
                            >
                              {approvedPayments['VX-MENDOZA'] ? (
                                <>
                                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                  <span>{lang === 'es' ? 'Aprobado' : 'Approved'}</span>
                                </>
                              ) : (
                                <span>{lang === 'es' ? 'Ajustar' : 'Adjust'}</span>
                              )}
                            </button>
                          </td>
                        </tr>

                        {/* Row 3: Valeria Ríos */}
                        <tr className="hover:bg-surface-container-high/40 transition-colors group">
                          <td className="py-space-sm px-space-sm">
                            <div className="flex items-center gap-space-sm">
                              <img
                                className="w-9 h-9 rounded-full object-cover shadow-[0_0_8px_rgba(0,0,0,0.5)]"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAdlFAXQMK5SNFENukgDoQxHAyj4a3Sx0iTQdCrJOt2cOZs7zR92HucqlmkcW_hEv3gefVeDR-HqeCSoM6MMavp_kr9uzeEoLK2D1jPXCipU8Ymc7W__o5AQqQzpSKBskAHs8ha5QMI_kVAXvH6PNiWXVjrlMYku72vHZMOsBqIx5MK5I4bsWWqgDivxAuf-gvP9epqdiJ-QIy5YAEoGnNdT7SRbKCbiM9mtR44TeAAL7d64ZkreuE"
                                alt="Valeria Ríos"
                              />
                              <div className="flex flex-col">
                                <span className="font-semibold text-on-surface group-hover:text-primary transition-colors">
                                  Valeria Ríos
                                </span>
                                <span className="font-label-code text-label-code text-on-surface-variant">
                                  ID: VX-8812
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-space-sm px-space-sm">
                            <span className="px-space-xs py-0.5 rounded bg-surface-container-high text-on-surface font-label-tag text-label-tag">
                              VOG Firma Legal
                            </span>
                          </td>
                          <td className="py-space-sm px-space-sm font-label-numeric text-label-numeric">07:58 AM</td>
                          <td className="py-space-sm px-space-sm font-label-numeric text-label-numeric">04:02 PM</td>
                          <td className="py-space-sm px-space-sm font-label-numeric text-label-numeric text-right font-semibold">
                            08h 04m
                          </td>
                          <td className="py-space-sm px-space-sm text-center">
                            <span className="inline-flex items-center gap-0.5 px-space-xs py-0.5 rounded-full bg-primary/10 text-primary font-label-code text-label-code font-semibold">
                              +00:04
                            </span>
                          </td>
                          <td className="py-space-sm px-space-sm">
                            <span className="px-space-xs py-0.5 rounded bg-surface-container-high/80 text-on-surface-variant font-label-code text-label-code">
                              {lang === 'es' ? 'Turno regular' : 'Regular shift'}
                            </span>
                          </td>
                          <td className="py-space-sm px-space-sm text-center">
                            <button
                              disabled
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary font-label-tag text-label-tag font-semibold cursor-default opacity-90 transition-all"
                              type="button"
                            >
                              <span className="material-symbols-outlined text-[16px]">check_circle</span>
                              <span>{lang === 'es' ? 'Aprobado' : 'Approved'}</span>
                            </button>
                          </td>
                        </tr>

                        {/* Row 4: Alejandro Torres */}
                        <tr className="hover:bg-surface-container-high/40 transition-colors group">
                          <td className="py-space-sm px-space-sm">
                            <div className="flex items-center gap-space-sm">
                              <img
                                className="w-9 h-9 rounded-full object-cover shadow-[0_0_8px_rgba(0,0,0,0.5)]"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCG-AyqRNjmDl5fMEXPwAKIFTpf4zyFUVAtZHTAX8y8kt4_IF1lane1JxrNbVzjHLQelG3AODYV4t89_6WF_WKdD2_R9sNxTcPgfCx6lMGhDGpOtz1YuSUJBv36Zq6m1ikwTE6sPmjs4UgNo_8qXdQD0zZPaTow2cGlhckWIt6Va9XgmauaRlCVvZAX1rnPe_ATZqyONZKnxKwFlx5A3bvK_86D-M8vCKR885wU9JUVsKemciTIJrU"
                                alt="Alejandro Torres"
                              />
                              <div className="flex flex-col">
                                <span className="font-semibold text-on-surface group-hover:text-primary transition-colors">
                                  Alejandro Torres
                                </span>
                                <span className="font-label-code text-label-code text-on-surface-variant">
                                  ID: VX-4109
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-space-sm px-space-sm">
                            <span className="px-space-xs py-0.5 rounded bg-surface-container-high text-on-surface font-label-tag text-label-tag">
                              FinTech Enterprise
                            </span>
                          </td>
                          <td className="py-space-sm px-space-sm font-label-numeric text-label-numeric">10:00 AM</td>
                          <td className="py-space-sm px-space-sm font-label-numeric text-label-numeric">02:04 PM</td>
                          <td className="py-space-sm px-space-sm font-label-numeric text-label-numeric text-right font-semibold">
                            04h 04m
                          </td>
                          <td className="py-space-sm px-space-sm text-center">
                            <span className="inline-flex items-center gap-0.5 px-space-xs py-0.5 rounded-full bg-secondary-container/20 text-secondary font-label-code text-label-code font-semibold">
                              +00:04
                            </span>
                          </td>
                          <td className="py-space-sm px-space-sm">
                            <span className="px-space-xs py-0.5 rounded bg-surface-container-high/80 text-on-surface-variant font-label-code text-label-code">
                              No lunch break
                            </span>
                          </td>
                          <td className="py-space-sm px-space-sm text-center">
                            {approvedPayments['VX-4109'] ? (
                              <button
                                disabled
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary font-label-tag text-label-tag font-semibold cursor-default opacity-90 transition-all"
                                type="button"
                              >
                                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                <span>{lang === 'es' ? 'Aprobado' : 'Approved'}</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleApprovePayment('VX-4109')}
                                className="px-space-sm py-1 rounded-full bg-primary-container hover:brightness-110 text-on-primary-container font-label-tag text-label-tag font-bold shadow-[0_0_12px_rgba(0,230,118,0.3)] transition-all cursor-pointer"
                                type="button"
                              >
                                {lang === 'es' ? 'Aprobar Pago' : 'Approve Payment'}
                              </button>
                            )}
                          </td>
                        </tr>

                        {/* Row 5: Sofía Navarro */}
                        <tr className="hover:bg-surface-container-high/40 transition-colors group">
                          <td className="py-space-sm px-space-sm">
                            <div className="flex items-center gap-space-sm">
                              <img
                                className="w-9 h-9 rounded-full object-cover shadow-[0_0_8px_rgba(0,0,0,0.5)]"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCjUaBswwP4UJUZ4l_dKh-mcHXOseTxTFzRn6YzmENjH0mfHxkUrhZ26qNu71hB3WPA56OfYKeqYQlZjLvgeiCfrWxwfFl4Vi-_3MsHEjkRxGJf1qNepOZ1huu3N452xnSmzPGHwyaWCpZ4HR43trFAh_nXgt3HhGwSP8gQ9lPetWllC86GkFu6cGjIz8Ttwjx-pJBkjBne57rx9fC-BOnSCMwyrMaA-iUimPqgEdzq3qbATg_-eUg"
                                alt="Sofía Navarro"
                              />
                              <div className="flex flex-col">
                                <span className="font-semibold text-on-surface group-hover:text-primary transition-colors">
                                  Sofía Navarro
                                </span>
                                <span className="font-label-code text-label-code text-on-surface-variant">
                                  ID: VX-7734
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-space-sm px-space-sm">
                            <span className="px-space-xs py-0.5 rounded bg-surface-container-high text-on-surface font-label-tag text-label-tag">
                              National Assemblers
                            </span>
                          </td>
                          <td className="py-space-sm px-space-sm font-label-numeric text-label-numeric">08:00 AM</td>
                          <td className="py-space-sm px-space-sm font-label-numeric text-label-numeric">05:00 PM</td>
                          <td className="py-space-sm px-space-sm font-label-numeric text-label-numeric text-right font-semibold">
                            09h 00m
                          </td>
                          <td className="py-space-sm px-space-sm text-center">
                            <span className="inline-flex items-center gap-0.5 px-space-xs py-0.5 rounded-full bg-surface-container-high text-on-surface font-label-code text-label-code">
                              00:00
                            </span>
                          </td>
                          <td className="py-space-sm px-space-sm">
                            <span className="px-space-xs py-0.5 rounded bg-surface-container-high/80 text-on-surface-variant font-label-code text-label-code">
                              {lang === 'es' ? 'Conforme estándar' : 'Standard compliant'}
                            </span>
                          </td>
                          <td className="py-space-sm px-space-sm text-center">
                            <button
                              disabled
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary font-label-tag text-label-tag font-semibold cursor-default opacity-90 transition-all"
                              type="button"
                            >
                              <span className="material-symbols-outlined text-[16px]">check_circle</span>
                              <span>{lang === 'es' ? 'Aprobado' : 'Approved'}</span>
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Bottom action strip */}
                <div className="mt-space-md pt-space-sm flex items-center justify-between flex-wrap gap-space-sm bg-surface-container/40 p-space-sm rounded-lg border border-white/5">
                  <div className="flex items-center gap-space-sm font-label-code text-label-code text-on-surface-variant">
                    <span className="material-symbols-outlined text-secondary text-[16px]">info</span>
                    <span>
                      {lang === 'es'
                        ? 'Regla de negocio: Desviaciones mayores a 15 min requieren confirmación del supervisor directo.'
                        : 'Business rule: Deviations greater than 15 min require direct supervisor confirmation.'}
                    </span>
                  </div>
                  <div className="flex items-center gap-space-xs">
                    <button
                      className="px-space-md py-1.5 rounded-full bg-surface-container-high hover:bg-surface-variant text-on-surface font-label-tag text-label-tag transition-all cursor-pointer border border-white/5"
                      type="button"
                    >
                      {lang === 'es' ? 'Exportar Registro Nómina' : 'Export Payroll Record'}
                    </button>
                    <button
                      onClick={handleApproveAll}
                      className="px-space-md py-1.5 rounded-full bg-primary-container text-on-primary-container font-label-tag text-label-tag font-bold shadow-[0_0_16px_rgba(0,230,118,0.3)] hover:brightness-110 transition-all cursor-pointer"
                      type="button"
                    >
                      {approvedPayments['VX-9921'] && approvedPayments['VX-4109']
                        ? (lang === 'es' ? 'Lote Completo Aprobado' : 'Full Batch Approved')
                        : (lang === 'es' ? 'Aprobar Lote (2)' : 'Approve Batch (2)')}
                    </button>
                  </div>
                </div>
              </div>

              {/* RIGHT: Rentabilidad por Campaña - Job Insights (5 cols) */}
              <div className="xl:col-span-5 bg-surface-container-low/80 backdrop-blur-xl p-space-lg rounded-xl shadow-[0_12px_32px_-4px_rgba(0,0,0,0.6)] flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-space-md pb-space-sm">
                    <div>
                      <div className="flex items-center gap-space-xs">
                        <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                          {lang === 'es' ? 'Rentabilidad por Campaña' : 'Campaign Profitability'}
                        </h2>
                        <span className="w-2 h-2 rounded-full bg-secondary" />
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        {lang === 'es'
                          ? 'Gasto de Talento & Horas Facturables (Ciclo Semanal W39)'
                          : 'Talent Spend & Billable Hours (Weekly Cycle W39)'}
                      </p>
                    </div>
                    <span className="px-space-xs py-0.5 rounded bg-surface-container-high text-secondary font-label-code text-label-code">
                      {lang === 'es' ? 'Margen Prom: 69.5%' : 'Avg Margin: 69.5%'}
                    </span>
                  </div>

                  {/* Campaign Profitability Cards */}
                  <div className="space-y-space-md">
                    {/* Campaign 1 */}
                    <div className="p-space-md rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors">
                      <div className="flex items-center justify-between mb-space-xs">
                        <div className="flex items-center gap-space-xs">
                          <span className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(117,255,158,0.6)]" />
                          <span className="font-body-md text-body-md font-semibold text-on-surface">
                            National Assemblers Inc
                          </span>
                        </div>
                        <span className="font-label-numeric text-label-numeric font-bold text-primary">
                          68.4% MARGEN
                        </span>
                      </div>
                      <div className="flex items-center justify-between font-label-code text-label-code text-on-surface-variant mb-space-xs">
                        <span>1,087 hrs acumuladas</span>
                        <span className="text-on-surface font-label-numeric font-semibold">
                          $6,117.79 USD facturados
                        </span>
                      </div>
                      <div className="w-full bg-surface-container-lowest h-2 rounded-full overflow-hidden">
                        <div className="bg-primary h-full rounded-full" style={{ width: '68.4%' }} />
                      </div>
                    </div>

                    {/* Campaign 2 */}
                    <div className="p-space-md rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors">
                      <div className="flex items-center justify-between mb-space-xs">
                        <div className="flex items-center gap-space-xs">
                          <span className="w-2.5 h-2.5 rounded-full bg-secondary shadow-[0_0_8px_rgba(68,226,215,0.6)]" />
                          <span className="font-body-md text-body-md font-semibold text-on-surface">
                            Fidelis Manager
                          </span>
                        </div>
                        <span className="font-label-numeric text-label-numeric font-bold text-secondary">
                          71.2% MARGEN
                        </span>
                      </div>
                      <div className="flex items-center justify-between font-label-code text-label-code text-on-surface-variant mb-space-xs">
                        <span>640 hrs acumuladas</span>
                        <span className="text-on-surface font-label-numeric font-semibold">
                          $3,520.00 USD facturados
                        </span>
                      </div>
                      <div className="w-full bg-surface-container-lowest h-2 rounded-full overflow-hidden">
                        <div className="bg-secondary h-full rounded-full" style={{ width: '71.2%' }} />
                      </div>
                    </div>

                    {/* Campaign 3 */}
                    <div className="p-space-md rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors">
                      <div className="flex items-center justify-between mb-space-xs">
                        <div className="flex items-center gap-space-xs">
                          <span className="w-2.5 h-2.5 rounded-full bg-tertiary shadow-[0_0_8px_rgba(220,229,244,0.4)]" />
                          <span className="font-body-md text-body-md font-semibold text-on-surface">
                            VOG Firma Legal
                          </span>
                        </div>
                        <span className="font-label-numeric text-label-numeric font-bold text-tertiary">
                          64.5% MARGEN
                        </span>
                      </div>
                      <div className="flex items-center justify-between font-label-code text-label-code text-on-surface-variant mb-space-xs">
                        <span>412 hrs acumuladas</span>
                        <span className="text-on-surface font-label-numeric font-semibold">
                          $2,266.00 USD facturados
                        </span>
                      </div>
                      <div className="w-full bg-surface-container-lowest h-2 rounded-full overflow-hidden">
                        <div className="bg-tertiary h-full rounded-full" style={{ width: '64.5%' }} />
                      </div>
                    </div>

                    {/* Campaign 4 */}
                    <div className="p-space-md rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors">
                      <div className="flex items-center justify-between mb-space-xs">
                        <div className="flex items-center gap-space-xs">
                          <span className="w-2.5 h-2.5 rounded-full bg-primary-fixed shadow-[0_0_8px_rgba(98,255,150,0.6)]" />
                          <span className="font-body-md text-body-md font-semibold text-on-surface">
                            FinTech Enterprise Support
                          </span>
                        </div>
                        <span className="font-label-numeric text-label-numeric font-bold text-primary-fixed">
                          74.0% MARGEN
                        </span>
                      </div>
                      <div className="flex items-center justify-between font-label-code text-label-code text-on-surface-variant mb-space-xs">
                        <span>320 hrs acumuladas</span>
                        <span className="text-on-surface font-label-numeric font-semibold">
                          $1,920.00 USD facturados
                        </span>
                      </div>
                      <div className="w-full bg-surface-container-lowest h-2 rounded-full overflow-hidden">
                        <div className="bg-primary-fixed h-full rounded-full" style={{ width: '74%' }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial Snapshot Summary Footer */}
                <div className="mt-space-md p-space-md rounded-xl bg-surface-container-highest/60 flex items-center justify-between shadow-inner">
                  <div>
                    <span className="font-label-code text-label-code uppercase tracking-wider text-on-surface-variant">
                      Total Horas Semanales
                    </span>
                    <div className="font-headline-sm text-headline-sm font-bold text-on-surface font-label-numeric">
                      2,459h
                    </div>
                  </div>
                  <div className="h-8 w-px bg-surface-variant" />
                  <div className="text-right">
                    <span className="font-label-code text-label-code uppercase tracking-wider text-on-surface-variant">
                      Inversión Total Nómina
                    </span>
                    <div className="font-headline-sm text-headline-sm font-bold text-secondary font-label-numeric">
                      $13,823.79 USD
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ROW 3: TELEMETRÍA Y GEOLOCALIZACIÓN (7 cols) + GESTIÓN DE PERMISOS TIME-OFF (5 cols) */}
            <section className="grid grid-cols-1 xl:grid-cols-12 gap-space-md">
              {/* LEFT: Tactical Telemetry & Radar (7 cols) */}
              <div className="xl:col-span-7 bg-surface-container-low/80 backdrop-blur-xl p-space-lg rounded-xl shadow-[0_12px_32px_-4px_rgba(0,0,0,0.6)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-space-md pb-space-sm">
                    <div>
                      <div className="flex items-center gap-space-xs">
                        <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                          {lang === 'es'
                            ? 'Telemetría de Nodos & Geolocalización Activa'
                            : 'Node Telemetry & Active Geolocation'}
                        </h2>
                        <span className="px-space-xs py-0.5 rounded-full bg-primary-container/20 text-primary font-label-code text-label-code">
                          {lang === 'es' ? '6 Hubs Activos' : '6 Active Hubs'}
                        </span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        {lang === 'es'
                          ? 'Supervisión en vivo de IPs asignadas, geocercas biométricas y telemetría de red VoIP.'
                          : 'Live monitoring of assigned IPs, biometric geofences, and VoIP network telemetry.'}
                      </p>
                    </div>
                    <div className="flex items-center gap-space-xs text-secondary font-label-code text-label-code">
                      <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
                      <span>{lang === 'es' ? 'Mesh Activo' : 'Active Mesh'}</span>
                    </div>
                  </div>

                  {/* Stylized Dark Tactical Map SVG */}
                  <div className="relative w-full h-64 bg-surface-container-lowest rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
                    <svg
                      className="w-full h-full text-outline-variant"
                      fill="none"
                      viewBox="0 0 650 260"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <defs>
                        <pattern
                          id="grid-matrix"
                          width="24"
                          height="24"
                          patternUnits="userSpaceOnUse"
                        >
                          <path
                            d="M 24 0 L 0 0 0 24"
                            fill="none"
                            stroke="currentColor"
                            strokeOpacity={0.3}
                            strokeWidth={0.3}
                          />
                        </pattern>
                        <linearGradient id="stream-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#00e676" stopOpacity={0.8} />
                          <stop offset="50%" stopColor="#44e2d7" stopOpacity={0.6} />
                          <stop offset="100%" stopColor="#75ff9e" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>

                      {/* Background Grid */}
                      <rect width="100%" height="100%" fill="url(#grid-matrix)" />

                      {/* Mexico Stylized Contour Polyline */}
                      <path
                        d="M 60,60 L 110,80 L 160,110 L 220,135 L 290,145 L 340,150 L 380,180 L 430,190 L 490,175 L 530,210 L 590,205"
                        opacity={0.4}
                        stroke="currentColor"
                        strokeDasharray="3 3"
                        strokeWidth={1.2}
                      />
                      <path
                        d="M 120,40 L 180,60 L 250,90 L 320,110 L 390,120 L 450,140 L 510,140"
                        opacity={0.3}
                        stroke="currentColor"
                        strokeDasharray="2 4"
                        strokeWidth={0.8}
                      />

                      {/* Interconnection Vector Mesh */}
                      <line
                        x1="380"
                        y1="70"
                        x2="350"
                        y2="160"
                        stroke="url(#stream-gradient)"
                        strokeDasharray="4 2"
                        strokeWidth={1.5}
                      />
                      <line
                        x1="260"
                        y1="140"
                        x2="310"
                        y2="155"
                        stroke="url(#stream-gradient)"
                        strokeWidth={2}
                      />
                      <line
                        x1="310"
                        y1="155"
                        x2="350"
                        y2="160"
                        stroke="#00e676"
                        strokeWidth={2.5}
                      />
                      <line
                        x1="350"
                        y1="160"
                        x2="335"
                        y2="135"
                        stroke="url(#stream-gradient)"
                        strokeWidth={1.5}
                      />
                      <line
                        x1="350"
                        y1="160"
                        x2="390"
                        y2="170"
                        stroke="url(#stream-gradient)"
                        strokeWidth={1.5}
                      />

                      {/* Tactical Nodes with Radar Halos */}
                      {/* Monterrey */}
                      <circle cx="380" cy="70" r="14" fill="#44e2d7" fillOpacity={0.1} />
                      <circle cx="380" cy="70" r="4" fill="#44e2d7" />
                      <text x="392" y="74" fill="#bacbb9" fontFamily="JetBrains Mono" fontSize={10}>
                        MONTERREY [4]
                      </text>

                      {/* Guadalajara */}
                      <circle cx="260" cy="140" r="16" fill="#44e2d7" fillOpacity={0.1} />
                      <circle cx="260" cy="140" r="4" fill="#44e2d7" />
                      <text x="180" y="144" fill="#bacbb9" fontFamily="JetBrains Mono" fontSize={10}>
                        GUADALAJARA [3]
                      </text>

                      {/* Querétaro */}
                      <circle cx="335" cy="135" r="12" fill="#75ff9e" fillOpacity={0.1} />
                      <circle cx="335" cy="135" r="3.5" fill="#75ff9e" />
                      <text x="345" y="132" fill="#bacbb9" fontFamily="JetBrains Mono" fontSize={10}>
                        QRO [2]
                      </text>

                      {/* Morelia (Primary Focus Hub) */}
                      <circle cx="310" cy="155" r="22" fill="#00e676" fillOpacity={0.15} />
                      <circle cx="310" cy="155" r="8" fill="#00e676" fillOpacity={0.3} />
                      <circle className="animate-ping" cx="310" cy="155" r="4.5" fill="#00e676" />
                      <circle cx="310" cy="155" r="4.5" fill="#00e676" />
                      <text
                        x="250"
                        y="175"
                        fill="#00e676"
                        fontFamily="JetBrains Mono"
                        fontSize={11}
                        fontWeight={600}
                      >
                        MORELIA [PRIMARY HUB: 5]
                      </text>

                      {/* CDMX */}
                      <circle cx="350" cy="160" r="18" fill="#00e676" fillOpacity={0.2} />
                      <circle cx="350" cy="160" r="5" fill="#00e676" />
                      <text x="362" y="164" fill="#bacbb9" fontFamily="JetBrains Mono" fontSize={10}>
                        CDMX [3]
                      </text>

                      {/* Puebla */}
                      <circle cx="390" cy="170" r="12" fill="#44e2d7" fillOpacity={0.1} />
                      <circle cx="390" cy="170" r="3.5" fill="#44e2d7" />
                      <text x="402" y="174" fill="#bacbb9" fontFamily="JetBrains Mono" fontSize={10}>
                        PUEBLA [1]
                      </text>
                    </svg>

                    {/* Interactive Overlay Watermark */}
                    <div className="absolute bottom-3 left-3 bg-surface-container-high/80 backdrop-blur-md px-space-sm py-1 rounded-md flex items-center gap-space-xs font-label-code text-label-code text-on-surface">
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      <span>Morelia Hub Central: 5 Conexiones SIP concurrentes</span>
                    </div>
                    <div className="absolute top-3 right-3 bg-surface-container-high/80 backdrop-blur-md px-space-sm py-1 rounded-md font-label-code text-label-code text-secondary">
                      TLS 1.3 / SRTP Enabled
                    </div>
                  </div>

                  {/* Telemetry Details Strip */}
                  <div className="mt-space-md grid grid-cols-1 md:grid-cols-4 gap-space-sm bg-surface-container/60 p-space-md rounded-xl">
                    <div>
                      <span className="font-label-code text-label-code text-on-surface-variant block uppercase">
                        Último Marcaje
                      </span>
                      <span className="font-semibold text-on-surface text-body-sm block mt-0.5">
                        María López
                      </span>
                      <span className="font-label-numeric text-label-numeric text-primary">
                        Clock In: 08:02 AM
                      </span>
                    </div>
                    <div>
                      <span className="font-label-code text-label-code text-on-surface-variant block uppercase">
                        Coordenadas Nodo
                      </span>
                      <span className="font-semibold text-on-surface text-body-sm block mt-0.5">
                        Morelia, Michoacán
                      </span>
                      <span className="font-label-code text-label-code text-on-surface-variant">
                        19.7060 N, 101.1950 W
                      </span>
                    </div>
                    <div>
                      <span className="font-label-code text-label-code text-on-surface-variant block uppercase">
                        Dispositivo &amp; IP
                      </span>
                      <span className="font-semibold text-on-surface text-body-sm block mt-0.5">
                        Samsung SM-A546E
                      </span>
                      <span className="font-label-code text-label-code text-secondary font-label-numeric">
                        189.215.42.10 (Segura)
                      </span>
                    </div>
                    <div>
                      <span className="font-label-code text-label-code text-on-surface-variant block uppercase">
                        Integridad Telemetría
                      </span>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="px-space-xs py-0.5 rounded bg-primary/10 text-primary font-label-tag text-label-tag flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[14px]">pin_drop</span> Geocerca OK
                        </span>
                        <span className="px-space-xs py-0.5 rounded bg-secondary/10 text-secondary font-label-code text-label-code">
                          24ms Lat
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT: Time Off Requests (5 cols) */}
              <div className="xl:col-span-5 bg-surface-container-low/80 backdrop-blur-xl p-space-lg rounded-xl shadow-[0_12px_32px_-4px_rgba(0,0,0,0.6)] flex flex-col justify-between border border-white/5">
                <div>
                  <div className="flex items-center justify-between mb-space-md pb-space-sm border-b border-white/5">
                    <div>
                      <div className="flex items-center gap-space-xs">
                        <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                          {lang === 'es' ? 'Gestión de Permisos (Time Off)' : 'Time Off & Leave Requests'}
                        </h2>
                        <span
                          className={`px-space-xs py-0.5 rounded-full font-label-tag text-label-tag transition-all ${
                            timeOffList.length > 0
                              ? 'bg-error-container text-on-error-container font-bold'
                              : 'bg-primary/10 text-primary border border-primary/20'
                          }`}
                        >
                          {timeOffList.length > 0
                            ? `${timeOffList.length} ${lang === 'es' ? 'Pendientes' : 'Pending'}`
                            : lang === 'es'
                            ? 'Todos Aprobados'
                            : 'All Approved'}
                        </span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        {lang === 'es'
                          ? 'Aprobación ejecutiva de ausencias, PTO y justificaciones médicas.'
                          : 'Executive approval of absences, PTO, and medical justifications.'}
                      </p>
                    </div>
                    <button className="text-on-surface-variant hover:text-on-surface cursor-pointer" type="button">
                      <span className="material-symbols-outlined text-[20px]">find_replace</span>
                    </button>
                  </div>

                  {/* Request Cards Stack */}
                  <div className="space-y-space-md min-h-[220px]">
                    {timeOffList.length === 0 ? (
                      <div className="p-8 rounded-xl bg-surface-container/30 border border-dashed border-white/10 text-center flex flex-col items-center justify-center gap-2 transition-all">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1 shadow-[0_0_16px_rgba(0,230,118,0.25)]">
                          <span className="material-symbols-outlined text-2xl">check_circle</span>
                        </div>
                        <span className="font-semibold text-white">
                          {lang === 'es' ? '¡Bandeja al día!' : 'All Requests Handled!'}
                        </span>
                        <p className="text-xs text-on-surface-variant max-w-xs">
                          {lang === 'es'
                            ? 'Todas las solicitudes de ausencias han sido procesadas exitosamente.'
                            : 'All absence and PTO requests have been successfully processed.'}
                        </p>
                      </div>
                    ) : (
                      timeOffList.map((item) => (
                        <div
                          key={item.id}
                          className={`p-space-md rounded-xl bg-surface-container hover:bg-surface-container-high flex flex-col gap-space-sm border border-white/5 transition-all duration-500 ease-out ${
                            dismissingIds[item.id]
                              ? 'opacity-0 scale-95 -translate-y-4 pointer-events-none'
                              : 'opacity-100 scale-100 translate-y-0'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-space-sm">
                              <img
                                className="w-10 h-10 rounded-full object-cover shadow-[0_0_8px_rgba(0,0,0,0.4)]"
                                src={item.avatar}
                                alt={item.name}
                              />
                              <div>
                                <div className="flex items-center gap-space-xs">
                                  <span className="font-semibold text-on-surface">{item.name}</span>
                                  <span
                                    className={`px-space-xs py-0.5 rounded bg-surface-container-highest font-label-code text-label-code ${item.typeColor}`}
                                  >
                                    {lang === 'es' ? item.typeEs : item.typeEn}
                                  </span>
                                </div>
                                <span className="font-label-code text-label-code text-on-surface-variant">
                                  {lang === 'es'
                                    ? `Campaña: ${item.campaign} • ${item.requestedAgoEs}`
                                    : `Campaign: ${item.campaign} • ${item.requestedAgoEn}`}
                                </span>
                              </div>
                            </div>
                            <span className="font-label-numeric text-label-numeric font-semibold text-secondary">
                              {lang === 'es' ? item.hoursEs : item.hoursEn}
                            </span>
                          </div>

                          <div className="bg-surface-container-low/70 p-space-sm rounded-lg flex flex-col gap-1 font-body-sm text-body-sm">
                            <div className="flex items-center gap-space-xs text-on-surface">
                              <span className="material-symbols-outlined text-secondary text-[16px]">
                                {item.isMedical ? 'access_time' : 'calendar_today'}
                              </span>
                              <span className="font-semibold font-label-numeric">
                                {lang === 'es' ? item.datesEs : item.datesEn}
                              </span>
                            </div>
                            <p className="text-on-surface-variant text-body-sm italic">
                              {lang === 'es' ? item.reasonEs : item.reasonEn}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="font-label-code text-label-code text-primary flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">
                                  {item.balanceIcon}
                                </span>
                                {lang === 'es' ? item.balanceEs : item.balanceEn}
                              </span>
                            </div>
                          </div>

                          {/* Action buttons with interactive dismissal */}
                          <div className="flex items-center justify-end gap-space-sm pt-space-xs">
                            {dismissingIds[item.id] ? (
                              <span className="inline-flex items-center gap-1.5 text-primary font-label-tag text-label-tag font-bold animate-pulse">
                                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                {dismissingIds[item.id] === 'approved'
                                  ? lang === 'es'
                                    ? '¡Solicitud Aprobada!'
                                    : 'Request Approved!'
                                  : lang === 'es'
                                  ? '¡Solicitud Rechazada!'
                                  : 'Request Rejected!'}
                              </span>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleTimeOffAction(item.id, 'rejected')}
                                  className="flex items-center gap-1 px-space-md py-1.5 rounded-full bg-surface-container-high hover:bg-error/20 hover:text-error text-on-surface font-label-tag text-label-tag transition-all cursor-pointer border border-white/5"
                                  type="button"
                                >
                                  <span className="material-symbols-outlined text-[16px] text-error">close</span>
                                  {lang === 'es' ? 'Rechazar' : 'Reject'}
                                </button>
                                <button
                                  onClick={() => handleTimeOffAction(item.id, 'approved')}
                                  className="flex items-center gap-1 px-space-md py-1.5 rounded-full bg-primary-container hover:brightness-110 text-on-primary-container font-label-tag text-label-tag font-bold shadow-[0_0_16px_rgba(0,230,118,0.3)] transition-all cursor-pointer"
                                  type="button"
                                >
                                  <span className="material-symbols-outlined text-[16px]">check</span>
                                  {item.isMedical
                                    ? lang === 'es'
                                      ? 'Aprobar Permiso'
                                      : 'Approve Leave'
                                    : lang === 'es'
                                    ? 'Aprobar PTO'
                                    : 'Approve PTO'}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Time-off metrics pill footer */}
                <div className="mt-space-md pt-space-sm flex items-center justify-between text-on-surface-variant font-label-code text-label-code border-t border-white/5">
                  <span>
                    {lang === 'es'
                      ? 'Capacidad operativa estimada para la semana: 98.2%'
                      : 'Estimated weekly workforce operational capacity: 98.2%'}
                  </span>
                  <button className="text-secondary hover:underline cursor-pointer" type="button">
                    {lang === 'es' ? 'Ver Calendario Completo' : 'View Full Schedule'}
                  </button>
                </div>
              </div>
            </section>
          </div>
        </main>

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
        <Link to="/admin" className="text-secondary hover:text-white font-bold hover:underline">
          /admin
        </Link>
        <span className="text-white/20">|</span>
        <Link to="/cliente" className="text-on-surface-variant hover:text-white">
          /cliente
        </Link>
        <span className="text-white/20">|</span>
        <Link to="/agente" className="text-on-surface-variant hover:text-white">
          /agente
        </Link>
      </div>
    </>
  );
};

export default AdminCommandCenterPage;
