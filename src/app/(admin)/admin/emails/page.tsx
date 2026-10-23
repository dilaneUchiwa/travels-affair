import type { Metadata } from "next";
import { Badge, Card, PageTitle, TableWrap, Td, Th } from "@/components/admin/ui";
import { isSmtpConfigured } from "@/modules/notifications/mailer";
import { listEmailLogs } from "@/modules/notifications/service";
import { formatDateTime } from "@/shared/dates";

export const metadata: Metadata = { title: "E-mails envoyés" };
export const dynamic = "force-dynamic";

export default async function AdminEmails() {
  const logs = await listEmailLogs();
  return (
    <>
      <PageTitle title="E-mails envoyés" />
      {!isSmtpConfigured() && (
        <p className="mb-5 rounded-xl border border-blue-light-500 bg-blue-light-50 p-4 text-sm text-blue-light-500 dark:border-blue-light-500/30 dark:bg-blue-light-500/15">
          SMTP non configuré : les e-mails sont enregistrés ici mais pas réellement envoyés (renseigner SMTP_HOST dans .env).
        </p>
      )}
      <Card>
        <TableWrap>
          <thead><tr><Th>Date</Th><Th>Destinataire</Th><Th>Objet</Th><Th>Envoi</Th></tr></thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {logs.length === 0 && <tr><Td>Aucun e-mail.</Td></tr>}
            {logs.map((l) => (
              <tr key={l.id}>
                <Td>{formatDateTime(l.createdAt)}</Td>
                <Td>{l.to}</Td>
                <Td>
                  <details>
                    <summary className="cursor-pointer font-medium text-gray-800 dark:text-white/90">{l.subject}</summary>
                    <pre className="mt-2 whitespace-pre-wrap text-theme-xs">{l.body}</pre>
                  </details>
                </Td>
                <Td>{l.delivered ? <Badge color="success">Envoyé</Badge> : l.error ? <Badge color="error">Échec</Badge> : <Badge>Simulé</Badge>}</Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Card>
    </>
  );
}
