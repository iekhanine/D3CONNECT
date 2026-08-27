import {
  demoBills,
  demoCitizens,
  demoCivicIssues,
  demoProposals,
  demoProxyAssignments,
  demoTopics,
} from "../data/governanceDemo";
import type { Bill, CivicIssue, GovernanceData, Proposal, Topic } from "../types";

const STORAGE_KEY = "d3connect.prototype.governance.v2";
export const PROTOTYPE_DATA_EVENT = "d3connect:prototype-data";

function cloneSeed(): GovernanceData {
  return JSON.parse(JSON.stringify({
    topics: demoTopics,
    citizens: demoCitizens,
    civicIssues: demoCivicIssues,
    proposals: demoProposals,
    bills: demoBills,
    proxyAssignments: demoProxyAssignments,
  })) as GovernanceData;
}

function normalize(data: GovernanceData): GovernanceData {
  const seed = cloneSeed();
  return {
    topics: Array.isArray(data.topics) ? data.topics : seed.topics,
    citizens: Array.isArray(data.citizens) ? data.citizens : seed.citizens,
    civicIssues: Array.isArray(data.civicIssues) ? data.civicIssues : seed.civicIssues,
    proposals: Array.isArray(data.proposals) ? data.proposals : seed.proposals,
    bills: Array.isArray(data.bills) ? data.bills : seed.bills,
    proxyAssignments: Array.isArray(data.proxyAssignments) ? data.proxyAssignments : seed.proxyAssignments,
  };
}

export function loadPrototypeData(): GovernanceData {
  if (typeof window === "undefined") return cloneSeed();

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seed = cloneSeed();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }

  try {
    return normalize(JSON.parse(raw) as GovernanceData);
  } catch {
    const seed = cloneSeed();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
}

export function savePrototypeData(data: GovernanceData): GovernanceData {
  const normalized = normalize(data);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent(PROTOTYPE_DATA_EVENT));
  return normalized;
}

export function updatePrototypeData(mutator: (current: GovernanceData) => GovernanceData): GovernanceData {
  return savePrototypeData(mutator(loadPrototypeData()));
}

export function resetPrototypeData(): GovernanceData {
  return savePrototypeData(cloneSeed());
}

export function upsertPrototypeIssue(issue: CivicIssue): GovernanceData {
  return updatePrototypeData((current) => ({
    ...current,
    civicIssues: [issue, ...current.civicIssues.filter((item) => item.id !== issue.id)],
  }));
}

export function deletePrototypeIssue(issueId: string): GovernanceData {
  return updatePrototypeData((current) => ({
    ...current,
    civicIssues: current.civicIssues.filter((item) => item.id !== issueId),
    proposals: current.proposals.map((proposal) => ({
      ...proposal,
      issue_ids: proposal.issue_ids.filter((id) => id !== issueId),
    })),
  }));
}

export function upsertPrototypeProposal(proposal: Proposal): GovernanceData {
  return updatePrototypeData((current) => {
    const proposals = [proposal, ...current.proposals.filter((item) => item.id !== proposal.id)];
    const civicIssues = current.civicIssues.map((issue) => ({
      ...issue,
      proposal_count: proposals.filter((candidate) => candidate.issue_ids.includes(issue.id)).length,
    }));
    return { ...current, proposals, civicIssues };
  });
}

export function deletePrototypeProposal(proposalId: string): GovernanceData {
  return updatePrototypeData((current) => {
    const proposals = current.proposals.filter((item) => item.id !== proposalId);
    const civicIssues = current.civicIssues.map((issue) => ({
      ...issue,
      proposal_count: proposals.filter((candidate) => candidate.issue_ids.includes(issue.id)).length,
    }));
    return {
      ...current,
      proposals,
      civicIssues,
      bills: current.bills.filter((bill) => bill.proposal_id !== proposalId),
    };
  });
}

export function upsertPrototypeBill(bill: Bill): GovernanceData {
  return updatePrototypeData((current) => ({
    ...current,
    bills: [bill, ...current.bills.filter((item) => item.id !== bill.id)],
  }));
}

export function deletePrototypeBill(billId: string): GovernanceData {
  return updatePrototypeData((current) => ({
    ...current,
    bills: current.bills.filter((item) => item.id !== billId),
  }));
}

export function upsertPrototypeTopic(topic: Topic): GovernanceData {
  return updatePrototypeData((current) => ({
    ...current,
    topics: [topic, ...current.topics.filter((item) => item.id !== topic.id)].sort((a, b) => a.name.localeCompare(b.name)),
  }));
}

export function deletePrototypeTopic(topicId: string): GovernanceData {
  return updatePrototypeData((current) => ({
    ...current,
    topics: current.topics.filter((item) => item.id !== topicId),
  }));
}
