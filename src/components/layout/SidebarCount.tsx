import React from 'react';
import { useChatUnreadTotal } from '@/store/useChatStore';
import { useUpdatesAttention } from '@/store/useUpdatesStore';

export type BadgeKey = 'chat' | 'updates';

const Count: React.FC<{ value: number }> = ({ value }) =>
  value > 0 ? (
    <span className="ml-auto min-w-5 rounded-full bg-vx-accent px-1.5 text-center tabular-nums text-xs font-bold leading-5 text-vx-bg">
      {value > 99 ? '99+' : value}
    </span>
  ) : null;

const ChatCount: React.FC<{ userId: string }> = ({ userId }) => <Count value={useChatUnreadTotal(userId)} />;
const UpdatesCount: React.FC<{ userId: string }> = ({ userId }) => <Count value={useUpdatesAttention(userId).total} />;

/** Contador de pendientes de una sección del menú (mensajes sin leer, avisos sin leer o sin confirmar) */
export const SidebarCount: React.FC<{ badge: BadgeKey; userId: string }> = ({ badge, userId }) =>
  badge === 'chat' ? <ChatCount userId={userId} /> : <UpdatesCount userId={userId} />;
