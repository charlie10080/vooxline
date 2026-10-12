-- Vooxline · Fase A (identidad y directorio) + Fase B (núcleo: campañas, agentes, fichajes, cliente)
-- Los ids de negocio son text para conservar los de la app ('a-maria', 'c-national'…) al migrar desde localStorage.
-- Los estados usan text + check (igual que las uniones de strings del frontend), no enum.

create extension if not exists pgcrypto;

-- ───────────────────────── Fase A: identidad ─────────────────────────

-- Un perfil por usuario de Supabase Auth. app_id es el id que usa el frontend (agentId).
create table public.profiles (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  app_id     text not null unique,
  email      text not null unique,
  role       text not null check (role in ('agent', 'supervisor', 'admin', 'client')),
  active     boolean not null default true,
  hire_date  date,
  created_at timestamptz not null default now()
);

-- Grupos manuales e inteligentes del directorio
create table public.groups (
  id          text primary key,
  name        text not null check (length(trim(name)) > 0),
  description text not null default '',
  kind        text not null check (kind in ('manual', 'smart')),
  match       text not null default 'all' check (match in ('all', 'any')),
  rules       jsonb not null default '[]'::jsonb,
  member_ids  text[] not null default '{}'
);

-- Helpers para las políticas. security definer evita recursión de RLS al leer profiles.
create or replace function public.app_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where user_id = auth.uid() and active
$$;

create or replace function public.app_id() returns text
language sql stable security definer set search_path = public as $$
  select app_id from public.profiles where user_id = auth.uid() and active
$$;

create or replace function public.is_staff() returns boolean
language sql stable as $$
  select coalesce(public.app_role() in ('supervisor', 'admin'), false)
$$;

-- ───────────────────────── Fase B: núcleo ─────────────────────────

create table public.campaigns (
  id             text primary key,
  name           text not null,
  bill_rate      numeric(10, 2) not null check (bill_rate >= 0),
  cost_rate      numeric(10, 2) not null check (cost_rate >= 0),
  baseline_hours numeric(10, 2) not null default 0
);

-- Qué campañas puede ver cada cliente
create table public.client_campaigns (
  user_id     uuid not null references public.profiles (user_id) on delete cascade,
  campaign_id text not null references public.campaigns (id) on delete cascade,
  primary key (user_id, campaign_id)
);

create or replace function public.client_has_campaign(cid text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.client_campaigns where user_id = auth.uid() and campaign_id = cid)
$$;

create table public.agents (
  id                  text primary key,
  employee_code       text not null unique,
  name                text not null,
  level               text not null default '',
  campaign_id         text not null references public.campaigns (id),
  sip_extension       text not null default '',
  sip_trunk           text not null default '',
  latency_ms          integer not null default 0,
  status              text not null default 'offline' check (status in ('on_call', 'available', 'break', 'offline')),
  is_vip              boolean not null default false,
  status_since        timestamptz not null default now(),
  qa_score            integer check (qa_score between 0 and 100),
  qa_label            text,
  shift_minutes       integer not null default 480,
  pto_balance_hours   numeric(6, 2) not null default 0,
  authorized_location jsonb
);

create table public.time_entries (
  id                text primary key default gen_random_uuid()::text,
  agent_id          text not null references public.agents (id),
  campaign_id       text not null references public.campaigns (id),
  clock_in          timestamptz not null,
  clock_out         timestamptz,
  break_minutes     integer not null default 0 check (break_minutes >= 0),
  scheduled_minutes integer not null default 0,
  status            text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  note              text,
  clock_in_geo      jsonb,
  clock_out_geo     jsonb,
  break_started_at  timestamptz,
  check (clock_out is null or clock_out >= clock_in)
);
create index time_entries_agent_idx on public.time_entries (agent_id, clock_in desc);
create index time_entries_campaign_idx on public.time_entries (campaign_id, clock_in desc);
-- Un solo turno abierto por agente
create unique index time_entries_one_open on public.time_entries (agent_id) where clock_out is null;

create table public.client_requests (
  id          text primary key default gen_random_uuid()::text,
  campaign_id text not null references public.campaigns (id),
  created_by  uuid references public.profiles (user_id),
  type        text not null check (type in ('ampliar_agentes', 'ajuste_script', 'soporte_facturacion', 'otro')),
  title       text not null check (length(trim(title)) > 0),
  priority    text not null default 'normal' check (priority in ('normal', 'alta')),
  status      text not null default 'abierto' check (status in ('abierto', 'en_revision', 'aplicado', 'cancelado')),
  created_at  timestamptz not null default now()
);

create table public.client_invoices (
  id             text primary key,
  campaign_id    text not null references public.campaigns (id),
  period         text not null check (period ~ '^\d{4}-\d{2}$'),
  billable_hours numeric(10, 2) not null,
  rate_usd       numeric(10, 2) not null,
  total_usd      numeric(12, 2) not null,
  status         text not null check (status in ('pagada', 'pendiente'))
);

-- ───────────────────────── RLS ─────────────────────────

alter table public.profiles         enable row level security;
alter table public.groups           enable row level security;
alter table public.campaigns        enable row level security;
alter table public.client_campaigns enable row level security;
alter table public.agents           enable row level security;
alter table public.time_entries     enable row level security;
alter table public.client_requests  enable row level security;
alter table public.client_invoices  enable row level security;

-- Perfiles: cada quien el suyo; supervisión ve todos; solo admin crea o cambia roles
create policy profiles_select on public.profiles for select using (user_id = auth.uid() or public.is_staff());
create policy profiles_admin  on public.profiles for all    using (public.app_role() = 'admin') with check (public.app_role() = 'admin');

-- Grupos: solo supervisión
create policy groups_staff on public.groups for all using (public.is_staff()) with check (public.is_staff());

-- Campañas: supervisión, el agente de esa campaña o el cliente dueño; solo admin edita
create policy campaigns_select on public.campaigns for select using (
  public.is_staff()
  or public.client_has_campaign(id)
  or exists (select 1 from public.agents a where a.id = public.app_id() and a.campaign_id = campaigns.id)
);
create policy campaigns_admin on public.campaigns for all using (public.app_role() = 'admin') with check (public.app_role() = 'admin');

create policy client_campaigns_select on public.client_campaigns for select using (user_id = auth.uid() or public.is_staff());
create policy client_campaigns_admin  on public.client_campaigns for all using (public.app_role() = 'admin') with check (public.app_role() = 'admin');

-- Agentes: supervisión gestiona; el agente se ve a sí mismo; el cliente ve los de su campaña (actividad en vivo)
create policy agents_select on public.agents for select using (
  public.is_staff() or id = public.app_id() or public.client_has_campaign(campaign_id)
);
create policy agents_staff on public.agents for all using (public.is_staff()) with check (public.is_staff());

-- Fichajes: el agente lee y escribe los suyos, pero nunca se los aprueba; supervisión aprueba; el cliente solo lee los de su campaña
create policy time_entries_select on public.time_entries for select using (
  public.is_staff() or agent_id = public.app_id() or public.client_has_campaign(campaign_id)
);
create policy time_entries_agent_insert on public.time_entries for insert
  with check (agent_id = public.app_id() and status = 'pending');
create policy time_entries_agent_update on public.time_entries for update
  using (agent_id = public.app_id() and status = 'pending')
  with check (agent_id = public.app_id() and status = 'pending');
create policy time_entries_staff on public.time_entries for all using (public.is_staff()) with check (public.is_staff());

-- Solicitudes: el cliente crea en sus campañas y solo puede cancelar las que siguen abiertas
create policy client_requests_select on public.client_requests for select using (
  public.is_staff() or public.client_has_campaign(campaign_id)
);
create policy client_requests_insert on public.client_requests for insert with check (
  public.client_has_campaign(campaign_id) and created_by = auth.uid() and status = 'abierto'
);
create policy client_requests_cancel on public.client_requests for update
  using (public.client_has_campaign(campaign_id) and status = 'abierto')
  with check (public.client_has_campaign(campaign_id) and status in ('abierto', 'cancelado'));
create policy client_requests_staff on public.client_requests for all using (public.is_staff()) with check (public.is_staff());

-- Facturas: el cliente lee las suyas; supervisión lee; solo admin emite o cambia
create policy client_invoices_select on public.client_invoices for select using (
  public.is_staff() or public.client_has_campaign(campaign_id)
);
create policy client_invoices_admin on public.client_invoices for all using (public.app_role() = 'admin') with check (public.app_role() = 'admin');
