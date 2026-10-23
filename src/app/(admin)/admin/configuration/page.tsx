import type { Metadata } from "next";
import { AdminActionForm, AdminSubmit } from "@/components/admin/forms";
import { Badge, Card, PageTitle, inputCls, labelCls, textareaCls } from "@/components/admin/ui";
import { GROUPS, SETTINGS, type SettingDef } from "@/modules/settings/definitions";
import { saveConfigAction } from "@/modules/settings/actions";
import { config, loadConfig } from "@/modules/settings/service";
import { env } from "@/shared/env";

export const metadata: Metadata = { title: "Configuration" };
export const dynamic = "force-dynamic";

function Control({ def, value }: { def: SettingDef; value: string }) {
  const id = `s-${def.key}`;
  switch (def.type) {
    case "textarea":
      return <textarea id={id} name={def.key} rows={3} className={textareaCls} defaultValue={value} />;
    case "select":
      return <select id={id} name={def.key} className={inputCls} defaultValue={value}>{def.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>;
    case "multi": {
      const on = new Set(value.split(",").filter(Boolean));
      return (
        <div className="flex flex-wrap gap-x-6 gap-y-2 pt-1">
          {def.options?.map((o) => (
            <label key={o.value} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input type="checkbox" name={def.key} value={o.value} defaultChecked={on.has(o.value)} className="size-4 rounded border-gray-300" /> {o.label}
            </label>
          ))}
        </div>
      );
    }
    default:
      return <input id={id} name={def.key} type={def.type === "number" ? "number" : def.type === "email" ? "email" : "text"} step={def.type === "number" ? "any" : undefined} min={def.type === "number" ? def.min : undefined} className={inputCls} defaultValue={value} />;
  }
}

const GATEWAYS = [
  { name: "CinetPay", ok: !!(env.CINETPAY_APIKEY && env.CINETPAY_SITE_ID), vars: "CINETPAY_APIKEY, CINETPAY_SITE_ID", what: "Orange Money, MTN Money, Express Union, Visa/Mastercard" },
  { name: "Campay", ok: !!(env.CAMPAY_USERNAME && env.CAMPAY_PASSWORD), vars: "CAMPAY_USERNAME, CAMPAY_PASSWORD", what: "Orange Money, MTN MoMo" },
  { name: "Stripe", ok: !!env.STRIPE_SECRET_KEY, vars: "STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET", what: "Visa / Mastercard" },
  { name: "PayPal", ok: !!(env.PAYPAL_CLIENT_ID && env.PAYPAL_CLIENT_SECRET), vars: "PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET", what: "PayPal" },
  { name: "E-mail (SMTP)", ok: !!env.SMTP_HOST, vars: "SMTP_HOST, SMTP_USER, SMTP_PASS", what: "Envoi des confirmations et rappels" },
];

export default async function ConfigPage({ searchParams }: { searchParams: { ok?: string } }) {
  await loadConfig(true);
  const c = config();
  return (
    <>
      <PageTitle title="Configuration" />
      {searchParams.ok && <p role="status" className="mb-5 rounded-lg border border-success-500 bg-success-50 p-4 text-sm text-success-700">Configuration enregistrée : elle est appliquée immédiatement au site.</p>}
      <AdminActionForm action={saveConfigAction} className="space-y-6">
        {GROUPS.map((g) => (
          <Card key={g.id} title={g.title}>
            <p className="-mt-2 mb-5 text-sm text-gray-500">{g.description}</p>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {SETTINGS.filter((s) => s.group === g.id).map((def) => (
                <div key={def.key} className={def.type === "multi" || def.type === "textarea" ? "md:col-span-2" : ""}>
                  <label htmlFor={`s-${def.key}`} className={labelCls}>{def.label}</label>
                  <Control def={def} value={c[def.key] ?? def.default} />
                  {def.help && <p className="mt-1 text-theme-xs text-gray-500">{def.help}</p>}
                </div>
              ))}
            </div>
            {g.id === "payment" && (
              <div className="mt-6 overflow-x-auto">
                <p className={labelCls}>État des passerelles et services (clés dans le fichier .env du serveur)</p>
                <table className="w-full text-left text-sm">
                  <tbody>
                    {GATEWAYS.map((gw) => (
                      <tr key={gw.name} className="border-t border-gray-100 dark:border-gray-800">
                        <td className="py-2.5 pr-4 font-medium text-gray-800 dark:text-white/90">{gw.name}</td>
                        <td className="py-2.5 pr-4 text-gray-500">{gw.what}</td>
                        <td className="py-2.5 pr-4"><Badge color={gw.ok ? "success" : "warning"}>{gw.ok ? "Configuré" : "Mode démonstration"}</Badge></td>
                        <td className="hidden py-2.5 text-theme-xs text-gray-400 md:table-cell">{gw.vars}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        ))}
        <AdminSubmit>Enregistrer la configuration</AdminSubmit>
      </AdminActionForm>
    </>
  );
}
