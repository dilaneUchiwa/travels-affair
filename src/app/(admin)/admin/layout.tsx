import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/modules/auth/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <AdminShell user={{ name: admin.name, email: admin.email }}>
      {children}
    </AdminShell>
  );
}
