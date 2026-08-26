"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { cx } from "@/shared/utils/cx";
import styles from "../mock2.module.css";
import { FaqItem } from "./faq-item";
import { ListingHeart } from "./listing-heart";

const LISTINGS = [
  {
    image: "/Marketing_assets/chef.webp",
    alt: "Private chef service",
    type: "Service",
    category: "Food and catering",
    rating: "4.9",
    title: "Private chef for intimate dinners",
    location: "Grand Rapids",
    price: "From $95",
  },
  {
    image: "/Marketing_assets/photography.webp",
    alt: "Downtown photography walk",
    type: "Experience",
    category: "Art and design",
    rating: "5.0",
    title: "Downtown street photography walk",
    location: "Grand Rapids",
    price: "From $48",
  },
  {
    image: "/Marketing_assets/wellness.webp",
    alt: "Massage and wellness service",
    type: "Service",
    category: "Wellness",
    rating: "4.8",
    title: "In-home restorative massage",
    location: "Mobile service",
    price: "From $80",
  },
  {
    image: "/Marketing_assets/pottery.webp",
    alt: "Pottery workshop experience",
    type: "Experience",
    category: "Creative workshop",
    rating: "4.9",
    title: "Make your first pottery piece",
    location: "Small group",
    price: "From $55",
  },
  {
    image: "/Marketing_assets/outdoors.webp",
    alt: "Outdoor hiking experience",
    type: "Experience",
    category: "Nature and outdoors",
    rating: "5.0",
    title: "Guided sunrise trail adventure",
    location: "Weekend activity",
    price: "From $42",
  },
  {
    image: "/Marketing_assets/tasting.webp",
    alt: "Local tasting experience",
    type: "Experience",
    category: "Food and drink",
    rating: "4.9",
    title: "Local flavors tasting experience",
    location: "Hosted downtown",
    price: "From $65",
  },
];

const FAQS = [
  {
    q: "Who can create a listing on Gathra?",
    a: "Independent professionals, creators, local hosts, instructors, venues, studios, agencies, and established businesses can all be considered. The offering should be legitimate, clearly described, and suitable for booking.",
  },
  {
    q: "What is the difference between a service and an experience?",
    a: "A service is usually booked to complete a useful or professional need, such as photography, massage, catering, or personal training. An experience is generally an activity people participate in, such as a tour, workshop, tasting, class, or outdoor adventure.",
  },
  {
    q: "Does my offering have to fit an existing category?",
    a: "No. Categories should help customers browse, but Gathra can remain open to legitimate custom offerings that do not fit neatly into a predefined option.",
  },
  {
    q: "How does listing approval work?",
    a: "The recommended flow is to review listings for clarity, quality, trust, and marketplace fit before they become publicly bookable. The exact review timeline and requirements should be confirmed by the Gathra team.",
  },
  {
    q: "What does Gathra charge providers?",
    a: "This mockup intentionally leaves provider fees open. Publish the exact listing, booking, processing, and cancellation terms only after the commercial model is finalized.",
  },
  {
    q: "Can a business list multiple offerings?",
    a: "The recommended model allows a business to create multiple listings when each offering has clear details, pricing, availability, and customer expectations.",
  },
];

const NEW_LISTING_HREF = "/host/listings/new";
const NEW_SERVICE_HREF = "/host/listings/new?type=service";
const NEW_EXPERIENCE_HREF = "/host/listings/new?type=experience";

export function Mock2Client() {
  return (
    <div className={styles.root}>
      <div className={styles.announcement}>
        <span>Founding providers now welcome.</span> Create a service or
        experience and help shape Gathra from the beginning.
      </div>

      <main id="top">
        <section className={styles.hero}>
          <div className={cx(styles.container, styles["hero-grid"])}>
            <div className={styles["hero-copy"]}>
              <div className={styles.eyebrow}>
                 Gathra for
                providers
              </div>
              <h1>Turn what you do into something people can book.</h1>
              <p className={styles["hero-lede"]}>
                Offer a service or host an experience, build your presence
                early, and give customers a simple way to discover and book
                what you provide.
              </p>
              <div className={styles["hero-actions"]}>
                <Link
                  href={NEW_LISTING_HREF}
                  className={cx(styles.btn, styles["btn-orange"], styles["btn-large"])}
                >
                  Create your listing <span aria-hidden="true">→</span>
                </Link>
                <a
                  className={cx(styles.btn, styles["btn-ghost"], styles["btn-large"])}
                  href="#preview"
                >
                  See the marketplace preview
                </a>
              </div>
            

            
            </div>

            <div
              className={styles["hero-visual"]}
              aria-label="Examples of a service provider and an experience host"
            >
              <div className={styles["visual-backplate"]}></div>
              <article className={cx(styles["hero-card"], styles["hero-service"])}>
                <img
                  src="/Marketing_assets/hero-service.webp"
                  alt="A chef providing a bookable service"
                />
                <div className={styles["hero-card-copy"]}>
                  <span>Offer a service</span>
                  <strong>Private chef and catering</strong>
                </div>
              </article>
              <article className={cx(styles["hero-card"], styles["hero-experience"])}>
                <img
                  src="/Marketing_assets/hero-tour.jpg"
                  alt="A local host leading a group experience"
                />
                <div className={styles["hero-card-copy"]}>
                  <span>Host an experience</span>
                  <strong>Local tours and activities</strong>
                </div>
              </article>
              <div className={styles["choice-toast"]}>
                <div className={styles["choice-icon"]}>✓</div>
                <div>
                  <strong>One marketplace, two ways to offer</strong>
                  <span>
                    Services for what people need. Experiences for what they
                    want to remember.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles["positioning-strip"]} aria-label="Gathra positioning">
          <div className={cx(styles.container, styles["strip-content"])}>
            <span>Services</span>
            <span className={styles["strip-dot"]}></span>
            <span>Experiences</span>
            <span className={styles["strip-dot"]}></span>
            <span>Real availability</span>
            <span className={styles["strip-dot"]}></span>
            <span>Confirmed plans</span>
          </div>
        </section>

        <section className={cx(styles.section, styles["path-section"])} id="paths">
          <div className={styles.container}>
            <div className={cx(styles["section-heading"], styles.centered)}>
              <span className={styles.kicker}>Choose how you want to offer</span>
              <h2>
                Your skills, expertise, passion, or local knowledge can
                become bookable.
              </h2>
              <p>
                Start with the path that best matches what you provide.
                Gathra can support individuals and businesses across both
                sides of the marketplace.
              </p>
            </div>

            <div className={styles["path-grid"]}>
              <article className={styles["path-card"]}>
                <img
                  src="/Marketing_assets/photography.webp"
                  alt="A photographer offering a professional service"
                />
                <div className={styles["path-copy"]}>
                  <span className={styles["path-tag"]}>
                    For professionals and businesses
                  </span>
                  <h3>Offer a service</h3>
                  <p>
                    Turn your expertise into a clear offering with pricing,
                    availability, and the information customers need to
                    book with confidence.
                  </p>
                  <div className={styles["path-examples"]}>
                    <span>Photography</span>
                    <span>Private chefs</span>
                    <span>Fitness</span>
                    <span>Beauty</span>
                    <span>Wellness</span>
                  </div>
                  <Link href={NEW_SERVICE_HREF} className={cx(styles.btn, styles["btn-white"])}>
                    Explore the service path <span>→</span>
                  </Link>
                </div>
              </article>

              <article className={styles["path-card"]}>
                <img
                  src="/Marketing_assets/pottery.webp"
                  alt="A person hosting a pottery experience"
                />
                <div className={styles["path-copy"]}>
                  <span className={styles["path-tag"]}>
                    For creators, hosts, and venues
                  </span>
                  <h3>Host an experience</h3>
                  <p>
                    Create something social, educational, cultural,
                    adventurous, or memorable that people can discover and
                    reserve.
                  </p>
                  <div className={styles["path-examples"]}>
                    <span>Tours</span>
                    <span>Workshops</span>
                    <span>Tastings</span>
                    <span>Classes</span>
                    <span>Outdoor activities</span>
                  </div>
                  <Link href={NEW_EXPERIENCE_HREF} className={cx(styles.btn, styles["btn-white"])}>
                    Explore the experience path <span>→</span>
                  </Link>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className={cx(styles.section, styles["founding-section"])}>
          <div className={cx(styles.container, styles["founding-grid"])}>
            <div className={styles["founding-copy"]}>
              <span className={cx(styles.kicker, styles.light)}>
                Become a founding provider
              </span>
              <h2>Be early. Stand out. Help shape Gathra.</h2>
              <p>
                Gathra is building its first wave of quality supply. Early
                providers can establish their presence, work directly with
                the team, and help create the marketplace customers will
                eventually come to discover.
              </p>
              <Link
                href={NEW_LISTING_HREF}
                className={cx(styles.btn, styles["btn-orange"], styles["btn-large"])}
              >
                Join as a founding provider
              </Link>
            </div>

            <div className={styles["benefit-grid"]}>
              <article className={styles["benefit-card"]}>
                <div className={styles["benefit-icon"]}>01</div>
                <h3>Early visibility</h3>
                <p>Build your profile before the marketplace becomes crowded.</p>
              </article>
              <article className={styles["benefit-card"]}>
                <div className={styles["benefit-icon"]}>02</div>
                <h3>Direct onboarding support</h3>
                <p>
                  Get help turning your idea or expertise into a strong
                  listing.
                </p>
              </article>
              <article className={styles["benefit-card"]}>
                <div className={styles["benefit-icon"]}>03</div>
                <h3>Founding-provider recognition</h3>
                <p>
                  Create a distinct identity as one of the early people
                  building Gathra.
                </p>
              </article>
              <article className={styles["benefit-card"]}>
                <div className={styles["benefit-icon"]}>04</div>
                <h3>A voice in the product</h3>
                <p>
                  Share feedback on what providers need as the platform
                  develops.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className={cx(styles.section, styles["preview-section"])} id="preview">
          <div className={styles.container}>
            <div className={styles["preview-top"]}>
              <div className={styles["section-heading"]}>
                <span className={styles.kicker}>Marketplace preview</span>
                <h2>See how services and experiences can live together.</h2>
                <p>
                  Customers should arrive to a marketplace with useful,
                  memorable, and trustworthy options worth booking.
                </p>
              </div>
              <span className={styles["mock-label"]}>
                Illustrative listings for this mockup
              </span>
            </div>

            <div className={styles["listing-grid"]}>
              {LISTINGS.map((l) => (
                <article key={l.title} className={styles["listing-card"]}>
                  <div className={styles["listing-image"]}>
                    <img src={l.image} alt={l.alt} />
                    <span className={styles["listing-type"]}>{l.type}</span>
                    <ListingHeart label={`Save ${l.alt} listing`} />
                  </div>
                  <div className={styles["listing-body"]}>
                    <div className={styles["listing-meta"]}>
                      <span>{l.category}</span>
                      <span>★ {l.rating}</span>
                    </div>
                    <h3>{l.title}</h3>
                    <div className={styles["listing-bottom"]}>
                      <span>{l.location}</span>
                      <strong>{l.price}</strong>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={cx(styles.section, styles["process-section"])} id="how-it-works">
          <div className={styles.container}>
            <div className={cx(styles["section-heading"], styles.centered)}>
              <span className={styles.kicker}>How it works</span>
              <h2>Turn your idea into a listing in four clear steps</h2>
              <p>
                The homepage keeps the message simple, then routes each
                provider into the right listing flow.
              </p>
            </div>

            <div className={styles["step-grid"]}>
              <article className={styles["step-card"]}>
                <div className={styles["step-number"]}>1</div>
                <h3>Choose your path</h3>
                <p>
                  Decide whether you are offering a service or hosting an
                  experience.
                </p>
              </article>
              <article className={styles["step-card"]}>
                <div className={styles["step-number"]}>2</div>
                <h3>Build the listing</h3>
                <p>
                  Add the description, photos, pricing, location,
                  availability, and what customers should expect.
                </p>
              </article>
              <article className={styles["step-card"]}>
                <div className={styles["step-number"]}>3</div>
                <h3>Submit for review</h3>
                <p>
                  Gathra checks the listing for quality, clarity, and
                  marketplace fit before it goes live.
                </p>
              </article>
              <article className={styles["step-card"]}>
                <div className={styles["step-number"]}>4</div>
                <h3>Start building demand</h3>
                <p>
                  Share your listing, receive interest, and begin turning
                  discovery into confirmed plans.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className={cx(styles.section, styles["platform-section"])}>
          <div className={cx(styles.container, styles["platform-grid"])}>
            <div className={styles["platform-copy"]}>
              <span className={styles.kicker}>One marketplace, less friction</span>
              <h2>
                Give customers the information they need to choose and book.
              </h2>
              <p>
                Gathra should help providers package what they do while
                giving customers a clearer path from interest to action.
              </p>

              <div className={styles["platform-list"]}>
                <article className={styles["platform-item"]}>
                  <div className={styles["platform-item-icon"]}>A</div>
                  <div>
                    <h3>A clear, bookable offer</h3>
                    <p>
                      Present the value, pricing, details, and expectations
                      in one place.
                    </p>
                  </div>
                </article>
                <article className={styles["platform-item"]}>
                  <div className={styles["platform-item-icon"]}>B</div>
                  <div>
                    <h3>Availability customers can understand</h3>
                    <p>
                      Show when the service or experience can happen instead
                      of relying only on back-and-forth messages.
                    </p>
                  </div>
                </article>
                <article className={styles["platform-item"]}>
                  <div className={styles["platform-item-icon"]}>C</div>
                  <div>
                    <h3>Trust that grows over time</h3>
                    <p>
                      Build your provider presence through strong
                      information, completed bookings, and future reviews.
                    </p>
                  </div>
                </article>
              </div>
            </div>

            <div className={styles["platform-window"]} aria-label="Illustrative provider dashboard">
              <div className={styles["window-top"]}>
                <span className={styles["window-dot"]}></span>
                <span className={styles["window-dot"]}></span>
                <span className={styles["window-dot"]}></span>
              </div>
              <div className={styles["window-body"]}>
                <div className={styles["window-profile"]}>
                  <div className={styles["profile-avatar"]}>
                    <img src="/Marketing_assets/hero-chef.jpg" alt="" />
                  </div>
                  <div>
                    <strong>Ember & Platter</strong>
                  </div>
                </div>
                <div className={styles["window-stat-grid"]}>
                  <div className={styles["window-stat"]}>
                    <span>Active listings</span>
                    <strong>2</strong>
                  </div>
                  <div className={styles["window-stat"]}>
                    <span>Upcoming availability</span>
                    <strong>8</strong>
                  </div>
                  <div className={styles["window-stat"]}>
                    <span>Profile completeness</span>
                    <strong>92%</strong>
                  </div>
                  <div className={styles["window-stat"]}>
                    <span>Listing views</span>
                    <strong>148</strong>
                  </div>
                </div>
                <div className={styles["window-booking"]}>
                  <small>NEW INTEREST</small>
                  <strong>Saturday availability viewed</strong>
                  <span>
                    A customer is comparing your listing with other local
                    options.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={cx(styles.section, styles["faq-section"])} id="faq">
          <div className={cx(styles.container, styles["faq-grid"])}>
            <div className={styles["faq-intro"]}>
              <span className={styles.kicker}>Frequently asked questions</span>
              <h2>What should founding providers know?</h2>
              <p>
                Final fees, payouts, insurance, cancellation rules, and
                approval standards should be inserted after Gathra confirms
                its operating policies.
              </p>
              <Link href={NEW_LISTING_HREF} className={cx(styles.btn, styles["btn-dark"])}>
                Create a listing
              </Link>
            </div>

            <div className={styles["faq-list"]}>
              {FAQS.map((item, i) => (
                <FaqItem key={item.q} question={item.q} answer={item.a} defaultOpen={i === 0} />
              ))}
            </div>
          </div>
        </section>

        <section className={styles["final-cta"]}>
          <div className={cx(styles.container, styles["cta-card"])}>
            <div>
              <h2>
                Help build the marketplace customers will come to discover.
              </h2>
              <p>
                Create a service, host an experience, and become part of
                Gathra&rsquo;s first wave of bookable local supply.
              </p>
            </div>
            <Link
              href={NEW_LISTING_HREF}
              className={cx(styles.btn, styles["btn-white"], styles["btn-large"],)}
            >
              Create your listing <span>→</span>
            </Link>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={cx(styles.container, styles["footer-grid"])}>
          <div>
            <img src="/Marketing_assets/gathra-logo.png" alt="Gathra" />
           
          </div>
          <nav className={styles["footer-links"]} aria-label="Footer navigation">
            <a href="#paths">Services</a>
            <a href="#paths">Experiences</a>
            <a href="#preview">Explore</a>
            <a href="#faq">Provider FAQ</a>
          </nav>
        </div>
      </footer>

      <div className={styles["mobile-sticky"]}>
        <Link href={NEW_LISTING_HREF} className={cx(styles.btn, styles["btn-orange"])}>
          Create a listing
        </Link>
      </div>
    </div>
  );
}
