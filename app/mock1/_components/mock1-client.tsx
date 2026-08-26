"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { Poppins, Damion } from "next/font/google";
import {
  Heart,
  MapPin,
  Users,
  UserPlus,
  PenLine,
  CalendarCheck,
  Wallet,
  ShieldCheck,
  Star,
  Globe,
} from "lucide-react";
import { useAuthModal } from "@/components/auth-modal-provider";
import { cx } from "@/shared/utils/cx";
import styles from "../mock1.module.css";

// The hero headline in the reference design uses a rounded geometric
// sans (closest match: Poppins Bold/ExtraBold) instead of the site-wide
// League Spartan heading font — scoped to just the hero, not applied
// globally.
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["700", "800"],
  display: "swap",
});

// "For Guests" section heading uses Damion — scoped to just that
// section's kicker/title, not applied globally.
const damion = Damion({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});


// A curved, hand-drawn-style dashed connector arrow between flow steps —
// swoops up then down into a small chevron head, echoing the reference
// design's sketchy arc instead of a straight dashed line.
function FlowArrow({ color }: { color: string }) {
  return (
    <svg
      className={styles["flow-arrow"]}
      viewBox="0 0 90 34"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 24C24 2 70 20 78 24"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray="1 7"
      />
      <path
        d="M68 24.5 78 24 72 15.5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// A loose, hand-drawn-style wavy line for flanking section kickers —
// swaps the rigid straight divider for something that reads as sketched.
function WavyLine({ color, className }: { color: string; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 10"
      fill="none"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M2 5C22 -4 42 14 62 5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </svg>
  );
}

const HERO_POINT_COLORS = {
  orange: "#ff4f0a",
  teal: "#17a398",
  purple: "#8a7ff0",
} as const;

const HERO_POINTS = [
  {
    Icon: Users,
    color: "orange" as const,
    title: "Real people.",
    detail: "Real experiences.",
  },
  {
    Icon: MapPin,
    color: "teal" as const,
    title: "Local hosts.",
    detail: "Hidden gems.",
  },
  {
    Icon: Heart,
    color: "purple" as const,
    title: "Moments today.",
    detail: "Memories forever.",
  },
];

const GUEST_STEPS = [
  {
    title: "Discover",
    desc: "Explore experiences in your city or while you travel. Use filters to find the perfect vibe.",
    visual: (
      <img
        src="/Marketing_assets/discover.webp"
        alt="Gathra app showing nearby experiences to discover"
        className={styles["visual-image"]}
      />
    ),
  },
  {
    title: "Choose",
    desc: "Read details, see photos, check reviews and pick the experience that speaks to you.",
    visual: (
      <img
        src="/Marketing_assets/choose.PNG"
        alt="Sunset Kayak Tour listing card with rating and price"
        className={styles["visual-image"]}
      />
    ),
  },
  {
    title: "Book",
    desc: "Secure your spot in just a few clicks. Instant confirmation and all the details you need.",
    visual: (
      <img
        src="/Marketing_assets/book.PNG"
        alt="Booking confirmed card with date, time and guest count"
        className={styles["visual-image"]}
      />
    ),
  },
  {
    title: "Experience & Remember",
    desc: "Show up, have an amazing time and create memories that last a lifetime.",
    visual: (
      <img
        src="/Marketing_assets/remember.PNG"
        alt="Friends sharing a meal together with the quote 'The best memories are the ones you live.'"
        className={styles["visual-image"]}
      />
    ),
  },
];

const HOST_STEPS = [
  {
    Icon: UserPlus,
    title: "Sign Up",
    desc: "Create your host account in minutes. It's free!",
  },
  {
    Icon: PenLine,
    title: "Create Your Experience",
    desc: "Add details, photos, pricing and what makes your experience special.",
  },
  {
    Icon: CalendarCheck,
    title: "Get Booked",
    desc: "When someone books, you'll get notified. Manage everything in your dashboard.",
  },
  {
    Icon: Users,
    title: "Host & Inspire",
    desc: "Deliver an amazing experience and build 5-star reviews.",
  },
  {
    Icon: Wallet,
    title: "Get Paid",
    desc: "Earn securely and grow your impact in your community.",
  },
];

const TRUST_BADGES = [
  {
    Icon: ShieldCheck,
    title: "Safe & Trusted",
    desc: "Verified hosts, secure payments and 24/7 support.",
  },
  {
    Icon: Star,
    title: "Quality Matters",
    desc: "We promote great hosts and unforgettable experiences.",
  },
  {
    Icon: Users,
    title: "Community First",
    desc: "We're building stronger, more connected communities.",
  },
  {
    Icon: Globe,
    title: "Local Everywhere",
    desc: "From Orlando to the world. More cities coming soon!",
  },
];

const FOOTER_COLUMNS = [
  {
    heading: "Explore",
    links: [
      { label: "All Experiences", href: "/services" },
      { label: "Experiences in Orlando", href: "/services" },
      { label: "Categories", href: "/services" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About Us", href: "#top" },
      { label: "How It Works", href: "#for-guests" },
      { label: "Careers", href: "#top" },
      { label: "FAQs", href: "#top" },
    ],
  },
  {
    heading: "For Hosts",
    links: [
      { label: "Why Host?", href: "#for-hosts" },
      { label: "Host Resources", href: "#for-hosts" },
      { label: "Become a Host", href: "#for-hosts" },
    ],
  },
  {
    heading: "Support",
    links: [
      { label: "Help Center", href: "#top" },
      { label: "Safety", href: "#top" },
      { label: "Terms & Privacy", href: "#top" },
    ],
  },
];

const SOCIAL_LINKS = [
  {
    label: "Instagram",
    href: "https://instagram.com",
    path: "M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm5 5.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Zm0 2a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM17.8 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z",
    background:
      "radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285aeb 90%)",
  },
  {
    label: "Facebook",
    href: "https://facebook.com",
    path: "M13.5 21v-7.5H16l.5-3.2h-3V8.2c0-.93.26-1.56 1.6-1.56H16.6V3.8A21.7 21.7 0 0 0 14.2 3.7c-2.3 0-3.9 1.4-3.9 4V10.3H7.8v3.2h2.5V21h3.2Z",
    background: "#1877f2",
  },
  {
    label: "TikTok",
    href: "https://tiktok.com",
    path: "M14.5 3h2.3c.15 1.3 1.05 2.55 2.35 3.05 0 0 1.05.45 1.7.5v2.3c-1.1 0-2.2-.35-3.1-.95v6.35c0 3.1-2.55 5.65-5.7 5.65S6.4 17.35 6.4 14.25c0-2.75 1.95-5.05 4.55-5.55v2.4c-1.25.4-2.15 1.55-2.15 2.9 0 1.7 1.4 3.1 3.1 3.1s3.15-1.4 3.15-3.1V3Z",
    background: "#000000",
  },
  {
    label: "YouTube",
    href: "https://youtube.com",
    path: "M21.6 7.6a3 3 0 0 0-2.1-2.1C17.7 5 12 5 12 5s-5.7 0-7.5.5A3 3 0 0 0 2.4 7.6 31 31 0 0 0 2 12a31 31 0 0 0 .4 4.4 3 3 0 0 0 2.1 2.1C6.3 19 12 19 12 19s5.7 0 7.5-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 22 12a31 31 0 0 0-.4-4.4ZM10 15.2V8.8l5.5 3.2-5.5 3.2Z",
    background: "#ff0000",
  },
];

export function Mock1Client() {
  const { openAuth } = useAuthModal();

  return (
    <div className={styles.root}>
      <main id="top">
        <section className={styles.hero}>
          <div className={styles["hero-grid"]}>
            <div className={styles["hero-copy"]}>
              <span className={cx(styles.kicker, poppins.className)}>
                How it works
              </span>
              <h1 className={poppins.className}>
                Experience more.
                <br />
                It&rsquo;s easy with Gathra.{" "}
                <img
                  src="/Marketing_assets/heart%20Sketch.svg"
                  alt=""
                  className={styles["heart-accent"]}
                  aria-hidden="true"
                />
              </h1>
              <p className={styles["hero-lede"]}>
                Gathra connects you with amazing local experiences and the
                people who make them unforgettable.
              </p>
              <div className={styles["hero-points"]} aria-label="Why Gathra">
                {HERO_POINTS.map(({ Icon, color, title, detail }) => (
                  <div key={title}>
                    <span
                      className={cx(
                        styles["point-icon"],
                        styles[`point-icon-${color}`],
                      )}
                      aria-hidden="true"
                    >
                      <Icon
                        size={34}
                        strokeWidth={1.75}
                        color={HERO_POINT_COLORS[color]}
                      />
                    </span>
                    <div>
                      <strong>{title}</strong>
                      <span>{detail}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles["hero-visual"]}>
              <img
                src="/Marketing_assets/hero-tour.jpg"
                alt="Friends taking a selfie together during a Gathra experience"
              />
            </div>
          </div>
        </section>

        <section
          className={cx(styles.section, styles["guests-section"])}
          id="for-guests"
        >
          <div className={styles.container}>
            <div className={cx(styles["section-heading"], styles.centered)}>
              <div className={styles["kicker-row"]}>
                <WavyLine color="#2ec4b6" className={styles["kicker-line"]} />
                <span className={cx(styles["script-kicker"], damion.className)}>
                  For Guests
                </span>
                <WavyLine color="#2ec4b6" className={styles["kicker-line"]} />
              </div>
              <h2>Find. Book. Experience. Remember.</h2>
            </div>

            <div className={styles["flow-steps"]}>
              {GUEST_STEPS.map((step, index) => (
                <div key={step.title} className={styles["flow-step"]}>
                  {index > 0 && <FlowArrow color="#2ec4b6" />}
                  <span
                    className={cx(
                      styles["step-circle"],
                      styles["step-circle-green"],
                    )}
                  >
                    {index + 1}
                  </span>
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                  {step.visual}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          className={cx(styles.section, styles["hosts-section"])}
          id="for-hosts"
        >
          <div className={styles.container}>
            <div className={cx(styles["section-heading"], styles.centered)}>
              <div className={styles["kicker-row"]}>
                <WavyLine color="#ff681a" className={styles["kicker-line"]} />
                <span className={cx(styles["script-kicker"], damion.className)}>
                  For Hosts
                </span>
                <WavyLine color="#ff681a" className={styles["kicker-line"]} />
              </div>
              <h2>Share what you love. Inspire others.</h2>
            </div>

            <div
              className={cx(styles["flow-steps"], styles["flow-steps-5"])}
            >
              {HOST_STEPS.map(({ Icon, title, desc }, index) => (
                <div key={title} className={styles["flow-step"]}>
                  {index > 0 && <FlowArrow color="#ff681a" />}
                  <span className={styles["step-badge"]}>
                    <Icon size={38} strokeWidth={1.75} color="#ff681a" />
                    <span className={styles["step-badge-number"]}>
                      {index + 1}
                    </span>
                  </span>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </div>
              ))}
            </div>

            <div className={styles["trust-badges"]}>
              {TRUST_BADGES.map(({ Icon, title, desc }) => (
                <div key={title} className={styles["trust-badge"]}>
                  <Icon
                    className={styles["trust-badge-icon"]}
                    size={28}
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                  <strong>{title}</strong>
                  <p>{desc}</p>
                </div>
              ))}
            </div>

          </div>
        </section>

        <section className={styles["final-cta"]}>
          <div className={styles.container}>
            <div className={styles["final-cta-card"]}>
              <div className={styles["final-cta-copy"]}>
                <h2>
                  Life is all about experiences.
                  <br />
                  <span className={cx(styles["script-accent"], damion.className)}>
                    Let&rsquo;s make more memories.
                  </span>{" "}
                  <span className={styles["final-cta-heart"]} aria-hidden="true">
                    ♡
                  </span>
                </h2>
                <div className={styles["final-cta-actions"]}>
                  <Link
                    href="/services"
                    className={cx(styles.btn, styles["btn-orange"], styles["btn-large"])}
                  >
                    Explore Experiences
                  </Link>
                  <button
                    type="button"
                    className={cx(styles.btn, styles["btn-outline-white"], styles["btn-large"])}
                    onClick={() => openAuth()}
                  >
                    Become a Host
                  </button>
                </div>
              </div>
              <div className={styles["final-cta-gallery"]} aria-hidden="true">
                <img src="/Marketing_assets/party-fun.png" alt="" />
                <img src="/Marketing_assets/music-band.png" alt="" />
                <img src="/Marketing_assets/skydive.png" alt="" />
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={cx(styles.container, styles["footer-grid"])}>
          <div className={styles["footer-brand-col"]}>
            <a
              className={cx(styles["footer-wordmark"], damion.className)}
              href="#top"
            >
              Gathra
            </a>
            <p>Life is all about experiences and the memories we create.</p>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <div key={column.heading} className={styles["footer-col"]}>
              <strong>{column.heading}</strong>
              <ul>
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href}>{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className={styles["footer-col"]}>
            <strong>Follow Us</strong>
            <div className={styles["social-icons"]}>
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={social.label}
                  className={styles["social-icon"]}
                  style={{ background: social.background }}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d={social.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
