import {
  demoBills,
  demoCitizens,
  demoCivicIssues,
  demoProposals,
  demoProxyAssignments,
  demoTopics,
} from "../data/governanceDemo";
import { polity } from "../config/polity";
import type {
  Bill,
  CivicIssue,
  GovernanceData,
  Proposal,
  ProxyAssignment,
  ProxyDisposition,
} from "../types";
import { supabase } from "./supabase";

// ==========================================================
// GOVERNANCE SERVICE 001 — Data loading with live → demo fallback
// ==========================================================

export async function loadGovernanceData(): Promise<GovernanceData & { source: "supabase" | "demo" }> {
  if (!supabase) return demoGovernanceData();

  try {
    const polityRes = await supabase.from("polities").select("id").eq("slug", polity.slug).maybeSingle();
    if (polityRes.error || !polityRes.data?.id) return demoGovernanceData();

    const polityId = polityRes.data.id as string;
    const [topicsRes, citizensRes, issuesRes, proposalsRes, billsRes, proxiesRes, votesRes] = await Promise.all([
      supabase.from("governance_topics").select("*").eq("polity_id", polityId).order("name"),
      supabase.from("citizens").select("*").eq("polity_id", polityId).eq("active", true).order("display_name"),
      supabase.from("civic_issues").select("*").eq("polity_id", polityId).order("created_at", { ascending: false }),
      supabase.from("proposals").select("*").eq("polity_id", polityId).order("updated_at", { ascending: false }),
      supabase.from("bills").select("*").eq("polity_id", polityId).order("created_at", { ascending: false }),
      supabase.from("proxy_assignments").select("*").eq("polity_id", polityId).eq("active", true),
      supabase.from("bill_votes").select("bill_id,citizen_id,attached").eq("polity_id", polityId),
    ]);

    const all = [topicsRes, citizensRes, issuesRes, proposalsRes, billsRes, proxiesRes, votesRes];
    if (all.some((result) => result.error)) return demoGovernanceData();

    const demoSelfId = (citizensRes.data ?? []).find((citizen) => citizen.display_name === "You (Demo Citizen)")?.id;
    const bills = (billsRes.data ?? []).map((bill) => ({
      ...bill,
      current_user_supports: demoSelfId
        ? Boolean((votesRes.data ?? []).find((vote) => vote.bill_id === bill.id && vote.citizen_id === demoSelfId)?.attached)
        : false,
    }));

    return {
      topics: topicsRes.data ?? [],
      citizens: citizensRes.data ?? [],
      civicIssues: issuesRes.data ?? [],
      proposals: proposalsRes.data ?? [],
      bills,
      proxyAssignments: proxiesRes.data ?? [],
      source: "supabase",
    } as GovernanceData & { source: "supabase" | "demo" };
  } catch {
    return demoGovernanceData();
  }
}

function demoGovernanceData(): GovernanceData & { source: "supabase" | "demo" } {
  return {
    topics: demoTopics,
    citizens: demoCitizens,
    civicIssues: demoCivicIssues,
    proposals: demoProposals,
    bills: demoBills,
    proxyAssignments: demoProxyAssignments,
    source: "demo",
  };
}

// ==========================================================
// GOVERNANCE SERVICE 002 — Prototype mutations
// Live inserts are attempted when the multi-polity schema exists;
// otherwise a generated object is returned for local prototype state.
// ==========================================================

export async function createCivicIssue(input: Omit<CivicIssue, "id" | "created_at" | "proposal_count" | "status">): Promise<CivicIssue> {
  const fallback: CivicIssue = {
    ...input,
    id: `ci-${Date.now()}`,
    status: "Open",
    proposal_count: 0,
    created_at: new Date().toISOString(),
  };

  if (!supabase) return fallback;

  try {
    const polityRes = await supabase.from("polities").select("id").eq("slug", polity.slug).maybeSingle();
    if (!polityRes.data?.id) return fallback;
    const { data, error } = await supabase
      .from("civic_issues")
      .insert({ ...input, polity_id: polityRes.data.id, status: "Open", proposal_count: 0 })
      .select("*")
      .single();
    return error || !data ? fallback : (data as CivicIssue);
  } catch {
    return fallback;
  }
}

export async function createProposal(input: Omit<Proposal, "id" | "updated_at" | "revision_count" | "fork_count" | "status">): Promise<Proposal> {
  const fallback: Proposal = {
    ...input,
    id: `prop-${Date.now()}`,
    status: "Draft",
    revision_count: 1,
    fork_count: 0,
    updated_at: new Date().toISOString(),
  };

  if (!supabase) return fallback;

  try {
    const polityRes = await supabase.from("polities").select("id").eq("slug", polity.slug).maybeSingle();
    if (!polityRes.data?.id) return fallback;
    const { data, error } = await supabase
      .from("proposals")
      .insert({ ...input, polity_id: polityRes.data.id, status: "Draft", revision_count: 1, fork_count: 0 })
      .select("*")
      .single();
    return error || !data ? fallback : (data as Proposal);
  } catch {
    return fallback;
  }
}

export async function saveProxyAssignment(input: {
  owner_id: string;
  proxy_id: string;
  topic_id: string;
  disposition: ProxyDisposition;
}): Promise<ProxyAssignment> {
  const fallback: ProxyAssignment = {
    ...input,
    id: `px-${Date.now()}-${input.topic_id}`,
    active: true,
    created_at: new Date().toISOString(),
  };

  if (!supabase) return fallback;

  try {
    const polityRes = await supabase.from("polities").select("id").eq("slug", polity.slug).maybeSingle();
    if (!polityRes.data?.id) return fallback;
    await supabase
      .from("proxy_assignments")
      .update({ active: false })
      .eq("polity_id", polityRes.data.id)
      .eq("owner_id", input.owner_id)
      .eq("topic_id", input.topic_id)
      .eq("active", true);

    const { data, error } = await supabase
      .from("proxy_assignments")
      .insert({ ...input, polity_id: polityRes.data.id, active: true })
      .select("*")
      .single();
    return error || !data ? fallback : (data as ProxyAssignment);
  } catch {
    return fallback;
  }
}

export async function removeProxyAssignment(ownerId: string, topicId: string): Promise<void> {
  if (!supabase) return;
  try {
    const polityRes = await supabase.from("polities").select("id").eq("slug", polity.slug).maybeSingle();
    if (!polityRes.data?.id) return;
    await supabase
      .from("proxy_assignments")
      .update({ active: false })
      .eq("polity_id", polityRes.data.id)
      .eq("owner_id", ownerId)
      .eq("topic_id", topicId)
      .eq("active", true);
  } catch {
    // Demo/local state remains authoritative for the prototype.
  }
}

export async function toggleBillSupport(bill: Bill, citizenId: string, support: boolean): Promise<Bill> {
  const delta = support === Boolean(bill.current_user_supports) ? 0 : support ? 1 : -1;
  const supportCount = Math.max(0, bill.support_count + delta);
  const supportPercent = bill.electorate_count ? (supportCount / bill.electorate_count) * 100 : 0;

  let state = bill.state;
  if (bill.state === "Voting") {
    state = supportPercent >= polity.supportThreshold * 100 ? "In Force" : "Voting";
  } else if (bill.state === "In Force") {
    state = supportPercent < polity.removalThreshold * 100 ? "Out of Force" : "In Force";
  } else {
    state = supportPercent >= polity.supportThreshold * 100 ? "In Force" : "Out of Force";
  }

  const fallback: Bill = {
    ...bill,
    support_count: supportCount,
    support_percent: supportPercent,
    state,
    current_user_supports: support,
  };

  if (!supabase) return fallback;

  try {
    const polityRes = await supabase.from("polities").select("id").eq("slug", polity.slug).maybeSingle();
    if (!polityRes.data?.id) return fallback;

    if (support) {
      await supabase.from("bill_votes").upsert(
        { polity_id: polityRes.data.id, bill_id: bill.id, citizen_id: citizenId, attached: true },
        { onConflict: "bill_id,citizen_id" },
      );
    } else {
      await supabase.from("bill_votes").upsert(
        { polity_id: polityRes.data.id, bill_id: bill.id, citizen_id: citizenId, attached: false },
        { onConflict: "bill_id,citizen_id" },
      );
    }

    return fallback;
  } catch {
    return fallback;
  }
}
