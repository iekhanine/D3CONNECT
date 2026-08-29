export type ViewKey =
  | "home"
  | "about"
  | "civic-issues"
  | "proposals"
  | "bills"
  | "proxy"
  | "delegation"
  | "admin";

export interface Neighborhood {
  id: string;
  name: string;
}

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
  details?: string | null;
  topic_id: string;
  neighborhood?: string | null;
  location_detail?: string | null;
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
  implementation_plan?: string | null;
  funding_plan?: string | null;
  estimated_cost?: string | null;
  timeline?: string | null;
  lead_entity?: string | null;
  success_metrics?: string | null;
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

export type ProxyStatus = "pending" | "accepted" | "declined";

export interface ProxyAssignment {
  id: string;
  polity_id?: string;
  owner_id: string;
  proxy_id: string;
  status: ProxyStatus;
  active: boolean;
  created_at: string;
  responded_at?: string | null;
}

export interface GovernanceData {
  topics: Topic[];
  citizens: Citizen[];
  civicIssues: CivicIssue[];
  proposals: Proposal[];
  bills: Bill[];
  proxyAssignments: ProxyAssignment[];
}
