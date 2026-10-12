import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { FormSubmission, FormTemplate } from '@/types/forms';
import { evaluatedAgentId, formatAnswer, scoreSubmission } from '@/lib/forms';
import { useFormsStore } from '@/store/useFormsStore';
import { Badge, Button, Field, Modal, Notice, TextArea } from '@/components/ui';
import { FORMS_ERROR_MESSAGES, formatDateTime, scoreTone } from './formLabels';

/** Detalle de una respuesta. Los supervisores pueden marcarla como revisada. */
export const SubmissionDetail: React.FC<{
  template: FormTemplate;
  submission: FormSubmission;
  nameOf: (id: string) => string;
  /** id del supervisor que revisa; null = solo lectura */
  reviewerId: string | null;
  onClose: () => void;
}> = ({ template, submission, nameOf, reviewerId, onClose }) => {
  const reviewSubmission = useFormsStore((s) => s.reviewSubmission);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const score = scoreSubmission(template, submission.answers);
  const evaluated = evaluatedAgentId(template, submission.answers);
  const canReview = reviewerId !== null && submission.status === 'pending';

  const review = () => {
    if (!reviewerId) return;
    const res = reviewSubmission(submission.id, reviewerId, comment);
    if (!res.ok) setError(FORMS_ERROR_MESSAGES[res.reason]);
    else onClose();
  };

  return (
    <Modal
      open
      size="lg"
      onClose={onClose}
      title={template.title}
      description={`Enviado por ${nameOf(submission.submittedBy)} · ${formatDateTime(submission.submittedAt)}`}
      footer={
        canReview ? (
          <>
            <Button variant="ghost" onClick={onClose}>
              Cerrar
            </Button>
            <Button variant="primary" icon={CheckCircle2} onClick={review}>
              Marcar como revisado
            </Button>
          </>
        ) : undefined
      }
    >
      <div className="space-y-4">
        {error && (
          <Notice tone="danger" onClose={() => setError(null)}>
            {error}
          </Notice>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={submission.status === 'reviewed' ? 'success' : 'warning'}>
            {submission.status === 'reviewed' ? 'Revisado' : 'Pendiente de revisión'}
          </Badge>
          {score !== null && <Badge tone={scoreTone(score)}>Puntaje QA {score}%</Badge>}
          {evaluated && <Badge tone="accent">Evaluado: {nameOf(evaluated)}</Badge>}
        </div>

        <dl className="divide-y divide-[#242E3B] rounded-xl border border-[#242E3B] bg-[#0B0C10]">
          {template.questions.map((q) => {
            const text = formatAnswer(q, submission.answers[q.id], nameOf);
            return (
              <div key={q.id} className="grid gap-1 px-4 py-3 sm:grid-cols-[1fr_1.2fr] sm:gap-4">
                <dt className="text-xs text-[#C5C6C7]/70">{q.label}</dt>
                <dd className={`whitespace-pre-wrap text-sm ${text ? 'text-white' : 'italic text-[#C5C6C7]/40'}`}>{text || 'Sin respuesta'}</dd>
              </div>
            );
          })}
        </dl>

        {submission.status === 'reviewed' && (
          <div className="rounded-xl border border-[#10B981]/30 bg-[#10B981]/5 p-4 text-sm">
            <p className="text-xs text-[#10B981]">
              Revisado por {nameOf(submission.reviewedBy ?? '')}
              {submission.reviewedAt && ` · ${formatDateTime(submission.reviewedAt)}`}
            </p>
            <p className="mt-1 text-white">{submission.reviewComment ?? 'Sin comentario.'}</p>
          </div>
        )}

        {canReview && (
          <Field label="Comentario de revisión (opcional)">
            <TextArea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Retroalimentación o acción tomada" />
          </Field>
        )}
      </div>
    </Modal>
  );
};
