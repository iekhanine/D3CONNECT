import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  FileText,
  GitFork,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Scale,
  ShieldCheck,
  Tags,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  deleteBill,
  deleteCivicIssue,
  deleteProposal,
  deleteTopic,
  resetGovernanceDemoData,
  upsertBill,
  upsertCivicIssue,
  upsertProposal,
  upsertTopic,
} from "../lib/governanceService";
import type {
  Bill,
  BillKind,
  BillState,
  Citizen,
  CivicIssue,
  CivicIssueStatus,
  Neighborhood,
  Proposal,
  ProposalStatus,
  Topic,
  ViewKey,
} from "../types";

type AdminTab = "overview" | "issues" | "solutions" | "decisions" | "topics";
type OAuthProvider = "Google" | "Discord" | "Microsoft";

interface Props {
  topics: Topic[];
  neighborhoods: Neighborhood[];
  citizens: Citizen[];
  civicIssues: CivicIssue[];
  proposals: Proposal[];
  bills: Bill[];
  onChanged: () => Promise<void> | void;
  onNavigate: (view: ViewKey) => void;
}

const SESSION_KEY = "d3connect.prototype.admin";

export default function AdminView(props: Props) {
  const [provider, setProvider] = useState<OAuthProvider | null>(() => {
    const value = window.sessionStorage.getItem(SESSION_KEY);
    return value === "Google" || value === "Discord" || value === "Microsoft" ? value : null;
  });

  if (!provider) {
    return <AdminLogin onLogin={(nextProvider) => {
      window.sessionStorage.setItem(SESSION_KEY, nextProvider);
      setProvider(nextProvider);
    }} />;
  }

  return <AdminConsole {...props} provider={provider} onLogout={() => {
    window.sessionStorage.removeItem(SESSION_KEY);
    setProvider(null);
  }} />;
}

function AdminLogin({ onLogin }: { onLogin: (provider: OAuthProvider) => void }) {
  return (
    <div className="admin-login-wrap">
      <section className="admin-login-card panel">
        <div className="admin-login-icon"><ShieldCheck size={30}/></div>
        <span className="eyebrow">D3 CONNECT ADMIN · V1 PROTOTYPE</span>
        <h1>Administrator sign in</h1>
        <p>
          OAuth is intentionally simulated in this build. These buttons establish a local prototype admin session so the
          client can test the entire administration workflow before Google, Discord, and Microsoft are connected.
        </p>

        <div className="oauth-stack">
          <button className="oauth-button google" onClick={() => onLogin("Google")}>
            <span className="oauth-mark">G</span><strong>Continue with Google</strong><small>Prototype</small>
          </button>
          <button className="oauth-button discord" onClick={() => onLogin("Discord")}>
            <span className="oauth-mark">D</span><strong>Continue with Discord</strong><small>Prototype</small>
          </button>
          <button className="oauth-button microsoft" onClick={() => onLogin("Microsoft")}>
            <span className="oauth-mark">M</span><strong>Continue with Microsoft</strong><small>Prototype</small>
          </button>
        </div>

        <div className="admin-login-note">
          <KeyRound size={17}/>
          <span>No credentials are requested or transmitted in v1 ADMIN.</span>
        </div>
      </section>
    </div>
  );
}

function AdminConsole({
  provider,
  topics,
  neighborhoods,
  citizens,
  civicIssues,
  proposals,
  bills,
  onChanged,
  onNavigate,
  onLogout,
}: Props & { provider: OAuthProvider; onLogout: () => void }) {
  const [tab, setTab] = useState<AdminTab>("overview");
  const [message, setMessage] = useState("");

  async function changed(text: string) {
    await onChanged();
    setMessage(text);
    window.setTimeout(() => setMessage(""), 2400);
  }

  async function reset() {
    if (!window.confirm("Reset the Supabase governance content for this polity back to the original v1 demo data?")) return;
    try {
      await resetGovernanceDemoData();
      await changed("Supabase demo data reset.");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Supabase reset failed.");
    }
  }

  const tabs: Array<{ key: AdminTab; label: string; icon: typeof LayoutDashboard; count?: number }> = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "issues", label: "Issues", icon: FileText, count: civicIssues.length },
    { key: "solutions", label: "Solutions", icon: GitFork, count: proposals.length },
    { key: "decisions", label: "Decisions", icon: Scale, count: bills.length },
    { key: "topics", label: "Topics", icon: Tags, count: topics.length },
  ];

  return (
    <div className="admin-page">
      <div className="admin-topline">
        <div>
          <span className="eyebrow">D3 CONNECT · ADMINISTRATION</span>
          <h1>Content Administration</h1>
          <p>Manage the content the client sees on the public D3 Connect experience.</p>
        </div>
        <div className="admin-session-actions">
          <span className="admin-session-pill"><CheckCircle2 size={15}/> {provider} prototype session</span>
          <button className="secondary-button" onClick={() => onNavigate("home")}><ExternalLink size={15}/> Public site</button>
          <button className="secondary-button" onClick={onLogout}><LogOut size={15}/> Sign out</button>
        </div>
      </div>

      {message && <div className="admin-toast" role="status"><CheckCircle2 size={17}/>{message}</div>}

      <div className="admin-layout">
        <aside className="admin-nav panel">
          <div className="admin-nav-label">CONTENT</div>
          {tabs.map(({ key, label, icon: Icon, count }) => (
            <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>
              <Icon size={17}/><span>{label}</span>{typeof count === "number" && <strong>{count}</strong>}
            </button>
          ))}
          <div className="admin-nav-divider"/>
          <button className="admin-reset-button" onClick={reset}><RotateCcw size={16}/> Reset Supabase demo data</button>
        </aside>

        <section className="admin-workspace">
          {tab === "overview" && <AdminOverview civicIssues={civicIssues} proposals={proposals} bills={bills} topics={topics} setTab={setTab} onNavigate={onNavigate}/>}          
          {tab === "issues" && <IssueAdmin civicIssues={civicIssues} topics={topics} neighborhoods={neighborhoods} citizens={citizens} onChanged={changed}/>}          
          {tab === "solutions" && <ProposalAdmin proposals={proposals} civicIssues={civicIssues} citizens={citizens} onChanged={changed}/>}          
          {tab === "decisions" && <BillAdmin bills={bills} proposals={proposals} onChanged={changed}/>}          
          {tab === "topics" && <TopicAdmin topics={topics} onChanged={changed}/>}          
        </section>
      </div>
    </div>
  );
}

function AdminOverview({ civicIssues, proposals, bills, topics, setTab, onNavigate }: {
  civicIssues: CivicIssue[]; proposals: Proposal[]; bills: Bill[]; topics: Topic[]; setTab: (tab: AdminTab) => void; onNavigate: (view: ViewKey) => void;
}) {
  const openIssues = civicIssues.filter((issue) => ["Open", "In Discussion"].includes(issue.status)).length;
  const activeSolutions = proposals.filter((proposal) => proposal.status !== "Converted to Bill").length;
  const activeDecisions = bills.filter((bill) => bill.state === "In Force").length;
  return (
    <div className="admin-overview">
      <section className="admin-metric-grid">
        <button onClick={() => setTab("issues")}><FileText size={20}/><span>Issues being discussed</span><strong>{openIssues}</strong><small>Manage issues</small></button>
        <button onClick={() => setTab("solutions")}><GitFork size={20}/><span>Suggested solutions</span><strong>{activeSolutions}</strong><small>Manage solutions</small></button>
        <button onClick={() => setTab("decisions")}><Scale size={20}/><span>Active decisions</span><strong>{activeDecisions}</strong><small>Manage decisions</small></button>
        <button onClick={() => setTab("topics")}><Tags size={20}/><span>Governance topics</span><strong>{topics.length}</strong><small>Manage topics</small></button>
      </section>
      <section className="panel admin-help-panel">
        <div>
          <span className="eyebrow">V1 CLIENT TESTING</span>
          <h2>Everything here is safe to push on.</h2>
          <p>Changes save directly to Supabase and immediately appear on the public prototype. OAuth is still simulated in v1; real Google, Discord, and Microsoft identity will be the next security layer.</p>
        </div>
        <button className="primary-button" onClick={() => onNavigate("home")}><ArrowLeft size={15}/> View public prototype</button>
      </section>
    </div>
  );
}

function IssueAdmin({ civicIssues, topics, neighborhoods, citizens, onChanged }: {
  civicIssues: CivicIssue[]; topics: Topic[]; neighborhoods: Neighborhood[]; citizens: Citizen[]; onChanged: (message: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState<CivicIssue | "new" | null>(null);
  const topicName = (id: string) => topics.find((topic) => topic.id === id)?.name ?? "General";

  async function remove(issue: CivicIssue) {
    if (!window.confirm(`Delete “${issue.title}”? Related solutions will keep working but the issue link will be removed.`)) return;
    try {
      await deleteCivicIssue(issue.id);
      await onChanged("Issue deleted from Supabase.");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Issue delete failed.");
    }
  }

  return (
    <AdminCollection title="Issues & Problems" text="Create and maintain the issues residents see under Problems & Ideas." action={<button className="primary-button" onClick={() => setEditing("new")}><Plus size={15}/> Add issue</button>}>
      {editing && <IssueEditor issue={editing === "new" ? undefined : editing} topics={topics} neighborhoods={neighborhoods} citizens={citizens} onClose={() => setEditing(null)} onSaved={async () => { setEditing(null); await onChanged("Issue saved."); }}/>}      
      <div className="admin-table panel">
        <div className="admin-table-head admin-issue-cols"><span>Issue</span><span>Topic</span><span>Status</span><span>Neighborhood</span><span>Actions</span></div>
        {civicIssues.map((issue) => <div className="admin-table-row admin-issue-cols" key={issue.id}><div><strong>{issue.title}</strong><small>{issue.summary}</small></div><span>{topicName(issue.topic_id)}</span><span><i className={`issue-status issue-${issue.status.toLowerCase().replaceAll(" ", "-")}`}>{issue.status}</i></span><span>{issue.neighborhood || "District-wide"}</span><div className="admin-row-actions"><button onClick={() => setEditing(issue)} aria-label={`Edit ${issue.title}`}><Pencil size={15}/></button><button className="danger" onClick={() => remove(issue)} aria-label={`Delete ${issue.title}`}><Trash2 size={15}/></button></div></div>)}
      </div>
    </AdminCollection>
  );
}

function IssueEditor({ issue, topics, neighborhoods, citizens, onClose, onSaved }: {
  issue?: CivicIssue; topics: Topic[]; neighborhoods: Neighborhood[]; citizens: Citizen[]; onClose: () => void; onSaved: () => Promise<void>;
}) {
  const [title, setTitle] = useState(issue?.title ?? "");
  const [summary, setSummary] = useState(issue?.summary ?? "");
  const [details, setDetails] = useState(issue?.details ?? "");
  const [topicId, setTopicId] = useState(issue?.topic_id ?? topics[0]?.id ?? "");
  const [neighborhood, setNeighborhood] = useState(issue?.neighborhood ?? "District-wide");
  const [location, setLocation] = useState(issue?.location_detail ?? "");
  const [status, setStatus] = useState<CivicIssueStatus>(issue?.status ?? "Open");
  const [createdBy, setCreatedBy] = useState(issue?.created_by ?? citizens[0]?.id ?? "citizen-you");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      await upsertCivicIssue({
      id: issue?.id ?? `ci-admin-${Date.now()}`,
      created_by: createdBy,
      title: title.trim(),
      summary: summary.trim(),
      details: details.trim() || null,
      topic_id: topicId,
      neighborhood,
      location_detail: location.trim() || null,
      status,
      created_at: issue?.created_at ?? new Date().toISOString(),
      proposal_count: issue?.proposal_count ?? 0,
    });
      await onSaved();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Issue save failed.");
    }
  }

  return <AdminEditor title={issue ? "Edit issue" : "Add issue"} onClose={onClose}><form className="admin-form" onSubmit={submit}>
    <label className="full">Title<input required value={title} onChange={(e) => setTitle(e.target.value)}/></label>
    <label className="full">Summary<textarea required rows={3} value={summary} onChange={(e) => setSummary(e.target.value)}/></label>
    <label className="full">Discussion / detail<textarea rows={5} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="What is happening, why it matters, context residents should know..."/></label>
    <label>Topic<select required value={topicId} onChange={(e) => setTopicId(e.target.value)}>{topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}</select></label>
    <label>Status<select value={status} onChange={(e) => setStatus(e.target.value as CivicIssueStatus)}><option>Open</option><option>In Discussion</option><option>Addressed</option><option>Closed</option></select></label>
    <label>Neighborhood<select value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)}><option>District-wide</option>{neighborhoods.map((item) => <option key={item.id}>{item.name}</option>)}</select></label>
    <label>Created by<select value={createdBy} onChange={(e) => setCreatedBy(e.target.value)}>{citizens.map((citizen) => <option key={citizen.id} value={citizen.id}>{citizen.display_name}</option>)}</select></label>
    <label className="full">Location detail<input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Optional street, corridor, park, or area"/></label>
    <AdminFormActions onClose={onClose}/>
  </form></AdminEditor>;
}

function ProposalAdmin({ proposals, civicIssues, citizens, onChanged }: {
  proposals: Proposal[]; civicIssues: CivicIssue[]; citizens: Citizen[]; onChanged: (message: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState<Proposal | "new" | null>(null);
  async function remove(proposal: Proposal) {
    if (!window.confirm(`Delete “${proposal.title}”? Any decision created from it will also be removed in this prototype.`)) return;
    try {
      await deleteProposal(proposal.id);
      await onChanged("Solution deleted from Supabase.");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Solution delete failed.");
    }
  }
  return <AdminCollection title="Suggested Solutions" text="Manage both the short public summary and the implementation/funding detail behind each solution." action={<button className="primary-button" onClick={() => setEditing("new")}><Plus size={15}/> Add solution</button>}>
    {editing && <ProposalEditor proposal={editing === "new" ? undefined : editing} civicIssues={civicIssues} citizens={citizens} onClose={() => setEditing(null)} onSaved={async () => { setEditing(null); await onChanged("Solution saved."); }}/>}    
    <div className="admin-table panel">
      <div className="admin-table-head admin-solution-cols"><span>Solution</span><span>Status</span><span>Issues</span><span>Updated</span><span>Actions</span></div>
      {proposals.map((proposal) => <div className="admin-table-row admin-solution-cols" key={proposal.id}><div><strong>{proposal.title}</strong><small>{proposal.summary}</small></div><span><i className={`proposal-status proposal-${proposal.status.toLowerCase().replaceAll(" ", "-")}`}>{proposal.status}</i></span><span>{proposal.issue_ids.length}</span><span>{new Date(proposal.updated_at).toLocaleDateString()}</span><div className="admin-row-actions"><button onClick={() => setEditing(proposal)}><Pencil size={15}/></button><button className="danger" onClick={() => remove(proposal)}><Trash2 size={15}/></button></div></div>)}
    </div>
  </AdminCollection>;
}

function ProposalEditor({ proposal, civicIssues, citizens, onClose, onSaved }: {
  proposal?: Proposal; civicIssues: CivicIssue[]; citizens: Citizen[]; onClose: () => void; onSaved: () => Promise<void>;
}) {
  const [title, setTitle] = useState(proposal?.title ?? "");
  const [summary, setSummary] = useState(proposal?.summary ?? "");
  const [body, setBody] = useState(proposal?.body ?? "");
  const [implementation, setImplementation] = useState(proposal?.implementation_plan ?? "");
  const [funding, setFunding] = useState(proposal?.funding_plan ?? "");
  const [cost, setCost] = useState(proposal?.estimated_cost ?? "");
  const [timeline, setTimeline] = useState(proposal?.timeline ?? "");
  const [lead, setLead] = useState(proposal?.lead_entity ?? "");
  const [metrics, setMetrics] = useState(proposal?.success_metrics ?? "");
  const [status, setStatus] = useState<ProposalStatus>(proposal?.status ?? "Draft");
  const [maintainer, setMaintainer] = useState(proposal?.maintainer_id ?? citizens[0]?.id ?? "citizen-you");
  const [issueIds, setIssueIds] = useState<string[]>(proposal?.issue_ids ?? []);

  function toggleIssue(id: string) { setIssueIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]); }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      await upsertProposal({
      id: proposal?.id ?? `prop-admin-${Date.now()}`,
      maintainer_id: maintainer,
      title: title.trim(), summary: summary.trim(), body: body.trim(),
      implementation_plan: implementation.trim() || null,
      funding_plan: funding.trim() || null,
      estimated_cost: cost.trim() || null,
      timeline: timeline.trim() || null,
      lead_entity: lead.trim() || null,
      success_metrics: metrics.trim() || null,
      status, issue_ids: issueIds,
      parent_proposal_id: proposal?.parent_proposal_id ?? null,
      revision_count: proposal ? proposal.revision_count + 1 : 1,
      fork_count: proposal?.fork_count ?? 0,
      updated_at: new Date().toISOString(),
    });
      await onSaved();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Solution save failed.");
    }
  }

  return <AdminEditor title={proposal ? "Edit solution" : "Add solution"} onClose={onClose} wide><form className="admin-form" onSubmit={submit}>
    <label className="full">Solution title<input required value={title} onChange={(e) => setTitle(e.target.value)}/></label>
    <label className="full">Public summary<textarea required rows={2} value={summary} onChange={(e) => setSummary(e.target.value)}/></label>
    <label className="full">Proposal / approach<textarea required rows={4} value={body} onChange={(e) => setBody(e.target.value)}/></label>
    <label className="full">Implementation plan<textarea rows={5} value={implementation} onChange={(e) => setImplementation(e.target.value)}/></label>
    <label className="full">Funding plan<textarea rows={4} value={funding} onChange={(e) => setFunding(e.target.value)}/></label>
    <label>Estimated cost<input value={cost} onChange={(e) => setCost(e.target.value)} placeholder="$50,000 or Not yet estimated"/></label>
    <label>Timeline<input value={timeline} onChange={(e) => setTimeline(e.target.value)} placeholder="90-day pilot; 12-month rollout"/></label>
    <label>Lead entity<input value={lead} onChange={(e) => setLead(e.target.value)} placeholder="Agency, committee, or partner"/></label>
    <label>Maintainer<select value={maintainer} onChange={(e) => setMaintainer(e.target.value)}>{citizens.map((citizen) => <option key={citizen.id} value={citizen.id}>{citizen.display_name}</option>)}</select></label>
    <label>Status<select value={status} onChange={(e) => setStatus(e.target.value as ProposalStatus)}><option>Draft</option><option>Review</option><option>Ready</option><option>Converted to Bill</option></select></label>
    <label className="full">Success metrics<textarea rows={3} value={metrics} onChange={(e) => setMetrics(e.target.value)}/></label>
    <fieldset className="admin-checklist full"><legend>Related issues</legend>{civicIssues.map((issue) => <label key={issue.id}><input type="checkbox" checked={issueIds.includes(issue.id)} onChange={() => toggleIssue(issue.id)}/><span>{issue.title}</span></label>)}</fieldset>
    <AdminFormActions onClose={onClose}/>
  </form></AdminEditor>;
}

function BillAdmin({ bills, proposals, onChanged }: { bills: Bill[]; proposals: Proposal[]; onChanged: (message: string) => Promise<void> }) {
  const [editing, setEditing] = useState<Bill | "new" | null>(null);
  async function remove(bill: Bill) {
    if (!window.confirm(`Delete decision “${bill.title}”?`)) return;
    try {
      await deleteBill(bill.id);
      await onChanged("Decision deleted from Supabase.");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Decision delete failed.");
    }
  }
  return <AdminCollection title="Decisions & Voting" text="Create or maintain items that have moved from a proposed solution into community voting or active policy." action={<button className="primary-button" onClick={() => setEditing("new")}><Plus size={15}/> Add decision</button>}>
    {editing && <BillEditor bill={editing === "new" ? undefined : editing} proposals={proposals} onClose={() => setEditing(null)} onSaved={async () => { setEditing(null); await onChanged("Decision saved."); }}/>}    
    <div className="admin-table panel"><div className="admin-table-head admin-decision-cols"><span>Decision</span><span>State</span><span>Kind</span><span>Support</span><span>Actions</span></div>{bills.map((bill) => <div className="admin-table-row admin-decision-cols" key={bill.id}><div><strong>{bill.title}</strong><small>{bill.summary}</small></div><span><i className={`state-badge state-${bill.state.toLowerCase().replaceAll(" ", "-")}`}>{bill.state}</i></span><span>{bill.kind}</span><span>{bill.support_percent.toFixed(1)}%</span><div className="admin-row-actions"><button onClick={() => setEditing(bill)}><Pencil size={15}/></button><button className="danger" onClick={() => remove(bill)}><Trash2 size={15}/></button></div></div>)}</div>
  </AdminCollection>;
}

function BillEditor({ bill, proposals, onClose, onSaved }: { bill?: Bill; proposals: Proposal[]; onClose: () => void; onSaved: () => Promise<void> }) {
  const [proposalId, setProposalId] = useState(bill?.proposal_id ?? proposals[0]?.id ?? "");
  const selectedProposal = useMemo(() => proposals.find((proposal) => proposal.id === proposalId), [proposals, proposalId]);
  const [title, setTitle] = useState(bill?.title ?? selectedProposal?.title ?? "");
  const [summary, setSummary] = useState(bill?.summary ?? selectedProposal?.summary ?? "");
  const [kind, setKind] = useState<BillKind>(bill?.kind ?? "Policy");
  const [state, setState] = useState<BillState>(bill?.state ?? "Voting");
  const [supportCount, setSupportCount] = useState(String(bill?.support_count ?? 0));
  const [electorateCount, setElectorateCount] = useState(String(bill?.electorate_count ?? 7));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const support = Math.max(0, Number(supportCount) || 0);
    const electorate = Math.max(1, Number(electorateCount) || 1);
    try {
      await upsertBill({
      id: bill?.id ?? `bill-admin-${Date.now()}`,
      proposal_id: proposalId,
      title: title.trim(), summary: summary.trim(), kind, state,
      support_count: Math.min(support, electorate), electorate_count: electorate,
      support_percent: (Math.min(support, electorate) / electorate) * 100,
      created_at: bill?.created_at ?? new Date().toISOString(),
      last_state_change_at: bill?.state !== state ? new Date().toISOString() : bill?.last_state_change_at ?? null,
      current_user_supports: bill?.current_user_supports ?? false,
    });
      await onSaved();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Decision save failed.");
    }
  }

  return <AdminEditor title={bill ? "Edit decision" : "Add decision"} onClose={onClose}><form className="admin-form" onSubmit={submit}>
    <label className="full">Source solution<select required value={proposalId} onChange={(e) => { const id=e.target.value; setProposalId(id); const p=proposals.find((item)=>item.id===id); if (!bill && p) { setTitle(p.title); setSummary(p.summary); } }}>{proposals.map((proposal) => <option value={proposal.id} key={proposal.id}>{proposal.title}</option>)}</select></label>
    <label className="full">Decision title<input required value={title} onChange={(e) => setTitle(e.target.value)}/></label>
    <label className="full">Summary<textarea required rows={3} value={summary} onChange={(e) => setSummary(e.target.value)}/></label>
    <label>Kind<select value={kind} onChange={(e) => setKind(e.target.value as BillKind)}><option>Policy</option><option>Law</option></select></label>
    <label>State<select value={state} onChange={(e) => setState(e.target.value as BillState)}><option>Voting</option><option>In Force</option><option>Out of Force</option></select></label>
    <label>Support count<input type="number" min="0" value={supportCount} onChange={(e) => setSupportCount(e.target.value)}/></label>
    <label>Electorate count<input type="number" min="1" value={electorateCount} onChange={(e) => setElectorateCount(e.target.value)}/></label>
    <AdminFormActions onClose={onClose}/>
  </form></AdminEditor>;
}

function TopicAdmin({ topics, onChanged }: { topics: Topic[]; onChanged: (message: string) => Promise<void> }) {
  const [editing, setEditing] = useState<Topic | "new" | null>(null);
  async function remove(topic: Topic) {
    if (!window.confirm(`Delete topic “${topic.name}”? Existing content assigned to it will show as General until reassigned.`)) return;
    try {
      await deleteTopic(topic.id);
      await onChanged("Topic deleted from Supabase.");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Topic delete failed.");
    }
  }
  return <AdminCollection title="Governance Topics" text="Topics organize and filter issues and proposals. Proxy delegation is intentionally not categorized by topic." action={<button className="primary-button" onClick={() => setEditing("new")}><Plus size={15}/> Add topic</button>}>
    {editing && <TopicEditor topic={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} onSaved={async () => { setEditing(null); await onChanged("Topic saved."); }}/>}    
    <div className="admin-topic-grid">{topics.map((topic) => <article className="panel" key={topic.id}><div><strong>{topic.name}</strong><p>{topic.description}</p></div><div className="admin-row-actions"><button onClick={() => setEditing(topic)}><Pencil size={15}/></button><button className="danger" onClick={() => remove(topic)}><Trash2 size={15}/></button></div></article>)}</div>
  </AdminCollection>;
}

function TopicEditor({ topic, onClose, onSaved }: { topic?: Topic; onClose: () => void; onSaved: () => Promise<void> }) {
  const [name, setName] = useState(topic?.name ?? "");
  const [description, setDescription] = useState(topic?.description ?? "");
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      await upsertTopic({ id: topic?.id ?? `topic-admin-${Date.now()}`, name: name.trim(), description: description.trim() });
      await onSaved();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Topic save failed.");
    }
  }
  return <AdminEditor title={topic ? "Edit topic" : "Add topic"} onClose={onClose}><form className="admin-form" onSubmit={submit}><label className="full">Topic name<input required value={name} onChange={(e) => setName(e.target.value)}/></label><label className="full">Description<textarea required rows={4} value={description} onChange={(e) => setDescription(e.target.value)}/></label><AdminFormActions onClose={onClose}/></form></AdminEditor>;
}

function AdminCollection({ title, text, action, children }: { title: string; text: string; action: React.ReactNode; children: React.ReactNode }) {
  return <div className="admin-collection"><div className="admin-collection-title"><div><h2>{title}</h2><p>{text}</p></div>{action}</div>{children}</div>;
}

function AdminEditor({ title, onClose, wide=false, children }: { title: string; onClose: () => void; wide?: boolean; children: React.ReactNode }) {
  return <div className="admin-editor-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><section className={`admin-editor panel${wide ? " wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}><div className="admin-editor-head"><div><span className="eyebrow">CONTENT EDITOR</span><h2>{title}</h2></div><button type="button" className="icon-button" onClick={onClose}><X size={18}/></button></div>{children}</section></div>;
}

function AdminFormActions({ onClose }: { onClose: () => void }) {
  return <div className="admin-form-actions full"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button"><Save size={15}/> Save</button></div>;
}
