import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query";
import { requireAdmin } from "@/lib/admin";
import { adminKeys } from "@/lib/admin-query-keys";
import { AdminPage } from "@/components/admin/admin-page";
import { fetchAdminUsers } from "../queries";
import { UsersTable } from "./users-table";

export default async function AdminUsersPage() {
  const admin = await requireAdmin();

  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: adminKeys.users,
    queryFn: fetchAdminUsers,
  });

  return (
    <AdminPage
      title="Users"
      description="Search, filter by role, and change a user's role."
    >
      <HydrationBoundary state={dehydrate(queryClient)}>
        <UsersTable adminId={admin.id} />
      </HydrationBoundary>
    </AdminPage>
  );
}
