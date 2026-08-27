import { ChevronDown, MapPin, Network, UserRound } from "lucide-react";
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
        <div className="source-pill" title={dataSource === "supabase" ? "Connected to the configured polity database" : "Demo governance data is active until the multi-polity schema is installed"}>
          <span className={dataSource === "supabase" ? "status-dot live" : "status-dot demo"}/>
          {dataSource === "supabase" ? "Live polity" : "Prototype mode"}
        </div>
        <div className="citizen-pill"><UserRound size={17}/><div><strong>{citizen?.display_name ?? "Demo Citizen"}</strong><span>{citizen?.neighborhood ?? polity.districtShortName}</span></div></div>
        <div className="engine-pill"><Network size={17}/><span>{polity.slug}</span></div>
        <label className="neighborhood-select">
          <MapPin size={17}/><select value={selectedNeighborhood} onChange={(e)=>onSelectNeighborhood(e.target.value)}><option value="All">All neighborhoods</option>{neighborhoods.map((n)=><option key={n.id} value={n.name}>{n.name}</option>)}</select><ChevronDown size={16}/>
        </label>
      </div>
    </header>
  );
}
