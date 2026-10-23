"use client";

import { useId, useState, type ReactNode } from "react";

export type SearchPanel = { key: string; label: string; icon: string; node: ReactNode };

/** Carte de recherche à onglets (vols, hôtels, transports, voitures, activités). Chaque panneau est un formulaire GET. */
export function SearchTabs({ panels, label }: { panels: SearchPanel[]; label: string }) {
  const [active, setActive] = useState(panels[0]?.key);
  const uid = useId();
  return (
    <div className="search-tabs">
      <div className="st-tabs" role="tablist" aria-label={label}>
        {panels.map((p) => (
          <button
            key={p.key}
            type="button"
            role="tab"
            id={`${uid}-t-${p.key}`}
            aria-selected={active === p.key}
            aria-controls={`${uid}-p-${p.key}`}
            className={active === p.key ? "on" : ""}
            onClick={() => setActive(p.key)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={p.icon} /></svg>
            <span>{p.label}</span>
          </button>
        ))}
      </div>
      {panels.map((p) => (
        <div key={p.key} role="tabpanel" id={`${uid}-p-${p.key}`} aria-labelledby={`${uid}-t-${p.key}`} hidden={active !== p.key} className="st-panel">
          {p.node}
        </div>
      ))}
    </div>
  );
}
