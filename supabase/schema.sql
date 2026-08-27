-- ==========================================================
-- D3 CONNECT — SUPABASE MVP SCHEMA
-- Run in Supabase SQL Editor for project jwlihfcaznjviydtymuk
-- Prototype policies intentionally allow public read and public form inserts.
-- Harden with rate limiting / CAPTCHA / authenticated admin roles before production.
-- ==========================================================

create extension if not exists pgcrypto;

create table if not exists public.neighborhoods (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  neighborhood text not null,
  agency text not null,
  budget numeric(14,2) not null default 0,
  status text not null default 'Planned',
  est_completion text not null default 'TBD',
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  title text not null,
  description text not null,
  url text,
  phone text,
  neighborhood text,
  created_at timestamptz not null default now()
);

create table if not exists public.community_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_date date not null,
  start_time text not null,
  end_time text,
  location text not null,
  neighborhood text,
  created_at timestamptz not null default now()
);

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  neighborhood text not null,
  address text,
  website text,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.issues (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  description text not null,
  neighborhood text not null,
  location text not null,
  email text,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  neighborhood text not null,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  neighborhood text,
  created_at timestamptz not null default now()
);

alter table public.neighborhoods enable row level security;
alter table public.projects enable row level security;
alter table public.resources enable row level security;
alter table public.community_events enable row level security;
alter table public.businesses enable row level security;
alter table public.issues enable row level security;
alter table public.feedback enable row level security;
alter table public.subscribers enable row level security;

drop policy if exists "Public read neighborhoods" on public.neighborhoods;
create policy "Public read neighborhoods" on public.neighborhoods for select using (true);
drop policy if exists "Public read projects" on public.projects;
create policy "Public read projects" on public.projects for select using (true);
drop policy if exists "Public read resources" on public.resources;
create policy "Public read resources" on public.resources for select using (true);
drop policy if exists "Public read events" on public.community_events;
create policy "Public read events" on public.community_events for select using (true);
drop policy if exists "Public read businesses" on public.businesses;
create policy "Public read businesses" on public.businesses for select using (active = true);
drop policy if exists "Public submit issues" on public.issues;
create policy "Public submit issues" on public.issues for insert with check (true);
drop policy if exists "Public submit feedback" on public.feedback;
create policy "Public submit feedback" on public.feedback for insert with check (true);
drop policy if exists "Public subscribe" on public.subscribers;
create policy "Public subscribe" on public.subscribers for insert with check (true);
drop policy if exists "Public resubscribe" on public.subscribers;
create policy "Public resubscribe" on public.subscribers for update using (true) with check (true);

insert into public.neighborhoods (name) values
('Ardenwald-Johnson Creek'),('Brentwood-Darlington'),('Brooklyn'),('Buckman'),('Creston-Kenilworth'),
('Foster-Powell'),('Hosford-Abernethy'),('Kerns'),('Laurelhurst'),('Montavilla'),('Mt. Scott-Arleta'),
('Mt. Tabor'),('North Tabor'),('Pleasant Valley'),('Powellhurst-Gilbert'),('Richmond'),('Rose City Park'),
('South Tabor'),('Sunnyside'),('Woodstock'),('Center')
on conflict (name) do nothing;

insert into public.projects (name, neighborhood, agency, budget, status, est_completion, description)
select * from (values
('Mt. Tabor Park Restroom Repair','Mt. Tabor','Parks & Rec',850000,'In Progress','Aug 2027','Public restroom repair and accessibility improvements.'),
('SE Division Pedestrian Improvements','Richmond','PBOT',2400000,'Planned','Spring 2028','Pedestrian safety, crossings, and corridor improvements.'),
('Foster-Powell Affordable Housing','Foster-Powell','PHB',12500000,'Permitting','Late 2028','Affordable housing development currently in permitting.'),
('Montavilla Street Maintenance','Montavilla','PBOT',1100000,'Scheduled','Jul 2027','Street surface maintenance and targeted repairs.'),
('Sunnyside Park Playground Upgrade','Sunnyside','Parks & Rec',675000,'Design','Fall 2027','Playground modernization and safer surfacing.')
) as seed(name, neighborhood, agency, budget, status, est_completion, description)
where not exists (select 1 from public.projects);

insert into public.resources (category,title,description)
select * from (values
('Food','Food Assistance','Find food pantries, meal programs, and emergency food resources serving District 3.'),
('Housing','Housing Assistance','Rental assistance, shelter access, tenant resources, and housing navigation.'),
('Mental Health','Mental Health Support','Counseling, crisis services, and community mental health resources.'),
('Utilities','Utility Assistance','Help with energy, water, internet, and essential utility expenses.'),
('Employment','Employment Support','Job search, workforce development, training, and career resources.'),
('Legal','Legal Aid','Free and low-cost civil legal assistance and tenant advocacy.')
) as seed(category,title,description)
where not exists (select 1 from public.resources);

insert into public.community_events (title,event_date,start_time,end_time,location,neighborhood)
select * from (values
('Mt. Tabor Neighborhood Association','2026-09-18'::date,'7:00 PM','9:00 PM','Mt. Tabor Middle School','Mt. Tabor'),
('Community Cleanup: Powell Park','2026-09-20'::date,'9:00 AM','12:00 PM','Powell Park','Creston-Kenilworth'),
('District 3 Office Hours','2026-09-22'::date,'10:00 AM','12:00 PM','Virtual Event','District-wide'),
('Montavilla Farmers Market','2026-09-25'::date,'9:00 AM','2:00 PM','Montavilla Plaza','Montavilla')
) as seed(title,event_date,start_time,end_time,location,neighborhood)
where not exists (select 1 from public.community_events);

insert into public.businesses (name,category,neighborhood,address,description)
select * from (values
('Division Street Coffee','Coffee & Cafe','Richmond','SE Division St, Portland, OR','Independent neighborhood coffee shop.'),
('Montavilla Repair Co.','Home Services','Montavilla','SE Stark St, Portland, OR','Local repair and maintenance services.'),
('Woodstock Books','Retail','Woodstock','SE Woodstock Blvd, Portland, OR','Independent books and community events.'),
('Foster Road Kitchen','Restaurant','Foster-Powell','SE Foster Rd, Portland, OR','Neighborhood restaurant and gathering place.'),
('Tabor Tech Help','Professional Services','Mt. Tabor','Portland, OR','Local technology assistance for residents and small businesses.')
) as seed(name,category,neighborhood,address,description)
where not exists (select 1 from public.businesses);
