"use client";

import { ArrowLeft } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Suspense, useRef, useState } from "react";
import { getAvailabilityAction, type AvailableDay } from "@/actions/availability";
import type { BookingReceipt } from "@/actions/bookings";
import type { ActionResult } from "@/lib/action-result";
import { formatArs, formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PublicInfo, PublicService } from "@/server/services/catalog";
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

export function BookingWizard({ services, info }: { services: PublicService[]; info: PublicInfo }) {
  const [step, setStep] = useState<Step>("service");
  const [service, setService] = useState<PublicService | null>(null);
  const [startsAt, setStartsAt] = useState<string | null>(null);
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
        <nav aria-label="Progreso" className="mb-8">
          <ol className="flex gap-2">
            {STEPS.map((s, i) => (
              <li key={s.key} className="flex-1" aria-current={i === stepIndex ? "step" : undefined}>
                <div className={cn("h-px", i <= stepIndex ? "bg-ink" : "bg-line")} />
                <p className={cn("label-wide mt-2 !text-[0.6rem]", i <= stepIndex ? "text-ink" : "text-muted")}>
                  {String(i + 1).padStart(2, "0")} {s.label}
                </p>
              </li>
            ))}
          </ol>
        </nav>
      )}

      {step !== "done" && (
        <div className="mb-6 flex items-center gap-3">
          {back && (
            <button type="button" onClick={() => go(back)} aria-label="Volver" className="-ml-2 flex size-10 items-center justify-center">
              <ArrowLeft className="size-5" strokeWidth={1.5} />
            </button>
          )}
          <h2 className="font-display text-3xl font-semibold">{TITLES[step]}</h2>
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
                onRetry={() => loadAvailability(service)}
                onSelect={(iso) => {
                  setStartsAt(iso);
                  go("contact");
                }}
              />
            </Suspense>
          )}

          {step === "contact" && service && startsAt && (
            <StepContact
              service={service}
              startsAt={startsAt}
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
