import { ChevronRight, ShieldCheck, Users } from "lucide-react";
import PageTitle from "./PageTitle";
import type { GovernanceViewProps as Props } from "./types";

export default function DelegationView({ citizens, proxyAssignments, currentCitizenId }: Props) {
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
