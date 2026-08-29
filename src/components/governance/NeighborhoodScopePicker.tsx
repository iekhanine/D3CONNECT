import { Check, ChevronDown, MapPin, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Neighborhood } from "../../types";

interface Props {
  neighborhoods: Neighborhood[];
  value: string;
  onChange: (value: string) => void;
}

export default function NeighborhoodScopePicker({
  neighborhoods,
  value,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const filteredNeighborhoods = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return neighborhoods;

    return neighborhoods.filter((neighborhood) =>
      neighborhood.name.toLowerCase().includes(normalized),
    );
  }, [neighborhoods, query]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (open) {
      window.requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open]);

  function choose(nextValue: string) {
    onChange(nextValue);
    setOpen(false);
    setQuery("");
  }

  return (
    <div className={`issue-neighborhood-picker${open ? " open" : ""}`} ref={rootRef}>
      <span className="issue-field-label">Neighborhood</span>

      <button
        type="button"
        className="issue-neighborhood-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="issue-neighborhood-trigger-icon">
          <MapPin size={17} />
        </span>
        <span>{value || "District-Wide"}</span>
        <ChevronDown size={17} className="issue-neighborhood-chevron" />
      </button>

      {open && (
        <div className="issue-neighborhood-menu" role="listbox" aria-label="Choose neighborhood">
          <div className="issue-neighborhood-search">
            <Search size={16} />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search neighborhoods"
              aria-label="Search neighborhoods"
            />
          </div>

          <button
            type="button"
            role="option"
            aria-selected={value === "District-Wide"}
            className={`issue-neighborhood-option district-wide${
              value === "District-Wide" ? " selected" : ""
            }`}
            onClick={() => choose("District-Wide")}
          >
            <span>
              <strong>District-Wide</strong>
              <small>Applies across District 3</small>
            </span>
            {value === "District-Wide" && <Check size={17} />}
          </button>

          <div className="issue-neighborhood-divider" />

          {filteredNeighborhoods.length ? (
            filteredNeighborhoods.map((neighborhood) => (
              <button
                type="button"
                role="option"
                aria-selected={value === neighborhood.name}
                key={neighborhood.id}
                className={`issue-neighborhood-option${
                  value === neighborhood.name ? " selected" : ""
                }`}
                onClick={() => choose(neighborhood.name)}
              >
                <span>{neighborhood.name}</span>
                {value === neighborhood.name && <Check size={17} />}
              </button>
            ))
          ) : (
            <div className="issue-neighborhood-empty">No neighborhoods match “{query}”.</div>
          )}
        </div>
      )}
    </div>
  );
}
