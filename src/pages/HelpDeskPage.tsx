import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Clock, Inbox, LifeBuoy, Plus, Smile, Timer, Ticket as TicketIcon } from 'lucide-react';
import type { HelpdeskError, HelpdeskResult, TicketCategory, TicketPriority, TicketStatus } from '@/types/helpdesk';
import { Avatar, Button, Card, EmptyState, Field, Input, Modal, Notice, PageHeader, Select, StatCard, Tabs, TextArea } from '@/components/ui';
import { PriorityBadge, SlaBadge, StatusBadge } from '@/components/helpdesk/badges';
import { TicketDetail } from '@/components/helpdesk/TicketDetail';
import {
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  SLA_HOURS,
  STATUS_LABELS,
  computeKpis,
  formatSpan,
  isActive,
  isOverdue,
  visibleTickets,
} from '@/lib/helpdesk';
import { getProfile } from '@/lib/groups';
import { useCurrentUser } from '@/store/useSessionStore';
import { useDirectoryStore } from '@/store/useDirectoryStore';
import { useHelpdeskStore } from '@/store/useHelpdeskStore';
import { useWorkforceStore } from '@/store/useWorkforceStore';

const ERROR_MESSAGES: Record<HelpdeskError, string> = {
  not_found: 'El ticket ya no existe.',
  forbidden: 'No tienes permiso para esta acción.',
  invalid: 'Revisa los datos: título de 4 a 120 caracteres, descripción de al menos 10 y un nombre de archivo sin rutas.',
  invalid_transition: 'Ese cambio de estado no está permitido para este ticket.',
  reopen_expired: 'Pasaron más de 72 h desde la resolución; abre un ticket nuevo.',
  not_resolved: 'El ticket aún no está resuelto.',
  already_rated: 'Este ticket ya fue calificado.',
  assignee_not_manager: 'Solo se puede asignar a supervisores o administradores activos.',
};

type View = 'active' | 'all';
type AssigneeFilter = 'all' | 'unassigned' | string;

const EMPTY_FORM = { category: 'headset' as TicketCategory, priority: 'medium' as TicketPriority, title: '', description: '', attachmentName: '' };

export const HelpDeskPage: React.FC = () => {
  const { profile, isManager } = useCurrentUser();
  const currentUserId = profile.agentId;
  const tickets = useHelpdeskStore((s) => s.tickets);
  const createTicket = useHelpdeskStore((s) => s.createTicket);
  const agents = useWorkforceStore((s) => s.agents);
  const profiles = useDirectoryStore((s) => s.profiles);

  // Reloj para los indicadores de SLA
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const [view, setView] = useState<View>('active');
  const [status, setStatus] = useState<'all' | TicketStatus>('all');
  const [priority, setPriority] = useState<'all' | TicketPriority>('all');
  const [category, setCategory] = useState<'all' | TicketCategory>('all');
  const [assignee, setAssignee] = useState<AssigneeFilter>('all');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  const nameOf = (id: string | null): string => (id ? (agents.find((a) => a.id === id)?.name ?? id) : '—');
  const managers = agents
    .filter((a) => {
      const p = getProfile(profiles, a.id);
      return p.active && p.role !== 'agent';
    })
    .map((a) => ({ id: a.id, name: a.name }));

  const mine = useMemo(() => visibleTickets(tickets, currentUserId, isManager), [tickets, currentUserId, isManager]);
  const kpis = useMemo(() => computeKpis(mine, now), [mine, now]);

  const filtered = mine
    .filter((t) => {
      if (view === 'active' && status === 'all' && !isActive(t)) return false;
      if (status !== 'all' && t.status !== status) return false;
      if (priority !== 'all' && t.priority !== priority) return false;
      if (category !== 'all' && t.category !== category) return false;
      if (assignee === 'unassigned' && t.assigneeId !== null) return false;
      if (assignee !== 'all' && assignee !== 'unassigned' && t.assigneeId !== assignee) return false;
      if (overdueOnly && !isOverdue(t, now)) return false;
      return true;
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const selected = filtered.find((t) => t.id === selectedId) ?? filtered[0] ?? null;

  const onResult = (r: HelpdeskResult, success: string) =>
    setNotice(r.ok ? { tone: 'success', text: success } : { tone: 'danger', text: ERROR_MESSAGES[r.reason] });

  const submit = () => {
    const r = createTicket(form);
    if (!r.ok) {
      setFormError(ERROR_MESSAGES[r.reason]);
      return;
    }
    setModalOpen(false);
    setForm(EMPTY_FORM);
    setFormError(null);
    setView('active');
    setStatus('all');
    setSelectedId(r.id);
    setNotice({ tone: 'success', text: 'Ticket creado. Te avisaremos por aquí cuando haya respuesta.' });
  };

  const avgOrDash = (m: number | null) => (m === null ? '—' : formatSpan(m));

  return (
    <div className="space-y-6">
      <PageHeader
        icon={LifeBuoy}
        eyebrow="MESA DE AYUDA"
        title="Help Desk"
        description={
          isManager
            ? 'Cola de tickets de TI y operaciones: asigna, da seguimiento y cumple los SLA por prioridad.'
            : '¿Falla tu diadema, softphone o acceso? Abre un ticket y da seguimiento a la respuesta.'
        }
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setModalOpen(true)}>
            Nuevo ticket
          </Button>
        }
      />

      {notice && (
        <Notice tone={notice.tone} onClose={() => setNotice(null)}>
          {notice.text}
        </Notice>
      )}

      {isManager && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          <StatCard label="Abiertos" value={kpis.open} icon={Inbox} tone="accent" hint="Sin resolver" />
          <StatCard label="Vencidos" value={kpis.overdue} icon={AlertTriangle} tone={kpis.overdue ? 'danger' : 'success'} hint="Fuera de SLA" />
          <StatCard label="1ª respuesta" value={avgOrDash(kpis.avgFirstResponseMin)} icon={Timer} tone="info" hint="Promedio" />
          <StatCard label="Resolución" value={avgOrDash(kpis.avgResolutionMin)} icon={Clock} tone="info" hint="Promedio" />
          <StatCard
            label="Satisfacción"
            value={kpis.satisfaction === null ? '—' : `${kpis.satisfaction.toFixed(1)}/5`}
            icon={Smile}
            tone="success"
            hint="Calificación de agentes"
          />
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <Tabs<View>
          value={view}
          onChange={setView}
          options={[
            { value: 'active', label: 'Activos', count: mine.filter(isActive).length },
            { value: 'all', label: 'Todos', count: mine.length },
          ]}
        />
        {isManager && (
          <>
            <FilterSelect label="Estado" value={status} onChange={(v) => setStatus(v as typeof status)} options={STATUS_LABELS} />
            <FilterSelect label="Prioridad" value={priority} onChange={(v) => setPriority(v as typeof priority)} options={PRIORITY_LABELS} />
            <FilterSelect label="Categoría" value={category} onChange={(v) => setCategory(v as typeof category)} options={CATEGORY_LABELS} />
            <FilterSelect
              label="Responsable"
              value={assignee}
              onChange={setAssignee}
              options={{ unassigned: 'Sin asignar', ...Object.fromEntries(managers.map((m) => [m.id, m.name])) }}
            />
            <label className="flex h-[34px] items-center gap-2 rounded-xl border border-[#242E3B] bg-[#0B0C10] px-3 text-xs text-[#C5C6C7]">
              <input type="checkbox" checked={overdueOnly} onChange={(e) => setOverdueOnly(e.target.checked)} className="accent-[#EF4444]" />
              Solo vencidos
            </label>
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Card title={isManager ? 'Cola de tickets' : 'Mis tickets'} subtitle={`${filtered.length} ticket(s)`} bodyClassName="p-2">
          {filtered.length === 0 ? (
            <EmptyState
              icon={TicketIcon}
              title="No hay tickets aquí"
              description={isManager ? 'Ajusta los filtros para ver otros tickets.' : 'Cuando abras un ticket aparecerá en esta lista.'}
            />
          ) : (
            <ul className="space-y-1">
              {filtered.map((t) => {
                const active = selected?.id === t.id;
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(t.id)}
                      aria-current={active ? 'true' : undefined}
                      className={`w-full rounded-xl border p-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#66FCF1] ${
                        active ? 'border-[#66FCF1]/40 bg-[#66FCF1]/[0.06]' : 'border-transparent hover:bg-white/[0.03]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[11px] text-[#66FCF1]">{t.code}</span>
                        <span className="text-[11px] text-[#C5C6C7]/50">{CATEGORY_LABELS[t.category]}</span>
                      </div>
                      <div className="mt-1 truncate text-sm font-semibold text-white">{t.title}</div>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <StatusBadge status={t.status} />
                        <PriorityBadge priority={t.priority} />
                        <SlaBadge ticket={t} now={now} />
                      </div>
                      {isManager && (
                        <div className="mt-2 flex items-center gap-2 text-[11px] text-[#C5C6C7]/60">
                          <Avatar name={nameOf(t.requesterId)} size="sm" />
                          <span className="truncate">{nameOf(t.requesterId)}</span>
                          <span className="ml-auto truncate">→ {t.assigneeId ? nameOf(t.assigneeId) : 'Sin asignar'}</span>
                        </div>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {selected ? (
          <TicketDetail
            key={selected.id}
            ticket={selected}
            currentUserId={currentUserId}
            isManager={isManager}
            managers={managers}
            nameOf={nameOf}
            now={now}
            onResult={onResult}
          />
        ) : (
          <Card>
            <EmptyState icon={LifeBuoy} title="Selecciona un ticket" description="Aquí verás la conversación y el historial." />
          </Card>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nuevo ticket"
        description="Describe la falla con el mayor detalle posible: estación, extensión, campaña y desde cuándo ocurre."
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" icon={Plus} onClick={submit}>
              Abrir ticket
            </Button>
          </>
        }
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          {formError && <Notice tone="danger">{formError}</Notice>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Categoría">
              <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as TicketCategory })}>
                {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Prioridad" hint={`Objetivo de atención: ${formatSpan(SLA_HOURS[form.priority] * 60)}`}>
              <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as TicketPriority })}>
                {Object.entries(PRIORITY_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Título">
            <Input
              value={form.title}
              maxLength={120}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ej. Diadema sin micrófono"
              required
            />
          </Field>
          <Field label="Descripción">
            <TextArea
              value={form.description}
              maxLength={4000}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="¿Qué pasa, desde cuándo y qué ya intentaste?"
              required
            />
          </Field>
          <Field label="Adjunto (opcional)" hint="Solo el nombre del archivo, p. ej. captura_error.png">
            <Input
              value={form.attachmentName}
              maxLength={120}
              onChange={(e) => setForm({ ...form, attachmentName: e.target.value })}
              placeholder="captura_error.png"
            />
          </Field>
          <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
        </form>
      </Modal>
    </div>
  );
};

const FilterSelect: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Record<string, string>;
}> = ({ label, value, onChange, options }) => (
  <label className="space-y-1">
    <span className="block text-[11px] font-medium text-[#C5C6C7]/60">{label}</span>
    <Select value={value} onChange={(e) => onChange(e.target.value)} className="min-w-[150px]">
      <option value="all">Todos</option>
      {Object.entries(options).map(([v, l]) => (
        <option key={v} value={v}>
          {l}
        </option>
      ))}
    </Select>
  </label>
);
