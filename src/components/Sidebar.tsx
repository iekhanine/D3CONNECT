import {
  Building2,
  CalendarDays,
  CircleHelp,
  GitFork,
  HeartHandshake,
  Home,
  Info,
  Landmark,
  MessageCircle,
  Network,
  Scale,
  Store,
  UserRoundCog,
} from "lucide-react";
import { polity } from "../config/polity";
import type { ViewKey } from "../types";

interface Props {
  activeView: ViewKey;
  onNavigate: (view: ViewKey) => void;
}

const governanceItems: Array<{ key: ViewKey; label: string; icon: typeof Home }> = [
  { key: "home", label: "Civic Home", icon: Home },
  { key: "civic-issues", label: "Issues", icon: MessageCircle },
  { key: "proposals", label: "Proposals", icon: GitFork },
  { key: "bills", label: "Bills & Policy", icon: Scale },
  { key: "proxy", label: "My Proxy", icon: UserRoundCog },
  { key: "delegation", label: "Delegation Network", icon: Network },
];

const communityItems: Array<{ key: ViewKey; label: string; icon: typeof Home }> = [
  { key: "projects", label: "Project Tracker", icon: Landmark },
  { key: "resources", label: "Resources", icon: HeartHandshake },
  { key: "calendar", label: "Community Calendar", icon: CalendarDays },
  { key: "businesses", label: "Business Directory", icon: Store },
  { key: "about", label: "About", icon: Info },
];

export default function Sidebar({ activeView, onNavigate }: Props) {
  return (
    <aside className="sidebar">
      <button className="brand" onClick={() => onNavigate("home")} aria-label={`${polity.productName} home`}>
        <span className="brand-mark">{polity.shortName}</span>
        <span><strong>CONNECT</strong><small>{polity.jurisdictionName.toUpperCase()}</small></span>
      </button>

      <div className="nav-section-label">GOVERNANCE</div>
      <nav className="side-nav" aria-label="Governance navigation">
        {governanceItems.map(({ key, label, icon: Icon }) => (
          <button key={key} className={activeView === key ? "nav-item active" : "nav-item"} onClick={() => onNavigate(key)}>
            <Icon size={18} strokeWidth={1.9}/><span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="nav-section-label secondary">COMMUNITY</div>
      <nav className="side-nav community-nav" aria-label="Community navigation">
        {communityItems.map(({ key, label, icon: Icon }) => (
          <button key={key} className={activeView === key ? "nav-item active" : "nav-item"} onClick={() => onNavigate(key)}>
            <Icon size={18} strokeWidth={1.9}/><span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="side-card">
        <Building2 size={22}/><strong>Reusable civic engine</strong>
        <p>This deployment is configured for {polity.districtShortName}. The same PosProx engine can be redeployed for another district through polity configuration and data.</p>
      </div>

      <div className="sidebar-footer">
        <button className="language-button"><CircleHelp size={16}/> English</button>
        <small>© 2026 {polity.productName}</small><small>Built by OneTime Labs</small>
      </div>
    </aside>
  );
}
