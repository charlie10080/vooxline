import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { VooxlineLogo } from '@/components/common/VooxlineLogo';
import { 
  Headphones, 
  BarChart3, 
  ShieldAlert, 
  LogOut, 
  Activity,
  Terminal
} from 'lucide-react';

export const AppLayout: React.FC = () => {
  const location = useLocation();

  const navItems = [
    {
      name: 'Portal del Agente',
      path: '/agente',
      icon: Headphones,
      badge: 'Reloj & Consola',
    },
    {
      name: 'Dashboard B2B',
      path: '/cliente',
      icon: BarChart3,
      badge: 'Ejecutivo',
    },
    {
      name: 'Centro de Mando',
      path: '/admin',
      icon: ShieldAlert,
      badge: 'Nóminas & Campañas',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B0C10] text-[#C5C6C7] flex flex-col font-sans">
      {/* Top Enterprise Navigation Header */}
      <header className="sticky top-0 z-50 bg-[#0B0C10]/80 backdrop-blur-md border-b border-[#242E3B] px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <NavLink to="/">
              <VooxlineLogo size="sm" showSubtitle={false} />
            </NavLink>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1.5 bg-[#1F2833]/40 p-1 rounded-xl border border-[#242E3B]">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-[#66FCF1]/10 text-[#66FCF1] border border-[#66FCF1]/30 shadow-[0_0_12px_rgba(102,252,241,0.2)]'
                        : 'text-[#C5C6C7]/70 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.name}</span>
                    <span className={`text-[10px] px-1 rounded font-mono ${
                      isActive ? 'bg-[#66FCF1]/20 text-[#66FCF1]' : 'bg-[#1F2833] text-[#C5C6C7]/60'
                    }`}>
                      {item.badge}
                    </span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Right Header Status Controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#1F2833]/80 border border-[#242E3B] text-xs font-mono">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#66FCF1] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#66FCF1]"></span>
              </span>
              <span className="text-white font-medium">SISTEMA ACTIVO</span>
            </div>

            <NavLink
              to="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#C5C6C7] hover:text-white bg-[#1F2833]/50 hover:bg-[#1F2833] border border-[#242E3B] transition-colors"
              title="Volver a Login"
            >
              <LogOut className="w-3.5 h-3.5 text-[#66FCF1]" />
              <span className="hidden sm:inline">Salir</span>
            </NavLink>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-around gap-1 pt-3 mt-3 border-t border-[#242E3B]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center py-1 px-2 rounded text-[11px] font-medium transition-colors ${
                  isActive ? 'text-[#66FCF1]' : 'text-[#C5C6C7]/60'
                }`}
              >
                <Icon className="w-4 h-4 mb-1" />
                <span>{item.name.replace('Portal del ', '').replace('Dashboard ', '')}</span>
              </NavLink>
            );
          })}
        </div>
      </header>

      {/* Main Page Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8">
        <Outlet />
      </main>

      {/* Modern Developer Status Bar */}
      <footer className="border-t border-[#242E3B] bg-[#0B0C10] px-4 py-2.5 text-xs text-[#C5C6C7]/50 font-mono flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[#66FCF1]">
            <Terminal className="w-3.5 h-3.5" />
            Vooxline Core v1.0.0
          </span>
          <span className="text-[#242E3B]">|</span>
          <span>Ruta Activa: <strong className="text-white font-semibold">{location.pathname}</strong></span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Activity className="w-3 h-3 text-[#66FCF1]" />
            Tailwind CSS v4 + React Router v7
          </span>
        </div>
      </footer>
    </div>
  );
};
