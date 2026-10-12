import React, { useMemo, useState } from 'react';
import { Bell, Cpu, History, Lock, Pencil, Plus, Trash2, Users, Workflow, Zap } from 'lucide-react';
import type { AutomationAction, AutomationError, AutomationRule, RuleDraft, TriggerKind } from '@/types/automations';
import type { AttendanceAlertKind } from '@/lib/punctuality';
import { ALERT_KIND_LABELS } from '@/lib/punctuality';
import { MAX_MESSAGE_LENGTH, MAX_UPDATE_HOURS, PLACEHOLDERS, TRIGGER_LABELS, TRIGGER_ORDER, renderTemplate } from '@/lib/automations';
import { timeAgo } from '@/lib/updates';
import { useAutomationsStore } from '@/store/useAutomationsStore';
import { useFormsStore } from '@/store/useFormsStore';
import { useCurrentUser } from '@/store/useSessionStore';
import { useWorkforceStore } from '@/store/useWorkforceStore';
import { Badge, Button, Card, EmptyState, Field, Input, Modal, Notice, PageHeader, Select, StatCard, TextArea } from '@/components/ui';

const ERROR_MESSAGES: Record<AutomationError, string> = {
  forbidden: 'Solo supervisores y administradores pueden gestionar automatizaciones.',
  not_found: 'La regla ya no existe.',
  invalid_name: 'El nombre debe tener entre 3 y 80 caracteres.',
  invalid_trigger: `Revisa el disparador: las horas deben ser un número entero entre 1 y ${MAX_UPDATE_HOURS}.`,
  invalid_campaign: 'La campaña elegida no existe.',
  no_actions: 'Elige al menos una acción en "Entonces".',
  invalid_user: 'Elige a qué usuario notificar.',
  invalid_message: `El mensaje es obligatorio (máximo ${MAX_MESSAGE_LENGTH} caracteres).`,
};

const DEFAULT_MESSAGES: Record<TriggerKind, string> = {
  attendance_alert: '{agente}: {detalle}.',
  time_off_created: '{agente} {detalle}.',
  time_off_decided: 'Hola {agente}, {detalle}.',
  open_shift_claim: '{agente} {detalle}. Aprueba o rechaza en Horarios.',
  swap_pending_approval: 'Intercambio por aprobar: {detalle}.',
  ticket_high_priority: 'Nuevo ticket de {agente}: {detalle}.',
  ticket_sla_overdue: 'SLA vencido: {detalle}.',
  form_submitted: '{agente} {detalle}.',
  update_unconfirmed: '{agente}, tienes pendiente confirmar: {detalle}.',
};

const SAMPLE_DETAILS: Record<TriggerKind, string> = {
  attendance_alert: 'Llegó 25 min tarde (11 oct)',
  time_off_created: 'solicitó vacaciones del 20 oct al 24 oct (40 h)',
  time_off_decided: 'la solicitud de vacaciones del 20 oct al 24 oct fue aprobada',
  open_shift_claim: 'quiere tomar el turno abierto del 14 oct 14:00-22:00',
  swap_pending_approval: 'María López cede a Sofía Navarro el turno del 15 oct 08:00-16:00',
  ticket_high_priority: 'HD-1050 · Softphone sin audio (prioridad Crítica)',
  ticket_sla_overdue: 'HD-1048 · VPN intermitente venció su SLA (prioridad Alta)',
  form_submitted: 'envió "Checklist de inicio de turno"',
  update_unconfirmed: '"Nuevo guion de retención" (más de 24 h sin confirmar)',
};

const ALERT_KINDS = Object.keys(ALERT_KIND_LABELS) as AttendanceAlertKind[];

interface FormState {
  name: string;
  kind: TriggerKind;
  alertKind: AttendanceAlertKind | 'any';
  templateId: string;
  hours: string;
  campaignId: string;
  supervisors: boolean;
  agent: boolean;
  userId: string;
  message: string;
}

const emptyForm = (): FormState => ({
  name: '',
  kind: 'attendance_alert',
  alertKind: 'any',
  templateId: '',
  hours: '24',
  campaignId: '',
  supervisors: true,
  agent: false,
  userId: '',
  message: DEFAULT_MESSAGES.attendance_alert,
});

const formFromRule = (r: AutomationRule): FormState => ({
  name: r.name,
  kind: r.trigger.kind,
  alertKind: r.trigger.alertKind,
  templateId: r.trigger.templateId ?? '',
  hours: String(r.trigger.hours),
  campaignId: r.campaignId ?? '',
  supervisors: r.actions.some((a) => a.kind === 'notify_supervisors'),
  agent: r.actions.some((a) => a.kind === 'notify_agent'),
  userId: r.actions.find((a) => a.kind === 'notify_user')?.userId ?? '',
  message: r.message,
});

function draftFromForm(f: FormState): RuleDraft {
  const actions: AutomationAction[] = [];
  if (f.supervisors) actions.push({ kind: 'notify_supervisors' });
  if (f.agent) actions.push({ kind: 'notify_agent' });
  if (f.userId) actions.push({ kind: 'notify_user', userId: f.userId });
  return {
    name: f.name,
    trigger: { kind: f.kind, alertKind: f.alertKind, templateId: f.templateId || null, hours: Number(f.hours) },
    campaignId: f.campaignId || null,
    actions,
    message: f.message,
  };
}

/** Paso del constructor "Cuando / Si / Entonces" */
const Step: React.FC<{ label: string; hint: string; children: React.ReactNode }> = ({ label, hint, children }) => (
  <fieldset className="rounded-xl border border-[#242E3B] bg-[#0B0C10]/60 p-4">
    <legend className="px-1.5">
      <span className="font-mono text-xs font-bold tracking-wider text-[#66FCF1]">{label}</span>
      <span className="ml-2 text-[11px] text-[#C5C6C7]/55">{hint}</span>
    </legend>
    <div className="space-y-3">{children}</div>
  </fieldset>
);

const Check: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string; hint: string }> = ({ checked, onChange, label, hint }) => (
  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#242E3B] bg-[#13151c] p-3 hover:border-[#66FCF1]/30">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#66FCF1]" />
    <span>
      <span className="block text-xs font-semibold text-white">{label}</span>
      <span className="block text-[11px] text-[#C5C6C7]/60">{hint}</span>
    </span>
  </label>
);

const Switch: React.FC<{ on: boolean; onToggle: () => void; label: string }> = ({ on, onToggle, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    aria-label={label}
    onClick={onToggle}
    className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors ${
      on ? 'border-[#66FCF1]/50 bg-[#66FCF1]/25' : 'border-[#242E3B] bg-[#0B0C10]'
    }`}
  >
    <span
      className={`absolute top-0.5 h-4 w-4 rounded-full transition-all ${on ? 'left-6 bg-[#66FCF1]' : 'left-1 bg-[#C5C6C7]/50'}`}
    />
  </button>
);

export const AutomationsPage: React.FC = () => {
  const { isManager, profile } = useCurrentUser();
  const actorId = profile.agentId;
  const rules = useAutomationsStore((s) => s.rules);
  const runs = useAutomationsStore((s) => s.runs);
  const createRule = useAutomationsStore((s) => s.createRule);
  const updateRule = useAutomationsStore((s) => s.updateRule);
  const toggleRule = useAutomationsStore((s) => s.toggleRule);
  const deleteRule = useAutomationsStore((s) => s.deleteRule);
  const agents = useWorkforceStore((s) => s.agents);
  const campaigns = useWorkforceStore((s) => s.campaigns);
  const templates = useFormsStore((s) => s.templates);

  const [editing, setEditing] = useState<{ id: string | null; form: FormState } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<AutomationRule | null>(null);
  const [notice, setNotice] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);
  const [now] = useState(() => Date.now());

  const nameOf = (id: string | null) => agents.find((a) => a.id === id)?.name ?? '—';
  const campaignName = (id: string | null) => campaigns.find((c) => c.id === id)?.name ?? 'Todas las campañas';

  const stats = useMemo(() => {
    const dayAgo = now - 86_400_000;
    const recent = runs.filter((r) => Date.parse(r.at) >= dayAgo);
    return {
      active: rules.filter((r) => r.enabled).length,
      runs24: recent.length,
      sent24: recent.reduce((n, r) => n + r.recipientIds.length, 0),
    };
  }, [rules, runs, now]);

  const lastRun = (ruleId: string) => runs.find((r) => r.ruleId === ruleId);

  const triggerSummary = (r: AutomationRule): string => {
    const t = r.trigger;
    if (t.kind === 'attendance_alert') return t.alertKind === 'any' ? 'Aparece cualquier alerta de asistencia' : `Alerta de asistencia: ${ALERT_KIND_LABELS[t.alertKind]}`;
    if (t.kind === 'form_submitted') return `Llega una respuesta de ${t.templateId ? `"${templates.find((x) => x.id === t.templateId)?.title ?? 'formulario'}"` : 'cualquier formulario'}`;
    if (t.kind === 'update_unconfirmed') return `Un aviso sigue sin confirmar después de ${t.hours} h`;
    return TRIGGER_LABELS[t.kind];
  };

  const actionSummary = (actions: AutomationAction[]): string =>
    actions
      .map((a) => (a.kind === 'notify_supervisors' ? 'notificar a supervisión' : a.kind === 'notify_agent' ? 'notificar al agente' : `notificar a ${nameOf(a.userId)}`))
      .join(' y ');

  const handle = (result: { ok: true } | { ok: false; reason: AutomationError }, success: string) => {
    if (result.ok) setNotice({ tone: 'success', text: success });
    else setNotice({ tone: 'danger', text: ERROR_MESSAGES[result.reason] });
  };

  const save = () => {
    if (!editing) return;
    const draft = draftFromForm(editing.form);
    const result = editing.id ? updateRule(actorId, editing.id, draft) : createRule(actorId, draft);
    if (!result.ok) {
      setFormError(ERROR_MESSAGES[result.reason]);
      return;
    }
    setNotice({ tone: 'success', text: editing.id ? 'Regla actualizada. Reacciona a lo que ocurra desde ahora.' : 'Regla creada y activada.' });
    setEditing(null);
  };

  const patch = (changes: Partial<FormState>) => {
    setFormError(null);
    setEditing((e) => (e ? { ...e, form: { ...e.form, ...changes } } : e));
  };

  const changeKind = (kind: TriggerKind) => {
    if (!editing) return;
    const f = editing.form;
    // Si el mensaje era el sugerido, se cambia por el del nuevo disparador
    patch({ kind, message: f.message === DEFAULT_MESSAGES[f.kind] ? DEFAULT_MESSAGES[kind] : f.message });
  };

  if (!isManager) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={Cpu}
          eyebrow="AUTOMATIZACIONES"
          title="Automatizaciones"
          description="Reglas que avisan automáticamente cuando pasa algo en la operación."
        />
        <Card>
          <EmptyState
            icon={Lock}
            title="Esta sección es para supervisores"
            description="Las automatizaciones las configuran supervisión y administración. Tú recibirás sus avisos en la campana de notificaciones."
          />
        </Card>
      </div>
    );
  }

  const form = editing?.form;
  const preview = form
    ? renderTemplate(form.message, {
        agente: agents[0]?.name ?? 'María López',
        detalle: SAMPLE_DETAILS[form.kind],
        campaña: form.campaignId ? campaignName(form.campaignId) : campaigns[0]?.name ?? 'Campaña',
        regla: form.name.trim() || 'Nueva regla',
      })
    : '';
  const previewRecipients = form ? actionSummary(draftFromForm(form).actions) : '';

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Cpu}
        eyebrow="AUTOMATIZACIONES"
        title="Automatizaciones"
        description="Reglas “Cuando ocurra X, haz Y”: avisa a supervisión o al agente sin vigilar cada pantalla."
        actions={
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => {
              setFormError(null);
              setEditing({ id: null, form: emptyForm() });
            }}
          >
            Nueva regla
          </Button>
        }
      />

      {notice && (
        <Notice tone={notice.tone} onClose={() => setNotice(null)}>
          {notice.text}
        </Notice>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Reglas activas" value={`${stats.active}/${rules.length}`} icon={Zap} tone="accent" />
        <StatCard label="Ejecuciones (24 h)" value={stats.runs24} icon={Workflow} tone="info" />
        <StatCard label="Notificaciones enviadas (24 h)" value={stats.sent24} icon={Bell} tone="success" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card title="Reglas" subtitle="Cada regla reacciona solo a lo que ocurra después de activarse.">
          {rules.length === 0 ? (
            <EmptyState icon={Workflow} title="Sin reglas" description="Crea la primera con “Nueva regla”." />
          ) : (
            <ul className="space-y-3">
              {rules.map((r) => {
                const last = lastRun(r.id);
                return (
                  <li
                    key={r.id}
                    className={`rounded-xl border p-4 transition-colors ${
                      r.enabled ? 'border-[#242E3B] bg-[#0B0C10]/50 hover:border-[#66FCF1]/25' : 'border-[#242E3B]/70 bg-[#0B0C10]/30 opacity-70'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Switch
                        on={r.enabled}
                        onToggle={() => handle(toggleRule(actorId, r.id), r.enabled ? 'Regla pausada.' : 'Regla activada.')}
                        label={`${r.enabled ? 'Pausar' : 'Activar'} la regla ${r.name}`}
                      />
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-white">{r.name}</p>
                          <Badge tone={r.enabled ? 'success' : 'neutral'}>{r.enabled ? 'Activa' : 'Pausada'}</Badge>
                        </div>
                        <div className="grid gap-1 text-xs text-[#C5C6C7]/80">
                          <p>
                            <span className="font-mono font-bold text-[#66FCF1]">CUANDO</span> {triggerSummary(r)}
                          </p>
                          <p>
                            <span className="font-mono font-bold text-[#66FCF1]">SI</span> {campaignName(r.campaignId)}
                          </p>
                          <p>
                            <span className="font-mono font-bold text-[#66FCF1]">ENTONCES</span> {actionSummary(r.actions)}
                          </p>
                        </div>
                        <p className="font-mono text-[11px] text-[#C5C6C7]/50">
                          {last ? `Última ejecución ${timeAgo(last.at, now)}` : 'Aún no se ha ejecutado'}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          aria-label={`Editar ${r.name}`}
                          onClick={() => {
                            setFormError(null);
                            setEditing({ id: r.id, form: formFromRule(r) });
                          }}
                          className="rounded-lg p-2 text-[#C5C6C7]/70 hover:bg-white/5 hover:text-white"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Eliminar ${r.name}`}
                          onClick={() => setToDelete(r)}
                          className="rounded-lg p-2 text-[#C5C6C7]/70 hover:bg-[#EF4444]/10 hover:text-[#EF4444]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card title={<span className="flex items-center gap-2"><History className="h-4 w-4 text-[#66FCF1]" />Historial de ejecuciones</span>} subtitle="Últimas 25" bodyClassName="p-0">
          {runs.length === 0 ? (
            <EmptyState icon={History} title="Sin ejecuciones" description="Cuando una regla se dispare aparecerá aquí." />
          ) : (
            <ul className="max-h-[640px] divide-y divide-[#242E3B] overflow-y-auto">
              {runs.slice(0, 25).map((run) => (
                <li key={run.id} className="space-y-1 px-5 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-semibold text-white">{run.ruleName}</p>
                    <span className="shrink-0 font-mono text-[10px] text-[#C5C6C7]/50">{timeAgo(run.at, now)}</span>
                  </div>
                  <p className="text-xs text-[#C5C6C7]/75">
                    {run.agentId && <span className="text-[#C5C6C7]">{nameOf(run.agentId)}: </span>}
                    {run.detail}
                  </p>
                  <p className="flex items-center gap-1 font-mono text-[10px] text-[#C5C6C7]/50">
                    <Users className="h-3 w-3" />
                    {run.recipientIds.length === 0 ? 'Sin destinatarios' : run.recipientIds.map(nameOf).join(', ')}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        size="lg"
        title={editing?.id ? 'Editar regla' : 'Nueva regla'}
        description="Define qué debe pasar, para quién y qué mensaje enviar."
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button variant="primary" icon={Zap} onClick={save}>
              {editing?.id ? 'Guardar cambios' : 'Crear regla'}
            </Button>
          </>
        }
      >
        {form && (
          <div className="space-y-4">
            {formError && <Notice tone="danger">{formError}</Notice>}
            <Field label="Nombre de la regla">
              <Input value={form.name} onChange={(e) => patch({ name: e.target.value })} placeholder="Ej. Avisar llegadas tarde en FinTech" maxLength={80} />
            </Field>

            <Step label="CUANDO…" hint="el evento que dispara la regla">
              <Field label="Disparador">
                <Select value={form.kind} onChange={(e) => changeKind(e.target.value as TriggerKind)}>
                  {TRIGGER_ORDER.map((k) => (
                    <option key={k} value={k}>
                      {TRIGGER_LABELS[k]}
                    </option>
                  ))}
                </Select>
              </Field>
              {form.kind === 'attendance_alert' && (
                <Field label="Tipo de alerta">
                  <Select value={form.alertKind} onChange={(e) => patch({ alertKind: e.target.value as AttendanceAlertKind | 'any' })}>
                    <option value="any">Cualquier alerta</option>
                    {ALERT_KINDS.map((k) => (
                      <option key={k} value={k}>
                        {ALERT_KIND_LABELS[k]}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
              {form.kind === 'form_submitted' && (
                <Field label="Formulario">
                  <Select value={form.templateId} onChange={(e) => patch({ templateId: e.target.value })}>
                    <option value="">Cualquier formulario</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
              {form.kind === 'update_unconfirmed' && (
                <Field label="Horas sin confirmar" hint={`Entre 1 y ${MAX_UPDATE_HOURS} horas desde la publicación.`}>
                  <Input type="number" min={1} max={MAX_UPDATE_HOURS} step={1} value={form.hours} onChange={(e) => patch({ hours: e.target.value })} />
                </Field>
              )}
            </Step>

            <Step label="SI…" hint="filtro opcional">
              <Field label="Campaña">
                <Select value={form.campaignId} onChange={(e) => patch({ campaignId: e.target.value })}>
                  <option value="">Todas las campañas</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </Step>

            <Step label="ENTONCES…" hint="a quién notificar">
              <div className="grid gap-2 sm:grid-cols-2">
                <Check checked={form.supervisors} onChange={(v) => patch({ supervisors: v })} label="Notificar a supervisión" hint="Todos los supervisores y admins activos" />
                <Check checked={form.agent} onChange={(v) => patch({ agent: v })} label="Notificar al agente involucrado" hint="Quien generó el evento" />
              </div>
              <Field label="Notificar además a un usuario específico">
                <Select value={form.userId} onChange={(e) => patch({ userId: e.target.value })}>
                  <option value="">Nadie más</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Mensaje" hint={`${form.message.length}/${MAX_MESSAGE_LENGTH} · Haz clic en una variable para insertarla.`}>
                <TextArea value={form.message} maxLength={MAX_MESSAGE_LENGTH} onChange={(e) => patch({ message: e.target.value })} />
              </Field>
              <div className="flex flex-wrap gap-1.5" aria-label="Variables del mensaje">
                {PLACEHOLDERS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => patch({ message: `${form.message}${form.message.endsWith(' ') || !form.message ? '' : ' '}${p}` })}
                    className="rounded-md border border-[#66FCF1]/30 bg-[#66FCF1]/10 px-2 py-0.5 font-mono text-[11px] text-[#66FCF1] hover:bg-[#66FCF1]/20"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </Step>

            <div className="rounded-xl border border-[#66FCF1]/25 bg-[#66FCF1]/[0.05] p-4" aria-live="polite">
              <p className="mb-2 font-mono text-[11px] font-bold tracking-wider text-[#66FCF1]">VISTA PREVIA</p>
              <div className="flex items-start gap-3 rounded-lg border border-[#242E3B] bg-[#13151c] p-3">
                <span className="rounded-lg border border-[#66FCF1]/30 bg-[#66FCF1]/10 p-1.5 text-[#66FCF1]">
                  <Bell className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white">{form.name.trim() || 'Nueva regla'}</p>
                  <p className="mt-0.5 text-xs text-[#C5C6C7]/80">{preview || '—'}</p>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-[#C5C6C7]/60">
                {previewRecipients ? `Acción: ${previewRecipients}.` : 'Elige al menos una acción.'}
              </p>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        title="Eliminar regla"
        description={toDelete?.name}
        footer={
          <>
            <Button variant="ghost" onClick={() => setToDelete(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              icon={Trash2}
              onClick={() => {
                if (toDelete) handle(deleteRule(actorId, toDelete.id), 'Regla eliminada.');
                setToDelete(null);
              }}
            >
              Eliminar
            </Button>
          </>
        }
      >
        <p className="text-sm text-[#C5C6C7]">La regla dejará de ejecutarse. El historial de ejecuciones se conserva.</p>
      </Modal>
    </div>
  );
};
