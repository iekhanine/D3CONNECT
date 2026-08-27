import { polity } from "../config/polity";
import {
  demoBills,
  demoCitizens,
  demoCivicIssues,
  demoProposals,
  demoProxyAssignments,
  demoTopics,
} from "../data/governanceDemo";
import type {
  Bill,
  CivicIssue,
  GovernanceData,
  Proposal,
  ProxyAssignment,
  ProxyStatus,
  Topic,
} from "../types";
import { supabase } from "./supabase";

// ==========================================================
// GOVERNANCE SERVICE 001 — Supabase helpers
// Supabase is authoritative whenever it is configured.
// Static demo data is read-only fallback data only.
// ==========================================================

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

function requireSupabase() {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env.local.",
    );
  }
  return supabase;
}

async function getPolityId(): Promise<string> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("polities")
    .select("id")
    .eq("slug", polity.slug)
    .maybeSingle();

  if (error) throw new Error(`Could not load ${polity.districtShortName}: ${error.message}`);
  if (!data?.id) {
    throw new Error(
      `No Supabase polity exists for slug “${polity.slug}”. Run the supplied schema and seed migrations first.`,
    );
  }

  return String(data.id);
}

function createId(_prefix?: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  // RFC 4122-compatible fallback for older browsers. Supabase UUID columns
  // must receive UUIDs; human-readable prefixes such as "ci-" are invalid.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function isUuid(value: string | undefined | null): value is string {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value));
}

function uuidOrNew(value: string | undefined | null): string {
  return isUuid(value) ? value : createId();
}

function normalizeProxyAssignment(row: Record<string, unknown>): ProxyAssignment {
  const rawStatus = row.status;
  const status: ProxyStatus = rawStatus === "pending" || rawStatus === "declined" || rawStatus === "accepted"
    ? rawStatus
    : "pending";

  return {
    id: String(row.id ?? createId("px")),
    polity_id: row.polity_id ? String(row.polity_id) : undefined,
    owner_id: String(row.owner_id ?? ""),
    proxy_id: String(row.proxy_id ?? ""),
    status,
    active: row.active !== false,
    created_at: String(row.created_at ?? new Date().toISOString()),
    responded_at: row.responded_at ? String(row.responded_at) : null,
  };
}

// ==========================================================
// GOVERNANCE SERVICE 002 — Load all governance data
// ==========================================================

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

// ==========================================================
// GOVERNANCE SERVICE 003 — Resident issue / proposal writes
// ==========================================================

export async function createCivicIssue(
  input: Omit<CivicIssue, "id" | "created_at" | "proposal_count" | "status">,
): Promise<CivicIssue> {
  const client = requireSupabase();
  const polityId = await getPolityId();

  const record: CivicIssue = {
    ...input,
    id: createId("ci"),
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
    id: createId("prop"),
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

// ==========================================================
// GOVERNANCE SERVICE 004 — General proxy lifecycle
// One owner -> one active general proxy request/relationship.
// There are deliberately no topic/category proxy assignments.
// ==========================================================

export async function saveProxyAssignment(input: {
  owner_id: string;
  proxy_id: string;
}): Promise<ProxyAssignment> {
  if (input.owner_id === input.proxy_id) throw new Error("You cannot give your proxy to yourself.");

  const client = requireSupabase();
  const polityId = await getPolityId();

  const deactivate = await client
    .from("proxy_assignments")
    .update({ active: false })
    .eq("polity_id", polityId)
    .eq("owner_id", input.owner_id)
    .eq("active", true);
  if (deactivate.error) throw new Error(`Could not replace the existing proxy: ${deactivate.error.message}`);

  const record = {
    id: createId("px"),
    polity_id: polityId,
    owner_id: input.owner_id,
    proxy_id: input.proxy_id,
    status: "pending" as const,
    active: true,
    created_at: new Date().toISOString(),
    responded_at: null,
  };

  const { data, error } = await client.from("proxy_assignments").insert(record).select("*").single();
  if (error) throw new Error(`The proxy request was not saved to Supabase: ${error.message}`);
  return normalizeProxyAssignment(data as Record<string, unknown>);
}

export async function removeProxyAssignment(ownerId: string): Promise<void> {
  const client = requireSupabase();
  const polityId = await getPolityId();

  const { error } = await client
    .from("proxy_assignments")
    .update({ active: false })
    .eq("polity_id", polityId)
    .eq("owner_id", ownerId)
    .eq("active", true);

  if (error) throw new Error(`The proxy could not be returned/withdrawn: ${error.message}`);
}

export async function respondToProxyAssignment(
  assignmentId: string,
  proxyId: string,
  status: Exclude<ProxyStatus, "pending">,
): Promise<ProxyAssignment | null> {
  const client = requireSupabase();
  const respondedAt = new Date().toISOString();

  const update = status === "declined"
    ? { status, responded_at: respondedAt, active: false }
    : { status, responded_at: respondedAt, active: true };

  const { data, error } = await client
    .from("proxy_assignments")
    .update(update)
    .eq("id", assignmentId)
    .eq("proxy_id", proxyId)
    .eq("active", true)
    .select("*")
    .maybeSingle();

  if (error) throw new Error(`The proxy response was not saved: ${error.message}`);
  return data ? normalizeProxyAssignment(data as Record<string, unknown>) : null;
}

// ==========================================================
// GOVERNANCE SERVICE 005 — Bill support
// ==========================================================

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

// ==========================================================
// GOVERNANCE SERVICE 006 — ADMIN CRUD
// These are the only write paths used by v1 ADMIN.
// ==========================================================

export async function upsertCivicIssue(issue: CivicIssue): Promise<void> {
  const client = requireSupabase();
  const polityId = await getPolityId();
  const record = { ...issue, polity_id: polityId, id: uuidOrNew(issue.id) };
  const { error } = await client.from("civic_issues").upsert(record, { onConflict: "id" });
  if (error) throw new Error(`Issue save failed: ${error.message}`);
}

export async function deleteCivicIssue(issueId: string): Promise<void> {
  const client = requireSupabase();
  const polityId = await getPolityId();

  const { data: proposalRows, error: proposalLoadError } = await client
    .from("proposals")
    .select("id,issue_ids")
    .eq("polity_id", polityId)
    .contains("issue_ids", [issueId]);
  if (proposalLoadError) throw new Error(`Could not unlink the issue: ${proposalLoadError.message}`);

  for (const proposal of (proposalRows ?? []) as Array<{ id: string; issue_ids: string[] | null }>) {
    const issueIds = Array.isArray(proposal.issue_ids)
      ? proposal.issue_ids.map(String).filter((id: string) => id !== issueId)
      : [];
    const result = await client.from("proposals").update({ issue_ids: issueIds }).eq("id", proposal.id);
    if (result.error) throw new Error(`Could not unlink a related solution: ${result.error.message}`);
  }

  const { error } = await client.from("civic_issues").delete().eq("id", issueId).eq("polity_id", polityId);
  if (error) throw new Error(`Issue delete failed: ${error.message}`);
}

export async function upsertProposal(proposal: Proposal): Promise<void> {
  const client = requireSupabase();
  const polityId = await getPolityId();
  const record = {
    ...proposal,
    polity_id: polityId,
    id: uuidOrNew(proposal.id),
    updated_at: new Date().toISOString(),
  };
  const { error } = await client.from("proposals").upsert(record, { onConflict: "id" });
  if (error) throw new Error(`Solution save failed: ${error.message}`);
}

export async function deleteProposal(proposalId: string): Promise<void> {
  const client = requireSupabase();
  const polityId = await getPolityId();

  // The existing database intentionally does not cascade bills when a
  // proposal is removed, so ADMIN explicitly removes derived decisions first.
  const billDelete = await client
    .from("bills")
    .delete()
    .eq("polity_id", polityId)
    .eq("proposal_id", proposalId);
  if (billDelete.error) throw new Error(`Could not remove decisions linked to the solution: ${billDelete.error.message}`);

  const { error } = await client.from("proposals").delete().eq("id", proposalId).eq("polity_id", polityId);
  if (error) throw new Error(`Solution delete failed: ${error.message}`);
}

export async function upsertBill(bill: Bill): Promise<void> {
  const client = requireSupabase();
  const polityId = await getPolityId();
  const { current_user_supports: _currentUserSupports, ...databaseBill } = bill;
  const record = { ...databaseBill, polity_id: polityId, id: uuidOrNew(bill.id) };
  const { error } = await client.from("bills").upsert(record, { onConflict: "id" });
  if (error) throw new Error(`Decision save failed: ${error.message}`);
}

export async function deleteBill(billId: string): Promise<void> {
  const client = requireSupabase();
  const polityId = await getPolityId();
  const { error } = await client.from("bills").delete().eq("id", billId).eq("polity_id", polityId);
  if (error) throw new Error(`Decision delete failed: ${error.message}`);
}

export async function upsertTopic(topic: Topic): Promise<void> {
  const client = requireSupabase();
  const polityId = await getPolityId();
  const record = { ...topic, polity_id: polityId, id: uuidOrNew(topic.id) };
  const { error } = await client.from("governance_topics").upsert(record, { onConflict: "id" });
  if (error) throw new Error(`Topic save failed: ${error.message}`);
}

export async function deleteTopic(topicId: string): Promise<void> {
  const client = requireSupabase();
  const polityId = await getPolityId();

  const { data: existingGeneral, error: generalLoadError } = await client
    .from("governance_topics")
    .select("id")
    .eq("polity_id", polityId)
    .eq("name", "General")
    .maybeSingle();
  if (generalLoadError) throw new Error(`Could not locate General topic: ${generalLoadError.message}`);

  let generalTopicId = existingGeneral?.id ? String(existingGeneral.id) : "";
  if (!generalTopicId) {
    const { data: insertedGeneral, error: generalInsertError } = await client
      .from("governance_topics")
      .insert({
        id: createId(),
        polity_id: polityId,
        name: "General",
        description: "Issues that have not yet been assigned to a more specific organizational topic.",
        color_key: null,
      })
      .select("id")
      .single();
    if (generalInsertError) throw new Error(`Could not prepare General topic: ${generalInsertError.message}`);
    generalTopicId = String(insertedGeneral.id);
  }

  const reassignResult = await client
    .from("civic_issues")
    .update({ topic_id: generalTopicId })
    .eq("polity_id", polityId)
    .eq("topic_id", topicId);
  if (reassignResult.error) throw new Error(`Could not reassign affected issues: ${reassignResult.error.message}`);

  // Bills may still use topics for content organization. That is separate
  // from proxy scope; clear that optional classification before deletion.
  const billTopicResult = await client
    .from("bills")
    .update({ topic_id: null })
    .eq("polity_id", polityId)
    .eq("topic_id", topicId);
  if (billTopicResult.error) throw new Error(`Could not unlink affected decisions: ${billTopicResult.error.message}`);

  const { error } = await client.from("governance_topics").delete().eq("id", topicId).eq("polity_id", polityId);
  if (error) throw new Error(`Topic delete failed: ${error.message}`);
}

// ==========================================================
// GOVERNANCE SERVICE 007 — Reset Supabase governance seed
// Intended only for the unauthenticated v1 client prototype.
// ==========================================================

export async function resetGovernanceDemoData(): Promise<void> {
  const client = requireSupabase();
  const polityId = await getPolityId();

  const deleteTables = ["bill_votes", "proxy_assignments", "bills", "proposals", "civic_issues", "governance_topics", "citizens"] as const;
  for (const table of deleteTables) {
    const result = await client.from(table).delete().eq("polity_id", polityId);
    if (result.error) throw new Error(`Reset failed while clearing ${table}: ${result.error.message}`);
  }

  // Static fallback demo records use readable IDs. Supabase uses UUID PK/FKs,
  // so build a fresh UUID map whenever the live prototype is reset.
  const topicIds = new Map(demoTopics.map((row) => [row.id, createId()]));
  const citizenIds = new Map(demoCitizens.map((row) => [row.id, createId()]));
  const issueIds = new Map(demoCivicIssues.map((row) => [row.id, createId()]));
  const proposalIds = new Map(demoProposals.map((row) => [row.id, createId()]));
  const billIds = new Map(demoBills.map((row) => [row.id, createId()]));

  const topicRows = demoTopics.map((row) => ({
    ...row,
    id: topicIds.get(row.id)!,
    polity_id: polityId,
  }));
  const topicResult = await client.from("governance_topics").insert(topicRows);
  if (topicResult.error) throw new Error(`Reset topic seed failed: ${topicResult.error.message}`);

  const citizenRows = demoCitizens.map((row) => ({
    ...row,
    id: citizenIds.get(row.id)!,
    polity_id: polityId,
  }));
  const citizenResult = await client.from("citizens").insert(citizenRows);
  if (citizenResult.error) throw new Error(`Reset citizen seed failed: ${citizenResult.error.message}`);

  const issueRows = demoCivicIssues.map((row) => ({
    ...row,
    id: issueIds.get(row.id)!,
    polity_id: polityId,
    created_by: citizenIds.get(row.created_by) ?? row.created_by,
    topic_id: topicIds.get(row.topic_id) ?? row.topic_id,
  }));
  const issueResult = await client.from("civic_issues").insert(issueRows);
  if (issueResult.error) throw new Error(`Reset issue seed failed: ${issueResult.error.message}`);

  const proposalRows = demoProposals.map((row) => ({
    ...row,
    id: proposalIds.get(row.id)!,
    polity_id: polityId,
    maintainer_id: citizenIds.get(row.maintainer_id) ?? row.maintainer_id,
    issue_ids: row.issue_ids.map((id) => issueIds.get(id) ?? id),
    parent_proposal_id: row.parent_proposal_id ? proposalIds.get(row.parent_proposal_id) ?? null : null,
  }));
  const proposalResult = await client.from("proposals").insert(proposalRows);
  if (proposalResult.error) throw new Error(`Reset solution seed failed: ${proposalResult.error.message}`);

  const billRows = demoBills.map(({ current_user_supports: _currentUserSupports, ...row }) => ({
    ...row,
    id: billIds.get(row.id)!,
    polity_id: polityId,
    proposal_id: proposalIds.get(row.proposal_id) ?? row.proposal_id,
  }));
  const billResult = await client.from("bills").insert(billRows);
  if (billResult.error) throw new Error(`Reset decision seed failed: ${billResult.error.message}`);

  const proxyRows = demoProxyAssignments.map((row) => ({
    ...row,
    id: createId(),
    polity_id: polityId,
    owner_id: citizenIds.get(row.owner_id) ?? row.owner_id,
    proxy_id: citizenIds.get(row.proxy_id) ?? row.proxy_id,
  }));
  const proxyResult = await client.from("proxy_assignments").insert(proxyRows);
  if (proxyResult.error) throw new Error(`Reset proxy seed failed: ${proxyResult.error.message}`);

  const demoVotes: Array<[string, string, boolean]> = [
    ["bill-1", "citizen-you", true], ["bill-1", "citizen-maya", true], ["bill-1", "citizen-devon", true], ["bill-1", "citizen-omar", true], ["bill-1", "citizen-ruth", true],
    ["bill-2", "citizen-maya", true], ["bill-2", "citizen-devon", true], ["bill-2", "citizen-lena", true], ["bill-2", "citizen-sam", true], ["bill-2", "citizen-you", false],
    ["bill-3", "citizen-omar", true], ["bill-3", "citizen-ruth", true], ["bill-3", "citizen-you", false],
  ];
  const voteRows = demoVotes.map(([billId, citizenId, attached]) => ({
    polity_id: polityId,
    bill_id: billIds.get(billId)!,
    citizen_id: citizenIds.get(citizenId)!,
    attached,
  }));
  const voteResult = await client.from("bill_votes").insert(voteRows);
  if (voteResult.error) throw new Error(`Reset vote seed failed: ${voteResult.error.message}`);
}

