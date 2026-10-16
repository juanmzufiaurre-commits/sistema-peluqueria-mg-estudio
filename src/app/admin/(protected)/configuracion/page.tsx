import { connection } from "next/server";
import { Suspense } from "react";
import { BlocksManager } from "@/components/admin/blocks-manager";
import { HoursEditor } from "@/components/admin/hours-editor";
import { SettingsForm } from "@/components/admin/settings-form";
import { db } from "@/lib/db";
import { formatLongDate, formatTime } from "@/lib/format";
import { loadConfig } from "@/server/services/booking";

export const metadata = { title: "Configuración — MG Estudio" };

export default function ConfigPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-12">
      <h1 className="font-display text-3xl font-semibold">Configuración</h1>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-sm bg-cream-deep" />}>
        <Sections />
      </Suspense>
    </div>
  );
}

async function Sections() {
  await connection(); // la hora actual se usa en la consulta: hay que renderizar en el request
  const [config, info, hours, blocks] = await Promise.all([
    loadConfig(),
    db.systemConfig.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } }),
    db.workingHour.findMany({ where: { staffId: null }, orderBy: [{ weekday: "asc" }, { startTime: "asc" }] }),
    db.blockedPeriod.findMany({ where: { endDatetime: { gt: new Date() } }, orderBy: { startDatetime: "asc" } }),
  ]);

  const blockRows = blocks.map((b) => {
    const s = b.startDatetime.toISOString();
    const e = b.endDatetime.toISOString();
    const wholeDays = formatTime(s) === "00:00" && formatTime(e) === "00:00";
    const lastDay = new Date(b.endDatetime.getTime() - 1).toISOString();
    return {
      id: b.id,
      reason: b.reason,
      label: wholeDays
        ? formatLongDate(s) === formatLongDate(lastDay)
          ? `${formatLongDate(s)} (día completo)`
          : `${formatLongDate(s)} → ${formatLongDate(lastDay)}`
        : `${formatLongDate(s)} ${formatTime(s)} → ${formatLongDate(e)} ${formatTime(e)}`,
    };
  });

  return (
    <>
      <Block title="Horarios de atención">
        <HoursEditor initial={hours.map((h) => ({ weekday: h.weekday, start: h.startTime, end: h.endTime }))} />
      </Block>
      <Block title="Feriados y bloqueos">
        <BlocksManager blocks={blockRows} />
      </Block>
      <Block title="Ajustes del local">
        <SettingsForm
          initial={{
            businessName: info.businessName,
            address: info.address ?? "",
            whatsappNumber: info.whatsappNumber ?? "",
            bufferMinutes: config.bufferMinutes,
            slotStepMinutes: config.slotStepMinutes,
            bookingWindowDays: config.bookingWindowDays,
            sameDayCutoffTime: config.sameDayCutoffTime,
            minCancelHours: config.minCancelHours,
          }}
        />
      </Block>
    </>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="label-wide mb-5 border-b border-line pb-3 text-ink-soft">{title}</h2>
      {children}
    </section>
  );
}
