import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { SITE_NAME } from "@/lib/seo";
import { Mock1Client } from "../../mock1/_components/mock1-client";
import { Mock2Client } from "../../mock2/_components/mock2-client";
import { Mock3Client } from "../../mock3/_components/mock3-client";

const VARIANTS = {
  "1": {
    Component: Mock1Client,
    title: `Host an Experience on ${SITE_NAME}`,
    description: "Gathra experience host landing page mockup",
    // Mock3Client still has its own inline marketing header.
    showNavbar: true,
  },
  "2": {
    Component: Mock2Client,
    title: `${SITE_NAME} | Turn What You Do Into Something People Can Book`,
    description: "Gathra provider homepage mockup",
    showNavbar: true,
  },
  "3": {
    Component: Mock3Client,
    title: `Offer Your Service on ${SITE_NAME}`,
    description: "Gathra service provider landing page mockup",
    showNavbar: false,
  },
} satisfies Record<
  string,
  {
    Component: () => React.JSX.Element;
    title: string;
    description: string;
    showNavbar: boolean;
  }
>;

type Variant = keyof typeof VARIANTS;

function getVariant(variant: string) {
  return Object.hasOwn(VARIANTS, variant) ? VARIANTS[variant as Variant] : null;
}

export async function generateMetadata(
  props: PageProps<"/mock/[variant]">,
): Promise<Metadata> {
  const { variant } = await props.params;
  const entry = getVariant(variant);
  if (!entry) return {};

  return {
    title: entry.title,
    description: entry.description,
    robots: { index: false, follow: false },
  };
}

export default async function MockVariantPage(
  props: PageProps<"/mock/[variant]">,
) {
  const { variant } = await props.params;
  const entry = getVariant(variant);
  if (!entry) notFound();

  const { Component, showNavbar } = entry;
  return (
    <>
      {showNavbar && <Navbar showMarketplace />}
      <Component />
    </>
  );
}
