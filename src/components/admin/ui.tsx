import type { LucideIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

// Piezas comunes del panel: mismo lenguaje visual que la parte pública (sans, tarjetas con relieve).

/** Encabezado de cada sección: etiqueta chica, título y una línea que explica qué se hace acá. */
export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="label-wide mb-2 text-muted">{eyebrow}</p>}
        <h1 className="text-[2rem] font-medium leading-tight tracking-tight">{title}</h1>
        {description && <p className="mt-2 max-w-xl text-ink-soft">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

/** Tarjeta base del panel. */
export function Panel({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("surface-card p-5 sm:p-6", className)} {...props} />;
}

/** Título de un bloque dentro de una página o tarjeta, con ícono. */
export function PanelTitle({ icon: Icon, title, description, className }: { icon?: LucideIcon; title: string; description?: string; className?: string }) {
  return (
    <div className={cn("mb-5 flex items-start gap-3", className)}>
      {Icon && (
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border border-ink/15 bg-ink/[0.04]">
          <Icon aria-hidden strokeWidth={1.5} className="size-4 text-ink" />
        </span>
      )}
      <div>
        <h2 className="text-lg font-medium tracking-tight">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      </div>
    </div>
  );
}

/** Estado vacío amable: ícono, una frase y, si corresponde, qué hacer. */
export function EmptyState({ icon: Icon, title, text, action }: { icon: LucideIcon; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-sm border border-dashed border-ink/15 px-6 py-12 text-center">
      <Icon aria-hidden strokeWidth={1.3} className="size-8 text-ink-soft" />
      <p className="font-medium">{title}</p>
      {text && <p className="max-w-xs text-sm text-muted">{text}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/** Mensaje de resultado de un formulario (guardado / error). */
export function FormMessage({ msg }: { msg: { ok: boolean; text: string } | null }) {
  if (!msg) return null;
  return (
    <p role={msg.ok ? "status" : "alert"} className={cn("text-sm", msg.ok ? "text-st-confirmed" : "text-st-cancelled")}>
      {msg.text}
    </p>
  );
}
