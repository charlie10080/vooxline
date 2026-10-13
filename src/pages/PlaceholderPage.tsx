import React from 'react';
import { NavLink } from 'react-router-dom';
import { Construction, ArrowRight, ShieldCheck } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
  section: string;
  description?: string;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  title,
  section,
  description = 'Módulo en desarrollo dentro del plan de despliegue de Vooxline. Visita el módulo operativo activo de Time Clock para interactuar con el motor en tiempo real.',
}) => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="bg-vx-surface border border-vx-border rounded-2xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-vx-accent/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col items-start gap-4">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-vx-raised border border-vx-border text-[13px] tabular-nums text-vx-accent">
            <span className="w-2 h-2 rounded-full bg-vx-accent animate-pulse" />
            <span>{section}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-vx-accent/10 border border-vx-accent/20 flex items-center justify-center text-vx-accent">
              <Construction className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-vx-text tracking-tight">{title}</h1>
              <p className="text-sm text-vx-text-2/70 tabular-nums mt-0.5">Estado: En construcción</p>
            </div>
          </div>

          <p className="text-vx-text-2 text-base leading-relaxed max-w-2xl mt-2">
            {description}
          </p>

          <div className="pt-6 mt-4 border-t border-vx-border w-full flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-[13px] text-vx-text-2/60 tabular-nums">
              <ShieldCheck className="w-4 h-4 text-vx-accent" />
              <span>Arquitectura base y Store de Zustand sincronizados</span>
            </div>

            <NavLink
              to="/time-clock"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-vx-accent text-vx-bg font-semibold text-sm hover:bg-vx-accent transition-all"
            >
              <span>Ir a Time Clock & Aprobación</span>
              <ArrowRight className="w-4 h-4" />
            </NavLink>
          </div>
        </div>
      </div>
    </div>
  );
};
