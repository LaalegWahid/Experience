"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { gathraLogo } from "@/shared/brand";

/**
 * Admin header logo that acts as an "up one level" link: from the admin root it
 * exits to the site home, from any sub-route it returns to the admin dashboard.
 */
export function AdminLogoLink() {
  const pathname = usePathname();
  const href = pathname === "/admin" ? "/" : "/admin";

  return (
    <Link
      href={href}
      className="flex items-center gap-2 font-semibold tracking-tight"
    >
      <Image
        src={gathraLogo}
        alt="Gathra"
        priority
        className="h-8 w-auto sm:h-10"
      />
    </Link>
  );
}
