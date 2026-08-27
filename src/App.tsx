import { useEffect, useMemo, useState } from "react";
import GovernanceHome from "./components/GovernanceHome";
import GovernanceViews from "./components/GovernanceViews";
import Header from "./components/Header";
import SectionViews from "./components/SectionViews";
import Sidebar from "./components/Sidebar";
import { polity } from "./config/polity";
import { loadDashboardData, subscribe } from "./lib/dataService";
import {
  createCivicIssue,
  createProposal,
  loadGovernanceData,
  removeProxyAssignment,
  saveProxyAssignment,
  toggleBillSupport,
} from "./lib/governanceService";
import type {
  Bill,
  Business,
  Citizen,
  CivicIssue,
  CommunityEvent,
  Neighborhood,
  Project,
  Proposal,
  ProxyAssignment,
  ProxyDisposition,
  Resource,
  Topic,
  ViewKey,
} from "./types";
import "./App.css";

export default function App() {
  // ========================================================
  // APP 001 — Navigation / deployment state
  // ========================================================
  const [activeView, setActiveView] = useState<ViewKey>("home");
  const [selectedNeighborhood, setSelectedNeighborhood] = useState("All");

  // ========================================================
  // APP 002 — Existing community portal data
  // ========================================================
  const [projects, setProjects] = useState<Project[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);

  // ========================================================
  // APP 003 — PosProx governance state
  // ========================================================
  const [topics, setTopics] = useState<Topic[]>([]);
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [civicIssues, setCivicIssues] = useState<CivicIssue[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [proxyAssignments, setProxyAssignments] = useState<ProxyAssignment[]>([]);
  const [dataSource, setDataSource] = useState<"supabase" | "demo">("demo");
  const [loading, setLoading] = useState(true);

  const currentCitizenId = citizens.find((citizen) => citizen.display_name === "You (Demo Citizen)")?.id ?? polity.demoCitizenId;

  // ========================================================
  // APP 004 — Newsletter state
  // ========================================================
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    Promise.all([loadDashboardData(), loadGovernanceData()]).then(([community, governance]) => {
      setProjects(community.projects);
      setResources(community.resources);
      setEvents(community.events);
      setBusinesses(community.businesses);
      setNeighborhoods(community.neighborhoods);

      setTopics(governance.topics);
      setCitizens(governance.citizens);
      setCivicIssues(governance.civicIssues);
      setProposals(governance.proposals);
      setBills(governance.bills);
      setProxyAssignments(governance.proxyAssignments);
      setDataSource(governance.source);
      setLoading(false);
    });
  }, []);

  const currentCitizen = useMemo(
    () => citizens.find((citizen) => citizen.id === currentCitizenId),
    [citizens, currentCitizenId],
  );

  const filteredBusinesses = useMemo(
    () => selectedNeighborhood === "All" ? businesses : businesses.filter((business) => business.neighborhood === selectedNeighborhood),
    [businesses, selectedNeighborhood],
  );

  function navigate(view: ViewKey) {
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ========================================================
  // APP 005 — Governance actions
  // ========================================================
  async function handleCreateIssue(input: { title: string; summary: string; topic_id: string; neighborhood?: string | null }) {
    const created = await createCivicIssue({ ...input, created_by: currentCitizenId });
    setCivicIssues((current) => [created, ...current]);
  }

  async function handleCreateProposal(input: { title: string; summary: string; body: string; issue_ids: string[] }) {
    const created = await createProposal({ ...input, maintainer_id: currentCitizenId, parent_proposal_id: null });
    setProposals((current) => [created, ...current]);
    setCivicIssues((current) => current.map((issue) => input.issue_ids.includes(issue.id) ? { ...issue, proposal_count: issue.proposal_count + 1 } : issue));
  }

  async function handleToggleBillSupport(billId: string, support: boolean) {
    const bill = bills.find((candidate) => candidate.id === billId);
    if (!bill) return;
    const updated = await toggleBillSupport(bill, currentCitizenId, support);
    setBills((current) => current.map((candidate) => candidate.id === billId ? updated : candidate));
  }

  async function handleSaveProxy(topicId: string, proxyId: string, disposition: ProxyDisposition) {
    const saved = await saveProxyAssignment({ owner_id: currentCitizenId, proxy_id: proxyId, topic_id: topicId, disposition });
    setProxyAssignments((current) => [
      ...current.filter((assignment) => !(assignment.owner_id === currentCitizenId && assignment.topic_id === topicId)),
      saved,
    ]);
  }

  async function handleRemoveProxy(topicId: string) {
    await removeProxyAssignment(currentCitizenId, topicId);
    setProxyAssignments((current) => current.filter((assignment) => !(assignment.owner_id === currentCitizenId && assignment.topic_id === topicId)));
  }

  async function handleSubscribe(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim()) return;
    await subscribe(email.trim(), selectedNeighborhood);
    setSubscribed(true);
    setEmail("");
  }

  const isGovernanceView = ["civic-issues", "proposals", "bills", "proxy", "delegation"].includes(activeView);

  return (
    <div className="app-shell">
      <Sidebar activeView={activeView} onNavigate={navigate}/>

      <div className="app-body">
        <Header
          neighborhoods={neighborhoods}
          selectedNeighborhood={selectedNeighborhood}
          onSelectNeighborhood={setSelectedNeighborhood}
          dataSource={dataSource}
          citizen={currentCitizen}
        />

        <main className="content-area">
          {loading ? (
            <div className="loading-state"><div className="spinner"/><span>Loading {polity.productName}…</span></div>
          ) : activeView === "home" ? (
            <GovernanceHome topics={topics} civicIssues={civicIssues} proposals={proposals} bills={bills} onNavigate={navigate}/>
          ) : isGovernanceView ? (
            <GovernanceViews
              view={activeView}
              topics={topics}
              citizens={citizens}
              civicIssues={civicIssues}
              proposals={proposals}
              bills={bills}
              proxyAssignments={proxyAssignments}
              currentCitizenId={currentCitizenId}
              onCreateIssue={handleCreateIssue}
              onCreateProposal={handleCreateProposal}
              onToggleBillSupport={handleToggleBillSupport}
              onSaveProxy={handleSaveProxy}
              onRemoveProxy={handleRemoveProxy}
              onNavigate={navigate}
            />
          ) : (
<SectionViews
  view={activeView}
  projects={projects}
  resources={resources}
  events={events}
  businesses={filteredBusinesses}
  neighborhoods={neighborhoods}
  selectedNeighborhood={selectedNeighborhood}
/>
          )}

          <section className="newsletter">
            <div><span className="eyebrow light">STAY IN THE LOOP</span><h2>{polity.districtShortName} updates without the scavenger hunt.</h2><p>Get civic issues, proposals, policy changes, projects, and community events in one concise digest.</p></div>
            {subscribed ? <div className="subscription-success">✓ You're on the list.</div> : <form onSubmit={handleSubscribe}><input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="Enter your email" required/><button>Subscribe</button></form>}
          </section>

          <footer className="site-footer">
            <span>{polity.productName} is an independent civic-governance prototype and is not owned or operated by the City of Portland.</span>
            <span>PosProx prototype · Built by OneTime Labs · 2026</span>
          </footer>
        </main>
      </div>
    </div>
  );
}

