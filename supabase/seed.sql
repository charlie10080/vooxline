-- Datos demo para un proyecto de Supabase nuevo. Correr DESPUÉS de las migraciones.
-- Paso previo: en Supabase > Authentication > Users crea (con contraseña) los correos de abajo.
-- Los perfiles solo se crean para los correos que ya existen en auth.users.

insert into public.campaigns (id, name, bill_rate, cost_rate, baseline_hours) values
  ('c-national', 'National Assemblers Inc', 5.63, 1.78, 1087),
  ('c-fidelis', 'Fidelis Manager', 5.50, 1.58, 640),
  ('c-vog', 'VOG Firma Legal', 5.50, 1.95, 412),
  ('c-fintech', 'FinTech Enterprise Support', 5.85, 1.47, 328)
on conflict (id) do nothing;

insert into public.agents (id, employee_code, name, level, campaign_id, sip_extension, sip_trunk, shift_minutes, pto_balance_hours) values
  ('a-maria', 'VX-9921', 'María López', 'Nivel 2 Bilingüe', 'c-national', 'SIP-104', 'Trunk-01', 480, 80),
  ('a-carlos', 'VX-6620', 'Carlos Mendoza', 'Senior QA', 'c-fidelis', 'SIP-112', 'Trunk-02', 480, 64),
  ('a-valeria', 'VX-8812', 'Valeria Ríos', 'Team Lead', 'c-vog', 'SIP-108', 'Trunk-01', 480, 72),
  ('a-alejandro-t', 'VX-4109', 'Alejandro Torres', 'Soporte', 'c-fintech', 'SIP-115', 'Trunk-03', 240, 40),
  ('a-sofia', 'VX-7734', 'Sofía Navarro', 'Nivel 1', 'c-national', 'SIP-120', 'Trunk-02', 480, 56),
  ('a-alejandro-m', 'VX-5307', 'Alejandro Moreno', 'Nivel 2', 'c-fidelis', 'SIP-118', 'Trunk-02', 480, 48),
  ('a-david', 'VX-2288', 'David Morales', 'Especialista clínico', 'c-national', 'SIP-121', 'Trunk-01', 480, 32)
on conflict (id) do nothing;

insert into public.profiles (user_id, app_id, email, role, hire_date)
select u.id, p.app_id, p.email, p.role, p.hire_date::date
from (values
  ('a-maria', 'maria.lopez@vooxline.com', 'agent', '2025-03-10'),
  ('a-carlos', 'carlos.mendoza@vooxline.com', 'supervisor', '2024-11-04'),
  ('a-valeria', 'valeria.rios@vooxline.com', 'admin', '2024-06-17'),
  ('a-alejandro-t', 'alejandro.torres@vooxline.com', 'agent', '2025-08-01'),
  ('a-sofia', 'sofia.navarro@vooxline.com', 'agent', '2026-01-12'),
  ('a-alejandro-m', 'alejandro.moreno@vooxline.com', 'agent', '2025-05-26'),
  ('a-david', 'david.morales@vooxline.com', 'agent', '2025-09-15'),
  ('c-cliente', 'cliente@nationalassemblers.com', 'client', '2025-02-03')
) as p (app_id, email, role, hire_date)
join auth.users u on lower(u.email) = p.email
on conflict (user_id) do nothing;

insert into public.client_campaigns (user_id, campaign_id)
select user_id, 'c-national' from public.profiles where app_id = 'c-cliente'
on conflict do nothing;
