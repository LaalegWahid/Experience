import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query";
import { adminKeys } from "@/lib/admin-query-keys";
import { AdminPage } from "@/components/admin/admin-page";
import { fetchAdminTransactions } from "../queries";
import { TransactionsTable } from "./transactions-table";

export default async function AdminTransactionsPage() {
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: adminKeys.transactions,
    queryFn: fetchAdminTransactions,
  });

  return (
    <AdminPage
      title="Transactions"
      description="Search and filter every card and crypto payment."
    >
      <HydrationBoundary state={dehydrate(queryClient)}>
        <TransactionsTable />
      </HydrationBoundary>
    </AdminPage>
  );
}
