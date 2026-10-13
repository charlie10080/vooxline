import React, { useState } from 'react';
import { Award, CalendarHeart, Flame, Hand, Heart, MessageCircle, Send, Sparkles, Trophy } from 'lucide-react';
import type { BadgeType, Milestone, ReactionKind, Recognition } from '@/types/celebrations';
import type { FeedItem } from '@/lib/celebrations';
import { BADGES } from '@/lib/celebrations';
import { useCelebrationsStore } from '@/store/useCelebrationsStore';
import { Avatar, Badge, Card, EmptyState, Input } from '@/components/ui';
import { formatDay, timeAgo } from './shared';
import type { Report } from './shared';

const REACTIONS: Array<{ kind: ReactionKind; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { kind: 'applause', label: 'Aplaudir', icon: Hand },
  { kind: 'heart', label: 'Me encanta', icon: Heart },
  { kind: 'fire', label: 'Increíble', icon: Flame },
];

const BADGE_TONE: Record<BadgeType, 'accent' | 'success' | 'warning' | 'info'> = {
  best_service: 'accent',
  teamwork: 'info',
  punctuality: 'warning',
  first_call_resolution: 'success',
  qa_quality: 'accent',
  helping_peers: 'info',
};

const MilestoneCard: React.FC<{ m: Milestone; nameOf: (id: string) => string }> = ({ m, nameOf }) => (
  <div className="flex items-center gap-4 rounded-2xl border border-vx-warning/25 bg-gradient-to-r from-vx-warning/[0.07] to-vx-surface p-4">
    <div className="rounded-xl border border-vx-warning/30 bg-vx-warning/10 p-2.5 text-vx-warning">
      {m.kind === 'anniversary' ? <CalendarHeart className="h-5 w-5" /> : <Trophy className="h-5 w-5" />}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-sm text-vx-text">
        <span className="font-bold">{nameOf(m.agentId)}</span>{' '}
        {m.kind === 'anniversary'
          ? `cumple ${m.years} ${m.years === 1 ? 'año' : 'años'} en Vooxline`
          : `es QA destacado con ${m.qaScore} puntos de calidad`}
      </p>
      <p className="mt-0.5 tabular-nums text-xs text-vx-text-2/50">Hito automático · {formatDay(m.date)}</p>
    </div>
    <Badge tone="warning">
      <Sparkles className="h-3 w-3" /> Hito
    </Badge>
  </div>
);

const RecognitionCard: React.FC<{
  r: Recognition;
  currentUserId: string;
  nameOf: (id: string) => string;
  report: Report;
}> = ({ r, currentUserId, nameOf, report }) => {
  const toggleReaction = useCelebrationsStore((s) => s.toggleReaction);
  const addComment = useCelebrationsStore((s) => s.addComment);
  const [draft, setDraft] = useState('');
  const [showComments, setShowComments] = useState(r.comments.length > 0);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (report(addComment(r.id, currentUserId, draft), '')) setDraft('');
  };

  return (
    <article className="rounded-2xl border border-vx-border bg-vx-surface p-5 transition-colors hover:border-vx-accent/20">
      <header className="flex flex-wrap items-start gap-3">
        <Avatar name={nameOf(r.toId)} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-vx-text-2">
            <span className="font-bold text-vx-text">{nameOf(r.fromId)}</span> reconoció a{' '}
            <span className="font-bold text-vx-text">{nameOf(r.toId)}</span>
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <Badge tone={BADGE_TONE[r.badge]}>
              <Award className="h-3 w-3" /> {BADGES[r.badge]}
            </Badge>
            <span className="tabular-nums text-xs text-vx-text-2/50">{timeAgo(r.createdAt)}</span>
          </div>
        </div>
        <span className="rounded-lg border border-vx-accent/30 bg-vx-accent/10 px-2.5 py-1 tabular-nums text-[13px] font-bold text-vx-accent">
          +{r.points} pts
        </span>
      </header>

      <p className="mt-4 rounded-xl border border-vx-border bg-vx-bg p-3.5 text-sm leading-relaxed text-vx-text-2">“{r.message}”</p>

      <footer className="mt-3 flex flex-wrap items-center gap-1.5">
        {REACTIONS.map(({ kind, label, icon: Icon }) => {
          const ids = r.reactions[kind];
          const mine = ids.includes(currentUserId);
          return (
            <button
              key={kind}
              type="button"
              aria-pressed={mine}
              aria-label={`${label} (${ids.length})`}
              title={ids.map(nameOf).join(', ') || label}
              onClick={() => report(toggleReaction(r.id, currentUserId, kind), '')}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 tabular-nums text-[13px] transition-colors ${
                mine
                  ? 'border-vx-accent/40 bg-vx-accent/10 text-vx-accent'
                  : 'border-vx-border text-vx-text-2/70 hover:border-vx-accent/30 hover:text-vx-text'
              }`}
            >
              <Icon className="h-3.5 w-3.5" /> {ids.length}
            </button>
          );
        })}
        <button
          type="button"
          aria-expanded={showComments}
          onClick={() => setShowComments((v) => !v)}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[13px] text-vx-text-2/70 hover:bg-white/5 hover:text-vx-text"
        >
          <MessageCircle className="h-3.5 w-3.5" /> {r.comments.length} {r.comments.length === 1 ? 'comentario' : 'comentarios'}
        </button>
      </footer>

      {showComments && (
        <div className="mt-3 space-y-2.5 border-t border-vx-border pt-3">
          {r.comments.map((c) => (
            <div key={c.id} className="flex gap-2.5">
              <Avatar name={nameOf(c.authorId)} size="sm" />
              <div className="min-w-0 flex-1 rounded-xl bg-vx-bg px-3 py-2">
                <p className="text-[13px]">
                  <span className="font-semibold text-vx-text">{nameOf(c.authorId)}</span>{' '}
                  <span className="tabular-nums text-xs text-vx-text-2/40">{timeAgo(c.createdAt)}</span>
                </p>
                <p className="mt-0.5 text-[13px] text-vx-text-2">{c.text}</p>
              </div>
            </div>
          ))}
          <form onSubmit={submit} className="flex items-center gap-2">
            <Input
              aria-label="Escribe un comentario"
              placeholder="Escribe un comentario…"
              value={draft}
              maxLength={200}
              onChange={(e) => setDraft(e.target.value)}
            />
            <button
              type="submit"
              aria-label="Publicar comentario"
              disabled={!draft.trim()}
              className="rounded-xl bg-vx-accent p-2.5 text-vx-bg hover:bg-vx-accent disabled:opacity-40"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}
    </article>
  );
};

export const RecognitionFeed: React.FC<{
  feed: FeedItem[];
  currentUserId: string;
  nameOf: (id: string) => string;
  report: Report;
}> = ({ feed, currentUserId, nameOf, report }) => {
  if (feed.length === 0) {
    return (
      <Card>
        <EmptyState icon={Award} title="Aún no hay reconocimientos" description="Sé el primero en reconocer el buen trabajo de un compañero." />
      </Card>
    );
  }
  return (
    <div className="space-y-4">
      {feed.map((f) =>
        f.type === 'milestone' ? (
          <MilestoneCard key={f.item.id} m={f.item} nameOf={nameOf} />
        ) : (
          <RecognitionCard key={f.item.id} r={f.item} currentUserId={currentUserId} nameOf={nameOf} report={report} />
        ),
      )}
    </div>
  );
};
