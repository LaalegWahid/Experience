import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { SITE_NAME } from "@/lib/seo";
import { Mock1Client } from "./_components/mock1-client";

export const metadata: Metadata = {
  title: `Host an Experience on ${SITE_NAME}`,
  description: "Gathra experience host landing page mockup",
  robots: { index: false, follow: false },
};

export default function Mock1Page() {
  return (
    <>
      <Navbar showMarketplace narrow />
      <Mock1Client />
    </>
  );
}
