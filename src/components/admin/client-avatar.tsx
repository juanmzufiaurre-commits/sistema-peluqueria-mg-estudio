import { cn } from "@/lib/utils";

/** Círculo con las iniciales del cliente (no guardamos fotos de los clientes). */
export function ClientAvatar({ firstName, lastName, size = "md" }: { firstName: string; lastName: string | null; size?: "md" | "lg" }) {
  const initials = `${firstName.charAt(0)}${lastName?.charAt(0) ?? ""}`.toUpperCase();
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border border-ink/15 bg-ink/[0.05] font-display font-semibold text-ink",
        size === "md" ? "size-11 text-base" : "size-16 text-2xl",
      )}
    >
      {initials}
    </span>
  );
}
