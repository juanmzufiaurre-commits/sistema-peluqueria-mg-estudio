"use client";

import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { createServiceAction, deleteServiceAction, setServiceActiveAction, updateServiceAction } from "@/actions/services";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/field";
import { formatArs, formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface ServiceRow {
  id: string;
  name: string;
  description: string;
  includes: string[];
  priceArs: number;
  durationMinutes: number;
  isActive: boolean;
  /** Turnos que usaron este servicio (todos los estados). */
  bookingCount: number;
  /** De esos, los activos que todavía no ocurrieron. */
  upcomingCount: number;
}

export function ServiceManager({ services }: { services: ServiceRow[] }) {
  const [editing, setEditing] = useState<ServiceRow | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<ServiceRow | null>(null);
  const [pending, startTransition] = useTransition();

  function remove() {
    if (!toDelete) return;
    setError(null);
    startTransition(async () => {
      const r = await deleteServiceAction(toDelete.id);
      if (r.success) setToDelete(null);
      else {
        setToDelete(null);
        setError(r.error);
      }
    });
  }

  function toggle(s: ServiceRow) {
    setError(null);
    startTransition(async () => {
      const r = await setServiceActiveAction({ id: s.id, isActive: !s.isActive });
      if (!r.success) setError(r.error);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-soft">Dar de baja oculta el servicio al público y se puede revertir. Eliminar lo borra definitivamente.</p>
        <Button size="sm" onClick={() => setEditing("new")}>
          <Plus aria-hidden className="size-4" /> Nuevo servicio
        </Button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-st-cancelled">
          {error}
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {services.map((s) => (
          <li key={s.id} className={cn("flex flex-wrap items-center gap-4 rounded-sm border border-line bg-surface p-4", !s.isActive && "opacity-60")}>
            <div className="min-w-0 flex-1">
              <p className="font-display text-xl font-semibold">
                {s.name}{" "}
                {!s.isActive && <span className="ml-2 rounded-sm bg-cream-deep px-2 py-0.5 align-middle text-[0.65rem] uppercase tracking-[0.12em]">Dado de baja</span>}
              </p>
              <p className="text-sm text-ink-soft">
                {formatArs(s.priceArs)} · {formatDuration(s.durationMinutes)}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setEditing(s)}>
              <Pencil aria-hidden className="size-4" /> Editar
            </Button>
            <Button variant="ghost" size="sm" onClick={() => toggle(s)} disabled={pending}>
              {s.isActive ? "Dar de baja" : "Reactivar"}
            </Button>
            <Button variant="ghost" size="sm" className="text-st-cancelled hover:bg-st-cancelled/10" onClick={() => setToDelete(s)} disabled={pending}>
              <Trash2 aria-hidden className="size-4" /> Eliminar
            </Button>
          </li>
        ))}
      </ul>

      <Dialog open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "Nuevo servicio" : "Editar servicio"}>
        {editing && <ServiceForm key={editing === "new" ? "new" : editing.id} service={editing === "new" ? null : editing} onDone={() => setEditing(null)} />}
      </Dialog>

      <Dialog open={toDelete !== null} onClose={() => setToDelete(null)} title="Eliminar servicio">
        {toDelete && (
          <div className="flex flex-col gap-5">
            <p>
              Vas a eliminar <strong>{toDelete.name}</strong> definitivamente. Esta acción no se puede deshacer.
            </p>
            {toDelete.isActive && <p className="text-sm text-ink-soft">Dejará de mostrarse a los clientes en el mismo momento.</p>}
            {toDelete.bookingCount > 0 ? (
              <p className="rounded-sm bg-cream-deep p-4 text-sm">
                Tiene <strong>{toDelete.bookingCount}</strong> {toDelete.bookingCount === 1 ? "turno" : "turnos"} en el historial
                {toDelete.upcomingCount > 0 && (
                  <>
                    {" "}
                    (<strong>{toDelete.upcomingCount}</strong> {toDelete.upcomingCount === 1 ? "próximo" : "próximos"})
                  </>
                )}
                . Se conservan con su nombre, precio y duración, y las métricas no cambian, pero ya no quedarán vinculados a un servicio del catálogo.
              </p>
            ) : (
              <p className="text-sm text-muted">No tiene turnos asociados.</p>
            )}
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setToDelete(null)} disabled={pending}>
                Volver
              </Button>
              <Button className="flex-1 bg-st-cancelled hover:bg-st-cancelled/90" onClick={remove} disabled={pending}>
                {pending && <Loader2 aria-hidden className="size-4 animate-spin" />} Eliminar
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}

function ServiceForm({ service, onDone }: { service: ServiceRow | null; onDone: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    setError(null);
    const values = {
      name: formData.get("name"),
      description: formData.get("description"),
      includes: formData.get("includes") ?? "",
      priceArs: formData.get("priceArs"),
      durationMinutes: formData.get("durationMinutes"),
    };
    startTransition(async () => {
      const r = service ? await updateServiceAction(service.id, values) : await createServiceAction(values);
      if (r.success) onDone();
      else setError(r.error);
    });
  }

  return (
    <form action={submit} className="flex flex-col gap-5">
      <Field label="Nombre" htmlFor="name">
        <Input id="name" name="name" defaultValue={service?.name} required maxLength={60} />
      </Field>
      <Field label="Descripción" htmlFor="description">
        <Input id="description" name="description" defaultValue={service?.description} required maxLength={300} />
      </Field>
      <Field label="Qué incluye" htmlFor="includes" hint="Un ítem por línea">
        <textarea
          id="includes"
          name="includes"
          rows={5}
          defaultValue={service?.includes.join("\n")}
          className="w-full rounded-sm border border-line bg-surface p-3 text-base focus-visible:border-ink"
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Precio (ARS)" htmlFor="priceArs">
          <Input id="priceArs" name="priceArs" type="number" inputMode="numeric" min={0} step={500} defaultValue={service?.priceArs} required />
        </Field>
        <Field label="Duración (min)" htmlFor="durationMinutes">
          <Input id="durationMinutes" name="durationMinutes" type="number" inputMode="numeric" min={5} max={600} step={5} defaultValue={service?.durationMinutes} required />
        </Field>
      </div>
      {service && <p className="text-sm text-muted">Los cambios aplican a nuevas reservas. Los turnos ya agendados conservan su precio y duración.</p>}
      {error && (
        <p role="alert" className="text-sm text-st-cancelled">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={pending}>
        {pending && <Loader2 aria-hidden className="size-4 animate-spin" />} Guardar
      </Button>
    </form>
  );
}
