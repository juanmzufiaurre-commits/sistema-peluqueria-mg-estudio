import { ArrowRight, Clock } from "lucide-react";
import { Price } from "@/components/ui/price";
import { formatDuration } from "@/lib/format";
import type { PublicService } from "@/server/services/catalog";

export function StepService({ services, onSelect }: { services: PublicService[]; onSelect: (s: PublicService) => void }) {
  if (services.length === 0) {
    return <p className="text-muted">Por el momento no hay servicios disponibles para reservar online.</p>;
  }

  return (
    <ul className="flex flex-col gap-4">
      {services.map((s, i) => (
        <li key={s.id}>
          <button
            type="button"
            onClick={() => onSelect(s)}
            className="card-glow group relative flex w-full flex-col gap-5 overflow-hidden rounded-2xl border border-ink/10 bg-gradient-to-b from-ink/[0.06] to-ink/[0.015] p-5 text-left shadow-[inset_0_1px_0_rgb(243_234_224/0.06)] transition duration-300 hover:-translate-y-0.5 hover:border-ink/30 active:translate-y-0 active:bg-ink/[0.06] sm:p-6"
          >
            <div className="flex items-end justify-between gap-4">
              <div className="min-w-0">
                <span className="text-[0.65rem] font-medium tabular-nums tracking-[0.3em] text-muted">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-1 text-[1.35rem] font-medium leading-tight tracking-tight">{s.name}</h3>
              </div>
              <Price amount={s.priceArs} className="text-[1.6rem] leading-none text-ink" />
            </div>

            <p className="-mt-1 text-[0.95rem] leading-relaxed text-ink-soft">{s.description}</p>

            {s.includes.length > 0 && (
              <ul aria-label="Incluye" className="flex flex-wrap gap-1.5">
                {s.includes.map((item) => (
                  <li key={item} className="rounded-full border border-ink/10 bg-ink/[0.04] px-3 py-1 text-xs text-ink-soft">
                    {item}
                  </li>
                ))}
              </ul>
            )}

            <div className="flex items-center justify-between border-t border-ink/10 pt-4">
              <span className="inline-flex items-center gap-2 text-sm text-ink-soft">
                <Clock aria-hidden className="size-4" strokeWidth={1.5} />
                {formatDuration(s.durationMinutes)}
              </span>
              <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-ink">
                Elegir
                <span className="flex size-8 items-center justify-center rounded-full border border-ink/25 transition duration-300 group-hover:translate-x-0.5 group-hover:border-ink group-hover:bg-ink group-hover:text-cream">
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
