import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { SITE_NAME } from "@/lib/seo";
import { Mock2Client } from "./_components/mock2-client";

export const metadata: Metadata = {
  title: `${SITE_NAME} | Turn What You Do Into Something People Can Book`,
  description: "Gathra provider homepage mockup",
  robots: { index: false, follow: false },
};

export default function Mock2Page() {
  return (
    <>
      <Navbar showMarketplace narrow />
      <Mock2Client />
    </>
  );
}
