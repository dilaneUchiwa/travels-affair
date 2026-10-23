import { toInputValue } from "@/shared/dates";
import { CURRENCIES } from "@/shared/money";
import type { Entity, Field, Opt } from "@/modules/catalog/types";
import { parsePhotos } from "@/modules/uploads/service";
import { saveEntityAction } from "@/modules/catalog/actions";
import { PlaceInput, type PlaceOption } from "@/components/PlaceInput";
import { adminSuggestions } from "@/modules/catalog/places";
import { AdminActionForm, AdminSubmit } from "./forms";
import { Card, inputCls, labelCls, textareaCls } from "./ui";

type Row = Record<string, unknown> | null;

function Control({ f, row, options, suggestions }: { f: Field; row: Row; options: Opt[]; suggestions?: PlaceOption[] }) {
  const v = row?.[f.name];
  const id = `f-${f.name}`;
  const common = { id, name: f.name, required: f.required, className: inputCls };
  switch (f.kind) {
    case "text":
      if (suggestions) return <PlaceInput admin id={id} name={f.name} required={f.required} className={inputCls} defaultValue={String(v ?? "")} options={suggestions} />;
      return <input {...common} defaultValue={String(v ?? "")} />;
    case "textarea":
      return <textarea id={id} name={f.name} required={f.required} rows={3} className={textareaCls} defaultValue={String(v ?? "")} />;
    case "datetime":
      return <input {...common} type="datetime-local" defaultValue={v instanceof Date ? toInputValue(v) : ""} />;
    case "number":
      return <input {...common} type="number" min={f.min ?? 0} max={f.max} defaultValue={String(v ?? f.defaultValue ?? "")} />;
    case "select": {
      const current = typeof v === "boolean" ? (v ? "1" : "0") : String(v ?? f.defaultValue ?? f.options[0]?.value);
      return <select {...common} defaultValue={current}>{f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>;
    }
    case "relation":
      return (
        <select {...common} defaultValue={String(v ?? "")}>
          <option value="" disabled>— Choisir —</option>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      );
    case "currency":
      return <select {...common} defaultValue={String(v ?? "XAF")}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select>;
    case "photos": {
      const photos = parsePhotos(String(v ?? "[]"));
      return (
        <div>
          {photos.length > 0 && (
            <ul className="mb-3 flex flex-wrap gap-3">
              {photos.map((u) => (
                <li key={u} className="w-28 text-center text-theme-xs text-gray-500">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={u} alt="" className="mb-1 h-20 w-28 rounded-lg object-cover" />
                  <label className="flex items-center justify-center gap-1"><input type="checkbox" name="photos__remove" value={u} /> Retirer</label>
                </li>
              ))}
            </ul>
          )}
          <input type="file" name="photos__new" multiple accept="image/jpeg,image/png,image/webp" className={inputCls + " pt-2.5"} />
          <p className="mt-1 text-theme-xs text-gray-500">JPEG, PNG ou WebP, 5 Mo maximum par image, 8 photos au total.</p>
        </div>
      );
    }
  }
}

export async function EntityForm({ entity, row }: { entity: Entity; row: Row }) {
  const optionSets = await Promise.all(entity.fields.map((f) => (f.kind === "relation" ? f.load() : Promise.resolve([] as Opt[]))));
  const sugKinds = [...new Set(entity.fields.map((f) => f.suggest).filter(Boolean))] as NonNullable<Field["suggest"]>[];
  const sugSets = Object.fromEntries(await Promise.all(sugKinds.map(async (k) => [k, await adminSuggestions(k)] as const)));
  const id = row ? String(row[entity.idColumn ?? "id"]) : "";
  return (
    <Card>
      <AdminActionForm action={saveEntityAction}>
        <input type="hidden" name="__entity" value={entity.key} />
        <input type="hidden" name="__id" value={id} />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {entity.fields.map((f, i) => (
            <div key={f.name} className={f.wide || f.kind === "textarea" || f.kind === "photos" ? "md:col-span-2" : ""}>
              <label htmlFor={`f-${f.name}`} className={labelCls}>{f.label}{f.required ? " *" : ""}</label>
              <Control f={f} row={row} options={optionSets[i]} suggestions={f.suggest ? sugSets[f.suggest] : undefined} />
              {f.help && f.kind !== "photos" && <p className="mt-1 text-theme-xs text-gray-500">{f.help}</p>}
            </div>
          ))}
        </div>
        <div className="mt-6"><AdminSubmit>{row ? "Enregistrer les modifications" : `Créer : ${entity.singular}`}</AdminSubmit></div>
      </AdminActionForm>
    </Card>
  );
}
