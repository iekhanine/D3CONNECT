import { ChevronRight, GitBranch, GitFork, Plus, Search, X } from "lucide-react";
import { useState } from "react";
import type { Proposal } from "../../types";
import GovernanceDetailModal from "../GovernanceDetailModal";
import PageTitle from "./PageTitle";
import type { GovernanceViewProps as Props } from "./types";

export default function ProposalsView({ proposals, civicIssues, citizens, onCreateProposal }: Props) {
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [issueIds, setIssueIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const visible = proposals.filter((proposal) => `${proposal.title} ${proposal.summary}`.toLowerCase().includes(query.toLowerCase()));
  const citizenName = (id: string) => citizens.find((citizen) => citizen.id === id)?.display_name ?? "Community member";

  function toggleIssue(id: string) { setIssueIds((current) => current.includes(id) ? current.filter((x) => x !== id) : [...current, id]); }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    try {
      await onCreateProposal({ title, summary, body, issue_ids: issueIds });
      setTitle(""); setSummary(""); setBody(""); setIssueIds([]); setCreating(false);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "The solution could not be saved. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-view governance-view">
      <PageTitle eyebrow="STEP 2 · SUGGESTED SOLUTIONS" title="How could this be fixed or improved?" text="If you have an idea for solving an issue, share it here. Other people can review it and improve it before it moves forward for community support." action={<button className="primary-button" onClick={() => { setSubmitError(""); setCreating(true); }}><Plus size={16}/> Suggest a Solution</button>}/>
      {creating && (
        <form className="governance-form panel" onSubmit={submit}>
          <div className="form-heading"><div><span className="eyebrow">SUGGEST A SOLUTION</span><h2>Share a way forward</h2></div><button type="button" className="icon-button" onClick={() => setCreating(false)}><X size={18}/></button></div>
          <div className="form-grid">
            <label className="full">Solution title<input required value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Give your idea a short, clear name"/></label>
            <label className="full">Quick summary<input required value={summary} onChange={(e)=>setSummary(e.target.value)} placeholder="Explain the idea in one sentence"/></label>
            <label className="full">How would it work?<textarea required rows={6} value={body} onChange={(e)=>setBody(e.target.value)} placeholder="Describe what should happen, who would be involved, and what result you want to see."/></label>
            <fieldset className="issue-selector full"><legend>Which issue does this help solve?</legend>{civicIssues.map((issue)=><label key={issue.id}><input type="checkbox" checked={issueIds.includes(issue.id)} onChange={()=>toggleIssue(issue.id)}/><span>{issue.title}</span></label>)}</fieldset>
            {submitError && <div className="full form-error" role="alert">{submitError}</div>}
            <div className="form-actions full"><button type="button" className="secondary-button" onClick={() => setCreating(false)} disabled={submitting}>Cancel</button><button className="primary-button" disabled={!issueIds.length || submitting}>{submitting ? "Saving…" : "Share Solution"}</button></div>
          </div>
        </form>
      )}
      <div className="toolbar-row"><label className="search-box"><Search size={18}/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search suggested solutions"/></label><div className="result-count">{visible.length} solutions</div></div>
      <div className="proposal-grid">
        {visible.map((proposal)=><button type="button" className="proposal-card proposal-card-button panel" key={proposal.id} onClick={() => setSelectedProposal(proposal)}><div className="governance-card-meta"><span className={`proposal-status proposal-${proposal.status.toLowerCase().replaceAll(" ", "-")}`}>{proposal.status}</span><span>{proposal.issue_ids.length} related issue{proposal.issue_ids.length===1?"":"s"}</span></div><h3>{proposal.title}</h3><p>{proposal.summary}</p><div className="proposal-code"><GitBranch size={15}/><span>{proposal.revision_count} updates</span><GitFork size={15}/><span>{proposal.fork_count} alternate versions</span></div><div className="proposal-preview-facts"><span><strong>{proposal.estimated_cost || "Cost TBD"}</strong><small>Estimated cost</small></span><span><strong>{proposal.timeline || "Timeline TBD"}</strong><small>Timeline</small></span></div><div className="governance-card-footer"><span>Started by {citizenName(proposal.maintainer_id)}</span><span>Updated {new Date(proposal.updated_at).toLocaleDateString()}</span></div><span className="card-open-hint">View implementation & funding <ChevronRight size={14}/></span></button>)}
      </div>
      <GovernanceDetailModal proposal={selectedProposal} civicIssues={civicIssues} topics={[]} citizens={citizens} onClose={() => setSelectedProposal(null)}/>
    </div>
  );
}
