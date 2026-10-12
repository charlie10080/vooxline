import React, { useState } from 'react';
import { Star } from 'lucide-react';
import type { AnswerValue, FormQuestion, FormTemplate } from '@/types/forms';
import { useFormsStore } from '@/store/useFormsStore';
import { useWorkforceStore } from '@/store/useWorkforceStore';
import { Button, Input, Modal, Notice, Select, TextArea } from '@/components/ui';
import { FORMS_ERROR_MESSAGES } from './formLabels';

/** Responder un formulario. La validación vive en el store (lib/forms). */
export const FormFiller: React.FC<{
  template: FormTemplate;
  userId: string;
  onClose: () => void;
  onSent: (msg: string) => void;
}> = ({ template, userId, onClose, onSent }) => {
  const submitForm = useFormsStore((s) => s.submitForm);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [error, setError] = useState<{ msg: string; questionId?: string } | null>(null);

  const send = () => {
    const res = submitForm(template.id, userId, answers);
    if (!res.ok) {
      setError({ msg: FORMS_ERROR_MESSAGES[res.reason], questionId: res.questionId });
      if (res.questionId) document.getElementById(`fq-${res.questionId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    onSent(`Formulario "${template.title}" enviado.`);
  };

  return (
    <Modal
      open
      size="lg"
      onClose={onClose}
      title={template.title}
      description={template.description}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={send}>
            Enviar respuestas
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <Notice tone="danger" onClose={() => setError(null)}>
            {error.msg}
          </Notice>
        )}
        {template.questions.map((q, i) => (
          <fieldset
            key={q.id}
            id={`fq-${q.id}`}
            className={`space-y-2.5 rounded-xl border bg-[#0B0C10] p-4 ${
              error?.questionId === q.id ? 'border-[#EF4444]/60' : 'border-[#242E3B]'
            }`}
          >
            <legend className="sr-only">{q.label}</legend>
            <p aria-hidden="true" className="text-sm font-semibold text-white">
              <span className="mr-2 font-mono text-xs text-[#66FCF1]">{String(i + 1).padStart(2, '0')}</span>
              {q.label}
              {q.required && <span className="ml-1 text-[#EF4444]">*</span>}
            </p>
            {q.type === 'number' && (q.min !== null || q.max !== null) && (
              <p className="text-[11px] text-[#C5C6C7]/60">
                Rango permitido: {q.min ?? '—'} a {q.max ?? '—'}
              </p>
            )}
            <QuestionInput q={q} value={answers[q.id] ?? null} onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))} />
          </fieldset>
        ))}
        <p className="text-[11px] text-[#C5C6C7]/50">
          <span className="text-[#EF4444]">*</span> Obligatoria
        </p>
      </div>
    </Modal>
  );
};

const pill = (active: boolean) =>
  `rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#66FCF1] ${
    active ? 'border-[#66FCF1] bg-[#66FCF1]/15 text-[#66FCF1]' : 'border-[#242E3B] text-[#C5C6C7] hover:border-[#66FCF1]/40'
  }`;

const QuestionInput: React.FC<{ q: FormQuestion; value: AnswerValue; onChange: (v: AnswerValue) => void }> = ({ q, value, onChange }) => {
  const agents = useWorkforceStore((s) => s.agents);
  switch (q.type) {
    case 'short_text':
      return <Input aria-label={q.label} value={typeof value === 'string' ? value : ''} onChange={(e) => onChange(e.target.value)} />;
    case 'long_text':
      return <TextArea aria-label={q.label} value={typeof value === 'string' ? value : ''} onChange={(e) => onChange(e.target.value)} />;
    case 'date':
      return <Input type="date" aria-label={q.label} value={typeof value === 'string' ? value : ''} onChange={(e) => onChange(e.target.value)} />;
    case 'number':
      return (
        <Input
          type="number"
          aria-label={q.label}
          min={q.min ?? undefined}
          max={q.max ?? undefined}
          value={typeof value === 'number' ? value : ''}
          onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        />
      );
    case 'agent':
      return (
        <Select aria-label={q.label} value={typeof value === 'string' ? value : ''} onChange={(e) => onChange(e.target.value || null)}>
          <option value="">Selecciona un agente…</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} · {a.employeeCode}
            </option>
          ))}
        </Select>
      );
    case 'yes_no':
      return (
        <div className="flex gap-2">
          {[true, false].map((b) => (
            <button key={String(b)} type="button" aria-pressed={value === b} onClick={() => onChange(b)} className={pill(value === b)}>
              {b ? 'Sí' : 'No'}
            </button>
          ))}
        </div>
      );
    case 'rating':
      return (
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => {
            const on = typeof value === 'number' && n <= value;
            return (
              <button
                key={n}
                type="button"
                aria-label={`Calificación ${n} de 5`}
                aria-pressed={value === n}
                onClick={() => onChange(n)}
                className={`rounded-lg border p-1.5 transition-colors ${
                  on ? 'border-[#F59E0B]/60 bg-[#F59E0B]/10 text-[#F59E0B]' : 'border-[#242E3B] text-[#C5C6C7]/40 hover:text-[#F59E0B]'
                }`}
              >
                <Star className={`h-5 w-5 ${on ? 'fill-current' : ''}`} />
              </button>
            );
          })}
        </div>
      );
    case 'single_choice':
      return (
        <div className="flex flex-wrap gap-2">
          {q.options.map((o) => (
            <label key={o} className={`${pill(value === o)} cursor-pointer`}>
              <input type="radio" name={q.id} className="sr-only" checked={value === o} onChange={() => onChange(o)} />
              {o}
            </label>
          ))}
        </div>
      );
    case 'multi_choice': {
      const selected = Array.isArray(value) ? value : [];
      return (
        <div className="flex flex-wrap gap-2">
          {q.options.map((o) => {
            const on = selected.includes(o);
            return (
              <label key={o} className={`${pill(on)} cursor-pointer`}>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={on}
                  onChange={() => onChange(on ? selected.filter((x) => x !== o) : [...selected, o])}
                />
                {o}
              </label>
            );
          })}
        </div>
      );
    }
  }
};
