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
  { id: "ci-1", created_by: "citizen-maya", title: "Unsafe crossings along SE Division", summary: "Residents need safer pedestrian crossings at several high-use intersections along the corridor.", topic_id: "topic-transport", neighborhood: "Richmond", status: "Open", created_at: "2026-08-19T14:30:00Z", proposal_count: 3 },
  { id: "ci-2", created_by: "citizen-devon", title: "Long-term neighborhood housing stability", summary: "Explore district-level actions that can improve housing stability without treating affordability as a single-program problem.", topic_id: "topic-housing", neighborhood: "District-wide", status: "In Discussion", created_at: "2026-08-16T18:15:00Z", proposal_count: 2 },
  { id: "ci-3", created_by: "citizen-omar", title: "Tree canopy gaps on high-heat blocks", summary: "Identify blocks with low canopy and establish a transparent prioritization process for planting and maintenance.", topic_id: "topic-parks", neighborhood: "Foster-Powell", status: "Open", created_at: "2026-08-22T09:00:00Z", proposal_count: 1 },
  { id: "ci-4", created_by: "citizen-ruth", title: "Make district project spending easier to audit", summary: "Publish consistent project-level budget, funding source, change, and completion data for residents.", topic_id: "topic-budget", neighborhood: "District-wide", status: "Addressed", created_at: "2026-08-07T12:00:00Z", proposal_count: 4 },
];

// ==========================================================
// GOVERNANCE DEMO 004 — Proposals
// ==========================================================

export const demoProposals: Proposal[] = [
  { id: "prop-1", maintainer_id: "citizen-maya", title: "Division Safe Crossings Package", summary: "Prioritize four crossings using crash risk, transit usage, school access, and pedestrian volume.", body: "Create a ranked crossing improvement package, publish the scoring criteria, and require a public status update every 60 days until completion.", status: "Ready", issue_ids: ["ci-1"], revision_count: 8, fork_count: 2, updated_at: "2026-08-25T20:00:00Z" },
  { id: "prop-2", maintainer_id: "citizen-devon", title: "Neighborhood Housing Stability Dashboard", summary: "Publish a district-level dashboard of housing pressure, available assistance, permitting, and publicly funded projects.", body: "Create a shared public data view that gives residents a common factual baseline before policy is debated.", status: "Review", issue_ids: ["ci-2", "ci-4"], revision_count: 5, fork_count: 1, updated_at: "2026-08-24T17:30:00Z" },
  { id: "prop-3", maintainer_id: "citizen-omar", title: "Heat-Block Tree Priority Standard", summary: "Use heat exposure and canopy gaps to establish a transparent planting priority.", body: "Rank candidate blocks by heat exposure, existing canopy, pedestrian usage, and vulnerable-population access, then publish the queue.", status: "Draft", issue_ids: ["ci-3"], revision_count: 3, fork_count: 0, updated_at: "2026-08-26T09:20:00Z" },
  { id: "prop-4", maintainer_id: "citizen-ruth", title: "Open Project Ledger Standard", summary: "Standardize public reporting for district projects, budgets, change history, and responsible agencies.", body: "Require a common public ledger format for district-facing project information and define minimum update intervals.", status: "Converted to Bill", issue_ids: ["ci-4"], revision_count: 11, fork_count: 3, updated_at: "2026-08-18T11:00:00Z" },
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
// GOVERNANCE DEMO 006 — Proxy assignments
// The demo citizen retains direct responsibility for transport
// and delegates other scopes according to interest/competence.
// ==========================================================

export const demoProxyAssignments: ProxyAssignment[] = [
  { id: "px-1", owner_id: "citizen-you", proxy_id: "citizen-devon", topic_id: "topic-housing", disposition: "return", active: true, created_at: "2026-08-20T12:00:00Z" },
  { id: "px-2", owner_id: "citizen-you", proxy_id: "citizen-omar", topic_id: "topic-parks", disposition: "redelegate", active: true, created_at: "2026-08-20T12:00:00Z" },
  { id: "px-3", owner_id: "citizen-you", proxy_id: "citizen-sam", topic_id: "topic-safety", disposition: "redelegate", active: true, created_at: "2026-08-20T12:00:00Z" },
  { id: "px-4", owner_id: "citizen-you", proxy_id: "citizen-ruth", topic_id: "topic-budget", disposition: "return", active: true, created_at: "2026-08-20T12:00:00Z" },
  { id: "px-5", owner_id: "citizen-you", proxy_id: "citizen-lena", topic_id: "topic-business", disposition: "redelegate", active: true, created_at: "2026-08-20T12:00:00Z" },
  { id: "px-6", owner_id: "citizen-you", proxy_id: "citizen-ruth", topic_id: "topic-civic", disposition: "return", active: true, created_at: "2026-08-20T12:00:00Z" },
  { id: "px-7", owner_id: "citizen-omar", proxy_id: "citizen-ruth", topic_id: "topic-budget", disposition: "redelegate", active: true, created_at: "2026-08-18T12:00:00Z" },
  { id: "px-8", owner_id: "citizen-sam", proxy_id: "citizen-ruth", topic_id: "topic-budget", disposition: "return", active: true, created_at: "2026-08-18T12:00:00Z" },
];
