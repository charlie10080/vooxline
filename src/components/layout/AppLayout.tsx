import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { VooxlineLogo } from '@/components/common/VooxlineLogo';
import {
  LayoutDashboard,
  Activity,
  Radio,
  Users,
  Network,
  Cpu,
  MessageSquare,
  Bell,
  BookUser,
  ClipboardList,
  Headphones,
  Clock,
  Calendar,
  DollarSign,
  PartyPopper,
  CalendarOff,
  Terminal,
  Shield,
} from 'lucide-react';

interface SidebarItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    title: 'GENERAL',
    items: [
      { name: 'Overview', path: '/', icon: LayoutDashboard, exact: true },
      { name: 'Activity', path: '/activity', icon: Activity },
      { name: 'Monitor en Vivo', path: '/monitor', icon: Radio },
    ],
  },
  {
    title: 'USERS & GROUPS',
    items: [
      { name: 'Users', path: '/users', icon: Users },
      { name: 'Smart Groups', path: '/groups', icon: Network },
      { name: 'Automations', path: '/automations', icon: Cpu },
    ],
  },
  {
    title: 'COMMUNICATION',
    items: [
      { name: 'Chat', path: '/chat', icon: MessageSquare },
      { name: 'Updates', path: '/updates', icon: Bell },
      { name: 'Director', path: '/director', icon: BookUser },
      { name: 'Forms', path: '/forms', icon: ClipboardList },
      { name: 'Help Desk', path: '/helpdesk', icon: Headphones },
    ],
  },
  {
    title: 'OPERATIONS',
    items: [
      { name: 'Time Clock', path: '/time-clock', icon: Clock },
      { name: 'Job Scheduling', path: '/scheduling', icon: Calendar },
      { name: 'Rentabilidad y Nómina', path: '/payroll', icon: DollarSign },
    ],
  },
  {
    title: 'HR & SKILLS',
    items: [
      { name: 'Celebrations', path: '/celebrations', icon: PartyPopper },
      { name: 'Time Off', path: '/time-off', icon: CalendarOff },
    ],
  },
];

export const AppLayout: React.FC = () => {
  const location = useLocation();

  // Find active item name for breadcrumbs
  const currentItem = SIDEBAR_SECTIONS.flatMap((s) => s.items).find((item) =>
    item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path),
  );

  return (
    <div className="min-h-screen bg-[#0B0C10] text-[#C5C6C7] flex font-sans antialiased selection:bg-[#66FCF1]/20 selection:text-[#66FCF1]">
      {/* Sidebar fijo a la izquierda */}
      <aside className="w-68 h-screen sticky top-0 bg-[#0B0C10] border-r border-[#242E3B] flex flex-col shrink-0 z-30 overflow-hidden">
        {/* Logo Header */}
        <div className="h-16 px-5 border-b border-[#242E3B] flex items-center justify-between shrink-0">
          <NavLink to="/" className="flex items-center gap-3 group">
            <VooxlineLogo size="sm" showSubtitle={false} />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white tracking-wider font-mono">
                VOOXLINE
              </span>
              <span className="text-[10px] text-[#66FCF1] font-mono tracking-tight leading-none">
                WORKFORCE B2B
              </span>
            </div>
          </NavLink>

          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#66FCF1]/10 text-[#66FCF1] border border-[#66FCF1]/30">
            PRO
          </span>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6 scrollbar-thin scrollbar-thumb-[#1F2833]">
          {SIDEBAR_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-1.5">
              <div className="px-3 text-[10px] font-bold font-mono tracking-wider text-[#C5C6C7]/40 uppercase">
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
                        `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                          isActive
                            ? 'bg-[#66FCF1]/10 text-[#66FCF1] border border-[#66FCF1]/30 font-semibold shadow-[0_0_12px_rgba(102,252,241,0.12)]'
                            : 'text-[#C5C6C7]/75 hover:text-white hover:bg-white/[0.04] border border-transparent'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            className={`w-4 h-4 shrink-0 transition-colors ${
                              isActive
                                ? 'text-[#66FCF1]'
                                : 'text-[#C5C6C7]/60 group-hover:text-white'
                            }`}
                          />
                          <span className="truncate whitespace-nowrap leading-none">
                            {item.name}
                          </span>
                          {item.path === '/time-clock' && (
                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#66FCF1] animate-pulse" />
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
        <div className="p-3.5 border-t border-[#242E3B] bg-[#0B0C10]/80 shrink-0">
          <div className="p-2.5 rounded-xl bg-[#13171F] border border-[#242E3B] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#66FCF1] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#66FCF1]" />
              </span>
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-white font-mono leading-none">
                  SISTEMA ACTIVO
                </span>
                <span className="text-[9px] text-[#C5C6C7]/50 font-mono mt-0.5">
                  Zustand Core Sync
                </span>
              </div>
            </div>
            <Terminal className="w-3.5 h-3.5 text-[#66FCF1]/70" />
          </div>
        </div>
      </aside>

      {/* Main View Area with Topbar + Outlet */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Topbar */}
        <header className="h-16 sticky top-0 z-20 bg-[#0B0C10]/85 backdrop-blur-md border-b border-[#242E3B] px-6 lg:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-mono text-[#C5C6C7]/60">
              <span>VOOXLINE</span>
              <span>/</span>
              <span className="text-white font-medium">
                {currentItem ? currentItem.name : 'Console'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#13171F] border border-[#242E3B] text-xs font-mono">
              <Shield className="w-3.5 h-3.5 text-[#66FCF1]" />
              <span className="text-[#C5C6C7]">Supervisor Role</span>
            </div>

            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#66FCF1]/20 to-[#1F2833] border border-[#66FCF1]/30 flex items-center justify-center font-bold text-xs text-[#66FCF1] font-mono">
              SV
            </div>
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
