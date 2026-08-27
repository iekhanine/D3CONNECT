import { polity } from "../config/polity";
import {
  businesses as demoBusinesses,
  events as demoEvents,
  neighborhoods as demoNeighborhoods,
  projects as demoProjects,
  resources as demoResources,
} from "../data/demo";
import type { Business, CommunityEvent, Neighborhood, Project, Resource } from "../types";
import { supabase } from "./supabase";

export interface DashboardData {
  projects: Project[];
  resources: Resource[];
  events: CommunityEvent[];
  businesses: Business[];
  neighborhoods: Neighborhood[];
  source: "supabase" | "demo";
}

// ==========================================================
// DATA SERVICE 001 — Shared Supabase helpers
// ==========================================================

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
  const { data, error } = await client.from("polities").select("id").eq("slug", polity.slug).maybeSingle();
  if (error) throw new Error(`Could not resolve ${polity.districtShortName}: ${error.message}`);
  if (!data?.id) throw new Error(`No Supabase polity exists for slug “${polity.slug}”.`);
  return String(data.id);
}

function demoData(): DashboardData {
  return {
    projects: structuredClone(demoProjects),
    resources: structuredClone(demoResources),
    events: structuredClone(demoEvents),
    businesses: structuredClone(demoBusinesses),
    neighborhoods: structuredClone(demoNeighborhoods),
    source: "demo",
  };
}

// ==========================================================
// DATA SERVICE 002 — Community data scoped to active polity
// ==========================================================

export async function loadDashboardData(): Promise<DashboardData> {
  if (!supabase) return demoData();

  try {
    const polityId = await getPolityId();
    const [projectsRes, resourcesRes, eventsRes, businessesRes, neighborhoodsRes] = await Promise.all([
      supabase.from("projects").select("*").eq("polity_id", polityId).order("created_at", { ascending: false }),
      supabase.from("resources").select("*").eq("polity_id", polityId).order("title"),
      supabase.from("community_events").select("*").eq("polity_id", polityId).order("event_date"),
      supabase.from("businesses").select("*").eq("polity_id", polityId).order("name"),
      supabase.from("neighborhoods").select("*").eq("polity_id", polityId).order("name"),
    ]);

    const failed = [projectsRes, resourcesRes, eventsRes, businessesRes, neighborhoodsRes].find((result) => result.error);
    if (failed?.error) throw new Error(failed.error.message);

    return {
      projects: (projectsRes.data ?? []) as Project[],
      resources: (resourcesRes.data ?? []) as Resource[],
      events: (eventsRes.data ?? []) as CommunityEvent[],
      businesses: (businessesRes.data ?? []) as Business[],
      neighborhoods: (neighborhoodsRes.data ?? []) as Neighborhood[],
      source: "supabase",
    };
  } catch (error) {
    console.error("D3 Connect: Supabase community load failed; using read-only demo data.", error);
    return demoData();
  }
}

// ==========================================================
// DATA SERVICE 003 — Community submissions
// These no longer silently report success when Supabase fails.
// ==========================================================

export async function submitIssue(payload: {
  category: string;
  description: string;
  neighborhood: string;
  location: string;
  email?: string;
}) {
  const client = requireSupabase();
  const polityId = await getPolityId();
  const { error } = await client.from("issues").insert({ ...payload, polity_id: polityId });
  if (error) throw new Error(`Issue submission failed: ${error.message}`);
  return { ok: true };
}

export async function submitFeedback(payload: {
  message: string;
  neighborhood: string;
  email?: string;
}) {
  const client = requireSupabase();
  const polityId = await getPolityId();
  const { error } = await client.from("feedback").insert({ ...payload, polity_id: polityId });
  if (error) throw new Error(`Feedback submission failed: ${error.message}`);
  return { ok: true };
}

export async function subscribe(email: string, neighborhood: string) {
  const client = requireSupabase();
  const polityId = await getPolityId();
  const { error } = await client
    .from("subscribers")
    .upsert({ email, neighborhood, polity_id: polityId }, { onConflict: "polity_id,email" });
  if (error) throw new Error(`Subscription failed: ${error.message}`);
  return { ok: true };
}
