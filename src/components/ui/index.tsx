import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/*
 * Componentes visuales comunes de Vooxline. Las páginas nuevas los usan para verse igual.
 * Paleta: fondo #0B0C10, tarjetas #13151c, bordes #242E3B, acento #66FCF1.
 */

type Tone = 'accent' | 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const TONE_CLASSES: Record<Tone, string> = {
  accent: 'bg-[#66FCF1]/10 text-[#66FCF1] border-[#66FCF1]/30',
  success: 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30',
  warning: 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30',
  danger: 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30',
  info: 'bg-[#818CF8]/10 text-[#A5B4FC] border-[#818CF8]/30',
  neutral: 'bg-[#1F2833]/60 text-[#C5C6C7] border-[#242E3B]',
};

export const PageHeader: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  eyebrow: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
}> = ({ icon: Icon, eyebrow, title, description, actions }) => (
  <div className="relative overflow-hidden rounded-2xl border border-[#242E3B] bg-[#13151c] p-6 shadow-xl">
    <div className="pointer-events-none absolute inset-y-0 right-0 w-96 bg-gradient-to-l from-[#66FCF1]/[0.07] to-transparent" />
    <div className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-[#66FCF1]/10 blur-3xl" />
    <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="space-y-1.5">
        <span className="inline-flex rounded-full border border-[#66FCF1]/30 bg-[#66FCF1]/10 px-2.5 py-0.5 font-mono text-[11px] font-semibold tracking-wider text-[#66FCF1]">
          {eyebrow}
        </span>
        <h1 className="flex items-center gap-2.5 font-display text-2xl font-bold tracking-tight text-white lg:text-3xl">
          <Icon className="h-7 w-7 text-[#66FCF1]" />
          <span>{title}</span>
        </h1>
        <p className="max-w-2xl text-sm text-[#C5C6C7]/80">{description}</p>
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
  <section className={`rounded-2xl border border-[#242E3B] bg-[#13151c] shadow-xl ${className}`}>
    {(title || actions) && (
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#242E3B] px-5 py-4">
        <div>
          {title && <h2 className="text-base font-bold text-white">{title}</h2>}
          {subtitle && <p className="mt-0.5 text-xs text-[#C5C6C7]/60">{subtitle}</p>}
        </div>
        {actions}
      </header>
    )}
    <div className={bodyClassName}>{children}</div>
  </section>
);

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
const BUTTON_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-[#66FCF1] text-[#0B0C10] font-bold hover:bg-[#52e0d6] shadow-[0_0_16px_rgba(102,252,241,0.25)]',
  secondary: 'bg-[#1F2833] text-white border border-[#242E3B] hover:border-[#66FCF1]/40 hover:bg-[#253240]',
  ghost: 'text-[#C5C6C7] hover:text-white hover:bg-white/5',
  danger: 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30 hover:bg-[#EF4444] hover:text-white',
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
      size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-xs'
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
    className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-2 py-0.5 font-mono text-[11px] font-semibold ${TONE_CLASSES[tone]} ${className}`}
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
  <div className="rounded-xl border border-[#242E3B] bg-[#13151c] p-4 transition-colors hover:border-[#66FCF1]/25">
    <div className="flex items-center justify-between">
      <span className="font-mono text-xs text-[#C5C6C7]/60">{label}</span>
      {Icon && (
        <span className={`rounded-lg border p-1.5 ${TONE_CLASSES[tone]}`}>
          <Icon className="h-3.5 w-3.5" />
        </span>
      )}
    </div>
    <div className="mt-2 font-mono text-2xl font-bold text-white">{value}</div>
    {hint && <div className="mt-0.5 text-[11px] text-[#C5C6C7]/50">{hint}</div>}
  </div>
);

export const Avatar: React.FC<{ name: string; size?: 'sm' | 'md' | 'lg' }> = ({ name, size = 'md' }) => {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
  const dims = size === 'sm' ? 'h-7 w-7 text-[10px]' : size === 'lg' ? 'h-12 w-12 text-sm' : 'h-9 w-9 text-xs';
  return (
    <div
      className={`${dims} flex shrink-0 items-center justify-center rounded-xl border border-[#66FCF1]/25 bg-gradient-to-br from-[#66FCF1]/20 to-[#1F2833] font-mono font-bold text-[#66FCF1]`}
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
    <div className="mb-1 rounded-2xl border border-[#242E3B] bg-[#0B0C10] p-3 text-[#66FCF1]/70">
      <Icon className="h-6 w-6" />
    </div>
    <p className="text-sm font-semibold text-white">{title}</p>
    {description && <p className="max-w-sm text-xs text-[#C5C6C7]/60">{description}</p>}
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
        className={`flex max-h-[90vh] w-full flex-col rounded-2xl border border-[#242E3B] bg-[#13151c] shadow-2xl ${
          size === 'lg' ? 'max-w-3xl' : 'max-w-lg'
        }`}
      >
        <header className="flex items-start justify-between gap-4 border-b border-[#242E3B] px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-white">{title}</h3>
            {description && <p className="mt-0.5 text-xs text-[#C5C6C7]/70">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-lg p-1.5 text-[#C5C6C7] hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <footer className="flex justify-end gap-2.5 border-t border-[#242E3B] px-6 py-4">{footer}</footer>}
      </div>
    </div>
  );
};

const INPUT_CLASSES =
  'w-full rounded-xl border border-[#242E3B] bg-[#0B0C10] px-3 py-2 text-xs text-white placeholder:text-[#C5C6C7]/40 focus:border-[#66FCF1] focus:outline-none';

export const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
  <label className="block space-y-1.5">
    <span className="text-xs font-medium text-[#C5C6C7]">{label}</span>
    {children}
    {hint && <span className="block text-[10px] text-[#C5C6C7]/50">{hint}</span>}
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
    <div role="tablist" className="flex items-center gap-1 overflow-x-auto rounded-xl border border-[#242E3B] bg-[#0B0C10] p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              active ? 'bg-[#66FCF1] text-[#0B0C10] shadow-sm' : 'text-[#C5C6C7]/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            <span>{o.label}</span>
            {o.count !== undefined && (
              <span
                className={`rounded px-1.5 font-mono text-[11px] ${
                  active ? 'bg-[#0B0C10]/20 text-[#0B0C10]' : 'bg-[#1F2833] text-[#C5C6C7]'
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
  <div role="status" className={`flex items-center justify-between gap-3 rounded-xl border p-3.5 text-sm ${TONE_CLASSES[tone]}`}>
    <span className="font-medium">{children}</span>
    {onClose && (
      <button type="button" onClick={onClose} className="font-mono text-xs uppercase tracking-wider opacity-70 hover:opacity-100">
        Cerrar
      </button>
    )}
  </div>
);
