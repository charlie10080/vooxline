-- El cliente ya no lee la tabla agents completa (qa_score, sip_*, ubicación son internos).
-- Solo ve nombre y estado de los agentes de sus campañas, a través de esta vista.

drop policy agents_select on public.agents;
create policy agents_select on public.agents for select using (public.is_staff() or id = public.app_id());

-- Sin security_invoker: la vista corre como su dueño (salta la RLS de agents) y filtra ella misma
create view public.client_agents_v as
  select id, name, campaign_id, status, status_since
  from public.agents
  where public.is_staff() or public.client_has_campaign(campaign_id);

revoke all on public.client_agents_v from anon;
grant select on public.client_agents_v to authenticated;
