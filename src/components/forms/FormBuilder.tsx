import React, { useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2, X } from 'lucide-react';
import type { FormCategory, FormQuestion, FormTemplate, QuestionType, SubmissionFrequency } from '@/types/forms';
import type { TemplateDraft } from '@/lib/forms';
import { emptyQuestion, isChoiceType, moveQuestion } from '@/lib/forms';
import { useFormsStore } from '@/store/useFormsStore';
import { useWorkforceStore } from '@/store/useWorkforceStore';
import { useDirectoryStore } from '@/store/useDirectoryStore';
import { Button, Field, Input, Modal, Notice, Select, TextArea } from '@/components/ui';
import { CATEGORY_LABELS, FORMS_ERROR_MESSAGES, FREQUENCY_LABELS, QUESTION_TYPE_LABELS } from './formLabels';

const BLANK: TemplateDraft = {
  title: '',
  description: '',
  category: 'other',
  audience: { kind: 'everyone' },
  frequency: 'multiple',
  questions: [],
};

/** Crea o edita una plantilla. `template` = null para crear. */
export const FormBuilder: React.FC<{
  template: FormTemplate | null;
  userId: string;
  onClose: () => void;
  onSaved: (msg: string) => void;
}> = ({ template, userId, onClose, onSaved }) => {
  const { createTemplate, updateTemplate } = useFormsStore();
  const campaigns = useWorkforceStore((s) => s.campaigns);
  const groups = useDirectoryStore((s) => s.groups);
  const [draft, setDraft] = useState<TemplateDraft>(() =>
    template
      ? {
          title: template.title,
          description: template.description,
          category: template.category,
          audience: template.audience,
          frequency: template.frequency,
          questions: template.questions,
        }
      : BLANK,
  );
  const [newType, setNewType] = useState<QuestionType>('short_text');
  const [error, setError] = useState<{ msg: string; questionId?: string } | null>(null);

  const patch = (p: Partial<TemplateDraft>) => setDraft((d) => ({ ...d, ...p }));
  const patchQuestion = (id: string, p: Partial<FormQuestion>) =>
    patch({ questions: draft.questions.map((q) => (q.id === id ? { ...q, ...p } : q)) });

  const setAudienceKind = (kind: 'everyone' | 'campaigns' | 'group') => {
    if (kind === 'everyone') patch({ audience: { kind } });
    else if (kind === 'campaigns') patch({ audience: { kind, campaignIds: [] } });
    else patch({ audience: { kind, groupId: groups[0]?.id ?? '' } });
  };

  const changeType = (q: FormQuestion, type: QuestionType) =>
    patchQuestion(q.id, {
      type,
      options: isChoiceType(type) ? (q.options.length >= 2 ? q.options : ['Opción 1', 'Opción 2']) : [],
      min: null,
      max: null,
    });

  const save = () => {
    const res = template ? updateTemplate(template.id, draft) : createTemplate(draft, userId);
    if (!res.ok) {
      setError({ msg: FORMS_ERROR_MESSAGES[res.reason], questionId: res.questionId });
      return;
    }
    onSaved(template ? 'Formulario actualizado.' : 'Formulario creado y publicado.');
  };

  const numOrNull = (v: string): number | null => (v === '' ? null : Number(v));

  return (
    <Modal
      open
      size="lg"
      onClose={onClose}
      title={template ? 'Editar formulario' : 'Nuevo formulario'}
      description="Define preguntas, a quién se asigna y cuántas veces se puede responder."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={save}>
            {template ? 'Guardar cambios' : 'Publicar formulario'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {error && (
          <Notice tone="danger" onClose={() => setError(null)}>
            {error.msg}
          </Notice>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Título">
              <Input value={draft.title} onChange={(e) => patch({ title: e.target.value })} placeholder="Ej. Auditoría de cierre de turno" />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Descripción">
              <TextArea
                value={draft.description}
                onChange={(e) => patch({ description: e.target.value })}
                placeholder="Instrucciones para quien lo responde"
                className="min-h-[64px]"
              />
            </Field>
          </div>
          <Field label="Categoría">
            <Select value={draft.category} onChange={(e) => patch({ category: e.target.value as FormCategory })}>
              {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Frecuencia">
            <Select value={draft.frequency} onChange={(e) => patch({ frequency: e.target.value as SubmissionFrequency })}>
              {Object.entries(FREQUENCY_LABELS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Asignado a">
            <Select value={draft.audience.kind} onChange={(e) => setAudienceKind(e.target.value as 'everyone' | 'campaigns' | 'group')}>
              <option value="everyone">Todos los usuarios</option>
              <option value="campaigns">Campañas específicas</option>
              <option value="group">Un grupo</option>
            </Select>
          </Field>
          {draft.audience.kind === 'group' && (
            <Field label="Grupo">
              <Select value={draft.audience.groupId} onChange={(e) => patch({ audience: { kind: 'group', groupId: e.target.value } })}>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}
        </div>

        {draft.audience.kind === 'campaigns' && (
          <fieldset className="rounded-xl border border-vx-border bg-vx-bg p-3">
            <legend className="px-1 text-[13px] font-medium text-vx-text-2">Campañas</legend>
            <div className="flex flex-wrap gap-2">
              {campaigns.map((c) => {
                const ids = draft.audience.kind === 'campaigns' ? draft.audience.campaignIds : [];
                const checked = ids.includes(c.id);
                return (
                  <label
                    key={c.id}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-[13px] ${
                      checked ? 'border-vx-accent/50 bg-vx-accent/10 text-vx-accent' : 'border-vx-border text-vx-text-2'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="accent-vx-accent"
                      checked={checked}
                      onChange={() =>
                        patch({
                          audience: {
                            kind: 'campaigns',
                            campaignIds: checked ? ids.filter((x) => x !== c.id) : [...ids, c.id],
                          },
                        })
                      }
                    />
                    {c.name}
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-vx-text">Preguntas ({draft.questions.length})</h4>
          </div>
          {draft.questions.map((q, i) => (
            <div
              key={q.id}
              className={`space-y-3 rounded-xl border bg-vx-bg p-4 ${
                error?.questionId === q.id ? 'border-vx-danger/60' : 'border-vx-border'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="mt-2 tabular-nums text-[13px] text-vx-accent">{String(i + 1).padStart(2, '0')}</span>
                <div className="grid flex-1 gap-3 sm:grid-cols-[1fr_180px]">
                  <Field label="Pregunta">
                    <Input value={q.label} onChange={(e) => patchQuestion(q.id, { label: e.target.value })} placeholder="Escribe la pregunta" />
                  </Field>
                  <Field label="Tipo">
                    <Select value={q.type} onChange={(e) => changeType(q, e.target.value as QuestionType)}>
                      {Object.entries(QUESTION_TYPE_LABELS).map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
                <div className="mt-6 flex items-center gap-1">
                  <IconBtn label={`Subir pregunta ${i + 1}`} disabled={i === 0} onClick={() => patch({ questions: moveQuestion(draft.questions, i, -1) })}>
                    <ArrowUp className="h-3.5 w-3.5" />
                  </IconBtn>
                  <IconBtn
                    label={`Bajar pregunta ${i + 1}`}
                    disabled={i === draft.questions.length - 1}
                    onClick={() => patch({ questions: moveQuestion(draft.questions, i, 1) })}
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </IconBtn>
                  <IconBtn label={`Eliminar pregunta ${i + 1}`} danger onClick={() => patch({ questions: draft.questions.filter((x) => x.id !== q.id) })}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </IconBtn>
                </div>
              </div>

              {isChoiceType(q.type) && (
                <div className="space-y-2 pl-7">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <Input
                        aria-label={`Opción ${oi + 1}`}
                        value={opt}
                        onChange={(e) => patchQuestion(q.id, { options: q.options.map((o, j) => (j === oi ? e.target.value : o)) })}
                      />
                      <IconBtn label={`Quitar opción ${oi + 1}`} onClick={() => patchQuestion(q.id, { options: q.options.filter((_, j) => j !== oi) })}>
                        <X className="h-3.5 w-3.5" />
                      </IconBtn>
                    </div>
                  ))}
                  <Button size="sm" variant="ghost" icon={Plus} onClick={() => patchQuestion(q.id, { options: [...q.options, `Opción ${q.options.length + 1}`] })}>
                    Agregar opción
                  </Button>
                </div>
              )}

              {q.type === 'number' && (
                <div className="grid grid-cols-2 gap-3 pl-7">
                  <Field label="Mínimo (opcional)">
                    <Input type="number" value={q.min ?? ''} onChange={(e) => patchQuestion(q.id, { min: numOrNull(e.target.value) })} />
                  </Field>
                  <Field label="Máximo (opcional)">
                    <Input type="number" value={q.max ?? ''} onChange={(e) => patchQuestion(q.id, { max: numOrNull(e.target.value) })} />
                  </Field>
                </div>
              )}

              <label className="flex w-fit cursor-pointer items-center gap-2 pl-7 text-[13px] text-vx-text-2">
                <input type="checkbox" className="accent-vx-accent" checked={q.required} onChange={(e) => patchQuestion(q.id, { required: e.target.checked })} />
                Obligatoria
              </label>
            </div>
          ))}

          <div className="flex flex-wrap items-end gap-2 rounded-xl border border-dashed border-vx-border p-3">
            <div className="min-w-[200px] flex-1">
              <Field label="Tipo de la nueva pregunta">
                <Select value={newType} onChange={(e) => setNewType(e.target.value as QuestionType)}>
                  {Object.entries(QUESTION_TYPE_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Button icon={Plus} onClick={() => patch({ questions: [...draft.questions, emptyQuestion(newType, crypto.randomUUID())] })}>
              Agregar pregunta
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

const IconBtn: React.FC<{ label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: React.ReactNode }> = ({
  label,
  onClick,
  disabled,
  danger,
  children,
}) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    disabled={disabled}
    onClick={onClick}
    className={`rounded-lg border border-vx-border p-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
      danger ? 'text-vx-danger hover:bg-vx-danger/10' : 'text-vx-text-2 hover:border-vx-accent/40 hover:text-vx-accent'
    }`}
  >
    {children}
  </button>
);
