import { BookingWizard } from "@/components/booking/wizard";
import { getActiveServices, getPublicInfo } from "@/server/services/catalog";

export default async function HomePage() {
  const [services, info] = await Promise.all([getActiveServices(), getPublicInfo()]);

  return (
    <section id="reservar" className="section-enter mx-auto w-full max-w-xl scroll-mt-4 px-4 pb-24 pt-12">
      <BookingWizard services={services} info={info} />
    </section>
  );
}
