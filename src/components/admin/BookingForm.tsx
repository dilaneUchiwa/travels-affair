"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { adminCreateBookingAction } from "@/modules/bookings/actions";
import { btnPrimary, inputCls, labelCls } from "@/components/admin/ui";

type Offer = { id: string; label: string };
type Props = { users: { id: string; name: string; email: string }[]; offers: Record<string, Offer[]> };

const SERVICE_LABELS: [string, string][] = [
  ["FLIGHT", "Vol"], ["HOTEL", "Hébergement"], ["TRANSPORT", "Transport"], ["CAR", "Location de véhicule"], ["ACTIVITY", "Activité"],
];

export function AdminBookingForm({ users, offers }: Props) {
  const [state, action] = useFormState(adminCreateBookingAction, undefined);
  const [serviceType, setServiceType] = useState("FLIGHT");
  const list = offers[serviceType] ?? [];

  return (
    <form action={action} className="max-w-2xl space-y-5">
      {state?.error && <p className="rounded-xl border border-error-500 bg-error-50 p-3 text-sm text-error-600 dark:bg-error-500/15">{state.error}</p>}

      <div>
        <label htmlFor="userId" className={labelCls}>Client</label>
        <select id="userId" name="userId" required className={inputCls} defaultValue="">
          <option value="" disabled>Choisir un client…</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.name} · {u.email}</option>)}
        </select>
      </div>

      <div>
        <label htmlFor="serviceType" className={labelCls}>Service</label>
        <select id="serviceType" name="serviceType" className={inputCls} value={serviceType} onChange={(e) => setServiceType(e.target.value)}>
          {SERVICE_LABELS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      <div>
        <label htmlFor="itemId" className={labelCls}>Offre</label>
        <select id="itemId" name="itemId" required className={inputCls} defaultValue="" key={serviceType}>
          <option value="" disabled>{list.length ? "Choisir une offre…" : "Aucune offre publiée pour ce service"}</option>
          {list.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
      </div>

      {(serviceType === "HOTEL" || serviceType === "CAR") && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="d1" className={labelCls}>{serviceType === "HOTEL" ? "Arrivée" : "Départ"}</label>
            <input id="d1" type="date" name={serviceType === "HOTEL" ? "checkIn" : "pickupDate"} required className={inputCls} />
          </div>
          <div>
            <label htmlFor="d2" className={labelCls}>{serviceType === "HOTEL" ? "Départ" : "Retour"}</label>
            <input id="d2" type="date" name={serviceType === "HOTEL" ? "checkOut" : "returnDate"} required className={inputCls} />
          </div>
          <div>
            <label htmlFor="units" className={labelCls}>{serviceType === "HOTEL" ? "Chambres" : "Véhicules"}</label>
            <input id="units" type="number" name="units" min={1} max={10} defaultValue={1} className={inputCls} />
          </div>
        </div>
      )}

      <div>
        <label htmlFor="participants" className={labelCls}>
          {serviceType === "CAR" ? "Conducteur" : serviceType === "ACTIVITY" ? "Participants" : "Voyageurs"} (un nom par ligne)
        </label>
        <textarea id="participants" name="participants" rows={4} required className={inputCls} placeholder="Jean Dupont&#10;Marie Dupont" />
      </div>

      <button type="submit" className={btnPrimary}>Créer la réservation</button>
      <p className="text-theme-xs text-gray-500">La réservation est créée en « En attente de paiement » ; un e-mail est envoyé au client. Encaisse-la ensuite depuis son détail.</p>
    </form>
  );
}
