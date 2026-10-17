"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Agenda" },
  { href: "/admin/servicios", label: "Servicios" },
  { href: "/admin/equipo", label: "Equipo" },
  { href: "/admin/catalogo", label: "Catálogo" },
  { href: "/admin/configuracion", label: "Configuración" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Secciones" className="flex gap-1">
      {LINKS.map((l) => {
        const active = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={cn("rounded-sm px-3 py-2 text-xs uppercase tracking-[0.15em] transition-colors", active ? "bg-ink text-cream" : "hover:bg-cream-deep")}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
