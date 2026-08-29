import type { Neighborhood } from "../types";

const districtNeighborhoodNames = [
  "Ardenwald-Johnson Creek",
  "Brentwood-Darlington",
  "Brooklyn",
  "Buckman",
  "Creston-Kenilworth",
  "Foster-Powell",
  "Hosford-Abernethy",
  "Kerns",
  "Laurelhurst",
  "Montavilla",
  "Mt. Scott-Arleta",
  "Mt. Tabor",
  "North Tabor",
  "Pleasant Valley",
  "Powellhurst-Gilbert",
  "Richmond",
  "Rose City Park",
  "South Tabor",
  "Sunnyside",
  "Woodstock",
  "Center",
];

export const demoNeighborhoods: Neighborhood[] = districtNeighborhoodNames.map(
  (name, index) => ({ id: `n-${index + 1}`, name }),
);
