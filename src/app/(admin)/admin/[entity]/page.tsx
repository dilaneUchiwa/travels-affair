import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card, PageTitle, TableWrap, Td, Th, btnOutline, btnPrimary } from "@/components/admin/ui";
import { toggleEntityAction } from "@/modules/catalog/actions";
import { getEntity } from "@/modules/catalog/entities";
import { listRows } from "@/modules/catalog/service";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: { entity: string } }): Promise<Metadata> {
  return { title: getEntity(params.entity)?.title ?? "Administration" };
}

export default async function EntityList({ params }: { params: { entity: string } }) {
  const entity = getEntity(params.entity);
  if (!entity) notFound();
  const rows = await listRows(entity);
  return (
    <>
      <PageTitle title={entity.title}>
        {!entity.noCreate && <Link href={`/admin/${entity.key}/nouveau`} className={btnPrimary}>Ajouter : {entity.singular}</Link>}
      </PageTitle>
      <Card>
        <TableWrap>
          <thead>
            <tr>
              {entity.columns.map((c) => <Th key={c}>{c}</Th>)}
              {entity.publishable && <Th>Statut</Th>}
              <Th />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {rows.length === 0 && <tr><Td>Aucun élément pour le moment.</Td></tr>}
            {rows.map((r) => (
              <tr key={r.id}>
                {r.cells.map((c, i) => <Td key={i}>{c}</Td>)}
                {entity.publishable && <Td><Badge color={r.published ? "success" : "light"}>{r.published ? "Publié" : "Non publié"}</Badge></Td>}
                <Td>
                  <div className="flex gap-2">
                    <Link href={`/admin/${entity.key}/${r.id}`} className={btnOutline}>Modifier</Link>
                    {entity.publishable && (
                      <form action={toggleEntityAction}>
                        <input type="hidden" name="__entity" value={entity.key} />
                        <input type="hidden" name="__id" value={r.id} />
                        <button type="submit" className={btnOutline}>{r.published ? "Dépublier" : "Publier"}</button>
                      </form>
                    )}
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Card>
    </>
  );
}
