import type { Bill, Citizen, CivicIssue, Proposal, ProxyAssignment, Topic } from "../types";

// ==========================================================
// GOVERNANCE DEMO 001 — Topics
// ==========================================================

export const demoTopics: Topic[] = [
  { id: "topic-transport", name: "Transportation", description: "Streets, transit, walking, cycling, traffic, and mobility." },
  { id: "topic-housing", name: "Housing", description: "Housing supply, affordability, tenant policy, and shelter." },
  { id: "topic-parks", name: "Parks & Environment", description: "Parks, trees, green space, climate, and environmental quality." },
  { id: "topic-safety", name: "Public Safety", description: "Emergency response, safety policy, prevention, and resilience." },
  { id: "topic-budget", name: "Budget & Finance", description: "Public spending, revenue, procurement, and fiscal policy." },
  { id: "topic-business", name: "Small Business", description: "Local commerce, permitting, business districts, and economic activity." },
  { id: "topic-civic", name: "Civic Administration", description: "Elections, public process, transparency, and administration." },
];

// ==========================================================
// GOVERNANCE DEMO 002 — Citizens
// Fictional prototype identities only.
// ==========================================================

export const demoCitizens: Citizen[] = [
  { id: "citizen-you", display_name: "You (Demo Citizen)", neighborhood: "Richmond", bio: "Prototype participant", active: true },
  { id: "citizen-maya", display_name: "Maya Chen", neighborhood: "Montavilla", bio: "Transit and pedestrian-access volunteer", active: true },
  { id: "citizen-devon", display_name: "Devon Brooks", neighborhood: "Buckman", bio: "Housing policy researcher", active: true },
  { id: "citizen-lena", display_name: "Lena Ortiz", neighborhood: "Woodstock", bio: "Neighborhood small-business owner", active: true },
  { id: "citizen-omar", display_name: "Omar Reed", neighborhood: "Mt. Tabor", bio: "Parks and environmental advocate", active: true },
  { id: "citizen-ruth", display_name: "Ruth Park", neighborhood: "Foster-Powell", bio: "Public budgeting volunteer", active: true },
  { id: "citizen-sam", display_name: "Sam Ellis", neighborhood: "Sunnyside", bio: "Community safety organizer", active: true },
];

// ==========================================================
// GOVERNANCE DEMO 003 — Issues
// ==========================================================

export const demoCivicIssues: CivicIssue[] = [
  { id: "ci-1", created_by: "citizen-maya", title: "Unsafe crossings along SE Division", summary: "Residents need safer pedestrian crossings at several high-use intersections along the corridor.", details: "Residents have reported long crossing distances, inconsistent visibility, and conflicts between turning vehicles and people walking near several transit stops. The issue is being discussed as a corridor problem rather than a request for a single intersection fix.", topic_id: "topic-transport", neighborhood: "Richmond", location_detail: "SE Division corridor", status: "Open", created_at: "2026-08-19T14:30:00Z", proposal_count: 1 },
  { id: "ci-2", created_by: "citizen-devon", title: "Long-term neighborhood housing stability", summary: "Explore district-level actions that can improve housing stability without treating affordability as a single-program problem.", details: "The discussion covers displacement pressure, access to assistance, permitting visibility, and how residents can understand housing trends before a crisis reaches their household.", topic_id: "topic-housing", neighborhood: "District-wide", status: "In Discussion", created_at: "2026-08-16T18:15:00Z", proposal_count: 1 },
  { id: "ci-3", created_by: "citizen-omar", title: "Tree canopy gaps on high-heat blocks", summary: "Identify blocks with low canopy and establish a transparent prioritization process for planting and maintenance.", details: "Residents want the planting queue to reflect heat exposure, existing canopy, pedestrian activity, and access to shade rather than relying only on requests submitted first.", topic_id: "topic-parks", neighborhood: "Foster-Powell", status: "Open", created_at: "2026-08-22T09:00:00Z", proposal_count: 1 },
  { id: "ci-4", created_by: "citizen-ruth", title: "Make district project spending easier to audit", summary: "Publish consistent project-level budget, funding source, change, and completion data for residents.", details: "Residents can find project information today, but it is spread across different systems and formats. The requested outcome is one consistent public view showing original budget, current budget, funding source, responsible agency, change history, and expected completion.", topic_id: "topic-budget", neighborhood: "District-wide", status: "Addressed", created_at: "2026-08-07T12:00:00Z", proposal_count: 1 },
];

// ==========================================================
// GOVERNANCE DEMO 004 — Proposals
// ==========================================================

export const demoProposals: Proposal[] = [
  {
    id: "prop-1", maintainer_id: "citizen-maya", title: "Division Safe Crossings Package",
    summary: "Prioritize four crossings using crash risk, transit usage, school access, and pedestrian volume.",
    body: "Create a ranked crossing improvement package, publish the scoring criteria, and require a public status update every 60 days until completion.",
    implementation_plan: "PBOT would validate four candidate intersections, score each location against published safety criteria, select treatments through an expedited engineering review, and publish a 60-day implementation dashboard. Temporary paint, signage, and daylighting may be used before permanent construction where appropriate.",
    funding_plan: "Use existing pedestrian-safety and Vision Zero program funds for design and quick-build work. Larger capital construction would be submitted into the next transportation capital allocation cycle. Any grant funding would be shown separately in the public ledger.",
    estimated_cost: "$350,000-$900,000 depending on final treatments",
    timeline: "90 days for prioritization and design; 6-18 months for phased implementation",
    lead_entity: "Portland Bureau of Transportation (PBOT)",
    success_metrics: "Crossing completion, vehicle yielding rate, reported near-misses, pedestrian wait time, and injury-crash trends.",
    status: "Ready", issue_ids: ["ci-1"], revision_count: 8, fork_count: 2, updated_at: "2026-08-25T20:00:00Z"
  },
  {
    id: "prop-2", maintainer_id: "citizen-devon", title: "Neighborhood Housing Stability Dashboard",
    summary: "Publish a district-level dashboard of housing pressure, available assistance, permitting, and publicly funded projects.",
    body: "Create a shared public data view that gives residents a common factual baseline before policy is debated.",
    implementation_plan: "Combine existing public housing, permitting, eviction-prevention, and development datasets into a district dashboard. Publish source definitions and update schedules so residents can understand what each measure means and how current it is.",
    funding_plan: "Prototype using existing open-data and staff capacity. Ongoing hosting and maintenance would be included in the district communications/data budget or funded through a small civic-tech services contract.",
    estimated_cost: "$25,000-$60,000 first-year implementation",
    timeline: "120-day pilot followed by quarterly review",
    lead_entity: "District office with Portland Housing Bureau data support",
    success_metrics: "Data freshness, dashboard usage, assistance referrals, resident comprehension, and number of datasets published with documented definitions.",
    status: "Review", issue_ids: ["ci-2", "ci-4"], revision_count: 5, fork_count: 1, updated_at: "2026-08-24T17:30:00Z"
  },
  {
    id: "prop-3", maintainer_id: "citizen-omar", title: "Heat-Block Tree Priority Standard",
    summary: "Use heat exposure and canopy gaps to establish a transparent planting priority.",
    body: "Rank candidate blocks by heat exposure, existing canopy, pedestrian usage, and vulnerable-population access, then publish the queue.",
    implementation_plan: "Create a weighted scoring model using available heat-island, canopy, sidewalk, and pedestrian data. Publish the methodology, generate an annual planting queue, and allow residents to flag missing local conditions before the list is finalized.",
    funding_plan: "Use existing urban forestry planting appropriations first, then pursue state climate-resilience and utility partnership grants for additional planting and watering capacity.",
    estimated_cost: "$1,200-$2,500 per planted tree including establishment care",
    timeline: "Scoring standard in 90 days; first prioritized planting season within 12 months",
    lead_entity: "Portland Parks & Recreation Urban Forestry",
    success_metrics: "Trees planted in top-priority blocks, three-year survival rate, canopy gain, and reduction in high-heat blocks lacking shade.",
    status: "Draft", issue_ids: ["ci-3"], revision_count: 3, fork_count: 0, updated_at: "2026-08-26T09:20:00Z"
  },
  {
    id: "prop-4", maintainer_id: "citizen-ruth", title: "Open Project Ledger Standard",
    summary: "Standardize public reporting for district projects, budgets, change history, and responsible agencies.",
    body: "Require a common public ledger format for district-facing project information and define minimum update intervals.",
    implementation_plan: "Adopt a common project record schema, designate an owner for every published project, and require material budget, schedule, or scope changes to be logged with a date and explanation.",
    funding_plan: "Use existing project-management systems as source data. Public presentation can be funded as a shared district transparency function with minimal incremental software cost.",
    estimated_cost: "$15,000-$40,000 setup plus staff maintenance",
    timeline: "Six-month rollout with the first ten projects published in the initial 60 days",
    lead_entity: "District administration and participating city bureaus",
    success_metrics: "Percentage of active projects published, update compliance, time-to-post changes, and resident use of project records.",
    status: "Converted to Bill", issue_ids: ["ci-4"], revision_count: 11, fork_count: 3, updated_at: "2026-08-18T11:00:00Z"
  },
];

// ==========================================================
// GOVERNANCE DEMO 005 — Bills and continuously attached support
// ==========================================================

export const demoBills: Bill[] = [
  { id: "bill-1", proposal_id: "prop-4", title: "Open Project Ledger Standard", summary: "Require consistent public project reporting for district-facing work.", kind: "Policy", state: "In Force", support_count: 5, electorate_count: 7, support_percent: 71.43, created_at: "2026-08-18T11:30:00Z", last_state_change_at: "2026-08-23T08:00:00Z", current_user_supports: true },
  { id: "bill-2", proposal_id: "prop-1", title: "Division Safe Crossings Package", summary: "Adopt the ranked package and publish implementation progress.", kind: "Policy", state: "Voting", support_count: 4, electorate_count: 7, support_percent: 57.14, created_at: "2026-08-26T18:00:00Z", current_user_supports: false },
  { id: "bill-3", proposal_id: "prop-2", title: "Housing Data Transparency Pilot", summary: "Operate a public district housing-stability data pilot for twelve months.", kind: "Policy", state: "Out of Force", support_count: 2, electorate_count: 7, support_percent: 28.57, created_at: "2026-07-21T13:00:00Z", last_state_change_at: "2026-08-20T13:00:00Z", current_user_supports: false },
];

// ==========================================================
// GOVERNANCE DEMO 006 — General proxy assignments
// A proxy applies to the citizen's voting authority as a whole.
// The proposed holder must explicitly accept before it transfers.
// ==========================================================

export const demoProxyAssignments: ProxyAssignment[] = [
  { id: "px-1", owner_id: "citizen-you", proxy_id: "citizen-devon", status: "pending", active: true, created_at: "2026-08-20T12:00:00Z" },
  { id: "px-2", owner_id: "citizen-maya", proxy_id: "citizen-you", status: "pending", active: true, created_at: "2026-08-26T17:25:00Z" },
  { id: "px-3", owner_id: "citizen-omar", proxy_id: "citizen-you", status: "accepted", active: true, created_at: "2026-08-18T12:00:00Z", responded_at: "2026-08-18T13:20:00Z" },
];
