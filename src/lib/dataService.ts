import { polity } from "../config/polity";
import { businesses as demoBusinesses, events as demoEvents, neighborhoods as demoNeighborhoods, projects as demoProjects, resources as demoResources } from "../data/demo";
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
// DATA SERVICE 001 — Community data scoped to active polity
// ==========================================================

export async function loadDashboardData(): Promise<DashboardData> {
  if (!supabase) return demoData();

  try {
    const polityRes = await supabase.from("polities").select("id").eq("slug", polity.slug).maybeSingle();
    if (polityRes.error || !polityRes.data?.id) return demoData();
    const polityId = polityRes.data.id as string;

    const [projectsRes, resourcesRes, eventsRes, businessesRes, neighborhoodsRes] = await Promise.all([
      supabase.from("projects").select("*").eq("polity_id", polityId).order("created_at", { ascending: false }),
      supabase.from("resources").select("*").eq("polity_id", polityId).order("title"),
      supabase.from("community_events").select("*").eq("polity_id", polityId).order("event_date"),
      supabase.from("businesses").select("*").eq("polity_id", polityId).order("name"),
      supabase.from("neighborhoods").select("*").eq("polity_id", polityId).order("name"),
    ]);

    const results = [projectsRes, resourcesRes, eventsRes, businessesRes, neighborhoodsRes];
    if (results.some((result) => result.error)) return demoData();

    return {
      projects: (projectsRes.data ?? []) as Project[],
      resources: (resourcesRes.data ?? []) as Resource[],
      events: (eventsRes.data ?? []) as CommunityEvent[],
      businesses: (businessesRes.data ?? []) as Business[],
      neighborhoods: (neighborhoodsRes.data ?? []) as Neighborhood[],
      source: "supabase",
    };
  } catch {
    return demoData();
  }
}

function demoData(): DashboardData {
  return { projects: demoProjects, resources: demoResources, events: demoEvents, businesses: demoBusinesses, neighborhoods: demoNeighborhoods, source: "demo" };
}

// ==========================================================
// DATA SERVICE 002 — Legacy community submission helpers
// ==========================================================

export async function submitIssue(payload: { category: string; description: string; neighborhood: string; location: string; email?: string }) {
  if (!supabase) return { ok: true, demo: true };
  try {
    const polityRes = await supabase.from("polities").select("id").eq("slug", polity.slug).maybeSingle();
    if (!polityRes.data?.id) return { ok: true, demo: true };
    const { error } = await supabase.from("issues").insert({ ...payload, polity_id: polityRes.data.id });
    return { ok: true, demo: Boolean(error) };
  } catch { return { ok: true, demo: true }; }
}

export async function submitFeedback(payload: { message: string; neighborhood: string; email?: string }) {
  if (!supabase) return { ok: true, demo: true };
  try {
    const polityRes = await supabase.from("polities").select("id").eq("slug", polity.slug).maybeSingle();
    if (!polityRes.data?.id) return { ok: true, demo: true };
    const { error } = await supabase.from("feedback").insert({ ...payload, polity_id: polityRes.data.id });
    return { ok: true, demo: Boolean(error) };
  } catch { return { ok: true, demo: true }; }
}

export async function subscribe(email: string, neighborhood: string) {
  if (!supabase) return { ok: true, demo: true };
  try {
    const polityRes = await supabase.from("polities").select("id").eq("slug", polity.slug).maybeSingle();
    if (!polityRes.data?.id) return { ok: true, demo: true };
    const { error } = await supabase.from("subscribers").upsert({ email, neighborhood, polity_id: polityRes.data.id }, { onConflict: "polity_id,email" });
    return { ok: true, demo: Boolean(error) };
  } catch { return { ok: true, demo: true }; }
}
