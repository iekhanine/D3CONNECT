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
import type { Bill, CivicIssue, Proposal, ProxyAssignment, ViewKey } from "../types";

interface Props {
  civicIssues: CivicIssue[];
  proposals: Proposal[];
  bills: Bill[];
  proxyAssignments: ProxyAssignment[];
  currentCitizenId: string;
  onNavigate: (view: ViewKey) => void;
}

export default function GovernanceHome({
  civicIssues,
  proposals,
  bills,
  proxyAssignments,
  currentCitizenId,
  onNavigate,
}: Props) {
  const inForce = bills.filter((bill) => bill.state === "In Force").length;
  const openIssues = civicIssues.filter(
    (issue) => issue.status === "Open" || issue.status === "In Discussion",
  ).length;
  const activeProposals = proposals.filter(
    (proposal) => proposal.status !== "Converted to Bill",
  ).length;
  const currentProxy = proxyAssignments.find(
    (assignment) => assignment.owner_id === currentCitizenId && assignment.active,
  );
  const proxyState =
    currentProxy?.status === "accepted"
      ? "Active"
      : currentProxy?.status === "pending"
        ? "Pending"
        : "Mine";

  return (
    <div className="governance-home">
      <section className="governance-hero">
        <div className="governance-hero-copy">
          <span className="eyebrow light">D3 CONNECT · PROBLEMS, IDEAS, ACTION</span>
          <h1>Help shape {polity.districtShortName}.</h1>
          <p>
            See problems your neighbors have raised, suggest ways to fix them, support
            decisions you agree with, or give one person you trust your proxy when you want
            them to decide how to use your delegated vote.
          </p>
          <div className="hero-actions">
            <button
              className="primary-button bright"
              onClick={() => onNavigate("civic-issues")}
            >
              See What Needs Attention <ArrowRight size={16} />
            </button>
            <button className="ghost-button" onClick={() => onNavigate("proxy")}>
              Manage My Proxy
            </button>
          </div>
        </div>

        <div className="governance-flow" aria-label="How D3 Connect works">
          <div>
            <span>1</span>
            <strong>Tell us what is happening</strong>
            <small>Raise a problem, concern, or improvement you want to see.</small>
          </div>
          <ArrowRight size={18} />
          <div>
            <span>2</span>
            <strong>Suggest a solution</strong>
            <small>Share an idea for how the issue could be fixed or improved.</small>
          </div>
          <ArrowRight size={18} />
          <div>
            <span>3</span>
            <strong>Support a decision</strong>
            <small>When a solution is ready, the community can support it.</small>
          </div>
          <ArrowRight size={18} />
          <div>
            <span>4</span>
            <strong>It takes effect</strong>
            <small>
              At {percent(polity.supportThreshold)} support, the decision becomes active.
            </small>
          </div>
        </div>
      </section>

      <section className="governance-stat-grid">
        <button type="button" onClick={() => onNavigate("civic-issues")}>
          <Scale size={22} />
          <span>Issues being discussed</span>
          <strong>{openIssues}</strong>
          <small>Problems and ideas that still need attention</small>
          <em>
            View issues <ArrowRight size={13} />
          </em>
        </button>
        <button type="button" onClick={() => onNavigate("proposals")}>
          <GitFork size={22} />
          <span>Suggested solutions</span>
          <strong>{activeProposals}</strong>
          <small>Community ideas with implementation detail</small>
          <em>
            View solutions <ArrowRight size={13} />
          </em>
        </button>
        <button type="button" onClick={() => onNavigate("bills")}>
          <Vote size={22} />
          <span>Active decisions</span>
          <strong>{inForce}</strong>
          <small>Policies that currently have enough support</small>
          <em>
            View decisions <ArrowRight size={13} />
          </em>
        </button>
        <button type="button" onClick={() => onNavigate("proxy")}>
          <Network size={22} />
          <span>My proxy</span>
          <strong>{proxyState}</strong>
          <small>One person, all proposals, consent required</small>
          <em>
            Manage proxy <ArrowRight size={13} />
          </em>
        </button>
      </section>

      <section className="panel governance-principles">
        <div className="section-heading">
          <div>
            <span className="eyebrow">HOW D3 CONNECT WORKS</span>
            <h2>You do not have to follow everything to have a voice.</h2>
          </div>
        </div>
        <div className="principle-grid">
          <article>
            <UserRoundCog size={27} />
            <h3>Keep your vote or delegate it</h3>
            <p>You can keep voting for yourself, or give one trusted person your general proxy.</p>
          </article>
          <article>
            <Network size={27} />
            <h3>The proxy holder decides proposal by proposal</h3>
            <p>
              There are no subject categories. If the proxy is accepted, the holder decides how
              to use that delegated vote on each proposal.
            </p>
          </article>
          <article>
            <ShieldCheck size={27} />
            <h3>Consent is required on both sides</h3>
            <p>
              The person you choose may accept or refuse your proxy. You can take an accepted
              proxy back at any time.
            </p>
          </article>
        </div>
      </section>

      <section className="panel bill-preview-panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">WHAT THE COMMUNITY IS DECIDING</span>
            <h2>Current Decisions & Policies</h2>
          </div>
          <button className="text-button" onClick={() => onNavigate("bills")}>
            View all <ArrowRight size={15} />
          </button>
        </div>
        <div className="bill-preview-list">
          {bills.slice(0, 3).map((bill) => (
            <article key={bill.id}>
              <div className="bill-preview-copy">
                <span
                  className={`state-badge state-${bill.state
                    .toLowerCase()
                    .replaceAll(" ", "-")}`}
                >
                  {bill.state}
                </span>
                <strong>{bill.title}</strong>
                <small>{bill.summary}</small>
              </div>
              <div className="support-meter compact">
                <div>
                  <span style={{ width: `${Math.min(100, bill.support_percent)}%` }} />
                </div>
                <strong>{bill.support_percent.toFixed(1)}%</strong>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
