import type { BookingStatus } from "@/modules/bookings/status";
import { STATUS_LABELS, isBookingStatus } from "@/modules/bookings/status";

/** Classes issues de TailAdmin (boutons, champs, étiquettes) partagées par les pages d'administration. */
export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 py-3 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600 disabled:cursor-wait disabled:opacity-60";
export const btnOutline =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-gray-700 ring-1 ring-gray-300 ring-inset transition hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/3";
export const inputCls =
  "h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800";
export const textareaCls =
  "w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";
export const labelCls = "mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400";

export function Card({ title, action, children, className = "" }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 px-5 py-4 sm:px-6 sm:py-5">
          {title && <h3 className="text-base font-medium text-gray-800 dark:text-white/90">{title}</h3>}
          {action}
        </div>
      )}
      <div className={title || action ? "border-t border-gray-100 p-4 sm:p-6 dark:border-gray-800" : "p-5 md:p-6"}>{children}</div>
    </section>
  );
}

export function PageTitle({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">{title}</h1>
      {children}
    </div>
  );
}

export function Metric({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6 dark:border-gray-800 dark:bg-white/3">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <h4 className="mt-2 text-title-sm font-bold text-gray-800 dark:text-white/90">{value}</h4>
      {hint && <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">{hint}</p>}
    </div>
  );
}

type Color = "primary" | "success" | "error" | "warning" | "info" | "light";
const BADGE: Record<Color, string> = {
  primary: "bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400",
  success: "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500",
  error: "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500",
  warning: "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400",
  info: "bg-blue-light-50 text-blue-light-500 dark:bg-blue-light-500/15 dark:text-blue-light-500",
  light: "bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-white/80",
};
export function Badge({ color = "light", children }: { color?: Color; children: React.ReactNode }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-theme-xs font-medium ${BADGE[color]}`}>{children}</span>;
}

const STATUS_COLOR: Record<BookingStatus, Color> = {
  PENDING_PAYMENT: "warning",
  PAID: "info",
  AWAITING_CONFIRMATION: "info",
  CONFIRMED: "success",
  MODIFIED: "primary",
  CANCELLED: "error",
  REFUNDED: "error",
};
export function BookingBadge({ status }: { status: string }) {
  return isBookingStatus(status) ? <Badge color={STATUS_COLOR[status]}>{STATUS_LABELS[status]}</Badge> : <Badge>{status}</Badge>;
}

export const Th = ({ children }: { children?: React.ReactNode }) => (
  <th className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">{children}</th>
);
export const Td = ({ children, className = "" }: { children?: React.ReactNode; className?: string }) => (
  <td className={`px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400 ${className}`}>{children}</td>
);
export const Strong = ({ children }: { children: React.ReactNode }) => (
  <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">{children}</span>
);
export const TableWrap = ({ children }: { children: React.ReactNode }) => (
  <div className="max-w-full overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">{children}</table>
  </div>
);
