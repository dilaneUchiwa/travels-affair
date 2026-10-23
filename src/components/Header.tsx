import { loadConfig } from "@/modules/settings/service";
import { getCurrency } from "@/shared/price";
import { MONEY } from "@/shared/money";
import { logoutAction } from "@/modules/auth/actions";
import { getCurrentUser } from "@/modules/auth/session";
import { SiteHeader } from "./SiteHeader";

export async function Header() {
  const user = await getCurrentUser();
  await loadConfig();
  return <SiteHeader user={user ? { name: user.name, role: user.role } : null} logout={logoutAction} currency={getCurrency()} currencies={MONEY.enabled} />;
}
