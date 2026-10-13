import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Megaphone, Pin, Plus } from 'lucide-react';
import type { Update, UpdateAudience, UpdateError, UpdateResult, UpdateState } from '@/types/updates';
import { Badge, Button, Card, EmptyState, Modal, Notice, PageHeader, Tabs } from '@/components/ui';
import { UpdateComposer } from '@/components/updates/UpdateComposer';
import { UpdateDetail } from '@/components/updates/UpdateDetail';
import { useCurrentUser } from '@/store/useSessionStore';
import { useDirectoryStore } from '@/store/useDirectoryStore';
import { useUpdatesStore } from '@/store/useUpdatesStore';
import { useWorkforceStore } from '@/store/useWorkforceStore';
import {
  CATEGORY_LABELS,
  CATEGORY_TONE,
  STATE_LABEL,
  feedFor,
  getUpdateState,
  getUpdateStats,
  publishedAt,
  timeAgo,
} from '@/lib/updates';
import type { AudienceContext } from '@/lib/updates';

const ERROR_MESSAGES: Record<UpdateError, string> = {
  not_found: 'El aviso ya no existe.',
  invalid: 'Revisa los datos: título (3 a 120 caracteres), mensaje, audiencia y que el vencimiento sea posterior a la publicación.',
  forbidden: 'Solo supervisores y administradores pueden gestionar avisos.',
  not_in_audience: 'Este aviso no está dirigido a ti.',
  not_live: 'El aviso no está publicado en este momento.',
  comments_disabled: 'Los comentarios están desactivados en este aviso.',
  confirmation_not_required: 'Este aviso no requiere confirmación.',
  nobody_pending: 'Todos ya completaron este aviso; no hay a quién recordarle.',
};

type AgentTab = 'all' | 'unread' | 'pending';
type ManagerTab = 'live' | 'scheduled' | 'draft' | 'closed';
const MANAGER_TAB_STATES: Record<ManagerTab, UpdateState[]> = {
  live: ['live'],
  scheduled: ['scheduled'],
  draft: ['draft'],
  closed: ['expired', 'archived'],
};

/** Texto plano corto para la lista (sin marcas de formato) */
const excerpt = (body: string): string => {
  const plain = body.replace(/\*\*/g, '').replace(/^\s*[-*•]\s+/gm, '').replace(/\s+/g, ' ').trim();
  return plain.length > 110 ? `${plain.slice(0, 110)}…` : plain;
};

export const UpdatesPage: React.FC = () => {
  const { agent, isManager } = useCurrentUser();
  const meId = agent?.id ?? '';
  const updates = useUpdatesStore((s) => s.updates);
  const markRead = useUpdatesStore((s) => s.markRead);
  const deleteUpdate = useUpdatesStore((s) => s.deleteUpdate);
  const agents = useWorkforceStore((s) => s.agents);
  const campaigns = useWorkforceStore((s) => s.campaigns);
  const profiles = useDirectoryStore((s) => s.profiles);
  const groups = useDirectoryStore((s) => s.groups);
  const ctx: AudienceContext = useMemo(() => ({ agents, profiles, groups }), [agents, profiles, groups]);

  // Hora de referencia: se refresca cada minuto para que los programados aparezcan y los vencidos salgan solos
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(t);
  }, []);

  const [agentTab, setAgentTab] = useState<AgentTab>('all');
  const [managerTab, setManagerTab] = useState<ManagerTab>('live');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composer, setComposer] = useState<{ editing: Update | null } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Update | null>(null);
  const [notice, setNotice] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);

  const nameOf = (id: string) => agents.find((a) => a.id === id)?.name ?? 'Usuario eliminado';
  const audienceLabel = (a: UpdateAudience): string => {
    if (a.kind === 'everyone') return 'Toda la operación';
    if (a.kind === 'group') return `Grupo ${groups.find((g) => g.id === a.groupId)?.name ?? 'eliminado'}`;
    return a.campaignIds.map((id) => campaigns.find((c) => c.id === id)?.name ?? id).join(', ');
  };

  const onResult = (result: UpdateResult, successMessage: string): boolean => {
    setNotice(result.ok ? { tone: 'success', text: successMessage } : { tone: 'danger', text: ERROR_MESSAGES[result.reason] });
    return result.ok;
  };

  // Agentes: su feed. Supervisores: todos los avisos por estado.
  const feed = useMemo(() => feedFor(updates, meId, ctx, now), [updates, meId, ctx, now]);
  const isUnread = (u: Update) => !u.reads[meId];
  const isPending = (u: Update) => u.requiresConfirmation && !u.confirmations[meId];

  const managerCounts = Object.fromEntries(
    (Object.keys(MANAGER_TAB_STATES) as ManagerTab[]).map((tab) => [
      tab,
      updates.filter((u) => MANAGER_TAB_STATES[tab].includes(getUpdateState(u, now))).length,
    ]),
  ) as Record<ManagerTab, number>;

  const list: Update[] = isManager
    ? updates
        .filter((u) => MANAGER_TAB_STATES[managerTab].includes(getUpdateState(u, now)))
        .sort((a, b) => Number(b.pinned) - Number(a.pinned) || publishedAt(b).localeCompare(publishedAt(a)))
    : feed.filter((u) => (agentTab === 'unread' ? isUnread(u) : agentTab === 'pending' ? isPending(u) : true));

  // Un agente solo puede abrir avisos de su feed; un supervisor, cualquiera
  const selected = (isManager ? updates : feed).find((u) => u.id === selectedId) ?? null;

  const open = (u: Update) => {
    setSelectedId(u.id);
    setNotice(null);
    // Abrir marca como leído si el aviso está dirigido al usuario; si no, no hay nada que marcar
    if (feed.some((f) => f.id === u.id) && isUnread(u)) markRead(u.id);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Megaphone}
        eyebrow="COMUNICACIÓN INTERNA"
        title="Avisos"
        description={
          isManager
            ? 'Publica comunicados para la operación, campañas o grupos y da seguimiento a quién los leyó y confirmó.'
            : 'Comunicados de supervisión y RR.HH. dirigidos a ti. Los que requieren confirmación aparecen marcados.'
        }
        actions={
          isManager && (
            <Button variant="primary" icon={Plus} onClick={() => setComposer({ editing: null })}>
              Nuevo aviso
            </Button>
          )
        }
      />

      {notice && (
        <Notice tone={notice.tone} onClose={() => setNotice(null)}>
          {notice.text}
        </Notice>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(320px,400px)_1fr]">
        <div className="space-y-3">
          {isManager ? (
            <Tabs<ManagerTab>
              value={managerTab}
              onChange={setManagerTab}
              options={[
                { value: 'live', label: 'Publicados', count: managerCounts.live },
                { value: 'scheduled', label: 'Programados', count: managerCounts.scheduled },
                { value: 'draft', label: 'Borradores', count: managerCounts.draft },
                { value: 'closed', label: 'Cerrados', count: managerCounts.closed },
              ]}
            />
          ) : (
            <Tabs<AgentTab>
              value={agentTab}
              onChange={setAgentTab}
              options={[
                { value: 'all', label: 'Todos', count: feed.length },
                { value: 'unread', label: 'Sin leer', count: feed.filter(isUnread).length },
                { value: 'pending', label: 'Por confirmar', count: feed.filter(isPending).length },
              ]}
            />
          )}

          {list.length === 0 ? (
            <Card>
              <EmptyState
                icon={Megaphone}
                title="No hay avisos aquí"
                description={isManager ? 'Crea un aviso nuevo o revisa otra pestaña.' : 'Estás al día con todos los comunicados.'}
              />
            </Card>
          ) : (
            <ul className="space-y-2.5">
              {list.map((u) => {
                const state = getUpdateState(u, now);
                const unread = !isManager && isUnread(u);
                const pending = !isManager && isPending(u);
                const stats = isManager ? getUpdateStats(u, ctx) : null;
                const active = u.id === selected?.id;
                return (
                  <li key={u.id}>
                    <button
                      type="button"
                      onClick={() => open(u)}
                      aria-current={active ? 'true' : undefined}
                      className={`relative w-full rounded-2xl border p-4 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-vx-accent/60 ${
                        active
                          ? 'border-vx-accent/50 bg-vx-accent/[0.06]'
                          : unread
                            ? 'border-vx-accent/25 bg-vx-surface hover:border-vx-accent/45'
                            : 'border-vx-border bg-vx-surface hover:border-vx-accent/30'
                      }`}
                    >
                      {unread && <span className="absolute inset-y-3 left-0 w-1 rounded-r-full bg-vx-accent" aria-hidden="true" />}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {u.pinned && <Pin className="h-3.5 w-3.5 text-vx-accent" aria-label="Fijado" />}
                        <Badge tone={CATEGORY_TONE[u.category]}>{CATEGORY_LABELS[u.category]}</Badge>
                        {isManager && state !== 'live' && <Badge tone={STATE_LABEL[state].tone}>{STATE_LABEL[state].label}</Badge>}
                        {unread && <Badge tone="accent">Nuevo</Badge>}
                        {pending && <Badge tone="warning">Por confirmar</Badge>}
                        {!isManager && u.requiresConfirmation && !pending && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-vx-success" aria-label="Confirmado" />
                        )}
                        <span className="ml-auto tabular-nums text-xs text-vx-text-2/50">{timeAgo(publishedAt(u), now)}</span>
                      </div>
                      <p className={`mt-2 text-sm ${unread ? 'font-bold text-vx-text' : 'font-semibold text-vx-text/90'}`}>{u.title}</p>
                      <p className="mt-1 text-[13px] text-vx-text-2/60">{excerpt(u.body)}</p>
                      {stats && (
                        <div className="mt-3 flex items-center gap-2.5">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-vx-bg">
                            <div
                              className={`h-full rounded-full ${stats.percent === 100 ? 'bg-vx-success' : 'bg-vx-accent'}`}
                              style={{ width: `${stats.percent}%` }}
                            />
                          </div>
                          <span className="tabular-nums text-xs text-vx-text-2/60">
                            {stats.audience.length - stats.pending.length}/{stats.audience.length}{' '}
                            {u.requiresConfirmation ? 'confirmaron' : 'leyeron'}
                          </span>
                        </div>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div>
          {selected ? (
            <UpdateDetail
              key={selected.id}
              update={selected}
              ctx={ctx}
              now={now}
              me={{ id: meId, isManager }}
              audienceLabel={audienceLabel(selected.audience)}
              nameOf={nameOf}
              onResult={onResult}
              onEdit={() => setComposer({ editing: selected })}
              onDelete={() => setConfirmDelete(selected)}
            />
          ) : (
            <Card>
              <EmptyState icon={Megaphone} title="Selecciona un aviso" description="Ábrelo para leerlo completo, reaccionar y comentar." />
            </Card>
          )}
        </div>
      </div>

      {composer && (
        <UpdateComposer
          key={composer.editing?.id ?? 'new'}
          editing={composer.editing}
          ctx={ctx}
          campaigns={campaigns}
          authorId={meId}
          onClose={() => setComposer(null)}
          onResult={(result, msg) => {
            if (onResult(result, msg)) setComposer(null);
          }}
        />
      )}

      <Modal
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title="Eliminar aviso"
        description="Se borran también sus lecturas, confirmaciones y comentarios. Si solo quieres ocultarlo, archívalo."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (confirmDelete && onResult(deleteUpdate(confirmDelete.id), 'Aviso eliminado.')) setSelectedId(null);
                setConfirmDelete(null);
              }}
            >
              Eliminar
            </Button>
          </>
        }
      >
        <p className="text-sm text-vx-text-2">
          ¿Seguro que quieres eliminar <span className="font-semibold text-vx-text">{confirmDelete?.title}</span>?
        </p>
      </Modal>
    </div>
  );
};
