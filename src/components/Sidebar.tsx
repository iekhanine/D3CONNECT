import {
  CircleHelp,
  GitFork,
  Home,
  Info,
  MessageCircle,
  Network,
  Scale,
  UserRoundCog,
  ShieldCheck,
} from "lucide-react";
import { polity } from "../config/polity";
import type { ViewKey } from "../types";

interface Props {
  activeView: ViewKey;
  onNavigate: (view: ViewKey) => void;
}

const governanceItems: Array<{ key: ViewKey; label: string; icon: typeof Home }> = [
  { key: "home", label: "Home", icon: Home },
  { key: "about", label: "How It Works", icon: Info },
  { key: "civic-issues", label: "Problems & Ideas", icon: MessageCircle },
  { key: "proposals", label: "Suggested Solutions", icon: GitFork },
  { key: "bills", label: "Decisions & Voting", icon: Scale },
  { key: "proxy", label: "People I Trust", icon: UserRoundCog },
  { key: "delegation", label: "Where My Voice Goes", icon: Network },
];

export default function Sidebar({ activeView, onNavigate }: Props) {
  return (
    <aside className="sidebar">
      <button className="brand" onClick={() => onNavigate("home")} aria-label={`${polity.productName} home`}>
        <span className="brand-mark">{polity.shortName}</span>
        <span><strong>CONNECT</strong><small>{polity.jurisdictionName.toUpperCase()}</small></span>
      </button>

      <div className="nav-section-label">YOUR VOICE</div>
      <nav className="side-nav" aria-label="D3 Connect navigation">
        {governanceItems.map(({ key, label, icon: Icon }) => (
          <button key={key} className={activeView === key ? "nav-item active" : "nav-item"} onClick={() => onNavigate(key)}>
            <Icon size={18} strokeWidth={1.9}/><span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="nav-section-label admin-nav-label-side">ADMINISTRATION</div>
      <nav className="side-nav" aria-label="Administration navigation">
        <button className={activeView === "admin" ? "nav-item active" : "nav-item"} onClick={() => onNavigate("admin")}>
          <ShieldCheck size={18} strokeWidth={1.9}/><span>Admin</span>
        </button>
      </nav>

      <div className="side-card">
        <CircleHelp size={22}/><strong>Not sure where to start?</strong>
        <p>Start with Problems & Ideas. Tell us what is happening in plain language. You do not need to know which City office, rule, or process applies.</p>
      </div>

      <div className="sidebar-footer">
        <button className="language-button"><CircleHelp size={16}/> English</button>
        <small>© 2026 {polity.productName}</small><small>Built by OneTime Labs</small>
      </div>
    </aside>
  );
}
