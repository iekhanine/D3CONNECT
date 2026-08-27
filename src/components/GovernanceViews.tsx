import {
  Check,
  ChevronDown,
  ChevronRight,
  GitBranch,
  GitFork,
  MapPin,
  Network,
  Plus,
  Search,
  ShieldCheck,
  UserRoundCog,
  Users,
  Vote,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { percent, polity } from "../config/polity";
import GovernanceDetailModal from "./GovernanceDetailModal";
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
} from "../types";

interface Props {
  view: ViewKey;
  topics: Topic[];
  neighborhoods: Neighborhood[];
  citizens: Citizen[];
  civicIssues: CivicIssue[];
  proposals: Proposal[];
  bills: Bill[];
  proxyAssignments: ProxyAssignment[];
  currentCitizenId: string;
  onCreateIssue: (input: { title: string; summary: string; topic_id: string; neighborhood?: string | null; location_detail?: string | null }) => Promise<void>;
  onCreateProposal: (input: { title: string; summary: string; body: string; issue_ids: string[] }) => Promise<void>;
  onToggleBillSupport: (billId: string, support: boolean) => Promise<void>;
  onSaveProxy: (proxyId: string) => Promise<void>;
  onRemoveProxy: (ownerId?: string) => Promise<void>;
  onRespondProxy: (assignmentId: string, status: Exclude<ProxyStatus, "pending">) => Promise<void>;
  onNavigate: (view: ViewKey) => void;
}

export default function GovernanceViews(props: Props) {
  switch (props.view) {
    case "civic-issues": return <IssuesView {...props} />;
    case "proposals": return <ProposalsView {...props} />;
    case "bills": return <BillsView {...props} />;
    case "proxy": return <ProxyView {...props} />;
    case "delegation": return <DelegationView {...props} />;
    default: return null;
  }
}

function PageTitle({ eyebrow, title, text, action }: { eyebrow: string; title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="governance-page-title">
      <div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{text}</p></div>
      {action}
    </div>
  );
}

function NeighborhoodScopePicker({
  neighborhoods,
  value,
  onChange,
}: {
  neighborhoods: Neighborhood[];
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const filteredNeighborhoods = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return neighborhoods;
    return neighborhoods.filter((neighborhood) =>
      neighborhood.name.toLowerCase().includes(normalized),
    );
  }, [neighborhoods, query]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (open) {
      window.requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open]);

  function choose(nextValue: string) {
    onChange(nextValue);
    setOpen(false);
    setQuery("");
  }

  return (
    <div className={`issue-neighborhood-picker${open ? " open" : ""}`} ref={rootRef}>
      <span className="issue-field-label">Neighborhood</span>

      <button
        type="button"
        className="issue-neighborhood-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="issue-neighborhood-trigger-icon"><MapPin size={17}/></span>
        <span>{value || "District-Wide"}</span>
        <ChevronDown size={17} className="issue-neighborhood-chevron"/>
      </button>

      {open && (
        <div className="issue-neighborhood-menu" role="listbox" aria-label="Choose neighborhood">
          <div className="issue-neighborhood-search">
            <Search size={16}/>
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search neighborhoods"
              aria-label="Search neighborhoods"
            />
          </div>

          <button
            type="button"
            role="option"
            aria-selected={value === "District-Wide"}
            className={`issue-neighborhood-option district-wide${value === "District-Wide" ? " selected" : ""}`}
            onClick={() => choose("District-Wide")}
          >
            <span><strong>District-Wide</strong><small>Applies across District 3</small></span>
            {value === "District-Wide" && <Check size={17}/>} 
          </button>

          <div className="issue-neighborhood-divider" />

          {filteredNeighborhoods.length ? (
            filteredNeighborhoods.map((neighborhood) => (
              <button
                type="button"
                role="option"
                aria-selected={value === neighborhood.name}
                key={neighborhood.id}
                className={`issue-neighborhood-option${value === neighborhood.name ? " selected" : ""}`}
                onClick={() => choose(neighborhood.name)}
              >
                <span>{neighborhood.name}</span>
                {value === neighborhood.name && <Check size={17}/>} 
              </button>
            ))
          ) : (
            <div className="issue-neighborhood-empty">No neighborhoods match “{query}”.</div>
          )}
        </div>
      )}
    </div>
  );
}

function IssuesView({ civicIssues, proposals, topics, neighborhoods, citizens, onCreateIssue }: Props) {
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

  // Topics are loaded asynchronously. The original prototype initialized
  // topicId while the list was still empty, leaving the controlled select
  // with an empty value even though the browser appeared to show a topic.
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

function ProposalsView({ proposals, civicIssues, citizens, onCreateProposal }: Props) {
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

function BillsView({ bills, onToggleBillSupport }: Props) {
  return (
    <div className="page-view governance-view">
      <PageTitle eyebrow="STEP 3 · DECISIONS & VOTING" title="See what is ready for community support" text={`When a solution is ready, it becomes a community decision people can support. At ${percent(polity.supportThreshold)} support, it takes effect. If support later falls below ${percent(polity.removalThreshold)}, it stops being active.`}/>
      <div className="threshold-explainer panel"><div><span>0%</span><strong>No longer active</strong><small>If support for an active decision falls below {percent(polity.removalThreshold)}, it stops being active.</small></div><div className="threshold-gap"><span>{percent(polity.removalThreshold)}</span><strong>Stays as-is</strong><small>Between the two levels, the current status does not change.</small></div><div><span>{percent(polity.supportThreshold)}</span><strong>Takes effect</strong><small>At or above this level, a community decision becomes active.</small></div></div>
      <div className="bill-list">
        {bills.map((bill)=><article className="bill-card panel" key={bill.id}><div className="bill-card-head"><div><span className={`state-badge state-${bill.state.toLowerCase().replaceAll(" ", "-")}`}>{bill.state}</span><span className="bill-kind">{bill.kind}</span><h3>{bill.title}</h3><p>{bill.summary}</p></div><div className="support-big"><strong>{bill.support_percent.toFixed(1)}%</strong><small>{bill.support_count.toLocaleString()} people supporting</small></div></div><div className="support-meter"><div className="meter-track"><span className="meter-fill" style={{width:`${Math.min(100,bill.support_percent)}%`}}/><i className="threshold-marker removal" style={{left:`${polity.removalThreshold*100}%`}}/><i className="threshold-marker activation" style={{left:`${polity.supportThreshold*100}%`}}/></div><div className="meter-labels"><span>0%</span><span>{percent(polity.removalThreshold)}</span><span>{percent(polity.supportThreshold)}</span><span>100%</span></div></div><div className="bill-actions"><span>{bill.current_user_supports ? "You currently support this decision." : "You have not supported this decision."}</span>{bill.current_user_supports?<button className="secondary-button" onClick={()=>onToggleBillSupport(bill.id,false)}>Stop Supporting</button>:<button className="primary-button" onClick={()=>onToggleBillSupport(bill.id,true)}><Vote size={15}/> Support This</button>}</div></article>)}
      </div>
    </div>
  );
}

function ProxyView({ citizens, proxyAssignments, currentCitizenId, onSaveProxy, onRemoveProxy, onRespondProxy }: Props) {
  const outgoing = proxyAssignments.find(
    (assignment) => assignment.owner_id === currentCitizenId && assignment.active,
  );
  const incoming = proxyAssignments.filter(
    (assignment) => assignment.proxy_id === currentCitizenId && assignment.active,
  );
  const acceptedIncoming = incoming.filter((assignment) => assignment.status === "accepted");
  const pendingIncoming = incoming.filter((assignment) => assignment.status === "pending");
  const eligibleCitizens = citizens.filter((citizen) => citizen.id !== currentCitizenId);
  const [editing, setEditing] = useState(false);
  const [proxyId, setProxyId] = useState("");
  const citizen = (id?: string) => citizens.find((candidate) => candidate.id === id);
  const citizenName = (id?: string) => citizen(id)?.display_name ?? "Unknown";

  async function save() {
    if (!proxyId) return;
    await onSaveProxy(proxyId);
    setProxyId("");
    setEditing(false);
  }

  function beginEditing() {
    setProxyId(outgoing?.proxy_id ?? "");
    setEditing(true);
  }

  const outgoingHeadline = !outgoing
    ? "You currently hold your own vote"
    : outgoing.status === "accepted"
      ? `${citizenName(outgoing.proxy_id)} holds your proxy`
      : outgoing.status === "pending"
        ? `Waiting for ${citizenName(outgoing.proxy_id)} to accept`
        : `${citizenName(outgoing.proxy_id)} refused your proxy`;

  const outgoingDetail = !outgoing
    ? "If you choose a proxy holder, they will decide how to use your delegated vote on each proposal."
    : outgoing.status === "accepted"
      ? "Your general proxy is active. You can take it back at any time."
      : outgoing.status === "pending"
        ? "Your proxy has not transferred. You retain your vote until the other person accepts."
        : "Your proxy never transferred. You still hold your own vote and may choose someone else.";

  return (
    <div className="page-view governance-view">
      <PageTitle
        eyebrow="PEOPLE I TRUST"
        title="Give one person your proxy"
        text="A proxy is general, not topic-by-topic. If you give someone your proxy, that person decides how to use your delegated vote on each proposal. The proxy does not take effect unless they explicitly accept it."
      />

      <div className="proxy-summary panel">
        <UserRoundCog size={30}/>
        <div>
          <strong>{outgoingHeadline}</strong>
          <span>{acceptedIncoming.length} accepted prox{acceptedIncoming.length === 1 ? "y" : "ies"} currently entrusted to you</span>
        </div>
        <p>{outgoingDetail}</p>
      </div>

      <div className="proxy-general-grid">
        <section className="panel proxy-general-card">
          <div className="proxy-section-heading">
            <div>
              <span className="eyebrow">MY PROXY</span>
              <h2>Who speaks with my delegated vote?</h2>
              <p>There are no subject categories. One accepted proxy relationship applies across community decisions until you take it back.</p>
            </div>
          </div>

          {editing ? (
            <div className="proxy-general-editor">
              <label>
                Choose the person you trust
                <select value={proxyId} onChange={(event) => setProxyId(event.target.value)}>
                  <option value="">Choose a community member</option>
                  {eligibleCitizens.map((candidate) => (
                    <option value={candidate.id} key={candidate.id}>
                      {candidate.display_name} · {candidate.neighborhood}
                    </option>
                  ))}
                </select>
              </label>
              <div className="proxy-consent-note">
                <ShieldCheck size={18}/>
                <div>
                  <strong>This sends a request, not an automatic transfer.</strong>
                  <span>The person must accept the proxy before your voting authority moves to them.</span>
                </div>
              </div>
              <div className="proxy-buttons">
                <button type="button" className="secondary-button" onClick={() => { setEditing(false); setProxyId(""); }}>Cancel</button>
                <button type="button" className="primary-button" onClick={save} disabled={!proxyId}><Check size={15}/> Send Proxy Request</button>
              </div>
            </div>
          ) : outgoing ? (
            <div className="proxy-relationship">
              <div className="proxy-person-block">
                <span className={`proxy-status proxy-status-${outgoing.status}`}>
                  {outgoing.status === "accepted" ? "Accepted" : outgoing.status === "pending" ? "Awaiting consent" : "Refused"}
                </span>
                <strong>{citizenName(outgoing.proxy_id)}</strong>
                <small>{citizen(outgoing.proxy_id)?.neighborhood ?? "Community member"}</small>
                <p>{outgoingDetail}</p>
              </div>
              <div className="proxy-buttons">
                <button type="button" className="secondary-button" onClick={beginEditing}>{outgoing.status === "declined" ? "Choose Someone Else" : "Change Person"}</button>
                <button type="button" className="text-button danger" onClick={() => onRemoveProxy(currentCitizenId)}>{outgoing.status === "accepted" ? "Take Back Proxy" : "Cancel Request"}</button>
              </div>
            </div>
          ) : (
            <div className="proxy-empty-state">
              <ShieldCheck size={24}/>
              <div><strong>You are voting for yourself.</strong><p>No one else currently holds your proxy.</p></div>
              <button type="button" className="primary-button" onClick={beginEditing}>Choose a Proxy Holder</button>
            </div>
          )}
        </section>

        <section className="panel proxy-incoming-card">
          <div className="proxy-section-heading">
            <div>
              <span className="eyebrow">PROXIES OFFERED TO ME</span>
              <h2>I decide whether to accept them</h2>
              <p>Nobody can make you carry their proxy. Pending requests require an explicit choice, and an accepted proxy can be returned later.</p>
            </div>
            {pendingIncoming.length > 0 && <span className="proxy-request-count">{pendingIncoming.length} pending</span>}
          </div>

          <div className="proxy-request-list">
            {incoming.length === 0 ? (
              <div className="proxy-empty-inline">You do not currently have any proxy requests.</div>
            ) : incoming.map((assignment) => {
              const owner = citizen(assignment.owner_id);
              return (
                <article className="proxy-request" key={assignment.id}>
                  <div>
                    <span className={`proxy-status proxy-status-${assignment.status}`}>
                      {assignment.status === "accepted" ? "Accepted" : assignment.status === "pending" ? "Needs your consent" : "Refused"}
                    </span>
                    <strong>{owner?.display_name ?? "Community member"}</strong>
                    <small>{owner?.neighborhood ?? "District 3"}</small>
                    <p>
                      {assignment.status === "pending"
                        ? "They want to entrust you with their general proxy. Nothing transfers unless you accept."
                        : assignment.status === "accepted"
                          ? "You currently carry this person's delegated vote and decide how to use it on proposals."
                          : "You refused this proxy. Their voting authority stayed with them."}
                    </p>
                  </div>
                  <div className="proxy-buttons">
                    {assignment.status === "pending" && <>
                      <button type="button" className="secondary-button" onClick={() => onRespondProxy(assignment.id, "declined")}><X size={15}/> Refuse Proxy</button>
                      <button type="button" className="primary-button" onClick={() => onRespondProxy(assignment.id, "accepted")}><Check size={15}/> Accept Proxy</button>
                    </>}
                    {assignment.status === "accepted" && (
                      <button type="button" className="secondary-button" onClick={() => onRemoveProxy(assignment.owner_id)}>Return Proxy</button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

function DelegationView({ citizens, proxyAssignments, currentCitizenId }: Props) {
  const outgoing = proxyAssignments.find(
    (assignment) => assignment.owner_id === currentCitizenId && assignment.active,
  );
  const acceptedIncoming = proxyAssignments.filter(
    (assignment) => assignment.proxy_id === currentCitizenId && assignment.active && assignment.status === "accepted",
  );
  const citizenName = (id?: string) => citizens.find((candidate) => candidate.id === id)?.display_name ?? "Unknown";

  return (
    <div className="page-view governance-view">
      <PageTitle
        eyebrow="WHERE MY VOICE GOES"
        title="See the current path of your proxy"
        text="Your proxy is one general relationship, not a set of topic routes. An accepted proxy holder decides how to use your delegated vote on individual proposals until you take the proxy back."
      />

      <div className="delegation-network panel proxy-network-simple">
        <div className="network-person you"><Users size={21}/><strong>You</strong><small>Your voting authority starts here</small></div>
        <ChevronRight size={22}/>
        {!outgoing ? (
          <div className="network-person direct"><ShieldCheck size={16}/><strong>You keep your vote</strong><small>No active proxy request</small></div>
        ) : outgoing.status === "accepted" ? (
          <div className="network-person"><strong>{citizenName(outgoing.proxy_id)}</strong><small>Accepted your general proxy and decides how to use it on proposals</small></div>
        ) : outgoing.status === "pending" ? (
          <div className="network-person pending"><strong>{citizenName(outgoing.proxy_id)}</strong><small>Request pending · your vote remains with you until they accept</small></div>
        ) : (
          <div className="network-person direct"><ShieldCheck size={16}/><strong>You keep your vote</strong><small>{citizenName(outgoing.proxy_id)} refused the proxy request</small></div>
        )}
      </div>

      <section className="panel network-note">
        <h3>Consent works both ways.</h3>
        <p>You can withdraw your proxy at any time. The person you choose can refuse it before accepting, and can return an accepted proxy later. Pending or refused requests never transfer your vote.</p>
      </section>

      <section className="panel proxy-held-summary">
        <div>
          <span className="eyebrow">PROXIES I CURRENTLY HOLD</span>
          <h3>{acceptedIncoming.length === 0 ? "You are not carrying anyone else's proxy." : `You currently hold ${acceptedIncoming.length} additional prox${acceptedIncoming.length === 1 ? "y" : "ies"}.`}</h3>
          <p>Each accepted proxy represents a separate person's delegated voting authority. You decide how to use each accepted proxy when community decisions come up.</p>
        </div>
        {acceptedIncoming.length > 0 && (
          <div className="proxy-held-list">
            {acceptedIncoming.map((assignment) => <span key={assignment.id}>{citizenName(assignment.owner_id)}</span>)}
          </div>
        )}
      </section>
    </div>
  );
}
