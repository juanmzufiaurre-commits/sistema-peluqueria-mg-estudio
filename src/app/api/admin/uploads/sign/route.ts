import { NextResponse } from "next/server";
import { signUpload } from "@/lib/cloudinary";
import { getAdminUser } from "@/server/auth/admin";

// Firma de subidas de fotos del resultado: solo admin.
export async function POST(): Promise<NextResponse> {
  if (!(await getAdminUser())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const signature = signUpload("result");
  if (!signature) return NextResponse.json({ error: "La carga de fotos no está disponible." }, { status: 503 });
  return NextResponse.json(signature, { headers: { "Cache-Control": "no-store" } });
}
