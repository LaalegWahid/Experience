"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ROLES } from "@/lib/roles";
import { adminKeys } from "@/lib/admin-query-keys";
import {
  AdminPagination,
  adminFilterInput,
} from "@/components/admin/admin-pagination";
import { fetchAdminUsers } from "../queries";
import { updateUserRole } from "../actions";

const PER_PAGE = 20;

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  /** ISO string — serialized for the client boundary. */
  createdAt: string;
};

/** Role picker + Save for one row. Posts to `updateUserRole`, then refreshes. */
function RoleForm({
  userId,
  currentRole,
  isSelf,
}: {
  userId: string;
  currentRole: string;
  isSelf: boolean;
}) {
  const queryClient = useQueryClient();
  const [role, setRole] = useState(currentRole);
  const mutation = useMutation({
    mutationFn: () => updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users });
      // The overview's user-by-role counts depend on this too.
      queryClient.invalidateQueries({ queryKey: adminKeys.overview });
    },
  });

  return (
    <div className="flex items-center gap-2">
      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        disabled={isSelf || mutation.isPending}
        className="rounded-lg border border-zinc-300 bg-transparent px-2 py-1.5 text-sm capitalize text-foreground outline-none focus:border-accent disabled:opacity-50 dark:border-zinc-700"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => mutation.mutate()}
        disabled={isSelf || mutation.isPending || role === currentRole}
        className="rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-background transition-colors hover:bg-zinc-700 disabled:opacity-40 dark:hover:bg-zinc-200"
      >
        {mutation.isPending ? "Saving…" : "Save"}
      </button>
      {isSelf && <span className="text-xs text-zinc-400">(you)</span>}
    </div>
  );
}

/**
 * Admin user list with an instant client-side filter (name/email search +
 * role). Data is hydrated from the server prefetch via TanStack Query; role
 * changes post to `updateUserRole` and invalidate the cached list.
 */
export function UsersTable({ adminId }: { adminId: string }) {
  const { data: users = [] } = useQuery({
    queryKey: adminKeys.users,
    queryFn: fetchAdminUsers,
  });

  const [query, setQuery] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      const matchesText =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q);
      const matchesRole = !role || u.role === role;
      return matchesText && matchesRole;
    });
  }, [users, query, role]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, pageCount);
  const paged = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  const inputClass = adminFilterInput;

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[14rem] flex-1">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name or email"
            aria-label="Search users"
            className={`${inputClass} w-full pl-9`}
          />
        </div>
        <select
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by role"
          className={`${inputClass} capitalize`}
        >
          <option value="">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        {filtered.length === users.length
          ? `${users.length} user${users.length === 1 ? "" : "s"}`
          : `${filtered.length} of ${users.length} users`}
      </p>

      <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900/50 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">
                Email
              </th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">
                Joined
              </th>
              <th className="px-4 py-3 font-medium">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/70">
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-10 text-center text-sm text-zinc-500 dark:text-zinc-400"
                >
                  No users match your search.
                </td>
              </tr>
            ) : (
              paged.map((u) => (
                <tr key={u.id} className="bg-background">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{u.name}</div>
                    <div className="text-xs text-zinc-500 sm:hidden dark:text-zinc-400">
                      {u.email}
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-zinc-600 sm:table-cell dark:text-zinc-400">
                    {u.email}
                  </td>
                  <td className="hidden px-4 py-3 text-zinc-500 md:table-cell dark:text-zinc-400">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <RoleForm
                      userId={u.id}
                      currentRole={u.role}
                      isSelf={u.id === adminId}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AdminPagination page={safePage} pageCount={pageCount} onPage={setPage} />
    </div>
  );
}
