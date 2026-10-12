import React, { useMemo, useState } from 'react';
import { Briefcase, Cake, CalendarDays, Pencil, PartyPopper } from 'lucide-react';
import type { CelebrationEvent } from '@/types/celebrations';
import type { DateBucket } from '@/lib/celebrations';
import { dateBucket, monthSequence } from '@/lib/celebrations';
import { useCelebrationsStore } from '@/store/useCelebrationsStore';
import { Avatar, Badge, Button, Card, EmptyState, Field, Modal, Select } from '@/components/ui';
import { formatDay } from './shared';
import type { Report } from './shared';

const BUCKETS: Array<{ key: Exclude<DateBucket, 'later'>; title: string; empty: string }> = [
  { key: 'today', title: 'Hoy', empty: 'Nada que celebrar hoy.' },
  { key: 'week', title: 'Esta semana', empty: 'Sin fechas el resto de la semana.' },
  { key: 'month', title: 'Este mes', empty: 'Sin más fechas este mes.' },
];

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const pad = (n: number): string => String(n).padStart(2, '0');

const eventLabel = (e: CelebrationEvent): string =>
  e.kind === 'birthday' ? 'Cumpleaños' : `${e.years} ${e.years === 1 ? 'año' : 'años'} en Vooxline`;

const EventRow: React.FC<{ e: CelebrationEvent; nameOf: (id: string) => string }> = ({ e, nameOf }) => (
  <li className="flex items-center gap-3 rounded-xl border border-[#242E3B] bg-[#0B0C10] p-3">
    <Avatar name={nameOf(e.agentId)} size="sm" />
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-semibold text-white">{nameOf(e.agentId)}</p>
      <p className="flex items-center gap-1.5 text-[11px] text-[#C5C6C7]/60">
        {e.kind === 'birthday' ? <Cake className="h-3 w-3 text-[#EF4444]" /> : <Briefcase className="h-3 w-3 text-[#66FCF1]" />}
        {eventLabel(e)}
      </p>
    </div>
    <Badge tone={e.daysUntil === 0 ? 'success' : 'neutral'}>{e.daysUntil === 0 ? '¡Hoy!' : formatDay(e.date)}</Badge>
  </li>
);

const BirthdayEditor: React.FC<{
  agentId: string | null;
  onClose: () => void;
  actorId: string;
  nameOf: (id: string) => string;
  report: Report;
}> = ({ agentId, onClose, actorId, nameOf, report }) => {
  const current = useCelebrationsStore((s) => (agentId ? s.birthdays[agentId] : undefined));
  const setBirthday = useCelebrationsStore((s) => s.setBirthday);
  const [month, setMonth] = useState(current ? Number(current.slice(0, 2)) : 1);
  const [day, setDay] = useState(current ? Number(current.slice(3)) : 1);
  if (!agentId) return null;

  const save = (value: string | null) => {
    if (report(setBirthday(actorId, agentId, value), value ? 'Cumpleaños actualizado.' : 'Cumpleaños eliminado.')) onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`Cumpleaños de ${nameOf(agentId)}`}
      description="Solo se guarda el día y el mes."
      footer={
        <>
          {current && (
            <Button variant="danger" onClick={() => save(null)}>
              Quitar
            </Button>
          )}
          <Button variant="primary" onClick={() => save(`${pad(month)}-${pad(day)}`)}>
            Guardar
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Mes">
          <Select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Día">
          <Select value={day} onChange={(e) => setDay(Number(e.target.value))}>
            {Array.from({ length: 31 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </Select>
        </Field>
      </div>
    </Modal>
  );
};

export const SpecialDates: React.FC<{
  events: CelebrationEvent[];
  today: string;
  isManager: boolean;
  currentUserId: string;
  people: Array<{ id: string; name: string }>;
  nameOf: (id: string) => string;
  report: Report;
}> = ({ events, today, isManager, currentUserId, people, nameOf, report }) => {
  const birthdays = useCelebrationsStore((s) => s.birthdays);
  const [editing, setEditing] = useState<string | null>(null);

  const byBucket = useMemo(() => {
    const map: Record<DateBucket, CelebrationEvent[]> = { today: [], week: [], month: [], later: [] };
    for (const e of events) map[dateBucket(e.date, today)].push(e);
    return map;
  }, [events, today]);

  // 12 meses empezando por el actual
  // 12 meses desde el actual, agrupados por mes del calendario: lo de este mes que ya pasó cae al final de su columna (es del próximo año)
  const timeline = useMemo(
    () =>
      monthSequence(today, 12, 1).map((key) => ({
        key,
        label: MONTHS[Number(key.slice(5)) - 1],
        events: events.filter((e) => e.date.slice(5, 7) === key.slice(5)),
      })),
    [events, today],
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        {BUCKETS.map((b) => (
          <Card key={b.key} title={b.title} subtitle={`${byBucket[b.key].length} ${byBucket[b.key].length === 1 ? 'fecha' : 'fechas'}`}>
            {byBucket[b.key].length === 0 ? (
              <p className="py-6 text-center text-xs text-[#C5C6C7]/50">{b.empty}</p>
            ) : (
              <ul className="space-y-2">
                {byBucket[b.key].map((e) => (
                  <EventRow key={`${e.kind}-${e.agentId}`} e={e} nameOf={nameOf} />
                ))}
              </ul>
            )}
          </Card>
        ))}
      </div>

      <Card title="Próximos 12 meses" subtitle="Cumpleaños y aniversarios laborales del equipo activo">
        {events.length === 0 ? (
          <EmptyState icon={CalendarDays} title="Sin fechas registradas" />
        ) : (
          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {timeline.map((m) => (
              <li key={m.key} className="rounded-xl border border-[#242E3B] bg-[#0B0C10] p-3">
                <p className="mb-2 flex items-center justify-between font-mono text-[11px] font-semibold uppercase tracking-wider text-[#66FCF1]">
                  <span>{m.label}</span>
                  <span className="text-[#C5C6C7]/40">{m.events.length}</span>
                </p>
                {m.events.length === 0 ? (
                  <p className="text-[11px] text-[#C5C6C7]/30">—</p>
                ) : (
                  <ul className="space-y-1.5">
                    {m.events.map((e) => (
                      <li key={`${e.kind}-${e.agentId}`} className="flex items-center gap-2 text-xs text-[#C5C6C7]">
                        {e.kind === 'birthday' ? (
                          <Cake className="h-3 w-3 shrink-0 text-[#EF4444]" aria-label="Cumpleaños" />
                        ) : (
                          <Briefcase className="h-3 w-3 shrink-0 text-[#66FCF1]" aria-label="Aniversario" />
                        )}
                        <span className="w-10 shrink-0 font-mono text-[10px] text-[#C5C6C7]/50">{e.date.slice(8)}</span>
                        <span className="truncate">{nameOf(e.agentId)}</span>
                        {e.years !== null && <span className="ml-auto font-mono text-[10px] text-[#66FCF1]">{e.years}a</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        )}
      </Card>

      {isManager && (
        <Card title="Cumpleaños del equipo" subtitle="Registra el día y mes de cumpleaños de cada persona">
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {people.map((p) => {
              const b = birthdays[p.id];
              return (
                <li key={p.id} className="flex items-center gap-3 rounded-xl border border-[#242E3B] bg-[#0B0C10] p-3">
                  <Avatar name={p.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{p.name}</p>
                    <p className="text-[11px] text-[#C5C6C7]/60">
                      {b ? `${Number(b.slice(3))} de ${MONTHS[Number(b.slice(0, 2)) - 1].toLowerCase()}` : 'Sin registrar'}
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" icon={Pencil} aria-label={`Editar cumpleaños de ${p.name}`} onClick={() => setEditing(p.id)} />
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {!isManager && byBucket.today.length > 0 && (
        <p className="flex items-center gap-2 text-xs text-[#C5C6C7]/60">
          <PartyPopper className="h-3.5 w-3.5 text-[#66FCF1]" /> ¡Felicita a quien celebra hoy con un reconocimiento!
        </p>
      )}

      <BirthdayEditor
        key={editing ?? 'none'}
        agentId={editing}
        onClose={() => setEditing(null)}
        actorId={currentUserId}
        nameOf={nameOf}
        report={report}
      />
    </div>
  );
};
