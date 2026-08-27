import { X } from "lucide-react";
import { useMemo, useState } from "react";
import { issueCategories } from "../data/demo";
import { submitIssue } from "../lib/dataService";
import type { Neighborhood } from "../types";

interface Props {
  open: boolean;
  initialCategory?: string;
  neighborhoods: Neighborhood[];
  selectedNeighborhood: string;
  onClose: () => void;
}

export default function IssueModal({ open, initialCategory, neighborhoods, selectedNeighborhood, onClose }: Props) {
  const defaultCategory = useMemo(() => initialCategory ?? issueCategories[0].id, [initialCategory]);
  const [category, setCategory] = useState(defaultCategory);
  const [neighborhood, setNeighborhood] = useState(selectedNeighborhood === "All" ? "" : selectedNeighborhood);
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  if (!open) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus("sending");
    await submitIssue({ category, neighborhood, location, description, email: email || undefined });
    setStatus("sent");
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="issue-title" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div><span className="eyebrow">DISTRICT 3 ISSUE NAVIGATOR</span><h2 id="issue-title">Report or route an issue</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="Close"><X size={20} /></button>
        </div>

        {status === "sent" ? (
          <div className="success-state">
            <div className="success-check">✓</div>
            <h3>Got it.</h3>
            <p>Your issue has been captured. In production, this screen can also route residents directly to the correct City bureau or service workflow.</p>
            <button className="primary-button" onClick={onClose}>Done</button>
          </div>
        ) : (
          <form className="form-grid" onSubmit={handleSubmit}>
            <label>Issue type<select value={category} onChange={(e) => setCategory(e.target.value)}>{issueCategories.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
            <label>Neighborhood<select value={neighborhood} required onChange={(e) => setNeighborhood(e.target.value)}><option value="">Choose neighborhood</option>{neighborhoods.map((n) => <option key={n.id}>{n.name}</option>)}</select></label>
            <label className="full">Location / nearest intersection<input value={location} required onChange={(e) => setLocation(e.target.value)} placeholder="e.g. SE Division St & SE 50th Ave" /></label>
            <label className="full">What happened?<textarea rows={5} value={description} required onChange={(e) => setDescription(e.target.value)} placeholder="Describe the issue and anything that would help route it correctly." /></label>
            <label className="full">Email (optional)<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></label>
            <div className="form-actions full"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={status === "sending"}>{status === "sending" ? "Submitting…" : "Submit Issue"}</button></div>
          </form>
        )}
      </section>
    </div>
  );
}
