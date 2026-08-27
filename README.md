# D3 Connect — PosProx Prototype

D3 Connect is the first district deployment of a reusable PosProx civic-governance engine.

The prototype combines the existing District 3 community portal with a governance workflow based on:

- Issues anyone may raise
- Proposals that may address one or more Issues
- Git-style proposal revision/fork concepts
- Bills created from locked proposal versions
- Continuously attached/revocable support
- 2/3 activation and 1/3 removal thresholds
- Topic-scoped proxy delegation
- Return-to-owner or redelegate proxy instructions
- A visible delegation network

## Run locally

```powershell
npm install
npm run dev
```

## Supabase

1. Run `supabase/schema.sql` if the original D3 Connect community tables do not exist yet.
2. Run `supabase/002_posprox_multi_polity.sql`.
3. Copy `.env.example` to `.env.local` and supply the Supabase URL/key.

The PosProx migration makes the existing community content polity-aware and creates the governance tables.

## Reusing the engine for another district

The application is intentionally not hard-coded to Portland District 3 as a product boundary.

The active deployment is selected with:

```text
VITE_POLITY_SLUG=portland-d3
```

To deploy another district:

1. Insert a new row into `polities` with a unique slug.
2. Seed that polity's neighborhoods and governance topics.
3. Add/import that district's community and civic content using its `polity_id`.
4. Add the display configuration in `src/config/polity.ts` (or move configuration entirely into the database in the next phase).
5. Deploy the same source code with `VITE_POLITY_SLUG=<new-slug>`.

No application fork should be necessary.

## Prototype limitation

The schema is ready to distinguish direct and proxy-derived bill votes, but recursive proxy resolution is not yet a production voting engine. The current UI demonstrates proxy scopes, chaining instructions, delegation paths, attached support, and threshold hysteresis. A later phase should implement server-side recursive proxy resolution with cycle detection, audit history, authenticated citizen membership, and cryptographically/auditably safe vote processing.

## Security

The included RLS policies are intentionally permissive for a working prototype. Before any real civic deployment, implement authentication, verified polity membership, protected governance mutations, anti-abuse controls, immutable audit events, conflict/cycle detection, and administrative authority boundaries.
