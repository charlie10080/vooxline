import React, { useMemo, useState } from 'react';
import { Check, Coins, Gift, Medal, PackageCheck, Pencil, Plus, X } from 'lucide-react';
import type { Redemption, RedemptionStatus, Reward } from '@/types/celebrations';
import { earnedPoints, monthSequence, monthlyLeaderboard, spentPoints } from '@/lib/celebrations';
import { useCelebrationsStore } from '@/store/useCelebrationsStore';
import type { RewardDraft } from '@/store/useCelebrationsStore';
import { Avatar, Badge, Button, Card, EmptyState, Field, Input, Modal, Select, TextArea } from '@/components/ui';
import { formatMonth, timeAgo } from './shared';
import type { Report } from './shared';

const STATUS: Record<RedemptionStatus, { label: string; tone: 'warning' | 'info' | 'success' | 'danger' }> = {
  pending: { label: 'Pendiente', tone: 'warning' },
  approved: { label: 'Aprobado', tone: 'info' },
  delivered: { label: 'Entregado', tone: 'success' },
  rejected: { label: 'Rechazado', tone: 'danger' },
};

const EMPTY_DRAFT: RewardDraft = { name: '', description: '', cost: 100, stock: 10, active: true };

const RewardEditor: React.FC<{
  initial: RewardDraft | null;
  onClose: () => void;
  actorId: string;
  report: Report;
}> = ({ initial, onClose, actorId, report }) => {
  const saveReward = useCelebrationsStore((s) => s.saveReward);
  const [draft, setDraft] = useState<RewardDraft>(initial ?? EMPTY_DRAFT);
  if (!initial) return null;
  const isNew = !initial.id;

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (report(saveReward(actorId, draft), isNew ? 'Premio agregado al catálogo.' : 'Premio actualizado.')) onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={isNew ? 'Nuevo premio' : 'Editar premio'}
      footer={
        <Button variant="primary" type="submit" form="reward-form">
          Guardar
        </Button>
      }
    >
      <form id="reward-form" onSubmit={save} className="space-y-4">
        <Field label="Nombre">
          <Input value={draft.name} maxLength={60} required onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        </Field>
        <Field label="Descripción">
          <TextArea value={draft.description} maxLength={200} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Costo (puntos)">
            <Input type="number" min={1} step={1} value={draft.cost} onChange={(e) => setDraft({ ...draft, cost: Number(e.target.value) })} />
          </Field>
          <Field label="Inventario">
            <Input type="number" min={0} step={1} value={draft.stock} onChange={(e) => setDraft({ ...draft, stock: Number(e.target.value) })} />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-[13px] text-vx-text-2">
          <input
            type="checkbox"
            checked={draft.active}
            onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
            className="h-4 w-4 accent-vx-accent"
          />
          Visible para canjear
        </label>
      </form>
    </Modal>
  );
};

export const RewardsPanel: React.FC<{
  currentUserId: string;
  isManager: boolean;
  today: string;
  nameOf: (id: string) => string;
  report: Report;
}> = ({ currentUserId, isManager, today, nameOf, report }) => {
  const recognitions = useCelebrationsStore((s) => s.recognitions);
  const rewards = useCelebrationsStore((s) => s.rewards);
  const redemptions = useCelebrationsStore((s) => s.redemptions);
  const redeemReward = useCelebrationsStore((s) => s.redeemReward);
  const resolveRedemption = useCelebrationsStore((s) => s.resolveRedemption);

  const months = useMemo(() => monthSequence(today, 6, -1), [today]);
  const [month, setMonth] = useState(months[0]);
  const [editing, setEditing] = useState<RewardDraft | null>(null);

  const earned = earnedPoints(currentUserId, recognitions);
  const spent = spentPoints(currentUserId, redemptions);
  const leaderboard = useMemo(() => monthlyLeaderboard(recognitions, month), [recognitions, month]);
  const visibleRewards = isManager ? rewards : rewards.filter((r) => r.active);
  const visibleRedemptions = isManager ? redemptions : redemptions.filter((r) => r.agentId === currentUserId);

  const redeem = (r: Reward) => report(redeemReward(currentUserId, r.id), `Canjeaste "${r.name}". Tu supervisor lo revisará.`);
  const resolve = (r: Redemption, action: 'approve' | 'deliver' | 'reject') =>
    report(
      resolveRedemption(currentUserId, r.id, action),
      action === 'approve' ? 'Canje aprobado.' : action === 'deliver' ? 'Canje marcado como entregado.' : 'Canje rechazado: se devolvieron los puntos y el inventario.',
    );

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <div className="relative overflow-hidden rounded-2xl border border-vx-accent/25 bg-gradient-to-br from-vx-accent/[0.08] to-vx-surface p-6">
            <p className="tabular-nums text-[13px] text-vx-text-2/60">Tu saldo disponible</p>
            <p className="mt-1 flex items-baseline gap-2 tabular-nums text-4xl font-bold text-vx-text">
              {earned - spent} <span className="text-sm font-semibold text-vx-accent">pts</span>
            </p>
            <p className="mt-2 text-[13px] text-vx-text-2/60">
              Ganados {earned} · Canjeados {spent}
            </p>
            <Coins className="pointer-events-none absolute -right-4 -bottom-4 h-28 w-28 text-vx-accent/10" />
          </div>

          <Card
            title="Catálogo de premios"
            subtitle="Canjea tus puntos por beneficios reales"
            actions={
              isManager && (
                <Button size="sm" variant="primary" icon={Plus} onClick={() => setEditing({ ...EMPTY_DRAFT })}>
                  Nuevo premio
                </Button>
              )
            }
          >
            {visibleRewards.length === 0 ? (
              <EmptyState icon={Gift} title="No hay premios disponibles" />
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {visibleRewards.map((r) => (
                  <li key={r.id} className={`flex flex-col rounded-xl border border-vx-border bg-vx-bg p-4 ${r.active ? '' : 'opacity-60'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="rounded-lg border border-vx-accent/25 bg-vx-accent/10 p-2 text-vx-accent">
                          <Gift className="h-4 w-4" />
                        </span>
                        <p className="text-sm font-bold text-vx-text">{r.name}</p>
                      </div>
                      {isManager && (
                        <Button size="sm" variant="ghost" icon={Pencil} aria-label={`Editar ${r.name}`} onClick={() => setEditing({ ...r })} />
                      )}
                    </div>
                    <p className="mt-2 flex-1 text-[13px] text-vx-text-2/70">{r.description}</p>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-1.5">
                        <Badge tone="accent">{r.cost} pts</Badge>
                        <Badge tone={r.stock > 0 ? 'neutral' : 'danger'}>{r.stock > 0 ? `${r.stock} disponibles` : 'Agotado'}</Badge>
                        {!r.active && <Badge tone="warning">Oculto</Badge>}
                      </div>
                      <Button size="sm" variant="secondary" onClick={() => redeem(r)}>
                        Canjear
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <Card
          title={
            <span className="flex items-center gap-2">
              <Medal className="h-4 w-4 text-vx-warning" /> Tabla de líderes
            </span>
          }
          subtitle="Puntos recibidos en el mes"
          actions={
            <Select aria-label="Mes de la tabla de líderes" value={month} onChange={(e) => setMonth(e.target.value)} className="w-auto capitalize">
              {months.map((m) => (
                <option key={m} value={m}>
                  {formatMonth(m)}
                </option>
              ))}
            </Select>
          }
        >
          {leaderboard.length === 0 ? (
            <EmptyState icon={Medal} title="Sin reconocimientos este mes" />
          ) : (
            <ol className="space-y-2">
              {leaderboard.map((row, i) => (
                <li
                  key={row.agentId}
                  className={`flex items-center gap-3 rounded-xl border p-3 ${
                    row.agentId === currentUserId ? 'border-vx-accent/40 bg-vx-accent/[0.06]' : 'border-vx-border bg-vx-bg'
                  }`}
                >
                  <span className={`w-6 text-center tabular-nums text-sm font-bold ${i === 0 ? 'text-vx-warning' : 'text-vx-text-2/50'}`}>{i + 1}</span>
                  <Avatar name={nameOf(row.agentId)} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-vx-text">{nameOf(row.agentId)}</p>
                    <p className="text-xs text-vx-text-2/50">
                      {row.count} {row.count === 1 ? 'reconocimiento' : 'reconocimientos'}
                    </p>
                  </div>
                  <span className="tabular-nums text-sm font-bold text-vx-accent">{row.points}</span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      <Card title={isManager ? 'Solicitudes de canje' : 'Mis canjes'} subtitle={isManager ? 'Aprueba y marca como entregados los premios' : undefined} bodyClassName="p-0">
        {visibleRedemptions.length === 0 ? (
          <EmptyState icon={PackageCheck} title="Sin canjes todavía" />
        ) : (
          <ul className="divide-y divide-vx-border">
            {visibleRedemptions.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                <Avatar name={nameOf(r.agentId)} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-vx-text">
                    {isManager && <span className="font-semibold">{nameOf(r.agentId)} · </span>}
                    {r.rewardName}
                  </p>
                  <p className="tabular-nums text-xs text-vx-text-2/50">
                    {r.cost} pts · {timeAgo(r.requestedAt)}
                  </p>
                </div>
                <Badge tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Badge>
                {isManager && (r.status === 'pending' || r.status === 'approved') && (
                  <div className="flex gap-1.5">
                    {r.status === 'pending' ? (
                      <Button size="sm" variant="primary" icon={Check} onClick={() => resolve(r, 'approve')}>
                        Aprobar
                      </Button>
                    ) : (
                      <Button size="sm" variant="primary" icon={PackageCheck} onClick={() => resolve(r, 'deliver')}>
                        Entregado
                      </Button>
                    )}
                    <Button size="sm" variant="danger" icon={X} onClick={() => resolve(r, 'reject')}>
                      Rechazar
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <RewardEditor
        key={editing ? (editing.id ?? 'new') : 'closed'}
        initial={editing}
        onClose={() => setEditing(null)}
        actorId={currentUserId}
        report={report}
      />
    </div>
  );
};
