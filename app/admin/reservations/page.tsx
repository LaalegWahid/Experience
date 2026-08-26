import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query";
import { adminKeys } from "@/lib/admin-query-keys";
import { AdminPage } from "@/components/admin/admin-page";
import { fetchAdminReservations } from "../queries";
import { ReservationsTable } from "./reservations-table";

export default async function AdminReservationsPage() {
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: adminKeys.reservations,
    queryFn: fetchAdminReservations,
  });

  return (
    <AdminPage
      title="Reservations"
      description="Search, filter by status or host payout, and mark payouts paid."
    >
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ReservationsTable />
      </HydrationBoundary>
    </AdminPage>
  );
}
