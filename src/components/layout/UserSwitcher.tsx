import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Check, LayoutDashboard, LogOut, UserCircle2 } from 'lucide-react';
import { Avatar } from '@/components/ui';
import { useWorkforceStore } from '@/store/useWorkforceStore';
import { useDirectoryStore } from '@/store/useDirectoryStore';
import { useSessionStore, useCurrentUser } from '@/store/useSessionStore';
import { getProfile } from '@/lib/groups';
import type { UserRole } from '@/types/directory';

const ROLE_LABELS: Record<UserRole, string> = { agent: 'Agente', supervisor: 'Supervisor', admin: 'Administrador', client: 'Cliente' };

/**
 * Menú del usuario: muestra quién está usando la app y permite "entrar como" otro usuario de la demo.
 * shortcut: sin contraseñas; con backend se reemplaza por el inicio de sesión real.
 */
export const UserSwitcher: React.FC = () => {
  const navigate = useNavigate();
  const agents = useWorkforceStore((s) => s.agents);
  const profiles = useDirectoryStore((s) => s.profiles);
  const setCurrentUser = useSessionStore((s) => s.setCurrentUser);
  const logout = useSessionStore((s) => s.logout);
  const { agent, profile, role, isManager } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const activeUsers = agents.filter((a) => getProfile(profiles, a.id).active);

  const switchTo = (agentId: string) => {
    setCurrentUser(agentId);
    setOpen(false);
    // Un agente solo tiene acceso a su portal
    navigate(getProfile(profiles, agentId).role === 'agent' ? '/portal' : '/');
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2.5 rounded-xl border border-vx-border bg-vx-surface py-1.5 pl-1.5 pr-3 transition-colors hover:border-vx-accent/40"
      >
        <Avatar name={agent?.name ?? '?'} size="sm" />
        <span className="hidden text-left sm:block">
          <span className="block text-[13px] font-semibold leading-tight text-vx-text">{agent?.name ?? profile.email}</span>
          <span className="block tabular-nums text-xs leading-tight text-vx-accent">{ROLE_LABELS[role]}</span>
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-vx-text-2/60" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-72 overflow-hidden rounded-2xl border border-vx-border bg-vx-surface shadow-2xl"
        >
          {isManager && (
            <div className="grid grid-cols-2 gap-1.5 border-b border-vx-border p-2">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  navigate('/');
                }}
                className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-vx-text-2 hover:bg-white/5 hover:text-vx-text"
              >
                <LayoutDashboard className="h-3.5 w-3.5 text-vx-accent" />
                Consola
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  navigate('/portal');
                }}
                className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-vx-text-2 hover:bg-white/5 hover:text-vx-text"
              >
                <UserCircle2 className="h-3.5 w-3.5 text-vx-accent" />
                Mi portal
              </button>
            </div>
          )}
          <div className="px-3 pb-1 pt-3 tabular-nums text-xs font-bold text-vx-text-2/40">
            Entrar como (demo)
          </div>
          <div className="max-h-80 overflow-y-auto p-1.5">
            {activeUsers.map((a) => {
              const r = getProfile(profiles, a.id).role;
              const current = a.id === agent?.id;
              return (
                <button
                  key={a.id}
                  type="button"
                  role="menuitem"
                  onClick={() => switchTo(a.id)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors ${
                    current ? 'bg-vx-accent/10' : 'hover:bg-white/5'
                  }`}
                >
                  <Avatar name={a.name} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-vx-text">{a.name}</span>
                    <span className="block tabular-nums text-xs text-vx-text-2/50">{ROLE_LABELS[r]}</span>
                  </span>
                  {current && <Check className="h-3.5 w-3.5 text-vx-accent" />}
                </button>
              );
            })}
          </div>
          <div className="border-t border-vx-border p-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                logout();
                navigate('/inicio');
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-vx-text-2 hover:bg-white/5 hover:text-vx-text"
            >
              <LogOut className="h-3.5 w-3.5" />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
