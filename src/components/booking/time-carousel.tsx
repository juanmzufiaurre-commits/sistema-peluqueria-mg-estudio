"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useRef, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { centeredIndex, distanceFromCenter, scrollLeftFor } from "@/lib/carousel";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Props {
  /** Horarios en ISO UTC, ordenados. */
  slots: string[];
  onSelect: (startsAtIso: string) => void;
}

// Cuánto se atenúa cada posición respecto del centro. Más allá de 2 queda fuera de la vista.
const LOOK: Record<number, string> = {
  0: "scale-125 text-3xl font-light tracking-tight opacity-100 blur-0",
  1: "text-xl font-light opacity-60 blur-[0.6px]",
  2: "text-lg font-light opacity-35 blur-[1.2px]",
};

/**
 * Rueda horizontal de horarios: el del centro se ve fuerte, dos vecinos por lado se ven difuminados
 * y al deslizar entran horarios nuevos mientras los anteriores salen de la vista.
 * El desplazamiento es nativo (scroll-snap), así que funciona con el dedo, el trackpad y la rueda.
 */
export function TimeCarousel({ slots, onSelect }: Props) {
  const scroller = useRef<HTMLUListElement>(null);
  const frame = useRef<number | null>(null);
  const [index, setIndex] = useState(0);
  // Destino pendiente: permite encadenar flechas rápidas mientras el desplazamiento suave aún no terminó.
  const target = useRef(0);
  const programmaticUntil = useRef(0);

  const syncIndex = useCallback(() => {
    if (frame.current !== null) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      const el = scroller.current;
      if (!el) return;
      const idx = centeredIndex(el.scrollLeft, el.clientWidth, slots.length);
      setIndex(idx);
      if (performance.now() > programmaticUntil.current) target.current = idx; // desplazamiento del usuario
    });
  }, [slots.length]);

  const goTo = useCallback(
    (i: number) => {
      const el = scroller.current;
      if (!el) return;
      const next = Math.min(slots.length - 1, Math.max(0, i));
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      target.current = next;
      programmaticUntil.current = performance.now() + 700;
      el.scrollTo({ left: scrollLeftFor(next, el.clientWidth), behavior: reduce ? "auto" : "smooth" });
    },
    [slots.length],
  );

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      goTo(target.current + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      goTo(target.current - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      goTo(0);
    } else if (e.key === "End") {
      e.preventDefault();
      goTo(slots.length - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      onSelect(slots[index]);
    }
  }

  const selected = slots[index];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
          aria-label="Horario anterior"
          className="hidden size-10 shrink-0 items-center justify-center rounded-full border border-line transition-colors hover:border-ink disabled:opacity-30 sm:flex"
        >
          <ChevronLeft className="size-5" />
        </button>

        <div className="@container min-w-0 flex-1 [mask-image:linear-gradient(to_right,transparent,black_18%,black_82%,transparent)]">
          <ul
            ref={scroller}
            onScroll={syncIndex}
            onKeyDown={onKeyDown}
            tabIndex={0}
            role="listbox"
            aria-label="Horarios disponibles"
            aria-activedescendant={`slot-${index}`}
            className="flex snap-x snap-mandatory items-center overflow-x-auto overscroll-x-contain px-[40cqw] py-8 [scrollbar-width:none] focus-visible:outline-none [&::-webkit-scrollbar]:hidden"
          >
            {slots.map((iso, i) => {
              const d = distanceFromCenter(i, index);
              return (
                <li
                  key={iso}
                  id={`slot-${i}`}
                  role="option"
                  aria-selected={d === 0}
                  className="w-[20cqw] shrink-0 snap-center snap-always"
                >
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => (d === 0 ? onSelect(iso) : goTo(i))}
                    aria-label={formatTime(iso)}
                    // Altura fija: el tamaño de letra cambia al animar y no debe mover lo que está debajo.
                    className={cn(
                      "flex h-12 w-full origin-center items-center justify-center leading-none tabular-nums transition-all duration-200",
                      LOOK[d] ?? "pointer-events-none opacity-0",
                    )}
                  >
                    {formatTime(iso)}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <button
          type="button"
          onClick={() => goTo(index + 1)}
          disabled={index === slots.length - 1}
          aria-label="Horario siguiente"
          className="hidden size-10 shrink-0 items-center justify-center rounded-full border border-line transition-colors hover:border-ink disabled:opacity-30 sm:flex"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      <p className="text-center text-sm text-muted">
        Deslizá para ver más horarios · {index + 1} de {slots.length}
      </p>

      <span role="status" aria-live="polite" className="sr-only">
        Horario seleccionado: {selected && formatTime(selected)}
      </span>

      <Button size="lg" onClick={() => onSelect(selected)}>
        Continuar con las {selected && formatTime(selected)} hs
      </Button>
    </div>
  );
}
