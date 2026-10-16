import { NextResponse } from "next/server";
import { checkCronAuth } from "@/lib/cron-auth";
import { runProximityReminders } from "@/server/services/notifications";

async function handle(request: Request): Promise<NextResponse> {
  const denied = checkCronAuth(request);
  if (denied) return NextResponse.json({ error: denied === 401 ? "No autorizado" : "Cron no configurado" }, { status: denied });

  try {
    return NextResponse.json(await runProximityReminders());
  } catch (error) {
    console.error("cron/proximity", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// GET (Vercel Cron) y POST (GitHub Actions / QStash) hacen lo mismo.
export const GET = handle;
export const POST = handle;
