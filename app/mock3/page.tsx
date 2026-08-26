import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/seo";
import { Mock3Client } from "./_components/mock3-client";

export const metadata: Metadata = {
  title: `Offer Your Service on ${SITE_NAME}`,
  description: "Gathra service provider landing page mockup",
  robots: { index: false, follow: false },
};

export default function Mock3Page() {
  return <Mock3Client />;
}
