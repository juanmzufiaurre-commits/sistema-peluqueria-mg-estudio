import Link from "next/link";
import { StaffCard } from "@/components/public/staff-card";
import { buttonVariants } from "@/components/ui/button";
import { getPublicTeam } from "@/server/services/team";

export const metadata = { title: "Profesionales — MG Estudio" };

export default async function ProfessionalsPage() {
  const team = await getPublicTeam();

  return (
    <section className="section-enter mx-auto w-full max-w-5xl px-4 pb-24 pt-12">
      <div className="mb-10 text-center">
        <h2 className="text-4xl font-medium tracking-tight">Nuestro equipo</h2>
        <p className="mt-3 text-ink-soft">Conocé a quienes van a cuidar tu estilo.</p>
      </div>

      {/* En el celular se desliza de costado; en pantallas grandes se ven los tres juntos. */}
      <ul className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-6 sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
        {team.map((s) => (
          <li key={s.id} className="w-[78%] shrink-0 snap-center sm:w-auto">
            <StaffCard staff={s} />
          </li>
        ))}
      </ul>
      {team.length > 1 && <p className="mt-4 text-center text-sm text-muted sm:hidden">Deslizá para ver a todo el equipo</p>}

      <div className="mt-14 flex justify-center">
        <Link href="/" className={buttonVariants({ size: "lg" })}>
          Agendar turno
        </Link>
      </div>
    </section>
  );
}
