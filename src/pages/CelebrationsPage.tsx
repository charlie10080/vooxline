import React, { useCallback, useMemo, useState } from 'react';
import { Award, CalendarHeart, Coins, Gift, PackageCheck, PartyPopper, Send } from 'lucide-react';
import type { BadgeType, CelebrationsError } from '@/types/celebrations';
import {
  BADGES,
  MESSAGE_MAX,
  buildFeed,
  buildMilestones,
  monthKey,
  pointsBalance,
  pointsFor,
  upcomingEvents,
} from '@/lib/celebrations';
import { getProfile } from '@/lib/groups';
import { todayStr } from '@/lib/schedule';
import { useCelebrationsStore } from '@/store/useCelebrationsStore';
import { useDirectoryStore } from '@/store/useDirectoryStore';
import { useCurrentUser } from '@/store/useSessionStore';
import { useWorkforceStore } from '@/store/useWorkforceStore';
import { Button, Field, Modal, Notice, PageHeader, Select, StatCard, Tabs, TextArea } from '@/components/ui';
import { RecognitionFeed } from '@/components/celebrations/RecognitionFeed';
import { RewardsPanel } from '@/components/celebrations/RewardsPanel';
import { SpecialDates } from '@/components/celebrations/SpecialDates';
import type { Report } from '@/components/celebrations/shared';

const ERRORS: Record<CelebrationsError, string> = {
  not_found: 'No se encontró el registro. Puede que lo hayan eliminado.',
  invalid: 'Revisa los datos: hay campos vacíos o fuera de rango.',
  self_recognition: 'No puedes reconocerte a ti mismo. ¡Reconoce a un compañero!',
  forbidden: 'Solo supervisores y administradores pueden hacer esto.',
  inactive_user: 'El usuario está inactivo.',
  insufficient_points: 'No tienes puntos suficientes para este premio.',
  out_of_stock: 'Este premio está agotado.',
  reward_inactive: 'Este premio no está disponible por ahora.',
  already_processed: 'Este canje ya fue procesado.',
};

type Tab = 'feed' | 'dates' | 'rewards';

export const CelebrationsPage: React.FC = () => {
  const { agent, isManager } = useCurrentUser();
  const currentUserId = agent?.id ?? '';
  const agents = useWorkforceStore((s) => s.agents);
  const profiles = useDirectoryStore((s) => s.profiles);
  const recognitions = useCelebrationsStore((s) => s.recognitions);
  const redemptions = useCelebrationsStore((s) => s.redemptions);
  const birthdays = useCelebrationsStore((s) => s.birthdays);
  const activeRewards = useCelebrationsStore((s) => s.rewards.filter((r) => r.active).length);
  const giveRecognition = useCelebrationsStore((s) => s.giveRecognition);

  const today = todayStr();
  const [tab, setTab] = useState<Tab>('feed');
  const [notice, setNotice] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);
  const [giving, setGiving] = useState(false);
  const [toId, setToId] = useState('');
  const [badge, setBadge] = useState<BadgeType>('best_service');
  const [message, setMessage] = useState('');

  const nameOf = useCallback((id: string) => agents.find((a) => a.id === id)?.name ?? 'Usuario', [agents]);
  const people = useMemo(
    () => agents.filter((a) => getProfile(profiles, a.id).active).map((a) => ({ id: a.id, name: a.name })),
    [agents, profiles],
  );
  // Las fechas usan el perfil "por defecto" para agentes sin perfil, igual que el resto de la app
  const allProfiles = useMemo(() => agents.map((a) => getProfile(profiles, a.id)), [agents, profiles]);
  const events = useMemo(() => upcomingEvents(allProfiles, birthdays, today), [allProfiles, birthdays, today]);
  const feed = useMemo(
    () => buildFeed(recognitions, buildMilestones(allProfiles, agents, today)),
    [recognitions, allProfiles, agents, today],
  );

  const report: Report = useCallback((result, success) => {
    if (result.ok) {
      if (success) setNotice({ tone: 'success', text: success });
      return true;
    }
    setNotice({ tone: 'danger', text: ERRORS[result.reason] });
    return false;
  }, []);

  const thisMonth = today.slice(0, 7);
  const receivedThisMonth = recognitions.filter((r) => r.toId === currentUserId && monthKey(r.createdAt) === thisMonth).length;
  const upcomingWeek = events.filter((e) => e.daysUntil <= 7).length;
  const pendingRedemptions = redemptions.filter((r) => r.status === 'pending' || r.status === 'approved').length;

  const openGive = () => {
    setToId(people.find((p) => p.id !== currentUserId)?.id ?? '');
    setBadge('best_service');
    setMessage('');
    setGiving(true);
  };
  const submitGive = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = report(
      giveRecognition(currentUserId, toId, badge, message),
      `Reconocimiento enviado a ${nameOf(toId)} (+${pointsFor(isManager)} pts).`,
    );
    if (ok) {
      setGiving(false);
      setTab('feed');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={PartyPopper}
        eyebrow="CULTURA · RECONOCIMIENTOS"
        title="Celebraciones"
        description="Reconoce el buen trabajo, celebra cumpleaños y aniversarios, y canjea puntos por premios."
        actions={
          <Button variant="primary" icon={Award} onClick={openGive} disabled={!agent}>
            Dar reconocimiento
          </Button>
        }
      />

      {notice && (
        <Notice tone={notice.tone} onClose={() => setNotice(null)}>
          {notice.text}
        </Notice>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Mi saldo" value={`${pointsBalance(currentUserId, recognitions, redemptions)} pts`} tone="accent" icon={Coins} />
        <StatCard label="Recibidos este mes" value={receivedThisMonth} hint="Reconocimientos para ti" tone="success" icon={Award} />
        <StatCard label="Próximos 7 días" value={upcomingWeek} hint="Cumpleaños y aniversarios" tone="warning" icon={CalendarHeart} />
        {isManager ? (
          <StatCard label="Canjes por atender" value={pendingRedemptions} hint="Pendientes o por entregar" tone="danger" icon={PackageCheck} />
        ) : (
          <StatCard label="Premios activos" value={activeRewards} tone="info" icon={Gift} />
        )}
      </div>

      <Tabs<Tab>
        value={tab}
        onChange={setTab}
        options={[
          { value: 'feed', label: 'Reconocimientos', count: recognitions.length },
          { value: 'dates', label: 'Fechas especiales', count: events.filter((e) => e.daysUntil <= 30).length },
          { value: 'rewards', label: 'Puntos y premios' },
        ]}
      />

      {tab === 'feed' && <RecognitionFeed feed={feed} currentUserId={currentUserId} nameOf={nameOf} report={report} />}
      {tab === 'dates' && (
        <SpecialDates
          events={events}
          today={today}
          isManager={isManager}
          currentUserId={currentUserId}
          people={people}
          nameOf={nameOf}
          report={report}
        />
      )}
      {tab === 'rewards' && (
        <RewardsPanel currentUserId={currentUserId} isManager={isManager} today={today} nameOf={nameOf} report={report} />
      )}

      <Modal
        open={giving}
        onClose={() => setGiving(false)}
        title="Dar reconocimiento"
        description={`Tu reconocimiento otorga ${pointsFor(isManager)} puntos a quien lo recibe.`}
        footer={
          <Button variant="primary" type="submit" form="give-form" icon={Send}>
            Enviar
          </Button>
        }
      >
        <form id="give-form" onSubmit={submitGive} className="space-y-4">
          <Field label="¿A quién reconoces?">
            <Select value={toId} onChange={(e) => setToId(e.target.value)} required>
              {people
                .filter((p) => p.id !== currentUserId)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </Select>
          </Field>
          <fieldset>
            <legend className="mb-1.5 text-[13px] font-medium text-vx-text-2">Insignia</legend>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(BADGES) as BadgeType[]).map((b) => (
                <button
                  key={b}
                  type="button"
                  aria-pressed={badge === b}
                  onClick={() => setBadge(b)}
                  className={`rounded-xl border px-3 py-2 text-left text-[13px] font-semibold transition-colors ${
                    badge === b
                      ? 'border-vx-accent bg-vx-accent/10 text-vx-accent'
                      : 'border-vx-border bg-vx-bg text-vx-text-2 hover:border-vx-accent/30'
                  }`}
                >
                  {BADGES[b]}
                </button>
              ))}
            </div>
          </fieldset>
          <Field label="Mensaje" hint={`${message.length}/${MESSAGE_MAX}`}>
            <TextArea
              value={message}
              maxLength={MESSAGE_MAX}
              required
              placeholder="¿Qué hizo que merece reconocimiento?"
              onChange={(e) => setMessage(e.target.value)}
            />
          </Field>
        </form>
      </Modal>
    </div>
  );
};

