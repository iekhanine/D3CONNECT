import type {
  Bill,
  Citizen,
  CivicIssue,
  Neighborhood,
  Proposal,
  ProxyAssignment,
  ProxyStatus,
  Topic,
  ViewKey,
} from "../../types";

export interface GovernanceViewProps {
  view: ViewKey;
  topics: Topic[];
  neighborhoods: Neighborhood[];
  citizens: Citizen[];
  civicIssues: CivicIssue[];
  proposals: Proposal[];
  bills: Bill[];
  proxyAssignments: ProxyAssignment[];
  currentCitizenId: string;
  onCreateIssue: (input: {
    title: string;
    summary: string;
    topic_id: string;
    neighborhood?: string | null;
    location_detail?: string | null;
  }) => Promise<void>;
  onCreateProposal: (input: {
    title: string;
    summary: string;
    body: string;
    issue_ids: string[];
  }) => Promise<void>;
  onToggleBillSupport: (billId: string, support: boolean) => Promise<void>;
  onSaveProxy: (proxyId: string) => Promise<void>;
  onRemoveProxy: (ownerId?: string) => Promise<void>;
  onRespondProxy: (
    assignmentId: string,
    status: Exclude<ProxyStatus, "pending">,
  ) => Promise<void>;
  onGenerateDemoProxyRequests: () => Promise<void>;
  onNavigate: (view: ViewKey) => void;
}
