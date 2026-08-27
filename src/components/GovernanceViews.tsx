import {
  ArrowRight,
  Check,
  ChevronRight,
  GitBranch,
  GitFork,
  Network,
  Plus,
  Search,
  ShieldCheck,
  UserRoundCog,
  Users,
  Vote,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { percent, polity } from "../config/polity";
import type {
  Bill,
  Citizen,
  CivicIssue,
  Proposal,
  ProxyAssignment,
  ProxyDisposition,
  Topic,
  ViewKey,
} from "../types";

interface Props {
  view: ViewKey;
  topics: Topic[];
  citizens: Citizen[];
  civicIssues: CivicIssue[];
  proposals: Proposal[];
  bills: Bill[];
  proxyAssignments: ProxyAssignment[];
  currentCitizenId: string;
  onCreateIssue: (input: { title: string; summary: string; topic_id: string; neighborhood?: string | null }) => Promise<void>;
  onCreateProposal: (input: { title: string; summary: string; body: string; issue_ids: string[] }) => Promise<void>;
  onToggleBillSupport: (billId: string, support: boolean) => Promise<void>;
  onSaveProxy: (topicId: string, proxyId: string, disposition: ProxyDisposition) => Promise<void>;
  onRemoveProxy: (topicId: string) => Promise<void>;
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

function IssuesView({ civicIssues, topics, citizens, onCreateIssue }: Props) {
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [topicId, setTopicId] = useState(topics[0]?.id ?? "");
  const [neighborhood, setNeighborhood] = useState("");

  const visible = useMemo(() => civicIssues.filter((issue) => `${issue.title} ${issue.summary}`.toLowerCase().includes(query.toLowerCase())), [civicIssues, query]);
  const topicName = (id: string) => topics.find((topic) => topic.id === id)?.name ?? "General";
  const citizenName = (id: string) => citizens.find((citizen) => citizen.id === id)?.display_name ?? "Citizen";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await onCreateIssue({ title, summary, topic_id: topicId, neighborhood: neighborhood || null });
    setTitle(""); setSummary(""); setNeighborhood(""); setCreating(false);
  }

  return (
    <div className="page-view governance-view">
      <PageTitle
        eyebrow="STEP 1 · ISSUES"
        title="What should the polity act on?"
        text="Anyone may raise an Issue. An Issue defines a problem or desired action; it does not prescribe the solution."
        action={<button className="primary-button" onClick={() => setCreating(true)}><Plus size={16}/> New Issue</button>}
      />

      {creating && (
        <form className="governance-form panel" onSubmit={submit}>
          <div className="form-heading"><div><span className="eyebrow">NEW ISSUE</span><h2>Raise something that needs action</h2></div><button type="button" className="icon-button" onClick={() => setCreating(false)}><X size={18}/></button></div>
          <div className="form-grid">
            <label className="full">Issue title<input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Clear, neutral description of the issue"/></label>
            <label>Topic<select value={topicId} onChange={(e) => setTopicId(e.target.value)} required>{topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}</select></label>
            <label>Neighborhood / scope<input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="District-wide or neighborhood"/></label>
            <label className="full">Why should the polity act?<textarea rows={5} value={summary} onChange={(e) => setSummary(e.target.value)} required placeholder="Describe the condition, need, or outcome without locking in a specific solution."/></label>
            <div className="form-actions full"><button type="button" className="secondary-button" onClick={() => setCreating(false)}>Cancel</button><button className="primary-button">Create Issue</button></div>
          </div>
        </form>
      )}

      <div className="toolbar-row"><label className="search-box"><Search size={18}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search civic issues"/></label><div className="result-count">{visible.length} issues</div></div>

      <div className="governance-card-list">
        {visible.map((issue) => (
          <article className="governance-card" key={issue.id}>
            <div className="governance-card-meta"><span className="topic-pill">{topicName(issue.topic_id)}</span><span className={`issue-status issue-${issue.status.toLowerCase().replaceAll(" ", "-")}`}>{issue.status}</span></div>
            <h3>{issue.title}</h3><p>{issue.summary}</p>
            <div className="governance-card-footer"><span>Raised by {citizenName(issue.created_by)}</span><span>{issue.neighborhood || "District-wide"}</span><strong>{issue.proposal_count} proposal{issue.proposal_count === 1 ? "" : "s"}</strong></div>
          </article>
        ))}
      </div>
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
  const visible = proposals.filter((proposal) => `${proposal.title} ${proposal.summary}`.toLowerCase().includes(query.toLowerCase()));
  const citizenName = (id: string) => citizens.find((citizen) => citizen.id === id)?.display_name ?? "Citizen";

  function toggleIssue(id: string) { setIssueIds((current) => current.includes(id) ? current.filter((x) => x !== id) : [...current, id]); }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await onCreateProposal({ title, summary, body, issue_ids: issueIds });
    setTitle(""); setSummary(""); setBody(""); setIssueIds([]); setCreating(false);
  }

  return (
    <div className="page-view governance-view">
      <PageTitle eyebrow="STEP 2 · PROPOSALS" title="Build, revise, and fork solutions" text="Proposals address one or more Issues. They stay editable and forkable until a maintainer declares a version ready to become a Bill." action={<button className="primary-button" onClick={() => setCreating(true)}><Plus size={16}/> New Proposal</button>}/>
      {creating && (
        <form className="governance-form panel" onSubmit={submit}>
          <div className="form-heading"><div><span className="eyebrow">NEW PROPOSAL</span><h2>Propose a way forward</h2></div><button type="button" className="icon-button" onClick={() => setCreating(false)}><X size={18}/></button></div>
          <div className="form-grid">
            <label className="full">Proposal title<input required value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Name this proposed approach"/></label>
            <label className="full">Summary<input required value={summary} onChange={(e)=>setSummary(e.target.value)} placeholder="One-sentence explanation"/></label>
            <label className="full">Proposal text<textarea required rows={6} value={body} onChange={(e)=>setBody(e.target.value)} placeholder="Describe the implementation, requirements, and intended result."/></label>
            <fieldset className="issue-selector full"><legend>Issues addressed</legend>{civicIssues.map((issue)=><label key={issue.id}><input type="checkbox" checked={issueIds.includes(issue.id)} onChange={()=>toggleIssue(issue.id)}/><span>{issue.title}</span></label>)}</fieldset>
            <div className="form-actions full"><button type="button" className="secondary-button" onClick={() => setCreating(false)}>Cancel</button><button className="primary-button" disabled={!issueIds.length}>Create Proposal</button></div>
          </div>
        </form>
      )}
      <div className="toolbar-row"><label className="search-box"><Search size={18}/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search proposals"/></label><div className="result-count">{visible.length} proposals</div></div>
      <div className="proposal-grid">
        {visible.map((proposal)=><article className="proposal-card panel" key={proposal.id}><div className="governance-card-meta"><span className={`proposal-status proposal-${proposal.status.toLowerCase().replaceAll(" ", "-")}`}>{proposal.status}</span><span>{proposal.issue_ids.length} linked issue{proposal.issue_ids.length===1?"":"s"}</span></div><h3>{proposal.title}</h3><p>{proposal.summary}</p><div className="proposal-code"><GitBranch size={15}/><span>{proposal.revision_count} revisions</span><GitFork size={15}/><span>{proposal.fork_count} forks</span></div><div className="governance-card-footer"><span>Maintainer: {citizenName(proposal.maintainer_id)}</span><span>Updated {new Date(proposal.updated_at).toLocaleDateString()}</span></div></article>)}
      </div>
    </div>
  );
}

function BillsView({ bills, onToggleBillSupport }: Props) {
  return (
    <div className="page-view governance-view">
      <PageTitle eyebrow="STEP 3 · BILLS & CONTINUOUS CONSENT" title="Support is attached, not spent" text={`A Bill enters force at ${percent(polity.supportThreshold)} support. Once in force, it remains there unless attached support drops below ${percent(polity.removalThreshold)}. The gap provides stability.`}/>
      <div className="threshold-explainer panel"><div><span>0%</span><strong>Out of force zone</strong><small>Below {percent(polity.removalThreshold)}, an existing law or policy is removed from force.</small></div><div className="threshold-gap"><span>{percent(polity.removalThreshold)}</span><strong>Stability band</strong><small>Between thresholds, the existing state remains unchanged.</small></div><div><span>{percent(polity.supportThreshold)}</span><strong>Activation threshold</strong><small>At or above this point, a Bill enters force.</small></div></div>
      <div className="bill-list">
        {bills.map((bill)=><article className="bill-card panel" key={bill.id}><div className="bill-card-head"><div><span className={`state-badge state-${bill.state.toLowerCase().replaceAll(" ", "-")}`}>{bill.state}</span><span className="bill-kind">{bill.kind}</span><h3>{bill.title}</h3><p>{bill.summary}</p></div><div className="support-big"><strong>{bill.support_percent.toFixed(1)}%</strong><small>{bill.support_count.toLocaleString()} attached votes</small></div></div><div className="support-meter"><div className="meter-track"><span className="meter-fill" style={{width:`${Math.min(100,bill.support_percent)}%`}}/><i className="threshold-marker removal" style={{left:`${polity.removalThreshold*100}%`}}/><i className="threshold-marker activation" style={{left:`${polity.supportThreshold*100}%`}}/></div><div className="meter-labels"><span>0%</span><span>{percent(polity.removalThreshold)}</span><span>{percent(polity.supportThreshold)}</span><span>100%</span></div></div><div className="bill-actions"><span>{bill.current_user_supports ? "Your vote is currently attached." : "Your direct vote is not attached."}</span>{bill.current_user_supports?<button className="secondary-button" onClick={()=>onToggleBillSupport(bill.id,false)}>Remove My Support</button>:<button className="primary-button" onClick={()=>onToggleBillSupport(bill.id,true)}><Vote size={15}/> Attach My Vote</button>}</div></article>)}
      </div>
    </div>
  );
}

function ProxyView({ topics, citizens, proxyAssignments, currentCitizenId, onSaveProxy, onRemoveProxy }: Props) {
  const current = proxyAssignments.filter((proxy) => proxy.owner_id === currentCitizenId && proxy.active);
  const [editingTopic, setEditingTopic] = useState<string | null>(null);
  const [proxyId, setProxyId] = useState("");
  const [disposition, setDisposition] = useState<ProxyDisposition>("return");
  const eligibleCitizens = citizens.filter((citizen) => citizen.id !== currentCitizenId);
  const citizenName = (id?: string) => citizens.find((citizen)=>citizen.id===id)?.display_name ?? "Unknown";

  async function save(topicId: string) {
    if (!proxyId) return;
    await onSaveProxy(topicId, proxyId, disposition);
    setEditingTopic(null); setProxyId(""); setDisposition("return");
  }

  return (
    <div className="page-view governance-view">
      <PageTitle eyebrow="MY PROXY" title="Choose what you keep. Delegate what you do not." text="Your proxy is scoped by subject. Keeping a topic means you remain responsible for your own vote. Delegating it gives that responsibility to someone you trust according to the instructions you set."/>
      <div className="proxy-summary panel"><UserRoundCog size={30}/><div><strong>{topics.length-current.length} direct scopes</strong><span>{current.length} delegated scopes</span></div><p>Nothing here is permanent. Reclaiming a topic simply returns responsibility for that scope to you.</p></div>
      <div className="proxy-topic-list">
        {topics.map((topic)=>{const assignment=current.find((proxy)=>proxy.topic_id===topic.id);const isEditing=editingTopic===topic.id;return <article className="proxy-topic-card panel" key={topic.id}><div className="proxy-topic-main"><div className="topic-icon"><Network size={19}/></div><div><span className="eyebrow">{assignment?"DELEGATED":"DIRECT RESPONSIBILITY"}</span><h3>{topic.name}</h3><p>{topic.description}</p></div></div>{assignment&&!isEditing?<div className="proxy-current"><div><small>Your proxy</small><strong>{citizenName(assignment.proxy_id)}</strong><span>{assignment.disposition==="redelegate"?"May proxy onward":"Returns unresolved votes to you"}</span></div><div className="proxy-buttons"><button className="secondary-button" onClick={()=>{setEditingTopic(topic.id);setProxyId(assignment.proxy_id);setDisposition(assignment.disposition)}}>Change</button><button className="text-button danger" onClick={()=>onRemoveProxy(topic.id)}>Reclaim</button></div></div>:!assignment&&!isEditing?<button className="secondary-button" onClick={()=>setEditingTopic(topic.id)}>Delegate topic</button>:<div className="proxy-editor"><label>Delegate to<select value={proxyId} onChange={(e)=>setProxyId(e.target.value)}><option value="">Choose a citizen</option>{eligibleCitizens.map((citizen)=><option value={citizen.id} key={citizen.id}>{citizen.display_name} · {citizen.neighborhood}</option>)}</select></label><label>When they do not handle it<select value={disposition} onChange={(e)=>setDisposition(e.target.value as ProxyDisposition)}><option value="return">Return the vote to me</option><option value="redelegate">Allow them to proxy it onward</option></select></label><div className="proxy-buttons"><button className="secondary-button" onClick={()=>setEditingTopic(null)}>Cancel</button><button className="primary-button" onClick={()=>save(topic.id)} disabled={!proxyId}><Check size={15}/> Save Proxy</button></div></div>}</article>})}
      </div>
    </div>
  );
}

function DelegationView({ topics, citizens, proxyAssignments, currentCitizenId }: Props) {
  const citizenName = (id?: string) => citizens.find((citizen)=>citizen.id===id)?.display_name ?? "Unknown";
  const myAssignments = proxyAssignments.filter((assignment)=>assignment.owner_id===currentCitizenId&&assignment.active);

  return (
    <div className="page-view governance-view">
      <PageTitle eyebrow="DELEGATION NETWORK" title="Follow where responsibility goes" text="Delegation is a graph, not a permanent representative hierarchy. Topic-specific responsibility can move through trusted citizens according to each owner's proxy instructions."/>
      <div className="delegation-network panel">
        <div className="network-person you"><Users size={21}/><strong>You</strong><small>Original owner</small></div>
        <div className="network-routes">
          {topics.map((topic)=>{const first=myAssignments.find((a)=>a.topic_id===topic.id);const downstream=first?.disposition==="redelegate"?proxyAssignments.find((a)=>a.owner_id===first.proxy_id&&a.topic_id===topic.id&&a.active):undefined;return <div className="network-route" key={topic.id}><div className="route-topic"><span>{topic.name}</span></div><ChevronRight size={16}/>{first?<><div className="network-person"><strong>{citizenName(first.proxy_id)}</strong><small>{first.disposition==="redelegate"?"May redelegate":"Must return"}</small></div>{downstream&&<><ChevronRight size={16}/><div className="network-person downstream"><strong>{citizenName(downstream.proxy_id)}</strong><small>Downstream proxy</small></div></>}</>:<div className="network-person direct"><ShieldCheck size={16}/><strong>Direct vote</strong><small>You retain responsibility</small></div>}</div>})}
        </div>
      </div>
      <section className="panel network-note"><h3>No vote disappears into the network.</h3><p>If a proxy cannot or will not handle a matter, the original proxy instructions determine whether that vote returns to its owner or may be delegated onward again.</p></section>
    </div>
  );
}
