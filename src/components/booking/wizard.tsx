"use client";

import { ArrowLeft } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Suspense, useRef, useState } from "react";
import { getAvailabilityAction, type AvailableDay } from "@/actions/availability";
import type { BookingReceipt } from "@/actions/bookings";
import type { ActionResult } from "@/lib/action-result";
import { formatArs, formatDuration } from "@/lib/format";
import type { PublicInfo, PublicService } from "@/server/services/catalog";
import type { PublicStaff } from "@/server/services/team";
import { StepContact } from "./step-contact";
import { StepDateTime, StepDateTimeSkeleton } from "./step-datetime";
import { StepService } from "./step-service";
import { Ticket } from "./ticket";

type Step = "service" | "datetime" | "contact" | "done";
const STEPS: { key: Exclude<Step, "done">; label: string }[] = [
  { key: "service", label: "Servicio" },
  { key: "datetime", label: "Horario" },
  { key: "contact", label: "Tus datos" },
];

const TITLES: Record<Step, string> = {
  service: "Elegí tu servicio",
  datetime: "Elegí día y horario",
  contact: "Tus datos",
  done: "",
};

export function BookingWizard({ services, info, team }: { services: PublicService[]; info: PublicInfo; team: PublicStaff[] }) {
  const [step, setStep] = useState<Step>("service");
  const [service, setService] = useState<PublicService | null>(null);
  const [startsAt, setStartsAt] = useState<string | null>(null);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<BookingReceipt | null>(null);
  const [availability, setAvailability] = useState<Promise<ActionResult<AvailableDay[]>> | null>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  function go(next: Step) {
    setStep(next);
    topRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }

  function loadAvailability(s: PublicService) {
    setAvailability(getAvailabilityAction(s.id));
  }

  function selectService(s: PublicService) {
    setService(s);
    setStartsAt(null);
    loadAvailability(s);
    go("datetime");
  }

  function reset() {
    setService(null);
    setStartsAt(null);
    setReceipt(null);
    setAvailability(null);
    go("service");
  }

  const stepIndex = STEPS.findIndex((s) => s.key === step);
  const back: Step | null = step === "datetime" ? "service" : step === "contact" ? "datetime" : null;

  return (
    <div ref={topRef} className="scroll-mt-6">
      {step !== "done" && (
        <div className="mb-6">
          {/* "Volver" a la izquierda y en qué paso estás a la derecha: se entiende sin barra de progreso. */}
          <div className="mb-3 flex min-h-9 items-center justify-between gap-4">
            {back ? (
              <button
                type="button"
                onClick={() => go(back)}
                className="-ml-1 inline-flex items-center gap-2 px-1 py-2 text-xs uppercase tracking-[0.2em] text-ink-soft transition-colors hover:text-ink"
              >
                <ArrowLeft aria-hidden className="size-4" strokeWidth={1.5} /> Volver
              </button>
            ) : (
              <span />
            )}
            <p className="text-xs uppercase tracking-[0.2em] text-muted">
              Paso <span className="text-ink">{stepIndex + 1}</span> de {STEPS.length}
            </p>
          </div>
          <h2 className="text-[1.85rem] font-medium leading-tight tracking-tight">{TITLES[step]}</h2>
        </div>
      )}

      {service && (step === "datetime" || step === "contact") && (
        <p className="mb-6 text-sm text-ink-soft">
          {service.name} · {formatDuration(service.durationMinutes)} · {formatArs(service.priceArs)}
        </p>
      )}

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          {step === "service" && <StepService services={services} onSelect={selectService} />}

          {step === "datetime" && service && availability && (
            <Suspense fallback={<StepDateTimeSkeleton />}>
              <StepDateTime
                availability={availability}
                team={team}
                onRetry={() => loadAvailability(service)}
                onSelect={(iso, staff) => {
                  setStartsAt(iso);
                  setStaffId(staff);
                  go("contact");
                }}
              />
            </Suspense>
          )}

          {step === "contact" && service && startsAt && (
            <StepContact
              service={service}
              startsAt={startsAt}
              staff={team.find((s) => s.id === staffId) ?? null}
              onPickAnotherSlot={() => {
                loadAvailability(service);
                go("datetime");
              }}
              onBooked={(r) => {
                setReceipt(r);
                go("done");
              }}
            />
          )}

          {step === "done" && receipt && (
            <Ticket receipt={receipt} businessName={info.businessName} address={info.address} onNewBooking={reset} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
