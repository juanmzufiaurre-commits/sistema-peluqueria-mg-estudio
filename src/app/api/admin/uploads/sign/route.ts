import { NextResponse, type NextRequest } from "next/server";
import { signUpload, type ResourceType, type UploadKind } from "@/lib/cloudinary";
import { getAdminUser } from "@/server/auth/admin";

// Carpetas que el panel puede usar. Las fotos de referencia del cliente tienen su propio endpoint público.
const ADMIN_KINDS: UploadKind[] = ["result", "staff", "catalog"];

// Firma de subidas del panel (resultados, equipo y catálogo): solo admin.
export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!(await getAdminUser())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const kind = (request.nextUrl.searchParams.get("kind") ?? "result") as UploadKind;
  if (!ADMIN_KINDS.includes(kind)) return NextResponse.json({ error: "Tipo de foto inválido" }, { status: 400 });
  // Videos solo para el catálogo; el resto son fotos.
  const resource: ResourceType = request.nextUrl.searchParams.get("resource") === "video" ? "video" : "image";
  if (resource === "video" && kind !== "catalog") return NextResponse.json({ error: "Tipo de archivo inválido" }, { status: 400 });
  const signature = signUpload(kind, resource);
  if (!signature) return NextResponse.json({ error: "La carga de fotos no está disponible." }, { status: 503 });
  return NextResponse.json(signature, { headers: { "Cache-Control": "no-store" } });
}
