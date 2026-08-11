import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { getSessionUser } from "@/lib/host";
import { SITE_NAME, ldJson, organizationLd, websiteLd } from "@/lib/seo";
import { Mock1Client } from "./mock1/_components/mock1-client";
import { Mock2Client } from "./mock2/_components/mock2-client";

const PAGE_PATH = "/";

// Hosts and admins land on the provider-facing homepage (choose a service or
// experience path); everyone else sees the guest-facing "host an experience"
// pitch. getSessionUser is request-cached, so this and the <Navbar> below
// share a single session lookup instead of each fetching it separately.
async function isHostOrAdmin(): Promise<boolean> {
  const user = await getSessionUser();
  const role = user?.role ?? "guest";
  return role === "host" || role === "admin";
}

export async function generateMetadata(): Promise<Metadata> {
  const forProvider = await isHostOrAdmin();
  const title = forProvider
    ? `${SITE_NAME} | Turn What You Do Into Something People Can Book`
    : `Host an Experience on ${SITE_NAME}`;
  const description = forProvider
    ? "Offer a service or host an experience on Gathra."
    : "Do what you love and get paid for it. Create a one-of-a-kind experience for guests across your city on Gathra.";

  return {
    title,
    description,
    alternates: { canonical: PAGE_PATH },
    openGraph: { type: "website", title, description, url: PAGE_PATH },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function HomePage() {
  const forProvider = await isHostOrAdmin();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={ldJson(websiteLd())}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={ldJson(organizationLd())}
      />

      <Navbar showMarketplace narrow />
      {forProvider ? <Mock2Client /> : <Mock1Client />}
    </>
  );
}
