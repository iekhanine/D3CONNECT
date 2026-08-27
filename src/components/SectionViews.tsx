import { ArrowUpRight, CalendarDays, MapPin, Search, Store } from "lucide-react";
import { useMemo, useState } from "react";
import { submitFeedback } from "../lib/dataService";
import type { Business, CommunityEvent, Neighborhood, Project, Resource, ViewKey } from "../types";

interface Props {
  view: ViewKey;
  projects: Project[];
  resources: Resource[];
  events: CommunityEvent[];
  businesses: Business[];
  neighborhoods: Neighborhood[];
  selectedNeighborhood: string;
}

export default function SectionViews(props: Props) {
  switch (props.view) {
    case "projects": return <ProjectsView {...props} />;
    case "resources": return <ResourcesView {...props} />;
    case "calendar": return <CalendarView {...props} />;
    case "businesses": return <BusinessesView {...props} />;
    case "feedback": return <FeedbackView {...props} />;
    case "about": return <AboutView />;
    default: return null;
  }
}

function PageTitle({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return <div className="page-title"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{text}</p></div>;
}

function ProjectsView({ projects, selectedNeighborhood }: Props) {
  const [query, setQuery] = useState("");
  const visible = useMemo(() => projects.filter((p) => (selectedNeighborhood === "All" || p.neighborhood === selectedNeighborhood) && `${p.name} ${p.neighborhood} ${p.agency}`.toLowerCase().includes(query.toLowerCase())), [projects, query, selectedNeighborhood]);
  return <div className="page-view"><PageTitle eyebrow="PUBLIC ACCOUNTABILITY" title="District 3 Project Tracker" text="Follow public projects, budgets, responsible agencies, status, and estimated completion dates across District 3." /><div className="toolbar-row"><label className="search-box"><Search size={18}/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search projects, agencies, or neighborhoods" /></label><div className="result-count">{visible.length} projects</div></div><div className="card-grid">{visible.map((project)=><article className="data-card" key={project.id}><div className="card-meta"><span>{project.neighborhood}</span><span className={`status-chip status-${project.status.toLowerCase().replaceAll(" ", "-")}`}>{project.status}</span></div><h3>{project.name}</h3><p>{project.description}</p><div className="metric-row"><span><small>Agency</small><strong>{project.agency}</strong></span><span><small>Budget</small><strong>${project.budget.toLocaleString()}</strong></span><span><small>Estimate</small><strong>{project.est_completion}</strong></span></div></article>)}</div></div>;
}

function ResourcesView({ resources }: Props) {
  const [query,setQuery]=useState("");
  const visible=resources.filter((r)=>`${r.title} ${r.category} ${r.description}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="page-view"><PageTitle eyebrow="GET HELP" title="District 3 Resource Finder" text="Find practical support without having to know which bureau, nonprofit, or agency to search first."/><label className="search-box wide"><Search size={18}/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search food, housing, utilities, legal aid, employment…"/></label><div className="card-grid resource-cards">{visible.map((r)=><article className="data-card" key={r.id}><span className="category-label">{r.category}</span><h3>{r.title}</h3><p>{r.description}</p><button className="text-button">Open resource <ArrowUpRight size={15}/></button></article>)}</div></div>;
}

function CalendarView({ events, selectedNeighborhood }: Props) {
  const visible=events.filter((e)=>selectedNeighborhood==="All"||e.neighborhood===selectedNeighborhood||e.neighborhood==="District-wide");
  return <div className="page-view"><PageTitle eyebrow="WHAT'S HAPPENING" title="Community Calendar" text="Neighborhood meetings, cleanups, public office hours, markets, and community events in one place."/><div className="timeline">{visible.map((event)=>{const date=new Date(`${event.event_date}T12:00:00`);return <article className="timeline-event" key={event.id}><div className="timeline-date"><CalendarDays/><strong>{date.toLocaleDateString("en-US",{month:"short",day:"numeric"})}</strong></div><div><span className="category-label">{event.neighborhood ?? "District 3"}</span><h3>{event.title}</h3><p>{event.start_time}{event.end_time?` – ${event.end_time}`:""}</p><small><MapPin size={14}/>{event.location}</small></div></article>})}</div></div>;
}

function BusinessesView({ businesses, selectedNeighborhood }: Props) {
  const [query,setQuery]=useState("");
  const visible=businesses.filter((b)=>(selectedNeighborhood==="All"||b.neighborhood===selectedNeighborhood)&&`${b.name} ${b.category} ${b.neighborhood}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="page-view"><PageTitle eyebrow="KEEP MONEY LOCAL" title="District 3 Business Directory" text="A community-first directory for discovering independent businesses and services across District 3."/><label className="search-box wide"><Search size={18}/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search businesses or categories"/></label><div className="card-grid">{visible.map((b)=><article className="data-card business-card" key={b.id}><div className="business-icon"><Store/></div><span className="category-label">{b.category}</span><h3>{b.name}</h3><p>{b.description}</p><small><MapPin size={14}/>{b.neighborhood}{b.address?` · ${b.address}`:""}</small></article>)}</div></div>;
}

function FeedbackView({ neighborhoods, selectedNeighborhood }: Props) {
  const [message,setMessage]=useState(""); const [email,setEmail]=useState(""); const [neighborhood,setNeighborhood]=useState(selectedNeighborhood==="All"?"":selectedNeighborhood); const [sent,setSent]=useState(false);
  async function handleSubmit(e:React.FormEvent){e.preventDefault();await submitFeedback({message,neighborhood,email:email||undefined});setSent(true)}
  return <div className="page-view"><PageTitle eyebrow="CIVIC FEEDBACK" title="Tell District 3 what matters" text="Share ideas, concerns, or suggestions. This prototype is designed to turn qualitative resident feedback into useful neighborhood-level insights."/><div className="form-panel">{sent?<div className="success-state"><div className="success-check">✓</div><h3>Feedback received.</h3><p>Thank you for contributing to the District 3 community picture.</p></div>:<form className="form-grid" onSubmit={handleSubmit}><label className="full">Neighborhood<select required value={neighborhood} onChange={(e)=>setNeighborhood(e.target.value)}><option value="">Choose neighborhood</option>{neighborhoods.map(n=><option key={n.id}>{n.name}</option>)}</select></label><label className="full">What should District 3 know?<textarea rows={7} required value={message} onChange={(e)=>setMessage(e.target.value)} placeholder="What is working, what is not, and what should get more attention?"/></label><label className="full">Email (optional)<input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@example.com"/></label><div className="form-actions full"><button className="primary-button">Submit Feedback</button></div></form>}</div></div>;
}

function AboutView(){return <div className="page-view"><PageTitle eyebrow="ABOUT THE PROJECT" title="D3 Connect: a district-scale PosProx prototype" text="D3 Connect combines practical community information with a prototype governance model built around Issues, collaborative Proposals, continuously supported Bills, and topic-scoped proxy delegation."/><div className="about-grid"><article className="data-card"><h3>The premise</h3><p>Every citizen begins responsible for everything, but no citizen can reasonably handle everything. People keep direct responsibility where they have interest, competence, energy, and resources, then proxy the rest.</p></article><article className="data-card"><h3>The civic workflow</h3><p>Anyone can raise an Issue. Proposals may address one or more Issues and evolve through revision and forks. A ready version becomes a locked Bill to which citizen support can be attached or removed.</p></article><article className="data-card"><h3>Built to redeploy</h3><p>District 3 is the first polity configuration, not a hard-coded product boundary. The same application and schema can host another district by adding a polity, district data, topics, and a deployment slug.</p></article></div></div>}

