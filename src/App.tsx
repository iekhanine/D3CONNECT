import { useEffect, useMemo, useState } from "react";
import AdminView from "./components/AdminView";
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
  respondToProxyAssignment,
  saveProxyAssignment,
  toggleBillSupport,
} from "./lib/governanceService";
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
} from "./types";
import "./App.css";

const VIEW_ROUTES: Partial<Record<ViewKey, string>> = {
  home: "",
  about: "how-it-works",
  "civic-issues": "problems",
  proposals: "solutions",
  bills: "decisions",
  proxy: "people-i-trust",
  delegation: "where-my-voice-goes",
  admin: "admin",
};

const ROUTE_VIEWS = Object.entries(VIEW_ROUTES).reduce<Record<string, ViewKey>>(
  (routes, [view, route]) => {
    routes[route] = view as ViewKey;
    return routes;
  },
  {},
);

function viewFromLocation(): ViewKey {
  const route = window.location.hash.replace(/^#/, "").trim().toLowerCase();
  return ROUTE_VIEWS[route] ?? "home";
}

function urlForView(view: ViewKey) {
  const route = VIEW_ROUTES[view];
  const base = `${window.location.pathname}${window.location.search}`;
  return route ? `${base}#${route}` : base;
}

export default function App() {
  // ========================================================
  // APP 001 — Navigation / deployment state
  // ========================================================
  const [activeView, setActiveView] = useState<ViewKey>(() => viewFromLocation());
  const [selectedNeighborhood, setSelectedNeighborhood] = useState("All");

  // ========================================================
  // APP 002 — Neighborhood metadata
  // Used for resident context and issue reporting.
  // ========================================================
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);

  // ========================================================
  // APP 003 — Governance state
  // ========================================================
  const [topics, setTopics] = useState<Topic[]>([]);
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [civicIssues, setCivicIssues] = useState<CivicIssue[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [proxyAssignments, setProxyAssignments] = useState<ProxyAssignment[]>([]);
  const [dataSource, setDataSource] = useState<"supabase" | "demo">("demo");
  const [loading, setLoading] = useState(true);

  const currentCitizenId =
    citizens.find((citizen) => citizen.display_name === "You (Demo Citizen)")?.id ??
    polity.demoCitizenId;

  // ========================================================
  // APP 004 — Newsletter state
  // ========================================================
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    Promise.all([loadDashboardData(), loadGovernanceData()]).then(
      ([community, governance]) => {
        setNeighborhoods(community.neighborhoods);

        setTopics(governance.topics);
        setCitizens(governance.citizens);
        setCivicIssues(governance.civicIssues);
        setProposals(governance.proposals);
        setBills(governance.bills);
        setProxyAssignments(governance.proxyAssignments);
        setDataSource(governance.source);
        setLoading(false);
      },
    );
  }, []);

  useEffect(() => {
    function handleHistoryNavigation() {
      setActiveView(viewFromLocation());
      window.scrollTo({ top: 0, behavior: "auto" });
    }

    window.addEventListener("popstate", handleHistoryNavigation);
    window.addEventListener("hashchange", handleHistoryNavigation);

    return () => {
      window.removeEventListener("popstate", handleHistoryNavigation);
      window.removeEventListener("hashchange", handleHistoryNavigation);
    };
  }, []);

  const currentCitizen = useMemo(
    () => citizens.find((citizen) => citizen.id === currentCitizenId),
    [citizens, currentCitizenId],
  );

  // ========================================================
  // APP 005 — Supabase state synchronization
  // ========================================================
  async function refreshGovernanceState() {
    const governance = await loadGovernanceData();

    setTopics(governance.topics);
    setCitizens(governance.citizens);
    setCivicIssues(governance.civicIssues);
    setProposals(governance.proposals);
    setBills(governance.bills);
    setProxyAssignments(governance.proxyAssignments);
    setDataSource(governance.source);
  }

  function navigate(view: ViewKey) {
    const nextUrl = urlForView(view);
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

    if (currentUrl !== nextUrl) {
      window.history.pushState({ view }, "", nextUrl);
    }

    setActiveView(view);
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Supabase is authoritative for governance data. Refresh whenever
    // the resident returns to a governance section so navigation cannot
    // restore an older React snapshot.
    if (["civic-issues", "proposals", "bills", "proxy", "delegation"].includes(view)) {
      void refreshGovernanceState();
    }
  }

  // ========================================================
  // APP 006 — Governance actions
  // ========================================================
  async function handleCreateIssue(input: {
    title: string;
    summary: string;
    topic_id: string;
    neighborhood?: string | null;
    location_detail?: string | null;
  }) {
    try {
      const created = await createCivicIssue({
        ...input,
        created_by: currentCitizenId,
      });

      setCivicIssues((current) => [
        created,
        ...current.filter((issue) => issue.id !== created.id),
      ]);

      await refreshGovernanceState();
    } catch (error) {
      throw error instanceof Error ? error : new Error("The issue could not be saved.");
    }
  }

  async function handleCreateProposal(input: {
    title: string;
    summary: string;
    body: string;
    issue_ids: string[];
  }) {
    try {
      const created = await createProposal({
        ...input,
        maintainer_id: currentCitizenId,
        parent_proposal_id: null,
      });

      setProposals((current) => [created, ...current.filter((proposal) => proposal.id !== created.id)]);
      await refreshGovernanceState();
    } catch (error) {
      throw error instanceof Error ? error : new Error("The solution could not be saved.");
    }
  }

  async function handleToggleBillSupport(billId: string, support: boolean) {
    const bill = bills.find((candidate) => candidate.id === billId);
    if (!bill) return;

    try {
      const updated = await toggleBillSupport(
        bill,
        currentCitizenId,
        support,
      );

      setBills((current) =>
        current.map((candidate) =>
          candidate.id === billId ? updated : candidate,
        ),
      );
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "The vote could not be saved.");
    }
  }

  async function handleSaveProxy(proxyId: string) {
    try {
      const saved = await saveProxyAssignment({
        owner_id: currentCitizenId,
        proxy_id: proxyId,
      });

      setProxyAssignments((current) => [
        ...current.map((assignment) =>
          assignment.owner_id === currentCitizenId && assignment.active
            ? { ...assignment, active: false }
            : assignment,
        ),
        saved,
      ]);
      await refreshGovernanceState();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "The proxy request could not be saved.");
    }
  }

  async function handleRemoveProxy(ownerId = currentCitizenId) {
    try {
      await removeProxyAssignment(ownerId);
      await refreshGovernanceState();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "The proxy could not be returned or withdrawn.");
    }
  }

  async function handleRespondProxy(
    assignmentId: string,
    status: Exclude<ProxyStatus, "pending">,
  ) {
    try {
      const updated = await respondToProxyAssignment(
        assignmentId,
        currentCitizenId,
        status,
      );

      if (!updated) return;
      await refreshGovernanceState();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "The proxy response could not be saved.");
    }
  }

  async function handleSubscribe(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim()) return;

    try {
      await subscribe(email.trim(), selectedNeighborhood);
      setSubscribed(true);
      setEmail("");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Subscription failed.");
    }
  }

  const isGovernanceView = [
    "civic-issues",
    "proposals",
    "bills",
    "proxy",
    "delegation",
  ].includes(activeView);

  return (
    <div className="app-shell">
      <Sidebar activeView={activeView} onNavigate={navigate} />

      <div className="app-body">
        <Header
          neighborhoods={neighborhoods}
          selectedNeighborhood={selectedNeighborhood}
          onSelectNeighborhood={setSelectedNeighborhood}
          dataSource={dataSource}
          citizen={currentCitizen}
        />

        <main className={`content-area${activeView === "admin" ? " content-area-admin" : ""}`}>
          {loading ? (
            <div className="loading-state">
              <div className="spinner" />
              <span>Loading {polity.productName}…</span>
            </div>
          ) : activeView === "admin" ? (
            <AdminView
              topics={topics}
              neighborhoods={neighborhoods}
              citizens={citizens}
              civicIssues={civicIssues}
              proposals={proposals}
              bills={bills}
              onChanged={refreshGovernanceState}
              onNavigate={navigate}
            />
          ) : activeView === "home" ? (
            <GovernanceHome
              topics={topics}
              civicIssues={civicIssues}
              proposals={proposals}
              bills={bills}
              proxyAssignments={proxyAssignments}
              currentCitizenId={currentCitizenId}
              onNavigate={navigate}
            />
          ) : isGovernanceView ? (
            <GovernanceViews
              view={activeView}
              topics={topics}
              neighborhoods={neighborhoods}
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
              onRespondProxy={handleRespondProxy}
              onNavigate={navigate}
            />
          ) : (
            <SectionViews view={activeView} />
          )}
        </main>

        {activeView !== "admin" && <div className="footer-dock">
          <div className="footer-dock-inner">
            <section className="newsletter">
              <div>
                <span className="eyebrow light">STAY IN THE LOOP</span>
                <h2>{polity.districtShortName} updates without the scavenger hunt.</h2>
                <p>
                  Get neighborhood problems, proposed solutions, and community decisions
                  in one concise digest.
                </p>
              </div>

              {subscribed ? (
                <div className="subscription-success">✓ You're on the list.</div>
              ) : (
                <form onSubmit={handleSubscribe}>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                  <button>Subscribe</button>
                </form>
              )}
            </section>

            <footer className="site-footer">
              <span>
                {polity.productName} is an independent community participation prototype
                and is not owned or operated by the City of Portland.
              </span>
              <span>Built by OneTime Labs · 2026</span>
            </footer>
          </div>
        </div>}
      </div>
    </div>
  );
}
