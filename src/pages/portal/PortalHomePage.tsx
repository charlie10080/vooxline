import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Play,
  Square,
  Coffee,
  MapPin,
  CalendarDays,
  Timer,
  ShieldCheck,
  AlertTriangle,
  ChevronRight,
  Clock,
} from 'lucide-react';
import type { ActionError } from '@/types';
import { Badge, Button, Card, EmptyState, Notice, StatCard } from '@/components/ui';
import { useCurrentUser } from '@/store/useSessionStore';
import { useWorkforceStore } from '@/store/useWorkforceStore';
import { useScheduleStore } from '@/store/useScheduleStore';
import { readBrowserLocation, checkLocation, geoCheckWarning, describeGeoCheck } from '@/lib/geo';
import { getWorkedMinutes } from '@/lib/metrics';
import { getEntryPunctuality, describeAlert, flagMinutes } from '@/lib/punctuality';
import { getScheduledMinutesFor, startOfWeek, todayStr, weekDates, getWeekMinutes, formatDayLabel } from '@/lib/schedule';
import { formatClock, formatDuration } from '@/lib/time';

const ERROR_MESSAGES: Partial<Record<ActionError, string>> = {
  not_found: 'No encontramos tu usuario.',
  already_clocked_in: 'Ya tienes un turno abierto.',
  not_clocked_in: 'No tienes un turno abierto.',
  on_break: 'Ya estás en descanso.',
  not_on_break: 'No estás en descanso.',
};

const pad = (n: number): string => String(n).padStart(2, '0');
const formatTimer = (totalSeconds: number): string =>
  `${pad(Math.floor(totalSeconds / 3600))}:${pad(Math.floor((totalSeconds % 3600) / 60))}:${pad(totalSeconds % 60)}`;

export const PortalHomePage: React.FC = () => {
  const { agent } = useCurrentUser();
  const { timeEntries, clockIn, clockOut, startBreak, endBreak } = useWorkforceStore();
  const shifts = useScheduleStore((s) => s.shifts);
  const [now, setNow] = useState(() => new Date());
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'success' | 'warning' | 'danger'; text: string } | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!agent) {
    return <EmptyState icon={AlertTriangle} title="No hay un usuario activo" description="Elige un usuario en el menú superior." />;
  }

  const today = todayStr();
  const openEntry = timeEntries.find((e) => e.agentId === agent.id && e.clockOut === null) ?? null;
  const onBreak = Boolean(openEntry?.breakStartedAt);
  const todayShifts = shifts
    .filter((s) => s.agentId === agent.id && s.date === today && s.status === 'scheduled')
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  const upcoming = shifts
    .filter((s) => s.agentId === agent.id && s.date > today && s.status === 'scheduled')
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))
    .slice(0, 4);

  const myEntries = timeEntries.filter((e) => e.agentId === agent.id);
  const week = weekDates(startOfWeek(today));
  const weekWorked = myEntries
    .filter((e) => week.includes(e.clockIn.slice(0, 10)))
    .reduce((sum, e) => sum + getWorkedMinutes(e, now), 0);
  const weekScheduled = getWeekMinutes(shifts, agent.id, week);

  const workedSeconds = openEntry ? Math.max(0, Math.round(getWorkedMinutes(openEntry, now) * 60)) : 0;
  const breakSeconds = openEntry?.breakStartedAt
    ? Math.max(0, Math.round((now.getTime() - new Date(openEntry.breakStartedAt).getTime()) / 1000))
    : 0;
  const punctuality = openEntry ? getEntryPunctuality(openEntry, shifts, now) : null;

  const run = async (action: 'in' | 'out') => {
    setBusy(true);
    setNotice(null);
    const reading = await readBrowserLocation();
    const res =
      action === 'in'
        ? clockIn(agent.id, getScheduledMinutesFor(shifts, agent.id, today) ?? undefined, reading)
        : clockOut(agent.id, reading);
    setBusy(false);
    if (!res.ok) {
      setNotice({ tone: 'danger', text: ERROR_MESSAGES[res.reason] ?? 'No se pudo registrar la marca.' });
      return;
    }
    const warning = geoCheckWarning(checkLocation(reading, agent.authorizedLocation));
    const base = action === 'in' ? 'Entrada registrada. ¡Buen turno!' : 'Salida registrada. ¡Buen descanso!';
    setNotice(warning ? { tone: 'warning', text: `${base} ${warning}` } : { tone: 'success', text: base });
  };

  const toggleBreak = () => {
    const res = onBreak ? endBreak(agent.id) : startBreak(agent.id);
    if (!res.ok) setNotice({ tone: 'danger', text: ERROR_MESSAGES[res.reason] ?? 'No se pudo actualizar el descanso.' });
    else setNotice({ tone: 'success', text: onBreak ? 'Descanso terminado. Vuelves a estar disponible.' : 'Descanso iniciado. No recibirás llamadas.' });
  };

  const greeting = now.getHours() < 12 ? 'Buenos días' : now.getHours() < 19 ? 'Buenas tardes' : 'Buenas noches';
  const dateLabel = now.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
  const lastGeo = openEntry?.clockInGeo;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="font-mono text-xs capitalize text-[#66FCF1]">{dateLabel}</p>
        <h1 className="font-display text-2xl font-bold text-white lg:text-3xl">
          {greeting}, {agent.name.split(' ')[0]}
        </h1>
      </div>

      {notice && (
        <Notice tone={notice.tone} onClose={() => setNotice(null)}>
          {notice.text}
        </Notice>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Checador */}
        <section className="relative overflow-hidden rounded-3xl border border-[#242E3B] bg-[#13151c] p-6 shadow-2xl lg:col-span-3 lg:p-8">
          <div
            className={`pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full blur-3xl ${
              openEntry ? (onBreak ? 'bg-[#F59E0B]/15' : 'bg-[#10B981]/15') : 'bg-[#66FCF1]/10'
            }`}
          />
          <div className="relative z-10 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {openEntry ? (
                onBreak ? (
                  <Badge tone="warning">
                    <Coffee className="h-3 w-3" /> En descanso · {formatTimer(breakSeconds)}
                  </Badge>
                ) : (
                  <Badge tone="success">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#10B981]" /> En turno desde {formatClock(openEntry.clockIn)}
                  </Badge>
                )
              ) : (
                <Badge tone="neutral">Fuera de turno</Badge>
              )}
              {lastGeo && (
                <span className="flex items-center gap-1 text-[11px] text-[#C5C6C7]/60">
                  <MapPin className="h-3 w-3" /> {describeGeoCheck(lastGeo)}
                </span>
              )}
            </div>

            <div>
              <div className="font-mono text-[11px] uppercase tracking-widest text-[#C5C6C7]/50">
                {openEntry ? 'Tiempo trabajado hoy' : 'Hora actual'}
              </div>
              <div className="mt-1 font-mono text-5xl font-bold tracking-tight text-white tabular-nums lg:text-6xl">
                {openEntry
                  ? formatTimer(workedSeconds)
                  : now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              {openEntry && openEntry.scheduledMinutes > 0 && (
                <div className="mt-4 space-y-1.5">
                  <div className="h-2 overflow-hidden rounded-full bg-[#0B0C10]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#66FCF1] to-[#10B981] transition-all"
                      style={{ width: `${Math.min(100, (workedSeconds / 60 / openEntry.scheduledMinutes) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between font-mono text-[11px] text-[#C5C6C7]/50">
                    <span>Descansos: {openEntry.breakMinutes + Math.floor(breakSeconds / 60)} min</span>
                    <span>Meta: {formatDuration(openEntry.scheduledMinutes)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              {openEntry ? (
                <>
                  <Button variant={onBreak ? 'primary' : 'secondary'} icon={Coffee} onClick={toggleBreak} disabled={busy}>
                    {onBreak ? 'Terminar descanso' : 'Iniciar descanso'}
                  </Button>
                  <Button variant="danger" icon={Square} onClick={() => run('out')} disabled={busy}>
                    {busy ? 'Obteniendo ubicación…' : 'Marcar salida'}
                  </Button>
                </>
              ) : (
                <Button variant="primary" icon={Play} onClick={() => run('in')} disabled={busy} className="px-6 py-3 text-sm">
                  {busy ? 'Obteniendo ubicación…' : 'Marcar entrada'}
                </Button>
              )}
            </div>

            {punctuality && punctuality.flags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {punctuality.flags.map((f) => (
                  <Badge key={f} tone="warning">
                    <AlertTriangle className="h-3 w-3" />
                    {describeAlert(f, flagMinutes(punctuality, f))}
                  </Badge>
                ))}
              </div>
            )}

            <p className="flex items-start gap-2 text-[11px] leading-relaxed text-[#C5C6C7]/50">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#66FCF1]/70" />
              Al marcar entrada o salida compartimos tu ubicación con tu supervisor solo en ese momento, para confirmar
              que trabajas desde tu lugar autorizado. Fuera de turno no se pide ubicación.
            </p>
          </div>
        </section>

        {/* Hoy */}
        <div className="space-y-6 lg:col-span-2">
          <Card title="Tu turno de hoy" actions={<CalendarDays className="h-4 w-4 text-[#66FCF1]" />}>
            {todayShifts.length === 0 ? (
              <p className="text-sm text-[#C5C6C7]/60">Hoy no tienes turno programado.</p>
            ) : (
              <ul className="space-y-2">
                {todayShifts.map((s) => (
                  <li key={s.id} className="flex items-center justify-between rounded-xl border border-[#242E3B] bg-[#0B0C10] px-3.5 py-3">
                    <span className="font-mono text-lg font-bold text-white">
                      {s.startTime} – {s.endTime}
                    </span>
                    <span className="text-xs text-[#C5C6C7]/60">Descanso {s.breakMinutes} min</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Esta semana" value={formatDuration(weekWorked)} hint={`de ${formatDuration(weekScheduled)} programadas`} icon={Timer} tone="accent" />
            <StatCard label="Próximos turnos" value={upcoming.length} hint="en tu calendario" icon={Clock} tone="info" />
          </div>

          <Card
            title="Próximos turnos"
            actions={
              <Link to="/portal/horario" className="flex items-center gap-1 text-xs font-semibold text-[#66FCF1] hover:underline">
                Ver horario <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            }
          >
            {upcoming.length === 0 ? (
              <p className="text-sm text-[#C5C6C7]/60">No tienes turnos próximos.</p>
            ) : (
              <ul className="divide-y divide-[#242E3B]">
                {upcoming.map((s) => (
                  <li key={s.id} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="capitalize text-white">{formatDayLabel(s.date)}</span>
                    <span className="font-mono text-[#C5C6C7]">
                      {s.startTime} – {s.endTime}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <Card title="Tus últimas marcas" subtitle="Entradas y salidas recientes">
        {myEntries.length === 0 ? (
          <p className="text-sm text-[#C5C6C7]/60">Aún no tienes marcas registradas.</p>
        ) : (
          <ul className="divide-y divide-[#242E3B]">
            {myEntries.slice(0, 5).map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <span className="text-white">
                  {new Date(e.clockIn).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
                <span className="font-mono text-[#C5C6C7]">
                  {formatClock(e.clockIn)} → {e.clockOut ? formatClock(e.clockOut) : 'en curso'}
                </span>
                <span className="font-mono text-xs text-[#C5C6C7]/60">
                  {formatDuration(getWorkedMinutes(e, now))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
};
