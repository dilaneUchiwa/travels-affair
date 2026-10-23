"use client";
import { useId, useMemo, useRef, useState } from "react";

export type PlaceOption = { value: string; hint?: string };

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Champ texte avec liste de suggestions (accents ignorés, clavier ↑ ↓ Entrée Échap). La saisie libre reste possible. */
export function PlaceInput({ id, name, defaultValue, placeholder, options, required, className, admin }: { id: string; name: string; defaultValue?: string; placeholder?: string; options: PlaceOption[]; required?: boolean; className?: string; admin?: boolean }) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = useId();
  const box = useRef<HTMLDivElement>(null);

  const shown = useMemo(() => {
    const q = norm(value.trim());
    const list = q ? options.filter((o) => norm(o.value).includes(q) || (o.hint && norm(o.hint).includes(q))) : options;
    // Les lieux qui commencent par la saisie passent en premier.
    return [...list].sort((a, b) => Number(norm(b.value).startsWith(q)) - Number(norm(a.value).startsWith(q))).slice(0, 8);
  }, [value, options]);

  const pick = (o: PlaceOption) => { setValue(o.value); setOpen(false); setActive(-1); };

  return (
    <div className="place-input relative" ref={box} onBlur={(e) => { if (!box.current?.contains(e.relatedTarget as Node)) setOpen(false); }}>
      <input
        id={id} name={name} value={value} placeholder={placeholder} required={required} className={className} autoComplete="off" role="combobox"
        aria-expanded={open && shown.length > 0} aria-controls={listId} aria-autocomplete="list"
        onChange={(e) => { setValue(e.target.value); setOpen(true); setActive(-1); }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, shown.length - 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
          else if (e.key === "Enter" && open && active >= 0 && shown[active]) { e.preventDefault(); pick(shown[active]); }
          else if (e.key === "Escape") setOpen(false);
        }}
      />
      {open && shown.length > 0 && (
        <ul className={admin ? "absolute left-0 right-0 top-full z-50 mt-1 max-h-72 list-none overflow-auto rounded-xl border border-gray-200 bg-white p-1.5 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900" : "place-list"} id={listId} role="listbox">
          {shown.map((o, i) => (
            <li key={o.value} role="option" aria-selected={i === active} className={i === active ? "on" : ""}>
              <button type="button" tabIndex={-1} className={admin ? "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-800 hover:bg-gray-100 dark:text-white/90 dark:hover:bg-white/5" + (i === active ? " bg-gray-100 dark:bg-white/5" : "") : undefined} onMouseDown={(e) => e.preventDefault()} onClick={() => pick(o)}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true"><path d="M12 21s7-5.7 7-11a7 7 0 10-14 0c0 5.3 7 11 7 11z" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.8" /></svg>
                <span className={admin ? "flex-1 truncate font-medium" : undefined}>{o.value}</span>{o.hint && <small className={admin ? "text-xs uppercase text-gray-400" : undefined}>{o.hint}</small>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
