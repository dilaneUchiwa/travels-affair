import { cfg, loadConfig } from "@/modules/settings/service";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import type { Booking, Passenger, Payment, User } from "@/db";
import { makeT, type Lang } from "@/i18n";
import { formatDateTime } from "@/shared/dates";
import { formatMoney } from "@/shared/money";
import { detailValue, parseDetails, priceBreakdown } from "../bookings/view";

export const DOCUMENT_KINDS = ["confirmation", "summary", "invoice", "voucher"] as const;
export type DocumentKind = (typeof DOCUMENT_KINDS)[number];
export const isDocumentKind = (v: string): v is DocumentKind => (DOCUMENT_KINDS as readonly string[]).includes(v);

export type DocBooking = Booking & { user: User; passengers: Passenger[]; payments: Payment[] };

const BRAND = "#12376b";
const INK = "#12263a";
const GREY = "#667788";

/** Documents de réservation (confirmation, récapitulatif, facture, voucher avec QR) en PDF, polices standard embarquées. */
export async function renderBookingPdf(kind: DocumentKind, b: DocBooking, lang: Lang, qrPayload: string): Promise<Buffer> {
  const t = makeT(lang);
  await loadConfig();
  const agency = cfg("agency.name");
  const doc = new PDFDocument({ size: "A4", margin: 50, info: { Title: `${t(`doc.${kind}`)} ${b.reference}`, Author: agency } });
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  // En-tête
  doc.rect(0, 0, doc.page.width, 90).fill(BRAND);
  doc.fillColor("#fff").fontSize(22).font("Helvetica-Bold").text(agency, 50, 30);
  doc.fontSize(11).font("Helvetica").text(t(`doc.${kind}`), 50, 58);
  doc.fillColor(INK);
  doc.y = 115;

  const row = (label: string, value: string) => {
    doc.font("Helvetica-Bold").fontSize(10).fillColor(GREY).text(label.toUpperCase(), { continued: false });
    doc.font("Helvetica").fontSize(12).fillColor(INK).text(value || "—").moveDown(0.6);
  };

  doc.font("Helvetica-Bold").fontSize(20).fillColor(INK).text(b.title);
  doc.font("Helvetica").fontSize(12).fillColor(GREY).text(b.subtitle).moveDown(1);

  row(t("mail.reference"), b.reference);
  row(t("doc.status"), t(`status.${b.status}`));
  row(t("mail.service"), t(`service.${b.serviceType}`));

  if (kind !== "invoice") {
    for (const [key, value] of parseDetails(b)) row(t(`detail.${key}`), detailValue(t, value));
  }

  if (kind === "invoice") {
    row(t("doc.invoiceNo"), `FAC-${b.reference}`);
    row(t("doc.date"), formatDateTime(b.createdAt, lang));
    row(t("doc.billedTo"), `${b.user.name} — ${b.user.email}`);
    row(b.title, priceBreakdown(b, t, lang));
    const paid = b.payments.find((p) => p.status === "SUCCEEDED");
    row(t("doc.paymentStatus"), paid ? t("doc.paid", { date: formatDateTime(paid.createdAt, lang), method: t(`pay.method.${paid.method}`) }) : t("doc.unpaid"));
  }

  doc.font("Helvetica-Bold").fontSize(14).fillColor(BRAND).text(`${t("mail.total")} : ${formatMoney(b.total, b.currency, lang)}`).moveDown(1);

  if (kind === "voucher" || kind === "confirmation" || kind === "invoice") {
    const png = await QRCode.toBuffer(qrPayload, { margin: 1, width: 360 });
    const y = doc.y;
    doc.image(png, doc.page.width - 200, Math.max(115, y - 190), { width: 140 });
    doc.fontSize(9).fillColor(GREY).text(t("doc.presentQr"), doc.page.width - 215, Math.max(115, y - 190) + 145, { width: 170, align: "center" });
    doc.y = y;
  }
  if (kind !== "invoice") {
    if (b.conditions) row(t("doc.conditions"), b.conditions);
    if (b.cancellationPolicy) row(t("doc.cancellation"), b.cancellationPolicy);
  }

  doc.fontSize(9).fillColor(GREY).text([agency, cfg("agency.address"), cfg("agency.phone"), cfg("agency.email")].filter(Boolean).join("  ·  "), 50, doc.page.height - 85, { align: "center", width: doc.page.width - 100 });
  doc.fontSize(9).fillColor(GREY).text(t("doc.generated", { date: formatDateTime(new Date(), lang) }), 50, doc.page.height - 70, { align: "center", width: doc.page.width - 100 });
  doc.end();
  return done;
}
