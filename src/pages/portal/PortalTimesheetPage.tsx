import React, { useState } from 'react';
import { Timer, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Hourglass, MapPin, AlertTriangle } from 'lucide-react';
import type { EntryStatus } from '@/types';
import { Badge, Button, Card, EmptyState, PageHeader, StatCard } from '@/components/ui';
import { useCurrentUser } from '@/store/useSessionStore';
import { useWorkforceStore } from '@/store/useWorkforceStore';
import { useScheduleStore } from '@/store/useScheduleStore';
import { getWorkedMinutes } from '@/lib/metrics';
import { getEntryPunctuality, describeAlert, flagMinutes } from '@/lib/punctuality';
import { describeGeoCheck } from '@/lib/geo';
import { addDays, formatDayLabel, getWeekMinutes, startOfWeek, todayStr, toDateStr, weekDates } from '@/lib/schedule';
import { formatClock, formatDuration } from '@/lib/time';

const STATUS: Record<EntryStatus, { label: string; tone: 'warning' | 'success' | 'danger'; icon: typeof Hourglass }> = {
  pending: { label: 'Pendiente', tone: 'warning', icon: Hourglass },
  approved: { label: 'Aprobada', tone: 'success', icon: CheckCircle2 },
  rejected: { label: 'Rechazada', tone: 'danger', icon: XCircle },
};

/** Hoja de horas del agente: semana por semana, con estado de aprobación */
export const PortalTimesheetPage: React.FC = () => {
  const { agent } = useCurrentUser();
  const timeEntries = useWorkforceStore((s) => s.timeEntries);
  const shifts = useScheduleStore((s) => s.shifts);
  const [monday, setMonday] = useState(() => startOfWeek(todayStr()));

  if (!agent) return <EmptyState icon={Timer} title="No hay un usuario activo" />;

  const days = weekDates(monday);
  const entries = timeEntries
    .filter((e) => e.agentId === agent.id && days.includes(toDateStr(new Date(e.clockIn))))
    .sort((a, b) => a.clockIn.localeCompare(b.clockIn));
  const worked = entries.reduce((s, e) => s + getWorkedMinutes(e), 0);
  const approved = entries.filter((e) => e.status === 'approved').reduce((s, e) => s + getWorkedMinutes(e), 0);
  const scheduled = getWeekMinutes(shifts, agent.id, days);
  const isCurrentWeek = monday === startOfWeek(todayStr());

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        icon={Timer}
        eyebrow="MIS HORAS"
        title="Hoja de horas"
        description="Tus marcas de cada semana y si tu supervisor ya las aprobó para nómina."
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" icon={ChevronLeft} aria-label="Semana anterior" onClick={() => setMonday(addDays(monday, -7))} />
            <span className="min-w-36 text-center tabular-nums text-[13px] text-vx-text">
              {formatDayLabel(days[0])} – {formatDayLabel(days[6])}
            </span>
            <Button
              size="sm"
              icon={ChevronRight}
              aria-label="Semana siguiente"
              disabled={isCurrentWeek}
              onClick={() => setMonday(addDays(monday, 7))}
            />
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Trabajadas" value={formatDuration(worked)} tone="accent" icon={Timer} />
        <StatCard label="Programadas" value={formatDuration(scheduled)} />
        <StatCard label="Aprobadas" value={formatDuration(approved)} tone="success" icon={CheckCircle2} />
        <StatCard label="Marcas" value={entries.length} hint="en la semana" />
      </div>

      <Card title="Detalle de la semana" bodyClassName="p-0">
        {entries.length === 0 ? (
          <EmptyState icon={Timer} title="Sin marcas esta semana" description="Cuando marques entrada y salida, aparecerán aquí." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-vx-border bg-vx-bg/60 tabular-nums text-xs text-vx-text-2/60">
                  <th className="px-4 py-3">Día</th>
                  <th className="px-4 py-3">Entrada</th>
                  <th className="px-4 py-3">Salida</th>
                  <th className="px-4 py-3">Descanso</th>
                  <th className="px-4 py-3">Trabajado</th>
                  <th className="px-4 py-3">Incidencias</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-vx-border/60">
                {entries.map((e) => {
                  const st = STATUS[e.status];
                  const Icon = st.icon;
                  const p = getEntryPunctuality(e, shifts);
                  const flags = p.flags;
                  return (
                    <tr key={e.id} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3 capitalize text-vx-text">{formatDayLabel(toDateStr(new Date(e.clockIn)))}</td>
                      <td className="px-4 py-3 tabular-nums text-vx-text">
                        {formatClock(e.clockIn)}
                        {e.clockInGeo && (
                          <span className="mt-0.5 flex items-center gap-1 text-xs text-vx-text-2/50">
                            <MapPin className="h-3 w-3" /> {describeGeoCheck(e.clockInGeo)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-vx-text">{e.clockOut ? formatClock(e.clockOut) : <Badge tone="success">En turno</Badge>}</td>
                      <td className="px-4 py-3 tabular-nums">{e.breakMinutes} min</td>
                      <td className="px-4 py-3 tabular-nums font-semibold text-vx-text">{formatDuration(getWorkedMinutes(e))}</td>
                      <td className="px-4 py-3">
                        {flags.length === 0 ? (
                          <span className="text-vx-text-2/40">—</span>
                        ) : (
                          <div className="flex flex-col gap-1">
                            {flags.map((f) => (
                              <Badge key={f} tone="warning">
                                <AlertTriangle className="h-3 w-3" /> {describeAlert(f, flagMinutes(p, f))}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={st.tone}>
                          <Icon className="h-3 w-3" /> {st.label}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
