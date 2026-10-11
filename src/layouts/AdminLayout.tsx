import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { VooxlineLogo } from '@/components/common/VooxlineLogo';

export type { AdminContextType } from './useAdminContext';

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const [lang, setLang] = useState<'es' | 'en'>('es');

  // Helper function to check if route is active
  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin' || location.pathname === '/admin/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="bg-[#0B0C10] font-body-md text-on-surface antialiased min-h-screen">
      {/* Sidebar Fijo de Navegación Maestro */}
      <aside className="fixed left-0 top-0 h-full w-72 bg-[#13151c]/90 backdrop-blur-2xl z-50 flex flex-col justify-between border-r border-white/10 shadow-[0_12px_32px_rgba(0,0,0,0.8)]">
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header del Sidebar con Logo Oficial */}
          <div className="h-20 px-space-lg flex items-center justify-between border-b border-white/5 flex-shrink-0">
            <Link to="/" className="flex items-center gap-space-sm" title="Ir a inicio">
              <VooxlineLogo size="sm" showSubtitle={false} />
            </Link>
            <span className="px-space-xs py-0.5 rounded-full bg-primary-container text-on-primary-container font-label-tag text-[10px] tracking-wider uppercase font-bold shadow-[0_0_12px_rgba(0,230,118,0.35)]">
              SUPER ADMIN
            </span>
          </div>

          {/* Menú de Navegación del Centro de Mando */}
          <div
            className="flex-1 overflow-y-auto px-space-md py-space-sm space-y-space-md"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(255,255,255,0.1) transparent',
            }}
          >
            {/* General Section */}
            <div>
              <span className="px-space-sm font-label-code text-[11px] text-on-surface-variant uppercase tracking-widest opacity-60 block mb-1">
                {lang === 'es' ? 'General' : 'General'}
              </span>
              <div className="flex flex-col gap-0.5">
                {/* 1. Visión General (Overview) */}
                <Link
                  to="/admin"
                  className={`flex items-center justify-between px-space-sm py-2 rounded-xl transition-all ${
                    isActive('/admin') && location.pathname !== '/admin/activity' && location.pathname !== '/admin/monitor' && location.pathname !== '/admin/users'
                      ? 'bg-primary/15 text-primary border-l-[3px] border-primary shadow-[0_0_20px_rgba(102,252,241,0.2)] font-semibold'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`}
                >
                  <div className="flex items-center gap-space-sm">
                    <span className={`material-symbols-outlined text-[19px] ${isActive('/admin') && location.pathname !== '/admin/activity' && location.pathname !== '/admin/monitor' && location.pathname !== '/admin/users' ? 'text-primary' : ''}`}>
                      grid_view
                    </span>
                    <span className="font-body-sm text-body-sm">
                      {lang === 'es' ? 'Visión General' : 'Overview'}
                    </span>
                  </div>
                  {isActive('/admin') && location.pathname !== '/admin/activity' && location.pathname !== '/admin/monitor' && location.pathname !== '/admin/users' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_#66FCF1]" />
                  )}
                </Link>

                {/* 2. Actividad (Activity) */}
                <Link
                  to="/admin/activity"
                  className={`flex items-center justify-between px-space-sm py-2 rounded-xl transition-all ${
                    isActive('/admin/activity')
                      ? 'bg-primary/15 text-primary border-l-[3px] border-primary shadow-[0_0_20px_rgba(102,252,241,0.2)] font-semibold'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`}
                >
                  <div className="flex items-center gap-space-sm">
                    <span className={`material-symbols-outlined text-[19px] ${isActive('/admin/activity') ? 'text-primary' : ''}`}>
                      insights
                    </span>
                    <span className="font-body-sm text-body-sm">
                      {lang === 'es' ? 'Historial de Actividad' : 'Activity History'}
                    </span>
                  </div>
                  {isActive('/admin/activity') && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_#66FCF1]" />
                  )}
                </Link>

                {/* 3. Monitor en Vivo (Live Monitor) */}
                <Link
                  to="/admin/monitor"
                  className={`flex items-center justify-between px-space-sm py-2 rounded-xl transition-all group ${
                    isActive('/admin/monitor')
                      ? 'bg-primary/15 text-primary border-l-[3px] border-primary shadow-[0_0_20px_rgba(102,252,241,0.2)] font-semibold'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`}
                >
                  <div className="flex items-center gap-space-sm">
                    <span className={`material-symbols-outlined text-[19px] ${isActive('/admin/monitor') ? 'text-primary' : 'group-hover:text-primary transition-colors'}`}>
                      desktop_windows
                    </span>
                    <span className="font-body-sm text-body-sm">
                      {lang === 'es' ? 'Monitor en Vivo' : 'Live Monitor'}
                    </span>
                  </div>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                    <span className="font-label-tag text-[10px] text-primary font-bold tracking-wider">LIVE</span>
                  </span>
                </Link>
              </div>
            </div>

            <div className="h-px w-full bg-white/5" />

            {/* Users & Groups Section */}
            <div>
              <span className="px-space-sm font-label-code text-[11px] text-on-surface-variant uppercase tracking-widest opacity-60 block mb-1">
                {lang === 'es' ? 'Usuarios y Grupos' : 'Users & Groups'}
              </span>
              <div className="flex flex-col gap-0.5">
                {/* 4. Usuarios (Users) */}
                <Link
                  to="/admin/users"
                  className={`flex items-center justify-between px-space-sm py-2 rounded-xl transition-all ${
                    isActive('/admin/users')
                      ? 'bg-primary/15 text-primary border-l-[3px] border-primary shadow-[0_0_20px_rgba(102,252,241,0.2)] font-semibold'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`}
                >
                  <div className="flex items-center gap-space-sm">
                    <span className={`material-symbols-outlined text-[19px] ${isActive('/admin/users') ? 'text-primary' : ''}`}>
                      group
                    </span>
                    <span className="font-body-sm text-body-sm">
                      {lang === 'es' ? 'Directorio Usuarios' : 'Users Directory'}
                    </span>
                  </div>
                  {isActive('/admin/users') ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_#66FCF1]" />
                  ) : (
                    <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-label-tag text-[10px]">
                      18
                    </span>
                  )}
                </Link>
                <Link
                  to="/admin/groups"
                  className={`flex items-center gap-space-sm px-space-sm py-2 rounded-xl transition-all ${
                    isActive('/admin/groups')
                      ? 'bg-primary/15 text-primary border-l-[3px] border-primary shadow-[0_0_20px_rgba(102,252,241,0.2)] font-semibold'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[19px]">hub</span>
                  <span className="font-body-sm text-body-sm">
                    {lang === 'es' ? 'Grupos Inteligentes' : 'Smart groups'}
                  </span>
                </Link>
                <Link
                  to="/admin/automations"
                  className={`flex items-center gap-space-sm px-space-sm py-2 rounded-xl transition-all ${
                    isActive('/admin/automations')
                      ? 'bg-primary/15 text-primary border-l-[3px] border-primary shadow-[0_0_20px_rgba(102,252,241,0.2)] font-semibold'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[19px]">auto_awesome</span>
                  <span className="font-body-sm text-body-sm">
                    {lang === 'es' ? 'Automatizaciones' : 'Automations'}
                  </span>
                </Link>
              </div>
            </div>

            <div className="h-px w-full bg-white/5" />

            {/* Communication Section */}
            <div>
              <span className="px-space-sm font-label-code text-[11px] text-on-surface-variant uppercase tracking-widest opacity-60 block mb-1">
                {lang === 'es' ? 'Comunicación' : 'Communication'}
              </span>
              <div className="flex flex-col gap-0.5">
                <Link
                  to="/admin/chat"
                  className={`flex items-center justify-between px-space-sm py-2 rounded-xl transition-all ${
                    isActive('/admin/chat')
                      ? 'bg-primary/15 text-primary border-l-[3px] border-primary shadow-[0_0_20px_rgba(102,252,241,0.2)] font-semibold'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`}
                >
                  <div className="flex items-center gap-space-sm">
                    <span className="material-symbols-outlined text-[19px]">chat_bubble</span>
                    <span className="font-body-sm text-body-sm">Chat</span>
                  </div>
                  <span className="px-1.5 py-0.2 rounded-full bg-secondary-container/20 text-secondary font-label-tag text-[10px] font-bold">
                    5
                  </span>
                </Link>
                <Link
                  to="/admin/updates"
                  className={`flex items-center gap-space-sm px-space-sm py-2 rounded-xl transition-all ${
                    isActive('/admin/updates')
                      ? 'bg-primary/15 text-primary border-l-[3px] border-primary shadow-[0_0_20px_rgba(102,252,241,0.2)] font-semibold'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[19px]">campaign</span>
                  <span className="font-body-sm text-body-sm">
                    {lang === 'es' ? 'Actualizaciones' : 'Updates'}
                  </span>
                </Link>
                <Link
                  to="/admin/directory"
                  className={`flex items-center gap-space-sm px-space-sm py-2 rounded-xl transition-all ${
                    isActive('/admin/directory')
                      ? 'bg-primary/15 text-primary border-l-[3px] border-primary shadow-[0_0_20px_rgba(102,252,241,0.2)] font-semibold'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[19px]">contact_page</span>
                  <span className="font-body-sm text-body-sm">
                    {lang === 'es' ? 'Directorio' : 'Directory'}
                  </span>
                </Link>
                <Link
                  to="/admin/forms"
                  className={`flex items-center gap-space-sm px-space-sm py-2 rounded-xl transition-all ${
                    isActive('/admin/forms')
                      ? 'bg-primary/15 text-primary border-l-[3px] border-primary shadow-[0_0_20px_rgba(102,252,241,0.2)] font-semibold'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[19px]">assignment</span>
                  <span className="font-body-sm text-body-sm">
                    {lang === 'es' ? 'Formularios' : 'Forms'}
                  </span>
                </Link>
                <Link
                  to="/admin/helpdesk"
                  className={`flex items-center gap-space-sm px-space-sm py-2 rounded-xl transition-all ${
                    isActive('/admin/helpdesk')
                      ? 'bg-primary/15 text-primary border-l-[3px] border-primary shadow-[0_0_20px_rgba(102,252,241,0.2)] font-semibold'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[19px]">support_agent</span>
                  <span className="font-body-sm text-body-sm">
                    {lang === 'es' ? 'Mesa de Ayuda' : 'Help Desk'}
                  </span>
                </Link>
              </div>
            </div>

            <div className="h-px w-full bg-white/5" />

            {/* Operations Section */}
            <div>
              <span className="px-space-sm font-label-code text-[11px] text-on-surface-variant uppercase tracking-widest opacity-60 block mb-1">
                {lang === 'es' ? 'Operaciones' : 'Operations'}
              </span>
              <div className="flex flex-col gap-0.5">
                <Link
                  to="/agente"
                  className="flex items-center gap-space-sm px-space-sm py-2 rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all"
                >
                  <span className="material-symbols-outlined text-[19px]">schedule</span>
                  <span className="font-body-sm text-body-sm">
                    {lang === 'es' ? 'Reloj Checador' : 'Time Clock'}
                  </span>
                </Link>
                <Link
                  to="/cliente"
                  className="flex items-center gap-space-sm px-space-sm py-2 rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all"
                >
                  <span className="material-symbols-outlined text-[19px]">calendar_month</span>
                  <span className="font-body-sm text-body-sm">
                    {lang === 'es' ? 'Programación de Turnos' : 'Job Scheduling'}
                  </span>
                </Link>
                <Link
                  to="/admin/payroll"
                  className={`flex items-center justify-between px-space-sm py-2 rounded-xl transition-all group ${
                    isActive('/admin/payroll')
                      ? 'bg-primary/15 text-primary border-l-[3px] border-primary shadow-[0_0_20px_rgba(102,252,241,0.2)] font-semibold'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`}
                >
                  <div className="flex items-center gap-space-sm">
                    <span className="material-symbols-outlined text-[19px] text-primary group-hover:text-primary">
                      payments
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface font-medium">
                      {lang === 'es' ? 'Rentabilidad & Nómina' : 'Payroll & Profitability'}
                    </span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-primary-container/20 text-primary font-label-tag text-[10px] font-bold">
                    PRO
                  </span>
                </Link>
              </div>
            </div>

            <div className="h-px w-full bg-white/5" />

            {/* HR & Skills Section */}
            <div>
              <span className="px-space-sm font-label-code text-[11px] text-on-surface-variant uppercase tracking-widest opacity-60 block mb-1">
                {lang === 'es' ? 'Recursos Humanos' : 'HR & Skills'}
              </span>
              <div className="flex flex-col gap-0.5">
                <Link
                  to="/admin/celebrations"
                  className={`flex items-center gap-space-sm px-space-sm py-2 rounded-xl transition-all ${
                    isActive('/admin/celebrations')
                      ? 'bg-primary/15 text-primary border-l-[3px] border-primary shadow-[0_0_20px_rgba(102,252,241,0.2)] font-semibold'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[19px]">celebration</span>
                  <span className="font-body-sm text-body-sm">
                    {lang === 'es' ? 'Celebraciones' : 'Celebrations'}
                  </span>
                </Link>
                <Link
                  to="/admin/time-off"
                  className={`flex items-center justify-between px-space-sm py-2 rounded-xl transition-all ${
                    isActive('/admin/time-off')
                      ? 'bg-primary/15 text-primary border-l-[3px] border-primary shadow-[0_0_20px_rgba(102,252,241,0.2)] font-semibold'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`}
                >
                  <div className="flex items-center gap-space-sm">
                    <span className="material-symbols-outlined text-[19px]">event_busy</span>
                    <span className="font-body-sm text-body-sm">
                      {lang === 'es' ? 'Permisos y Ausencias' : 'Time Off'}
                    </span>
                  </div>
                  <span className="px-1.5 py-0.2 rounded-full bg-error-container text-on-error-container font-label-tag text-[10px] font-bold">
                    2
                  </span>
                </Link>
              </div>
            </div>
          </div>

          {/* Footer del Sidebar con Estado de Cifrado */}
          <div className="p-space-md border-t border-white/5 flex flex-col gap-space-xs flex-shrink-0 bg-surface-container-lowest/80">
            <div className="p-space-sm rounded-xl bg-surface-container-low/90 border border-white/5 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-label-tag text-[11px] text-on-surface-variant font-semibold">
                  256-BIT VAULT
                </span>
                <span className="w-2 h-2 rounded-full bg-primary-container shadow-[0_0_8px_rgba(0,230,118,0.7)] animate-pulse" />
              </div>
              <div className="flex items-center gap-space-xs font-label-code text-[11px] text-on-surface-variant">
                <span className="material-symbols-outlined text-[13px] text-secondary">lock</span>
                {lang === 'es' ? 'TLS 1.3 Cifrado Activo' : 'TLS 1.3 Active Encryption'}
              </div>
            </div>
            <Link
              to="/login"
              className="flex items-center gap-space-sm px-space-sm py-2 rounded-xl text-error hover:bg-error-container hover:text-on-error-container transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span className="font-body-sm text-body-sm font-medium">
                {lang === 'es' ? 'Cerrar Sesión' : 'Sign Out'}
              </span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Contenido Principal con Offset del Sidebar */}
      <div className="pl-72 min-h-screen flex flex-col">
        {/* Barra Superior Fija */}
        <header className="fixed top-0 left-72 right-0 h-20 bg-[#0B0C10]/85 backdrop-blur-2xl z-40 flex items-center justify-between px-space-lg shadow-[0_4px_20px_rgba(0,0,0,0.5)] border-b border-white/5">
          <div className="flex items-center gap-space-md">
            <div className="relative flex items-center w-72">
              <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-[18px]">
                search
              </span>
              <input
                className="w-full bg-surface-container-low text-on-surface placeholder:text-on-surface-variant pl-10 pr-space-md py-space-sm rounded-lg font-body-sm text-body-sm focus:outline-none focus:bg-surface-container focus:ring-1 focus:ring-primary/40 transition-all border border-white/5"
                placeholder={lang === 'es' ? 'Buscar telemetría, contratos, nómina...' : 'Search telemetry, contracts, payroll...'}
                type="text"
              />
            </div>
            <div className="flex items-center gap-space-xs bg-surface-container-low px-space-md py-space-sm rounded-full border border-white/5">
              <span className="material-symbols-outlined text-secondary text-[16px]">
                date_range
              </span>
              <span className="font-label-numeric text-label-numeric text-on-surface">
                21 Sep - 27 Sep
              </span>
            </div>
          </div>

          <div className="flex items-center gap-space-md">
            {/* Language Switcher Toggle EN / ES */}
            <div className="flex items-center p-1 bg-surface-container-high rounded-full border border-white/10 shadow-inner">
              <button
                type="button"
                onClick={() => setLang('es')}
                title="Cambiar a Español"
                className={`px-3 py-1 rounded-full text-xs font-label-code font-bold transition-all cursor-pointer ${
                  lang === 'es'
                    ? 'bg-primary text-on-primary shadow-[0_0_12px_rgba(0,230,118,0.5)]'
                    : 'text-on-surface-variant hover:text-white'
                }`}
              >
                ES
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                title="Switch to English"
                className={`px-3 py-1 rounded-full text-xs font-label-code font-bold transition-all cursor-pointer ${
                  lang === 'en'
                    ? 'bg-primary text-on-primary shadow-[0_0_12px_rgba(0,230,118,0.5)]'
                    : 'text-on-surface-variant hover:text-white'
                }`}
              >
                EN
              </button>
            </div>

            <button
              className="flex items-center gap-space-xs px-space-md py-space-sm rounded-full bg-surface-container-high hover:bg-surface-variant text-on-surface hover:text-on-surface transition-all font-label-tag text-label-tag cursor-pointer border border-white/5"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">file_download</span>
              {lang === 'es' ? 'Exportar CSV' : 'Export CSV'}
            </button>
            <div className="h-8 w-px bg-surface-variant" />
            <div className="flex items-center gap-space-md">
              <div className="flex flex-col text-right">
                <span className="font-body-sm text-body-sm font-semibold text-on-surface">
                  Alejandro Sterling
                </span>
                <span className="font-label-code text-label-code text-on-surface-variant">
                  CEO &amp; Owner
                </span>
              </div>
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-[0_0_12px_rgba(117,255,158,0.3)] font-bold text-on-primary text-xs">
                AS
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Outlet with Outlet Context for Child Pages */}
        <div className="w-full flex-1">
          <Outlet context={{ lang, setLang }} />
        </div>
      </div>
    </div>
  );
};
