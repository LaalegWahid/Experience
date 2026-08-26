import { env } from "@/shared/utils/env";
import { gathraLogo } from "@/shared/brand";

// Single source of truth for SEO. Server-only — do not import into client
// components (it reads validated env). Use it in layouts, page metadata,
// sitemap/robots, and OG images.

const RAW_URL =
  env.NEXT_PUBLIC_SITE_URL ?? env.BETTER_AUTH_URL ?? "https://gathra.app";

/** Canonical origin with any trailing slash removed. */
export const SITE_URL = RAW_URL.replace(/\/+$/, "");

export const SITE_NAME = "Gathra";
export const SITE_TAGLINE = "Book local activities & services";
export const SITE_DESCRIPTION =
  "Gathra is the marketplace for booking local experiences and services: private chefs, yoga, tutoring, beauty, and home help. Discover trusted local pros, or host an experience and get paid for what you love.";

export const SITE_KEYWORDS = [
  "local experiences",
  "book local services",
  "things to do near me",
  "private chef",
  "yoga classes",
  "home services",
  "local marketplace",
  "become a host",
  "host an experience",
  "Gathra",
];

export const OG_LOCALE = "en_US";
export const TWITTER_HANDLE = "@gathra";

/** Build an absolute URL from a path (passes through absolute URLs). */
export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

// ── JSON-LD builders ────────────────────────────────────────────────────────

/** Organization schema for the whole platform. */
export function organizationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl(gathraLogo.src),
    description: SITE_DESCRIPTION,
  };
}

/** WebSite schema with a sitelinks search box pointed at the marketplace. */
export function websiteLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/services?where={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** BreadcrumbList from ordered [name, path] pairs. */
export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/** FAQPage from question/answer pairs. */
export function faqLd(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

/** Serialize a JSON-LD object for a <script type="application/ld+json"> tag. */
export function ldJson(data: object): { __html: string } {
  return { __html: JSON.stringify(data) };
}
