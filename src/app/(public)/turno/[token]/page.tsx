import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { MyBooking } from "@/components/booking/my-booking";
import { getBookingByToken } from "@/server/services/booking";
import { getPublicInfo } from "@/server/services/catalog";

// El token es una credencial: no se indexa y no se filtra por el header Referer.
export const metadata: Metadata = { title: "Tu turno — MG Estudio", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default function TurnoPage({ params }: PageProps<"/turno/[token]">) {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-12">
      <p aria-hidden className="mb-10 text-center font-display text-6xl font-semibold leading-none">
        MG
      </p>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-sm bg-cream-deep" />}>
        <Content params={params} />
      </Suspense>
    </main>
  );
}

async function Content({ params }: { params: PageProps<"/turno/[token]">["params"] }) {
  await connection(); // el estado del turno depende de la hora actual
  const { token } = await params;
  const [view, info] = await Promise.all([getBookingByToken(token), getPublicInfo()]);
  if (!view) notFound();

  return (
    <MyBooking
      token={token}
      info={info}
      booking={{
        publicCode: view.publicCode,
        status: view.status,
        serviceName: view.serviceName,
        firstName: view.firstName,
        startsAt: view.startsAt.toISOString(),
        durationMinutes: view.durationMinutes,
        priceArs: view.priceArs,
        canModify: view.canModify,
        minCancelHours: view.minCancelHours,
      }}
    />
  );
}
