import React, { useState } from 'react';
import { Check, CornerUpLeft, Edit3, Pin, PinOff, SmilePlus, Trash2, X } from 'lucide-react';
import type { ChatMessage, ChatReaction } from '@/types/chat';
import { CHAT_REACTIONS } from '@/types/chat';
import { splitMentions } from '@/lib/chat';
import { Avatar, TextArea } from '@/components/ui';

const formatTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });

/** Texto con las @menciones resaltadas; la del usuario actual, más fuerte */
export const MessageText: React.FC<{ text: string; names: string[]; myName: string }> = ({ text, names, myName }) => (
  <>
    {splitMentions(text, names).map((part, i) =>
      part.mention ? (
        <span
          key={i}
          className={`rounded px-1 font-semibold ${
            part.mention === myName ? 'bg-[#F59E0B]/15 text-[#F59E0B]' : 'bg-[#66FCF1]/10 text-[#66FCF1]'
          }`}
        >
          {part.text}
        </span>
      ) : (
        <React.Fragment key={i}>{part.text}</React.Fragment>
      ),
    )}
  </>
);

const IconAction: React.FC<{ label: string; onClick: () => void; icon: React.ComponentType<{ className?: string }>; danger?: boolean }> = ({
  label,
  onClick,
  icon: Icon,
  danger,
}) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    onClick={onClick}
    className={`rounded-md p-1.5 text-[#C5C6C7]/70 transition-colors hover:bg-white/5 ${danger ? 'hover:text-[#EF4444]' : 'hover:text-[#66FCF1]'}`}
  >
    <Icon className="h-3.5 w-3.5" />
  </button>
);

export const MessageRow: React.FC<{
  message: ChatMessage;
  authorName: string;
  /** Mensaje anterior del mismo autor hace poco: no se repite avatar ni nombre */
  compact: boolean;
  replyTo: { authorName: string; text: string; deleted: boolean } | null;
  names: string[];
  myName: string;
  myId: string;
  isOwn: boolean;
  canPin: boolean;
  canReact: boolean;
  nameOf: (id: string) => string;
  onReply: () => void;
  onEdit: (text: string) => boolean;
  onDelete: () => void;
  onReact: (emoji: ChatReaction) => void;
  onPin: () => void;
}> = ({ message, authorName, compact, replyTo, names, myName, myId, isOwn, canPin, canReact, nameOf, onReply, onEdit, onDelete, onReact, onPin }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.text);
  const [picker, setPicker] = useState(false);
  const deleted = Boolean(message.deletedAt);
  const reactions = CHAT_REACTIONS.filter((e) => (message.reactions[e]?.length ?? 0) > 0);

  const saveEdit = () => {
    if (onEdit(draft)) setEditing(false);
  };

  return (
    <div className={`group relative flex gap-3 rounded-xl px-3 transition-colors hover:bg-white/[0.02] ${compact ? 'py-0.5' : 'mt-2 py-1.5'} ${message.pinned ? 'bg-[#66FCF1]/[0.03]' : ''}`}>
      <div className="w-9 shrink-0">
        {!compact && <Avatar name={authorName} />}
        {compact && (
          <span className="hidden pt-1 text-right font-mono text-[10px] text-[#C5C6C7]/40 group-hover:block">
            {formatTime(message.createdAt)}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        {!compact && (
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-white">{authorName}</span>
            <span className="font-mono text-[10px] text-[#C5C6C7]/50">{formatTime(message.createdAt)}</span>
            {message.pinned && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#66FCF1]">
                <Pin className="h-3 w-3" /> Fijado
              </span>
            )}
          </div>
        )}

        {replyTo && !deleted && (
          <div className="mt-1 mb-1 border-l-2 border-[#66FCF1]/40 pl-2 text-xs text-[#C5C6C7]/60">
            <span className="font-semibold text-[#C5C6C7]/80">{replyTo.authorName}</span>{' '}
            {replyTo.deleted ? <em>Mensaje eliminado</em> : <span className="line-clamp-1">{replyTo.text}</span>}
          </div>
        )}

        {deleted ? (
          <p className="text-sm italic text-[#C5C6C7]/40">Mensaje eliminado</p>
        ) : editing ? (
          <div className="mt-1 space-y-2">
            <TextArea
              aria-label="Editar mensaje"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  saveEdit();
                }
                if (e.key === 'Escape') setEditing(false);
              }}
              autoFocus
              className="min-h-[60px] text-sm"
            />
            <div className="flex gap-2 text-[11px]">
              <button type="button" onClick={saveEdit} className="inline-flex items-center gap-1 rounded-lg bg-[#66FCF1] px-2.5 py-1 font-bold text-[#0B0C10]">
                <Check className="h-3 w-3" /> Guardar
              </button>
              <button type="button" onClick={() => setEditing(false)} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[#C5C6C7] hover:bg-white/5">
                <X className="h-3 w-3" /> Cancelar
              </button>
              <span className="self-center text-[#C5C6C7]/40">Enter guarda · Esc cancela</span>
            </div>
          </div>
        ) : (
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-[#C5C6C7]">
            <MessageText text={message.text} names={names} myName={myName} />
            {message.editedAt && <span className="ml-1 text-[10px] text-[#C5C6C7]/40">(editado)</span>}
          </p>
        )}

        {reactions.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {reactions.map((e) => {
              const who = message.reactions[e] ?? [];
              const mine = who.includes(myId);
              return (
                <button
                  key={e}
                  type="button"
                  disabled={!canReact}
                  onClick={() => onReact(e)}
                  title={who.map(nameOf).join(', ')}
                  aria-label={`${e} ${who.length} reacciones${mine ? ', incluida la tuya' : ''}`}
                  aria-pressed={mine}
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors ${
                    mine ? 'border-[#66FCF1]/50 bg-[#66FCF1]/10 text-[#66FCF1]' : 'border-[#242E3B] bg-[#0B0C10] text-[#C5C6C7] hover:border-[#66FCF1]/30'
                  }`}
                >
                  <span>{e}</span>
                  <span className="font-mono text-[10px]">{who.length}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {!deleted && !editing && (
        <div className="absolute -top-3 right-3 flex items-center gap-0.5 rounded-lg border border-[#242E3B] bg-[#13151c] p-0.5 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          {canReact && <IconAction label="Reaccionar" icon={SmilePlus} onClick={() => setPicker((v) => !v)} />}
          {canReact && <IconAction label="Responder" icon={CornerUpLeft} onClick={onReply} />}
          {canPin && <IconAction label={message.pinned ? 'Desfijar' : 'Fijar mensaje'} icon={message.pinned ? PinOff : Pin} onClick={onPin} />}
          {isOwn && (
            <IconAction
              label="Editar"
              icon={Edit3}
              onClick={() => {
                setDraft(message.text);
                setEditing(true);
              }}
            />
          )}
          {isOwn && <IconAction label="Eliminar" icon={Trash2} danger onClick={onDelete} />}
          {picker && (
            <div className="absolute right-0 top-8 z-10 flex gap-1 rounded-xl border border-[#242E3B] bg-[#13151c] p-1.5 shadow-2xl">
              {CHAT_REACTIONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  aria-label={`Reaccionar con ${e}`}
                  onClick={() => {
                    onReact(e);
                    setPicker(false);
                  }}
                  className="rounded-lg px-1.5 py-1 text-base hover:bg-white/5"
                >
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
