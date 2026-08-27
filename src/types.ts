// ==========================================================
// TYPES 001 — Shared D3 Connect / PosProx application types
// ==========================================================

export type ViewKey =
  | "home"
  | "civic-issues"
  | "proposals"
  | "bills"
  | "proxy"
  | "delegation"
  | "projects"
  | "resources"
  | "calendar"
  | "businesses"
  | "feedback"
  | "about";

export type ProjectStatus = "In Progress" | "Planned" | "Permitting" | "Scheduled" | "Design" | "Complete";

export interface Neighborhood {
  id: string;
  name: string;
}

export interface Project {
  id: string;
  name: string;
  neighborhood: string;
  agency: string;
  budget: number;
  status: ProjectStatus;
  est_completion: string;
  description?: string | null;
}

export interface Resource {
  id: string;
  category: string;
  title: string;
  description: string;
  url?: string | null;
  phone?: string | null;
  neighborhood?: string | null;
}

export interface CommunityEvent {
  id: string;
  title: string;
  event_date: string;
  start_time: string;
  end_time?: string | null;
  location: string;
  neighborhood?: string | null;
}

export interface Business {
  id: string;
  name: string;
  category: string;
  neighborhood: string;
  address?: string | null;
  website?: string | null;
  description?: string | null;
}

export interface IssueCategory {
  id: string;
  label: string;
  helper: string;
}

// ==========================================================
// TYPES 002 — Reusable polity configuration
// ==========================================================

export interface PolityConfig {
  slug: string;
  productName: string;
  shortName: string;
  jurisdictionName: string;
  districtName: string;
  districtShortName: string;
  locationName: string;
  tagline: string;
  communityTagline: string;
  supportThreshold: number;
  removalThreshold: number;
  secretaryRoleName: string;
  demoCitizenId: string;
}

// ==========================================================
// TYPES 003 — PosProx domain model
// ==========================================================

export interface Topic {
  id: string;
  polity_id?: string;
  name: string;
  description: string;
  color_key?: string | null;
}

export interface Citizen {
  id: string;
  polity_id?: string;
  display_name: string;
  neighborhood: string;
  bio?: string | null;
  active: boolean;
}

export type CivicIssueStatus = "Open" | "In Discussion" | "Addressed" | "Closed";

export interface CivicIssue {
  id: string;
  polity_id?: string;
  created_by: string;
  title: string;
  summary: string;
  topic_id: string;
  neighborhood?: string | null;
  status: CivicIssueStatus;
  created_at: string;
  proposal_count: number;
}

export type ProposalStatus = "Draft" | "Review" | "Ready" | "Converted to Bill";

export interface Proposal {
  id: string;
  polity_id?: string;
  maintainer_id: string;
  title: string;
  summary: string;
  body: string;
  status: ProposalStatus;
  issue_ids: string[];
  parent_proposal_id?: string | null;
  revision_count: number;
  fork_count: number;
  updated_at: string;
}

export type BillState = "Voting" | "In Force" | "Out of Force";
export type BillKind = "Law" | "Policy";

export interface Bill {
  id: string;
  polity_id?: string;
  proposal_id: string;
  title: string;
  summary: string;
  kind: BillKind;
  state: BillState;
  support_count: number;
  electorate_count: number;
  support_percent: number;
  created_at: string;
  last_state_change_at?: string | null;
  current_user_supports?: boolean;
}

export type ProxyDisposition = "return" | "redelegate";

export interface ProxyAssignment {
  id: string;
  polity_id?: string;
  owner_id: string;
  proxy_id: string;
  topic_id?: string | null;
  disposition: ProxyDisposition;
  active: boolean;
  created_at: string;
}

export interface ProxyRoute {
  topic_id: string;
  topic_name: string;
  direct: boolean;
  proxy_id?: string;
  proxy_name?: string;
  disposition?: ProxyDisposition;
  downstream_proxy_name?: string | null;
}

export interface GovernanceData {
  topics: Topic[];
  citizens: Citizen[];
  civicIssues: CivicIssue[];
  proposals: Proposal[];
  bills: Bill[];
  proxyAssignments: ProxyAssignment[];
}
