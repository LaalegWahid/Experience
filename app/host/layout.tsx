import Link from "next/link";
import Image from "next/image";
import { requireHostUser } from "@/lib/host";
import { UserMenu } from "@/components/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { HostSidebar } from "@/components/host-sidebar";
import { gathraLogo } from "@/shared/brand";

// Guards every /host route: only signed-in hosts (or admins) get past here.
// Non-hosts are redirected by `requireHostUser` before any host UI renders.
export default async function HostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireHostUser();

  return (
    <div className="flex min-h-full flex-col bg-linear-to-br from-white via-[#fffaf5] to-[#fff2e9] dark:from-[#14120f] dark:via-[#171310] dark:to-[#1a1511]">
      <header className="sticky top-0 z-50 border-b border-nav-border/70 bg-nav-surface/80 backdrop-blur-md">
        <div className="mx-auto flex h-20 w-full max-w-[1920px] items-center justify-between px-6 lg:px-10 xl:px-20">
          <Link href="/" className="flex items-center" aria-label="Gathra">
            <Image
              src={gathraLogo}
              alt="Gathra"
              priority
              className="h-8 w-auto sm:h-10"
            />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserMenu name={user.name} role={user.role} />
          </div>
        </div>
      </header>

      {/* Studio shell: a sticky left nav rail + the page content. Pages frame
          their own content (see HostPage): title left, content centered. */}
      <div className="mx-auto flex w-full max-w-[1920px] flex-1 gap-8 px-6 lg:gap-12 lg:px-10 xl:px-20">
        <HostSidebar />
        <main className="min-w-0 flex-1 py-8 sm:py-10">{children}</main>
      </div>
    </div>
  );
}
