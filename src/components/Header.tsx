import { ChevronDown, MapPin, UserRound } from "lucide-react";
import { polity } from "../config/polity";
import type { Citizen, Neighborhood } from "../types";

interface Props {
  neighborhoods: Neighborhood[];
  selectedNeighborhood: string;
  onSelectNeighborhood: (value: string) => void;
  dataSource: "supabase" | "demo";
  citizen?: Citizen;
}

export default function Header({ neighborhoods, selectedNeighborhood, onSelectNeighborhood, dataSource, citizen }: Props) {
  return (
    <header className="topbar">
      <div className="district-title">
        <MapPin size={22}/>
        <div><strong>{polity.districtName}</strong><span>{polity.communityTagline}</span></div>
      </div>

      <div className="topbar-actions">
        <div className="source-pill" title={dataSource === "supabase" ? "Connected to live D3 Connect data" : "Using sample data while D3 Connect is in prototype mode"}>
          <span className={dataSource === "supabase" ? "status-dot live" : "status-dot demo"}/>
          {dataSource === "supabase" ? "Live data" : "Demo data"}
        </div>
        <div className="citizen-pill"><UserRound size={17}/><div><strong>{citizen?.display_name ?? "Demo Citizen"}</strong><span>{citizen?.neighborhood ?? polity.districtShortName}</span></div></div>
        <label className="neighborhood-select">
          <span className="neighborhood-select-icon"><MapPin size={16}/></span>
          <span className="neighborhood-select-copy">
            <small>Neighborhood</small>
            <select
              aria-label="Choose neighborhood"
              value={selectedNeighborhood}
              onChange={(e)=>onSelectNeighborhood(e.target.value)}
            >
              <option value="All">All neighborhoods</option>
              {neighborhoods.map((n)=><option key={n.id} value={n.name}>{n.name}</option>)}
            </select>
          </span>
          <ChevronDown className="neighborhood-select-chevron" size={16}/>
        </label>
      </div>
    </header>
  );
}
