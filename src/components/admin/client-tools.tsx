"use client";

import { Loader2, NotebookPen, Pencil } from "lucide-react";
import { useState, useTransition } from "react";
import { addClientNoteAction } from "@/actions/admin-bookings";
import { updateClientNameAction } from "@/actions/clients";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/field";
import { formatLongDate } from "@/lib/format";
import type { AgendaNote } from "@/types/admin";
import { PanelTitle } from "./ui";

/** Notas técnicas del cliente: las mismas que se ven y se cargan desde un turno en la Agenda. */
export function ClientNotes({ clientId, notes }: { clientId: string; notes: AgendaNote[] }) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function addNote() {
    setError(null);
    startTransition(async () => {
      const r = await addClientNoteAction({ clientId, body });
      if (r.success) setBody("");
      else setError(r.error);
    });
  }

  return (
    <div>
      <PanelTitle icon={NotebookPen} title="Notas técnicas" description="Solo las ven ustedes. Ej.: máquina, color, producto." />
      {notes.length === 0 && <p className="mb-3 text-sm text-muted">Sin notas todavía.</p>}
      <ul className="mb-3 flex flex-col gap-2">
        {notes.map((n) => (
          <li key={n.id} className="rounded-sm border-l-2 border-ink/30 bg-ink/[0.03] px-3 py-2.5 text-sm">
            <p className="whitespace-pre-wrap">{n.body}</p>
            <p className="mt-1 text-xs text-muted">{formatLongDate(n.createdAt)}</p>
          </li>
        ))}
      </ul>
      <label htmlFor="client-note" className="sr-only">
        Nueva nota
      </label>
      <textarea
        id="client-note"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder="Máquina nº 2 a los costados, tijera arriba, producto usado…"
        className="w-full rounded-sm border border-ink/10 bg-ink/[0.03] p-3 text-sm placeholder:text-muted/70 focus-visible:border-ink"
      />
      {error && (
        <p role="alert" className="mt-2 text-sm text-st-cancelled">
          {error}
        </p>
      )}
      <Button variant="outline" size="sm" className="mt-2" disabled={pending || body.trim() === ""} onClick={addNote}>
        {pending && <Loader2 aria-hidden className="size-4 animate-spin" />} Guardar nota
      </Button>
    </div>
  );
}

/** Corregir nombre y apellido (el teléfono no se cambia: identifica al cliente). */
export function EditClientName({ clientId, firstName, lastName }: { clientId: string; firstName: string; lastName: string | null }) {
  const [open, setOpen] = useState(false);
  const [first, setFirst] = useState(firstName);
  const [last, setLast] = useState(lastName ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    setError(null);
    startTransition(async () => {
      const r = await updateClientNameAction({ clientId, firstName: first, lastName: last });
      if (r.success) setOpen(false);
      else setError(r.error);
    });
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <Pencil aria-hidden className="size-3.5" /> Editar nombre
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Editar nombre">
        <form
          className="flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <Field label="Nombre" htmlFor="client-first">
            <Input id="client-first" value={first} onChange={(e) => setFirst(e.target.value)} maxLength={60} required />
          </Field>
          <Field label="Apellido" htmlFor="client-last" hint="Opcional">
            <Input id="client-last" value={last} onChange={(e) => setLast(e.target.value)} maxLength={60} />
          </Field>
          <p className="text-sm text-muted">El teléfono no se puede cambiar: es lo que identifica a cada cliente cuando reserva.</p>
          {error && (
            <p role="alert" className="text-sm text-st-cancelled">
              {error}
            </p>
          )}
          <Button type="submit" disabled={pending || first.trim() === ""}>
            {pending && <Loader2 aria-hidden className="size-4 animate-spin" />} Guardar
          </Button>
        </form>
      </Dialog>
    </>
  );
}
