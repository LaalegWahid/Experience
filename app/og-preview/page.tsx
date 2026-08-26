import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";

// Dev-only visual check for the generated Open Graph images. Next.js
// auto-serves each opengraph-image.tsx at its route's /opengraph-image path,
// so these <img> tags always reflect the live source — no separate render step.
export const metadata: Metadata = {
  title: "OG image preview",
  robots: { index: false, follow: false },
};

const IMAGES = [
  { label: "Home / platform default", src: "/opengraph-image" },
  { label: "Services", src: "/services/opengraph-image" },
];

export default function OgPreviewPage() {
  return (
    <>
      <Navbar />

      <main className="flex-1">
        <section className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-4 py-16 sm:px-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              OG image preview
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Renders each route's generated social share image at its real size (1200×630). Add
              <code className="mx-1 rounded bg-zinc-100 px-1.5 py-0.5 text-sm dark:bg-zinc-800">
                ?v=2
              </code>
              to a URL below to bypass caching after an edit.
            </p>
          </div>

          {IMAGES.map(({ label, src }) => (
            <figure key={src} className="flex flex-col gap-3">
              <figcaption className="flex items-baseline justify-between gap-4">
                <span className="text-lg font-medium text-foreground">{label}</span>
                <a
                  href={src}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-accent hover:underline"
                >
                  {src}
                </a>
              </figcaption>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={label}
                width={1200}
                height={630}
                className="w-full rounded-xl border border-nav-border"
              />
            </figure>
          ))}
        </section>
      </main>
    </>
  );
}
