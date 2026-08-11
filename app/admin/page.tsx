import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query";
import { adminKeys } from "@/lib/admin-query-keys";
import { fetchAdminOverview } from "./queries";
import { AdminOverview } from "./overview";

export default async function AdminOverviewPage() {
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: adminKeys.overview,
    queryFn: fetchAdminOverview,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AdminOverview />
    </HydrationBoundary>
  );
}
