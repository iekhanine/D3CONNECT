import { Check, ChevronDown, MapPin, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { polity } from "../config/polity";
import type { Citizen, Neighborhood } from "../types";

interface Props {
  neighborhoods: Neighborhood[];
  selectedNeighborhood: string;
  onSelectNeighborhood: (value: string) => void;
  dataSource: "supabase" | "demo";
  citizen?: Citizen;
}

export default function Header({
  neighborhoods,
  selectedNeighborhood,
  onSelectNeighborhood,
  dataSource,
  citizen,
}: Props) {
  const [neighborhoodOpen, setNeighborhoodOpen] = useState(false);
  const neighborhoodRef = useRef<HTMLDivElement>(null);

  const selectedLabel =
    selectedNeighborhood === "All" ? "All neighborhoods" : selectedNeighborhood;

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (
        neighborhoodRef.current &&
        !neighborhoodRef.current.contains(event.target as Node)
      ) {
        setNeighborhoodOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setNeighborhoodOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function chooseNeighborhood(value: string) {
    onSelectNeighborhood(value);
    setNeighborhoodOpen(false);
  }

  return (
    <header className="topbar">
      <div className="district-title">
        <MapPin size={22} />
        <div>
          <strong>{polity.districtName}</strong>
          <span>{polity.communityTagline}</span>
        </div>
      </div>

      <div className="topbar-actions">
        <div
          className="source-pill"
          title={
            dataSource === "supabase"
              ? "Connected to live D3 Connect data"
              : "Supabase is not configured or unavailable; showing read-only demo fallback data"
          }
        >
          <span
            className={dataSource === "supabase" ? "status-dot live" : "status-dot demo"}
          />
          {dataSource === "supabase" ? "Live data" : "Prototype data"}
        </div>

        <div className="citizen-pill">
          <UserRound size={17} />
          <div>
            <strong>{citizen?.display_name ?? "Demo Citizen"}</strong>
            <span>{citizen?.neighborhood ?? polity.districtShortName}</span>
          </div>
        </div>

        <div
          className={`neighborhood-picker${neighborhoodOpen ? " open" : ""}`}
          ref={neighborhoodRef}
        >
          <button
            type="button"
            className="neighborhood-trigger"
            aria-haspopup="listbox"
            aria-expanded={neighborhoodOpen}
            aria-label={`Neighborhood filter: ${selectedLabel}`}
            onClick={() => setNeighborhoodOpen((current) => !current)}
          >
            <span className="neighborhood-trigger-icon">
              <MapPin size={17} />
            </span>

            <span className="neighborhood-trigger-copy">
              <small>Neighborhood</small>
              <strong>{selectedLabel}</strong>
            </span>

            <ChevronDown className="neighborhood-trigger-chevron" size={18} />
          </button>

          {neighborhoodOpen && (
            <div
              className="neighborhood-menu"
              role="listbox"
              aria-label="Choose neighborhood"
            >
              <div className="neighborhood-menu-heading">Filter by neighborhood</div>

              <button
                type="button"
                role="option"
                aria-selected={selectedNeighborhood === "All"}
                className={`neighborhood-option${
                  selectedNeighborhood === "All" ? " selected" : ""
                }`}
                onClick={() => chooseNeighborhood("All")}
              >
                <span>All neighborhoods</span>
                {selectedNeighborhood === "All" && <Check size={17} />}
              </button>

              <div className="neighborhood-menu-divider" />

              {neighborhoods.map((neighborhood) => {
                const selected = selectedNeighborhood === neighborhood.name;

                return (
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    key={neighborhood.id}
                    className={`neighborhood-option${selected ? " selected" : ""}`}
                    onClick={() => chooseNeighborhood(neighborhood.name)}
                  >
                    <span>{neighborhood.name}</span>
                    {selected && <Check size={17} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
