import { Check, Plus, ShieldCheck, UserRoundCog, X } from "lucide-react";
import { useState } from "react";
import PageTitle from "./PageTitle";
import type { GovernanceViewProps as Props } from "./types";

export default function ProxyView({ citizens, proxyAssignments, currentCitizenId, onSaveProxy, onRemoveProxy, onRespondProxy, onGenerateDemoProxyRequests }: Props) {
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
            <div className="proxy-incoming-heading-actions">
              {pendingIncoming.length > 0 && <span className="proxy-request-count">{pendingIncoming.length} pending</span>}
              <button
                type="button"
                className="secondary-button proxy-demo-button"
                onClick={onGenerateDemoProxyRequests}
              >
                <Plus size={14}/> Generate Demo Requests
              </button>
            </div>
          </div>

          <div className="proxy-request-list">
            {incoming.length === 0 ? (
              <div className="proxy-empty-demo-state">
                <div>
                  <strong>No proxy requests yet.</strong>
                  <span>Create a few incoming demo requests so you can test accepting and refusing delegated proxies.</span>
                </div>
                <button
                  type="button"
                  className="primary-button"
                  onClick={onGenerateDemoProxyRequests}
                >
                  <Plus size={14}/> Generate Demo Proxy Requests
                </button>
              </div>
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
