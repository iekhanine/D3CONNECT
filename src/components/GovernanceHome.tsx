import {
  ArrowRight,
  GitFork,
  Network,
  Scale,
  ShieldCheck,
  UserRoundCog,
  Vote,
} from "lucide-react";
import { percent, polity } from "../config/polity";
import type { Bill, CivicIssue, Proposal, Topic, ViewKey } from "../types";

interface Props {
  topics: Topic[];
  civicIssues: CivicIssue[];
  proposals: Proposal[];
  bills: Bill[];
  onNavigate: (view: ViewKey) => void;
}

export default function GovernanceHome({ topics, civicIssues, proposals, bills, onNavigate }: Props) {
  const inForce = bills.filter((bill) => bill.state === "In Force").length;
  const openIssues = civicIssues.filter((issue) => issue.status === "Open" || issue.status === "In Discussion").length;
  const activeProposals = proposals.filter((proposal) => proposal.status !== "Converted to Bill").length;

  return (
    <div className="governance-home">
      {/* GOVERNANCE HOME 001 — Core proposition */}
      <section className="governance-hero">
        <div className="governance-hero-copy">
          <span className="eyebrow light">D3 CONNECT · PARTICIPATORY GOVERNANCE PROTOTYPE</span>
          <h1>{polity.tagline}</h1>
          <p>
            Take direct responsibility for the subjects you care about and understand. Delegate the rest to people you trust,
            while keeping the ability to reclaim your voice at any time.
          </p>
          <div className="hero-actions">
            <button className="primary-button bright" onClick={() => onNavigate("civic-issues")}>Explore Issues <ArrowRight size={16} /></button>
            <button className="ghost-button" onClick={() => onNavigate("proxy")}>Manage My Proxy</button>
          </div>
        </div>

        <div className="governance-flow" aria-label="PosProx governance flow">
          <div><span>1</span><strong>Issue</strong><small>Anyone can raise something the polity should act on.</small></div>
          <ArrowRight size={18} />
          <div><span>2</span><strong>Proposal</strong><small>Collaborate, revise, and fork possible solutions.</small></div>
          <ArrowRight size={18} />
          <div><span>3</span><strong>Bill</strong><small>A ready proposal is locked for attached support.</small></div>
          <ArrowRight size={18} />
          <div><span>4</span><strong>In Force</strong><small>Support above {percent(polity.supportThreshold)} activates it.</small></div>
        </div>
      </section>

      {/* GOVERNANCE HOME 002 — Live civic snapshot */}
      <section className="governance-stat-grid">
        <article><Scale size={22}/><span>Open civic issues</span><strong>{openIssues}</strong><small>Questions currently seeking action</small></article>
        <article><GitFork size={22}/><span>Active proposals</span><strong>{activeProposals}</strong><small>Editable and forkable solutions</small></article>
        <article><Vote size={22}/><span>Bills in force</span><strong>{inForce}</strong><small>Continuously supported policy</small></article>
        <article><Network size={22}/><span>Policy scopes</span><strong>{topics.length}</strong><small>Delegate by subject, not personality</small></article>
      </section>

      {/* GOVERNANCE HOME 003 — Principle cards */}
      <section className="panel governance-principles">
        <div className="section-heading">
          <div><span className="eyebrow">HOW D3 CONNECT WORKS</span><h2>Responsibility is universal. Attention is not.</h2></div>
        </div>
        <div className="principle-grid">
          <article><UserRoundCog size={27}/><h3>Keep what you can handle</h3><p>Vote directly where you have interest, competence, energy, and resources.</p></article>
          <article><Network size={27}/><h3>Delegate the rest</h3><p>Write topic-specific proxies to people you trust. A proxy may return responsibility or pass it onward, depending on your instruction.</p></article>
          <article><ShieldCheck size={27}/><h3>Support remains revocable</h3><p>Your support stays attached until you remove it. Laws and policies therefore remain accountable to the living electorate.</p></article>
        </div>
      </section>

      {/* GOVERNANCE HOME 004 — Current bills */}
      <section className="panel bill-preview-panel">
        <div className="section-heading">
          <div><span className="eyebrow">CONTINUOUS CONSENT</span><h2>Current Bills & Policies</h2></div>
          <button className="text-button" onClick={() => onNavigate("bills")}>View all <ArrowRight size={15}/></button>
        </div>
        <div className="bill-preview-list">
          {bills.slice(0, 3).map((bill) => (
            <article key={bill.id}>
              <div className="bill-preview-copy"><span className={`state-badge state-${bill.state.toLowerCase().replaceAll(" ", "-")}`}>{bill.state}</span><strong>{bill.title}</strong><small>{bill.summary}</small></div>
              <div className="support-meter compact"><div><span style={{ width: `${Math.min(100, bill.support_percent)}%` }}/></div><strong>{bill.support_percent.toFixed(1)}%</strong></div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
