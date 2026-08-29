import type { ProxyAssignment, ProxyStatus } from "../types";
import { createId, getPolityId, requireSupabase } from "./governanceDb";

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
    id: createId(),
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

// Demo incoming proxy requests

export async function createDemoIncomingProxyRequests(
  proxyId: string,
  ownerIds: string[],
): Promise<ProxyAssignment[]> {
  const client = requireSupabase();
  const polityId = await getPolityId();
  const uniqueOwnerIds = [...new Set(ownerIds)]
    .filter((ownerId) => ownerId !== proxyId)
    .slice(0, 3);

  if (uniqueOwnerIds.length === 0) {
    throw new Error("No demo citizens are available to offer a proxy.");
  }

  // Each citizen can have only one active general proxy. For a repeatable
  // demo, retire any previous active assignment from these demo owners
  // before creating a fresh pending request to the demo citizen.
  const deactivate = await client
    .from("proxy_assignments")
    .update({ active: false })
    .eq("polity_id", polityId)
    .in("owner_id", uniqueOwnerIds)
    .eq("active", true);

  if (deactivate.error) {
    throw new Error(`Could not prepare the demo proxy requests: ${deactivate.error.message}`);
  }

  const createdAt = new Date().toISOString();
  const rows = uniqueOwnerIds.map((ownerId) => ({
    id: createId(),
    polity_id: polityId,
    owner_id: ownerId,
    proxy_id: proxyId,
    status: "pending" as const,
    active: true,
    created_at: createdAt,
    responded_at: null,
  }));

  const { data, error } = await client
    .from("proxy_assignments")
    .insert(rows)
    .select("*");

  if (error) {
    throw new Error(`The demo proxy requests were not created: ${error.message}`);
  }

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) =>
    normalizeProxyAssignment(row),
  );
}
