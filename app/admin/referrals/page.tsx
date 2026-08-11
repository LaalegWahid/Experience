import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query";
import { adminKeys } from "@/lib/admin-query-keys";
import { AdminPage } from "@/components/admin/admin-page";
import { fetchAdminReferrals } from "../queries";
import { ReferralsTable } from "./referrals-table";

export default async function AdminReferralsPage() {
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: adminKeys.referrals,
    queryFn: fetchAdminReferrals,
  });

  return (
    <AdminPage
      title="Referrals"
      description="Referral commissions owed to referrers. Review payout details and mark commissions paid."
    >
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ReferralsTable />
      </HydrationBoundary>
    </AdminPage>
  );
}
