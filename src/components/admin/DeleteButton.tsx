"use client";

import { useFormState } from "react-dom";
import { deleteEntityAction } from "@/modules/catalog/actions";
import { btnOutline } from "./ui";

export function DeleteButton({ entity, id }: { entity: string; id: string }) {
  const [state, action] = useFormState(deleteEntityAction, undefined);
  return (
    <form action={action} onSubmit={(e) => { if (!confirm("Supprimer définitivement cet élément ?")) e.preventDefault(); }} className="flex items-center gap-3">
      {state?.error && <span role="alert" className="text-theme-sm text-error-600">{state.error}</span>}
      <input type="hidden" name="__entity" value={entity} />
      <input type="hidden" name="__id" value={id} />
      <button type="submit" className={`${btnOutline} text-error-600`}>Supprimer</button>
    </form>
  );
}
