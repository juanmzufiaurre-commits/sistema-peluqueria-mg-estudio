"use client";

import { Plus, X } from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import { IncludeIcon } from "@/components/booking/include-icon";

const SUGGESTIONS = ["Corte", "Barba", "Lavado", "Café", "Acceso a PS5", "Mechas", "Decoloración global", "Perfilado", "Color"];
const MAX_ITEMS = 15;

/**
 * "Qué incluye" de un servicio como recuadros con ícono: se agregan escribiendo (o tocando una
 * sugerencia) y se quitan con la ✕. Se envía como `name` (un ítem por línea) igual que antes.
 */
export function IncludesEditor({ name, initial }: { name: string; initial: string[] }) {
  const [items, setItems] = useState<string[]>(initial);
  const [draft, setDraft] = useState("");

  const has = (item: string) => items.some((i) => i.toLowerCase() === item.toLowerCase());

  function add(raw: string) {
    const item = raw.trim().slice(0, 60);
    if (!item || has(item) || items.length >= MAX_ITEMS) return;
    setItems((all) => [...all, item]);
    setDraft("");
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault(); // no enviar el formulario
      add(draft);
    }
  }

  const suggestions = SUGGESTIONS.filter((s) => !has(s));

  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name={name} value={items.join("\n")} />

      {items.length > 0 ? (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {items.map((item) => (
            <li key={item} className="group relative flex flex-col items-center gap-2 rounded-sm border border-ink/10 bg-ink/[0.03] px-2 pb-3 pt-4 text-center">
              <IncludeIcon item={item} className="size-6 text-ink" />
              <span className="text-xs leading-tight text-ink-soft">{item}</span>
              <button
                type="button"
                onClick={() => setItems((all) => all.filter((i) => i !== item))}
                aria-label={`Quitar ${item}`}
                className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full text-muted transition-colors hover:bg-st-cancelled/10 hover:text-st-cancelled"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">Todavía no agregaste nada.</p>
      )}

      {items.length < MAX_ITEMS && (
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            maxLength={60}
            placeholder="Ej.: Perfilado de cejas"
            aria-label="Nuevo ítem incluido"
            className="h-11 min-w-0 flex-1 rounded-sm border border-line bg-surface px-3 text-sm placeholder:text-muted/70 focus-visible:border-ink"
          />
          <button
            type="button"
            onClick={() => add(draft)}
            disabled={!draft.trim()}
            className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-sm border border-ink/25 px-4 text-xs uppercase tracking-[0.12em] transition-colors hover:border-ink disabled:opacity-40"
          >
            <Plus aria-hidden className="size-4" /> Agregar
          </button>
        </div>
      )}

      {suggestions.length > 0 && items.length < MAX_ITEMS && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted">Sugerencias:</span>
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="inline-flex items-center gap-1 rounded-full border border-dashed border-ink/20 px-2.5 py-1 text-xs text-ink-soft transition-colors hover:border-ink hover:text-ink"
            >
              <Plus aria-hidden className="size-3" /> {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
