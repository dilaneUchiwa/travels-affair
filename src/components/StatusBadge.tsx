import { getT } from "@/i18n/server";
import { isBookingStatus } from "@/modules/bookings/status";

export function StatusBadge({ status }: { status: string }) {
  const { t } = getT();
  return <span className={`badge ${status}`}>{isBookingStatus(status) ? t(`status.${status}`) : status}</span>;
}
