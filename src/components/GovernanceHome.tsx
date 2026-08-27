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
      {/* GOVERNANCE HOME 001 — Plain-language starting point */}
      <section className="governance-hero">
        <div className="governance-hero-copy">
          <span className="eyebrow light">D3 CONNECT · PROBLEMS, IDEAS, ACTION</span>
          <h1>Help shape {polity.districtShortName}.</h1>
          <p>
            See problems your neighbors have raised, suggest ways to fix them, support decisions you agree with,
            or choose someone you trust to handle topics you do not have time to follow.
          </p>
          <div className="hero-actions">
            <button className="primary-button bright" onClick={() => onNavigate("civic-issues")}>See What Needs Attention <ArrowRight size={16} /></button>
            <button className="ghost-button" onClick={() => onNavigate("proxy")}>Choose Someone I Trust</button>
          </div>
        </div>

        <div className="governance-flow" aria-label="How D3 Connect works">
          <div><span>1</span><strong>Tell us what is happening</strong><small>Raise a problem, concern, or improvement you want to see.</small></div>
          <ArrowRight size={18} />
          <div><span>2</span><strong>Suggest a solution</strong><small>Share an idea for how the issue could be fixed or improved.</small></div>
          <ArrowRight size={18} />
          <div><span>3</span><strong>Support a decision</strong><small>When a solution is ready, the community can support it.</small></div>
          <ArrowRight size={18} />
          <div><span>4</span><strong>It takes effect</strong><small>At {percent(polity.supportThreshold)} support, the decision becomes active.</small></div>
        </div>
      </section>

      {/* GOVERNANCE HOME 002 — Live civic snapshot */}
      <section className="governance-stat-grid">
        <article><Scale size={22}/><span>Issues being discussed</span><strong>{openIssues}</strong><small>Problems and ideas that still need attention</small></article>
        <article><GitFork size={22}/><span>Solutions being worked on</span><strong>{activeProposals}</strong><small>Community ideas that can still be improved</small></article>
        <article><Vote size={22}/><span>Active decisions</span><strong>{inForce}</strong><small>Policies that currently have enough support</small></article>
        <article><Network size={22}/><span>Topics you can manage</span><strong>{topics.length}</strong><small>Handle them yourself or choose someone you trust</small></article>
      </section>

      {/* GOVERNANCE HOME 003 — Simple participation choices */}
      <section className="panel governance-principles">
        <div className="section-heading">
          <div><span className="eyebrow">HOW D3 CONNECT WORKS</span><h2>You do not have to follow everything to have a voice.</h2></div>
        </div>
        <div className="principle-grid">
          <article><UserRoundCog size={27}/><h3>Handle the topics you care about</h3><p>Follow issues and support decisions directly when a subject matters to you.</p></article>
          <article><Network size={27}/><h3>Let someone you trust help</h3><p>For topics you do not follow, choose another community member you trust to handle them for you.</p></article>
          <article><ShieldCheck size={27}/><h3>Change your mind anytime</h3><p>You can take a topic back, choose someone else, support a decision, or remove your support whenever you want.</p></article>
        </div>
      </section>

      {/* GOVERNANCE HOME 004 — Current community decisions */}
      <section className="panel bill-preview-panel">
        <div className="section-heading">
          <div><span className="eyebrow">WHAT THE COMMUNITY IS DECIDING</span><h2>Current Decisions & Policies</h2></div>
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
