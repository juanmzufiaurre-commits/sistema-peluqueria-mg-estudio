import { formatArs, formatArsAmount } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Precio con el "$" chico y alineado arriba, y cifras de ancho fijo para que no "bailen". */
export function Price({ amount, className }: { amount: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-start gap-[0.12em] whitespace-nowrap font-medium tabular-nums tracking-tight", className)}>
      <span className="sr-only">{formatArs(amount)}</span>
      <span aria-hidden className="mt-[0.18em] text-[0.58em] font-normal text-ink-soft">
        $
      </span>
      <span aria-hidden>{formatArsAmount(amount)}</span>
    </span>
  );
}
