import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export const LandingPage: React.FC = () => {
  // Lead Capture Form State
  const [email, setEmail] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState('servicios');

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setFormSubmitted(true);
      setEmail('');
    }
  };

  return (
    <div className="bg-[#121317] font-body-md text-on-surface antialiased selection:bg-primary-container selection:text-on-primary-container min-h-screen relative overflow-x-hidden">
      {/* Ambient Radial Lights */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-48 left-1/4 w-[600px] h-[600px] bg-primary-container/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 -right-48 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-10 left-1/3 w-[550px] h-[550px] bg-primary/5 rounded-full blur-[160px]" />
      </div>

      {/* Floating Modern Header / Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full px-margin py-space-sm">
        <div className="max-w-7xl mx-auto h-16 px-gutter flex items-center justify-between rounded-full bg-surface-container-lowest/70 backdrop-blur-2xl shadow-[0_12px_32px_-4px_rgba(0,0,0,0.7)] border border-white/5">
          {/* Brand Logo Header */}
          <Link to="/" className="flex items-center gap-space-sm group">
            <div className="relative flex items-center justify-center w-8 h-8">
              <div className="w-5 h-5 rounded-full border-2 border-primary-container absolute -left-1 opacity-90 shadow-[0_0_12px_rgba(0,230,118,0.4)] group-hover:scale-105 transition-transform" />
              <div className="w-5 h-5 rounded-full border-2 border-secondary absolute -right-1 opacity-80 shadow-[0_0_12px_rgba(68,226,215,0.4)] group-hover:scale-105 transition-transform" />
            </div>
            <span className="font-headline-sm text-headline-sm tracking-tight text-on-surface font-semibold pl-space-xs">
              Voox<span className="text-primary-container">line</span>
            </span>
          </Link>

          {/* Center Navigation Anchors */}
          <nav className="hidden lg:flex items-center gap-space-sm bg-surface-container-low/60 px-space-sm py-space-xs rounded-full shadow-inner border border-white/5">
            {[
              { id: 'servicios', label: 'Servicios', href: '#servicios' },
              { id: 'tecnologia', label: 'Tecnología', href: '#tecnologia' },
              { id: 'ventajas-b2b', label: 'Ventajas B2B', href: '#ventajas-b2b' },
              { id: 'casos-de-exito', label: 'Casos de Éxito', href: '#casos-de-exito' },
              { id: 'precios', label: 'Precios', href: '#precios' },
            ].map((tab) => (
              <a
                key={tab.id}
                href={tab.href}
                onClick={() => setActiveTab(tab.id)}
                className={`px-space-md py-space-xs font-body-sm text-body-sm transition-all rounded-full ${
                  activeTab === tab.id
                    ? 'bg-surface-container-high text-primary font-semibold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                {tab.label}
              </a>
            ))}
          </nav>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-space-md">
            {/* Quick Access to B2B Portal / Login */}
            <Link
              to="/login"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-label-code text-on-surface-variant hover:text-white hover:bg-white/5 border border-white/10 transition-all"
            >
              <span className="material-symbols-outlined text-[16px] text-primary">key</span>
              <span>Portal Clientes</span>
            </Link>

            <a
              className="inline-flex items-center justify-center px-space-md py-space-xs font-body-sm text-body-sm font-semibold text-on-primary-container bg-primary-container rounded-full shadow-[0_0_20px_rgba(0,230,118,0.35)] hover:shadow-[0_0_28px_rgba(0,230,118,0.6)] hover:brightness-105 transition-all"
              href="#demo"
            >
              Agendar Demo
            </a>

            <Link
              to="/login"
              title="Acceder al Portal del Agente / Admin"
              className="relative group cursor-pointer"
            >
              <span
                aria-label="Acceder"
                className="material-symbols-outlined flex w-8 h-8 items-center justify-center rounded-full text-[22px] text-primary border border-primary/30 group-hover:border-primary transition-colors"
              >
                account_circle
              </span>
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-primary border border-[#121317]" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Layout Content */}
      <main className="relative z-10 w-full pt-16 bg-transparent min-h-screen">
        <div className="flex flex-col w-full text-on-surface">
          {/* HERO SECTION */}
          <section className="relative w-full px-margin py-space-xl overflow-hidden" id="servicios">
            <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
              {/* Top Badge */}
              <div className="inline-flex items-center gap-space-xs bg-surface-container-low/80 px-space-md py-space-xs rounded-full shadow-lg mb-space-lg backdrop-blur-xl border border-white/5">
                <span
                  className="material-symbols-outlined text-primary text-base"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  star
                </span>
                <span className="font-label-code text-label-code tracking-wider text-primary uppercase">
                  CONTRATACIÓN Y CONTACT CENTER B2B DE NUEVA GENERACIÓN
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-secondary-fixed animate-ping ml-1" />
              </div>

              {/* Main Headline */}
              <h1 className="font-display-hero text-display-hero max-w-5xl tracking-tight text-on-surface">
                Eleva la Atención de tu Empresa.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary-container to-secondary">
                  Infraestructura Omnicanal
                </span>{' '}
                y Talento de Élite.
              </h1>

              {/* Persuasive Subtitle */}
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl mt-space-md mb-space-xl">
                Conecta a tus clientes con agentes bilingües altamente capacitados, respaldo en
                telecomunicaciones WebRTC de baja latencia y visibilidad en tiempo real a través de nuestro portal de
                supervisión ejecutiva.
              </p>

              {/* Action Button Group */}
              <div className="flex flex-wrap items-center justify-center gap-space-md mb-space-lg">
                <a
                  className="inline-flex items-center gap-space-xs px-space-xl py-space-md font-body-md font-semibold text-on-primary-container bg-primary-container rounded-full shadow-[0_0_24px_rgba(0,230,118,0.4)] hover:shadow-[0_0_36px_rgba(0,230,118,0.7)] hover:brightness-105 transition-all"
                  href="#demo"
                >
                  <span>Hablar con Ventas</span>
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </a>
                <a
                  className="inline-flex items-center gap-space-xs px-space-xl py-space-md font-body-md font-medium text-on-surface bg-surface-container-high/60 hover:bg-surface-bright/80 rounded-full backdrop-blur-xl shadow-md transition-all border border-white/5"
                  href="#showcase"
                >
                  <span className="material-symbols-outlined text-secondary text-lg">play_circle</span>
                  <span>Explorar Plataforma</span>
                </a>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center justify-center gap-space-lg text-on-surface-variant font-label-tag text-label-tag">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-primary text-base">check_circle</span>
                  <span>Despliegue en 48 horas</span>
                </div>
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-primary text-base">verified</span>
                  <span>99.98% SLA Garantizado</span>
                </div>
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-primary text-base">lock_open_right</span>
                  <span>Sin contratos forzosos</span>
                </div>
              </div>
            </div>
          </section>

          {/* PRODUCT SHOWCASE / GLASS FLOATING HUD */}
          <section className="relative w-full px-margin pb-space-xl" id="showcase">
            <div className="max-w-7xl mx-auto">
              {/* Holographic Card Perspective Container */}
              <div className="relative rounded-xl bg-surface-container-low/70 backdrop-blur-2xl p-space-md sm:p-space-lg shadow-[0_24px_64px_-12px_rgba(0,0,0,0.85)] border border-white/10">
                {/* Live Window Header Bar */}
                <div className="flex flex-wrap items-center justify-between pb-space-md mb-space-md bg-surface-container-lowest/60 px-space-md py-space-sm rounded-lg border border-white/5">
                  <div className="flex items-center gap-space-sm">
                    <div className="flex gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-error/80" />
                      <span className="w-3 h-3 rounded-full bg-secondary-fixed/50" />
                      <span className="w-3 h-3 rounded-full bg-primary/80" />
                    </div>
                    <span className="font-label-code text-label-code text-on-surface-variant ml-space-xs">
                      vooxline-cluster://node-us-east-1.live-telemetry
                    </span>
                  </div>
                  <div className="flex items-center gap-space-md">
                    <div className="flex items-center gap-space-xs bg-surface-container-high px-space-sm py-0.5 rounded-full border border-white/5">
                      <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse" />
                      <span className="font-label-code text-label-code text-primary">SIP POOL ONLINE (1,248 TPS)</span>
                    </div>
                    <span className="font-label-numeric text-label-numeric text-secondary hidden sm:inline">
                      RTT: 14.2ms
                    </span>
                  </div>
                </div>

                {/* Dashboard Layout Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md" id="tecnologia">
                  {/* Column Left: KPI Cluster */}
                  <div className="lg:col-span-4 flex flex-col gap-space-md">
                    {/* Real-time SLA Card */}
                    <div className="p-space-md rounded-lg bg-surface-container/60 backdrop-blur-xl shadow-inner flex flex-col justify-between border border-white/5">
                      <div className="flex items-center justify-between">
                        <span className="font-label-code text-label-code text-on-surface-variant">
                          SLA DE RESPUESTA VOZ
                        </span>
                        <span className="font-label-tag text-label-tag px-space-xs py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                          +1.8% vs obj
                        </span>
                      </div>
                      <div className="flex items-baseline gap-space-sm mt-space-sm">
                        <span className="font-display-hero-mobile text-display-hero-mobile font-bold text-on-surface">
                          96.5%
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">&lt; 20 segs</span>
                      </div>
                      {/* Mini Sparkline inline SVG */}
                      <div className="w-full h-8 mt-space-xs">
                        <svg className="w-full h-full stroke-primary fill-none stroke-2" viewBox="0 0 200 40">
                          <path d="M0,32 Q25,28 50,15 T100,18 T150,8 T200,4" />
                          <path
                            className="fill-primary/10 stroke-none"
                            d="M0,32 Q25,28 50,15 T100,18 T150,8 T200,4 L200,40 L0,40 Z"
                          />
                        </svg>
                      </div>
                    </div>

                    {/* TMO Speed & Queue Velocity */}
                    <div className="p-space-md rounded-lg bg-surface-container/60 backdrop-blur-xl shadow-inner flex flex-col justify-between border border-white/5">
                      <div className="flex items-center justify-between">
                        <span className="font-label-code text-label-code text-on-surface-variant">
                          TMO PROMEDIO RESOLUTIVO
                        </span>
                        <span className="material-symbols-outlined text-secondary text-sm">timelapse</span>
                      </div>
                      <div className="flex items-baseline gap-space-sm mt-space-sm">
                        <span className="font-headline-lg text-headline-lg font-bold text-on-surface">03:15</span>
                        <span className="font-label-numeric text-label-numeric text-secondary">-42s delta</span>
                      </div>
                      <div className="w-full bg-surface-container-highest rounded-full h-1.5 mt-space-sm overflow-hidden">
                        <div className="bg-secondary-fixed-dim h-full rounded-full w-[78%]" />
                      </div>
                    </div>

                    {/* Active Channels Telemetry */}
                    <div className="p-space-md rounded-lg bg-surface-container/60 backdrop-blur-xl shadow-inner border border-white/5">
                      <div className="flex items-center justify-between mb-space-sm">
                        <span className="font-label-code text-label-code text-on-surface-variant">
                          CONCURRENCIA GLOBAL
                        </span>
                        <span className="font-label-code text-label-code text-primary">CAPACIDAD: 84%</span>
                      </div>
                      <div className="grid grid-cols-3 gap-space-xs text-center">
                        <div className="p-space-xs rounded bg-surface-container-low border border-white/5">
                          <div className="font-headline-sm text-headline-sm text-primary">842</div>
                          <div className="font-label-code text-[10px] text-on-surface-variant">VOZ SIP</div>
                        </div>
                        <div className="p-space-xs rounded bg-surface-container-low border border-white/5">
                          <div className="font-headline-sm text-headline-sm text-secondary">1.2k</div>
                          <div className="font-label-code text-[10px] text-on-surface-variant">WHATSAPP</div>
                        </div>
                        <div className="p-space-xs rounded bg-surface-container-low border border-white/5">
                          <div className="font-headline-sm text-headline-sm text-on-surface">319</div>
                          <div className="font-label-code text-[10px] text-on-surface-variant">WEB CHAT</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Column Center: Visual Architecture & Live Waveform */}
                  <div className="lg:col-span-8 flex flex-col gap-space-md">
                    <div className="relative p-space-lg rounded-lg bg-surface-container/70 backdrop-blur-xl flex flex-col justify-between overflow-hidden min-h-[340px] border border-white/5">
                      {/* Cybernetic Mesh Background Accent */}
                      <div className="absolute -right-16 -top-16 w-80 h-80 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
                      <div className="flex flex-wrap items-center justify-between gap-space-sm z-10">
                        <div>
                          <h3 className="font-headline-sm text-headline-sm text-on-surface">
                            Supervisión Ejecutiva de Tráfico Omnicanal
                          </h3>
                          <p className="font-body-sm text-body-sm text-on-surface-variant">
                            Ruteo predictivo multi-agente con evaluación acústica en tiempo real
                          </p>
                        </div>
                        <div className="flex items-center gap-space-xs bg-surface-container-highest/80 px-space-sm py-1 rounded-md border border-white/10">
                          <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                          <span className="font-label-code text-label-code text-on-surface">STREAMING ACTIVO</span>
                        </div>
                      </div>

                      {/* Center Graphic Architecture / Live Frequency Nodes */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-space-sm my-space-md z-10">
                        <div className="p-space-sm rounded-lg bg-surface-container-low/80 flex flex-col justify-between border border-white/5">
                          <div className="flex items-center justify-between text-on-surface-variant">
                            <span className="font-label-code text-label-code">NODO BOG-1</span>
                            <span className="material-symbols-outlined text-xs text-primary">circle</span>
                          </div>
                          <div className="font-headline-sm text-headline-sm text-on-surface mt-space-xs">12.4ms</div>
                          <span className="font-label-code text-[10px] text-primary">SRTP AES-256</span>
                        </div>
                        <div className="p-space-sm rounded-lg bg-surface-container-low/80 flex flex-col justify-between border border-white/5">
                          <div className="flex items-center justify-between text-on-surface-variant">
                            <span className="font-label-code text-label-code">NODO CDMX-2</span>
                            <span className="material-symbols-outlined text-xs text-primary">circle</span>
                          </div>
                          <div className="font-headline-sm text-headline-sm text-on-surface mt-space-xs">18.1ms</div>
                          <span className="font-label-code text-[10px] text-primary">G.711 / OPUS</span>
                        </div>
                        <div className="p-space-sm rounded-lg bg-surface-container-low/80 flex flex-col justify-between border border-white/5">
                          <div className="flex items-center justify-between text-on-surface-variant">
                            <span className="font-label-code text-label-code">NODO MIA-0</span>
                            <span className="material-symbols-outlined text-xs text-primary">circle</span>
                          </div>
                          <div className="font-headline-sm text-headline-sm text-on-surface mt-space-xs">9.8ms</div>
                          <span className="font-label-code text-[10px] text-primary">DIRECT TRUNK</span>
                        </div>
                        <div className="p-space-sm rounded-lg bg-surface-container-low/80 flex flex-col justify-between border border-white/5">
                          <div className="flex items-center justify-between text-on-surface-variant">
                            <span className="font-label-code text-label-code">NODO SCL-1</span>
                            <span className="material-symbols-outlined text-xs text-primary">circle</span>
                          </div>
                          <div className="font-headline-sm text-headline-sm text-on-surface mt-space-xs">21.0ms</div>
                          <span className="font-label-code text-[10px] text-primary">WEBRTC EDGE</span>
                        </div>
                      </div>

                      {/* Animated Waveform Bars Container */}
                      <div className="z-10 bg-surface-container-lowest/80 p-space-sm rounded-lg flex items-center justify-between gap-1 overflow-hidden border border-white/5">
                        <div className="flex items-center gap-space-sm">
                          <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-base">mic</span>
                          </div>
                          <div>
                            <div className="font-label-code text-label-code text-on-surface">VOICE QA LIVE ANALYSIS</div>
                            <div className="font-body-sm text-[11px] text-on-surface-variant">
                              Sentimiento Positivo: 94.2% | Ruido de fondo: &lt; -48dB
                            </div>
                          </div>
                        </div>

                        {/* Frequency bars */}
                        <div className="flex items-end gap-1 h-8">
                          <span className="w-1 bg-primary/60 rounded-full h-3 animate-pulse" />
                          <span className="w-1 bg-primary rounded-full h-6 animate-pulse" />
                          <span className="w-1 bg-secondary rounded-full h-4 animate-pulse" />
                          <span className="w-1 bg-primary-container rounded-full h-7 animate-pulse" />
                          <span className="w-1 bg-secondary-fixed rounded-full h-3 animate-pulse" />
                          <span className="w-1 bg-primary rounded-full h-8 animate-pulse" />
                          <span className="w-1 bg-primary/70 rounded-full h-5 animate-pulse" />
                          <span className="w-1 bg-secondary rounded-full h-2 animate-pulse" />
                        </div>
                      </div>
                    </div>

                    {/* Real-time Agent Dispatch List Table */}
                    <div className="rounded-lg bg-surface-container/60 backdrop-blur-xl p-space-md overflow-x-auto border border-white/5">
                      <div className="flex items-center justify-between mb-space-sm">
                        <span className="font-label-code text-label-code text-on-surface-variant uppercase">
                          Estatus de Supervisión por Operador Nivel 2
                        </span>
                        <span className="font-label-numeric text-label-numeric text-primary text-xs">
                          ACTIVOS: 148 / 150
                        </span>
                      </div>
                      <table className="w-full text-left text-body-sm">
                        <thead>
                          <tr className="text-on-surface-variant font-label-code text-xs">
                            <th className="pb-space-xs font-normal">AGENTE</th>
                            <th className="pb-space-xs font-normal">ESPECIALIDAD</th>
                            <th className="pb-space-xs font-normal">ESTADO</th>
                            <th className="pb-space-xs font-normal">DURACIÓN</th>
                            <th className="pb-space-xs font-normal text-right">AUDITORÍA QA</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y-0 font-body-sm">
                          <tr className="hover:bg-surface-container-high/40 transition-colors">
                            <td className="py-space-xs flex items-center gap-space-xs">
                              <span className="w-2 h-2 rounded-full bg-primary-container" />
                              <span className="text-on-surface font-medium">Camila Restrepo</span>
                            </td>
                            <td className="py-space-xs text-on-surface-variant">Fintech Tier-2 (Bilingüe)</td>
                            <td className="py-space-xs">
                              <span className="px-space-xs py-0.5 rounded text-xs bg-primary/10 text-primary border border-primary/20">
                                En Llamada
                              </span>
                            </td>
                            <td className="py-space-xs font-label-numeric text-on-surface">04:12 min</td>
                            <td className="py-space-xs text-right font-label-numeric text-primary">99.2% Score</td>
                          </tr>
                          <tr className="hover:bg-surface-container-high/40 transition-colors">
                            <td className="py-space-xs flex items-center gap-space-xs">
                              <span className="w-2 h-2 rounded-full bg-primary-container" />
                              <span className="text-on-surface font-medium">Esteban Morales</span>
                            </td>
                            <td className="py-space-xs text-on-surface-variant">Legal SaaS Escalamiento</td>
                            <td className="py-space-xs">
                              <span className="px-space-xs py-0.5 rounded text-xs bg-secondary/10 text-secondary border border-secondary/20">
                                Ruteo WhatsApp
                              </span>
                            </td>
                            <td className="py-space-xs font-label-numeric text-on-surface">01:45 min</td>
                            <td className="py-space-xs text-right font-label-numeric text-primary">97.8% Score</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SOCIAL PROOF / ENTERPRISE AUTHORITY */}
          <section className="w-full px-margin py-space-lg" id="casos-de-exito">
            <div className="max-w-7xl mx-auto flex flex-col items-center">
              <p className="font-label-code text-label-code text-on-surface-variant uppercase tracking-widest text-center mb-space-lg">
                Tecnología y talento respaldando a operaciones B2B líderes en la región
              </p>
              <div className="w-full flex flex-wrap items-center justify-around gap-space-lg opacity-70 hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-secondary text-2xl">balance</span>
                  <span className="font-headline-sm text-headline-sm tracking-widest text-on-surface uppercase font-bold">
                    VOG Legal
                  </span>
                </div>
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-primary text-2xl">account_balance</span>
                  <span className="font-headline-sm text-headline-sm tracking-widest text-on-surface uppercase font-bold">
                    Nexus Fintech
                  </span>
                </div>
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-secondary-fixed text-2xl">clinical_notes</span>
                  <span className="font-headline-sm text-headline-sm tracking-widest text-on-surface uppercase font-bold">
                    Alvia Health
                  </span>
                </div>
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-on-surface-variant text-2xl">local_shipping</span>
                  <span className="font-headline-sm text-headline-sm tracking-widest text-on-surface uppercase font-bold">
                    Metro Log
                  </span>
                </div>
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-primary text-2xl">cloud_sync</span>
                  <span className="font-headline-sm text-headline-sm tracking-widest text-on-surface uppercase font-bold">
                    Vertex Corp
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* VALUE PROPOSITION (GRID DE CRISTAL) */}
          <section className="w-full px-margin py-space-xl" id="ventajas-b2b">
            <div className="max-w-7xl mx-auto">
              {/* Section Title Header */}
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-space-xl">
                <div>
                  <span className="font-label-code text-label-code text-secondary uppercase tracking-widest">
                    Nuestra Diferencia
                  </span>
                  <h2 className="font-headline-lg text-headline-lg text-on-surface mt-space-xs">
                    Por qué las empresas eligen Vooxline
                  </h2>
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-md mt-space-sm md:mt-0">
                  Supervisión milimétrica, talento humano sin precedentes e infraestructura de voz sin fricciones
                  tecnológicas.
                </p>
              </div>

              {/* 3 Glass Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg">
                {/* Card 1: Transparencia */}
                <div className="flex flex-col justify-between p-space-lg rounded-xl bg-surface-container-low/60 backdrop-blur-xl shadow-lg hover:shadow-[0_16px_36px_-4px_rgba(0,230,118,0.15)] transition-all group border border-white/5">
                  <div>
                    <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center mb-space-md group-hover:scale-110 transition-transform text-secondary border border-white/5">
                      <span className="material-symbols-outlined text-2xl">visibility</span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface mb-space-sm">
                      Transparencia Absoluta
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                      Acceso ilimitado al Dashboard de Cliente B2B en tiempo real. Audita grabaciones, visualiza
                      telemetría de red, supervisa llamadas activas y monitorea el gasto por minuto al segundo.
                    </p>
                  </div>
                  <div className="pt-space-md mt-space-md">
                    <span className="inline-flex items-center gap-1 font-label-tag text-label-tag text-secondary bg-surface-container px-space-sm py-1 rounded-full border border-white/5">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                      Dashboard Ejecutivo Incluido
                    </span>
                  </div>
                </div>

                {/* Card 2: Talento Nivel 2 */}
                <div className="flex flex-col justify-between p-space-lg rounded-xl bg-surface-container-low/60 backdrop-blur-xl shadow-lg hover:shadow-[0_16px_36px_-4px_rgba(0,230,118,0.15)] transition-all group border border-white/5">
                  <div>
                    <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center mb-space-md group-hover:scale-110 transition-transform text-primary border border-white/5">
                      <span className="material-symbols-outlined text-2xl">verified_user</span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface mb-space-sm">
                      Talento Especializado Nivel 2
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                      No somos un call center tradicional. Asignamos operadores bilingües de alto perfil, entrenados
                      específicamente en tu industria (FinTech, Legal, Salud y SaaS) con supervisión continua de QA.
                    </p>
                  </div>
                  <div className="pt-space-md mt-space-md">
                    <span className="inline-flex items-center gap-1 font-label-tag text-label-tag text-primary bg-surface-container px-space-sm py-1 rounded-full border border-white/5">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Certificación SLA 96%+
                    </span>
                  </div>
                </div>

                {/* Card 3: Infraestructura Flexible */}
                <div className="flex flex-col justify-between p-space-lg rounded-xl bg-surface-container-low/60 backdrop-blur-xl shadow-lg hover:shadow-[0_16px_36px_-4px_rgba(0,230,118,0.15)] transition-all group border border-white/5">
                  <div>
                    <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center mb-space-md group-hover:scale-110 transition-transform text-secondary-fixed border border-white/5">
                      <span className="material-symbols-outlined text-2xl">hub</span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface mb-space-sm">
                      Infraestructura Flexible &amp; SIP Trunking
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                      Troncales SIP redundantes con códec G.711 de alta fidelidad, latencia ultra baja (&lt;25ms) y
                      compatibilidad total con Twilio, Asterisk, Genesys y WebRTC sin requerir hardware físico.
                    </p>
                  </div>
                  <div className="pt-space-md mt-space-md">
                    <span className="inline-flex items-center gap-1 font-label-tag text-label-tag text-secondary-fixed bg-surface-container px-space-sm py-1 rounded-full border border-white/5">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary-fixed" />
                      Cifrado TLS 1.3 / SRTP
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* KEY METRICS & BENCHMARK */}
          <section className="w-full px-margin py-space-xl bg-surface-container-lowest/50" id="precios">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-space-lg text-center">
                <div className="flex flex-col items-center p-space-md bg-surface-container-low/40 rounded-xl border border-white/5">
                  <span className="font-display-hero text-display-hero text-transparent bg-clip-text bg-gradient-to-br from-primary to-primary-container font-bold">
                    +1.4M
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant mt-space-xs">
                    Llamadas Atendidas al Mes
                  </span>
                  <span className="font-label-code text-[11px] text-primary mt-1">Escalabilidad Dinámica</span>
                </div>
                <div className="flex flex-col items-center p-space-md bg-surface-container-low/40 rounded-xl border border-white/5">
                  <span className="font-display-hero text-display-hero text-transparent bg-clip-text bg-gradient-to-br from-secondary to-secondary-fixed font-bold">
                    96.5%
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant mt-space-xs">
                    Nivel de Servicio Cumplido
                  </span>
                  <span className="font-label-code text-[11px] text-secondary mt-1">Auditoría en Tiempo Real</span>
                </div>
                <div className="flex flex-col items-center p-space-md bg-surface-container-low/40 rounded-xl border border-white/5">
                  <span className="font-display-hero text-display-hero text-transparent bg-clip-text bg-gradient-to-br from-primary-fixed to-primary font-bold">
                    -38%
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant mt-space-xs">
                    Reducción en Costos de Operación
                  </span>
                  <span className="font-label-code text-[11px] text-primary-fixed mt-1">Eficiencia de Talento</span>
                </div>
                <div className="flex flex-col items-center p-space-md bg-surface-container-low/40 rounded-xl border border-white/5">
                  <span className="font-display-hero text-display-hero text-transparent bg-clip-text bg-gradient-to-br from-secondary-fixed-dim to-secondary font-bold">
                    &lt; 18ms
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant mt-space-xs">
                    Latencia de Voz SIP Dedicada
                  </span>
                  <span className="font-label-code text-[11px] text-secondary-fixed-dim mt-1">
                    Nodos Edge Redundantes
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* CALL TO ACTION FINAL / CONVERSION BANNER */}
          <section className="w-full px-margin py-space-xl" id="demo">
            <div className="max-w-6xl mx-auto relative rounded-2xl bg-gradient-to-br from-surface-container-high via-surface-container to-surface-container-low p-space-xl shadow-[0_24px_64px_-12px_rgba(0,230,118,0.2)] overflow-hidden border border-white/10">
              {/* Ambient Backlight */}
              <div className="absolute -right-24 -bottom-24 w-96 h-96 bg-primary-container/20 rounded-full blur-[120px] pointer-events-none" />

              <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-space-xl">
                <div className="max-w-2xl text-center lg:text-left">
                  <div className="inline-flex items-center gap-space-xs px-space-sm py-1 rounded-full bg-surface-container-lowest text-primary font-label-code text-xs mb-space-md border border-white/5">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    <span>PILOTO SIN COMPROMISO</span>
                  </div>
                  <h2 className="font-headline-lg text-headline-lg text-on-surface">
                    ¿Listo para transformar la experiencia de tus clientes corporativos?
                  </h2>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-space-sm">
                    Agenda una demostración guiada de 15 minutos y obtén un piloto con 2 agentes dedicados sin
                    compromiso.
                  </p>
                </div>

                {/* Form Capture Box */}
                <div className="w-full lg:w-auto flex-1 max-w-md">
                  <form
                    onSubmit={handleLeadSubmit}
                    className="flex flex-col gap-space-sm bg-surface-container-lowest/80 p-space-md rounded-xl backdrop-blur-xl shadow-inner border border-white/10"
                    id="lead-form"
                  >
                    <div className="flex flex-col gap-1">
                      <label className="font-label-code text-xs text-on-surface-variant" htmlFor="lead-email">
                        CORREO CORPORATIVO
                      </label>
                      <input
                        className="w-full bg-surface-container-high px-space-md py-space-sm rounded-lg font-body-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-1 focus:ring-primary shadow-sm border border-white/5"
                        id="lead-email"
                        placeholder="ejemplo@tuempresa.com"
                        required
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <button
                      className="w-full mt-space-xs inline-flex items-center justify-center gap-space-xs px-space-md py-space-sm font-body-md font-semibold text-on-primary-container bg-primary-container rounded-lg shadow-[0_0_20px_rgba(0,230,118,0.4)] hover:shadow-[0_0_28px_rgba(0,230,118,0.65)] hover:brightness-105 transition-all cursor-pointer"
                      type="submit"
                    >
                      <span>Agendar Demo en Vivo</span>
                      <span className="material-symbols-outlined text-base">calendar_month</span>
                    </button>
                    <p
                      className={`text-center font-label-code text-[11px] mt-1 transition-colors ${
                        formSubmitted ? 'text-primary font-bold' : 'text-on-surface-variant'
                      }`}
                      id="form-feedback"
                    >
                      {formSubmitted
                        ? '¡Solicitud recibida con éxito! Un director técnico te contactará en breve.'
                        : 'Confirmación inmediata de llamada con un Arquitecto de Soluciones.'}
                    </p>
                  </form>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 w-full bg-surface-container-lowest/80 backdrop-blur-xl mt-space-xl border-t border-white/5">
        <div className="max-w-7xl mx-auto px-margin py-space-xl flex flex-col gap-space-lg">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-space-lg">
            <div className="flex flex-col gap-space-xs">
              <div className="flex items-center gap-space-sm">
                <div className="relative flex items-center justify-center w-6 h-6">
                  <div className="w-4 h-4 rounded-full border border-primary-container absolute -left-1 opacity-90" />
                  <div className="w-4 h-4 rounded-full border border-secondary absolute -right-1 opacity-80" />
                </div>
                <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">Vooxline</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                SaaS Inteligente y Plataforma de Contact Center Gestionado B2B de Alta Disponibilidad.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-space-md">
              <div className="flex items-center gap-space-xs bg-surface-container-low px-space-sm py-space-xs rounded-full shadow-inner border border-white/5">
                <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse" />
                <span className="font-label-code text-label-code text-primary">TLS 1.3 ENCRYPTED</span>
              </div>
              <div className="flex items-center gap-space-xs bg-surface-container-low px-space-sm py-space-xs rounded-full shadow-inner border border-white/5">
                <span className="material-symbols-outlined text-secondary text-sm">verified_user</span>
                <span className="font-label-code text-label-code text-secondary">HIPAA COMPLIANT</span>
              </div>
              <div className="flex items-center gap-space-xs bg-surface-container-low px-space-sm py-space-xs rounded-full shadow-inner border border-white/5">
                <span className="material-symbols-outlined text-on-surface-variant text-sm">shield</span>
                <span className="font-label-code text-label-code text-on-surface-variant">SOC2 TYPE II</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-space-md pt-space-md text-on-surface-variant font-body-sm text-body-sm border-t border-white/5">
            <div className="flex flex-wrap items-center gap-space-md">
              <a
                className="hover:text-primary transition-colors flex items-center gap-space-xs"
                href="mailto:contacto@vooxline.com"
              >
                <span className="material-symbols-outlined text-base">mail</span>
                contacto@vooxline.com
              </a>
              <a className="hover:text-on-surface transition-colors" href="#privacidad">
                Privacidad
              </a>
              <a className="hover:text-on-surface transition-colors" href="#terminos">
                Términos de Servicio
              </a>
              <a className="hover:text-on-surface transition-colors" href="#sla">
                SLA 99.99%
              </a>
            </div>
            <p className="font-label-numeric text-label-numeric text-on-surface-variant">
              © 2024 Vooxline Inc. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>

      {/* Floating Quick Navigation Switcher for Easy Testing */}
      <div className="fixed bottom-4 right-4 z-50 bg-[#13151c]/95 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2 shadow-2xl flex items-center gap-3 font-label-code text-xs">
        <span className="flex items-center gap-1.5 text-primary font-bold">
          <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
          RUTAS:
        </span>
        <Link to="/" className="text-primary font-bold hover:underline">
          / (Index)
        </Link>
        <span className="text-white/20">|</span>
        <Link to="/login" className="text-on-surface-variant hover:text-white">
          /login
        </Link>
        <span className="text-white/20">|</span>
        <Link to="/agente" className="text-on-surface-variant hover:text-white">
          /agente
        </Link>
        <span className="text-white/20">|</span>
        <Link to="/cliente" className="text-on-surface-variant hover:text-white">
          /cliente
        </Link>
        <span className="text-white/20">|</span>
        <Link to="/admin" className="text-on-surface-variant hover:text-white">
          /admin
        </Link>
      </div>
    </div>
  );
};

export default LandingPage;
