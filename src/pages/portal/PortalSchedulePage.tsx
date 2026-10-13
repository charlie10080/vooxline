import React, { useState } from 'react';
import { ArrowLeftRight, CalendarClock, CalendarPlus, ChevronLeft, ChevronRight, Clock, Hand, Palmtree } from 'lucide-react';
import type { OpenShift, ScheduleResult, Shift, SwapRequest } from '@/types/scheduling';
import { useWorkforceStore } from '@/store/useWorkforceStore';
import { useDirectoryStore } from '@/store/useDirectoryStore';
import { useScheduleStore } from '@/store/useScheduleStore';
import { useCurrentUser } from '@/store/useSessionStore';
import { getProfile } from '@/lib/groups';
import {
  addDays,
  CLAIM_STATUS_META,
  formatDayLabel,
  getWeekMinutes,
  isOnApprovedTimeOff,
  isSwapPending,
  isUpcoming,
  SCHEDULE_ERROR_MESSAGES,
  startOfWeek,
  SWAP_STATUS_META,
  todayStr,
  weekDates,
} from '@/lib/schedule';
import { formatDuration } from '@/lib/time';
import { Badge, Button, Card, EmptyState, Field, Modal, Notice, PageHeader, Select, StatCard, Tabs, TextArea } from '@/components/ui';

/** Mi horario: turnos del agente, turnos abiertos para tomar e intercambios con compañeros */
export const PortalSchedulePage: React.FC = () => {
  const { profile } = useCurrentUser();
  const me = profile.agentId;
  const { agents, campaigns, timeOffRequests } = useWorkforceStore();
  const profiles = useDirectoryStore((s) => s.profiles);
  const { shifts, openShifts, claims, swaps, claimOpenShift, requestSwap, respondSwap, cancelSwap } = useScheduleStore();

  const [monday, setMonday] = useState(() => startOfWeek(todayStr()));
  const [notice, setNotice] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);
  const [swapTab, setSwapTab] = useState<'incoming' | 'outgoing'>('incoming');
  const [offering, setOffering] = useState<Shift | null>(null);
  const [offerTo, setOfferTo] = useState('');
  const [offerNote, setOfferNote] = useState('');

  const myAgent = agents.find((a) => a.id === me);
  const agentName = (id: string | null) => agents.find((a) => a.id === id)?.name ?? 'Usuario desconocido';
  const campaignName = (id: string) => campaigns.find((c) => c.id === id)?.name ?? id;
  const report = (res: ScheduleResult, success: string) =>
    setNotice(res.ok ? { tone: 'success', text: success } : { tone: 'danger', text: SCHEDULE_ERROR_MESSAGES[res.reason] });

  if (!myAgent) {
    return <EmptyState icon={CalendarClock} title="Tu usuario no tiene horario" description="Pide a tu supervisor que te asigne a una campaña." />;
  }

  const dates = weekDates(monday);
  const myShifts = shifts.filter((s) => s.agentId === me);
  const swapOf = (shiftId: string) => swaps.find((w) => w.shiftId === shiftId && isSwapPending(w));

  const available = openShifts
    .filter((o) => o.status === 'open' && isUpcoming(o))
    .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`));
  const myClaim = (os: OpenShift) => [...claims].reverse().find((c) => c.openShiftId === os.id && c.agentId === me);

  const incoming = swaps.filter((w) => {
    if (w.fromAgentId === me) return false;
    if (w.acceptedBy === me || w.toAgentId === me) return true;
    const shift = shifts.find((s) => s.id === w.shiftId);
    return w.toAgentId === null && w.status === 'pending_peer' && shift?.campaignId === myAgent.campaignId;
  });
  const outgoing = swaps.filter((w) => w.fromAgentId === me);
  const actionableIncoming = incoming.filter((w) => w.status === 'pending_peer').length;
  const shownSwaps = (swapTab === 'incoming' ? incoming : outgoing).toSorted((a, b) => b.createdAt.localeCompare(a.createdAt));

  const coworkers = agents.filter((a) => a.id !== me && getProfile(profiles, a.id).active);

  const openOffer = (shift: Shift) => {
    setOffering(shift);
    setOfferTo('');
    setOfferNote('');
  };
  const submitOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!offering) return;
    const res = requestSwap(me, offering.id, offerTo || null, offerNote);
    report(res, 'Turno ofrecido. Te avisaremos cuando un compañero responda.');
    if (res.ok) setOffering(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={CalendarClock}
        eyebrow="MI HORARIO"
        title="Mi horario"
        description="Consulta tus turnos, toma turnos abiertos y cambia turnos con tus compañeros."
      />

      {notice && (
        <Notice tone={notice.tone} onClose={() => setNotice(null)}>
          {notice.text}
        </Notice>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Horas programadas (semana)" value={formatDuration(getWeekMinutes(shifts, me, dates))} icon={Clock} tone="accent" />
        <StatCard label="Turnos abiertos disponibles" value={available.length} icon={CalendarPlus} tone="warning" />
        <StatCard label="Intercambios por responder" value={actionableIncoming} icon={ArrowLeftRight} tone="info" />
      </div>

      <Card
        title="Mi semana"
        subtitle={`Del ${formatDayLabel(dates[0])} al ${formatDayLabel(dates[6])}`}
        actions={
          <div className="flex items-center gap-1.5">
            <Button size="sm" aria-label="Semana anterior" onClick={() => setMonday(addDays(monday, -7))}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" onClick={() => setMonday(startOfWeek(todayStr()))}>
              Hoy
            </Button>
            <Button size="sm" aria-label="Semana siguiente" onClick={() => setMonday(addDays(monday, 7))}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
          {dates.map((date) => {
            const day = myShifts.filter((s) => s.date === date);
            const isToday = date === todayStr();
            return (
              <div
                key={date}
                className={`min-h-[120px] rounded-xl border p-3 ${isToday ? 'border-vx-accent/50 bg-vx-accent/[0.04]' : 'border-vx-border bg-vx-bg'}`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className={`text-[13px] font-bold capitalize ${isToday ? 'text-vx-accent' : 'text-vx-text'}`}>{formatDayLabel(date)}</span>
                  {isToday && <Badge tone="accent">Hoy</Badge>}
                </div>
                {isOnApprovedTimeOff(timeOffRequests, me, date) && (
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-vx-warning">
                    <Palmtree className="h-3.5 w-3.5" /> Permiso
                  </div>
                )}
                {day.length === 0 && <p className="text-xs text-vx-text-2/40">Descanso</p>}
                <div className="space-y-2">
                  {day.map((s) => {
                    const pendingSwap = swapOf(s.id);
                    const cancelled = s.status === 'cancelled';
                    return (
                      <div key={s.id} className={`rounded-lg border p-2 ${cancelled ? 'border-vx-border opacity-50' : 'border-vx-accent/30 bg-vx-accent/10'}`}>
                        <div className={`tabular-nums text-xs font-bold ${cancelled ? 'line-through text-vx-text-2' : 'text-vx-accent'}`}>
                          {s.startTime} – {s.endTime}
                        </div>
                        <div className="truncate text-xs text-vx-text-2/60">{campaignName(s.campaignId)}</div>
                        {cancelled ? (
                          <Badge tone="danger" className="mt-1.5">Cancelado</Badge>
                        ) : pendingSwap ? (
                          <Badge tone="info" className="mt-1.5">En intercambio</Badge>
                        ) : (
                          isUpcoming(s) && (
                            <button
                              type="button"
                              onClick={() => openOffer(s)}
                              className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-vx-text-2 hover:text-vx-accent"
                            >
                              <ArrowLeftRight className="h-3 w-3" /> Ofrecer
                            </button>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card title="Turnos abiertos" subtitle="Toma un turno extra. Algunos requieren aprobación del supervisor." bodyClassName="p-0">
          {available.length === 0 ? (
            <EmptyState icon={CalendarPlus} title="No hay turnos abiertos por ahora" />
          ) : (
            <ul className="divide-y divide-vx-border">
              {available.map((os) => {
                const claim = myClaim(os);
                const mine = os.campaignId === myAgent.campaignId;
                return (
                  <li key={os.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold capitalize text-vx-text">{formatDayLabel(os.date)}</span>
                        <span className="tabular-nums text-sm text-vx-accent">
                          {os.startTime} – {os.endTime}
                        </span>
                      </div>
                      <div className="text-xs text-vx-text-2/60">
                        {campaignName(os.campaignId)}
                        {mine && ' · tu campaña'}
                        {os.breakMinutes > 0 && ` · Descanso ${os.breakMinutes} min`}
                      </div>
                      {os.note && <p className="text-xs text-vx-text-2/70">{os.note}</p>}
                    </div>
                    {claim?.status === 'pending' ? (
                      <Badge tone={CLAIM_STATUS_META.pending.tone}>Solicitud enviada</Badge>
                    ) : (
                      <div className="flex items-center gap-2">
                        {claim?.status === 'rejected' && <Badge tone="danger">Rechazada</Badge>}
                        <Button
                          size="sm"
                          variant="primary"
                          icon={Hand}
                          onClick={() =>
                            report(
                              claimOpenShift(me, os.id),
                              os.requiresApproval ? 'Solicitud enviada a tu supervisor.' : '¡Listo! El turno ya está en tu horario.',
                            )
                          }
                        >
                          {os.requiresApproval ? 'Solicitar' : 'Tomar turno'}
                        </Button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card
          title="Intercambios"
          subtitle="Ofrece un turno desde tu semana o acepta el de un compañero."
          actions={
            <Tabs
              value={swapTab}
              onChange={setSwapTab}
              options={[
                { value: 'incoming', label: 'Recibidos', count: actionableIncoming },
                { value: 'outgoing', label: 'Enviados', count: outgoing.filter(isSwapPending).length },
              ]}
            />
          }
          bodyClassName="p-0"
        >
          {shownSwaps.length === 0 ? (
            <EmptyState icon={ArrowLeftRight} title={swapTab === 'incoming' ? 'No tienes ofertas de intercambio' : 'No has ofrecido turnos'} />
          ) : (
            <ul className="divide-y divide-vx-border">
              {shownSwaps.map((w) => (
                <SwapRow
                  key={w.id}
                  swap={w}
                  shift={shifts.find((s) => s.id === w.shiftId)}
                  me={me}
                  agentName={agentName}
                  campaignName={campaignName}
                  onAccept={() => report(respondSwap(me, w.id, true), 'Aceptaste el turno. Falta la aprobación del supervisor.')}
                  onDecline={() => report(respondSwap(me, w.id, false), 'Rechazaste la oferta de intercambio.')}
                  onCancel={() => report(cancelSwap(me, w.id), 'Oferta de intercambio cancelada.')}
                />
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Modal
        open={offering !== null}
        onClose={() => setOffering(null)}
        title="Ofrecer turno"
        description={offering ? `${formatDayLabel(offering.date)} · ${offering.startTime} – ${offering.endTime} · ${campaignName(offering.campaignId)}` : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOffering(null)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" form="swap-offer-form">
              Enviar oferta
            </Button>
          </>
        }
      >
        <form id="swap-offer-form" onSubmit={submitOffer} className="space-y-3.5">
          <Field label="¿A quién se lo ofreces?" hint="Tu compañero acepta y luego el supervisor aprueba el cambio.">
            <Select value={offerTo} onChange={(e) => setOfferTo(e.target.value)}>
              <option value="">Cualquiera de mi campaña</option>
              {coworkers.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Motivo (opcional)">
            <TextArea value={offerNote} onChange={(e) => setOfferNote(e.target.value)} placeholder="Ej: tengo una cita médica" />
          </Field>
        </form>
      </Modal>
    </div>
  );
};

const SwapRow: React.FC<{
  swap: SwapRequest;
  shift: Shift | undefined;
  me: string;
  agentName: (id: string | null) => string;
  campaignName: (id: string) => string;
  onAccept: () => void;
  onDecline: () => void;
  onCancel: () => void;
}> = ({ swap, shift, me, agentName, campaignName, onAccept, onDecline, onCancel }) => {
  const outgoing = swap.fromAgentId === me;
  const target = swap.acceptedBy ?? swap.toAgentId;
  return (
    <li className="space-y-2 px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[13px] text-vx-text">
          {outgoing ? (
            <>
              Para <span className="font-semibold">{target ? agentName(target) : 'cualquiera de tu campaña'}</span>
            </>
          ) : (
            <>
              De <span className="font-semibold">{agentName(swap.fromAgentId)}</span>
            </>
          )}
        </span>
        <Badge tone={SWAP_STATUS_META[swap.status].tone}>{SWAP_STATUS_META[swap.status].label}</Badge>
      </div>
      <div className="tabular-nums text-[13px] text-vx-accent">
        {shift ? (
          <>
            <span className="capitalize">{formatDayLabel(shift.date)}</span> · {shift.startTime} – {shift.endTime}
            <span className="text-vx-text-2/60"> · {campaignName(shift.campaignId)}</span>
          </>
        ) : (
          <span className="text-vx-text-2/60">Turno eliminado</span>
        )}
      </div>
      {swap.note && <p className="text-xs text-vx-text-2/60">“{swap.note}”</p>}
      <div className="flex flex-wrap gap-2">
        {!outgoing && swap.status === 'pending_peer' && (
          <>
            <Button size="sm" variant="primary" onClick={onAccept}>
              Aceptar turno
            </Button>
            {swap.toAgentId === me && (
              <Button size="sm" variant="danger" onClick={onDecline}>
                Rechazar
              </Button>
            )}
          </>
        )}
        {outgoing && isSwapPending(swap) && (
          <Button size="sm" variant="ghost" onClick={onCancel}>
            Cancelar oferta
          </Button>
        )}
      </div>
    </li>
  );
};
