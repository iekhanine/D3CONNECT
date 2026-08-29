import { polity } from "../config/polity";
import {
  demoBills,
  demoCitizens,
  demoCivicIssues,
  demoProposals,
  demoProxyAssignments,
  demoTopics,
} from "../data/governanceDemo";
import type { Bill, CivicIssue, GovernanceData, Proposal, ProxyAssignment, ProxyStatus, Topic } from "../types";
import { createId, getPolityId, requireSupabase } from "./governanceDb";
import { supabase } from "./supabase";

type GovernanceWithSource = GovernanceData & { source: "supabase" | "demo" };

function demoGovernanceData(): GovernanceWithSource {
  return {
    topics: structuredClone(demoTopics),
    citizens: structuredClone(demoCitizens),
    civicIssues: structuredClone(demoCivicIssues),
    proposals: structuredClone(demoProposals),
    bills: structuredClone(demoBills),
    proxyAssignments: structuredClone(demoProxyAssignments),
    source: "demo",
  };
}

function normalizeProxyAssignment(row: Record<string, unknown>): ProxyAssignment {
  const rawStatus = row.status;
  const status: ProxyStatus =
    rawStatus === "pending" || rawStatus === "declined" || rawStatus === "accepted"
      ? rawStatus
      : "pending";

  return {
    id: String(row.id ?? createId()),
    polity_id: row.polity_id ? String(row.polity_id) : undefined,
    owner_id: String(row.owner_id ?? ""),
    proxy_id: String(row.proxy_id ?? ""),
    status,
    active: row.active !== false,
    created_at: String(row.created_at ?? new Date().toISOString()),
    responded_at: row.responded_at ? String(row.responded_at) : null,
  };
}

export async function loadGovernanceData(): Promise<GovernanceWithSource> {
  if (!supabase) return demoGovernanceData();

  try {
    const polityId = await getPolityId();
    const [topicsRes, citizensRes, issuesRes, proposalsRes, billsRes, proxiesRes, votesRes] = await Promise.all([
      supabase.from("governance_topics").select("*").eq("polity_id", polityId).order("name"),
      supabase.from("citizens").select("*").eq("polity_id", polityId).eq("active", true).order("display_name"),
      supabase.from("civic_issues").select("*").eq("polity_id", polityId).order("created_at", { ascending: false }),
      supabase.from("proposals").select("*").eq("polity_id", polityId).order("updated_at", { ascending: false }),
      supabase.from("bills").select("*").eq("polity_id", polityId).order("created_at", { ascending: false }),
      supabase.from("proxy_assignments").select("*").eq("polity_id", polityId).eq("active", true).order("created_at", { ascending: false }),
      supabase.from("bill_votes").select("bill_id,citizen_id,attached").eq("polity_id", polityId),
    ]);

    const results = [topicsRes, citizensRes, issuesRes, proposalsRes, billsRes, proxiesRes, votesRes];
    const failed = results.find((result) => result.error);
    if (failed?.error) throw new Error(failed.error.message);

    const citizens = (citizensRes.data ?? []) as GovernanceData["citizens"];
    const currentCitizenId = citizens.find((citizen) => citizen.display_name === "You (Demo Citizen)")?.id ?? polity.demoCitizenId;
    const voteRows = (votesRes.data ?? []) as Array<{ bill_id: string; citizen_id: string; attached: boolean }>;
    const billRows = (billsRes.data ?? []) as Bill[];

    const bills: Bill[] = billRows.map((row) => ({
      ...row,
      current_user_supports: Boolean(
        voteRows.find(
          (vote) => vote.bill_id === row.id && vote.citizen_id === currentCitizenId && vote.attached === true,
        ),
      ),
    }));

    return {
      topics: (topicsRes.data ?? []) as Topic[],
      citizens,
      civicIssues: ((issuesRes.data ?? []) as Array<CivicIssue & { topic_id?: string | null; proposal_count?: number | null }>).map((row) => ({
        ...row,
        topic_id: row.topic_id ? String(row.topic_id) : "",
        proposal_count: Number(row.proposal_count ?? 0),
      })),
      proposals: ((proposalsRes.data ?? []) as Proposal[]).map((row) => ({
        ...row,
        issue_ids: Array.isArray(row.issue_ids) ? row.issue_ids.map(String) : [],
      })),
      bills,
      proxyAssignments: ((proxiesRes.data ?? []) as Array<Record<string, unknown>>).map((row) => normalizeProxyAssignment(row)),
      source: "supabase",
    };
  } catch (error) {
    console.error("D3 Connect: Supabase governance load failed; using read-only demo data.", error);
    return demoGovernanceData();
  }
}

export async function createCivicIssue(
  input: Omit<CivicIssue, "id" | "created_at" | "proposal_count" | "status">,
): Promise<CivicIssue> {
  const client = requireSupabase();
  const polityId = await getPolityId();

  const record: CivicIssue = {
    ...input,
    id: createId(),
    polity_id: polityId,
    status: "Open",
    proposal_count: 0,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await client.from("civic_issues").insert(record).select("*").single();
  if (error) throw new Error(`The issue was not saved to Supabase: ${error.message}`);
  return data as CivicIssue;
}

export async function createProposal(
  input: Omit<Proposal, "id" | "updated_at" | "revision_count" | "fork_count" | "status">,
): Promise<Proposal> {
  const client = requireSupabase();
  const polityId = await getPolityId();

  const record: Proposal = {
    ...input,
    id: createId(),
    polity_id: polityId,
    status: "Draft",
    revision_count: 1,
    fork_count: 0,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await client.from("proposals").insert(record).select("*").single();
  if (error) throw new Error(`The solution was not saved to Supabase: ${error.message}`);
  return { ...(data as Proposal), issue_ids: Array.isArray(data.issue_ids) ? data.issue_ids : [] };
}

export async function toggleBillSupport(bill: Bill, citizenId: string, support: boolean): Promise<Bill> {
  const client = requireSupabase();
  const polityId = await getPolityId();
  const previousSupport = Boolean(bill.current_user_supports);
  const delta = support === previousSupport ? 0 : support ? 1 : -1;
  const supportCount = Math.max(0, Math.min(bill.electorate_count, bill.support_count + delta));
  const supportPercent = bill.electorate_count ? (supportCount / bill.electorate_count) * 100 : 0;

  let state = bill.state;
  if (bill.state === "Voting") {
    state = supportPercent >= polity.supportThreshold * 100 ? "In Force" : "Voting";
  } else if (bill.state === "In Force") {
    state = supportPercent < polity.removalThreshold * 100 ? "Out of Force" : "In Force";
  } else {
    state = supportPercent >= polity.supportThreshold * 100 ? "In Force" : "Out of Force";
  }

  const { error: voteError } = await client.from("bill_votes").upsert(
    {
      polity_id: polityId,
      bill_id: bill.id,
      citizen_id: citizenId,
      attached: support,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "bill_id,citizen_id" },
  );
  if (voteError) throw new Error(`The vote was not saved: ${voteError.message}`);

  const stateChanged = state !== bill.state;
  const { data, error: billError } = await client
    .from("bills")
    .update({
      support_count: supportCount,
      support_percent: supportPercent,
      state,
      last_state_change_at: stateChanged ? new Date().toISOString() : bill.last_state_change_at ?? null,
    })
    .eq("id", bill.id)
    .eq("polity_id", polityId)
    .select("*")
    .single();

  if (billError) throw new Error(`The decision totals were not updated: ${billError.message}`);
  return { ...(data as Bill), current_user_supports: support };
}
