import { polity } from "../config/polity";
import { demoNeighborhoods } from "../data/neighborhoods";
import type { Neighborhood } from "../types";
import { supabase } from "./supabase";

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

  if (error) {
    throw new Error(`Could not resolve ${polity.districtShortName}: ${error.message}`);
  }

  if (!data?.id) {
    throw new Error(`No Supabase polity exists for slug “${polity.slug}”.`);
  }

  return String(data.id);
}

export async function loadNeighborhoods(): Promise<Neighborhood[]> {
  if (!supabase) {
    return structuredClone(demoNeighborhoods);
  }

  try {
    const polityId = await getPolityId();
    const { data, error } = await supabase
      .from("neighborhoods")
      .select("*")
      .eq("polity_id", polityId)
      .order("name");

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as Neighborhood[];
  } catch (error) {
    console.error(
      "D3 Connect: neighborhood load failed; using read-only demo data.",
      error,
    );
    return structuredClone(demoNeighborhoods);
  }
}

export async function subscribe(email: string, neighborhood: string) {
  const client = requireSupabase();
  const polityId = await getPolityId();
  const { error } = await client
    .from("subscribers")
    .upsert(
      { email, neighborhood, polity_id: polityId },
      { onConflict: "polity_id,email" },
    );

  if (error) {
    throw new Error(`Subscription failed: ${error.message}`);
  }

  return { ok: true };
}
