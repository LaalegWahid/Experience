import type { Metadata } from "next";
import { headers } from "next/headers";
import { League_Spartan, Montserrat, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthModalProvider } from "@/components/auth-modal-provider";
import { QueryProvider } from "@/components/query-provider";
import { LanguageProvider } from "@/components/language-provider";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { auth } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { tryCatch } from "@/shared/utils/TryCatch";
import { env } from "@/shared/utils/env";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  ldJson,
  organizationLd,
  websiteLd,
} from "@/lib/seo";

// Primary typeface — headlines and display type.
const leagueSpartan = League_Spartan({
  variable: "--font-league-spartan",
  subsets: ["latin"],
});

// Secondary typeface — body copy and UI text.
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} · Book local services & experiences`,
    // Page titles render as "Page · Gathra".
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "local services",
    "local experiences",
    "book a service",
    "marketplace",
    "experiences near me",
    "hosts",
    SITE_NAME,
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} · Book local services & experiences`,
    description: SITE_DESCRIPTION,
    url: "/",
    // OG image is provided automatically by app/opengraph-image.tsx.
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} · Book local services & experiences`,
    description: SITE_DESCRIPTION,
    // Twitter image is provided automatically by app/twitter-image.tsx.
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: { icon: "/icon.png", apple: "/icon.png" },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  // For the phone bottom bar: a logged-out user gets a "Sign in" action instead
  // of a Profile link. Resilient to the auth call failing.
  const sessionResult = await tryCatch(
    auth.api.getSession({ headers: await headers() }),
  );
  const isAuthenticated = Boolean(sessionResult.ok && sessionResult.data?.user);

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${leagueSpartan.variable} ${montserrat.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* Bottom padding on phones so content clears the fixed mobile bar. */}
      <body className="flex min-h-full flex-col pb-16 sm:pb-0">
        {/* Platform-wide structured data for search engines. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={ldJson(organizationLd())}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={ldJson(websiteLd())}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider locale={locale}>
            <QueryProvider>
              <AuthModalProvider bypassOtp={!env.RESEND_ENABLED}>
                {children}
                <MobileBottomNav isAuthenticated={isAuthenticated} />
              </AuthModalProvider>
            </QueryProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
