import { Clock } from "lucide-react";
import { formatArs, formatDuration } from "@/lib/format";
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
            className="group flex w-full flex-col gap-4 rounded-sm border border-line bg-surface p-5 text-left transition-colors hover:border-ink active:bg-cream-deep"
          >
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="font-display text-2xl font-semibold leading-tight">{s.name}</h3>
              <span className="font-display text-xl">{formatArs(s.priceArs)}</span>
            </div>
            <p className="text-sm text-ink-soft">{s.description}</p>
            <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs uppercase tracking-[0.15em] text-muted">
              {s.includes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="flex items-center gap-2 text-sm">
              <Clock aria-hidden className="size-4" strokeWidth={1.5} />
              {formatDuration(s.durationMinutes)}
            </p>
          </button>
        </li>
      ))}
    </ul>
  );
}
