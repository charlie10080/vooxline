import React, { useState } from 'react';
import {
  Archive,
  ArchiveRestore,
  BellRing,
  CheckCircle2,
  Edit3,
  MessageSquare,
  MessageSquareOff,
  Pin,
  PinOff,
  Send,
  ThumbsUp,
  Trash2,
} from 'lucide-react';
import type { Update, UpdateEventKind, UpdateResult } from '@/types/updates';
import { Avatar, Badge, Button, Card, Tabs, TextArea } from '@/components/ui';
import { useUpdatesStore } from '@/store/useUpdatesStore';
import { CATEGORY_LABELS, CATEGORY_TONE, STATE_LABEL, formatDateTime, getUpdateState, getUpdateStats, publishedAt, timeAgo } from '@/lib/updates';
import type { AudienceContext } from '@/lib/updates';
import { UpdateBody } from '@/components/updates/UpdateBody';


const EVENT_LABEL: Record<UpdateEventKind, string> = {
  created: 'creó el aviso',
  published: 'publicó el aviso',
  edited: 'editó el aviso',
  reminder: 'envió un recordatorio',
  archived: 'archivó el aviso',
  restored: 'restauró el aviso',
};

type PeopleTab = 'pending' | 'read' | 'confirmed';

export const UpdateDetail: React.FC<{
  update: Update;
  ctx: AudienceContext;
  now: number;
  me: { id: string; isManager: boolean };
  audienceLabel: string;
  nameOf: (id: string) => string;
  onResult: (result: UpdateResult, successMessage: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ update, ctx, now, me, audienceLabel, nameOf, onResult, onEdit, onDelete }) => {
  const store = useUpdatesStore();
  const [comment, setComment] = useState('');
  const [peopleTab, setPeopleTab] = useState<PeopleTab>('pending');

  const state = getUpdateState(update, now);
  const stats = getUpdateStats(update, ctx);
  const participates = state === 'live' && stats.audience.includes(me.id);
  const confirmedAt = update.confirmations[me.id];
  const liked = update.likes.includes(me.id);
  const canComment = update.commentsEnabled && (participates || me.isManager);
  const people = { pending: stats.pending, read: stats.read, confirmed: stats.confirmed }[peopleTab];

  const submitComment = (e: React.FormEvent) => {
    e.preventDefault();
    const res = store.addComment(update.id, comment);
    onResult(res, 'Comentario publicado.');
    if (res.ok) setComment('');
  };

  return (
    <div className="space-y-5">
      <Card bodyClassName="p-6 space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={CATEGORY_TONE[update.category]}>{CATEGORY_LABELS[update.category]}</Badge>
          <Badge tone={STATE_LABEL[state].tone}>{STATE_LABEL[state].label}</Badge>
          {update.pinned && (
            <Badge tone="accent">
              <Pin className="h-3 w-3" aria-hidden="true" /> Fijado
            </Badge>
          )}
          {update.requiresConfirmation && <Badge tone="warning">Requiere confirmación</Badge>}
        </div>

        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-white">{update.title}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#C5C6C7]/60">
            <span className="flex items-center gap-2">
              <Avatar name={nameOf(update.authorId)} size="sm" />
              <span className="font-semibold text-[#C5C6C7]">{nameOf(update.authorId)}</span>
            </span>
            <span>{formatDateTime(publishedAt(update))}</span>
            <span>Para: {audienceLabel}</span>
            {update.expiresAt && <span>Vence: {formatDateTime(update.expiresAt)}</span>}
          </div>
        </div>

        <UpdateBody body={update.body} />

        {participates && update.requiresConfirmation && (
          <div
            className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 ${
              confirmedAt ? 'border-[#10B981]/30 bg-[#10B981]/5' : 'border-[#F59E0B]/30 bg-[#F59E0B]/5'
            }`}
          >
            {confirmedAt ? (
              <span className="flex items-center gap-2 text-sm font-semibold text-[#10B981]">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Confirmaste la lectura {timeAgo(confirmedAt, now)}
              </span>
            ) : (
              <>
                <span className="text-sm text-[#F59E0B]">Este aviso requiere que confirmes que lo leíste.</span>
                <Button
                  variant="primary"
                  icon={CheckCircle2}
                  onClick={() => onResult(store.confirmRead(update.id), 'Gracias, confirmaste la lectura.')}
                >
                  Leído y entendido
                </Button>
              </>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 border-t border-[#242E3B] pt-4">
          <Button
            size="sm"
            variant={liked ? 'primary' : 'secondary'}
            icon={ThumbsUp}
            aria-pressed={liked}
            disabled={!participates}
            onClick={() => onResult(store.toggleLike(update.id), liked ? 'Quitaste tu me gusta.' : 'Te gusta este aviso.')}
          >
            Me gusta · {update.likes.length}
          </Button>
          <span className="inline-flex items-center gap-1.5 px-2 font-mono text-xs text-[#C5C6C7]/60">
            <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" /> {update.comments.length}
          </span>
        </div>
      </Card>

      {me.isManager && (
        <Card
          title="Seguimiento"
          subtitle={update.requiresConfirmation ? 'Avance de confirmaciones' : 'Avance de lectura'}
          actions={
            <Button
              size="sm"
              icon={BellRing}
              disabled={state !== 'live' || stats.pending.length === 0}
              onClick={() => onResult(store.sendReminder(update.id), 'Recordatorio enviado a los pendientes.')}
            >
              Enviar recordatorio
            </Button>
          }
          bodyClassName="p-5 space-y-4"
        >
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: 'Audiencia', value: stats.audience.length },
              { label: 'Leyeron', value: stats.read.length },
              { label: 'Confirmaron', value: update.requiresConfirmation ? stats.confirmed.length : '—' },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-[#242E3B] bg-[#0B0C10] p-3">
                <div className="font-mono text-xl font-bold text-white">{s.value}</div>
                <div className="text-[11px] text-[#C5C6C7]/60">{s.label}</div>
              </div>
            ))}
          </div>
          <div>
            <div className="mb-1.5 flex justify-between font-mono text-[11px] text-[#C5C6C7]/70">
              <span>{update.requiresConfirmation ? 'Confirmación' : 'Lectura'}</span>
              <span className="text-[#66FCF1]">{stats.percent}%</span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-[#0B0C10]"
              role="progressbar"
              aria-valuenow={stats.percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Porcentaje completado"
            >
              <div
                className={`h-full rounded-full ${stats.percent === 100 ? 'bg-[#10B981]' : 'bg-[#66FCF1]'}`}
                style={{ width: `${stats.percent}%` }}
              />
            </div>
          </div>
          <Tabs<PeopleTab>
            value={peopleTab}
            onChange={setPeopleTab}
            options={[
              { value: 'pending', label: 'Pendientes', count: stats.pending.length },
              { value: 'read', label: 'Leyeron', count: stats.read.length },
              ...(update.requiresConfirmation
                ? [{ value: 'confirmed' as const, label: 'Confirmaron', count: stats.confirmed.length }]
                : []),
            ]}
          />
          {people.length === 0 ? (
            <p className="py-2 text-center text-xs text-[#C5C6C7]/50">Nadie en esta lista.</p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {people.map((id) => {
                const at = peopleTab === 'confirmed' ? update.confirmations[id] : update.reads[id];
                return (
                  <li key={id} className="flex items-center gap-2.5 rounded-xl border border-[#242E3B] bg-[#0B0C10] px-3 py-2">
                    <Avatar name={nameOf(id)} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-xs font-semibold text-white">{nameOf(id)}</span>
                    <span className="font-mono text-[10px] text-[#C5C6C7]/50">
                      {at ? timeAgo(at, now) : update.reads[id] ? 'Leído, sin confirmar' : 'Sin leer'}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="flex flex-wrap gap-2 border-t border-[#242E3B] pt-4">
            <Button size="sm" icon={Edit3} onClick={onEdit}>
              Editar
            </Button>
            {update.status === 'draft' && (
              <Button size="sm" variant="primary" icon={Send} onClick={() => onResult(store.publishUpdate(update.id), 'Aviso publicado.')}>
                Publicar
              </Button>
            )}
            {update.status !== 'archived' && (
              <Button
                size="sm"
                icon={update.pinned ? PinOff : Pin}
                onClick={() => onResult(store.togglePin(update.id), update.pinned ? 'Aviso desfijado.' : 'Aviso fijado arriba.')}
              >
                {update.pinned ? 'Desfijar' : 'Fijar'}
              </Button>
            )}
            {update.status === 'archived' ? (
              <Button size="sm" icon={ArchiveRestore} onClick={() => onResult(store.restoreUpdate(update.id), 'Aviso restaurado.')}>
                Restaurar
              </Button>
            ) : (
              <Button size="sm" icon={Archive} onClick={() => onResult(store.archiveUpdate(update.id), 'Aviso archivado.')}>
                Archivar
              </Button>
            )}
            <Button size="sm" variant="danger" icon={Trash2} onClick={onDelete}>
              Eliminar
            </Button>
          </div>
        </Card>
      )}

      <Card title={`Comentarios (${update.comments.length})`} bodyClassName="p-5 space-y-4">
        {update.comments.length === 0 && (
          <p className="text-center text-xs text-[#C5C6C7]/50">Todavía no hay comentarios.</p>
        )}
        <ul className="space-y-3">
          {update.comments.map((c) => (
            <li key={c.id} className="flex gap-3">
              <Avatar name={nameOf(c.authorId)} size="sm" />
              <div className="min-w-0 flex-1 rounded-xl border border-[#242E3B] bg-[#0B0C10] px-3.5 py-2.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-semibold text-white">{nameOf(c.authorId)}</span>
                  <span className="font-mono text-[10px] text-[#C5C6C7]/50">{timeAgo(c.createdAt, now)}</span>
                </div>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm text-[#C5C6C7]">{c.body}</p>
              </div>
            </li>
          ))}
        </ul>
        {!update.commentsEnabled ? (
          <p className="flex items-center justify-center gap-2 text-xs text-[#C5C6C7]/50">
            <MessageSquareOff className="h-3.5 w-3.5" aria-hidden="true" /> Los comentarios están desactivados en este aviso.
          </p>
        ) : (
          canComment && (
            <form onSubmit={submitComment} className="flex items-end gap-2">
              <label className="flex-1">
                <span className="sr-only">Escribe un comentario</span>
                <TextArea
                  value={comment}
                  maxLength={1000}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Escribe un comentario…"
                  className="min-h-[44px]"
                  rows={2}
                />
              </label>
              <Button type="submit" variant="primary" icon={Send} disabled={comment.trim() === ''}>
                Enviar
              </Button>
            </form>
          )
        )}
      </Card>

      {me.isManager && (
        <Card title="Historial" bodyClassName="p-5">
          <ol className="space-y-3 border-l border-[#242E3B] pl-4">
            {[...update.history].reverse().map((ev) => (
              <li key={ev.id} className="relative">
                <span className="absolute -left-[21px] top-1 flex h-2.5 w-2.5 rounded-full border border-[#66FCF1]/50 bg-[#13151c]" />
                <div className="flex flex-wrap items-baseline gap-x-2 text-xs">
                  {ev.kind === 'reminder' && <BellRing className="h-3 w-3 text-[#F59E0B]" aria-hidden="true" />}
                  <span className="font-semibold text-white">{nameOf(ev.actorId)}</span>
                  <span className="text-[#C5C6C7]/80">{EVENT_LABEL[ev.kind]}</span>
                  {ev.note && <span className="text-[#C5C6C7]/60">· {ev.note}</span>}
                </div>
                <div className="font-mono text-[10px] text-[#C5C6C7]/50">{formatDateTime(ev.at)}</div>
              </li>
            ))}
          </ol>
        </Card>
      )}
    </div>
  );
};
