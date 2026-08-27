import {
  ArrowRight,
  Car,
  Construction,
  Footprints,
  Home,
  LampDesk,
  MessageCircle,
  MoreHorizontal,
  Paintbrush,
  Recycle,
  Siren,
  Store,
  Trees,
  Users,
} from "lucide-react";
import { issueCategories } from "../data/demo";
import type { CommunityEvent, Project, Resource } from "../types";

const issueIcons = [Construction, LampDesk, Footprints, Recycle, Paintbrush, Trees, Car, Siren, Users, Home, Trees, MoreHorizontal];

interface Props {
  projects: Project[];
  resources: Resource[];
  events: CommunityEvent[];
  selectedNeighborhood: string;
  onOpenIssue: (category?: string) => void;
  onNavigate: (view: "projects" | "resources" | "calendar" | "businesses" | "feedback") => void;
}

export default function HomeView({ projects, resources, events, selectedNeighborhood, onOpenIssue, onNavigate }: Props) {
  const filteredProjects = selectedNeighborhood === "All" ? projects : projects.filter((project) => project.neighborhood === selectedNeighborhood);
  const visibleProjects = filteredProjects.length ? filteredProjects : projects;

  return (
    <div className="dashboard-grid">
      <div className="main-column">
        <section className="hero-card">
          <div className="hero-overlay" />
          <div className="hero-content">
            <span className="eyebrow light">D3 CONNECT</span>
            <h1>Your District. Your Voice.</h1>
            <p>D3 Connect helps you find resources, report issues, track projects, and stay informed about what is happening in Portland City Council District 3.</p>
            <div className="hero-actions"><button className="primary-button bright" onClick={() => onOpenIssue()}>Report an Issue <ArrowRight size={16} /></button><button className="ghost-button" onClick={() => onNavigate("projects")}>Explore Projects</button></div>
          </div>
          <div className="district-stats">
            <strong>District 3 by the Numbers</strong>
            <div><span>21</span><small>Neighborhoods</small></div>
            <div><span>73K+</span><small>Residents</small></div>
            <div><span>2,400+</span><small>Businesses</small></div>
            <div><span>150+</span><small>Parks & green spaces</small></div>
          </div>
        </section>

        <section className="panel issue-panel">
          <div className="section-heading"><div><span className="eyebrow">GET TO THE RIGHT PLACE FASTER</span><h2>What can we help you with today?</h2></div></div>
          <div className="issue-grid">
            {issueCategories.map((item, index) => {
              const Icon = issueIcons[index];
              return <button className="issue-tile" key={item.id} onClick={() => onOpenIssue(item.id)}><Icon size={27} /><span>{item.label}</span></button>;
            })}
          </div>
        </section>

        <section className="panel project-panel">
          <div className="section-heading"><div><span className="eyebrow">PUBLIC ACCOUNTABILITY</span><h2>District 3 Project Tracker</h2></div><button className="text-button" onClick={() => onNavigate("projects")}>View all <ArrowRight size={15} /></button></div>
          <div className="project-table-wrap">
            <table className="project-table">
              <thead><tr><th>Project</th><th>Neighborhood</th><th>Agency</th><th>Budget</th><th>Status</th><th>Est. Completion</th></tr></thead>
              <tbody>{visibleProjects.slice(0, 5).map((project) => <tr key={project.id}><td><strong>{project.name}</strong></td><td>{project.neighborhood}</td><td>{project.agency}</td><td>${project.budget.toLocaleString()}</td><td><span className={`status-chip status-${project.status.toLowerCase().replaceAll(" ", "-")}`}>{project.status}</span></td><td>{project.est_completion}</td></tr>)}</tbody>
            </table>
          </div>
        </section>

        <div className="promo-grid">
          <section className="promo-card feedback-promo"><MessageCircle size={34} /><div><h3>Have something to say?</h3><p>Your feedback helps District 3 get better. Share an idea, concern, or suggestion.</p><button className="secondary-button" onClick={() => onNavigate("feedback")}>Share Feedback</button></div></section>
          <section className="promo-card business-promo"><Store size={38} /><div><h3>Support Local. Shop Local.</h3><p>Discover and support small businesses in your neighborhood.</p><button className="secondary-button amber" onClick={() => onNavigate("businesses")}>Browse Businesses</button></div></section>
        </div>
      </div>

      <aside className="right-column">
        <section className="panel compact-panel">
          <div className="section-heading"><h2>Upcoming Events</h2><button className="text-button" onClick={() => onNavigate("calendar")}>View Calendar <ArrowRight size={14} /></button></div>
          <div className="event-list">{events.slice(0, 4).map((event) => { const date = new Date(`${event.event_date}T12:00:00`); return <article className="event-item" key={event.id}><div className="date-badge"><small>{date.toLocaleDateString("en-US", { month: "short" }).toUpperCase()}</small><strong>{date.getDate()}</strong></div><div><strong>{event.title}</strong><span>{event.start_time}{event.end_time ? ` – ${event.end_time}` : ""}</span><small>{event.location}</small></div></article>; })}</div>
        </section>

        <section className="panel compact-panel">
          <div className="section-heading"><h2>Featured Resources</h2><button className="text-button" onClick={() => onNavigate("resources")}>View All <ArrowRight size={14} /></button></div>
          <div className="resource-list">{resources.slice(0, 4).map((resource) => <button key={resource.id} onClick={() => onNavigate("resources")}><span className="resource-icon">+</span><div><strong>{resource.title}</strong><small>{resource.description}</small></div><ArrowRight size={15} /></button>)}</div>
        </section>
      </aside>
    </div>
  );
}
