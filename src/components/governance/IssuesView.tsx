import { ChevronRight, Plus, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { CivicIssue, Proposal } from "../../types";
import GovernanceDetailModal from "../GovernanceDetailModal";
import NeighborhoodScopePicker from "./NeighborhoodScopePicker";
import PageTitle from "./PageTitle";
import type { GovernanceViewProps as Props } from "./types";

export default function IssuesView({ civicIssues, proposals, topics, neighborhoods, citizens, onCreateIssue }: Props) {
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [topicId, setTopicId] = useState(topics[0]?.id ?? "");
  const [neighborhood, setNeighborhood] = useState("District-Wide");
  const [locationDetail, setLocationDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [selectedIssue, setSelectedIssue] = useState<CivicIssue | null>(null);
  const [selectedIssueProposal, setSelectedIssueProposal] = useState<Proposal | null>(null);

  // Initialize the topic after asynchronous topic loading.
  useEffect(() => {
    if (!topicId && topics.length > 0) {
      setTopicId(topics[0].id);
    }
  }, [topicId, topics]);

  const visible = useMemo(() => civicIssues.filter((issue) => `${issue.title} ${issue.summary}`.toLowerCase().includes(query.toLowerCase())), [civicIssues, query]);
  const topicName = (id: string) => topics.find((topic) => topic.id === id)?.name ?? "General";
  const citizenName = (id: string) => citizens.find((citizen) => citizen.id === id)?.display_name ?? "Community member";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!topicId) {
      setSubmitError("Please choose what this issue is about.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      await onCreateIssue({
        title,
        summary,
        topic_id: topicId,
        neighborhood: neighborhood || "District-Wide",
        location_detail: locationDetail.trim() || null,
      });
      setTitle("");
      setSummary("");
      setNeighborhood("District-Wide");
      setLocationDetail("");
      setQuery("");
      setCreating(false);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "The issue could not be saved. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-view governance-view">
      <PageTitle
        eyebrow="START HERE · PROBLEMS & IDEAS"
        title="What needs attention in your neighborhood?"
        text="Report a problem, concern, or improvement you want to see. You do not need to know which City office handles it, and you do not need to have the solution yet."
        action={<button className="primary-button" onClick={() => { setSubmitError(""); setCreating(true); }}><Plus size={16}/> Share an Issue</button>}
      />

      {creating && (
        <form className="governance-form panel" onSubmit={submit}>
          <div className="form-heading"><div><span className="eyebrow">SHARE AN ISSUE</span><h2>Tell the community what is happening</h2></div><button type="button" className="icon-button" onClick={() => setCreating(false)}><X size={18}/></button></div>
          <div className="form-grid">
            <label className="full">What should we call this?<input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Example: Unsafe crossing at SE 82nd and Division"/></label>
            <label>What is this about?<select value={topicId} onChange={(e) => setTopicId(e.target.value)} required disabled={!topics.length}>{!topics.length && <option value="">Loading topics…</option>}{topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}</select></label>
            <NeighborhoodScopePicker neighborhoods={neighborhoods} value={neighborhood} onChange={setNeighborhood}/>
            <label className="full">Street / cross street <span className="optional-label">Optional</span><textarea className="location-detail-input" rows={2} value={locationDetail} onChange={(e) => setLocationDetail(e.target.value)} placeholder="Example: SE 82nd Ave & Division St"/></label>
            <label className="full">Tell us what is going on<textarea rows={5} value={summary} onChange={(e) => setSummary(e.target.value)} required placeholder="Describe what you are seeing, why it matters, and who it affects. Plain language is fine."/></label>
            {submitError && <div className="full form-error" role="alert">{submitError}</div>}
            <div className="form-actions full"><button type="button" className="secondary-button" onClick={() => setCreating(false)} disabled={submitting}>Cancel</button><button className="primary-button" disabled={submitting || !topicId}>{submitting ? "Posting…" : "Post Issue"}</button></div>
          </div>
        </form>
      )}

      <div className="toolbar-row"><label className="search-box"><Search size={18}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search problems and ideas"/></label><div className="result-count">{visible.length} issues</div></div>

      <div className="governance-card-list">
        {visible.map((issue) => (
          <button type="button" className="governance-card governance-card-button" key={issue.id} onClick={() => setSelectedIssue(issue)}>
            <div className="governance-card-meta"><span className="topic-pill">{topicName(issue.topic_id)}</span><span className={`issue-status issue-${issue.status.toLowerCase().replaceAll(" ", "-")}`}>{issue.status}</span></div>
            <h3>{issue.title}</h3><p>{issue.summary}</p>
            <div className="governance-card-footer"><span>Shared by {citizenName(issue.created_by)}</span><span>{issue.neighborhood || "District-Wide"}{issue.location_detail ? ` · ${issue.location_detail}` : ""}</span><strong>{issue.proposal_count} solution idea{issue.proposal_count === 1 ? "" : "s"}</strong></div>
            <span className="card-open-hint">Open issue details <ChevronRight size={14}/></span>
          </button>
        ))}
      </div>
      <GovernanceDetailModal issue={selectedIssue} civicIssues={civicIssues} topics={topics} citizens={citizens} proposals={proposals} onOpenProposal={(proposal) => { setSelectedIssue(null); setSelectedIssueProposal(proposal); }} onClose={() => setSelectedIssue(null)}/>
      <GovernanceDetailModal proposal={selectedIssueProposal} civicIssues={civicIssues} topics={topics} citizens={citizens} onClose={() => setSelectedIssueProposal(null)}/>
    </div>
  );
}
