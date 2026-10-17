import { NextResponse } from "next/server";
import { signUpload } from "@/lib/cloudinary";
import { clientIp, rateLimit } from "@/lib/rate-limit";

// Firma de subidas de fotos de referencia: pública (el cliente no tiene cuenta), por eso limitada.
export async function POST(request: Request): Promise<NextResponse> {
  if (!rateLimit(`sign:${clientIp(request)}`, 15, 10 * 60_000)) {
    return NextResponse.json({ error: "Demasiados intentos. Probá en unos minutos." }, { status: 429 });
  }
  const signature = signUpload("reference");
  if (!signature) return NextResponse.json({ error: "La carga de fotos no está disponible." }, { status: 503 });
  return NextResponse.json(signature, { headers: { "Cache-Control": "no-store" } });
}
