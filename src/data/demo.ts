import type { Business, CommunityEvent, IssueCategory, Neighborhood, Project, Resource } from "../types";

export const neighborhoods: Neighborhood[] = [
  "Ardenwald-Johnson Creek", "Brentwood-Darlington", "Brooklyn", "Buckman", "Creston-Kenilworth",
  "Foster-Powell", "Hosford-Abernethy", "Kerns", "Laurelhurst", "Montavilla", "Mt. Scott-Arleta",
  "Mt. Tabor", "North Tabor", "Pleasant Valley", "Powellhurst-Gilbert", "Richmond", "Rose City Park",
  "South Tabor", "Sunnyside", "Woodstock", "Center"
].map((name, index) => ({ id: `n-${index + 1}`, name }));

export const projects: Project[] = [
  { id: "p1", name: "Mt. Tabor Park Restroom Repair", neighborhood: "Mt. Tabor", agency: "Parks & Rec", budget: 850000, status: "In Progress", est_completion: "Aug 2027", description: "Public restroom repair and accessibility improvements." },
  { id: "p2", name: "SE Division Pedestrian Improvements", neighborhood: "Richmond", agency: "PBOT", budget: 2400000, status: "Planned", est_completion: "Spring 2028", description: "Pedestrian safety, crossings, and corridor improvements." },
  { id: "p3", name: "Foster-Powell Affordable Housing", neighborhood: "Foster-Powell", agency: "PHB", budget: 12500000, status: "Permitting", est_completion: "Late 2028", description: "Affordable housing development currently in permitting." },
  { id: "p4", name: "Montavilla Street Maintenance", neighborhood: "Montavilla", agency: "PBOT", budget: 1100000, status: "Scheduled", est_completion: "Jul 2027", description: "Street surface maintenance and targeted repairs." },
  { id: "p5", name: "Sunnyside Park Playground Upgrade", neighborhood: "Sunnyside", agency: "Parks & Rec", budget: 675000, status: "Design", est_completion: "Fall 2027", description: "Playground modernization and safer surfacing." },
];

export const resources: Resource[] = [
  { id: "r1", category: "Food", title: "Food Assistance", description: "Find food pantries, meal programs, and emergency food resources serving District 3." },
  { id: "r2", category: "Housing", title: "Housing Assistance", description: "Rental assistance, shelter access, tenant resources, and housing navigation." },
  { id: "r3", category: "Mental Health", title: "Mental Health Support", description: "Counseling, crisis services, and community mental health resources." },
  { id: "r4", category: "Utilities", title: "Utility Assistance", description: "Help with energy, water, internet, and essential utility expenses." },
  { id: "r5", category: "Employment", title: "Employment Support", description: "Job search, workforce development, training, and career resources." },
  { id: "r6", category: "Legal", title: "Legal Aid", description: "Free and low-cost civil legal assistance and tenant advocacy." },
];

export const events: CommunityEvent[] = [
  { id: "e1", title: "Mt. Tabor Neighborhood Association", event_date: "2026-09-18", start_time: "7:00 PM", end_time: "9:00 PM", location: "Mt. Tabor Middle School", neighborhood: "Mt. Tabor" },
  { id: "e2", title: "Community Cleanup: Powell Park", event_date: "2026-09-20", start_time: "9:00 AM", end_time: "12:00 PM", location: "Powell Park", neighborhood: "Creston-Kenilworth" },
  { id: "e3", title: "District 3 Office Hours", event_date: "2026-09-22", start_time: "10:00 AM", end_time: "12:00 PM", location: "Virtual Event", neighborhood: "District-wide" },
  { id: "e4", title: "Montavilla Farmers Market", event_date: "2026-09-25", start_time: "9:00 AM", end_time: "2:00 PM", location: "Montavilla Plaza", neighborhood: "Montavilla" },
];

export const businesses: Business[] = [
  { id: "b1", name: "Division Street Coffee", category: "Coffee & Cafe", neighborhood: "Richmond", address: "SE Division St, Portland, OR", description: "Independent neighborhood coffee shop." },
  { id: "b2", name: "Montavilla Repair Co.", category: "Home Services", neighborhood: "Montavilla", address: "SE Stark St, Portland, OR", description: "Local repair and maintenance services." },
  { id: "b3", name: "Woodstock Books", category: "Retail", neighborhood: "Woodstock", address: "SE Woodstock Blvd, Portland, OR", description: "Independent books and community events." },
  { id: "b4", name: "Foster Road Kitchen", category: "Restaurant", neighborhood: "Foster-Powell", address: "SE Foster Rd, Portland, OR", description: "Neighborhood restaurant and gathering place." },
  { id: "b5", name: "Tabor Tech Help", category: "Professional Services", neighborhood: "Mt. Tabor", address: "Portland, OR", description: "Local technology assistance for residents and small businesses." },
];

export const issueCategories: IssueCategory[] = [
  { id: "pothole", label: "Pothole", helper: "Road damage or pavement issue" },
  { id: "streetlight", label: "Streetlight", helper: "Outage or damaged light" },
  { id: "sidewalk", label: "Sidewalk", helper: "Obstruction or accessibility issue" },
  { id: "dumping", label: "Illegal Dumping", helper: "Discarded materials or debris" },
  { id: "graffiti", label: "Graffiti", helper: "Graffiti on public or private property" },
  { id: "park", label: "Park Issue", helper: "Maintenance, restroom, or equipment issue" },
  { id: "vehicle", label: "Abandoned Vehicle", helper: "Vehicle concern on a public street" },
  { id: "noise", label: "Noise", helper: "Recurring or disruptive noise" },
  { id: "homelessness", label: "Homelessness Resources", helper: "Find outreach and support services" },
  { id: "housing", label: "Housing Concern", helper: "Tenant, rental, or housing help" },
  { id: "tree", label: "Tree Issue", helper: "Street tree or fallen limb concern" },
  { id: "other", label: "More Issues", helper: "Find the right city or community resource" },
];
