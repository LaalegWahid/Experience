import { requireProvider } from "@/lib/host";
import {
  getProviderBookings,
  markPastBookingsExecuted,
} from "@/lib/bookings";
import { tryCatch } from "@/shared/utils/TryCatch";
import { HostCalendar } from "@/components/host-calendar";
import { HostPage } from "@/components/host-page";

export default async function HostCalendarPage() {
  const { provider } = await requireProvider();
  await tryCatch(markPastBookingsExecuted());

  const bookings = await getProviderBookings(provider.id);
  const events = bookings.map((b) => ({
    id: b.id,
    title: b.offeringTitle,
    guestName: b.guestName,
    offeringId: b.offeringId,
    at: b.appointmentAt.toISOString(),
    status: b.status,
    priceCents: b.priceCents,
    currency: b.currency,
  }));

  return (
    <HostPage
      title="Calendar"
      description="All your appointments across every service, in one place."
    >
      <HostCalendar events={events} />
    </HostPage>
  );
}
