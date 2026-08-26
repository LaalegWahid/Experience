import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { UserMenu } from "@/components/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { AdminLogoLink } from "@/components/admin/admin-logo-link";

// Guards every /admin route: only signed-in admins get past here.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-50 border-b border-zinc-200/70 bg-background/80 backdrop-blur-md dark:border-zinc-800/70">
        <div className="mx-auto flex h-20 w-full max-w-[1920px] items-center gap-4 px-6 lg:px-10 xl:px-20">
          <div className="shrink-0">
            <AdminLogoLink />
          </div>
          <nav className="scrollbar-none flex min-w-0 flex-1 items-center gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden">
            <Link
              href="/admin"
              className="shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:text-foreground dark:text-zinc-400"
            >
              Overview
            </Link>
            <Link
              href="/admin/users"
              className="shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:text-foreground dark:text-zinc-400"
            >
              Users
            </Link>
            <Link
              href="/admin/reservations"
              className="shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:text-foreground dark:text-zinc-400"
            >
              Reservations
            </Link>
            <Link
              href="/admin/listings"
              className="shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:text-foreground dark:text-zinc-400"
            >
              Listings
            </Link>
            <Link
              href="/admin/transactions"
              className="shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:text-foreground dark:text-zinc-400"
            >
              Transactions
            </Link>
            <Link
              href="/admin/referrals"
              className="shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:text-foreground dark:text-zinc-400"
            >
              Referrals
            </Link>
            <Link
              href="/admin/reports"
              className="shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:text-foreground dark:text-zinc-400"
            >
              Reports
            </Link>
            <Link
              href="/"
              className="shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:text-foreground dark:text-zinc-400"
            >
              View site
            </Link>
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <UserMenu name={admin.name} role={admin.role} />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1920px] flex-1 px-6 py-10 lg:px-10 xl:px-20">
        {children}
      </main>
    </div>
  );
}
