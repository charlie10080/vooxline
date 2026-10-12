import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { VooxlineLogo } from '@/components/common/VooxlineLogo';
import { useDirectoryStore } from '@/store/useDirectoryStore';
import { homePathFor, useSessionStore } from '@/store/useSessionStore';
import type { UserRole } from '@/types/directory';

/** Accesos demo: un usuario semilla por rol */
const DEMO_USERS: { id: string; role: UserRole; label: string; icon: string }[] = [
  { id: 'u-admin', role: 'admin', label: 'Admin', icon: 'shield' },
  { id: 'a-carlos', role: 'supervisor', label: 'Supervisor', icon: 'groups' },
  { id: 'a-maria', role: 'agent', label: 'Agente', icon: 'headphones' },
  { id: 'c-cliente', role: 'client', label: 'Cliente', icon: 'bar_chart' },
];

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [authSuccess, setAuthSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const profiles = useDirectoryStore((s) => s.profiles);
  const login = useSessionStore((s) => s.login);

  const enterAs = (id: string, role: UserRole) => {
    login(id);
    navigate(homePathFor(role));
  };

  // shortcut: la contraseña no se valida (no hay backend); con API se reemplaza por autenticación real
  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    const input = e.currentTarget.elements.namedItem('agent-identity') as HTMLInputElement;
    const typed = input.value.trim().toLowerCase();
    const profile = profiles.find((p) => p.email.toLowerCase() === typed || p.agentId === typed);
    if (!profile) return setError('No encontramos ese correo o ID.');
    if (!profile.active) return setError('Este usuario está desactivado. Pide acceso a tu administrador.');
    setError('');

    setIsSubmitting(true);
    setAuthSuccess(false);

    // Simulación de verificación durante 1.2s y redirección automática al Centro de Mando
    setTimeout(() => {
      setAuthSuccess(true);

      setTimeout(() => {
        setIsSubmitting(false);
        setAuthSuccess(false);
        enterAs(profile.agentId, profile.role);
      }, 700);
    }, 1200);
  };

  return (
    <main className="relative z-10 w-full min-h-screen flex items-center justify-center p-gutter bg-surface font-body-md text-on-surface antialiased overflow-x-hidden selection:bg-primary-container selection:text-on-primary-container">
      {/* Background ambient radial gradients */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_50%_40%,rgba(0,230,118,0.08)_0%,rgba(18,19,23,0)_70%)]" />
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,rgba(68,226,215,0.04)_0%,transparent_60%)]" />

      <div className="flex flex-col w-full items-center justify-center relative min-h-screen py-space-xl px-space-md select-none">
        {/* Dynamic Cybernetic Glow Background Emitters */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[580px] h-[580px] bg-primary/10 rounded-full blur-[140px] pointer-events-none -z-10" />
        <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[480px] h-[480px] bg-secondary/10 rounded-full blur-[120px] pointer-events-none -z-10" />

        {/* Decorative Top Status HUD Marker */}
        <div className="flex items-center gap-space-sm mb-space-lg opacity-85">
          <span className="inline-flex relative w-2 h-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-container opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-container" />
          </span>
          <span className="font-label-code text-label-code tracking-widest uppercase text-on-surface-variant">
            Cluster: auth-node-09.latam.vooxline.net [LIVE]
          </span>
        </div>

        {/* Central Glassmorphic Card Container */}
        <div className="relative w-full max-w-md bg-surface-container-low/75 backdrop-blur-2xl rounded-xl p-space-lg md:p-space-xl shadow-2xl shadow-surface-container-lowest/90 overflow-hidden">
          {/* Ambient Internal Edge Lighting Layer */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/[0.06] via-transparent to-primary/[0.03]" />

          {/* Header & Brand Mark */}
          <div className="relative flex flex-col items-center text-center">
            {/* Official Vooxline Brand Logo */}
            <VooxlineLogo size="lg" className="mb-space-md" />

            {/* Verified Security Protocol Badge */}
            <div className="inline-flex items-center gap-space-xs px-space-sm py-space-xs rounded-full bg-surface-container-high/70 text-on-surface-variant mb-space-md shadow-sm">
              <span
                className="material-symbols-outlined text-secondary text-[15px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                verified_user
              </span>
              <span className="font-label-tag text-label-tag uppercase tracking-wider text-secondary">
                ACCESO SEGURO • B2B &amp; TALENTO
              </span>
            </div>

            {/* Card Title & Subtitle */}
            <h1 className="font-headline-md text-headline-md font-semibold text-white tracking-tight">
              Acceso Seguro
            </h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-space-xs max-w-xs">
              Ingresa tus credenciales corporativas para sincronizar tu consola operativa
            </p>
          </div>

          {/* Interactive Authentication Form */}
          <form className="relative mt-space-lg flex flex-col gap-space-md" onSubmit={handleLogin}>
            {/* Input 1: Identity / Agent ID */}
            <div className="flex flex-col gap-1.5 text-left">
              <label
                className="font-body-sm text-body-sm font-medium text-on-surface flex items-center justify-between"
                htmlFor="agent-identity"
              >
                <span>Correo Corporativo o ID</span>
                <span className="font-label-code text-label-code text-outline text-[11px]">
                  SIP / SSO
                </span>
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-space-md flex items-center pointer-events-none text-on-surface-variant group-focus-within:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[20px]">badge</span>
                </div>
                <input
                  autoComplete="username"
                  className="w-full bg-surface-container-lowest/80 text-on-surface placeholder:text-on-surface-variant/50 font-body-md text-body-md rounded-lg py-3.5 pl-11 pr-4 outline-none transition-all duration-200 focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px_rgba(0,230,118,0.35)]"
                  id="agent-identity"
                  placeholder="agente.084@vooxline.com"
                  required
                  type="text"
                />
              </div>
            </div>

            {/* Input 2: Security Token / Password */}
            <div className="flex flex-col gap-1.5 text-left">
              <label
                className="font-body-sm text-body-sm font-medium text-on-surface flex items-center justify-between"
                htmlFor="agent-secret"
              >
                <span>Contraseña de Seguridad</span>
                <a
                  className="font-label-code text-label-code text-secondary hover:underline transition-all"
                  href="#"
                >
                  Token FIDO2?
                </a>
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-space-md flex items-center pointer-events-none text-on-surface-variant group-focus-within:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[20px]">lock_open</span>
                </div>
                <input
                  autoComplete="current-password"
                  className="w-full bg-surface-container-lowest/80 text-on-surface placeholder:text-on-surface-variant/50 font-body-md text-body-md rounded-lg py-3.5 pl-11 pr-12 outline-none transition-all duration-200 focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px_rgba(0,230,118,0.35)]"
                  id="agent-secret"
                  placeholder="••••••••••••••••"
                  required
                  type={showPassword ? 'text' : 'password'}
                />
                <button
                  aria-label="Alternar visibilidad de contraseña"
                  className="absolute inset-y-0 right-0 pr-space-md flex items-center text-on-surface-variant hover:text-white transition-colors cursor-pointer"
                  id="toggle-visibility-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]" id="eye-icon">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Controls Row: Persist & Recovery */}
            <div className="flex items-center justify-between pt-1 text-on-surface-variant">
              <label className="flex items-center gap-space-sm cursor-pointer select-none group">
                <input
                  className="appearance-none w-[18px] h-[18px] rounded bg-surface-container-highest cursor-pointer checked:bg-primary-container checked:shadow-[0_0_10px_rgba(0,230,118,0.5)] transition-all flex items-center justify-center relative after:content-['✓'] after:hidden checked:after:block after:text-on-primary-container after:text-xs after:font-bold after:absolute after:top-[-2px] after:left-[3px]"
                  id="persist-session"
                  type="checkbox"
                />
                <span className="font-body-sm text-body-sm group-hover:text-on-surface transition-colors">
                  Recordar sesión
                </span>
              </label>
              <a
                className="font-body-sm text-body-sm text-secondary hover:text-primary transition-colors hover:underline"
                href="#"
              >
                ¿Olvidaste tu acceso?
              </a>
            </div>

            {error && (
              <p role="alert" className="font-body-sm text-body-sm text-error">
                {error}
              </p>
            )}

            {/* Master Action Button */}
            <button
              className={`mt-space-sm w-full py-3.5 px-space-lg rounded-full font-headline-sm text-headline-sm font-semibold transition-all duration-200 flex items-center justify-center gap-space-sm cursor-pointer ${
                isSubmitting
                  ? authSuccess
                    ? 'bg-secondary text-on-secondary shadow-[0_0_24px_rgba(68,226,215,0.6)]'
                    : 'opacity-90 pointer-events-none bg-primary-container text-on-primary-container shadow-[0_0_24px_-2px_rgba(0,230,118,0.45)]'
                  : 'text-on-primary-container bg-primary-container shadow-[0_0_24px_-2px_rgba(0,230,118,0.45)] hover:shadow-[0_0_32px_rgba(0,230,118,0.7)] hover:brightness-105 active:scale-[0.98]'
              }`}
              disabled={isSubmitting}
              id="submit-auth-btn"
              type="submit"
            >
              {isSubmitting ? (
                authSuccess ? (
                  <>
                    <span className="material-symbols-outlined text-[20px]">check_circle</span>
                    <span>Accediendo al Centro de Mando...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
                    <span>Verificando SIP Vault...</span>
                  </>
                )
              ) : (
                <>
                  <span>Iniciar Sesión</span>
                  <span className="material-symbols-outlined text-[20px] transition-transform group-hover:translate-x-1">
                    arrow_forward
                  </span>
                </>
              )}
            </button>

            {/* Multi-Tenant Ecosystem Direct Navigation Links */}
            <div className="mt-space-sm pt-space-md bg-surface-container-high/40 -mx-space-lg md:-mx-space-xl px-space-lg -mb-space-lg md:-mb-space-xl pb-space-lg flex flex-col items-center justify-center gap-2.5">
              <div className="flex items-center gap-space-sm text-on-surface-variant">
                <span className="material-symbols-outlined text-[16px] text-primary">hub</span>
                <p className="font-label-tag text-label-tag text-center text-outline">
                  Entrar como (demo):
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-center">
                {DEMO_USERS.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => enterAs(u.id, u.role)}
                    className="px-3 py-1 rounded-full bg-surface-container-highest hover:bg-surface-variant text-secondary hover:text-white font-label-code text-[11px] font-semibold border border-white/10 transition-all flex items-center gap-1 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[13px]">{u.icon}</span>
                    {u.label}
                  </button>
                ))}
              </div>
            </div>
          </form>
        </div>

        {/* Global Compliance & Security Meta Footer */}
        <footer className="mt-space-lg flex flex-col items-center gap-2 text-center text-on-surface-variant">
          <div className="flex flex-wrap items-center justify-center gap-x-space-md gap-y-1 font-label-code text-label-code">
            <span className="flex items-center gap-1">
              <span
                className="material-symbols-outlined text-[14px] text-primary"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                lock
              </span>
              Vooxline Secure Auth v3.0
            </span>
            <span className="text-outline">/</span>
            <span className="text-on-surface-variant">TLS 1.3 End-to-End Vault</span>
            <span className="text-outline">/</span>
            <span className="text-secondary">SOC2 Type II Compliant</span>
          </div>
          <p className="font-body-sm text-body-sm text-outline text-xs">
            © 2025 Vooxline Telemetrics Corp. Todos los derechos reservados.
          </p>
        </footer>
      </div>

      {/* Floating Quick Navigation Switcher for Easy Testing */}
      <div className="fixed bottom-4 right-4 z-50 bg-[#13151c]/95 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2 shadow-2xl flex items-center gap-3 font-label-code text-xs">
        <span className="flex items-center gap-1.5 text-primary font-bold">
          <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
          RUTAS:
        </span>
        <Link to="/" className="text-on-surface-variant hover:text-white">
          / (Index)
        </Link>
        <span className="text-white/20">|</span>
        <Link to="/login" className="text-primary font-bold hover:underline">
          /login
        </Link>
        <span className="text-white/20">|</span>
        <Link to="/admin" className="text-on-surface-variant hover:text-white">
          /admin
        </Link>
        <span className="text-white/20">|</span>
        <Link to="/agente" className="text-on-surface-variant hover:text-white">
          /agente
        </Link>
        <span className="text-white/20">|</span>
        <Link to="/cliente" className="text-on-surface-variant hover:text-white">
          /cliente
        </Link>
      </div>
    </main>
  );
};

export default LoginPage;
