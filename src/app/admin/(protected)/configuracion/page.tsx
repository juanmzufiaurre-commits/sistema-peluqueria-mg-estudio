import { CalendarOff, Clock, Store, type LucideIcon } from "lucide-react";
import { connection } from "next/server";
import { Suspense } from "react";
import { BlocksManager } from "@/components/admin/blocks-manager";
import { HoursEditor } from "@/components/admin/hours-editor";
import { SettingsForm } from "@/components/admin/settings-form";
import { PageHeader, Panel, PanelTitle } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { formatLongDate, formatTime } from "@/lib/format";
import { loadConfig } from "@/server/services/booking";

export const metadata = { title: "Configuración — MG Estudio" };

export default function ConfigPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader eyebrow="Configuración" title="Ajustes del estudio" description="Cuándo atendés, los días que cerrás y los datos del local." />
      <div className="flex flex-col gap-6">
        <Suspense fallback={<div className="h-96 animate-pulse rounded-sm bg-ink/[0.04]" />}>
          <Sections />
        </Suspense>
      </div>
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
      <Block icon={Clock} title="Horarios de atención" description="Los clientes solo pueden reservar dentro de estos tramos.">
        <HoursEditor initial={hours.map((h) => ({ weekday: h.weekday, start: h.startTime, end: h.endTime }))} />
      </Block>
      <Block icon={CalendarOff} title="Feriados y bloqueos" description="Días u horas en que el estudio no atiende (vacaciones, trámites, feriados).">
        <BlocksManager blocks={blockRows} />
      </Block>
      <Block icon={Store} title="Datos del local y reservas" description="Nombre, dirección, WhatsApp y las reglas para reservar o cancelar.">
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

function Block({ icon, title, description, children }: { icon: LucideIcon; title: string; description: string; children: React.ReactNode }) {
  return (
    <Panel>
      <PanelTitle icon={icon} title={title} description={description} />
      {children}
    </Panel>
  );
}
