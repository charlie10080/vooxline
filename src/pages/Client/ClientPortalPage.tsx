import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Clock, Download, FileText, Gauge, LogOut, Phone, Plus, Users } from 'lucide-react';
import { Badge, Button, Card, EmptyState, Field, Input, Modal, Notice, PageHeader, Select, StatCard, Tabs } from '@/components/ui';
import { useWorkforceStore } from '@/store/useWorkforceStore';
import { useLiveStore } from '@/store/useLiveStore';
import { useClientStore } from '@/store/useClientStore';
import { useCurrentUser, useSessionStore } from '@/store/useSessionStore';
import { SLA_TARGET_PCT, currentCutToCsv, downloadCsv, getCampaignSnapshot, invoiceToCsv } from '@/lib/client';
import { minutesBetween } from '@/lib/time';
import type { AgentStatus } from '@/types';
import type { ClientError, ClientPeriod, ClientRequestPriority, ClientRequestStatus, ClientRequestType } from '@/types/client';

const PERIODS: Array<{ value: ClientPeriod; label: string }> = [
  { value: 'hoy', label: 'Hoy' },
  { value: '7d', label: '7 días' },
  { value: 'mes', label: 'Mes' },
];

const STATUS_LABELS: Record<AgentStatus, string> = { on_call: 'En llamada', available: 'Disponible', break: 'En descanso', offline: 'Desconectado' };
const STATUS_TONES: Record<AgentStatus, 'accent' | 'success' | 'warning' | 'neutral'> = { on_call: 'accent', available: 'success', break: 'warning', offline: 'neutral' };

const TYPE_LABELS: Record<ClientRequestType, string> = {
  ampliar_agentes: 'Ampliar agentes',
  ajuste_script: 'Ajuste de script',
  soporte_facturacion: 'Soporte de facturación',
  otro: 'Otro',
};
const REQUEST_STATUS: Record<ClientRequestStatus, { label: string; tone: 'info' | 'warning' | 'success' | 'neutral' }> = {
  abierto: { label: 'Abierto', tone: 'info' },
  en_revision: { label: 'En revisión', tone: 'warning' },
  aplicado: { label: 'Aplicado', tone: 'success' },
  cancelado: { label: 'Cancelado', tone: 'neutral' },
};
const ERRORS: Record<ClientError, string> = {
  empty_title: 'Escribe un título para la solicitud.',
  not_found: 'La solicitud ya no existe.',
  not_cancellable: 'Solo puedes cancelar solicitudes que aún no están en revisión.',
};

const usd = (n: number) => n.toLocaleString('es-MX', { style: 'currency', currency: 'USD' });

/** Portal del cliente B2B: vista de solo lectura de su campaña, más solicitudes y facturación */
export const ClientPortalPage: React.FC = () => {
  const navigate = useNavigate();
  const logout = useSessionStore((s) => s.logout);
  const { profile } = useCurrentUser();
  const campaigns = useWorkforceStore((s) => s.campaigns);
  const agents = useWorkforceStore((s) => s.agents);
  const entries = useWorkforceStore((s) => s.timeEntries);
  const calls = useLiveStore((s) => s.calls);
  const { requests, invoices, addRequest, cancelRequest } = useClientStore();

  // shortcut: el cliente elige cualquier campaña (demo); con backend cada cliente ve solo las suyas
  const [campaignId, setCampaignId] = useState(campaigns[0]?.id ?? '');
  const [period, setPeriod] = useState<ClientPeriod>('hoy');
  const [notice, setNotice] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);
  const [draftOpen, setDraftOpen] = useState(false);
  const [draftError, setDraftError] = useState('');
  const [draft, setDraft] = useState<{ type: ClientRequestType; title: string; priority: ClientRequestPriority }>({
    type: 'ampliar_agentes',
    title: '',
    priority: 'normal',
  });

  const campaign = campaigns.find((c) => c.id === campaignId);
  const snap = useMemo(
    () => (campaign ? getCampaignSnapshot(campaign, agents, entries, calls, period) : null),
    [campaign, agents, entries, calls, period],
  );

  if (!campaign || !snap) {
    return (
      <main className="min-h-screen bg-vx-bg p-6">
        <EmptyState icon={Building2} title="No hay campañas asignadas" description="Pide a tu ejecutivo de cuenta que te asigne una campaña." />
      </main>
    );
  }

  const campaignRequests = requests.filter((r) => r.campaignId === campaign.id);
  const campaignInvoices = invoices.filter((i) => i.campaignId === campaign.id);

  const submitRequest = () => {
    const res = addRequest({ ...draft, campaignId: campaign.id });
    if (!res.ok) return setDraftError(ERRORS[res.reason]);
    setDraftError('');
    setDraftOpen(false);
    setDraft({ type: 'ampliar_agentes', title: '', priority: 'normal' });
    setNotice({ tone: 'success', text: 'Solicitud enviada. Tu ejecutivo la revisará pronto.' });
  };

  const cancel = (id: string) => {
    const res = cancelRequest(id);
    setNotice(res.ok ? { tone: 'success', text: 'Solicitud cancelada.' } : { tone: 'danger', text: ERRORS[res.reason] });
  };

  const slaOk = snap.slaPct !== null && snap.slaPct >= SLA_TARGET_PCT;
  const callByAgent = new Map(snap.activeCalls.map((c) => [c.agentId, c]));
  const now = new Date().toISOString();

  return (
    <main className="min-h-screen space-y-6 bg-vx-bg p-4 text-vx-text-2 lg:p-8">
      <PageHeader
        icon={Building2}
        eyebrow="PORTAL DE CLIENTE"
        title={campaign.name}
        description={`Sesión de ${profile.email}. Datos en vivo de tu campaña.`}
        actions={
          <>
            <Select aria-label="Campaña" value={campaignId} onChange={(e) => setCampaignId(e.target.value)} className="w-56">
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Tabs value={period} onChange={setPeriod} options={PERIODS} />
            <Button
              variant="ghost"
              icon={LogOut}
              onClick={() => {
                logout();
                navigate('/inicio');
              }}
            >
              Cerrar sesión
            </Button>
          </>
        }
      />

      {notice && (
        <Notice tone={notice.tone} onClose={() => setNotice(null)}>
          {notice.text}
        </Notice>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="SLA de campaña"
          value={snap.slaPct === null ? 'Sin turnos' : `${snap.slaPct.toFixed(1)}%`}
          hint={`Meta ${SLA_TARGET_PCT}% · horas cumplidas vs programadas`}
          tone={snap.slaPct === null ? 'neutral' : slaOk ? 'accent' : 'warning'}
          icon={Gauge}
        />
        <StatCard label="Agentes en línea" value={`${snap.online.length} / ${snap.assigned.length}`} hint="Con turno abierto ahora" tone="success" icon={Users} />
        <StatCard label="Llamadas en vivo" value={snap.activeCalls.length} hint="Atendiéndose en este momento" tone="info" icon={Phone} />
        <StatCard
          label="Horas facturables"
          value={`${snap.workedHours.toFixed(1)} h`}
          hint={`${usd(snap.estimatedUsd)} estimado a ${usd(campaign.billRate)}/h`}
          tone="accent"
          icon={Clock}
        />
      </div>

      <Card title="Actividad en vivo" subtitle="Quién atiende tu campaña ahora mismo (solo lectura)" bodyClassName="p-0">
        {snap.assigned.length === 0 ? (
          <EmptyState icon={Users} title="Sin agentes asignados" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="border-b border-vx-border tabular-nums text-xs text-vx-text-2/50">
                <tr>
                  <th className="px-5 py-3">Agente</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3">Llamada</th>
                  <th className="px-5 py-3">Duración</th>
                </tr>
              </thead>
              <tbody>
                {snap.assigned.map((a) => {
                  const call = callByAgent.get(a.id);
                  return (
                    <tr key={a.id} className="border-b border-vx-border/60 last:border-0">
                      <td className="px-5 py-3 font-medium text-vx-text">{a.name}</td>
                      <td className="px-5 py-3">
                        <Badge tone={STATUS_TONES[a.status]}>{STATUS_LABELS[a.status]}</Badge>
                      </td>
                      <td className="px-5 py-3">{call ? call.customerLabel : '—'}</td>
                      <td className="px-5 py-3 tabular-nums">{call ? `${Math.round(minutesBetween(call.startedAt, now))} min` : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card
          title="Solicitudes operativas"
          subtitle="Pide cambios a tu ejecutivo de cuenta"
          actions={
            <Button variant="primary" size="sm" icon={Plus} onClick={() => setDraftOpen(true)}>
              Nueva solicitud
            </Button>
          }
          bodyClassName="divide-y divide-vx-border"
        >
          {campaignRequests.length === 0 ? (
            <EmptyState icon={FileText} title="Sin solicitudes" description="Cuando pidas un cambio aparecerá aquí." />
          ) : (
            campaignRequests.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-vx-text">{r.title}</p>
                  <p className="mt-0.5 text-xs text-vx-text-2/60">
                    {TYPE_LABELS[r.type]} · {new Date(r.createdAt).toLocaleDateString('es-MX')}
                    {r.priority === 'alta' && ' · Prioridad alta'}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge tone={REQUEST_STATUS[r.status].tone}>{REQUEST_STATUS[r.status].label}</Badge>
                  {r.status === 'abierto' && (
                    <Button size="sm" variant="ghost" onClick={() => cancel(r.id)}>
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </Card>

        <Card
          title="Facturación y corte de horas"
          subtitle="Facturas emitidas y el corte del periodo en curso"
          actions={
            <Button
              size="sm"
              icon={Download}
              onClick={() => downloadCsv(`corte_${campaign.id}_${period}.csv`, currentCutToCsv(campaign, agents, entries, period))}
            >
              Exportar corte actual CSV
            </Button>
          }
          bodyClassName="p-0"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="border-b border-vx-border tabular-nums text-xs text-vx-text-2/50">
                <tr>
                  <th className="px-5 py-3">Periodo</th>
                  <th className="px-5 py-3">Horas</th>
                  <th className="px-5 py-3">Total</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-vx-border/60 bg-vx-accent/[0.04]">
                  <td className="px-5 py-3 font-medium text-vx-accent">Corte en curso</td>
                  <td className="px-5 py-3 tabular-nums">{snap.workedHours.toFixed(1)}</td>
                  <td className="px-5 py-3 tabular-nums">{usd(snap.estimatedUsd)}</td>
                  <td className="px-5 py-3">
                    <Badge tone="accent">Abierto</Badge>
                  </td>
                  <td />
                </tr>
                {campaignInvoices.map((i) => (
                  <tr key={i.id} className="border-b border-vx-border/60 last:border-0">
                    <td className="px-5 py-3 font-medium text-vx-text">{i.period}</td>
                    <td className="px-5 py-3 tabular-nums">{i.billableHours}</td>
                    <td className="px-5 py-3 tabular-nums">{usd(i.totalUsd)}</td>
                    <td className="px-5 py-3">
                      <Badge tone={i.status === 'pagada' ? 'success' : 'warning'}>{i.status === 'pagada' ? 'Pagada' : 'Pendiente'}</Badge>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Button size="sm" variant="ghost" icon={Download} onClick={() => downloadCsv(`${i.id}.csv`, invoiceToCsv(i, campaign.name))}>
                        CSV
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Modal
        open={draftOpen}
        onClose={() => setDraftOpen(false)}
        title="Nueva solicitud"
        description={`Para la campaña ${campaign.name}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDraftOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={submitRequest}>
              Enviar solicitud
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {draftError && <Notice tone="danger">{draftError}</Notice>}
          <Field label="Tipo">
            <Select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as ClientRequestType })}>
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Título">
            <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Ej. Sumar 2 agentes en el turno nocturno" />
          </Field>
          <Field label="Prioridad">
            <Select value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value as ClientRequestPriority })}>
              <option value="normal">Normal</option>
              <option value="alta">Alta</option>
            </Select>
          </Field>
        </div>
      </Modal>
    </main>
  );
};
