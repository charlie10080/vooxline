import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Edit2,
  Eye,
  FileText,
  Gauge,
  Inbox,
  ListChecks,
  Plus,
  Power,
  Send,
  Trash2,
} from 'lucide-react';
import type { FormAudience, FormSubmission, FormTemplate } from '@/types/forms';
import { hasSubmittedOn, scoreSubmission } from '@/lib/forms';
import { isInAudience, useFormsStore } from '@/store/useFormsStore';
import { useWorkforceStore } from '@/store/useWorkforceStore';
import { useDirectoryStore } from '@/store/useDirectoryStore';
import { useCurrentUser, useSessionStore } from '@/store/useSessionStore';
import { Badge, Button, Card, EmptyState, Notice, PageHeader, Select, StatCard, Tabs } from '@/components/ui';
import { FormBuilder } from '@/components/forms/FormBuilder';
import { FormFiller } from '@/components/forms/FormFiller';
import { SubmissionsPanel } from '@/components/forms/SubmissionsPanel';
import { SubmissionDetail } from '@/components/forms/SubmissionDetail';
import { CATEGORY_LABELS, FORMS_ERROR_MESSAGES, FREQUENCY_LABELS, formatDateTime, scoreTone } from '@/components/forms/formLabels';

type TabKey = 'templates' | 'responses' | 'mine' | 'history';
type Toast = { tone: 'success' | 'danger'; msg: string } | null;

export const FormsPage: React.FC = () => {
  const user = useCurrentUser();
  const userId = useSessionStore((s) => s.currentUserId);
  const { templates, submissions, setTemplateActive, deleteTemplate } = useFormsStore();
  const agents = useWorkforceStore((s) => s.agents);
  const campaigns = useWorkforceStore((s) => s.campaigns);
  const profiles = useDirectoryStore((s) => s.profiles);
  const groups = useDirectoryStore((s) => s.groups);

  const [tab, setTab] = useState<TabKey>(user.isManager ? 'templates' : 'mine');
  const [toast, setToast] = useState<Toast>(null);
  const [builder, setBuilder] = useState<{ template: FormTemplate | null } | null>(null);
  const [filling, setFilling] = useState<FormTemplate | null>(null);
  const [responsesFor, setResponsesFor] = useState<string>(templates[0]?.id ?? '');
  const [viewing, setViewing] = useState<FormSubmission | null>(null);

  const nameOf = (id: string) => agents.find((a) => a.id === id)?.name ?? 'Usuario eliminado';
  const activeTab: TabKey = !user.isManager && (tab === 'templates' || tab === 'responses') ? 'mine' : tab;

  const assigned = useMemo(
    () => templates.filter((t) => t.active && isInAudience(t.audience, userId, agents, profiles, groups)),
    [templates, userId, agents, profiles, groups],
  );
  const mySubs = useMemo(() => submissions.filter((s) => s.submittedBy === userId), [submissions, userId]);
  const pendingReview = submissions.filter((s) => s.status === 'pending').length;
  const qaScores = submissions
    .map((s) => {
      const t = templates.find((x) => x.id === s.templateId);
      return t ? scoreSubmission(t, s.answers) : null;
    })
    .filter((n): n is number => n !== null);
  const avgQa = qaScores.length ? Math.round(qaScores.reduce((a, b) => a + b, 0) / qaScores.length) : null;
  const doneToday = assigned.filter((t) => t.frequency === 'daily' && hasSubmittedOn(submissions, t.id, userId, new Date()));

  const audienceLabel = (a: FormAudience): string => {
    if (a.kind === 'everyone') return 'Todos los usuarios';
    if (a.kind === 'campaigns') return a.campaignIds.map((id) => campaigns.find((c) => c.id === id)?.name ?? id).join(', ');
    return `Grupo: ${groups.find((g) => g.id === a.groupId)?.name ?? 'eliminado'}`;
  };

  const run = (res: { ok: true } | { ok: false; reason: keyof typeof FORMS_ERROR_MESSAGES }, okMsg: string) =>
    setToast(res.ok ? { tone: 'success', msg: okMsg } : { tone: 'danger', msg: FORMS_ERROR_MESSAGES[res.reason] });

  const tabs: Array<{ value: TabKey; label: string; count?: number }> = [
    ...(user.isManager
      ? [
          { value: 'templates' as const, label: 'Plantillas', count: templates.length },
          { value: 'responses' as const, label: 'Respuestas', count: pendingReview },
        ]
      : []),
    { value: 'mine', label: 'Por responder', count: assigned.length - doneToday.length },
    { value: 'history', label: 'Mis envíos', count: mySubs.length },
  ];

  const responsesTemplate = templates.find((t) => t.id === responsesFor) ?? templates[0];
  const viewingTemplate = viewing ? templates.find((t) => t.id === viewing.templateId) : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={ClipboardList}
        eyebrow="FORMULARIOS Y CHECKLISTS"
        title="Formularios"
        description={
          user.isManager
            ? 'Crea evaluaciones de calidad, checklists de turno, encuestas y reportes; revisa las respuestas y expórtalas.'
            : 'Responde los formularios que te asignaron y consulta lo que ya enviaste.'
        }
        actions={
          user.isManager && (
            <Button variant="primary" icon={Plus} onClick={() => setBuilder({ template: null })}>
              Nuevo formulario
            </Button>
          )
        }
      />

      {toast && (
        <Notice tone={toast.tone} onClose={() => setToast(null)}>
          {toast.msg}
        </Notice>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {user.isManager ? (
          <>
            <StatCard label="Plantillas activas" value={templates.filter((t) => t.active).length} icon={FileText} tone="accent" />
            <StatCard label="Respuestas totales" value={submissions.length} icon={Inbox} tone="info" />
            <StatCard label="Por revisar" value={pendingReview} icon={ClipboardCheck} tone={pendingReview ? 'warning' : 'success'} />
            <StatCard label="Puntaje QA promedio" value={avgQa === null ? '—' : `${avgQa}%`} icon={Gauge} tone={avgQa === null ? 'neutral' : scoreTone(avgQa)} />
          </>
        ) : (
          <>
            <StatCard label="Asignados" value={assigned.length} icon={FileText} tone="accent" />
            <StatCard label="Checklists hechos hoy" value={doneToday.length} icon={CheckCircle2} tone="success" />
            <StatCard label="Mis envíos" value={mySubs.length} icon={Send} tone="info" />
            <StatCard label="Revisados" value={mySubs.filter((s) => s.status === 'reviewed').length} icon={ClipboardCheck} tone="neutral" />
          </>
        )}
      </div>

      <Tabs value={activeTab} onChange={setTab} options={tabs} />

      {activeTab === 'templates' && (
        <div className="grid gap-4 lg:grid-cols-2">
          {templates.length === 0 && (
            <Card className="lg:col-span-2">
              <EmptyState icon={FileText} title="Aún no hay formularios" description="Crea el primero con el botón Nuevo formulario." />
            </Card>
          )}
          {templates.map((t) => {
            const count = submissions.filter((s) => s.templateId === t.id).length;
            return (
              <Card
                key={t.id}
                title={t.title}
                subtitle={audienceLabel(t.audience)}
                actions={<Badge tone={t.active ? 'success' : 'neutral'}>{t.active ? 'Activo' : 'Inactivo'}</Badge>}
                className={t.active ? '' : 'opacity-70'}
              >
                <p className="text-[13px] text-vx-text-2/70">{t.description || 'Sin descripción.'}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Badge tone="accent">{CATEGORY_LABELS[t.category]}</Badge>
                  <Badge>{t.questions.length} preguntas</Badge>
                  <Badge>{FREQUENCY_LABELS[t.frequency]}</Badge>
                  <Badge tone="info">{count} respuestas</Badge>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 border-t border-vx-border pt-4">
                  <Button size="sm" icon={Eye} onClick={() => { setResponsesFor(t.id); setTab('responses'); }}>
                    Ver respuestas
                  </Button>
                  <Button size="sm" icon={Edit2} onClick={() => setBuilder({ template: t })}>
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={Power}
                    onClick={() => run(setTemplateActive(t.id, !t.active), t.active ? 'Formulario desactivado.' : 'Formulario activado.')}
                  >
                    {t.active ? 'Desactivar' : 'Activar'}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    icon={Trash2}
                    onClick={() => {
                      if (window.confirm(`¿Eliminar "${t.title}"?`)) run(deleteTemplate(t.id), 'Formulario eliminado.');
                    }}
                  >
                    Eliminar
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {activeTab === 'responses' &&
        (responsesTemplate ? (
          <div className="space-y-4">
            <div className="max-w-md">
              <Select aria-label="Formulario" value={responsesTemplate.id} onChange={(e) => setResponsesFor(e.target.value)}>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </Select>
            </div>
            <SubmissionsPanel key={responsesTemplate.id} template={responsesTemplate} submissions={submissions} nameOf={nameOf} reviewerId={userId} />
          </div>
        ) : (
          <Card>
            <EmptyState icon={Inbox} title="No hay formularios" />
          </Card>
        ))}

      {activeTab === 'mine' && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {assigned.length === 0 && (
            <Card className="md:col-span-2 xl:col-span-3">
              <EmptyState icon={ListChecks} title="No tienes formularios asignados" description="Cuando tu supervisión publique uno, aparecerá aquí." />
            </Card>
          )}
          {assigned.map((t) => {
            const done = doneToday.includes(t);
            return (
              <Card key={t.id} title={t.title} subtitle={CATEGORY_LABELS[t.category]}>
                <p className="min-h-[2.5rem] text-[13px] text-vx-text-2/70">{t.description}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Badge>{t.questions.length} preguntas</Badge>
                  <Badge tone={t.frequency === 'daily' ? 'warning' : 'neutral'}>{FREQUENCY_LABELS[t.frequency]}</Badge>
                  {done && <Badge tone="success">Enviado hoy</Badge>}
                </div>
                <Button variant={done ? 'secondary' : 'primary'} icon={Send} className="mt-4 w-full" disabled={done} onClick={() => setFilling(t)}>
                  {done ? 'Ya respondiste hoy' : 'Responder'}
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      {activeTab === 'history' && (
        <Card title="Mis envíos" bodyClassName="p-0">
          {mySubs.length === 0 ? (
            <EmptyState icon={Inbox} title="Aún no envías formularios" />
          ) : (
            <ul className="divide-y divide-vx-border">
              {mySubs.map((s) => {
                const t = templates.find((x) => x.id === s.templateId);
                return (
                  <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                    <div>
                      <p className="text-sm font-semibold text-vx-text">{t?.title ?? 'Formulario eliminado'}</p>
                      <p className="tabular-nums text-xs text-vx-text-2/60">{formatDateTime(s.submittedAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={s.status === 'reviewed' ? 'success' : 'warning'}>{s.status === 'reviewed' ? 'Revisado' : 'Pendiente'}</Badge>
                      {t && (
                        <Button size="sm" icon={Eye} onClick={() => setViewing(s)}>
                          Ver
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      )}

      {builder && (
        <FormBuilder
          template={builder.template}
          userId={userId}
          onClose={() => setBuilder(null)}
          onSaved={(msg) => {
            setBuilder(null);
            setToast({ tone: 'success', msg });
          }}
        />
      )}
      {filling && (
        <FormFiller
          template={filling}
          userId={userId}
          onClose={() => setFilling(null)}
          onSent={(msg) => {
            setFilling(null);
            setToast({ tone: 'success', msg });
          }}
        />
      )}
      {viewing && viewingTemplate && (
        <SubmissionDetail template={viewingTemplate} submission={viewing} nameOf={nameOf} reviewerId={null} onClose={() => setViewing(null)} />
      )}
    </div>
  );
};
