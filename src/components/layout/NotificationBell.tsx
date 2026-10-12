import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  BellOff,
  CalendarDays,
  CalendarOff,
  CheckCheck,
  ClipboardList,
  Clock,
  Cpu,
  LifeBuoy,
  Megaphone,
  X,
} from 'lucide-react';
import type { NotificationCategory } from '@/types/notifications';
import { NOTIFICATION_CATEGORY_LABELS, notificationsFor } from '@/lib/notifications';
import { timeAgo } from '@/lib/updates';
import { useCurrentUser } from '@/store/useSessionStore';
import { useNotificationsStore } from '@/store/useNotificationsStore';

const CATEGORY_ICONS: Record<NotificationCategory, React.ComponentType<{ className?: string }>> = {
  attendance: Clock,
  time_off: CalendarOff,
  schedule: CalendarDays,
  helpdesk: LifeBuoy,
  forms: ClipboardList,
  updates: Megaphone,
  system: Cpu,
};

const MAX_SHOWN = 30;

/** Campana de notificaciones del usuario actual (barra superior de consola y portal) */
export const NotificationBell: React.FC = () => {
  const { profile } = useCurrentUser();
  const userId = profile.agentId;
  const all = useNotificationsStore((s) => s.notifications);
  const markRead = useNotificationsStore((s) => s.markRead);
  const markAllRead = useNotificationsStore((s) => s.markAllRead);
  const dismiss = useNotificationsStore((s) => s.dismiss);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(() => Date.now());

  const mine = notificationsFor(all, userId);
  const unread = mine.filter((n) => n.readAt === null).length;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggle = () => {
    setNow(Date.now());
    setOpen((o) => !o);
  };

  const openNotification = (id: string, link: string) => {
    markRead(userId, id);
    setOpen(false);
    navigate(link);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={unread > 0 ? `Notificaciones, ${unread} sin leer` : 'Notificaciones'}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={`relative rounded-xl border p-2 transition-all ${
          open
            ? 'border-[#66FCF1]/40 bg-[#66FCF1]/10 text-[#66FCF1]'
            : 'border-[#242E3B] bg-[#13151c] text-[#C5C6C7] hover:border-[#66FCF1]/30 hover:text-white'
        }`}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-[#0B0C10] bg-[#EF4444] px-1 font-mono text-[10px] font-bold text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notificaciones"
          className="absolute right-0 z-50 mt-2 flex max-h-[70vh] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-[#242E3B] bg-[#13151c] shadow-2xl"
        >
          <header className="flex items-center justify-between gap-3 border-b border-[#242E3B] px-4 py-3">
            <div>
              <p className="text-sm font-bold text-white">Notificaciones</p>
              <p className="font-mono text-[11px] text-[#C5C6C7]/60">{unread} sin leer</p>
            </div>
            <button
              type="button"
              onClick={() => markAllRead(userId)}
              disabled={unread === 0}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-[#66FCF1] hover:bg-[#66FCF1]/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Marcar todo como leído
            </button>
          </header>

          {mine.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
              <BellOff className="h-6 w-6 text-[#66FCF1]/60" />
              <p className="text-sm font-semibold text-white">Sin notificaciones</p>
              <p className="text-xs text-[#C5C6C7]/60">Aquí verás alertas de turnos, permisos, soporte y avisos.</p>
            </div>
          ) : (
            <ul className="flex-1 divide-y divide-[#242E3B] overflow-y-auto">
              {mine.slice(0, MAX_SHOWN).map((n) => {
                const Icon = CATEGORY_ICONS[n.category];
                const isUnread = n.readAt === null;
                return (
                  <li key={n.id} className={`group relative ${isUnread ? 'bg-[#66FCF1]/[0.04]' : ''}`}>
                    <button
                      type="button"
                      onClick={() => openNotification(n.id, n.link)}
                      className="flex w-full items-start gap-3 px-4 py-3 pr-10 text-left transition-colors hover:bg-white/[0.04] focus:bg-white/[0.04] focus:outline-none"
                    >
                      <span
                        className={`mt-0.5 rounded-lg border p-1.5 ${
                          isUnread ? 'border-[#66FCF1]/30 bg-[#66FCF1]/10 text-[#66FCF1]' : 'border-[#242E3B] bg-[#0B0C10] text-[#C5C6C7]/60'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block truncate text-xs font-semibold ${isUnread ? 'text-white' : 'text-[#C5C6C7]'}`}>{n.title}</span>
                        <span className="mt-0.5 line-clamp-2 block text-xs text-[#C5C6C7]/70">{n.body}</span>
                        <span className="mt-1 block font-mono text-[10px] text-[#C5C6C7]/45">
                          {NOTIFICATION_CATEGORY_LABELS[n.category]} · {timeAgo(n.createdAt, now)}
                        </span>
                      </span>
                      {isUnread && (
                        <>
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#66FCF1]" aria-hidden="true" />
                          <span className="sr-only">Sin leer</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => dismiss(userId, n.id)}
                      aria-label={`Descartar notificación: ${n.title}`}
                      className="absolute right-2 top-2.5 rounded-md p-1 text-[#C5C6C7]/40 opacity-0 transition-opacity hover:bg-white/5 hover:text-white focus:opacity-100 group-hover:opacity-100"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
