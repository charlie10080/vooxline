import React, { useState } from 'react';
import { useAdminContext } from '@/layouts/useAdminContext';

interface ActivityRecord {
  id: string;
  agentName: string;
  agentId: string;
  avatar: string;
  campaign: string;
  campaignColor: string;
  sipTrunk: string;
  latency: number;
  jitter: number;
  statusEs: string;
  statusEn: string;
  statusType: 'success' | 'warning' | 'info' | 'error';
  timeInStatusEs: string;
  timeInStatusEn: string;
  timestamp: string;
  qaScore: number;
  qaRatingEs: string;
  qaRatingEn: string;
  details: {
    ip: string;
    codec: string;
    packetsLost: string;
    supervisorNote?: string;
  };
}

export const AdminActivityPage: React.FC = () => {
  const context = useAdminContext();
  const lang = context?.lang || 'es';

  // 1. Selector de Filtros Visual: Día, Semana, Mes, Año
  const [timeFilter, setTimeFilter] = useState<'day' | 'week' | 'month' | 'year'>('week');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<ActivityRecord | null>(null);

  // Datos de Auditoría e Historial de Operaciones
  const [activities] = useState<ActivityRecord[]>([
    {
      id: 'ACT-9081',
      agentName: 'María López',
      agentId: 'VX-9921',
      avatar:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCvPHa2-jP_RD3Rw4IZarjza8VKRGTSWHQ2JAf6K4SLDQwrws4qpvLS_GJV43z2ZST7YJDUJ20BhPHgnfwiog9mxbXJ7a9zBe_fN01OFyA8TlFkX1dFseb0pf0I9Y7FWjY7oQp6vO0xs-p9qMPpO4KLEuzHu1kKdLtFSBtgfK55Qhe2BPzsDcP-qbttY-IJf8YX1_b9Rhe5GD-czukEgEx0zRbBaTs5_WEY44gof8TIId1lTndygSQ',
      campaign: 'National Assemblers Inc',
      campaignColor: 'text-primary border-primary/30 bg-primary/10',
      sipTrunk: 'SIP-MIA-04',
      latency: 14,
      jitter: 1.2,
      statusEs: 'Llamada Saliente Cerrada (Venta)',
      statusEn: 'Outbound Call Closed (Sale Won)',
      statusType: 'success',
      timeInStatusEs: 'Hace 2m • 08:42 min',
      timeInStatusEn: '2m ago • 08:42 min',
      timestamp: '14:28:10 CST',
      qaScore: 99.2,
      qaRatingEs: 'Impecable',
      qaRatingEn: 'Flawless',
      details: {
        ip: '189.204.112.44 (CDMX Central)',
        codec: 'Opus HD (48kHz/Stereo)',
        packetsLost: '0.001%',
        supervisorNote: 'Adherencia total a script comercial. Cierre en primer contacto.',
      },
    },
    {
      id: 'ACT-9082',
      agentName: 'Carlos Mendoza',
      agentId: 'VX-8812',
      avatar:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCsLwy9wHR5oLLswlB1RHIMt_PodeMAGKE-NN4L4csUIFGFDe_yOrACn__rpwOi0jOSDq0w_ZMKZXy84e_gGaZGMUEd1bTxHeNC3vdXeCsWs2ZgnYRVhsBOGPA0iifoh9yjwiFtVlsxzqxAEusfsdA_FogodrpnrmpgkUtdGY7M0yYNzyEzUjuP8S7MrSUUdutGHIFsJqIA0Y6zvM78Z_EWZqCeSbCV0KLiNW5CqofS5i3iVp_1eKI',
      campaign: 'Fidelis Health Support',
      campaignColor: 'text-secondary border-secondary/30 bg-secondary/10',
      sipTrunk: 'SIP-DAL-02',
      latency: 28,
      jitter: 2.4,
      statusEs: 'Marcaje Biométrico Entrada OK',
      statusEn: 'Biometric Clock-In Verified',
      statusType: 'info',
      timeInStatusEs: 'Hace 8m • 01:45 min',
      timeInStatusEn: '8m ago • 01:45 min',
      timestamp: '14:22:05 CST',
      qaScore: 100,
      qaRatingEs: 'Verificado',
      qaRatingEn: 'Verified',
      details: {
        ip: '201.175.89.12 (Guadalajara Hub)',
        codec: 'SIP Signaling TLS 1.3',
        packetsLost: '0.000%',
        supervisorNote: 'Puntualidad en turno. Geocerca biométrica confirmada a 12m del centro.',
      },
    },
    {
      id: 'ACT-9083',
      agentName: 'Valeria Ríos',
      agentId: 'VX-7734',
      avatar:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDonmzzHjPmHRBRorZPnhpKrar_ngyMMJHjOGi8b7gpKKlfhSx2O2nwepoY8dtIQwBHbDVMhUZgg-bWcqA6mr-NgHZk3oUPD_w2ULo4_3SWtsxNM7Ynw2lwrZsj0CqzhoBF5sifHYPbO3WzzkbTHyJ950nAg3p7HUpYm1V8khO0FxQoeuYZCnP43A3LldKABFz9Atmtj9-_HvPK5_pBMPXl_ANWwvkYgwdmJQGPkln7k10mPSap5tA',
      campaign: 'NexPay Fintech VIP',
      campaignColor: 'text-amber-400 border-amber-400/30 bg-amber-400/10',
      sipTrunk: 'SIP-QRO-01',
      latency: 19,
      jitter: 0.9,
      statusEs: 'Whisper Supervisor Activo',
      statusEn: 'Supervisor Whisper Coaching Active',
      statusType: 'warning',
      timeInStatusEs: 'Hace 12m • 12:08 min',
      timeInStatusEn: '12m ago • 12:08 min',
      timestamp: '14:18:00 CST',
      qaScore: 94.5,
      qaRatingEs: 'Conforme',
      qaRatingEn: 'Compliant',
      details: {
        ip: '187.190.201.78 (Querétaro Node)',
        codec: 'G.711u / Opus Dual-Stream',
        packetsLost: '0.004%',
        supervisorNote: 'Asistencia en vivo para resolución de contracargo fraudulento.',
      },
    },
    {
      id: 'ACT-9084',
      agentName: 'Alejandro Sterling',
      agentId: 'VX-4109',
      avatar:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDFHk7nFqPz41j5h0w0814Mv_s71A2t0Z8xK9wJ1b89-21q6sO4b7f8L5g4bK7fA3pB9qY9=s96-c',
      campaign: 'Enterprise Solutions',
      campaignColor: 'text-purple-400 border-purple-400/30 bg-purple-400/10',
      sipTrunk: 'SIP-NYC-01',
      latency: 22,
      jitter: 1.1,
      statusEs: 'Conferencia Tripartita Resuelta',
      statusEn: '3-Way Conference Resolved',
      statusType: 'success',
      timeInStatusEs: 'Hace 25m • 15:20 min',
      timeInStatusEn: '25m ago • 15:20 min',
      timestamp: '14:05:42 CST',
      qaScore: 98.8,
      qaRatingEs: 'Excelente',
      qaRatingEn: 'Excellent',
      details: {
        ip: '198.51.100.22 (Miami DataCenter)',
        codec: 'Opus HD (48kHz/Stereo)',
        packetsLost: '0.000%',
        supervisorNote: 'Negociación de SLA corporativo con Director de TI.',
      },
    },
    {
      id: 'ACT-9085',
      agentName: 'David Morales',
      agentId: 'VX-6520',
      avatar:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDonmzzHjPmHRBRorZPnhpKrar_ngyMMJHjOGi8b7gpKKlfhSx2O2nwepoY8dtIQwBHbDVMhUZgg-bWcqA6mr-NgHZk3oUPD_w2ULo4_3SWtsxNM7Ynw2lwrZsj0CqzhoBF5sifHYPbO3WzzkbTHyJ950nAg3p7HUpYm1V8khO0FxQoeuYZCnP43A3LldKABFz9Atmtj9-_HvPK5_pBMPXl_ANWwvkYgwdmJQGPkln7k10mPSap5tA',
      campaign: 'National Assemblers Inc',
      campaignColor: 'text-primary border-primary/30 bg-primary/10',
      sipTrunk: 'SIP-MIA-04',
      latency: 42,
      jitter: 3.8,
      statusEs: 'Llamada Entrante ACD Transferida',
      statusEn: 'ACD Inbound Call Transferred',
      statusType: 'info',
      timeInStatusEs: 'Hace 41m • 03:15 min',
      timeInStatusEn: '41m ago • 03:15 min',
      timestamp: '13:49:15 CST',
      qaScore: 91.0,
      qaRatingEs: 'Conforme',
      qaRatingEn: 'Compliant',
      details: {
        ip: '189.245.10.82 (Monterrey Hub)',
        codec: 'Opus HD (48kHz/Stereo)',
        packetsLost: '0.012%',
        supervisorNote: 'Transferencia cálida a Nivel 2 tras validar póliza de ensamble.',
      },
    },
    {
      id: 'ACT-9086',
      agentName: 'Sofía Navarro',
      agentId: 'VX-5211',
      avatar:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCvPHa2-jP_RD3Rw4IZarjza8VKRGTSWHQ2JAf6K4SLDQwrws4qpvLS_GJV43z2ZST7YJDUJ20BhPHgnfwiog9mxbXJ7a9zBe_fN01OFyA8TlFkX1dFseb0pf0I9Y7FWjY7oQp6vO0xs-p9qMPpO4KLEuzHu1kKdLtFSBtgfK55Qhe2BPzsDcP-qbttY-IJf8YX1_b9Rhe5GD-czukEgEx0zRbBaTs5_WEY44gof8TIId1lTndygSQ',
      campaign: 'Fidelis Health Support',
      campaignColor: 'text-secondary border-secondary/30 bg-secondary/10',
      sipTrunk: 'SIP-DAL-02',
      latency: 16,
      jitter: 0.8,
      statusEs: 'Pausa Sanitaria Autorizada',
      statusEn: 'Authorized Break / Personal',
      statusType: 'warning',
      timeInStatusEs: 'Hace 58m • 10:00 min',
      timeInStatusEn: '58m ago • 10:00 min',
      timestamp: '13:32:00 CST',
      qaScore: 96.5,
      qaRatingEs: 'En Regla',
      qaRatingEn: 'Within SLA',
      details: {
        ip: '200.68.14.99 (Puebla Edge)',
        codec: 'SIP Idle State',
        packetsLost: '0.000%',
        supervisorNote: 'Pausa cronometrada dentro de la tolerancia de 15 minutos.',
      },
    },
    {
      id: 'ACT-9087',
      agentName: 'Alejandra Moreno',
      agentId: 'VX-3390',
      avatar:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCsLwy9wHR5oLLswlB1RHIMt_PodeMAGKE-NN4L4csUIFGFDe_yOrACn__rpwOi0jOSDq0w_ZMKZXy84e_gGaZGMUEd1bTxHeNC3vdXeCsWs2ZgnYRVhsBOGPA0iifoh9yjwiFtVlsxzqxAEusfsdA_FogodrpnrmpgkUtdGY7M0yYNzyEzUjuP8S7MrSUUdutGHIFsJqIA0Y6zvM78Z_EWZqCeSbCV0KLiNW5CqofS5i3iVp_1eKI',
      campaign: 'Retail Express VIP',
      campaignColor: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
      sipTrunk: 'SIP-ATL-03',
      latency: 31,
      jitter: 1.5,
      statusEs: 'Cierre Ticket Omnicanal CSAT 5★',
      statusEn: 'Omnichannel Ticket Closed (5★ CSAT)',
      statusType: 'success',
      timeInStatusEs: 'Hace 1h • 04:50 min',
      timeInStatusEn: '1h ago • 04:50 min',
      timestamp: '13:15:30 CST',
      qaScore: 97.9,
      qaRatingEs: 'Excelente',
      qaRatingEn: 'Excellent',
      details: {
        ip: '189.140.22.105 (Veracruz Node)',
        codec: 'WebRTC WebSocket v2.2',
        packetsLost: '0.002%',
        supervisorNote: 'Resolución de reclamo de logística en tiempo récord.',
      },
    },
  ]);

  const filteredActivities = activities.filter((act) => {
    const q = searchQuery.toLowerCase();
    return (
      act.agentName.toLowerCase().includes(q) ||
      act.agentId.toLowerCase().includes(q) ||
      act.campaign.toLowerCase().includes(q) ||
      act.sipTrunk.toLowerCase().includes(q)
    );
  });

  return (
    <main className="w-full pt-24 px-space-lg pb-space-xl bg-[#0B0C10] min-h-screen text-on-surface">
      <div className="flex flex-col gap-space-lg max-w-[1600px] mx-auto">
        {/* Page Header con Selector de Filtros Visual (Día, Semana, Mes, Año) */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md p-space-lg rounded-2xl bg-surface-container-low/70 backdrop-blur-xl border border-white/10 shadow-[0_12px_32px_rgba(0,0,0,0.6)]">
          <div className="flex items-center gap-space-md">
            <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-primary shadow-[0_0_24px_rgba(102,252,241,0.25)] border border-primary/20">
              <span className="material-symbols-outlined text-[28px]">insights</span>
            </div>
            <div>
              <div className="flex items-center gap-space-xs">
                <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  {lang === 'es' ? 'Historial de Actividad' : 'Activity & Audit History'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-label-code text-[11px] font-bold tracking-wider uppercase">
                  Audit Trail
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                {lang === 'es'
                  ? 'Registro inmutable y forense de eventos de telefonía SIP, estados de agentes y métricas QA.'
                  : 'Immutable forensic log of SIP telephony events, agent states, and QA metrics.'}
              </p>
            </div>
          </div>

          {/* Selector de Filtros Visual en Forma de Botones: Día, Semana, Mes, Año */}
          <div className="flex items-center gap-space-sm flex-wrap">
            <div className="flex items-center p-1.5 bg-[#13151c] rounded-xl border border-white/10 shadow-inner">
              <button
                type="button"
                onClick={() => setTimeFilter('day')}
                className={`px-4 py-1.5 rounded-lg text-xs font-label-tag font-bold transition-all cursor-pointer ${
                  timeFilter === 'day'
                    ? 'bg-primary text-on-primary shadow-[0_0_16px_rgba(102,252,241,0.4)]'
                    : 'text-on-surface-variant hover:text-white'
                }`}
              >
                {lang === 'es' ? 'Día' : 'Day'}
              </button>
              <button
                type="button"
                onClick={() => setTimeFilter('week')}
                className={`px-4 py-1.5 rounded-lg text-xs font-label-tag font-bold transition-all cursor-pointer ${
                  timeFilter === 'week'
                    ? 'bg-primary text-on-primary shadow-[0_0_16px_rgba(102,252,241,0.4)]'
                    : 'text-on-surface-variant hover:text-white'
                }`}
              >
                {lang === 'es' ? 'Semana' : 'Week'}
              </button>
              <button
                type="button"
                onClick={() => setTimeFilter('month')}
                className={`px-4 py-1.5 rounded-lg text-xs font-label-tag font-bold transition-all cursor-pointer ${
                  timeFilter === 'month'
                    ? 'bg-primary text-on-primary shadow-[0_0_16px_rgba(102,252,241,0.4)]'
                    : 'text-on-surface-variant hover:text-white'
                }`}
              >
                {lang === 'es' ? 'Mes' : 'Month'}
              </button>
              <button
                type="button"
                onClick={() => setTimeFilter('year')}
                className={`px-4 py-1.5 rounded-lg text-xs font-label-tag font-bold transition-all cursor-pointer ${
                  timeFilter === 'year'
                    ? 'bg-primary text-on-primary shadow-[0_0_16px_rgba(102,252,241,0.4)]'
                    : 'text-on-surface-variant hover:text-white'
                }`}
              >
                {lang === 'es' ? 'Año' : 'Year'}
              </button>
            </div>

            <button
              type="button"
              className="flex items-center gap-space-xs px-space-md py-2 rounded-xl bg-surface-container-high hover:bg-surface-variant text-on-surface text-xs font-label-tag transition-all cursor-pointer border border-white/5 shadow"
            >
              <span className="material-symbols-outlined text-[16px]">file_download</span>
              {lang === 'es' ? 'Descargar Reporte' : 'Export Audit Log'}
            </button>
          </div>
        </div>

        {/* Métricas Rápidas de Auditoría */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
          <div className="p-space-md rounded-xl bg-surface-container-low/70 backdrop-blur-md border border-white/5 flex items-center justify-between">
            <div>
              <span className="font-label-code text-[11px] text-on-surface-variant uppercase tracking-wider block">
                {lang === 'es' ? 'Eventos Registrados' : 'Logged Events'}
              </span>
              <span className="font-headline-sm text-headline-sm font-bold text-on-surface font-label-numeric">
                1,482
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[22px]">history</span>
            </div>
          </div>

          <div className="p-space-md rounded-xl bg-surface-container-low/70 backdrop-blur-md border border-white/5 flex items-center justify-between">
            <div>
              <span className="font-label-code text-[11px] text-on-surface-variant uppercase tracking-wider block">
                {lang === 'es' ? 'Latencia Promedio SIP' : 'Avg SIP Latency'}
              </span>
              <span className="font-headline-sm text-headline-sm font-bold text-secondary font-label-numeric">
                22.1 ms
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[22px]">speed</span>
            </div>
          </div>

          <div className="p-space-md rounded-xl bg-surface-container-low/70 backdrop-blur-md border border-white/5 flex items-center justify-between">
            <div>
              <span className="font-label-code text-[11px] text-on-surface-variant uppercase tracking-wider block">
                {lang === 'es' ? 'Cumplimiento QA Global' : 'Global QA Compliance'}
              </span>
              <span className="font-headline-sm text-headline-sm font-bold text-primary font-label-numeric">
                97.2%
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[22px]">verified</span>
            </div>
          </div>

          <div className="p-space-md rounded-xl bg-surface-container-low/70 backdrop-blur-md border border-white/5 flex items-center justify-between">
            <div>
              <span className="font-label-code text-[11px] text-on-surface-variant uppercase tracking-wider block">
                {lang === 'es' ? 'Incidentes Bloqueantes' : 'Blocking Incidents'}
              </span>
              <span className="font-headline-sm text-headline-sm font-bold text-error font-label-numeric">
                0
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-error">
              <span className="material-symbols-outlined text-[22px]">security</span>
            </div>
          </div>
        </div>

        {/* Tabla de Historial y Auditoría */}
        <div className="bg-surface-container-low/80 backdrop-blur-xl p-space-lg rounded-2xl border border-white/10 shadow-[0_12px_32px_rgba(0,0,0,0.6)] flex flex-col gap-space-md">
          {/* Barra de Filtro de Búsqueda */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-space-sm pb-space-sm border-b border-white/5">
            <div className="relative w-full sm:w-80">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-[18px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === 'es' ? 'Filtrar por agente, ID o campaña...' : 'Filter by agent, ID or campaign...'}
                className="w-full bg-[#13151c] text-on-surface placeholder:text-on-surface-variant pl-10 pr-space-md py-2 rounded-xl font-body-sm text-body-sm focus:outline-none focus:ring-1 focus:ring-primary/40 border border-white/5"
              />
            </div>
            <div className="flex items-center gap-space-xs text-on-surface-variant font-label-code text-xs">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
              <span>
                {filteredActivities.length} {lang === 'es' ? 'registros encontrados' : 'records found'}
              </span>
            </div>
          </div>

          {/* Tabla de Actividad */}
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body-sm text-body-sm">
              <thead>
                <tr className="bg-surface-container-high/40 text-on-surface-variant font-label-code text-label-code uppercase tracking-wider border-b border-white/5">
                  <th className="py-space-md px-space-sm rounded-l-xl">
                    {lang === 'es' ? 'Agente' : 'Agent'}
                  </th>
                  <th className="py-space-md px-space-sm">
                    {lang === 'es' ? 'Campaña Asignada' : 'Assigned Campaign'}
                  </th>
                  <th className="py-space-md px-space-sm">
                    {lang === 'es' ? 'Troncal SIP / Latencia' : 'SIP Trunk / Latency'}
                  </th>
                  <th className="py-space-md px-space-sm">
                    {lang === 'es' ? 'Estado' : 'Status'}
                  </th>
                  <th className="py-space-md px-space-sm">
                    {lang === 'es' ? 'Tiempo en Estado' : 'Time in Status'}
                  </th>
                  <th className="py-space-md px-space-sm text-center">
                    {lang === 'es' ? 'Calidad QA' : 'QA Quality'}
                  </th>
                  <th className="py-space-md px-space-sm text-center rounded-r-xl">
                    {lang === 'es' ? 'Acciones' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-on-surface">
                {filteredActivities.map((act) => (
                  <tr
                    key={act.id}
                    className="hover:bg-surface-container-high/40 transition-colors group"
                  >
                    {/* Agente */}
                    <td className="py-space-md px-space-sm">
                      <div className="flex items-center gap-space-sm">
                        <img
                          src={act.avatar}
                          alt={act.agentName}
                          className="w-10 h-10 rounded-full object-cover shadow-[0_0_8px_rgba(0,0,0,0.6)] border border-white/10"
                        />
                        <div className="flex flex-col">
                          <span className="font-semibold text-on-surface group-hover:text-primary transition-colors">
                            {act.agentName}
                          </span>
                          <span className="font-label-code text-label-code text-on-surface-variant">
                            {act.agentId}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Campaña Asignada */}
                    <td className="py-space-md px-space-sm">
                      <span
                        className={`px-space-xs py-1 rounded-full font-label-tag text-xs border ${act.campaignColor}`}
                      >
                        {act.campaign}
                      </span>
                    </td>

                    {/* Troncal SIP / Latencia */}
                    <td className="py-space-md px-space-sm">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 font-label-code text-label-code">
                          <span className="material-symbols-outlined text-[15px] text-secondary">
                            router
                          </span>
                          <span className="font-semibold">{act.sipTrunk}</span>
                        </div>
                        <span
                          className={`font-label-code text-[11px] ${
                            act.latency < 25
                              ? 'text-primary'
                              : act.latency < 40
                              ? 'text-amber-400'
                              : 'text-error'
                          }`}
                        >
                          {act.latency}ms • Jitter {act.jitter}ms
                        </span>
                      </div>
                    </td>

                    {/* Estado */}
                    <td className="py-space-md px-space-sm">
                      <span
                        className={`inline-flex items-center gap-1.5 px-space-sm py-1 rounded-full font-label-tag text-xs font-semibold ${
                          act.statusType === 'success'
                            ? 'bg-primary/10 text-primary border border-primary/20'
                            : act.statusType === 'warning'
                            ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                            : 'bg-secondary/10 text-secondary border border-secondary/20'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            act.statusType === 'success'
                              ? 'bg-primary'
                              : act.statusType === 'warning'
                              ? 'bg-amber-400 animate-pulse'
                              : 'bg-secondary'
                          }`}
                        />
                        {lang === 'es' ? act.statusEs : act.statusEn}
                      </span>
                    </td>

                    {/* Tiempo en Estado */}
                    <td className="py-space-md px-space-sm">
                      <div className="flex flex-col font-label-code text-xs">
                        <span className="text-on-surface font-medium">
                          {lang === 'es' ? act.timeInStatusEs : act.timeInStatusEn}
                        </span>
                        <span className="text-on-surface-variant text-[11px] opacity-70">
                          {act.timestamp}
                        </span>
                      </div>
                    </td>

                    {/* Calidad QA */}
                    <td className="py-space-md px-space-sm text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="font-label-numeric font-bold text-sm text-primary">
                          {act.qaScore}%
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-tag text-[10px]">
                          {lang === 'es' ? act.qaRatingEs : act.qaRatingEn}
                        </span>
                      </div>
                    </td>

                    {/* Acciones */}
                    <td className="py-space-md px-space-sm text-center">
                      <div className="flex items-center justify-center gap-space-xs">
                        <button
                          type="button"
                          onClick={() => setSelectedRecord(act)}
                          title={lang === 'es' ? 'Ver Log Forense' : 'View Forensic Log'}
                          className="p-1.5 rounded-lg bg-surface-container-high hover:bg-primary/20 text-on-surface-variant hover:text-primary transition-all cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">article</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedRecord(act)}
                          title={lang === 'es' ? 'Escuchar Audio SIP' : 'Listen SIP Audio'}
                          className="p-1.5 rounded-lg bg-surface-container-high hover:bg-secondary/20 text-on-surface-variant hover:text-secondary transition-all cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">play_circle</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de Detalle Forense del Evento */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#13151c] border border-white/10 rounded-2xl w-full max-w-xl p-space-lg shadow-[0_20px_60px_rgba(0,0,0,0.8)] flex flex-col gap-space-md">
            <div className="flex items-center justify-between border-b border-white/10 pb-space-sm">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-primary text-[24px]">verified</span>
                <div>
                  <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                    {lang === 'es' ? 'Detalle de Auditoría' : 'Audit Event Detail'}
                  </h3>
                  <span className="font-label-code text-xs text-on-surface-variant">
                    {selectedRecord.id} • {selectedRecord.agentName} ({selectedRecord.agentId})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="text-on-surface-variant hover:text-white p-1 rounded-lg hover:bg-surface-container cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-space-sm text-body-sm font-body-sm">
              <div className="grid grid-cols-2 gap-space-sm bg-surface-container-lowest p-space-md rounded-xl border border-white/5 font-label-code text-xs">
                <div>
                  <span className="text-on-surface-variant block">Troncal & IP:</span>
                  <span className="text-on-surface font-semibold">{selectedRecord.details.ip}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant block">Codec & Audio:</span>
                  <span className="text-secondary font-semibold">{selectedRecord.details.codec}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant block">Pérdida de Paquetes:</span>
                  <span className="text-primary font-semibold">{selectedRecord.details.packetsLost}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant block">Calidad QA Score:</span>
                  <span className="text-primary font-bold">{selectedRecord.qaScore}%</span>
                </div>
              </div>

              <div className="p-space-md rounded-xl bg-surface-container-low border border-white/5">
                <span className="font-label-code text-xs text-on-surface-variant uppercase tracking-wider block mb-1">
                  {lang === 'es' ? 'Nota del Supervisor / QA AI:' : 'Supervisor / AI QA Note:'}
                </span>
                <p className="text-on-surface italic">
                  "{selectedRecord.details.supervisorNote}"
                </p>
              </div>

              {/* Simulación de Reproductor de Audio SIP */}
              <div className="p-space-md rounded-xl bg-surface-container-high/60 border border-primary/20 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-label-code">
                  <span className="text-primary flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">graphic_eq</span>
                    Grabación SIP Estéreo HD
                  </span>
                  <span className="text-on-surface-variant">08:42 min (320 kbps)</span>
                </div>
                <div className="h-6 w-full bg-surface-container-lowest rounded-md flex items-center px-2 gap-1 overflow-hidden">
                  {[40, 70, 95, 30, 80, 60, 90, 45, 85, 35, 95, 75, 40, 80, 65, 90, 50, 70, 85, 60, 45, 95, 80, 55].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-primary/70 rounded-full transition-all"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-space-xs">
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="px-space-md py-1.5 rounded-xl bg-surface-container-highest hover:bg-surface-variant text-on-surface font-label-tag text-xs cursor-pointer"
              >
                {lang === 'es' ? 'Cerrar' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
