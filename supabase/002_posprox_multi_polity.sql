-- ==========================================================
-- D3 CONNECT / POSPROX — MULTI-POLITY PROTOTYPE MIGRATION
-- Version: 0.2.0
--
-- PURPOSE
-- 1. Make the existing D3 Connect community tables reusable
--    across many districts/polities.
-- 2. Add the PosProx domain model: Issues -> Proposals -> Bills,
--    topic-scoped proxies, citizens, and continuously attached votes.
-- 3. Seed Portland City Council District 3 as the first deployment.
--
-- PROTOTYPE SECURITY NOTE
-- Public read and selected public write policies are intentionally
-- permissive for demonstration. Add authenticated membership,
-- authorization, abuse controls, and server-side governance actions
-- before production use.
-- ==========================================================

create extension if not exists pgcrypto;

-- ==========================================================
-- SQL 001 — Polities / reusable deployment boundary
-- ==========================================================

create table if not exists public.polities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  product_name text not null,
  jurisdiction_name text not null,
  district_name text not null,
  district_short_name text not null,
  location_name text,
  support_threshold numeric(8,6) not null default 0.666667,
  removal_threshold numeric(8,6) not null default 0.333333,
  secretary_role_name text not null default 'Secretary of State',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint polity_threshold_order check (removal_threshold < support_threshold),
  constraint polity_support_range check (support_threshold > 0 and support_threshold <= 1),
  constraint polity_removal_range check (removal_threshold >= 0 and removal_threshold < 1)
);

insert into public.polities (
  id, slug, product_name, jurisdiction_name, district_name,
  district_short_name, location_name, support_threshold,
  removal_threshold, secretary_role_name
) values (
  'd3000000-0000-0000-0000-000000000003',
  'portland-d3',
  'D3 Connect',
  'Portland City Council',
  'Portland City Council District 3',
  'District 3',
  'Portland, Oregon',
  0.666667,
  0.333333,
  'Secretary of State'
) on conflict (slug) do update set
  product_name = excluded.product_name,
  jurisdiction_name = excluded.jurisdiction_name,
  district_name = excluded.district_name,
  district_short_name = excluded.district_short_name,
  location_name = excluded.location_name,
  support_threshold = excluded.support_threshold,
  removal_threshold = excluded.removal_threshold,
  secretary_role_name = excluded.secretary_role_name,
  updated_at = now();

-- ==========================================================
-- SQL 002 — Add polity boundary to existing D3 community data
-- ==========================================================

do $$
begin
  if to_regclass('public.neighborhoods') is not null then
    alter table public.neighborhoods add column if not exists polity_id uuid references public.polities(id);
    update public.neighborhoods set polity_id = 'd3000000-0000-0000-0000-000000000003' where polity_id is null;
  end if;
  if to_regclass('public.projects') is not null then
    alter table public.projects add column if not exists polity_id uuid references public.polities(id);
    update public.projects set polity_id = 'd3000000-0000-0000-0000-000000000003' where polity_id is null;
  end if;
  if to_regclass('public.resources') is not null then
    alter table public.resources add column if not exists polity_id uuid references public.polities(id);
    update public.resources set polity_id = 'd3000000-0000-0000-0000-000000000003' where polity_id is null;
  end if;
  if to_regclass('public.community_events') is not null then
    alter table public.community_events add column if not exists polity_id uuid references public.polities(id);
    update public.community_events set polity_id = 'd3000000-0000-0000-0000-000000000003' where polity_id is null;
  end if;
  if to_regclass('public.businesses') is not null then
    alter table public.businesses add column if not exists polity_id uuid references public.polities(id);
    update public.businesses set polity_id = 'd3000000-0000-0000-0000-000000000003' where polity_id is null;
  end if;
  if to_regclass('public.issues') is not null then
    alter table public.issues add column if not exists polity_id uuid references public.polities(id);
    update public.issues set polity_id = 'd3000000-0000-0000-0000-000000000003' where polity_id is null;
  end if;
  if to_regclass('public.feedback') is not null then
    alter table public.feedback add column if not exists polity_id uuid references public.polities(id);
    update public.feedback set polity_id = 'd3000000-0000-0000-0000-000000000003' where polity_id is null;
  end if;
  if to_regclass('public.subscribers') is not null then
    alter table public.subscribers add column if not exists polity_id uuid references public.polities(id);
    update public.subscribers set polity_id = 'd3000000-0000-0000-0000-000000000003' where polity_id is null;
  end if;
end $$;

-- Convert global uniqueness into per-polity uniqueness where possible.
do $$
begin
  if exists (select 1 from pg_constraint where conname = 'neighborhoods_name_key') then
    alter table public.neighborhoods drop constraint neighborhoods_name_key;
  end if;
  if exists (select 1 from pg_constraint where conname = 'subscribers_email_key') then
    alter table public.subscribers drop constraint subscribers_email_key;
  end if;
end $$;

create unique index if not exists neighborhoods_polity_name_uidx on public.neighborhoods(polity_id, name);
create unique index if not exists subscribers_polity_email_uidx on public.subscribers(polity_id, email);
create index if not exists projects_polity_idx on public.projects(polity_id);
create index if not exists resources_polity_idx on public.resources(polity_id);
create index if not exists community_events_polity_idx on public.community_events(polity_id);
create index if not exists businesses_polity_idx on public.businesses(polity_id);

-- ==========================================================
-- SQL 003 — Governance topics and citizens
-- ==========================================================

create table if not exists public.governance_topics (
  id uuid primary key default gen_random_uuid(),
  polity_id uuid not null references public.polities(id) on delete cascade,
  name text not null,
  description text not null default '',
  color_key text,
  created_at timestamptz not null default now(),
  unique(polity_id, name)
);

create table if not exists public.citizens (
  id uuid primary key default gen_random_uuid(),
  polity_id uuid not null references public.polities(id) on delete cascade,
  auth_user_id uuid,
  display_name text not null,
  neighborhood text not null default 'District-wide',
  bio text,
  active boolean not null default true,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists citizens_polity_active_idx on public.citizens(polity_id, active);

-- ==========================================================
-- SQL 004 — Issues
-- Anyone can raise a problem the polity should act upon.
-- ==========================================================

create table if not exists public.civic_issues (
  id uuid primary key default gen_random_uuid(),
  polity_id uuid not null references public.polities(id) on delete cascade,
  created_by uuid not null references public.citizens(id),
  title text not null,
  summary text not null,
  topic_id uuid not null references public.governance_topics(id),
  neighborhood text,
  status text not null default 'Open' check (status in ('Open','In Discussion','Addressed','Closed')),
  proposal_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists civic_issues_polity_idx on public.civic_issues(polity_id, created_at desc);
create index if not exists civic_issues_topic_idx on public.civic_issues(topic_id);

-- ==========================================================
-- SQL 005 — Proposals / Git-style evolution
-- Proposals may cover any combination of Issues and may fork.
-- ==========================================================

create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),
  polity_id uuid not null references public.polities(id) on delete cascade,
  maintainer_id uuid not null references public.citizens(id),
  title text not null,
  summary text not null,
  body text not null,
  status text not null default 'Draft' check (status in ('Draft','Review','Ready','Converted to Bill')),
  issue_ids uuid[] not null default '{}',
  parent_proposal_id uuid references public.proposals(id),
  revision_count integer not null default 1,
  fork_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.proposal_revisions (
  id uuid primary key default gen_random_uuid(),
  polity_id uuid not null references public.polities(id) on delete cascade,
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  author_id uuid not null references public.citizens(id),
  revision_number integer not null,
  body text not null,
  change_note text,
  created_at timestamptz not null default now(),
  unique(proposal_id, revision_number)
);

create index if not exists proposals_polity_idx on public.proposals(polity_id, updated_at desc);
create index if not exists proposal_revisions_proposal_idx on public.proposal_revisions(proposal_id, revision_number desc);

-- ==========================================================
-- SQL 006 — Bills / laws / policies
-- A Bill is a locked Proposal version. Citizens attach votes.
-- The 2/3 activation and 1/3 removal gap creates hysteresis.
-- ==========================================================

create table if not exists public.bills (
  id uuid primary key default gen_random_uuid(),
  polity_id uuid not null references public.polities(id) on delete cascade,
  proposal_id uuid not null references public.proposals(id),
  topic_id uuid references public.governance_topics(id),
  title text not null,
  summary text not null,
  kind text not null default 'Policy' check (kind in ('Law','Policy')),
  state text not null default 'Voting' check (state in ('Voting','In Force','Out of Force')),
  locked_body text not null default '',
  support_count integer not null default 0,
  electorate_count integer not null default 0,
  support_percent numeric(7,3) not null default 0,
  created_at timestamptz not null default now(),
  last_state_change_at timestamptz
);

create table if not exists public.bill_votes (
  id uuid primary key default gen_random_uuid(),
  polity_id uuid not null references public.polities(id) on delete cascade,
  bill_id uuid not null references public.bills(id) on delete cascade,
  citizen_id uuid not null references public.citizens(id) on delete cascade,
  attached boolean not null default true,
  cast_by_citizen_id uuid references public.citizens(id),
  vote_source text not null default 'direct' check (vote_source in ('direct','proxy')),
  updated_at timestamptz not null default now(),
  unique(bill_id, citizen_id)
);

create index if not exists bills_polity_idx on public.bills(polity_id, created_at desc);
create index if not exists bill_votes_bill_idx on public.bill_votes(bill_id, attached);

-- ==========================================================
-- SQL 007 — Topic-scoped proxy graph
-- disposition = return: unresolved responsibility returns to owner.
-- disposition = redelegate: proxy may pass that scope onward.
-- ==========================================================

create table if not exists public.proxy_assignments (
  id uuid primary key default gen_random_uuid(),
  polity_id uuid not null references public.polities(id) on delete cascade,
  owner_id uuid not null references public.citizens(id) on delete cascade,
  proxy_id uuid not null references public.citizens(id) on delete cascade,
  topic_id uuid references public.governance_topics(id) on delete cascade,
  disposition text not null default 'return' check (disposition in ('return','redelegate')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  ended_at timestamptz,
  constraint proxy_not_self check (owner_id <> proxy_id)
);

create unique index if not exists proxy_active_scope_uidx
  on public.proxy_assignments(owner_id, coalesce(topic_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where active = true;
create index if not exists proxy_polity_idx on public.proxy_assignments(polity_id, owner_id, active);

-- ==========================================================
-- SQL 008 — Bill support recalculation / hysteresis
-- This function maintains aggregate state for attached bill_votes.
-- Recursive proxy resolution is intentionally a separate engine step;
-- effective proxy-derived votes can be materialized into bill_votes
-- with vote_source='proxy' and cast_by_citizen_id set to the proxy.
-- ==========================================================

create or replace function public.recalculate_bill_support(target_bill uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  p_id uuid;
  activation numeric;
  removal numeric;
  electorate integer;
  supporting integer;
  pct numeric;
  current_state text;
  next_state text;
begin
  select b.polity_id, b.state, p.support_threshold, p.removal_threshold
    into p_id, current_state, activation, removal
  from public.bills b
  join public.polities p on p.id = b.polity_id
  where b.id = target_bill;

  if p_id is null then return; end if;

  select count(*) into electorate from public.citizens where polity_id = p_id and active = true;
  select count(*) into supporting from public.bill_votes where bill_id = target_bill and attached = true;

  if electorate = 0 then pct := 0; else pct := supporting::numeric / electorate::numeric; end if;

  next_state := current_state;
  if current_state = 'Voting' then
    if pct >= activation then next_state := 'In Force'; end if;
  elsif current_state = 'In Force' then
    if pct < removal then next_state := 'Out of Force'; end if;
  elsif current_state = 'Out of Force' then
    if pct >= activation then next_state := 'In Force'; end if;
  end if;

  update public.bills
  set support_count = supporting,
      electorate_count = electorate,
      support_percent = round(pct * 100, 3),
      state = next_state,
      last_state_change_at = case when next_state <> current_state then now() else last_state_change_at end
  where id = target_bill;
end;
$$;

create or replace function public.bill_vote_recalculate_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recalculate_bill_support(old.bill_id);
    return old;
  else
    perform public.recalculate_bill_support(new.bill_id);
    return new;
  end if;
end;
$$;

drop trigger if exists trg_bill_vote_recalculate on public.bill_votes;
create trigger trg_bill_vote_recalculate
after insert or update or delete on public.bill_votes
for each row execute function public.bill_vote_recalculate_trigger();

-- ==========================================================
-- SQL 009 — Prototype RLS
-- ==========================================================

alter table public.polities enable row level security;
alter table public.governance_topics enable row level security;
alter table public.citizens enable row level security;
alter table public.civic_issues enable row level security;
alter table public.proposals enable row level security;
alter table public.proposal_revisions enable row level security;
alter table public.bills enable row level security;
alter table public.bill_votes enable row level security;
alter table public.proxy_assignments enable row level security;

drop policy if exists "Public read polities" on public.polities;
create policy "Public read polities" on public.polities for select using (active = true);
drop policy if exists "Public read governance topics" on public.governance_topics;
create policy "Public read governance topics" on public.governance_topics for select using (true);
drop policy if exists "Public read citizens" on public.citizens;
create policy "Public read citizens" on public.citizens for select using (active = true);
drop policy if exists "Public read civic issues" on public.civic_issues;
create policy "Public read civic issues" on public.civic_issues for select using (true);
drop policy if exists "Prototype create civic issues" on public.civic_issues;
create policy "Prototype create civic issues" on public.civic_issues for insert with check (true);
drop policy if exists "Public read proposals" on public.proposals;
create policy "Public read proposals" on public.proposals for select using (true);
drop policy if exists "Prototype create proposals" on public.proposals;
create policy "Prototype create proposals" on public.proposals for insert with check (true);
drop policy if exists "Public read proposal revisions" on public.proposal_revisions;
create policy "Public read proposal revisions" on public.proposal_revisions for select using (true);
drop policy if exists "Public read bills" on public.bills;
create policy "Public read bills" on public.bills for select using (true);
drop policy if exists "Public read bill votes" on public.bill_votes;
create policy "Public read bill votes" on public.bill_votes for select using (true);
drop policy if exists "Prototype manage bill votes" on public.bill_votes;
create policy "Prototype manage bill votes" on public.bill_votes for all using (true) with check (true);
drop policy if exists "Public read proxy assignments" on public.proxy_assignments;
create policy "Public read proxy assignments" on public.proxy_assignments for select using (true);
drop policy if exists "Prototype manage proxy assignments" on public.proxy_assignments;
create policy "Prototype manage proxy assignments" on public.proxy_assignments for all using (true) with check (true);

-- ==========================================================
-- SQL 010 — Portland D3 seed: topics and fictional citizens
-- ==========================================================

insert into public.governance_topics (id, polity_id, name, description) values
('d3100000-0000-0000-0000-000000000001','d3000000-0000-0000-0000-000000000003','Transportation','Streets, transit, walking, cycling, traffic, and mobility.'),
('d3100000-0000-0000-0000-000000000002','d3000000-0000-0000-0000-000000000003','Housing','Housing supply, affordability, tenant policy, and shelter.'),
('d3100000-0000-0000-0000-000000000003','d3000000-0000-0000-0000-000000000003','Parks & Environment','Parks, trees, green space, climate, and environmental quality.'),
('d3100000-0000-0000-0000-000000000004','d3000000-0000-0000-0000-000000000003','Public Safety','Emergency response, safety policy, prevention, and resilience.'),
('d3100000-0000-0000-0000-000000000005','d3000000-0000-0000-0000-000000000003','Budget & Finance','Public spending, revenue, procurement, and fiscal policy.'),
('d3100000-0000-0000-0000-000000000006','d3000000-0000-0000-0000-000000000003','Small Business','Local commerce, permitting, business districts, and economic activity.'),
('d3100000-0000-0000-0000-000000000007','d3000000-0000-0000-0000-000000000003','Civic Administration','Elections, public process, transparency, and administration.')
on conflict (polity_id, name) do nothing;

insert into public.citizens (id, polity_id, display_name, neighborhood, bio, active) values
('d3200000-0000-0000-0000-000000000001','d3000000-0000-0000-0000-000000000003','You (Demo Citizen)','Richmond','Prototype participant',true),
('d3200000-0000-0000-0000-000000000002','d3000000-0000-0000-0000-000000000003','Maya Chen','Montavilla','Transit and pedestrian-access volunteer',true),
('d3200000-0000-0000-0000-000000000003','d3000000-0000-0000-0000-000000000003','Devon Brooks','Buckman','Housing policy researcher',true),
('d3200000-0000-0000-0000-000000000004','d3000000-0000-0000-0000-000000000003','Lena Ortiz','Woodstock','Neighborhood small-business owner',true),
('d3200000-0000-0000-0000-000000000005','d3000000-0000-0000-0000-000000000003','Omar Reed','Mt. Tabor','Parks and environmental advocate',true),
('d3200000-0000-0000-0000-000000000006','d3000000-0000-0000-0000-000000000003','Ruth Park','Foster-Powell','Public budgeting volunteer',true),
('d3200000-0000-0000-0000-000000000007','d3000000-0000-0000-0000-000000000003','Sam Ellis','Sunnyside','Community safety organizer',true)
on conflict (id) do nothing;

-- ==========================================================
-- SQL 011 — Portland D3 seed: issues, proposals, bills
-- ==========================================================

insert into public.civic_issues (id, polity_id, created_by, title, summary, topic_id, neighborhood, status, proposal_count, created_at) values
('d3300000-0000-0000-0000-000000000001','d3000000-0000-0000-0000-000000000003','d3200000-0000-0000-0000-000000000002','Unsafe crossings along SE Division','Residents need safer pedestrian crossings at several high-use intersections along the corridor.','d3100000-0000-0000-0000-000000000001','Richmond','Open',3,'2026-08-19T14:30:00Z'),
('d3300000-0000-0000-0000-000000000002','d3000000-0000-0000-0000-000000000003','d3200000-0000-0000-0000-000000000003','Long-term neighborhood housing stability','Explore district-level actions that can improve housing stability without treating affordability as a single-program problem.','d3100000-0000-0000-0000-000000000002','District-wide','In Discussion',2,'2026-08-16T18:15:00Z'),
('d3300000-0000-0000-0000-000000000003','d3000000-0000-0000-0000-000000000003','d3200000-0000-0000-0000-000000000005','Tree canopy gaps on high-heat blocks','Identify blocks with low canopy and establish a transparent prioritization process for planting and maintenance.','d3100000-0000-0000-0000-000000000003','Foster-Powell','Open',1,'2026-08-22T09:00:00Z'),
('d3300000-0000-0000-0000-000000000004','d3000000-0000-0000-0000-000000000003','d3200000-0000-0000-0000-000000000006','Make district project spending easier to audit','Publish consistent project-level budget, funding source, change, and completion data for residents.','d3100000-0000-0000-0000-000000000005','District-wide','Addressed',4,'2026-08-07T12:00:00Z')
on conflict (id) do nothing;

insert into public.proposals (id, polity_id, maintainer_id, title, summary, body, status, issue_ids, revision_count, fork_count, updated_at) values
('d3400000-0000-0000-0000-000000000001','d3000000-0000-0000-0000-000000000003','d3200000-0000-0000-0000-000000000002','Division Safe Crossings Package','Prioritize four crossings using crash risk, transit usage, school access, and pedestrian volume.','Create a ranked crossing improvement package, publish the scoring criteria, and require a public status update every 60 days until completion.','Ready',array['d3300000-0000-0000-0000-000000000001'::uuid],8,2,'2026-08-25T20:00:00Z'),
('d3400000-0000-0000-0000-000000000002','d3000000-0000-0000-0000-000000000003','d3200000-0000-0000-0000-000000000003','Neighborhood Housing Stability Dashboard','Publish a district-level dashboard of housing pressure, available assistance, permitting, and publicly funded projects.','Create a shared public data view that gives residents a common factual baseline before policy is debated.','Review',array['d3300000-0000-0000-0000-000000000002'::uuid,'d3300000-0000-0000-0000-000000000004'::uuid],5,1,'2026-08-24T17:30:00Z'),
('d3400000-0000-0000-0000-000000000003','d3000000-0000-0000-0000-000000000003','d3200000-0000-0000-0000-000000000005','Heat-Block Tree Priority Standard','Use heat exposure and canopy gaps to establish a transparent planting priority.','Rank candidate blocks by heat exposure, existing canopy, pedestrian usage, and vulnerable-population access, then publish the queue.','Draft',array['d3300000-0000-0000-0000-000000000003'::uuid],3,0,'2026-08-26T09:20:00Z'),
('d3400000-0000-0000-0000-000000000004','d3000000-0000-0000-0000-000000000003','d3200000-0000-0000-0000-000000000006','Open Project Ledger Standard','Standardize public reporting for district projects, budgets, change history, and responsible agencies.','Require a common public ledger format for district-facing project information and define minimum update intervals.','Converted to Bill',array['d3300000-0000-0000-0000-000000000004'::uuid],11,3,'2026-08-18T11:00:00Z')
on conflict (id) do nothing;

insert into public.bills (id, polity_id, proposal_id, topic_id, title, summary, kind, state, locked_body, support_count, electorate_count, support_percent, created_at, last_state_change_at) values
('d3500000-0000-0000-0000-000000000001','d3000000-0000-0000-0000-000000000003','d3400000-0000-0000-0000-000000000004','d3100000-0000-0000-0000-000000000005','Open Project Ledger Standard','Require consistent public project reporting for district-facing work.','Policy','In Force','Require a common public ledger format for district-facing project information and define minimum update intervals.',5,7,71.429,'2026-08-18T11:30:00Z','2026-08-23T08:00:00Z'),
('d3500000-0000-0000-0000-000000000002','d3000000-0000-0000-0000-000000000003','d3400000-0000-0000-0000-000000000001','d3100000-0000-0000-0000-000000000001','Division Safe Crossings Package','Adopt the ranked package and publish implementation progress.','Policy','Voting','Create a ranked crossing improvement package and publish implementation progress.',4,7,57.143,'2026-08-26T18:00:00Z',null),
('d3500000-0000-0000-0000-000000000003','d3000000-0000-0000-0000-000000000003','d3400000-0000-0000-0000-000000000002','d3100000-0000-0000-0000-000000000002','Housing Data Transparency Pilot','Operate a public district housing-stability data pilot for twelve months.','Policy','Out of Force','Operate a public district housing-stability data pilot for twelve months.',2,7,28.571,'2026-07-21T13:00:00Z','2026-08-20T13:00:00Z')
on conflict (id) do nothing;

-- Seed attached votes so the seven-person prototype electorate matches the bill totals.
insert into public.bill_votes (polity_id, bill_id, citizen_id, attached, cast_by_citizen_id, vote_source) values
('d3000000-0000-0000-0000-000000000003','d3500000-0000-0000-0000-000000000001','d3200000-0000-0000-0000-000000000001',true,'d3200000-0000-0000-0000-000000000001','direct'),
('d3000000-0000-0000-0000-000000000003','d3500000-0000-0000-0000-000000000001','d3200000-0000-0000-0000-000000000002',true,'d3200000-0000-0000-0000-000000000002','direct'),
('d3000000-0000-0000-0000-000000000003','d3500000-0000-0000-0000-000000000001','d3200000-0000-0000-0000-000000000003',true,'d3200000-0000-0000-0000-000000000003','direct'),
('d3000000-0000-0000-0000-000000000003','d3500000-0000-0000-0000-000000000001','d3200000-0000-0000-0000-000000000005',true,'d3200000-0000-0000-0000-000000000005','direct'),
('d3000000-0000-0000-0000-000000000003','d3500000-0000-0000-0000-000000000001','d3200000-0000-0000-0000-000000000006',true,'d3200000-0000-0000-0000-000000000006','direct'),
('d3000000-0000-0000-0000-000000000003','d3500000-0000-0000-0000-000000000002','d3200000-0000-0000-0000-000000000002',true,'d3200000-0000-0000-0000-000000000002','direct'),
('d3000000-0000-0000-0000-000000000003','d3500000-0000-0000-0000-000000000002','d3200000-0000-0000-0000-000000000003',true,'d3200000-0000-0000-0000-000000000003','direct'),
('d3000000-0000-0000-0000-000000000003','d3500000-0000-0000-0000-000000000002','d3200000-0000-0000-0000-000000000004',true,'d3200000-0000-0000-0000-000000000004','direct'),
('d3000000-0000-0000-0000-000000000003','d3500000-0000-0000-0000-000000000002','d3200000-0000-0000-0000-000000000007',true,'d3200000-0000-0000-0000-000000000007','direct'),
('d3000000-0000-0000-0000-000000000003','d3500000-0000-0000-0000-000000000003','d3200000-0000-0000-0000-000000000003',true,'d3200000-0000-0000-0000-000000000003','direct'),
('d3000000-0000-0000-0000-000000000003','d3500000-0000-0000-0000-000000000003','d3200000-0000-0000-0000-000000000006',true,'d3200000-0000-0000-0000-000000000006','direct')
on conflict (bill_id, citizen_id) do update set attached = excluded.attached, updated_at = now();

-- ==========================================================
-- SQL 012 — Portland D3 seed: proxy graph
-- ==========================================================

insert into public.proxy_assignments (id, polity_id, owner_id, proxy_id, topic_id, disposition, active) values
('d3600000-0000-0000-0000-000000000001','d3000000-0000-0000-0000-000000000003','d3200000-0000-0000-0000-000000000001','d3200000-0000-0000-0000-000000000003','d3100000-0000-0000-0000-000000000002','return',true),
('d3600000-0000-0000-0000-000000000002','d3000000-0000-0000-0000-000000000003','d3200000-0000-0000-0000-000000000001','d3200000-0000-0000-0000-000000000005','d3100000-0000-0000-0000-000000000003','redelegate',true),
('d3600000-0000-0000-0000-000000000003','d3000000-0000-0000-0000-000000000003','d3200000-0000-0000-0000-000000000001','d3200000-0000-0000-0000-000000000007','d3100000-0000-0000-0000-000000000004','redelegate',true),
('d3600000-0000-0000-0000-000000000004','d3000000-0000-0000-0000-000000000003','d3200000-0000-0000-0000-000000000001','d3200000-0000-0000-0000-000000000006','d3100000-0000-0000-0000-000000000005','return',true),
('d3600000-0000-0000-0000-000000000005','d3000000-0000-0000-0000-000000000003','d3200000-0000-0000-0000-000000000001','d3200000-0000-0000-0000-000000000004','d3100000-0000-0000-0000-000000000006','redelegate',true),
('d3600000-0000-0000-0000-000000000006','d3000000-0000-0000-0000-000000000003','d3200000-0000-0000-0000-000000000001','d3200000-0000-0000-0000-000000000006','d3100000-0000-0000-0000-000000000007','return',true)
on conflict (id) do nothing;

-- ==========================================================
-- SQL 013 — Redeploying to another district
-- ==========================================================
-- To create another district deployment:
-- 1. Insert one new row into public.polities with a unique slug.
-- 2. Seed neighborhoods and governance_topics with that polity_id.
-- 3. Seed/import district-specific community content.
-- 4. Deploy the same frontend with VITE_POLITY_SLUG=<new-slug>.
-- No application fork is required.
