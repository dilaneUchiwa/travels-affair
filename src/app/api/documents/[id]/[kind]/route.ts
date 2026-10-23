import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/modules/auth/session";
import { getBookingFor } from "@/modules/bookings/service";
import { DOCUMENT_KINDS, isDocumentKind, renderBookingPdf } from "@/modules/documents/pdf";
import { bookingQrPayload } from "@/modules/documents/qr";
import { getLang } from "@/i18n/server";
import { AppError } from "@/shared/errors";

export const dynamic = "force-dynamic";

/** GET /api/documents/<réservation>/<confirmation|summary|invoice|voucher> — PDF, réservé au propriétaire ou à l'admin. */
export async function GET(_: NextRequest, { params }: { params: { id: string; kind: string } }) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  if (!isDocumentKind(params.kind)) return new NextResponse(`Types : ${DOCUMENT_KINDS.join(", ")}`, { status: 404 });
  try {
    const booking = await getBookingFor(user, params.id);
    // Les documents officiels n'existent qu'une fois la réservation payée (le récapitulatif est toujours disponible).
    if (params.kind !== "summary" && booking.status === "PENDING_PAYMENT") return new NextResponse("Paiement requis", { status: 409 });
    const pdf = await renderBookingPdf(params.kind, booking, getLang(), bookingQrPayload(booking));
    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${params.kind}-${booking.reference}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    if (e instanceof AppError) return new NextResponse("Not found", { status: 404 });
    throw e;
  }
}
