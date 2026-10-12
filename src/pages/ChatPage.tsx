import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AtSign,
  Hash,
  Lock,
  Megaphone,
  MessageSquare,
  MessageSquarePlus,
  Pin,
  Search,
  Send,
  Users,
  X,
} from 'lucide-react';
import type { ChatError, Conversation } from '@/types/chat';
import { useChatStore } from '@/store/useChatStore';
import { useWorkforceStore } from '@/store/useWorkforceStore';
import { useDirectoryStore } from '@/store/useDirectoryStore';
import { useSessionStore, useCurrentUser } from '@/store/useSessionStore';
import { MAX_MESSAGE_LENGTH, buildChatUsers, canPost, countUnread, getMemberIds, matchesSearch } from '@/lib/chat';
import type { ChatUser } from '@/lib/chat';
import { MessageRow, MessageText } from '@/components/chat/MessageRow';
import { Avatar, Badge, Button, EmptyState, Field, Input, Modal, Notice, PageHeader, TextArea } from '@/components/ui';

const ERRORS: Record<ChatError, string> = {
  not_found: 'La conversación o el mensaje ya no existe.',
  not_member: 'No perteneces a esta conversación.',
  forbidden: 'No tienes permiso para realizar esta acción.',
  announcement_only: 'En este canal solo supervisión puede publicar.',
  empty: 'Escribe un mensaje antes de enviar.',
  too_long: `El mensaje supera el límite de ${MAX_MESSAGE_LENGTH} caracteres.`,
  invalid: 'Los datos no son válidos. Revisa e intenta de nuevo.',
};

const dayKey = (iso: string): string => new Date(iso).toDateString();
function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Hoy';
  if (d.toDateString() === yesterday.toDateString()) return 'Ayer';
  return d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
}

function ConvIcon({ conv, className = 'h-4 w-4' }: { conv: Conversation; className?: string }) {
  if (conv.kind === 'group') return <Users className={className} />;
  if (conv.kind === 'direct') return <AtSign className={className} />;
  if (conv.announcementOnly) return <Megaphone className={className} />;
  if (conv.scope === 'managers') return <Lock className={className} />;
  return <Hash className={className} />;
}

export const ChatPage: React.FC = () => {
  const userId = useSessionStore((s) => s.currentUserId);
  const { isManager } = useCurrentUser();
  const agents = useWorkforceStore((s) => s.agents);
  const profiles = useDirectoryStore((s) => s.profiles);
  const {
    conversations, messages, lastReadAt, sendMessage, editMessage, deleteMessage, toggleReaction, togglePin,
    markRead, openDirect, createGroup, setAnnouncementOnly,
  } = useChatStore();

  const users = useMemo(() => buildChatUsers(agents, profiles), [agents, profiles]);
  const nameOf = (id: string) => users.find((u) => u.id === id)?.name ?? 'Usuario eliminado';
  const myName = nameOf(userId);
  const titleOf = (c: Conversation) =>
    c.kind === 'direct' ? nameOf(c.memberIds.find((id) => id !== userId) ?? userId) : c.name;

  const [activeId, setActiveId] = useState<string | null>(null);
  const [listQuery, setListQuery] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [msgQuery, setMsgQuery] = useState('');
  const [showPinned, setShowPinned] = useState(false);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [dmOpen, setDmOpen] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);

  const lastAt = (convId: string) =>
    messages.reduce((max, m) => (m.conversationId === convId && m.createdAt > max ? m.createdAt : max), '');

  const visible = conversations.filter((c) => getMemberIds(c, users).includes(userId));
  const active = visible.find((c) => c.id === activeId) ?? visible[0] ?? null;
  const convMessages = active ? messages.filter((m) => m.conversationId === active.id) : [];
  const lastMessageId = convMessages[convMessages.length - 1]?.id;
  const memberIds = active ? getMemberIds(active, users) : [];
  const userCanPost = active ? canPost(active, userId, users) : false;
  const pinned = convMessages.filter((m) => m.pinned && !m.deletedAt);
  const shown = showSearch && msgQuery.trim() ? convMessages.filter((m) => !m.deletedAt && matchesSearch(m.text, msgQuery)) : convMessages;

  const fail = (r: { ok: boolean; reason?: ChatError }) => {
    if (!r.ok && r.reason) setNotice(ERRORS[r.reason]);
    return r.ok;
  };

  // Al abrir una conversación o llegar mensajes nuevos, se marca como leída
  const activeConvId = active?.id;
  useEffect(() => {
    if (activeConvId) markRead(userId, activeConvId);
  }, [activeConvId, lastMessageId, userId, markRead]);

  // Auto-scroll al final
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [activeConvId, lastMessageId, showSearch]);

  const selectConversation = (id: string) => {
    setActiveId(id);
    setReplyToId(null);
    setText('');
    setShowSearch(false);
    setMsgQuery('');
    setShowPinned(false);
  };

  const submit = () => {
    if (!active) return;
    if (fail(sendMessage(userId, active.id, text, replyToId))) {
      setText('');
      setReplyToId(null);
    }
  };

  // Autocompletado de @menciones: palabra que se está escribiendo al final del texto
  const mentionQuery = /(?:^|\s)@([^\s@]*)$/.exec(text)?.[1];
  const mentionCandidates =
    mentionQuery === undefined
      ? []
      : memberIds.filter((id) => id !== userId && matchesSearch(nameOf(id), mentionQuery)).slice(0, 5);
  const insertMention = (id: string) =>
    setText((t) => t.replace(/@([^\s@]*)$/, `@${nameOf(id)} `));

  const sections: Array<{ label: string; items: Conversation[] }> = [
    { label: 'Canales', items: visible.filter((c) => c.kind === 'channel') },
    { label: 'Grupos', items: visible.filter((c) => c.kind === 'group') },
    { label: 'Mensajes directos', items: visible.filter((c) => c.kind === 'direct') },
  ].map((s) => ({
    ...s,
    items: s.items
      .filter((c) => matchesSearch(titleOf(c), listQuery))
      .sort((a, b) => (s.label === 'Canales' ? 0 : lastAt(b.id).localeCompare(lastAt(a.id)))),
  }));

  const replyTarget = replyToId ? convMessages.find((m) => m.id === replyToId) : undefined;
  const names = users.map((u) => u.name);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={MessageSquare}
        eyebrow="COMUNICACIÓN"
        title="Chat del equipo"
        description="Canales por campaña, mensajes directos y grupos de trabajo entre agentes y supervisión."
        actions={
          <>
            <Button icon={AtSign} onClick={() => setDmOpen(true)}>Nuevo mensaje directo</Button>
            {isManager && (
              <Button variant="primary" icon={MessageSquarePlus} onClick={() => setGroupOpen(true)}>
                Nuevo grupo
              </Button>
            )}
          </>
        }
      />

      {notice && <Notice tone="danger" onClose={() => setNotice(null)}>{notice}</Notice>}

      <div className="grid h-[calc(100vh-17rem)] min-h-[560px] grid-cols-1 overflow-hidden rounded-2xl border border-[#242E3B] bg-[#13151c] shadow-xl md:grid-cols-[300px_1fr]">
        {/* Lista de conversaciones */}
        <aside className="flex min-h-0 flex-col border-b border-[#242E3B] md:border-r md:border-b-0">
          <div className="border-b border-[#242E3B] p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-[#C5C6C7]/40" />
              <Input
                aria-label="Buscar conversación"
                placeholder="Buscar conversación…"
                value={listQuery}
                onChange={(e) => setListQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <nav className="min-h-0 flex-1 space-y-4 overflow-y-auto p-2" aria-label="Conversaciones">
            {sections.map((s) => (
              <div key={s.label}>
                <p className="px-2 pb-1 font-mono text-[10px] font-semibold tracking-wider text-[#C5C6C7]/40 uppercase">{s.label}</p>
                {s.items.length === 0 && <p className="px-2 py-1 text-[11px] text-[#C5C6C7]/30">Sin resultados</p>}
                {s.items.map((c) => {
                  const unread = countUnread(c.id, userId, messages, lastReadAt);
                  const selected = active?.id === c.id;
                  const last = [...messages].reverse().find((m) => m.conversationId === c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => selectConversation(c.id)}
                      aria-current={selected ? 'true' : undefined}
                      className={`flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors ${
                        selected ? 'bg-[#66FCF1]/10' : 'hover:bg-white/[0.03]'
                      }`}
                    >
                      {c.kind === 'direct' ? (
                        <Avatar name={titleOf(c)} size="sm" />
                      ) : (
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-[#242E3B] bg-[#0B0C10] ${selected ? 'text-[#66FCF1]' : 'text-[#C5C6C7]/60'}`}>
                          <ConvIcon conv={c} className="h-3.5 w-3.5" />
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className={`block truncate text-xs ${unread > 0 || selected ? 'font-bold text-white' : 'font-medium text-[#C5C6C7]'}`}>
                          {titleOf(c)}
                        </span>
                        <span className="block truncate text-[11px] text-[#C5C6C7]/45">
                          {last ? (last.deletedAt ? 'Mensaje eliminado' : `${last.authorId === userId ? 'Tú' : nameOf(last.authorId).split(' ')[0]}: ${last.text}`) : 'Sin mensajes'}
                        </span>
                      </span>
                      {unread > 0 && (
                        <span className="min-w-5 rounded-full bg-[#66FCF1] px-1.5 text-center font-mono text-[10px] font-bold text-[#0B0C10]" aria-label={`${unread} sin leer`}>
                          {unread}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
        </aside>

        {/* Conversación activa */}
        {!active ? (
          <EmptyState icon={MessageSquare} title="No tienes conversaciones" description="Inicia un mensaje directo con alguien del equipo." />
        ) : (
          <section className="flex min-h-0 flex-col" aria-label={`Conversación ${titleOf(active)}`}>
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#242E3B] px-5 py-3">
              <div className="min-w-0">
                <h2 className="flex items-center gap-2 text-sm font-bold text-white">
                  <ConvIcon conv={active} className="h-4 w-4 text-[#66FCF1]" />
                  <span className="truncate">{titleOf(active)}</span>
                  {active.announcementOnly && <Badge tone="warning">Solo anuncios</Badge>}
                </h2>
                <p className="truncate text-[11px] text-[#C5C6C7]/50">
                  {active.description ? `${active.description} · ` : ''}
                  {memberIds.length} miembros
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {isManager && active.kind === 'channel' && (
                  <Button
                    size="sm"
                    variant={active.announcementOnly ? 'secondary' : 'ghost'}
                    icon={Megaphone}
                    aria-pressed={active.announcementOnly}
                    onClick={() => fail(setAnnouncementOnly(userId, active.id, !active.announcementOnly))}
                  >
                    {active.announcementOnly ? 'Abrir a todos' : 'Solo anuncios'}
                  </Button>
                )}
                <Button size="sm" variant={showPinned ? 'secondary' : 'ghost'} icon={Pin} aria-pressed={showPinned} onClick={() => setShowPinned((v) => !v)}>
                  Fijados {pinned.length > 0 && `(${pinned.length})`}
                </Button>
                <Button
                  size="sm"
                  variant={showSearch ? 'secondary' : 'ghost'}
                  icon={Search}
                  aria-pressed={showSearch}
                  onClick={() => {
                    setShowSearch((v) => !v);
                    setMsgQuery('');
                  }}
                >
                  Buscar
                </Button>
              </div>
            </header>

            {showSearch && (
              <div className="flex items-center gap-2 border-b border-[#242E3B] px-5 py-2.5">
                <Input autoFocus aria-label="Buscar en la conversación" placeholder="Buscar en esta conversación…" value={msgQuery} onChange={(e) => setMsgQuery(e.target.value)} />
                {msgQuery.trim() && <span className="shrink-0 font-mono text-[11px] text-[#C5C6C7]/60">{shown.length} resultados</span>}
              </div>
            )}

            {showPinned && (
              <div className="max-h-48 space-y-2 overflow-y-auto border-b border-[#242E3B] bg-[#0B0C10]/50 px-5 py-3">
                {pinned.length === 0 ? (
                  <p className="text-xs text-[#C5C6C7]/50">No hay mensajes fijados{isManager ? '. Fija uno desde las acciones del mensaje.' : '.'}</p>
                ) : (
                  pinned.map((m) => (
                    <div key={m.id} className="flex items-start justify-between gap-3 rounded-xl border border-[#242E3B] bg-[#13151c] p-2.5">
                      <div className="min-w-0 text-xs">
                        <span className="font-semibold text-white">{nameOf(m.authorId)}</span>{' '}
                        <span className="text-[#C5C6C7]/50">· {dayLabel(m.createdAt)}</span>
                        <p className="mt-0.5 line-clamp-2 text-[#C5C6C7]">{m.text}</p>
                      </div>
                      {isManager && (
                        <button type="button" aria-label="Desfijar mensaje" onClick={() => fail(togglePin(userId, m.id))} className="rounded-md p-1 text-[#C5C6C7]/60 hover:bg-white/5 hover:text-white">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-2 py-4" aria-live="polite">
              {shown.length === 0 ? (
                <EmptyState
                  icon={showSearch && msgQuery.trim() ? Search : MessageSquare}
                  title={showSearch && msgQuery.trim() ? 'Sin coincidencias' : 'Aún no hay mensajes'}
                  description={showSearch && msgQuery.trim() ? 'Prueba con otras palabras.' : 'Escribe el primer mensaje de esta conversación.'}
                />
              ) : (
                shown.map((m, i) => {
                  const prev = shown[i - 1];
                  const newDay = !prev || dayKey(prev.createdAt) !== dayKey(m.createdAt);
                  const compact =
                    !newDay && !!prev && prev.authorId === m.authorId && !m.replyToId &&
                    new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() < 5 * 60_000;
                  const reply = m.replyToId ? messages.find((x) => x.id === m.replyToId) : undefined;
                  return (
                    <React.Fragment key={m.id}>
                      {newDay && (
                        <div className="my-3 flex items-center gap-3 px-3" role="separator">
                          <span className="h-px flex-1 bg-[#242E3B]" />
                          <span className="font-mono text-[10px] font-semibold tracking-wider text-[#C5C6C7]/50 uppercase">{dayLabel(m.createdAt)}</span>
                          <span className="h-px flex-1 bg-[#242E3B]" />
                        </div>
                      )}
                      <MessageRow
                        message={m}
                        authorName={nameOf(m.authorId)}
                        compact={compact}
                        replyTo={reply ? { authorName: nameOf(reply.authorId), text: reply.text, deleted: !!reply.deletedAt } : null}
                        names={names}
                        myName={myName}
                        myId={userId}
                        isOwn={m.authorId === userId}
                        canPin={isManager}
                        canReact
                        nameOf={nameOf}
                        onReply={() => setReplyToId(m.id)}
                        onEdit={(t) => fail(editMessage(userId, m.id, t))}
                        onDelete={() => setPendingDelete(m.id)}
                        onReact={(e) => fail(toggleReaction(userId, m.id, e))}
                        onPin={() => fail(togglePin(userId, m.id))}
                      />
                    </React.Fragment>
                  );
                })
              )}
            </div>

            <Composer
              canWrite={userCanPost}
              text={text}
              setText={setText}
              onSubmit={submit}
              placeholder={`Mensaje para ${active.kind === 'direct' ? titleOf(active) : `#${titleOf(active)}`}`}
              replyTarget={replyTarget ? { author: nameOf(replyTarget.authorId), text: replyTarget.text } : null}
              onCancelReply={() => setReplyToId(null)}
              mentionCandidates={mentionCandidates.map((id) => ({ id, name: nameOf(id) }))}
              onMention={insertMention}
              names={names}
              myName={myName}
            />
          </section>
        )}
      </div>

      <Modal
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        title="¿Eliminar mensaje?"
        description="El mensaje se mostrará como eliminado para todos los miembros."
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingDelete(null)}>Cancelar</Button>
            <Button
              variant="danger"
              onClick={() => {
                if (pendingDelete) fail(deleteMessage(userId, pendingDelete));
                setPendingDelete(null);
              }}
            >
              Eliminar
            </Button>
          </>
        }
      >
        <p className="text-sm text-[#C5C6C7]">Esta acción no se puede deshacer.</p>
      </Modal>

      <DirectModal
        open={dmOpen}
        onClose={() => setDmOpen(false)}
        users={users.filter((u) => u.active && u.id !== userId)}
        onPick={(id) => {
          const r = openDirect(userId, id);
          if (r.ok) {
            selectConversation(r.conversationId);
            setDmOpen(false);
          } else fail(r);
        }}
      />

      {isManager && (
        <GroupModal
          open={groupOpen}
          onClose={() => setGroupOpen(false)}
          users={users.filter((u) => u.active && u.id !== userId)}
          onCreate={(name, ids) => {
            const r = createGroup(userId, name, ids);
            if (!r.ok) return r.reason === 'invalid' ? 'Ponle un nombre (máx. 60 caracteres) y elige al menos 2 integrantes.' : ERRORS[r.reason];
            selectConversation(r.conversationId);
            setGroupOpen(false);
            return null;
          }}
        />
      )}
    </div>
  );
};

const Composer: React.FC<{
  canWrite: boolean;
  text: string;
  setText: (t: string) => void;
  onSubmit: () => void;
  placeholder: string;
  replyTarget: { author: string; text: string } | null;
  onCancelReply: () => void;
  mentionCandidates: Array<{ id: string; name: string }>;
  onMention: (id: string) => void;
  names: string[];
  myName: string;
}> = ({ canWrite, text, setText, onSubmit, placeholder, replyTarget, onCancelReply, mentionCandidates, onMention, names, myName }) => {
  if (!canWrite) {
    return (
      <div className="flex items-center gap-2 border-t border-[#242E3B] px-5 py-4 text-xs text-[#C5C6C7]/60">
        <Megaphone className="h-4 w-4 text-[#F59E0B]" /> Canal de solo anuncios: únicamente supervisión puede publicar aquí.
      </div>
    );
  }
  return (
    <div className="relative border-t border-[#242E3B] p-3">
      {mentionCandidates.length > 0 && (
        <div className="absolute bottom-full left-3 mb-1 w-64 rounded-xl border border-[#242E3B] bg-[#13151c] p-1 shadow-2xl" role="listbox" aria-label="Mencionar a">
          {mentionCandidates.map((c) => (
            <button key={c.id} type="button" role="option" aria-selected="false" onClick={() => onMention(c.id)} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-[#C5C6C7] hover:bg-white/5 hover:text-white">
              <Avatar name={c.name} size="sm" /> {c.name}
            </button>
          ))}
        </div>
      )}
      {replyTarget && (
        <div className="mb-2 flex items-center justify-between gap-2 rounded-lg border-l-2 border-[#66FCF1] bg-[#0B0C10] px-3 py-1.5 text-xs">
          <span className="min-w-0 truncate text-[#C5C6C7]/70">
            Respondiendo a <span className="font-semibold text-white">{replyTarget.author}</span>:{' '}
            <MessageText text={replyTarget.text} names={names} myName={myName} />
          </span>
          <button type="button" aria-label="Cancelar respuesta" onClick={onCancelReply} className="rounded p-0.5 text-[#C5C6C7]/60 hover:text-white">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <div className="flex items-end gap-2">
        <TextArea
          aria-label="Escribir mensaje"
          placeholder={placeholder}
          value={text}
          maxLength={MAX_MESSAGE_LENGTH}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              onSubmit();
            }
          }}
          rows={1}
          className="max-h-40 min-h-[42px] resize-none text-sm"
        />
        <Button variant="primary" icon={Send} aria-label="Enviar mensaje" onClick={onSubmit} disabled={!text.trim()} className="h-[42px]" />
      </div>
      <p className="mt-1.5 px-1 text-[10px] text-[#C5C6C7]/35">Enter para enviar · Shift + Enter para nueva línea · @ para mencionar</p>
    </div>
  );
};

const DirectModal: React.FC<{ open: boolean; onClose: () => void; users: ChatUser[]; onPick: (id: string) => void }> = ({ open, onClose, users, onPick }) => {
  const [q, setQ] = useState('');
  const list = users.filter((u) => matchesSearch(u.name, q));
  return (
    <Modal open={open} onClose={onClose} title="Nuevo mensaje directo" description="Elige con quién quieres conversar.">
      <div className="space-y-3">
        <Input autoFocus aria-label="Buscar persona" placeholder="Buscar por nombre…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="space-y-1">
          {list.length === 0 && <p className="py-4 text-center text-xs text-[#C5C6C7]/50">Nadie coincide con la búsqueda.</p>}
          {list.map((u) => (
            <button key={u.id} type="button" onClick={() => onPick(u.id)} className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-white/5">
              <Avatar name={u.name} size="sm" />
              <span className="flex-1 text-sm text-white">{u.name}</span>
              {u.isManager && <Badge tone="accent">Supervisión</Badge>}
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
};

const GroupModal: React.FC<{
  open: boolean;
  onClose: () => void;
  users: ChatUser[];
  /** Devuelve un mensaje de error o null si se creó */
  onCreate: (name: string, memberIds: string[]) => string | null;
}> = ({ open, onClose, users, onCreate }) => {
  const [name, setName] = useState('');
  const [ids, setIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const close = () => {
    setName('');
    setIds([]);
    setError(null);
    onClose();
  };
  const create = () => {
    const err = onCreate(name, ids);
    if (err) setError(err);
    else close();
  };
  return (
    <Modal
      open={open}
      onClose={close}
      title="Nuevo grupo"
      description="Crea un chat con integrantes elegidos (por ejemplo, un equipo de cierre o una célula de QA)."
      footer={
        <>
          <Button variant="ghost" onClick={close}>Cancelar</Button>
          <Button variant="primary" icon={MessageSquarePlus} onClick={create}>Crear grupo</Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Notice tone="danger">{error}</Notice>}
        <Field label="Nombre del grupo">
          <Input value={name} maxLength={60} onChange={(e) => setName(e.target.value)} placeholder="Ej. Calibración QA semanal" />
        </Field>
        <fieldset className="space-y-1">
          <legend className="mb-1.5 text-xs font-medium text-[#C5C6C7]">Integrantes ({ids.length})</legend>
          {users.map((u) => (
            <label key={u.id} className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-white/5">
              <input
                type="checkbox"
                checked={ids.includes(u.id)}
                onChange={(e) => setIds((cur) => (e.target.checked ? [...cur, u.id] : cur.filter((x) => x !== u.id)))}
                className="h-4 w-4 accent-[#66FCF1]"
              />
              <Avatar name={u.name} size="sm" />
              <span className="flex-1 text-sm text-white">{u.name}</span>
              {u.isManager && <Badge tone="accent">Supervisión</Badge>}
            </label>
          ))}
        </fieldset>
      </div>
    </Modal>
  );
};

