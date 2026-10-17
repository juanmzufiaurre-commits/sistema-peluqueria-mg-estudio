"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  /** modal = centrado; drawer = panel lateral derecho; plain = sin marco (lightbox) */
  variant?: "modal" | "drawer" | "plain";
  children: ReactNode;
}

/** Basado en <dialog> nativo: foco atrapado, Escape y fondo inerte sin librerías. */
export function Dialog({ open, onClose, title, variant = "modal", children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={cn(
        "bg-cream text-ink backdrop:bg-black/75 open:flex",
        variant === "modal" && "m-auto max-h-[90dvh] w-[min(92vw,34rem)] flex-col overflow-hidden rounded-sm",
        variant === "drawer" && "m-0 ml-auto h-dvh max-h-none w-[min(100vw,36rem)] flex-col",
        variant === "plain" && "m-auto max-h-[94dvh] max-w-[94vw] flex-col bg-transparent",
      )}
    >
      {open && (
        <>
          {variant !== "plain" && (
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <h2 className="text-2xl font-medium tracking-tight">{title}</h2>
              <button type="button" onClick={onClose} aria-label="Cerrar" className="flex size-10 items-center justify-center">
                <X className="size-5" />
              </button>
            </div>
          )}
          <div className={cn(variant !== "plain" && "overflow-y-auto p-6")}>{children}</div>
          {variant === "plain" && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="absolute right-2 top-2 flex size-10 items-center justify-center rounded-full bg-ink text-cream"
            >
              <X className="size-5" />
            </button>
          )}
        </>
      )}
    </dialog>
  );
}
