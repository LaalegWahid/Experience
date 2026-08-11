import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query";
import { adminKeys } from "@/lib/admin-query-keys";
import { AdminPage } from "@/components/admin/admin-page";
import { fetchAdminReports } from "../queries";
import { ReportsList } from "./reports-list";

export default async function AdminReportsPage() {
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: adminKeys.reports,
    queryFn: fetchAdminReports,
  });

  return (
    <AdminPage
      title="Reports"
      description="Search and filter guest reports, then moderate each one."
    >
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ReportsList />
      </HydrationBoundary>
    </AdminPage>
  );
}
