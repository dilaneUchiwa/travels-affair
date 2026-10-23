import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EntityForm } from "@/components/admin/EntityForm";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { PageTitle } from "@/components/admin/ui";
import { getEntity } from "@/modules/catalog/entities";
import { getRow } from "@/modules/catalog/service";
import { AppError } from "@/shared/errors";

export const metadata: Metadata = { title: "Modifier" };
export const dynamic = "force-dynamic";

export default async function EditEntity({ params }: { params: { entity: string; id: string } }) {
  const entity = getEntity(params.entity);
  if (!entity) notFound();
  const row = await getRow(entity, decodeURIComponent(params.id)).catch((e) => {
    if (e instanceof AppError) notFound();
    throw e;
  });
  return (
    <>
      <PageTitle title={`Modifier : ${entity.singular}`}>
        {!entity.noDelete && <DeleteButton entity={entity.key} id={String(row[entity.idColumn ?? "id"])} />}
      </PageTitle>
      <EntityForm entity={entity} row={row} />
    </>
  );
}
