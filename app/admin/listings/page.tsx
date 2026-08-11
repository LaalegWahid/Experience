import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query";
import { adminKeys } from "@/lib/admin-query-keys";
import { AdminPage } from "@/components/admin/admin-page";
import { fetchAdminListings } from "../queries";
import { ListingsTable } from "./listings-table";

export default async function AdminListingsPage() {
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: adminKeys.listings,
    queryFn: fetchAdminListings,
  });

  return (
    <AdminPage
      title="Listings"
      description="Search, filter by status, and manage every host's listings."
    >
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ListingsTable />
      </HydrationBoundary>
    </AdminPage>
  );
}
