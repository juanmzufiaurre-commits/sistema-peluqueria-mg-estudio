import { ArrowRight, Clock } from "lucide-react";
import { Price } from "@/components/ui/price";
import { formatDuration } from "@/lib/format";
import { IncludeIcon } from "./include-icon";
import type { PublicService } from "@/server/services/catalog";

export function StepService({ services, onSelect }: { services: PublicService[]; onSelect: (s: PublicService) => void }) {
  if (services.length === 0) {
    return <p className="text-muted">Por el momento no hay servicios disponibles para reservar online.</p>;
  }

  return (
    <ul className="flex flex-col gap-4">
      {services.map((s) => (
        <li key={s.id}>
          <button
            type="button"
            onClick={() => onSelect(s)}
            className="card-glow group relative flex w-full flex-col gap-5 overflow-hidden rounded-sm border border-ink/10 bg-gradient-to-b from-ink/[0.06] to-ink/[0.015] p-5 text-left shadow-[inset_0_1px_0_rgb(243_234_224/0.06)] transition duration-300 hover:-translate-y-0.5 hover:border-ink/30 active:translate-y-0 active:bg-ink/[0.06] sm:p-6"
          >
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="min-w-0 text-[1.35rem] font-medium leading-tight tracking-tight">{s.name}</h3>
              <Price amount={s.priceArs} className="text-[1.6rem] leading-none text-ink" />
            </div>

            <p className="-mt-1 text-[0.95rem] leading-relaxed text-ink-soft">{s.description}</p>

            {s.includes.length > 0 && (
              <div>
                <p className="label-wide mb-3 text-muted">Incluye:</p>
                <ul aria-label="Incluye" className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                  {s.includes.map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-ink-soft">
                      <IncludeIcon item={item} className="size-4 shrink-0 text-ink" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-ink/10 pt-4">
              <span className="inline-flex items-center gap-2 text-sm text-ink-soft">
                <Clock aria-hidden className="size-4" strokeWidth={1.5} />
                {formatDuration(s.durationMinutes)}
              </span>
              <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-ink">
                Elegir
                <span className="flex size-8 items-center justify-center rounded-sm border border-ink/25 transition duration-300 group-hover:translate-x-0.5 group-hover:border-ink group-hover:bg-ink group-hover:text-cream">
                  <ArrowRight aria-hidden className="size-4" strokeWidth={1.5} />
                </span>
              </span>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
