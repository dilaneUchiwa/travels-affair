import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EntityForm } from "@/components/admin/EntityForm";
import { PageTitle } from "@/components/admin/ui";
import { getEntity } from "@/modules/catalog/entities";

export const metadata: Metadata = { title: "Nouveau" };
export const dynamic = "force-dynamic";

export default function NewEntity({ params }: { params: { entity: string } }) {
  const entity = getEntity(params.entity);
  if (!entity || entity.noCreate) notFound();
  return (
    <>
      <PageTitle title={`Nouveau : ${entity.singular}`} />
      <EntityForm entity={entity} row={null} />
    </>
  );
}
