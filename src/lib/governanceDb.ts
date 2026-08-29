import { polity } from "../config/polity";
import { supabase } from "./supabase";

export function requireSupabase() {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env.local.",
    );
  }

  return supabase;
}

export async function getPolityId(): Promise<string> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("polities")
    .select("id")
    .eq("slug", polity.slug)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load ${polity.districtShortName}: ${error.message}`);
  }

  if (!data?.id) {
    throw new Error(
      `No Supabase polity exists for slug “${polity.slug}”. Run the supplied schema and seed migrations first.`,
    );
  }

  return String(data.id);
}

export function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  // Supabase UUID columns require an RFC 4122-compatible value.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function isUuid(value: string | undefined | null): value is string {
  return Boolean(
    value &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value),
  );
}

export function uuidOrNew(value: string | undefined | null): string {
  return isUuid(value) ? value : createId();
}
