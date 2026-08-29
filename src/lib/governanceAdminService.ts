import {
  demoBills,
  demoCitizens,
  demoCivicIssues,
  demoProposals,
  demoProxyAssignments,
  demoTopics,
} from "../data/governanceDemo";
import type { Bill, CivicIssue, Proposal, Topic } from "../types";
import { createId, getPolityId, requireSupabase, uuidOrNew } from "./governanceDb";

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

// Reset Supabase governance seed

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
