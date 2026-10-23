import type { Metadata } from "next";
import { count, desc } from "drizzle-orm";
import { Badge, Card, Metric, PageTitle, Strong, TableWrap, Td, Th, btnPrimary, inputCls } from "@/components/admin/ui";
import { bookings, db, users } from "@/db";
import { requireAdmin } from "@/modules/auth/session";
import { adminSetUserRoleAction } from "@/modules/users/actions";
import { formatDateTime } from "@/shared/dates";

export const metadata: Metadata = { title: "Utilisateurs" };
export const dynamic = "force-dynamic";

export default async function AdminUsers() {
  const admin = await requireAdmin();
  const list = await db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role, lang: users.lang, createdAt: users.createdAt })
    .from(users)
    .orderBy(desc(users.createdAt));
  const counts = await db.select({ userId: bookings.userId, n: count() }).from(bookings).groupBy(bookings.userId);
  const cmap = Object.fromEntries(counts.map((c) => [c.userId, c.n]));
  const admins = list.filter((u) => u.role === "ADMIN").length;

  return (
    <>
      <PageTitle title="Utilisateurs" />
      <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Metric label="Comptes" value={list.length} />
        <Metric label="Administrateurs" value={admins} />
        <Metric label="Clients" value={list.length - admins} />
      </div>
      <Card>
        <TableWrap>
          <thead><tr><Th>Nom</Th><Th>E-mail</Th><Th>Rôle</Th><Th>Langue</Th><Th>Réservations</Th><Th>Inscrit le</Th></tr></thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {list.length === 0 && <tr><Td>Aucun utilisateur.</Td></tr>}
            {list.map((u) => (
              <tr key={u.id}>
                <Td><Strong>{u.name}</Strong></Td>
                <Td>{u.email}</Td>
                <Td>
                  {u.id === admin.id ? (
                    <Badge color="info">Administrateur (vous)</Badge>
                  ) : (
                    <form action={adminSetUserRoleAction} className="flex items-center gap-2">
                      <input type="hidden" name="userId" value={u.id} />
                      <select name="role" defaultValue={u.role} aria-label="Rôle" className={`${inputCls} min-w-36`}>
                        <option value="CLIENT">Client</option>
                        <option value="ADMIN">Administrateur</option>
                      </select>
                      <button type="submit" className={btnPrimary}>OK</button>
                    </form>
                  )}
                </Td>
                <Td>{u.lang?.toUpperCase()}</Td>
                <Td>{cmap[u.id] ?? 0}</Td>
                <Td>{formatDateTime(u.createdAt)}</Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Card>
    </>
  );
}
