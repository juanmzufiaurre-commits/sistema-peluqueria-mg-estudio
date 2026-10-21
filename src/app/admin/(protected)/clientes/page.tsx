import { CalendarClock, ChevronRight, HeartHandshake, MessageCircle, Search, Sparkles, UserPlus, Users, X, type LucideIcon } from "lucide-react";
import Form from "next/form";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ClientAvatar } from "@/components/admin/client-avatar";
import { EmptyState, PageHeader } from "@/components/admin/ui";
import { Price } from "@/components/ui/price";
import { formatAgo, formatLongDate, formatPhone, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { waComeBack, waGreeting, waLink } from "@/lib/wa-links";
import { getPublicInfo } from "@/server/services/catalog";
import { INACTIVE_DAYS, REGULAR_VISITS, isClientSort, type ClientSort } from "@/server/services/client-stats";
import { listClients } from "@/server/services/clients";
import type { ClientListRow } from "@/types/admin";

export const metadata = { title: "Clientes — MG Estudio" };

/** Tope de filas en pantalla: más que eso no se lee; para encontrar a alguien está el buscador. */
const MAX_ROWS = 200;

// En celular van los nombres cortos para que entren las cuatro pestañas sin desplazarse.
const SORTS: { key: ClientSort; label: string; short: string }[] = [
  { key: "recientes", label: "Recientes", short: "Recientes" },
  { key: "visitas", label: "Más visitas", short: "Visitas" },
  { key: "nombre", label: "A–Z", short: "A–Z" },
  { key: "recuperar", label: "Para recuperar", short: "Recuperar" },
];

export default function ClientsPage({ searchParams }: PageProps<"/admin/clientes">) {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Clientes · Base de datos"
        title="Tus clientes"
        description="Todos los que reservaron alguna vez: cómo contactarlos, cuántas veces vinieron, lo que gastaron y sus notas."
      />
      <Suspense fallback={<div className="h-96 animate-pulse rounded-sm bg-ink/[0.04]" />}>
        <Clients searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Clients({ searchParams }: { searchParams: PageProps<"/admin/clientes">["searchParams"] }) {
  await connection(); // "hace cuánto que no viene" depende de la fecha actual
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.slice(0, 80) : "";
  const sort: ClientSort = isClientSort(params.orden) ? params.orden : "recientes";
  const [{ summary, rows }, info] = await Promise.all([listClients(q, sort), getPublicInfo()]);
  const rebookUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const shown = rows.slice(0, MAX_ROWS);

  const hrefFor = (orden: ClientSort, query = q) => {
    const p = new URLSearchParams();
    if (query) p.set("q", query);
    if (orden !== "recientes") p.set("orden", orden);
    const s = p.toString();
    return s ? `/admin/clientes?${s}` : "/admin/clientes";
  };

  return (
    <>
      <dl className="-mt-2 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={Users} label="Clientes" value={summary.total} hint="En total" />
        <Stat icon={UserPlus} label="Nuevos" value={summary.newThisMonth} hint="Este mes" />
        <Stat icon={Sparkles} label="Habituales" value={summary.regulars} hint={`${REGULAR_VISITS} visitas o más`} />
        <Stat
          icon={HeartHandshake}
          label="Para recuperar"
          value={summary.inactive}
          hint={`Más de ${INACTIVE_DAYS} días sin venir`}
          href={hrefFor("recuperar")}
          highlight={summary.inactive > 0}
        />
      </dl>

      <section aria-label="Lista de clientes" className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Form action="/admin/clientes" className="relative flex w-full max-w-md items-center">
            {sort !== "recientes" && <input type="hidden" name="orden" value={sort} />}
            <Search aria-hidden className="pointer-events-none absolute left-4 size-4 text-muted" />
            <label htmlFor="client-search" className="sr-only">
              Buscar cliente
            </label>
            <input
              id="client-search"
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Buscar por nombre o teléfono"
              autoComplete="off"
              className="h-12 w-full rounded-sm border border-line bg-surface pl-11 pr-24 text-base text-ink placeholder:text-muted/70 focus-visible:border-ink"
            />
            <button type="submit" className="absolute right-1.5 h-9 rounded-sm bg-ink px-4 text-xs font-medium uppercase tracking-[0.12em] text-cream hover:bg-ink-soft">
              Buscar
            </button>
          </Form>

          <div role="tablist" aria-label="Ordenar" className="flex w-fit max-w-full rounded-full border border-ink/15 p-1">
            {SORTS.map((s) => (
              <Link
                key={s.key}
                href={hrefFor(s.key)}
                role="tab"
                aria-selected={sort === s.key}
                scroll={false}
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-1.5 text-xs uppercase tracking-[0.06em] transition-colors sm:px-3.5 sm:tracking-[0.12em]",
                  sort === s.key ? "bg-ink text-cream" : "text-ink-soft hover:text-ink",
                )}
              >
                <span className="sm:hidden">{s.short}</span>
                <span className="hidden sm:inline">{s.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 text-sm text-muted">
          <p>
            {rows.length === 1 ? "1 cliente" : `${rows.length} clientes`}
            {q && (
              <>
                {" "}
                para <strong className="font-medium text-ink">“{q}”</strong>
              </>
            )}
            {sort === "recuperar" && " que hace más de dos meses que no vienen"}
            {rows.length > MAX_ROWS && ` · mostrando los primeros ${MAX_ROWS}`}
          </p>
          {q && (
            <Link href={hrefFor(sort, "")} className="inline-flex items-center gap-1 text-ink-soft hover:text-ink">
              <X aria-hidden className="size-3.5" /> Limpiar búsqueda
            </Link>
          )}
        </div>

        {shown.length === 0 ? (
          <EmptyState
            icon={Users}
            title={q ? "No encontramos a nadie con esa búsqueda" : sort === "recuperar" ? "Nadie para recuperar" : "Todavía no hay clientes"}
            text={
              q
                ? "Probá con otra parte del nombre o con los últimos números del teléfono."
                : sort === "recuperar"
                  ? "Todos los clientes habituales vinieron en los últimos dos meses o ya tienen turno."
                  : "Cuando alguien reserve desde la página, aparece acá con todos sus datos."
            }
          />
        ) : (
          <ul className="surface-card divide-y divide-ink/5">
            {shown.map((c) => (
              <ClientRow
                key={c.id}
                c={c}
                waHref={waLink(c.phoneE164, c.inactive ? waComeBack(c.firstName, info.businessName, rebookUrl) : waGreeting(c.firstName, info.businessName))}
              />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function ClientRow({ c, waHref }: { c: ClientListRow; waHref: string }) {
  const name = [c.firstName, c.lastName].filter(Boolean).join(" ");
  const days = c.daysSinceLastVisit;
  return (
    <li className="group relative flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-ink/[0.03] sm:px-5">
      <ClientAvatar firstName={c.firstName} lastName={c.lastName} />
      <div className="min-w-0 flex-1">
        <Link href={`/admin/clientes/${c.id}`} className="block truncate font-medium after:absolute after:inset-0">
          {name}
        </Link>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
          <span className="tabular-nums">{formatPhone(c.phoneE164)}</span>
          <span>
            {c.visits === 0 ? "Sin visitas todavía" : c.visits === 1 ? "1 visita" : `${c.visits} visitas`}
            {days !== null && ` · última ${formatAgo(days)}`}
          </span>
          {c.noShows > 0 && <span className="text-st-noshow">{c.noShows === 1 ? "1 ausencia" : `${c.noShows} ausencias`}</span>}
        </p>
        {c.nextBookingAt && (
          <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-st-confirmed/10 px-2.5 py-0.5 text-xs text-st-confirmed">
            <CalendarClock aria-hidden className="size-3.5" />
            Próximo turno: {formatLongDate(c.nextBookingAt)}, {formatTime(c.nextBookingAt)} hs
          </p>
        )}
        {c.inactive && (
          <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-st-pending/10 px-2.5 py-0.5 text-xs text-st-pending">
            <HeartHandshake aria-hidden className="size-3.5" /> Para recuperar
          </p>
        )}
      </div>
      <div className="hidden shrink-0 text-right sm:block">
        <Price amount={c.spentArs} className="text-lg font-light" />
        <p className="text-xs text-muted">gastado</p>
      </div>
      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Escribirle a ${name} por WhatsApp`}
        title={c.inactive ? "Invitarlo a volver por WhatsApp" : "Escribirle por WhatsApp"}
        className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border border-ink/15 text-ink-soft transition-colors hover:border-ink hover:text-ink"
      >
        <MessageCircle aria-hidden className="size-4" />
      </a>
      <ChevronRight aria-hidden className="hidden size-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 sm:block" />
    </li>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
  href,
  highlight,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  hint: string;
  href?: string;
  highlight?: boolean;
}) {
  const body = (
    <>
      <dt className="flex items-center gap-2 text-sm text-ink-soft">
        <Icon aria-hidden strokeWidth={1.5} className={cn("size-4", highlight ? "text-st-pending" : "text-muted")} /> {label}
      </dt>
      <dd className={cn("mt-2 text-3xl font-light tabular-nums leading-none", highlight && "text-st-pending")}>{value}</dd>
      <dd className="mt-2 text-xs text-muted">{hint}</dd>
    </>
  );
  return href ? (
    <Link href={href} className="surface-card block p-4 transition-colors hover:border-ink/30">
      {body}
    </Link>
  ) : (
    <div className="surface-card p-4">{body}</div>
  );
}
