import React, { useState } from 'react';
import {
  ArrowRightLeft,
  Clock,
  Hand,
  History,
  Lock,
  MessageSquare,
  Paperclip,
  RotateCcw,
  Send,
  Star,
} from 'lucide-react';
import type { HelpdeskResult, Ticket, TicketEvent, TicketStatus } from '@/types/helpdesk';
import { Avatar, Badge, Button, Card, Select, TextArea } from '@/components/ui';
import {
  CATEGORY_LABELS,
  REOPEN_WINDOW_HOURS,
  STATUS_LABELS,
  TRANSITIONS,
  canReopen,
  visibleMessages,
} from '@/lib/helpdesk';
import { useHelpdeskStore } from '@/store/useHelpdeskStore';
import { PriorityBadge, SlaBadge, StatusBadge } from '@/components/helpdesk/badges';

const fmt = (iso: string): string =>
  new Date(iso).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

const STATUS_ACTION_LABELS: Record<TicketStatus, string> = {
  open: 'Regresar a abierto',
  in_progress: 'Marcar en progreso',
  waiting_user: 'Esperar al usuario',
  resolved: 'Marcar resuelto',
  closed: 'Cerrar ticket',
};

export const TicketDetail: React.FC<{
  ticket: Ticket;
  currentUserId: string;
  isManager: boolean;
  managers: Array<{ id: string; name: string }>;
  nameOf: (id: string | null) => string;
  now: number;
  onResult: (r: HelpdeskResult, success: string) => void;
}> = ({ ticket, currentUserId, isManager, managers, nameOf, now, onResult }) => {
  const { addMessage, setStatus, assign, reopen, rate } = useHelpdeskStore();
  const [reply, setReply] = useState('');
  const [internal, setInternal] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  const isRequester = ticket.requesterId === currentUserId;
  const messages = visibleMessages(ticket, isManager);
  const canWrite = ticket.status !== 'closed' && (isManager || isRequester);

  const send = () => {
    const r = addMessage(ticket.id, reply, internal);
    if (r.ok) setReply('');
    onResult(r, internal ? 'Nota interna agregada.' : 'Respuesta enviada.');
  };

  const describeEvent = (e: TicketEvent): string => {
    switch (e.kind) {
      case 'created':
        return `${nameOf(e.actorId)} abrió el ticket`;
      case 'status':
        return `${nameOf(e.actorId)} cambió el estado: ${STATUS_LABELS[e.from as TicketStatus] ?? e.from} → ${
          STATUS_LABELS[e.to as TicketStatus] ?? e.to
        }`;
      case 'assignee':
        return e.to === e.actorId
          ? `${nameOf(e.actorId)} tomó el ticket`
          : `${nameOf(e.actorId)} asignó a ${e.to ? nameOf(e.to) : 'nadie'}${e.from ? ` (antes ${nameOf(e.from)})` : ''}`;
      case 'rated':
        return `${nameOf(e.actorId)} calificó la atención con ${e.to}/5`;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-semibold text-[#66FCF1]">{ticket.code}</span>
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            <SlaBadge ticket={ticket} now={now} />
            <Badge>{CATEGORY_LABELS[ticket.category]}</Badge>
          </div>
          <h2 className="text-lg font-bold text-white">{ticket.title}</h2>
          <div className="grid gap-3 text-xs sm:grid-cols-3">
            <div>
              <div className="text-[#C5C6C7]/50">Solicitante</div>
              <div className="mt-1 flex items-center gap-2 text-white">
                <Avatar name={nameOf(ticket.requesterId)} size="sm" />
                {nameOf(ticket.requesterId)}
              </div>
            </div>
            <div>
              <div className="text-[#C5C6C7]/50">Responsable</div>
              <div className="mt-1 flex h-7 items-center text-white">
                {ticket.assigneeId ? nameOf(ticket.assigneeId) : <span className="text-[#F59E0B]">Sin asignar</span>}
              </div>
            </div>
            <div>
              <div className="text-[#C5C6C7]/50">Creado</div>
              <div className="mt-1 flex h-7 items-center gap-1.5 text-white">
                <Clock className="h-3.5 w-3.5 text-[#C5C6C7]/50" />
                {fmt(ticket.createdAt)}
              </div>
            </div>
          </div>
          <p className="whitespace-pre-wrap rounded-xl border border-[#242E3B] bg-[#0B0C10] p-3.5 text-sm text-[#C5C6C7]">
            {ticket.description}
          </p>
          {ticket.attachmentName && (
            <div className="inline-flex items-center gap-2 rounded-lg border border-[#242E3B] px-3 py-1.5 text-xs text-[#C5C6C7]">
              <Paperclip className="h-3.5 w-3.5 text-[#66FCF1]" aria-hidden="true" />
              {ticket.attachmentName}
            </div>
          )}

          {isManager && ticket.status !== 'closed' && (
            <div className="flex flex-wrap items-end gap-2.5 border-t border-[#242E3B] pt-4">
              <label className="min-w-[180px] flex-1 space-y-1.5">
                <span className="text-xs font-medium text-[#C5C6C7]">Asignar a</span>
                <Select
                  value={ticket.assigneeId ?? ''}
                  onChange={(e) => onResult(assign(ticket.id, e.target.value || null), 'Responsable actualizado.')}
                >
                  <option value="">Sin asignar</option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </Select>
              </label>
              {ticket.assigneeId !== currentUserId && (
                <Button
                  icon={Hand}
                  onClick={() => onResult(assign(ticket.id, currentUserId), 'Tomaste el ticket.')}
                >
                  Tomar
                </Button>
              )}
              {TRANSITIONS[ticket.status].map((to) => (
                <Button
                  key={to}
                  variant={to === 'resolved' ? 'primary' : to === 'closed' ? 'danger' : 'secondary'}
                  icon={ArrowRightLeft}
                  onClick={() => onResult(setStatus(ticket.id, to), `Estado: ${STATUS_LABELS[to]}.`)}
                >
                  {STATUS_ACTION_LABELS[to]}
                </Button>
              ))}
            </div>
          )}

          {isRequester && ticket.status === 'resolved' && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#10B981]/30 bg-[#10B981]/5 p-3.5">
              <p className="text-xs text-[#C5C6C7]">
                ¿No quedó resuelto? Puedes reabrirlo durante {REOPEN_WINDOW_HOURS} h después de la resolución.
              </p>
              <Button
                icon={RotateCcw}
                size="sm"
                disabled={!canReopen(ticket, now)}
                onClick={() => onResult(reopen(ticket.id), 'Ticket reabierto.')}
              >
                {canReopen(ticket, now) ? 'Reabrir' : 'Plazo vencido'}
              </Button>
            </div>
          )}

          {isRequester && (ticket.status === 'resolved' || ticket.status === 'closed') && (
            <div className="flex flex-wrap items-center gap-3 border-t border-[#242E3B] pt-4">
              <span className="text-xs font-medium text-[#C5C6C7]">
                {ticket.rating === null ? 'Califica la atención:' : 'Tu calificación:'}
              </span>
              <div className="flex gap-1" role="group" aria-label="Calificación de 1 a 5" onMouseLeave={() => setHoverRating(0)}>
                {[1, 2, 3, 4, 5].map((n) => {
                  const filled = n <= (hoverRating || ticket.rating || 0);
                  return (
                    <button
                      key={n}
                      type="button"
                      disabled={ticket.rating !== null}
                      aria-label={`${n} de 5`}
                      onMouseEnter={() => ticket.rating === null && setHoverRating(n)}
                      onFocus={() => ticket.rating === null && setHoverRating(n)}
                      onClick={() => onResult(rate(ticket.id, n), '¡Gracias por tu calificación!')}
                      className="rounded p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#66FCF1] disabled:cursor-default"
                    >
                      <Star className={`h-5 w-5 ${filled ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-[#242E3B]'}`} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card title="Conversación" subtitle={isManager ? 'Las notas internas solo las ven supervisores' : undefined}>
        <div className="space-y-3">
          {messages.length === 0 && (
            <p className="flex items-center gap-2 text-xs text-[#C5C6C7]/50">
              <MessageSquare className="h-4 w-4" aria-hidden="true" /> Sin mensajes todavía.
            </p>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`rounded-xl border p-3.5 ${
                m.internal
                  ? 'border-[#F59E0B]/30 bg-[#F59E0B]/5'
                  : m.authorId === ticket.requesterId
                    ? 'border-[#242E3B] bg-[#0B0C10]'
                    : 'border-[#66FCF1]/20 bg-[#66FCF1]/[0.04]'
              }`}
            >
              <div className="mb-1.5 flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold text-white">{nameOf(m.authorId)}</span>
                {m.internal && (
                  <Badge tone="warning">
                    <Lock className="h-3 w-3" aria-hidden="true" /> Nota interna
                  </Badge>
                )}
                <span className="text-[#C5C6C7]/50">{fmt(m.createdAt)}</span>
              </div>
              <p className="whitespace-pre-wrap text-sm text-[#C5C6C7]">{m.body}</p>
            </div>
          ))}

          {canWrite && (
            <form
              className="space-y-2.5 border-t border-[#242E3B] pt-3"
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
            >
              <label className="sr-only" htmlFor={`reply-${ticket.id}`}>
                {internal ? 'Nota interna' : 'Respuesta'}
              </label>
              <TextArea
                id={`reply-${ticket.id}`}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder={internal ? 'Nota visible solo para supervisores…' : 'Escribe una respuesta…'}
                maxLength={4000}
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                {isManager ? (
                  <label className="flex items-center gap-2 text-xs text-[#C5C6C7]">
                    <input
                      type="checkbox"
                      checked={internal}
                      onChange={(e) => setInternal(e.target.checked)}
                      className="accent-[#F59E0B]"
                    />
                    Nota interna
                  </label>
                ) : (
                  <span />
                )}
                <Button type="submit" variant="primary" icon={internal ? Lock : Send} disabled={!reply.trim()}>
                  {internal ? 'Agregar nota' : 'Responder'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </Card>

      <Card title="Historial">
        <ol className="space-y-2.5">
          {[...ticket.history].reverse().map((e) => (
            <li key={e.id} className="flex items-start gap-2.5 text-xs">
              <History className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#66FCF1]/60" aria-hidden="true" />
              <span className="flex-1 text-[#C5C6C7]">{describeEvent(e)}</span>
              <span className="whitespace-nowrap font-mono text-[11px] text-[#C5C6C7]/40">{fmt(e.at)}</span>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
};
