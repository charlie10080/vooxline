import React, { useMemo, useState } from 'react';
import { BarChart3, Download, Eye, Inbox } from 'lucide-react';
import type { FormSubmission, FormTemplate, SubmissionStatus } from '@/types/forms';
import type { SubmissionFilter } from '@/lib/forms';
import { evaluatedAgentId, filterSubmissions, isScored, scoreSubmission, submissionsToCsv, summarizeQuestion } from '@/lib/forms';
import { Avatar, Badge, Button, Card, EmptyState, Field, Input, Select } from '@/components/ui';
import { formatDateTime, scoreTone } from './formLabels';
import { SubmissionDetail } from './SubmissionDetail';

const NO_FILTER: SubmissionFilter = { status: 'all', agentId: '', from: '', to: '' };

function downloadCsv(filename: string, csv: string) {
  // BOM para que Excel abra bien los acentos
  const url = URL.createObjectURL(new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Respuestas de una plantilla: filtros, resumen por pregunta, tabla, detalle y exportación. */
export const SubmissionsPanel: React.FC<{
  template: FormTemplate;
  submissions: FormSubmission[];
  nameOf: (id: string) => string;
  reviewerId: string;
}> = ({ template, submissions, nameOf, reviewerId }) => {
  const [filter, setFilter] = useState<SubmissionFilter>(NO_FILTER);
  const [openId, setOpenId] = useState<string | null>(null);
  const scored = isScored(template);

  const all = useMemo(() => submissions.filter((s) => s.templateId === template.id), [submissions, template.id]);
  const rows = useMemo(() => filterSubmissions(all, filter), [all, filter]);
  const submitters = useMemo(() => [...new Set(all.map((s) => s.submittedBy))], [all]);
  const open = all.find((s) => s.id === openId) ?? null;
  const scores = rows.map((s) => scoreSubmission(template, s.answers)).filter((n): n is number => n !== null);
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

  const exportCsv = () => {
    const slug = template.title.normalize('NFD').replace(/[^\w]+/g, '-').toLowerCase().replace(/^-|-$/g, '');
    downloadCsv(`${slug || 'formulario'}-respuestas.csv`, submissionsToCsv(template, rows, nameOf));
  };

  return (
    <div className="space-y-5">
      <Card
        title="Filtros"
        subtitle={`${rows.length} de ${all.length} respuestas${avgScore !== null ? ` · puntaje QA promedio ${avgScore}%` : ''}`}
        actions={
          <Button icon={Download} onClick={exportCsv} disabled={rows.length === 0}>
            Exportar CSV
          </Button>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="Estado">
            <Select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value as SubmissionStatus | 'all' })}>
              <option value="all">Todos</option>
              <option value="pending">Pendientes</option>
              <option value="reviewed">Revisados</option>
            </Select>
          </Field>
          <Field label="Enviado por">
            <Select value={filter.agentId} onChange={(e) => setFilter({ ...filter, agentId: e.target.value })}>
              <option value="">Todos</option>
              {submitters.map((id) => (
                <option key={id} value={id}>
                  {nameOf(id)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Desde">
            <Input type="date" value={filter.from} onChange={(e) => setFilter({ ...filter, from: e.target.value })} />
          </Field>
          <Field label="Hasta">
            <Input type="date" value={filter.to} onChange={(e) => setFilter({ ...filter, to: e.target.value })} />
          </Field>
          <div className="flex items-end">
            <Button variant="ghost" className="w-full" onClick={() => setFilter(NO_FILTER)}>
              Limpiar filtros
            </Button>
          </div>
        </div>
      </Card>

      <Card title="Respuestas" bodyClassName="p-0">
        {rows.length === 0 ? (
          <EmptyState icon={Inbox} title="Sin respuestas" description="No hay respuestas con estos filtros." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[#242E3B] font-mono text-[11px] uppercase tracking-wider text-[#C5C6C7]/50">
                <tr>
                  <th className="px-5 py-3 font-semibold">Enviado por</th>
                  <th className="px-5 py-3 font-semibold">Fecha</th>
                  {scored && <th className="px-5 py-3 font-semibold">Agente evaluado</th>}
                  {scored && <th className="px-5 py-3 font-semibold">Puntaje</th>}
                  <th className="px-5 py-3 font-semibold">Estado</th>
                  <th className="px-5 py-3 text-right font-semibold">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#242E3B]">
                {rows.map((s) => {
                  const score = scoreSubmission(template, s.answers);
                  const evaluated = evaluatedAgentId(template, s.answers);
                  return (
                    <tr key={s.id} className="transition-colors hover:bg-white/[0.02]">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={nameOf(s.submittedBy)} size="sm" />
                          <span className="font-medium text-white">{nameOf(s.submittedBy)}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-[#C5C6C7]">{formatDateTime(s.submittedAt)}</td>
                      {scored && <td className="px-5 py-3 text-[#C5C6C7]">{evaluated ? nameOf(evaluated) : '—'}</td>}
                      {scored && <td className="px-5 py-3">{score !== null ? <Badge tone={scoreTone(score)}>{score}%</Badge> : '—'}</td>}
                      <td className="px-5 py-3">
                        <Badge tone={s.status === 'reviewed' ? 'success' : 'warning'}>{s.status === 'reviewed' ? 'Revisado' : 'Pendiente'}</Badge>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Button size="sm" icon={Eye} onClick={() => setOpenId(s.id)} aria-label={`Abrir respuesta de ${nameOf(s.submittedBy)}`}>
                          Abrir
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title={<span className="flex items-center gap-2"><BarChart3 className="h-4 w-4 text-[#66FCF1]" />Resumen por pregunta</span>} subtitle="Calculado sobre las respuestas filtradas">
        <div className="grid gap-4 md:grid-cols-2">
          {template.questions.map((q) => {
            const sum = summarizeQuestion(q, rows, nameOf);
            return (
              <div key={q.id} className="rounded-xl border border-[#242E3B] bg-[#0B0C10] p-4">
                <p className="text-sm font-semibold text-white">{q.label}</p>
                <p className="mt-0.5 font-mono text-[11px] text-[#C5C6C7]/50">{sum.answered} respuestas</p>
                {sum.kind === 'average' && (
                  <p className="mt-3 font-mono text-2xl font-bold text-[#66FCF1]">
                    {sum.average ?? '—'}
                    {q.type === 'rating' && sum.average !== null && <span className="text-sm text-[#C5C6C7]/60"> / 5</span>}
                    <span className="ml-2 text-xs font-normal text-[#C5C6C7]/60">promedio</span>
                  </p>
                )}
                {sum.kind === 'counts' && (
                  <ul className="mt-3 space-y-2">
                    {sum.counts.map((c) => {
                      const pct = sum.answered ? Math.round((c.count / sum.answered) * 100) : 0;
                      return (
                        <li key={c.label} className="text-xs">
                          <div className="flex justify-between text-[#C5C6C7]">
                            <span>{c.label}</span>
                            <span className="font-mono">
                              {c.count} · {pct}%
                            </span>
                          </div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#1F2833]">
                            <div className="h-full rounded-full bg-[#66FCF1]" style={{ width: `${pct}%` }} />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {open && (
        <SubmissionDetail template={template} submission={open} nameOf={nameOf} reviewerId={reviewerId} onClose={() => setOpenId(null)} />
      )}
    </div>
  );
};
