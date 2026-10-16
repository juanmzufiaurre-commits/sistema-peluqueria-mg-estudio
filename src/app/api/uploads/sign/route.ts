import { NextResponse } from "next/server";
import { signReferenceUpload } from "@/lib/cloudinary";

export async function POST(): Promise<NextResponse> {
  const signature = signReferenceUpload();
  if (!signature) return NextResponse.json({ error: "La carga de fotos no está disponible." }, { status: 503 });
  return NextResponse.json(signature, { headers: { "Cache-Control": "no-store" } });
}
