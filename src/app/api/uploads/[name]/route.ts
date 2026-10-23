import { NextResponse } from "next/server";
import { readImage } from "@/modules/uploads/service";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: { name: string } }) {
  const img = await readImage(params.name);
  if (!img) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(img.data, {
    headers: { "Content-Type": img.type, "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
  });
}
