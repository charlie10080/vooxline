import React from 'react';
import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import { VooxlineLogo } from '@/components/common/VooxlineLogo';
import { UserSwitcher } from '@/components/layout/UserSwitcher';
import { NotificationBell } from '@/components/layout/NotificationBell';
import { useCurrentUser, useSessionStore } from '@/store/useSessionStore';
import { SidebarCount } from '@/components/layout/SidebarCount';
import type { BadgeKey } from '@/components/layout/SidebarCount';
import {
  LayoutDashboard,
  Activity,
  Radio,
  Users,
  Network,
  Cpu,
  MessageSquare,
  Megaphone,
  BookUser,
  ClipboardList,
  LifeBuoy,
  Clock,
  Calendar,
  DollarSign,
  PartyPopper,
  CalendarOff,
  Terminal,
} from 'lucide-react';

interface SidebarItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  badge?: BadgeKey;
}

interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    title: 'GENERAL',
    items: [
      { name: 'Resumen', path: '/', icon: LayoutDashboard, exact: true },
      { name: 'Actividad', path: '/activity', icon: Activity },
      { name: 'Monitor en vivo', path: '/monitor', icon: Radio },
    ],
  },
  {
    title: 'USUARIOS Y GRUPOS',
    items: [
      { name: 'Usuarios', path: '/users', icon: Users },
      { name: 'Grupos inteligentes', path: '/groups', icon: Network },
      { name: 'Automatizaciones', path: '/automations', icon: Cpu },
    ],
  },
  {
    title: 'COMUNICACIÓN',
    items: [
      { name: 'Chat', path: '/chat', icon: MessageSquare, badge: 'chat' },
      { name: 'Avisos', path: '/updates', icon: Megaphone, badge: 'updates' },
      { name: 'Directorio', path: '/director', icon: BookUser },
      { name: 'Formularios', path: '/forms', icon: ClipboardList },
      { name: 'Help Desk', path: '/helpdesk', icon: LifeBuoy },
    ],
  },
  {
    title: 'OPERACIÓN',
    items: [
      { name: 'Time Clock', path: '/time-clock', icon: Clock },
      { name: 'Horarios y turnos', path: '/scheduling', icon: Calendar },
      { name: 'Rentabilidad y nómina', path: '/payroll', icon: DollarSign },
    ],
  },
  {
    title: 'RR. HH.',
    items: [
      { name: 'Celebraciones', path: '/celebrations', icon: PartyPopper },
      { name: 'Vacaciones y permisos', path: '/time-off', icon: CalendarOff },
    ],
  },
];

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const { isManager } = useCurrentUser();
  const currentUserId = useSessionStore((s) => s.currentUserId);

  // La consola es solo para supervisores y administradores; un agente va a su portal
  if (!isManager) return <Navigate to="/portal" replace />;

  // Find active item name for breadcrumbs
  const currentItem = SIDEBAR_SECTIONS.flatMap((s) => s.items).find((item) =>
    item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path),
  );

  return (
    <div className="min-h-screen bg-vx-bg text-vx-text-2 flex font-sans antialiased selection:bg-vx-accent/20 selection:text-vx-accent">
      {/* Sidebar fijo a la izquierda */}
      <aside className="w-68 h-screen sticky top-0 bg-vx-bg border-r border-vx-border flex flex-col shrink-0 z-30 overflow-hidden">
        {/* Logo Header */}
        <div className="h-16 px-5 border-b border-vx-border flex items-center justify-between shrink-0">
          <NavLink to="/" className="flex items-center gap-3 group">
            <VooxlineLogo size="sm" showSubtitle={false} />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-vx-text tabular-nums">
                VOOXLINE
              </span>
              <span className="text-xs text-vx-accent tabular-nums tracking-tight leading-none">
                WORKFORCE B2B
              </span>
            </div>
          </NavLink>

          <span className="px-2 py-0.5 rounded-full text-xs tabular-nums bg-vx-accent/10 text-vx-accent border border-vx-accent/30">
            PRO
          </span>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6 scrollbar-thin scrollbar-thumb-vx-raised">
          {SIDEBAR_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-1.5">
              <div className="px-3 text-xs font-bold tabular-nums text-vx-text-2/40">
                {section.title}
              </div>

              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.exact}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all group ${
                          isActive
                            ? 'bg-vx-accent/10 text-vx-accent border border-vx-accent/30 font-semibold'
                            : 'text-vx-text-2/75 hover:text-vx-text hover:bg-white/[0.04] border border-transparent'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            className={`w-4 h-4 shrink-0 transition-colors ${
                              isActive
                                ? 'text-vx-accent'
                                : 'text-vx-text-2/60 group-hover:text-vx-text'
                            }`}
                          />
                          <span className="truncate whitespace-nowrap leading-none">
                            {item.name}
                          </span>
                          {item.badge && <SidebarCount badge={item.badge} userId={currentUserId} />}
                          {item.path === '/time-clock' && (
                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-vx-accent animate-pulse" />
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3.5 border-t border-vx-border bg-vx-bg/80 shrink-0">
          <div className="p-2.5 rounded-xl bg-vx-surface border border-vx-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-vx-accent opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-vx-accent" />
              </span>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-vx-text tabular-nums leading-none">
                  SISTEMA ACTIVO
                </span>
                <span className="text-xs text-vx-text-2/50 tabular-nums mt-0.5">
                  Zustand Core Sync
                </span>
              </div>
            </div>
            <Terminal className="w-3.5 h-3.5 text-vx-accent/70" />
          </div>
        </div>
      </aside>

      {/* Main View Area with Topbar + Outlet */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Topbar */}
        <header className="h-16 sticky top-0 z-20 bg-vx-bg/85 backdrop-blur-md border-b border-vx-border px-6 lg:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-[13px] tabular-nums text-vx-text-2/60">
              <span>VOOXLINE</span>
              <span>/</span>
              <span className="text-vx-text font-medium">
                {currentItem ? currentItem.name : 'Console'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell />
            <UserSwitcher />
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
