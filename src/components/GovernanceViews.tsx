import {
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
import { useEffect, useMemo, useState } from "react";
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
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

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
      await onCreateIssue({ title, summary, topic_id: topicId, neighborhood: neighborhood || null });
      setTitle("");
      setSummary("");
      setNeighborhood("");
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
            <label>Where is this happening?<input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="Neighborhood or District-wide"/></label>
            <label className="full">Tell us what is going on<textarea rows={5} value={summary} onChange={(e) => setSummary(e.target.value)} required placeholder="Describe what you are seeing, why it matters, and who it affects. Plain language is fine."/></label>
            {submitError && <div className="full form-error" role="alert">{submitError}</div>}
            <div className="form-actions full"><button type="button" className="secondary-button" onClick={() => setCreating(false)} disabled={submitting}>Cancel</button><button className="primary-button" disabled={submitting || !topicId}>{submitting ? "Posting…" : "Post Issue"}</button></div>
          </div>
        </form>
      )}

      <div className="toolbar-row"><label className="search-box"><Search size={18}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search problems and ideas"/></label><div className="result-count">{visible.length} issues</div></div>

      <div className="governance-card-list">
        {visible.map((issue) => (
          <article className="governance-card" key={issue.id}>
            <div className="governance-card-meta"><span className="topic-pill">{topicName(issue.topic_id)}</span><span className={`issue-status issue-${issue.status.toLowerCase().replaceAll(" ", "-")}`}>{issue.status}</span></div>
            <h3>{issue.title}</h3><p>{issue.summary}</p>
            <div className="governance-card-footer"><span>Shared by {citizenName(issue.created_by)}</span><span>{issue.neighborhood || "District-wide"}</span><strong>{issue.proposal_count} solution idea{issue.proposal_count === 1 ? "" : "s"}</strong></div>
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
  const citizenName = (id: string) => citizens.find((citizen) => citizen.id === id)?.display_name ?? "Community member";

  function toggleIssue(id: string) { setIssueIds((current) => current.includes(id) ? current.filter((x) => x !== id) : [...current, id]); }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await onCreateProposal({ title, summary, body, issue_ids: issueIds });
    setTitle(""); setSummary(""); setBody(""); setIssueIds([]); setCreating(false);
  }

  return (
    <div className="page-view governance-view">
      <PageTitle eyebrow="STEP 2 · SUGGESTED SOLUTIONS" title="How could this be fixed or improved?" text="If you have an idea for solving an issue, share it here. Other people can review it and improve it before it moves forward for community support." action={<button className="primary-button" onClick={() => setCreating(true)}><Plus size={16}/> Suggest a Solution</button>}/>
      {creating && (
        <form className="governance-form panel" onSubmit={submit}>
          <div className="form-heading"><div><span className="eyebrow">SUGGEST A SOLUTION</span><h2>Share a way forward</h2></div><button type="button" className="icon-button" onClick={() => setCreating(false)}><X size={18}/></button></div>
          <div className="form-grid">
            <label className="full">Solution title<input required value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Give your idea a short, clear name"/></label>
            <label className="full">Quick summary<input required value={summary} onChange={(e)=>setSummary(e.target.value)} placeholder="Explain the idea in one sentence"/></label>
            <label className="full">How would it work?<textarea required rows={6} value={body} onChange={(e)=>setBody(e.target.value)} placeholder="Describe what should happen, who would be involved, and what result you want to see."/></label>
            <fieldset className="issue-selector full"><legend>Which issue does this help solve?</legend>{civicIssues.map((issue)=><label key={issue.id}><input type="checkbox" checked={issueIds.includes(issue.id)} onChange={()=>toggleIssue(issue.id)}/><span>{issue.title}</span></label>)}</fieldset>
            <div className="form-actions full"><button type="button" className="secondary-button" onClick={() => setCreating(false)}>Cancel</button><button className="primary-button" disabled={!issueIds.length}>Share Solution</button></div>
          </div>
        </form>
      )}
      <div className="toolbar-row"><label className="search-box"><Search size={18}/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search suggested solutions"/></label><div className="result-count">{visible.length} solutions</div></div>
      <div className="proposal-grid">
        {visible.map((proposal)=><article className="proposal-card panel" key={proposal.id}><div className="governance-card-meta"><span className={`proposal-status proposal-${proposal.status.toLowerCase().replaceAll(" ", "-")}`}>{proposal.status}</span><span>{proposal.issue_ids.length} related issue{proposal.issue_ids.length===1?"":"s"}</span></div><h3>{proposal.title}</h3><p>{proposal.summary}</p><div className="proposal-code"><GitBranch size={15}/><span>{proposal.revision_count} updates</span><GitFork size={15}/><span>{proposal.fork_count} alternate versions</span></div><div className="governance-card-footer"><span>Started by {citizenName(proposal.maintainer_id)}</span><span>Updated {new Date(proposal.updated_at).toLocaleDateString()}</span></div></article>)}
      </div>
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
      <PageTitle eyebrow="PEOPLE I TRUST" title="Let someone you trust handle topics you do not follow" text="You can always handle a topic yourself. If you do not have the time or interest to follow one closely, choose another community member you trust to handle it for you. You can change or undo this anytime."/>
      <div className="proxy-summary panel"><UserRoundCog size={30}/><div><strong>{topics.length-current.length} topics you handle</strong><span>{current.length} handled by someone you trust</span></div><p>You stay in control. Taking a topic back means you will handle future decisions on that topic yourself.</p></div>
      <div className="proxy-topic-list">
        {topics.map((topic)=>{const assignment=current.find((proxy)=>proxy.topic_id===topic.id);const isEditing=editingTopic===topic.id;return <article className="proxy-topic-card panel" key={topic.id}><div className="proxy-topic-main"><div className="topic-icon"><Network size={19}/></div><div><span className="eyebrow">{assignment?"HANDLED BY SOMEONE I TRUST":"I HANDLE THIS"}</span><h3>{topic.name}</h3><p>{topic.description}</p></div></div>{assignment&&!isEditing?<div className="proxy-current"><div><small>Your trusted person</small><strong>{citizenName(assignment.proxy_id)}</strong><span>{assignment.disposition==="redelegate"?"Can choose another trusted person if needed":"Sends unresolved decisions back to you"}</span></div><div className="proxy-buttons"><button className="secondary-button" onClick={()=>{setEditingTopic(topic.id);setProxyId(assignment.proxy_id);setDisposition(assignment.disposition)}}>Change</button><button className="text-button danger" onClick={()=>onRemoveProxy(topic.id)}>Take Back</button></div></div>:!assignment&&!isEditing?<button className="secondary-button" onClick={()=>setEditingTopic(topic.id)}>Choose Someone</button>:<div className="proxy-editor"><label>Who do you trust with this topic?<select value={proxyId} onChange={(e)=>setProxyId(e.target.value)}><option value="">Choose a community member</option>{eligibleCitizens.map((citizen)=><option value={citizen.id} key={citizen.id}>{citizen.display_name} · {citizen.neighborhood}</option>)}</select></label><label>If they cannot make a decision<select value={disposition} onChange={(e)=>setDisposition(e.target.value as ProxyDisposition)}><option value="return">Send it back to me</option><option value="redelegate">Let them choose another trusted person</option></select></label><div className="proxy-buttons"><button className="secondary-button" onClick={()=>setEditingTopic(null)}>Cancel</button><button className="primary-button" onClick={()=>save(topic.id)} disabled={!proxyId}><Check size={15}/> Save Choice</button></div></div>}</article>})}
      </div>
    </div>
  );
}

function DelegationView({ topics, citizens, proxyAssignments, currentCitizenId }: Props) {
  const citizenName = (id?: string) => citizens.find((citizen)=>citizen.id===id)?.display_name ?? "Unknown";
  const myAssignments = proxyAssignments.filter((assignment)=>assignment.owner_id===currentCitizenId&&assignment.active);

  return (
    <div className="page-view governance-view">
      <PageTitle eyebrow="WHERE MY VOICE GOES" title="See who is handling each topic for you" text="This shows, topic by topic, whether you are handling decisions yourself or someone you trust is handling them for you. If they are allowed to pass the topic to another trusted person, you will see that too."/>
      <div className="delegation-network panel">
        <div className="network-person you"><Users size={21}/><strong>You</strong><small>Your voice starts here</small></div>
        <div className="network-routes">
          {topics.map((topic)=>{const first=myAssignments.find((a)=>a.topic_id===topic.id);const downstream=first?.disposition==="redelegate"?proxyAssignments.find((a)=>a.owner_id===first.proxy_id&&a.topic_id===topic.id&&a.active):undefined;return <div className="network-route" key={topic.id}><div className="route-topic"><span>{topic.name}</span></div><ChevronRight size={16}/>{first?<><div className="network-person"><strong>{citizenName(first.proxy_id)}</strong><small>{first.disposition==="redelegate"?"Can pass it on":"Sends it back to you if needed"}</small></div>{downstream&&<><ChevronRight size={16}/><div className="network-person downstream"><strong>{citizenName(downstream.proxy_id)}</strong><small>Chosen by your trusted person</small></div></>}</>:<div className="network-person direct"><ShieldCheck size={16}/><strong>You handle this</strong><small>You decide for yourself</small></div>}</div>})}
        </div>
      </div>
      <section className="panel network-note"><h3>You are always in control of where your voice goes.</h3><p>If someone you trust cannot handle a decision, your settings determine whether it comes back to you or may be passed to another trusted person. You can change those settings anytime.</p></section>
    </div>
  );
}
