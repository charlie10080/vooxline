import React, { useState } from 'react';
import { CalendarOff, Plus, Palmtree, Stethoscope, User, Trash2 } from 'lucide-react';
import type { ActionError, TimeOffStatus, TimeOffType } from '@/types';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Modal,
  Notice,
  PageHeader,
  Select,
  StatCard,
  TextArea,
} from '@/components/ui';
import { useCurrentUser } from '@/store/useSessionStore';
import { useWorkforceStore } from '@/store/useWorkforceStore';
import { todayStr } from '@/lib/schedule';

const TYPE_LABELS: Record<TimeOffType, string> = { vacation: 'Vacaciones', medical: 'Permiso médico', personal: 'Permiso personal' };
const TYPE_ICONS: Record<TimeOffType, typeof Palmtree> = { vacation: Palmtree, medical: Stethoscope, personal: User };
const STATUS: Record<TimeOffStatus, { label: string; tone: 'warning' | 'success' | 'danger' }> = {
  pending: { label: 'Pendiente', tone: 'warning' },
  approved: { label: 'Aprobada', tone: 'success' },
  rejected: { label: 'Rechazada', tone: 'danger' },
};
const ERRORS: Partial<Record<ActionError, string>> = {
  invalid: 'Revisa las fechas (la final no puede ser antes de la inicial), las horas y el motivo.',
  not_found: 'No encontramos la solicitud.',
  forbidden: 'Solo puedes retirar tus propias solicitudes.',
  already_processed: 'Esa solicitud ya fue revisada por tu supervisor.',
};

/** Permisos y vacaciones del agente: saldo, nueva solicitud y su historial */
export const PortalTimeOffPage: React.FC = () => {
  const { agent } = useCurrentUser();
  const { timeOffRequests, createTimeOff, cancelTimeOff } = useWorkforceStore();
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);
  const [form, setForm] = useState({ type: 'vacation' as TimeOffType, startDate: todayStr(), endDate: todayStr(), hours: '8', reason: '' });

  if (!agent) return <EmptyState icon={CalendarOff} title="No hay un usuario activo" />;

  const mine = timeOffRequests.filter((r) => r.agentId === agent.id);
  const pendingHours = mine.filter((r) => r.status === 'pending' && r.type === 'vacation').reduce((s, r) => s + r.hours, 0);

  const submit = () => {
    const res = createTimeOff({
      agentId: agent.id,
      type: form.type,
      startDate: form.startDate,
      endDate: form.endDate,
      hours: Number(form.hours),
      reason: form.reason,
      attachmentName: null,
    });
    if (!res.ok) {
      setNotice({ tone: 'danger', text: ERRORS[res.reason] ?? 'No se pudo enviar la solicitud.' });
      return;
    }
    setOpen(false);
    setForm((f) => ({ ...f, reason: '' }));
    setNotice({ tone: 'success', text: 'Solicitud enviada. Tu supervisor la revisará.' });
  };

  const withdraw = (id: string) => {
    const res = cancelTimeOff(id, agent.id);
    setNotice(res.ok ? { tone: 'success', text: 'Solicitud retirada.' } : { tone: 'danger', text: ERRORS[res.reason] ?? 'No se pudo retirar.' });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        icon={CalendarOff}
        eyebrow="PERMISOS"
        title="Vacaciones y permisos"
        description="Consulta tu saldo, pide días libres y sigue el estado de tus solicitudes."
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setOpen(true)}>
            Nueva solicitud
          </Button>
        }
      />

      {notice && (
        <Notice tone={notice.tone} onClose={() => setNotice(null)}>
          {notice.text}
        </Notice>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Saldo de vacaciones" value={`${agent.ptoBalanceHours} h`} hint={`≈ ${Math.floor(agent.ptoBalanceHours / 8)} días`} tone="accent" icon={Palmtree} />
        <StatCard label="En revisión" value={`${pendingHours} h`} hint="de vacaciones pendientes" tone="warning" />
        <StatCard label="Solicitudes" value={mine.length} hint="en total" />
      </div>

      <Card title="Mis solicitudes" bodyClassName="p-0">
        {mine.length === 0 ? (
          <EmptyState icon={CalendarOff} title="Aún no tienes solicitudes" description="Pide vacaciones o un permiso con el botón de arriba." />
        ) : (
          <ul className="divide-y divide-vx-border">
            {mine.map((r) => {
              const Icon = TYPE_ICONS[r.type];
              const st = STATUS[r.status];
              return (
                <li key={r.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                  <span className="rounded-xl border border-vx-border bg-vx-bg p-2.5 text-vx-accent">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-vx-text">{TYPE_LABELS[r.type]} · {r.hours} h</p>
                    <p className="tabular-nums text-[13px] text-vx-text-2/60">
                      {r.startDate === r.endDate ? r.startDate : `${r.startDate} → ${r.endDate}`}
                    </p>
                    <p className="mt-1 truncate text-[13px] text-vx-text-2/70">{r.reason}</p>
                  </div>
                  <Badge tone={st.tone}>{st.label}</Badge>
                  {r.status === 'pending' && (
                    <Button size="sm" variant="ghost" icon={Trash2} onClick={() => withdraw(r.id)}>
                      Retirar
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Nueva solicitud"
        description="Las vacaciones descuentan de tu saldo cuando se aprueban."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button variant="primary" onClick={submit}>Enviar solicitud</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Tipo">
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as TimeOffType })}>
              {(Object.keys(TYPE_LABELS) as TimeOffType[]).map((t) => (
                <option key={t} value={t}>{TYPE_LABELS[t]}</option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Desde">
              <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </Field>
            <Field label="Hasta">
              <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </Field>
          </div>
          <Field label="Horas" hint="Una jornada completa son 8 horas.">
            <Input type="number" min={1} value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} />
          </Field>
          <Field label="Motivo">
            <TextArea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Cuéntale a tu supervisor el motivo." />
          </Field>
        </div>
      </Modal>
    </div>
  );
};
