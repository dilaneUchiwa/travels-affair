"use client";

import { useT } from "@/i18n/client";

export function PrintButton() {
  const { t } = useT();
  return (
    <button className="btn secondary small no-print" type="button" onClick={() => window.print()}>
      {t("booking.print")}
    </button>
  );
}
