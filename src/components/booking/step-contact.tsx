"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { createBookingAction, type BookingReceipt } from "@/actions/bookings";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import { Field, Input } from "@/components/ui/field";
import { formatDuration, formatLongDate, formatTime } from "@/lib/format";
import { createBookingSchema } from "@/lib/validation/booking";
import type { PublicService } from "@/server/services/catalog";
import type { PublicStaff } from "@/server/services/team";
import { PhotoDropzone, type PhotoItem } from "./photo-dropzone";

const contactSchema = createBookingSchema.pick({ firstName: true, lastName: true, phone: true, website: true });
type ContactInput = z.input<typeof contactSchema>;
type ContactOutput = z.output<typeof contactSchema>;

interface Props {
  service: PublicService;
  startsAt: string;
  /** Profesional elegido; null = el primero libre. */
  staff: PublicStaff | null;
  onBooked: (receipt: BookingReceipt) => void;
  onPickAnotherSlot: () => void;
}

export function StepContact({ service, startsAt, staff, onBooked, onPickAnotherSlot }: Props) {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactInput, unknown, ContactOutput>({ resolver: zodResolver(contactSchema), mode: "onTouched" });

  const uploading = photos.some((p) => p.status === "uploading");

  function submit(values: ContactOutput) {
    setServerError(null);
    startTransition(async () => {
      const result = await createBookingAction({
        serviceId: service.id,
        startsAt,
        staffId: staff?.id ?? null,
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone,
        website: values.website,
        photos: photos.flatMap((p) => (p.status === "done" && p.uploaded ? [p.uploaded] : [])),
      });
      if (result.success && result.data) onBooked(result.data);
      else if (!result.success) setServerError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-8">
      <section aria-label="Resumen" className="rounded-sm border border-ink/10 bg-gradient-to-b from-ink/[0.06] to-ink/[0.015] p-5 shadow-[inset_0_1px_0_rgb(243_234_224/0.06)]">
        <p className="text-xl font-medium tracking-tight">{service.name}</p>
        <p className="mt-1 text-sm text-ink-soft">
          {formatLongDate(startsAt)} · {formatTime(startsAt)} hs
        </p>
        <p className="mt-1 text-sm text-ink-soft">{staff ? `Con ${staff.name}` : "Con el primer profesional libre"}</p>
        <p className="mt-4 flex items-center justify-between border-t border-ink/10 pt-4 text-sm text-ink-soft">
          <span>{formatDuration(service.durationMinutes)}</span>
          <Price amount={service.priceArs} className="text-xl text-ink" />
        </p>
      </section>

      <div className="flex flex-col gap-5">
        <Field label="Nombre" htmlFor="firstName" error={errors.firstName?.message}>
          <Input id="firstName" autoComplete="given-name" aria-invalid={!!errors.firstName} {...register("firstName")} />
        </Field>
        <Field label="Apellido" htmlFor="lastName" error={errors.lastName?.message}>
          <Input id="lastName" autoComplete="family-name" aria-invalid={!!errors.lastName} {...register("lastName")} />
        </Field>
        <Field label="Celular / WhatsApp" htmlFor="phone" error={errors.phone?.message} hint="Con código de área, sin 0 ni 15. Ej: 11 2345 6789">
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="11 2345 6789"
            aria-invalid={!!errors.phone}
            {...register("phone")}
          />
        </Field>

        {/* Honeypot: invisible para personas, los bots lo completan. */}
        <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label htmlFor="website">No completar</label>
          <input id="website" type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
        </div>
      </div>

      <div>
        <p className="label-wide mb-3 text-ink-soft">Fotos de referencia · opcional</p>
        <PhotoDropzone photos={photos} onChange={setPhotos} />
      </div>

      {serverError && (
        <div role="alert" className="flex flex-col items-start gap-3 rounded-sm border border-st-cancelled/40 bg-st-cancelled/5 p-4">
          <p className="text-st-cancelled">{serverError}</p>
          <Button variant="outline" size="sm" onClick={onPickAnotherSlot}>
            Elegir otro horario
          </Button>
        </div>
      )}

      <Button type="submit" size="lg" disabled={pending || uploading}>
        {pending ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
        {uploading ? "Subiendo fotos…" : "Confirmar reserva"}
      </Button>
    </form>
  );
}
