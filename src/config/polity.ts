import type { PolityConfig } from "../types";

// Deployment configuration

const env = import.meta.env;

export const polity: PolityConfig = {
  slug: env.VITE_POLITY_SLUG || "portland-d3",
  productName: env.VITE_PRODUCT_NAME || "D3 Connect",
  shortName: env.VITE_DISTRICT_SHORT_CODE || "D3",
  jurisdictionName: env.VITE_JURISDICTION_NAME || "Portland City Council",
  districtName: env.VITE_DISTRICT_NAME || "Portland City Council District 3",
  districtShortName: env.VITE_DISTRICT_SHORT_NAME || "District 3",
  locationName: env.VITE_LOCATION_NAME || "Portland, Oregon",
  tagline: env.VITE_TAGLINE || "Your District. Your Voice.",
  communityTagline: env.VITE_COMMUNITY_TAGLINE || "21 neighborhoods. One community.",
  supportThreshold: Number(env.VITE_SUPPORT_THRESHOLD || 2 / 3),
  removalThreshold: Number(env.VITE_REMOVAL_THRESHOLD || 1 / 3),
  secretaryRoleName: env.VITE_SECRETARY_ROLE_NAME || "Secretary of State",
  demoCitizenId: "citizen-you",
};

export const percent = (value: number) => `${(value * 100).toFixed(value * 100 % 1 === 0 ? 0 : 1)}%`;
