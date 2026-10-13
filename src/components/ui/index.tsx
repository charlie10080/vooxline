import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/*
 * Componentes visuales comunes de Vooxline. Las páginas nuevas los usan para verse igual.
 * Paleta: tokens vx-* de index.css (Soft Dark). Superficies por tono, no por borde; acento sin glow.
 */

type Tone = 'accent' | 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const TONE_CLASSES: Record<Tone, string> = {
  accent: 'bg-vx-accent/10 text-vx-accent border-vx-accent/30',
  success: 'bg-vx-success/10 text-vx-success border-vx-success/30',
  warning: 'bg-vx-warning/10 text-vx-warning border-vx-warning/30',
  danger: 'bg-vx-danger/10 text-vx-danger border-vx-danger/30',
  info: 'bg-vx-info/10 text-vx-info border-vx-info/30',
  neutral: 'bg-vx-raised/60 text-vx-text-2 border-vx-border',
};

export const PageHeader: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  eyebrow: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
}> = ({ icon: Icon, eyebrow, title, description, actions }) => (
  <div className="relative overflow-hidden rounded-2xl bg-vx-surface p-6">
    <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="space-y-1.5">
        <span className="inline-flex rounded-full bg-vx-accent/10 px-2.5 py-0.5 text-xs font-semibold text-vx-accent">
          {eyebrow}
        </span>
        <h1 className="flex items-center gap-2.5 font-display text-2xl font-bold tracking-tight text-vx-text lg:text-3xl">
          <Icon className="h-7 w-7 text-vx-accent" />
          <span>{title}</span>
        </h1>
        <p className="max-w-2xl text-sm text-vx-text-2/80">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  </div>
);

export const Card: React.FC<{
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}> = ({ title, subtitle, actions, className = '', bodyClassName = 'p-5', children }) => (
  <section className={`rounded-2xl bg-vx-surface ${className}`}>
    {(title || actions) && (
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-vx-border px-5 py-4">
        <div>
          {title && <h2 className="text-base font-bold text-vx-text">{title}</h2>}
          {subtitle && <p className="mt-0.5 text-[13px] text-vx-text-2/60">{subtitle}</p>}
        </div>
        {actions}
      </header>
    )}
    <div className={bodyClassName}>{children}</div>
  </section>
);

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
const BUTTON_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-vx-accent text-vx-bg font-bold hover:bg-vx-accent/90',
  secondary: 'bg-vx-raised text-vx-text hover:bg-vx-raised/70',
  ghost: 'text-vx-text-2 hover:text-vx-text hover:bg-white/5',
  danger: 'bg-vx-danger/10 text-vx-danger hover:bg-vx-danger hover:text-vx-bg',
};

export const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    icon?: React.ComponentType<{ className?: string }>;
    size?: 'sm' | 'md';
  }
> = ({ variant = 'secondary', icon: Icon, size = 'md', className = '', children, type = 'button', ...rest }) => (
  <button
    type={type}
    className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
      size === 'sm' ? 'px-3 py-1.5 text-[13px]' : 'px-4 py-2.5 text-[13px]'
    } ${BUTTON_CLASSES[variant]} ${className}`}
    {...rest}
  >
    {Icon && <Icon className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />}
    {children}
  </button>
);

export const Badge: React.FC<{ tone?: Tone; children: React.ReactNode; className?: string }> = ({
  tone = 'neutral',
  children,
  className = '',
}) => (
  <span
    className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-0.5 tabular-nums text-xs font-semibold ${TONE_CLASSES[tone]} ${className}`}
  >
    {children}
  </span>
);

export const StatCard: React.FC<{
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: Tone;
  icon?: React.ComponentType<{ className?: string }>;
}> = ({ label, value, hint, tone = 'neutral', icon: Icon }) => (
  <div className="rounded-xl bg-vx-surface p-4 transition-colors hover:bg-vx-raised">
    <div className="flex items-center justify-between">
      <span className="tabular-nums text-[13px] text-vx-text-2/60">{label}</span>
      {Icon && (
        <span className={`rounded-lg p-1.5 ${TONE_CLASSES[tone]}`}>
          <Icon className="h-3.5 w-3.5" />
        </span>
      )}
    </div>
    <div className="mt-2 tabular-nums text-2xl font-bold text-vx-text">{value}</div>
    {hint && <div className="mt-0.5 text-xs text-vx-text-2/50">{hint}</div>}
  </div>
);

export const Avatar: React.FC<{ name: string; size?: 'sm' | 'md' | 'lg' }> = ({ name, size = 'md' }) => {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
  const dims = size === 'sm' ? 'h-7 w-7 text-xs' : size === 'lg' ? 'h-12 w-12 text-sm' : 'h-9 w-9 text-[13px]';
  return (
    <div
      className={`${dims} flex shrink-0 items-center justify-center rounded-xl bg-vx-accent/15 tabular-nums font-bold text-vx-accent`}
      aria-hidden="true"
    >
      {initials || '?'}
    </div>
  );
};

export const EmptyState: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}> = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
    <div className="mb-1 rounded-2xl border border-vx-border bg-vx-bg p-3 text-vx-accent/70">
      <Icon className="h-6 w-6" />
    </div>
    <p className="text-sm font-semibold text-vx-text">{title}</p>
    {description && <p className="max-w-sm text-[13px] text-vx-text-2/60">{description}</p>}
    {action && <div className="mt-2">{action}</div>}
  </div>
);

export const Modal: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  footer?: React.ReactNode;
  size?: 'md' | 'lg';
  children: React.ReactNode;
}> = ({ open, onClose, title, description, footer, size = 'md', children }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`flex max-h-[90vh] w-full flex-col rounded-2xl bg-vx-surface shadow-2xl ${
          size === 'lg' ? 'max-w-3xl' : 'max-w-lg'
        }`}
      >
        <header className="flex items-start justify-between gap-4 border-b border-vx-border px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-vx-text">{title}</h3>
            {description && <p className="mt-0.5 text-[13px] text-vx-text-2/70">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-lg p-1.5 text-vx-text-2 hover:bg-white/5 hover:text-vx-text"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <footer className="flex justify-end gap-2.5 border-t border-vx-border px-6 py-4">{footer}</footer>}
      </div>
    </div>
  );
};

const INPUT_CLASSES =
  'w-full rounded-xl border border-vx-border bg-vx-bg px-3 py-2 text-[13px] text-vx-text placeholder:text-vx-text-2/40 focus:border-vx-accent focus:outline-none';

export const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
  <label className="block space-y-1.5">
    <span className="text-[13px] font-medium text-vx-text-2">{label}</span>
    {children}
    {hint && <span className="block text-xs text-vx-text-2/50">{hint}</span>}
  </label>
);

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = '', ...rest }) => (
  <input className={`${INPUT_CLASSES} ${className}`} {...rest} />
);

export const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ className = '', ...rest }) => (
  <textarea className={`${INPUT_CLASSES} min-h-[88px] resize-y ${className}`} {...rest} />
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ className = '', children, ...rest }) => (
  <select className={`${INPUT_CLASSES} ${className}`} {...rest}>
    {children}
  </select>
);

export function Tabs<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: string; count?: number }>;
}): React.ReactElement {
  return (
    <div role="tablist" className="flex items-center gap-1 overflow-x-auto rounded-xl border border-vx-border bg-vx-bg p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-1.5 text-[13px] font-semibold transition-all ${
              active ? 'bg-vx-accent text-vx-bg shadow-sm' : 'text-vx-text-2/70 hover:bg-white/5 hover:text-vx-text'
            }`}
          >
            <span>{o.label}</span>
            {o.count !== undefined && (
              <span
                className={`rounded px-1.5 tabular-nums text-xs ${
                  active ? 'bg-vx-bg/20 text-vx-bg' : 'bg-vx-raised text-vx-text-2'
                }`}
              >
                {o.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Mensaje de resultado de una acción (éxito, aviso o error) */
export const Notice: React.FC<{
  tone: 'success' | 'warning' | 'danger' | 'info';
  children: React.ReactNode;
  onClose?: () => void;
}> = ({ tone, children, onClose }) => (
  <div role="status" className={`flex items-center justify-between gap-3 rounded-xl p-3.5 text-sm ${TONE_CLASSES[tone]}`}>
    <span className="font-medium">{children}</span>
    {onClose && (
      <button type="button" onClick={onClose} className="tabular-nums text-[13px] opacity-70 hover:opacity-100">
        Cerrar
      </button>
    )}
  </div>
);
