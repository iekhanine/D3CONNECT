-- ==========================================================
-- D3 CONNECT / POSPROX — NEW DISTRICT TEMPLATE
-- Replace bracketed values. Run after 002_posprox_multi_polity.sql.
-- ==========================================================

-- 1. Create the polity.
insert into public.polities (
  slug,
  product_name,
  jurisdiction_name,
  district_name,
  district_short_name,
  location_name,
  support_threshold,
  removal_threshold,
  secretary_role_name
) values (
  '[polity-slug]',
  '[D4 Connect]',
  '[Jurisdiction Name]',
  '[Full District Name]',
  '[District 4]',
  '[City, State]',
  0.666667,
  0.333333,
  'Secretary of State'
)
on conflict (slug) do nothing;

-- 2. Capture its ID while seeding. Example neighborhood seed:
insert into public.neighborhoods (polity_id, name)
select p.id, seed.name
from public.polities p
cross join (values
  ('[Neighborhood One]'),
  ('[Neighborhood Two]'),
  ('[Neighborhood Three]')
) as seed(name)
where p.slug = '[polity-slug]'
on conflict (polity_id, name) do nothing;

-- 3. Seed governance scopes/topics.
insert into public.governance_topics (polity_id, name, description)
select p.id, seed.name, seed.description
from public.polities p
cross join (values
  ('Transportation','Streets, transit, walking, cycling, traffic, and mobility.'),
  ('Housing','Housing supply, affordability, tenant policy, and shelter.'),
  ('Parks & Environment','Parks, trees, green space, climate, and environmental quality.'),
  ('Public Safety','Emergency response, safety policy, prevention, and resilience.'),
  ('Budget & Finance','Public spending, revenue, procurement, and fiscal policy.'),
  ('Small Business','Local commerce, permitting, business districts, and economic activity.'),
  ('Civic Administration','Elections, public process, transparency, and administration.')
) as seed(name, description)
where p.slug = '[polity-slug]'
on conflict (polity_id, name) do nothing;

-- 4. Deploy the same codebase with environment variables such as:
-- VITE_POLITY_SLUG=[polity-slug]
-- VITE_PRODUCT_NAME=[D4 Connect]
-- VITE_DISTRICT_SHORT_CODE=[D4]
-- VITE_DISTRICT_NAME=[Full District Name]
-- VITE_DISTRICT_SHORT_NAME=[District 4]
-- VITE_LOCATION_NAME=[City, State]
--
-- No React/TypeScript source changes are required.
