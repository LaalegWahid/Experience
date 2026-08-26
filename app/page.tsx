import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { SITE_NAME, ldJson, organizationLd, websiteLd } from "@/lib/seo";
import { Mock1Client } from "./mock1/_components/mock1-client";

const PAGE_PATH = "/";

export const metadata: Metadata = {
  title: `Host an Experience on ${SITE_NAME}`,
  description:
    "Do what you love and get paid for it. Create a one-of-a-kind experience for guests across your city on Gathra.",
  alternates: { canonical: PAGE_PATH },
  openGraph: {
    type: "website",
    title: `Host an Experience on ${SITE_NAME}`,
    description:
      "Do what you love and get paid for it. Create a one-of-a-kind experience for guests across your city on Gathra.",
    url: PAGE_PATH,
  },
  twitter: {
    card: "summary_large_image",
    title: `Host an Experience on ${SITE_NAME}`,
    description:
      "Do what you love and get paid for it. Create a one-of-a-kind experience for guests across your city on Gathra.",
  },
};

export default function HomePage() {
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

      <Navbar showMarketplace />
      <Mock1Client />
    </>
  );
}
