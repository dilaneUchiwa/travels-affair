import type { Booking, Passenger, User } from "@/db";
import { makeT, type Lang } from "@/i18n";
import { formatDateTime } from "@/shared/dates";
import { formatMoney } from "@/shared/money";
import { env } from "@/shared/env";
import { detailValue, parseDetails } from "@/modules/bookings/view";
import type { MailMessage } from "./mailer";

export type BookingEmailKind = "PENDING_PAYMENT" | "PAYMENT_RECEIVED" | "CONFIRMED" | "MODIFIED" | "CANCELLED" | "REFUNDED" | "REMINDER";

export type BookingContext = Booking & { user: User; passengers: Passenger[] };

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Délai lisible : 1440 → « 24 h », 30 → « 30 minutes ». */
export function humanDelay(minutes: number, lang: Lang): string {
  const t = makeT(lang);
  return minutes >= 120 && minutes % 60 === 0 ? t("delay.hours", { n: minutes / 60 }) : t("delay.minutes", { n: minutes });
}

export function renderBookingEmail(kind: BookingEmailKind, b: BookingContext, opts: { minutes?: number } = {}): Omit<MailMessage, "to"> {
  const lang: Lang = b.user.lang === "en" ? "en" : "fr";
  const t = makeT(lang);
  const vars = { ref: b.reference, delay: humanDelay(opts.minutes ?? 0, lang), name: b.user.name };
  const intro = t(`mail.${kind}.intro`, vars);
  const link = `${env.APP_URL}/mon-compte/reservations/${b.id}`;
  const lines: [string, string][] = [
    [t("mail.reference"), b.reference],
    [t("mail.service"), t(`service.${b.serviceType}`)],
    [b.title, b.subtitle],
    ...parseDetails(b).map(([k, v]) => [t(`detail.${k}`), detailValue(t, v)] as [string, string]),
    [t("mail.total"), formatMoney(b.total, b.currency, lang)],
    [t("detail.start"), formatDateTime(b.startAt, lang)],
  ];
  const attached = kind === "PAYMENT_RECEIVED" || kind === "CONFIRMED";
  const text = `${t("mail.hello", vars)}\n\n${intro}\n\n${lines.map(([k, v]) => `${k} : ${v}`).join("\n")}\n\n${attached ? t("mail.attached") + "\n\n" : ""}${t("mail.yourSpace")} ${link}\n\n${t("mail.signature")}`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#12263a">
<h2 style="color:#0b6e75">Travel's Affair</h2>
<p>${esc(t("mail.hello", vars))}</p><p>${esc(intro)}</p>
<table style="border-collapse:collapse;width:100%">${lines.map(([k, v]) => `<tr><td style="padding:4px 8px 4px 0;color:#667788;vertical-align:top">${esc(k)}</td><td style="padding:4px 0">${esc(v)}</td></tr>`).join("")}</table>
${attached ? `<p>${esc(t("mail.attached"))}</p>` : ""}
<p><a href="${link}" style="background:#0b6e75;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">${esc(t("mail.myBooking"))}</a></p>
<p style="color:#667788">${esc(t("mail.signature"))}</p>
</div>`;
  return { subject: t(`mail.${kind}.subject`, vars), text, html };
}
