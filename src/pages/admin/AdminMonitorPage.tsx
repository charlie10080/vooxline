import React, { useState, useEffect } from 'react';
import { useAdminContext } from '@/layouts/AdminLayout';

interface LiveAgent {
  id: string;
  name: string;
  level: string;
  avatar: string;
  campaign: string;
  campaignColor: string;
  sipTrunk: string;
  latency: number;
  status: 'in_call' | 'break' | 'ready';
  timeSeconds: number; // Incrementado dinámicamente si está en llamada
  sentimentEs: string;
  sentimentEn: string;
  sentimentScore: number;
  sentimentType: 'positive' | 'neutral' | 'warning';
  customerName?: string;
}

export const AdminMonitorPage: React.FC = () => {
  const context = useAdminContext();
  const lang = context?.lang || 'es';

  // 1. Agentes en Monitoreo en Vivo
  const [agents, setAgents] = useState<LiveAgent[]>([
    {
      id: 'VX-9921',
      name: 'María López',
      level: 'Senior Specialist L2',
      avatar:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCvPHa2-jP_RD3Rw4IZarjza8VKRGTSWHQ2JAf6K4SLDQwrws4qpvLS_GJV43z2ZST7YJDUJ20BhPHgnfwiog9mxbXJ7a9zBe_fN01OFyA8TlFkX1dFseb0pf0I9Y7FWjY7oQp6vO0xs-p9qMPpO4KLEuzHu1kKdLtFSBtgfK55Qhe2BPzsDcP-qbttY-IJf8YX1_b9Rhe5GD-czukEgEx0zRbBaTs5_WEY44gof8TIId1lTndygSQ',
      campaign: 'National Assemblers Inc',
      campaignColor: 'text-primary border-primary/30 bg-primary/10',
      sipTrunk: 'SIP-MIA-04',
      latency: 14,
      status: 'in_call',
      timeSeconds: 317, // 05:17
      sentimentEs: 'Positivo (98%)',
      sentimentEn: 'Positive (98%)',
      sentimentScore: 98,
      sentimentType: 'positive',
      customerName: 'Robert Vance (VP Procurement)',
    },
    {
      id: 'VX-8812',
      name: 'Carlos Mendoza',
      level: 'Support Rep L1',
      avatar:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCsLwy9wHR5oLLswlB1RHIMt_PodeMAGKE-NN4L4csUIFGFDe_yOrACn__rpwOi0jOSDq0w_ZMKZXy84e_gGaZGMUEd1bTxHeNC3vdXeCsWs2ZgnYRVhsBOGPA0iifoh9yjwiFtVlsxzqxAEusfsdA_FogodrpnrmpgkUtdGY7M0yYNzyEzUjuP8S7MrSUUdutGHIFsJqIA0Y6zvM78Z_EWZqCeSbCV0KLiNW5CqofS5i3iVp_1eKI',
      campaign: 'Fidelis Health Support',
      campaignColor: 'text-secondary border-secondary/30 bg-secondary/10',
      sipTrunk: 'SIP-DAL-02',
      latency: 28,
      status: 'break',
      timeSeconds: 105, // 01:45
      sentimentEs: 'Pausa Sanitaria',
      sentimentEn: 'Resting State',
      sentimentScore: 100,
      sentimentType: 'neutral',
    },
    {
      id: 'VX-7734',
      name: 'Valeria Ríos',
      level: 'Lead Retención L3',
      avatar:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDonmzzHjPmHRBRorZPnhpKrar_ngyMMJHjOGi8b7gpKKlfhSx2O2nwepoY8dtIQwBHbDVMhUZgg-bWcqA6mr-NgHZk3oUPD_w2ULo4_3SWtsxNM7Ynw2lwrZsj0CqzhoBF5sifHYPbO3WzzkbTHyJ950nAg3p7HUpYm1V8khO0FxQoeuYZCnP43A3LldKABFz9Atmtj9-_HvPK5_pBMPXl_ANWwvkYgwdmJQGPkln7k10mPSap5tA',
      campaign: 'NexPay Fintech VIP',
      campaignColor: 'text-amber-400 border-amber-400/30 bg-amber-400/10',
      sipTrunk: 'SIP-QRO-01',
      latency: 19,
      status: 'in_call',
      timeSeconds: 728, // 12:08
      sentimentEs: 'Alerta Tensión (72%)',
      sentimentEn: 'Stress Alert (72%)',
      sentimentScore: 72,
      sentimentType: 'warning',
      customerName: 'Marcus Bradley (Chargeback Dispute)',
    },
    {
      id: 'VX-4109',
      name: 'Alejandro Sterling',
      level: 'B2B Executive Ops',
      avatar:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDFHk7nFqPz41j5h0w0814Mv_s71A2t0Z8xK9wJ1b89-21q6sO4b7f8L5g4bK7fA3pB9qY9=s96-c',
      campaign: 'Enterprise Solutions',
      campaignColor: 'text-purple-400 border-purple-400/30 bg-purple-400/10',
      sipTrunk: 'SIP-NYC-01',
      latency: 22,
      status: 'in_call',
      timeSeconds: 242, // 04:02
      sentimentEs: 'Excelente (99%)',
      sentimentEn: 'Excellent (99%)',
      sentimentScore: 99,
      sentimentType: 'positive',
      customerName: 'Elena Rostova (CTO Nordic)',
    },
    {
      id: 'VX-6520',
      name: 'David Morales',
      level: 'ACD Specialist L1',
      avatar:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDonmzzHjPmHRBRorZPnhpKrar_ngyMMJHjOGi8b7gpKKlfhSx2O2nwepoY8dtIQwBHbDVMhUZgg-bWcqA6mr-NgHZk3oUPD_w2ULo4_3SWtsxNM7Ynw2lwrZsj0CqzhoBF5sifHYPbO3WzzkbTHyJ950nAg3p7HUpYm1V8khO0FxQoeuYZCnP43A3LldKABFz9Atmtj9-_HvPK5_pBMPXl_ANWwvkYgwdmJQGPkln7k10mPSap5tA',
      campaign: 'National Assemblers Inc',
      campaignColor: 'text-primary border-primary/30 bg-primary/10',
      sipTrunk: 'SIP-MIA-04',
      latency: 35,
      status: 'ready',
      timeSeconds: 48,
      sentimentEs: 'Disponible ACD',
      sentimentEn: 'Ready for Next Call',
      sentimentScore: 95,
      sentimentType: 'neutral',
    },
    {
      id: 'VX-5211',
      name: 'Sofía Navarro',
      level: 'Bilingual Care L2',
      avatar:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCvPHa2-jP_RD3Rw4IZarjza8VKRGTSWHQ2JAf6K4SLDQwrws4qpvLS_GJV43z2ZST7YJDUJ20BhPHgnfwiog9mxbXJ7a9zBe_fN01OFyA8TlFkX1dFseb0pf0I9Y7FWjY7oQp6vO0xs-p9qMPpO4KLEuzHu1kKdLtFSBtgfK55Qhe2BPzsDcP-qbttY-IJf8YX1_b9Rhe5GD-czukEgEx0zRbBaTs5_WEY44gof8TIId1lTndygSQ',
      campaign: 'Fidelis Health Support',
      campaignColor: 'text-secondary border-secondary/30 bg-secondary/10',
      sipTrunk: 'SIP-DAL-02',
      latency: 16,
      status: 'in_call',
      timeSeconds: 184, // 03:04
      sentimentEs: 'Muy Positivo (96%)',
      sentimentEn: 'Very Positive (96%)',
      sentimentScore: 96,
      sentimentType: 'positive',
      customerName: 'Sarah Jenkins (Member Care)',
    },
  ]);

  // 2. Interactividad: Cronómetros automáticos en useEffect con setInterval de 1000ms
  useEffect(() => {
    const interval = setInterval(() => {
      setAgents((prev) =>
        prev.map((agent) => {
          if (agent.status === 'in_call') {
            return { ...agent, timeSeconds: agent.timeSeconds + 1 };
          }
          return agent;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatSeconds = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 3. Modal de Acción de Administrador (Escuchar, Whisper, Intervenir)
  const [activeActionModal, setActiveActionModal] = useState<{
    type: 'listen' | 'whisper' | 'barge';
    agent: LiveAgent;
  } | null>(null);

  const [whisperInput, setWhisperInput] = useState('');
  const [whisperSent, setWhisperSent] = useState(false);

  const handleSendWhisper = () => {
    if (!whisperInput.trim()) return;
    setWhisperSent(true);
    setTimeout(() => {
      setWhisperSent(false);
      setWhisperInput('');
    }, 2000);
  };

  return (
    <main className="w-full pt-24 px-space-lg pb-space-xl bg-[#0B0C10] min-h-screen text-on-surface">
      <div className="flex flex-col gap-space-lg max-w-[1600px] mx-auto">
        {/* Page Header con Título 'Monitor en Vivo' y Badge verde neón parpadeante 'LIVE' */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md p-space-lg rounded-2xl bg-surface-container-low/70 backdrop-blur-xl border border-white/10 shadow-[0_12px_32px_rgba(0,0,0,0.6)]">
          <div className="flex items-center gap-space-md">
            <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-primary shadow-[0_0_24px_rgba(102,252,241,0.3)] border border-primary/20">
              <span className="material-symbols-outlined text-[28px]">desktop_windows</span>
            </div>
            <div>
              <div className="flex items-center gap-space-sm">
                <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  {lang === 'es' ? 'Monitor en Vivo' : 'Live Operations Monitor'}
                </h1>
                {/* Badge Verde Neón Parpadeante LIVE */}
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/40 shadow-[0_0_16px_rgba(102,252,241,0.35)]">
                  <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                  <span className="font-label-code text-xs text-primary font-bold tracking-widest uppercase">
                    LIVE
                  </span>
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                {lang === 'es'
                  ? 'Consola centralizada de supervisión de canales SIP, escucha silenciosa, coaching whisper e intervención en tiempo real.'
                  : 'Centralized SIP audio supervision, silent listening, whisper coaching, and real-time call barge-in.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-space-sm flex-wrap">
            <div className="flex items-center gap-2 px-space-md py-1.5 rounded-full bg-[#13151c] border border-white/10 text-xs font-label-code">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-on-surface font-semibold">
                {agents.filter((a) => a.status === 'in_call').length}{' '}
                <span className="text-on-surface-variant">
                  {lang === 'es' ? 'En Llamada' : 'In Call'}
                </span>
              </span>
              <span className="text-on-surface-variant opacity-40">•</span>
              <span className="text-secondary font-semibold">
                {agents.filter((a) => a.status === 'ready').length}{' '}
                <span className="text-on-surface-variant">
                  {lang === 'es' ? 'Disponibles' : 'Ready'}
                </span>
              </span>
              <span className="text-on-surface-variant opacity-40">•</span>
              <span className="text-amber-400 font-semibold">
                {agents.filter((a) => a.status === 'break').length}{' '}
                <span className="text-on-surface-variant">
                  {lang === 'es' ? 'Pausa' : 'Break'}
                </span>
              </span>
            </div>

            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-surface-container-high border border-white/5 font-label-code text-xs text-primary">
              <span className="material-symbols-outlined text-[15px] animate-spin">refresh</span>
              WebRTC Opus HD
            </div>
          </div>
        </div>

        {/* Tabla de Monitoreo en Vivo */}
        <div className="bg-surface-container-low/80 backdrop-blur-xl p-space-lg rounded-2xl border border-white/10 shadow-[0_12px_32px_rgba(0,0,0,0.6)] flex flex-col gap-space-md">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-space-sm pb-space-sm border-b border-white/5">
            <span className="font-headline-sm text-sm font-semibold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">cell_tower</span>
              {lang === 'es' ? 'Nodos de Audio Activos' : 'Active Audio Nodes'} ({agents.length})
            </span>
            <span className="font-label-code text-xs text-on-surface-variant">
              {lang === 'es' ? 'Frecuencia de muestreo: 48 kHz estéreo' : 'Sample rate: 48 kHz stereo'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-body-sm text-body-sm">
              <thead>
                <tr className="bg-surface-container-high/40 text-on-surface-variant font-label-code text-label-code uppercase tracking-wider border-b border-white/5">
                  <th className="py-space-md px-space-sm rounded-l-xl">
                    {lang === 'es' ? 'Agente & Nivel' : 'Agent & Level'}
                  </th>
                  <th className="py-space-md px-space-sm">
                    {lang === 'es' ? 'Campaña Asignada' : 'Assigned Campaign'}
                  </th>
                  <th className="py-space-md px-space-sm">
                    {lang === 'es' ? 'Troncal SIP / Latencia' : 'SIP Trunk / Latency'}
                  </th>
                  <th className="py-space-md px-space-sm">
                    {lang === 'es' ? 'Estado Actual' : 'Current Status'}
                  </th>
                  <th className="py-space-md px-space-sm">
                    {lang === 'es' ? 'Tiempo Estado' : 'Status Duration'}
                  </th>
                  <th className="py-space-md px-space-sm">
                    {lang === 'es' ? 'Calidad QA / Sentimiento' : 'QA / Sentiment'}
                  </th>
                  <th className="py-space-md px-space-sm text-center rounded-r-xl">
                    {lang === 'es' ? 'Acciones de Administrador' : 'Admin Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-on-surface">
                {agents.map((agent) => (
                  <tr
                    key={agent.id}
                    className="hover:bg-surface-container-high/40 transition-colors group"
                  >
                    {/* Agente & Nivel */}
                    <td className="py-space-md px-space-sm">
                      <div className="flex items-center gap-space-sm">
                        <div className="relative">
                          <img
                            src={agent.avatar}
                            alt={agent.name}
                            className="w-10 h-10 rounded-full object-cover shadow-[0_0_8px_rgba(0,0,0,0.6)] border border-white/10"
                          />
                          <span
                            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#13151c] ${
                              agent.status === 'in_call'
                                ? 'bg-primary animate-pulse'
                                : agent.status === 'break'
                                ? 'bg-amber-400'
                                : 'bg-secondary'
                            }`}
                          />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-on-surface group-hover:text-primary transition-colors">
                            {agent.name}
                          </span>
                          <span className="font-label-code text-xs text-on-surface-variant">
                            {agent.level} • {agent.id}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Campaña Asignada */}
                    <td className="py-space-md px-space-sm">
                      <span
                        className={`px-space-xs py-1 rounded-full font-label-tag text-xs border ${agent.campaignColor}`}
                      >
                        {agent.campaign}
                      </span>
                    </td>

                    {/* Troncal SIP / Latencia */}
                    <td className="py-space-md px-space-sm">
                      <div className="flex flex-col font-label-code text-xs">
                        <span className="text-on-surface font-semibold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-secondary">
                            settings_ethernet
                          </span>
                          {agent.sipTrunk}
                        </span>
                        <span className="text-primary font-medium">{agent.latency}ms RTD</span>
                      </div>
                    </td>

                    {/* Estado Actual (badges coloridos: En Llamada, Pausa, Disponible) */}
                    <td className="py-space-md px-space-sm">
                      {agent.status === 'in_call' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/30 font-label-tag text-xs font-bold shadow-[0_0_12px_rgba(102,252,241,0.2)]">
                          <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                          {lang === 'es' ? 'En Llamada' : 'In Call'}
                        </span>
                      )}
                      {agent.status === 'break' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/30 font-label-tag text-xs font-bold">
                          <span className="w-2 h-2 rounded-full bg-amber-400" />
                          {lang === 'es' ? 'Pausa' : 'Break'}
                        </span>
                      )}
                      {agent.status === 'ready' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/10 text-secondary border border-secondary/30 font-label-tag text-xs font-bold">
                          <span className="w-2 h-2 rounded-full bg-secondary" />
                          {lang === 'es' ? 'Disponible' : 'Ready'}
                        </span>
                      )}
                    </td>

                    {/* Tiempo Estado (Cronómetro Vivo con useEffect) */}
                    <td className="py-space-md px-space-sm">
                      <div className="flex items-center gap-1.5 font-label-numeric font-bold text-sm">
                        <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                          timer
                        </span>
                        <span
                          className={`${
                            agent.status === 'in_call'
                              ? 'text-primary font-mono'
                              : 'text-on-surface font-mono'
                          }`}
                        >
                          {formatSeconds(agent.timeSeconds)}
                        </span>
                      </div>
                    </td>

                    {/* Calidad QA / Sentimiento */}
                    <td className="py-space-md px-space-sm">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-xs font-label-code">
                          <span
                            className={`font-semibold ${
                              agent.sentimentType === 'positive'
                                ? 'text-primary'
                                : agent.sentimentType === 'warning'
                                ? 'text-amber-400'
                                : 'text-secondary'
                            }`}
                          >
                            {lang === 'es' ? agent.sentimentEs : agent.sentimentEn}
                          </span>
                        </div>
                        <div className="w-28 bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              agent.sentimentType === 'positive'
                                ? 'bg-primary'
                                : agent.sentimentType === 'warning'
                                ? 'bg-amber-400'
                                : 'bg-secondary'
                            }`}
                            style={{ width: `${agent.sentimentScore}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Acciones de Administrador (Escuchar, Whisper, Intervenir) */}
                    <td className="py-space-md px-space-sm text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* 1. Escuchar */}
                        <button
                          type="button"
                          disabled={agent.status !== 'in_call'}
                          onClick={() => setActiveActionModal({ type: 'listen', agent })}
                          title={lang === 'es' ? 'Escuchar en Silencio (Monitor 0dB)' : 'Listen (Silent 0dB)'}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-label-tag transition-all cursor-pointer ${
                            agent.status === 'in_call'
                              ? 'bg-surface-container-high hover:bg-secondary/20 text-on-surface hover:text-secondary border border-white/5'
                              : 'opacity-30 cursor-not-allowed bg-surface-container-low text-on-surface-variant'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">headphones</span>
                          <span className="hidden xl:inline">{lang === 'es' ? 'Escuchar' : 'Listen'}</span>
                        </button>

                        {/* 2. Whisper */}
                        <button
                          type="button"
                          disabled={agent.status !== 'in_call'}
                          onClick={() => setActiveActionModal({ type: 'whisper', agent })}
                          title={lang === 'es' ? 'Whisper (Coaching Privado al Agente)' : 'Whisper (Private Coaching to Agent)'}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-label-tag transition-all cursor-pointer ${
                            agent.status === 'in_call'
                              ? 'bg-surface-container-high hover:bg-amber-400/20 text-on-surface hover:text-amber-400 border border-white/5'
                              : 'opacity-30 cursor-not-allowed bg-surface-container-low text-on-surface-variant'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">record_voice_over</span>
                          <span className="hidden xl:inline">Whisper</span>
                        </button>

                        {/* 3. Intervenir */}
                        <button
                          type="button"
                          disabled={agent.status !== 'in_call'}
                          onClick={() => setActiveActionModal({ type: 'barge', agent })}
                          title={lang === 'es' ? 'Intervenir en Llamada (Conferencia Tripartita)' : 'Barge-In (3-Way Conference)'}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-label-tag transition-all cursor-pointer ${
                            agent.status === 'in_call'
                              ? 'bg-primary-container text-on-primary-container font-bold hover:brightness-110 shadow-[0_0_12px_rgba(0,230,118,0.3)]'
                              : 'opacity-30 cursor-not-allowed bg-surface-container-low text-on-surface-variant'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">phone_in_talk</span>
                          <span className="hidden xl:inline">{lang === 'es' ? 'Intervenir' : 'Barge'}</span>
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

      {/* Modal Interactivo de Acciones de Administrador */}
      {activeActionModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#13151c] border border-white/10 rounded-2xl w-full max-w-lg p-space-lg shadow-[0_20px_60px_rgba(0,0,0,0.8)] flex flex-col gap-space-md animate-fade-in">
            {/* Header del Modal */}
            <div className="flex items-center justify-between border-b border-white/10 pb-space-sm">
              <div className="flex items-center gap-space-sm">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    activeActionModal.type === 'listen'
                      ? 'bg-secondary/20 text-secondary'
                      : activeActionModal.type === 'whisper'
                      ? 'bg-amber-400/20 text-amber-400'
                      : 'bg-primary-container text-on-primary-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[24px]">
                    {activeActionModal.type === 'listen'
                      ? 'headphones'
                      : activeActionModal.type === 'whisper'
                      ? 'record_voice_over'
                      : 'phone_in_talk'}
                  </span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                    {activeActionModal.type === 'listen' && (lang === 'es' ? 'Escucha Silenciosa SIP' : 'Silent SIP Monitoring')}
                    {activeActionModal.type === 'whisper' && (lang === 'es' ? 'Consola de Coaching Whisper' : 'Whisper Coaching Console')}
                    {activeActionModal.type === 'barge' && (lang === 'es' ? 'Intervención en Llamada Tripartita' : '3-Way Barge-In Conference')}
                  </h3>
                  <span className="font-label-code text-xs text-on-surface-variant">
                    {activeActionModal.agent.name} ({activeActionModal.agent.id}) • {activeActionModal.agent.campaign}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveActionModal(null)}
                className="text-on-surface-variant hover:text-white p-1 rounded-lg hover:bg-surface-container cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Body según Tipo de Acción */}
            {activeActionModal.type === 'listen' && (
              <div className="space-y-space-md">
                <div className="p-space-md rounded-xl bg-surface-container-low border border-white/5 text-xs font-label-code space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-variant">{lang === 'es' ? 'Cliente Conectado:' : 'Connected Customer:'}</span>
                    <span className="text-on-surface font-semibold">{activeActionModal.agent.customerName || 'Cliente Confidencial'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-variant">{lang === 'es' ? 'Estado del Puente:' : 'Bridge Status:'}</span>
                    <span className="text-primary font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                      Canal Estéreo 0dB Activo
                    </span>
                  </div>
                </div>

                {/* Visualizador de Onda de Audio En Vivo */}
                <div className="p-space-md rounded-xl bg-surface-container-lowest border border-secondary/20 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs font-label-code">
                    <span className="text-secondary flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] animate-pulse">equalizer</span>
                      Transmisión WebRTC en Vivo
                    </span>
                    <span className="text-on-surface-variant">14ms Latencia</span>
                  </div>
                  <div className="h-10 w-full flex items-end gap-1 px-2 pb-1 bg-surface-container rounded-lg overflow-hidden">
                    {[35, 65, 90, 45, 80, 50, 75, 95, 60, 40, 85, 70, 90, 55, 30, 85, 65, 45, 95, 75, 50, 80, 60, 40].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-secondary rounded-t transition-all animate-pulse"
                        style={{ height: `${h}%`, animationDelay: `${i * 50}ms` }}
                      />
                    ))}
                  </div>
                </div>

                <p className="font-body-sm text-body-sm text-on-surface-variant italic text-center">
                  {lang === 'es'
                    ? 'Tu micrófono está 100% silenciado. Ni el agente ni el cliente pueden escucharte.'
                    : 'Your microphone is 100% muted. Neither the agent nor the customer can hear you.'}
                </p>
              </div>
            )}

            {activeActionModal.type === 'whisper' && (
              <div className="space-y-space-md">
                <div className="p-space-md rounded-xl bg-surface-container-low border border-white/5 text-xs font-label-code">
                  <span className="text-amber-400 font-bold block mb-1">
                    {lang === 'es' ? 'Canal Whisper Unidireccional:' : 'One-Way Whisper Channel:'}
                  </span>
                  <p className="text-on-surface">
                    {lang === 'es'
                      ? 'Tu voz solo será enviada al auricular del agente. El cliente permanecerá completamente ajeno al coaching en vivo.'
                      : 'Your voice will only be routed to the agent\'s headset. The customer will not hear this coaching.'}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="font-label-code text-xs text-on-surface-variant block">
                    {lang === 'es' ? 'Mensaje o Sugerencia Rápida:' : 'Quick Coaching Message:'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={whisperInput}
                      onChange={(e) => setWhisperInput(e.target.value)}
                      placeholder={lang === 'es' ? 'Escribe aquí o habla por micrófono...' : 'Type coaching note or talk via mic...'}
                      className="flex-1 bg-surface-container-high text-on-surface placeholder:text-on-surface-variant px-space-md py-2 rounded-xl text-body-sm focus:outline-none focus:ring-1 focus:ring-amber-400 border border-white/10"
                    />
                    <button
                      type="button"
                      onClick={handleSendWhisper}
                      className="px-space-md py-2 rounded-xl bg-amber-400 text-black font-bold text-xs font-label-tag hover:brightness-110 cursor-pointer shadow-[0_0_12px_rgba(251,191,36,0.4)]"
                    >
                      {lang === 'es' ? 'Enviar' : 'Send'}
                    </button>
                  </div>
                  {whisperSent && (
                    <span className="text-xs text-primary font-label-code flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">check</span>
                      {lang === 'es' ? 'Sugerencia transmitida al auricular' : 'Coaching delivered to headset'}
                    </span>
                  )}
                </div>
              </div>
            )}

            {activeActionModal.type === 'barge' && (
              <div className="space-y-space-md">
                <div className="p-space-md rounded-xl bg-error-container/20 border border-error/40 text-xs font-label-code">
                  <span className="text-error font-bold block mb-1">
                    {lang === 'es' ? 'Advertencia de Intervención Operativa:' : 'Operational Barge Warning:'}
                  </span>
                  <p className="text-on-surface">
                    {lang === 'es'
                      ? 'Al pulsar Intervenir, tu audio SIP se transmitirá abiertamente a ambos lados de la llamada (Agente y Cliente) transformándola en una conferencia tripartita de rescate.'
                      : 'Pressing Barge-In will broadcast your SIP audio to both the agent and customer, converting the call into a live 3-way conference.'}
                  </p>
                </div>

                <div className="p-space-md rounded-xl bg-surface-container-low border border-white/5 space-y-1 font-label-code text-xs">
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Agente:</span>
                    <span className="text-on-surface font-semibold">{activeActionModal.agent.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Cliente:</span>
                    <span className="text-on-surface font-semibold">{activeActionModal.agent.customerName || 'Cliente Confidencial'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Duración:</span>
                    <span className="text-primary font-bold">{formatSeconds(activeActionModal.agent.timeSeconds)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-space-xs pt-space-xs border-t border-white/10">
              <button
                type="button"
                onClick={() => setActiveActionModal(null)}
                className="px-space-md py-1.5 rounded-xl bg-surface-container-high hover:bg-surface-variant text-on-surface font-label-tag text-xs cursor-pointer"
              >
                {lang === 'es' ? 'Cerrar' : 'Close'}
              </button>
              {activeActionModal.type === 'barge' && (
                <button
                  type="button"
                  onClick={() => {
                    alert(lang === 'es' ? 'Conectado a la conferencia tripartita.' : 'Connected to 3-way conference.');
                    setActiveActionModal(null);
                  }}
                  className="px-space-md py-1.5 rounded-xl bg-primary text-on-primary font-bold font-label-tag text-xs hover:brightness-110 shadow-[0_0_16px_rgba(102,252,241,0.5)] cursor-pointer"
                >
                  {lang === 'es' ? 'Confirmar Intervención' : 'Confirm Barge-In'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
