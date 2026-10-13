import React, { useState } from 'react';
import { CalendarClock, Send, Save, Users } from 'lucide-react';
import type { Update, UpdateAudience, UpdateCategory, UpdateResult } from '@/types/updates';
import { Button, Field, Input, Modal, Select, TextArea } from '@/components/ui';
import { useUpdatesStore } from '@/store/useUpdatesStore';
import type { UpdateInput } from '@/store/useUpdatesStore';
import { CATEGORY_LABELS, fromLocalInput, resolveAudience, toLocalInput } from '@/lib/updates';
import type { AudienceContext } from '@/lib/updates';

type AudienceKind = UpdateAudience['kind'];

const Check: React.FC<{ label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }> = ({
  label,
  hint,
  checked,
  onChange,
}) => (
  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-vx-border bg-vx-bg p-3 hover:border-vx-accent/30">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="mt-0.5 h-4 w-4 accent-vx-accent"
    />
    <span>
      <span className="block text-[13px] font-semibold text-vx-text">{label}</span>
      <span className="block text-xs text-vx-text-2/60">{hint}</span>
    </span>
  </label>
);

export const UpdateComposer: React.FC<{
  editing: Update | null;
  ctx: AudienceContext;
  campaigns: Array<{ id: string; name: string }>;
  authorId: string;
  onClose: () => void;
  onResult: (result: UpdateResult, successMessage: string) => void;
}> = ({ editing, ctx, campaigns, authorId, onClose, onResult }) => {
  const { createUpdate, editUpdate, publishUpdate } = useUpdatesStore();
  const [title, setTitle] = useState(editing?.title ?? '');
  const [body, setBody] = useState(editing?.body ?? '');
  const [category, setCategory] = useState<UpdateCategory>(editing?.category ?? 'operation');
  const [audienceKind, setAudienceKind] = useState<AudienceKind>(editing?.audience.kind ?? 'everyone');
  const [campaignIds, setCampaignIds] = useState<string[]>(
    editing?.audience.kind === 'campaigns' ? editing.audience.campaignIds : [],
  );
  const [groupId, setGroupId] = useState(
    editing?.audience.kind === 'group' ? editing.audience.groupId : (ctx.groups[0]?.id ?? ''),
  );
  const [requiresConfirmation, setRequiresConfirmation] = useState(editing?.requiresConfirmation ?? false);
  const [pinned, setPinned] = useState(editing?.pinned ?? false);
  const [commentsEnabled, setCommentsEnabled] = useState(editing?.commentsEnabled ?? true);
  const [publishAt, setPublishAt] = useState(toLocalInput(editing?.publishAt ?? null));
  const [expiresAt, setExpiresAt] = useState(toLocalInput(editing?.expiresAt ?? null));
  const [openedAt] = useState(() => Date.now());

  const audience: UpdateAudience =
    audienceKind === 'everyone'
      ? { kind: 'everyone' }
      : audienceKind === 'campaigns'
        ? { kind: 'campaigns', campaignIds }
        : { kind: 'group', groupId };
  const reach = resolveAudience(audience, editing?.authorId ?? authorId, ctx).length;

  const input: UpdateInput = {
    title,
    body,
    category,
    audience,
    requiresConfirmation,
    pinned,
    commentsEnabled,
    publishAt: fromLocalInput(publishAt),
    expiresAt: fromLocalInput(expiresAt),
  };
  const scheduled = input.publishAt !== null && Date.parse(input.publishAt) > openedAt;

  const submit = (publish: boolean) => {
    if (editing) {
      const res = editUpdate(editing.id, input);
      if (!res.ok || !publish) return onResult(res, 'Cambios guardados.');
      return onResult(publishUpdate(editing.id), scheduled ? 'Aviso programado.' : 'Aviso publicado.');
    }
    onResult(createUpdate(input, publish), publish ? (scheduled ? 'Aviso programado.' : 'Aviso publicado.') : 'Borrador guardado.');
  };

  const isDraft = !editing || editing.status === 'draft';
  const toggleCampaign = (id: string) =>
    setCampaignIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={editing ? 'Editar aviso' : 'Nuevo aviso'}
      description="Publica comunicados para toda la operación, una campaña o un grupo."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button icon={Save} onClick={() => submit(false)}>
            {isDraft ? 'Guardar borrador' : 'Guardar cambios'}
          </Button>
          {isDraft && (
            <Button variant="primary" icon={scheduled ? CalendarClock : Send} onClick={() => submit(true)}>
              {scheduled ? 'Programar' : 'Publicar'}
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
          <Field label="Título">
            <Input value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Cambio de speech en VOG" />
          </Field>
          <Field label="Categoría">
            <Select value={category} onChange={(e) => setCategory(e.target.value as UpdateCategory)}>
              {(Object.keys(CATEGORY_LABELS) as UpdateCategory[]).map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Mensaje" hint='Deja una línea en blanco entre párrafos. Empieza con "- " para viñetas y usa **texto** para negritas.'>
          <TextArea value={body} rows={7} maxLength={5000} onChange={(e) => setBody(e.target.value)} />
        </Field>

        <div className="space-y-3 rounded-xl border border-vx-border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[13px] font-semibold text-vx-text">Audiencia</span>
            <span className="inline-flex items-center gap-1.5 tabular-nums text-xs text-vx-accent">
              <Users className="h-3.5 w-3.5" aria-hidden="true" /> Llega a {reach} {reach === 1 ? 'persona' : 'personas'}
            </span>
          </div>
          <Field label="Enviar a">
            <Select value={audienceKind} onChange={(e) => setAudienceKind(e.target.value as AudienceKind)}>
              <option value="everyone">Toda la operación</option>
              <option value="campaigns">Una o varias campañas</option>
              <option value="group">Un grupo</option>
            </Select>
          </Field>
          {audienceKind === 'campaigns' && (
            <fieldset className="flex flex-wrap gap-2">
              <legend className="sr-only">Campañas</legend>
              {campaigns.map((c) => {
                const on = campaignIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleCampaign(c.id)}
                    className={`rounded-lg border px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                      on
                        ? 'border-vx-accent/50 bg-vx-accent/10 text-vx-accent'
                        : 'border-vx-border bg-vx-bg text-vx-text-2/70 hover:text-vx-text'
                    }`}
                  >
                    {c.name}
                  </button>
                );
              })}
            </fieldset>
          )}
          {audienceKind === 'group' && (
            <Field label="Grupo">
              <Select value={groupId} onChange={(e) => setGroupId(e.target.value)}>
                {ctx.groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Check
            label="Requiere confirmación"
            hint='Cada persona debe pulsar "Leído y entendido".'
            checked={requiresConfirmation}
            onChange={setRequiresConfirmation}
          />
          <Check label="Fijar arriba" hint="Aparece primero en el feed." checked={pinned} onChange={setPinned} />
          <Check label="Permitir comentarios" hint="Los agentes pueden responder." checked={commentsEnabled} onChange={setCommentsEnabled} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Publicar el" hint="Vacío = en cuanto se publique.">
            <Input type="datetime-local" value={publishAt} onChange={(e) => setPublishAt(e.target.value)} />
          </Field>
          <Field label="Vence el" hint="Vacío = no vence. Al vencer sale del feed.">
            <Input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
          </Field>
        </div>
      </div>
    </Modal>
  );
};
