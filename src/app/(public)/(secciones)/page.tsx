import { BookingWizard } from "@/components/booking/wizard";
import { getActiveServices, getPublicInfo } from "@/server/services/catalog";
import { getPublicTeam } from "@/server/services/team";

export default async function HomePage() {
  const [services, info, team] = await Promise.all([getActiveServices(), getPublicInfo(), getPublicTeam()]);

  return (
    <section id="reservar" className="section-enter mx-auto w-full max-w-xl scroll-mt-4 px-4 pb-24 pt-12">
      <BookingWizard services={services} info={info} team={team} />
    </section>
  );
}
