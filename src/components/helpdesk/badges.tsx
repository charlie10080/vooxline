import React from 'react';
import type { Ticket, TicketPriority, TicketStatus } from '@/types/helpdesk';
import { Badge } from '@/components/ui';
import { PRIORITY_LABELS, STATUS_LABELS, slaRemainingLabel, slaState } from '@/lib/helpdesk';

type Tone = 'accent' | 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const STATUS_TONES: Record<TicketStatus, Tone> = {
  open: 'accent',
  in_progress: 'info',
  waiting_user: 'warning',
  resolved: 'success',
  closed: 'neutral',
};

const PRIORITY_TONES: Record<TicketPriority, Tone> = {
  low: 'neutral',
  medium: 'info',
  high: 'warning',
  critical: 'danger',
};

export const StatusBadge: React.FC<{ status: TicketStatus }> = ({ status }) => (
  <Badge tone={STATUS_TONES[status]}>{STATUS_LABELS[status]}</Badge>
);

export const PriorityBadge: React.FC<{ priority: TicketPriority }> = ({ priority }) => (
  <Badge tone={PRIORITY_TONES[priority]}>{PRIORITY_LABELS[priority]}</Badge>
);

export const SlaBadge: React.FC<{ ticket: Ticket; now: number }> = ({ ticket, now }) => {
  switch (slaState(ticket, now)) {
    case 'overdue':
      return <Badge tone="danger">SLA {slaRemainingLabel(ticket, now)}</Badge>;
    case 'due_soon':
      return <Badge tone="warning">Por vencer · {slaRemainingLabel(ticket, now)}</Badge>;
    case 'on_track':
      return <Badge>SLA {slaRemainingLabel(ticket, now)}</Badge>;
    case 'met':
      return <Badge tone="success">SLA cumplido</Badge>;
    case 'missed':
      return <Badge tone="danger">SLA incumplido</Badge>;
  }
};
