import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  Home,
  CalendarDays,
  Timer,
  CalendarOff,
  MessageSquare,
  Megaphone,
  ClipboardList,
  LifeBuoy,
  Award,
  Menu,
  X,
} from 'lucide-react';
import { VooxlineLogo } from '@/components/common/VooxlineLogo';
import { UserSwitcher } from '@/components/layout/UserSwitcher';
import { SidebarCount } from '@/components/layout/SidebarCount';
import type { BadgeKey } from '@/components/layout/SidebarCount';
import { useSessionStore } from '@/store/useSessionStore';

interface PortalItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
  badge?: BadgeKey;
}

const PORTAL_ITEMS: PortalItem[] = [
  { name: 'Mi turno', path: '/portal', icon: Home, end: true },
  { name: 'Mi horario', path: '/portal/horario', icon: CalendarDays },
  { name: 'Mis horas', path: '/portal/horas', icon: Timer },
  { name: 'Permisos', path: '/portal/permisos', icon: CalendarOff },
  { name: 'Chat', path: '/portal/chat', icon: MessageSquare, badge: 'chat' },
  { name: 'Avisos', path: '/portal/avisos', icon: Megaphone, badge: 'updates' },
  { name: 'Formularios', path: '/portal/formularios', icon: ClipboardList },
  { name: 'Soporte', path: '/portal/soporte', icon: LifeBuoy },
  { name: 'Reconocimientos', path: '/portal/reconocimientos', icon: Award },
];

/** Portal del agente: la app que usa cada agente para marcar, ver su horario y comunicarse */
export const PortalLayout: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const currentUserId = useSessionStore((s) => s.currentUserId);

  const nav = (
    <nav aria-label="Portal del agente" className="space-y-0.5">
      {PORTAL_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            onClick={() => setMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'border-[#66FCF1]/30 bg-[#66FCF1]/10 text-[#66FCF1] shadow-[0_0_12px_rgba(102,252,241,0.12)]'
                  : 'border-transparent text-[#C5C6C7]/75 hover:bg-white/[0.04] hover:text-white'
              }`
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{item.name}</span>
            {item.badge && <SidebarCount badge={item.badge} userId={currentUserId} />}
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-[#0B0C10] font-sans text-[#C5C6C7] antialiased selection:bg-[#66FCF1]/20">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-[#242E3B] lg:flex">
        <div className="flex h-16 items-center gap-3 border-b border-[#242E3B] px-5">
          <VooxlineLogo size="sm" showSubtitle={false} />
          <div className="flex flex-col">
            <span className="font-mono text-sm font-bold tracking-wider text-white">VOOXLINE</span>
            <span className="font-mono text-[10px] leading-none text-[#66FCF1]">PORTAL DEL AGENTE</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-3.5 py-4">{nav}</div>
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-black/70 lg:hidden" onClick={() => setMenuOpen(false)}>
          <div
            className="h-full w-72 border-r border-[#242E3B] bg-[#0B0C10] p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="font-mono text-sm font-bold text-white">VOOXLINE</span>
              <button
                type="button"
                aria-label="Cerrar menú"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg p-1.5 hover:bg-white/5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {nav}
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#242E3B] bg-[#0B0C10]/85 px-4 backdrop-blur-md lg:px-8">
          <button
            type="button"
            aria-label="Abrir menú"
            onClick={() => setMenuOpen(true)}
            className="rounded-lg p-2 hover:bg-white/5 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="hidden font-mono text-xs text-[#C5C6C7]/60 lg:block">VOOXLINE / PORTAL</span>
          <UserSwitcher />
        </header>
        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
