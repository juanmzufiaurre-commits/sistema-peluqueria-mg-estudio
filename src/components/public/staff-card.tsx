import { BadgeCheck } from "lucide-react";
import { InstagramIcon } from "@/components/ui/instagram-icon";
import { cloudinaryPortrait } from "@/lib/cloudinary-url";
import type { PublicStaff } from "@/server/services/team";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

/** Tarjeta de un profesional: retrato con su nombre encima, Instagram y certificado debajo. */
export function StaffCard({ staff }: { staff: PublicStaff }) {
  return (
    <article className="group flex flex-col gap-4">
      <div className="relative aspect-[3/4] overflow-hidden rounded-sm border border-line bg-cream-deep">
        {staff.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- retrato ya optimizado por Cloudinary
          <img
            src={cloudinaryPortrait(staff.photoUrl, 600)}
            alt={`Foto de ${staff.name}`}
            loading="lazy"
            className="size-full object-cover grayscale-[35%] transition duration-700 group-hover:scale-[1.03] group-hover:grayscale-0"
          />
        ) : (
          <div aria-hidden className="flex size-full items-center justify-center bg-[radial-gradient(circle_at_50%_35%,rgb(243_234_224/0.08),transparent_65%)]">
            <span className="font-display text-7xl font-semibold text-ink/25">{initials(staff.name)}</span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-5 pb-5 pt-20">
          <h3 className="text-2xl font-medium leading-tight tracking-tight text-ink">{staff.name}</h3>
          {staff.role && <p className="label-wide mt-2 text-ink-soft">{staff.role}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-3 px-1">
        {staff.instagram && (
          <a
            href={`https://instagram.com/${staff.instagram}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center gap-2 text-sm text-ink-soft underline-offset-4 transition-colors hover:text-ink hover:underline"
          >
            <InstagramIcon className="size-4" />@{staff.instagram}
          </a>
        )}
        {staff.certificates.length > 0 && (
          <ul aria-label="Certificados" className="flex flex-col gap-2">
            {staff.certificates.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <BadgeCheck aria-hidden strokeWidth={1.5} className="mt-0.5 size-4 shrink-0 text-ink" />
                <span>
                  <span className="block text-ink-soft">{c.name}</span>
                  {c.academy && <span className="block text-xs text-muted">{c.academy}</span>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
