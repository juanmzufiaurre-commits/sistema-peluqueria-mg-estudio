"use client";

import { Sparkles, UserRound } from "lucide-react";
import { cloudinaryThumb } from "@/lib/cloudinary-url";
import { cn } from "@/lib/utils";
import type { PublicStaff } from "@/server/services/team";

interface Props {
  team: PublicStaff[];
  /** Profesionales libres en el horario elegido. */
  available: string[];
  /** null = sin preferencia (el primero libre). */
  value: string | null;
  onChange: (staffId: string | null) => void;
}

/** "¿Con quién?": sin preferencia o un profesional libre en ese horario. Los ocupados se ven apagados. */
export function StaffPicker({ team, available, value, onChange }: Props) {
  if (team.length <= 1) return null; // con un solo profesional no hay nada que elegir

  return (
    <div>
      <p className="label-wide mb-3 text-ink-soft">¿Con quién?</p>
      <div role="radiogroup" aria-label="Profesional" className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Option selected={value === null} onClick={() => onChange(null)} label="Sin preferencia" hint="El primero libre">
          <Sparkles aria-hidden strokeWidth={1.4} className="size-5" />
        </Option>
        {team.map((s) => {
          const free = available.includes(s.id);
          return (
            <Option key={s.id} selected={value === s.id} disabled={!free} onClick={() => onChange(s.id)} label={s.name.split(" ")[0]} hint={free ? (s.role ?? "Libre") : "Ocupado"}>
              {s.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- miniatura ya optimizada por Cloudinary
                <img src={cloudinaryThumb(s.photoUrl, 96)} alt="" className="size-full object-cover" />
              ) : (
                <UserRound aria-hidden strokeWidth={1.3} className="size-5" />
              )}
            </Option>
          );
        })}
      </div>
    </div>
  );
}

function Option({
  selected,
  disabled = false,
  onClick,
  label,
  hint,
  children,
}: {
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={`${label}${disabled ? " (ocupado en este horario)" : ""}`}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex w-24 shrink-0 snap-start flex-col items-center gap-2 rounded-sm border px-2 py-3 text-center transition-all duration-300",
        selected ? "border-ink bg-ink/[0.08] shadow-[0_0_24px_-8px] shadow-ink/50" : "border-ink/10 bg-ink/[0.02] hover:border-ink/30",
        disabled && "cursor-not-allowed opacity-35 hover:border-ink/10",
      )}
    >
      <span className={cn("flex size-11 items-center justify-center overflow-hidden rounded-full border", selected ? "border-ink" : "border-ink/15")}>{children}</span>
      <span className="text-xs font-medium leading-tight">{label}</span>
      <span className={cn("text-[0.6rem] uppercase tracking-[0.12em]", disabled ? "text-st-cancelled" : "text-muted")}>{hint}</span>
    </button>
  );
}
