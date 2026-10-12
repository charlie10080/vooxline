import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Check, LayoutDashboard, UserCircle2 } from 'lucide-react';
import { Avatar } from '@/components/ui';
import { useWorkforceStore } from '@/store/useWorkforceStore';
import { useDirectoryStore } from '@/store/useDirectoryStore';
import { useSessionStore, useCurrentUser } from '@/store/useSessionStore';
import { getProfile } from '@/lib/groups';
import type { UserRole } from '@/types/directory';

const ROLE_LABELS: Record<UserRole, string> = { agent: 'Agente', supervisor: 'Supervisor', admin: 'Administrador' };

/**
 * Menú del usuario: muestra quién está usando la app y permite "entrar como" otro usuario de la demo.
 * shortcut: sin contraseñas; con backend se reemplaza por el inicio de sesión real.
 */
export const UserSwitcher: React.FC = () => {
  const navigate = useNavigate();
  const agents = useWorkforceStore((s) => s.agents);
  const profiles = useDirectoryStore((s) => s.profiles);
  const setCurrentUser = useSessionStore((s) => s.setCurrentUser);
  const { agent, role, isManager } = useCurrentUser();
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
        className="flex items-center gap-2.5 rounded-xl border border-[#242E3B] bg-[#13151c] py-1.5 pl-1.5 pr-3 transition-colors hover:border-[#66FCF1]/40"
      >
        <Avatar name={agent?.name ?? '?'} size="sm" />
        <span className="hidden text-left sm:block">
          <span className="block text-xs font-semibold leading-tight text-white">{agent?.name ?? 'Sin usuario'}</span>
          <span className="block font-mono text-[10px] leading-tight text-[#66FCF1]">{ROLE_LABELS[role]}</span>
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-[#C5C6C7]/60" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-72 overflow-hidden rounded-2xl border border-[#242E3B] bg-[#13151c] shadow-2xl"
        >
          {isManager && (
            <div className="grid grid-cols-2 gap-1.5 border-b border-[#242E3B] p-2">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  navigate('/');
                }}
                className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-[#C5C6C7] hover:bg-white/5 hover:text-white"
              >
                <LayoutDashboard className="h-3.5 w-3.5 text-[#66FCF1]" />
                Consola
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  navigate('/portal');
                }}
                className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-[#C5C6C7] hover:bg-white/5 hover:text-white"
              >
                <UserCircle2 className="h-3.5 w-3.5 text-[#66FCF1]" />
                Mi portal
              </button>
            </div>
          )}
          <div className="px-3 pb-1 pt-3 font-mono text-[10px] font-bold uppercase tracking-wider text-[#C5C6C7]/40">
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
                    current ? 'bg-[#66FCF1]/10' : 'hover:bg-white/5'
                  }`}
                >
                  <Avatar name={a.name} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-medium text-white">{a.name}</span>
                    <span className="block font-mono text-[10px] text-[#C5C6C7]/50">{ROLE_LABELS[r]}</span>
                  </span>
                  {current && <Check className="h-3.5 w-3.5 text-[#66FCF1]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
