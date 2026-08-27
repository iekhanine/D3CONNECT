import {
  Banknote,
  Building2,
  CalendarClock,
  FileText,
  GitBranch,
  GitFork,
  MapPin,
  Target,
  UserRound,
  X,
} from "lucide-react";
import type { Citizen, CivicIssue, Proposal, Topic } from "../types";

interface Props {
  issue?: CivicIssue | null;
  proposal?: Proposal | null;
  civicIssues: CivicIssue[];
  topics: Topic[];
  citizens: Citizen[];
  onClose: () => void;
  onOpenProposal?: (proposal: Proposal) => void;
  proposals?: Proposal[];
}

export default function GovernanceDetailModal({ issue, proposal, civicIssues, topics, citizens, onClose, onOpenProposal, proposals=[] }: Props) {
  if (!issue && !proposal) return null;
  const citizenName = (id?: string) => citizens.find((citizen) => citizen.id === id)?.display_name ?? "Community member";
  const topicName = (id: string) => topics.find((topic) => topic.id === id)?.name ?? "General";

  if (issue) {
    const related = proposals.filter((candidate) => candidate.issue_ids.includes(issue.id));
    return (
      <div className="detail-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
        <article className="detail-modal panel" role="dialog" aria-modal="true" aria-label={issue.title}>
          <div className="detail-modal-head">
            <div><span className="eyebrow">ISSUE DETAIL</span><h2>{issue.title}</h2></div>
            <button className="icon-button" onClick={onClose} aria-label="Close issue detail"><X size={18}/></button>
          </div>
          <div className="detail-meta-row"><span className="topic-pill">{topicName(issue.topic_id)}</span><span className={`issue-status issue-${issue.status.toLowerCase().replaceAll(" ", "-")}`}>{issue.status}</span></div>
          <p className="detail-lead">{issue.summary}</p>
          <section className="detail-section"><h3><FileText size={17}/> What is being discussed</h3><p>{issue.details || issue.summary}</p></section>
          <div className="detail-fact-grid">
            <div><UserRound size={17}/><small>Shared by</small><strong>{citizenName(issue.created_by)}</strong></div>
            <div><MapPin size={17}/><small>Area</small><strong>{issue.neighborhood || "District-wide"}</strong><span>{issue.location_detail || "No specific location"}</span></div>
            <div><GitFork size={17}/><small>Solutions linked</small><strong>{related.length}</strong></div>
          </div>
          <section className="detail-section">
            <h3>Suggested solutions</h3>
            {related.length ? <div className="related-solution-list">{related.map((candidate) => <button key={candidate.id} onClick={() => onOpenProposal?.(candidate)}><div><strong>{candidate.title}</strong><span>{candidate.summary}</span></div><span className={`proposal-status proposal-${candidate.status.toLowerCase().replaceAll(" ", "-")}`}>{candidate.status}</span></button>)}</div> : <p>No solution has been linked to this issue yet.</p>}
          </section>
        </article>
      </div>
    );
  }

  const relatedIssues = civicIssues.filter((candidate) => proposal!.issue_ids.includes(candidate.id));
  return (
    <div className="detail-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <article className="detail-modal proposal-detail-modal panel" role="dialog" aria-modal="true" aria-label={proposal!.title}>
        <div className="detail-modal-head">
          <div><span className="eyebrow">SUGGESTED SOLUTION · FULL DETAIL</span><h2>{proposal!.title}</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="Close solution detail"><X size={18}/></button>
        </div>
        <div className="detail-meta-row"><span className={`proposal-status proposal-${proposal!.status.toLowerCase().replaceAll(" ", "-")}`}>{proposal!.status}</span><span>Maintained by {citizenName(proposal!.maintainer_id)}</span><span>Updated {new Date(proposal!.updated_at).toLocaleDateString()}</span></div>
        <p className="detail-lead">{proposal!.summary}</p>
        <section className="detail-section"><h3><FileText size={17}/> Proposed approach</h3><p>{proposal!.body}</p></section>
        <div className="solution-detail-grid">
          <section><h3><Building2 size={17}/> Implementation</h3><p>{proposal!.implementation_plan || "Implementation details have not been added yet."}</p></section>
          <section><h3><Banknote size={17}/> Funding</h3><p>{proposal!.funding_plan || "Funding details have not been added yet."}</p></section>
          <section><h3><CalendarClock size={17}/> Timeline</h3><p>{proposal!.timeline || "Timeline has not been estimated yet."}</p></section>
          <section><h3><Target size={17}/> Success measures</h3><p>{proposal!.success_metrics || "Success measures have not been defined yet."}</p></section>
        </div>
        <div className="proposal-fact-row">
          <div><small>Estimated cost</small><strong>{proposal!.estimated_cost || "Not yet estimated"}</strong></div>
          <div><small>Lead entity</small><strong>{proposal!.lead_entity || "Not yet assigned"}</strong></div>
          <div><small>Revision activity</small><strong>{proposal!.revision_count} updates · {proposal!.fork_count} alternates</strong></div>
        </div>
        <section className="detail-section"><h3><GitBranch size={17}/> Issues this solution addresses</h3><div className="related-issue-list">{relatedIssues.map((candidate) => <div key={candidate.id}><strong>{candidate.title}</strong><span>{candidate.summary}</span></div>)}</div></section>
      </article>
    </div>
  );
}
