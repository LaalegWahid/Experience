"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { FaqAccordion } from "@/components/faq-accordion";
import { useLockBodyScroll } from "@/components/use-lock-body-scroll";
import { cx } from "@/shared/utils/cx";
import styles from "../mock3.module.css";

const FAQS = [
  {
    q: "What services can I offer on Gathra?",
    a: "Starting categories include catering, chefs, hair styling, makeup, massage, personal training, photography, prepared meals, spa treatments, and other legitimate professional or personal services.",
  },
  {
    q: "Do I need to have an established business?",
    a: "Gathra can support independent professionals as well as established businesses. Depending on the service and local rules, providers may need licenses, certifications, permits, or insurance.",
  },
  {
    q: "How will customers discover my service?",
    a: "Services can be discovered through Gathra's location and category search, provider profiles, collections, marketplace promotions, and future recommendation features. Final wording should match the live product.",
  },
  {
    q: "How are service listings reviewed?",
    a: "Listings can be evaluated for clear customer expectations, service quality, relevant experience, portfolio strength, required documentation, safety, and overall marketplace fit.",
  },
  {
    q: "What fees does Gathra charge?",
    a: "Final listing fees, service fees, payment processing, cancellation policies, and payout timing should be added once Gathra confirms its commercial terms. Providers should see all applicable terms before publishing.",
  },
  {
    q: "Do I need licenses or insurance?",
    a: "Requirements depend on the service and location. Providers are responsible for complying with applicable laws and maintaining any licenses, certifications, permits, or insurance needed to perform the service.",
  },
];

const SERVICE_CATEGORIES = [
  "Catering",
  "Chef",
  "Hair styling",
  "Makeup",
  "Massage",
  "Personal training",
  "Photography",
  "Prepared meals",
  "Spa treatments",
  "Other",
];

type ToolKey = "listing" | "schedule" | "booking" | "message";

const CALENDAR_DAYS: (number | null)[] = [
  null, null, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18,
  19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
];
const OPEN_DAYS = new Set([4, 5, 9, 12, 18, 19]);

export function Mock3Client() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolKey>("listing");

  useLockBodyScroll(modalOpen);

  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [modalOpen]);

  function openModal() {
    setModalOpen(true);
  }
  function closeModal() {
    setModalOpen(false);
    setSubmitted(false);
  }

  return (
    <div className={styles.root}>
      <header className={styles["site-header"]}>
        <div className={cx(styles.container, styles["nav-wrap"])}>
          <a className={styles.brand} href="#top" aria-label="Gathra home">
            <img src="/Marketing_assets/gathra-logo.png" alt="Gathra" />
          </a>
          <nav className={styles["desktop-nav"]} aria-label="Primary navigation">
            <a href="#services">What you can offer</a>
            <a href="#tools">Provider tools</a>
            <a href="#how-it-works">How it works</a>
            <a href="#faq">FAQ</a>
          </nav>
          <div className={styles["nav-actions"]}>
            <a
              className={cx(styles["text-link"], styles["desktop-only"])}
              href="https://www.gathra.live/services"
              target="_blank"
              rel="noreferrer"
            >
              Explore Gathra
            </a>
            <button
              type="button"
              className={cx(styles.btn, styles["btn-dark"])}
              onClick={openModal}
            >
              List your service
            </button>
            <button
              type="button"
              className={styles["menu-button"]}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
        <div
          className={cx(styles["mobile-menu"], menuOpen && styles.open)}
          aria-hidden={!menuOpen}
        >
          <a href="#services" onClick={() => setMenuOpen(false)}>
            What you can offer
          </a>
          <a href="#tools" onClick={() => setMenuOpen(false)}>
            Provider tools
          </a>
          <a href="#how-it-works" onClick={() => setMenuOpen(false)}>
            How it works
          </a>
          <a href="#faq" onClick={() => setMenuOpen(false)}>
            FAQ
          </a>
          <a
            href="https://www.gathra.live/services"
            target="_blank"
            rel="noreferrer"
            onClick={() => setMenuOpen(false)}
          >
            Explore Gathra
          </a>
        </div>
      </header>

      <main id="top">
        <section className={styles.hero}>
          <div className={cx(styles["hero-orb"], styles["hero-orb-one"])}></div>
          <div className={cx(styles["hero-orb"], styles["hero-orb-two"])}></div>
          <div className={cx(styles.container, styles["hero-grid"])}>
            <div className={styles["hero-copy"]}>
              <div className={styles.eyebrow}>
                 Now onboarding
                founding service providers
              </div>
              <h1>Give your service a place to get discovered and booked.</h1>
              <p className={styles["hero-lede"]}>
                Whether you are a chef, photographer, stylist, trainer,
                wellness professional, or local business, Gathra helps turn
                what you do into a clear, bookable offering.
              </p>
              <div className={styles["hero-actions"]}>
                <button
                  type="button"
                  className={cx(styles.btn, styles["btn-orange"], styles["btn-large"])}
                  onClick={openModal}
                >
                  List your service
                </button>
                <a
                  className={cx(styles.btn, styles["btn-ghost"], styles["btn-large"])}
                  href="#how-it-works"
                >
                  See how it works
                </a>
              </div>
              <div className={styles["trust-row"]} aria-label="Provider benefits">
                <div>
                  <strong>Set your pricing</strong>
                  <span>You decide what your service costs</span>
                </div>
                <div>
                  <strong>Choose your availability</strong>
                  <span>Offer times that fit your schedule</span>
                </div>
                <div>
                  <strong>Individuals + businesses</strong>
                  <span>Built for providers of every size</span>
                </div>
              </div>
            </div>

            <div className={styles["hero-visual"]} aria-label="Examples of Gathra service providers">
              <div className={styles["hero-main-image"]}>
                <img
                  src="/Marketing_assets/hero-chef.jpg"
                  alt="Chef preparing plated meals for guests"
                />
                <div className={styles["hero-image-label"]}>
                  <span>Chef service</span>
                  <strong>Private dinner preparation</strong>
                </div>
              </div>
              <div className={cx(styles["mini-service-card"], styles["mini-photo"])}>
                <img src="/Marketing_assets/photography.jpg" alt="Photographer taking a portrait" />
                <span>Photography</span>
              </div>
              <div className={cx(styles["mini-service-card"], styles["mini-wellness"])}>
                <img src="/Marketing_assets/massage.jpg" alt="Massage therapist working with a client" />
                <span>Wellness</span>
              </div>
              <div className={styles["booking-toast"]}>
                <div className={styles["toast-icon"]}>✓</div>
                <div>
                  <strong>New booking request</strong>
                  <span>Saturday · 6:00 PM · 4 guests</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles["positioning-strip"]} aria-label="Gathra service marketplace positioning">
          <div className={cx(styles.container, styles["strip-content"])}>
            <span>One marketplace for real-world services and experiences.</span>
            <span className={styles["strip-dot"]}></span>
            <span>Turn local expertise into bookable income.</span>
          </div>
        </section>

        <section className={cx(styles.section, styles["service-types"])} id="services">
          <div className={styles.container}>
            <div className={cx(styles["section-heading"], styles.centered)}>
              <span className={styles.kicker}>Offer what you do best</span>
              <h2>Your service belongs on Gathra.</h2>
              <p>
                Start with a familiar category or create something more
                specialized. Gathra is designed for practical, personal,
                professional, and creative services.
              </p>
            </div>

            <div className={styles["category-pills"]} aria-label="Service categories">
              <span>Catering</span>
              <span>Chefs</span>
              <span>Hair styling</span>
              <span>Makeup</span>
              <span>Massage</span>
              <span>Personal training</span>
              <span>Photography</span>
              <span>Prepared meals</span>
              <span>Spa treatments</span>
              <span>Other</span>
            </div>

            <div className={styles["service-card-grid"]}>
              <article className={cx(styles["service-card"], styles["service-card-large"])}>
                <img src="/Marketing_assets/hero-chef.jpg" alt="Chef preparing food" />
                <div className={styles["service-card-copy"]}>
                  <span>Food & hospitality</span>
                  <h3>Chefs, catering, and prepared meals</h3>
                  <p>
                    Offer private dining, event catering, meal preparation,
                    specialty menus, and culinary services.
                  </p>
                </div>
              </article>
              <article className={styles["service-card"]}>
                <img src="/Marketing_assets/hair.jpg" alt="Hair stylist working with a client" />
                <div className={styles["service-card-copy"]}>
                  <span>Beauty</span>
                  <h3>Hair styling</h3>
                  <p>Appointments for cuts, styling, event looks, and mobile beauty services.</p>
                </div>
              </article>
              <article className={styles["service-card"]}>
                <img src="/Marketing_assets/makeup.jpg" alt="Makeup artist working with a client" />
                <div className={styles["service-card-copy"]}>
                  <span>Beauty</span>
                  <h3>Makeup services</h3>
                  <p>Bridal, event, editorial, personal, and on-location makeup appointments.</p>
                </div>
              </article>
              <article className={cx(styles["service-card"], styles["service-card-wide"])}>
                <img src="/Marketing_assets/photography.jpg" alt="Professional photographer at work" />
                <div className={styles["service-card-copy"]}>
                  <span>Creative services</span>
                  <h3>Photography that captures the moment</h3>
                  <p>Portraits, events, couples, families, brands, products, and destination sessions.</p>
                </div>
              </article>
              <article className={styles["service-card"]}>
                <img src="/Marketing_assets/training.jpg" alt="Personal trainer guiding a client" />
                <div className={styles["service-card-copy"]}>
                  <span>Fitness</span>
                  <h3>Personal training</h3>
                  <p>One-on-one coaching, small-group sessions, movement, and fitness support.</p>
                </div>
              </article>
              <article className={styles["service-card"]}>
                <img src="/Marketing_assets/massage.jpg" alt="Wellness professional providing a massage" />
                <div className={styles["service-card-copy"]}>
                  <span>Wellness</span>
                  <h3>Massage and spa treatments</h3>
                  <p>Relaxation, recovery, therapeutic care, and mobile wellness appointments.</p>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className={cx(styles.section, styles["discovery-section"])}>
          <div className={cx(styles.container, styles["discovery-grid"])}>
            <div className={styles["discovery-copy"]}>
              <span className={styles.kicker}>Reach people at the right moment</span>
              <h2>Be discoverable when customers are ready to make a plan.</h2>
              <p>
                Gathra can help local customers and visitors find services
                while they are preparing for a trip, planning an event,
                investing in themselves, or simply looking for trusted help
                nearby.
              </p>
              <button
                type="button"
                className={cx(styles.btn, styles["btn-dark"], styles["btn-large"])}
                onClick={openModal}
              >
                Become a founding provider
              </button>
            </div>
            <div className={styles["intent-grid"]}>
              <article className={styles["intent-card"]}>
                <div className={styles["intent-icon"]}>✦</div>
                <span>Celebrations</span>
                <h3>Weddings, birthdays, and special occasions</h3>
              </article>
              <article className={cx(styles["intent-card"], styles["orange-intent"])}>
                <div className={styles["intent-icon"]}>⌖</div>
                <span>Travel</span>
                <h3>Services that make a visit easier or more memorable</h3>
              </article>
              <article className={cx(styles["intent-card"], styles["dark-intent"])}>
                <div className={styles["intent-icon"]}>◷</div>
                <span>Everyday needs</span>
                <h3>Convenient local appointments and practical help</h3>
              </article>
              <article className={cx(styles["intent-card"], styles["photo-intent"])}>
                <img src="/Marketing_assets/photography.jpg" alt="Local photographer service" />
                <div>
                  <span>Personal goals</span>
                  <h3>Fitness, wellness, confidence, and self-care</h3>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className={cx(styles.section, styles["founding-section"])}>
          <div className={cx(styles.container, styles["founding-grid"])}>
            <div className={styles["provider-preview"]}>
              <div className={styles["preview-topbar"]}>
                <div className={styles["provider-avatar"]}>A</div>
                <div>
                  <strong>Amara Beauty Studio</strong>
                  <span>Makeup · Hair styling · Grand Rapids</span>
                </div>
                <div className={styles["verified-badge"]}>✓</div>
              </div>
              <div className={styles["preview-listing"]}>
                <div className={styles["preview-image"]}>
                  <img src="/Marketing_assets/makeup.jpg" alt="Makeup service listing preview" />
                </div>
                <div className={styles["preview-body"]}>
                  <span className={styles["mini-label"]}>Event makeup</span>
                  <h3>Professional makeup for your special day</h3>
                  <div className={styles["preview-meta"]}>
                    <span>90 minutes</span>
                    <span>Mobile or studio</span>
                  </div>
                  <div className={styles["preview-price"]}>
                    <strong>$125</strong>
                    <span>starting price</span>
                  </div>
                </div>
              </div>
              <div className={styles["calendar-card"]}>
                <div>
                  <span className={styles["calendar-kicker"]}>Next availability</span>
                  <strong>Friday, 3:30 PM</strong>
                </div>
                <button type="button">Open</button>
              </div>
              <div className={styles["provider-badge"]}>Founding provider preview</div>
            </div>

            <div className={styles["founding-copy"]}>
              <span className={cx(styles.kicker, styles.light)}>
                The founding provider opportunity
              </span>
              <h2>Build your presence early and help shape Gathra.</h2>
              <p>
                Join the first group of professionals and businesses
                bringing trusted local services to Gathra. Early providers
                can receive closer onboarding support and give direct
                feedback as the marketplace evolves.
              </p>
              <div className={styles["benefit-list"]}>
                <div className={styles["benefit-item"]}>
                  <span>01</span>
                  <div>
                    <strong>Create a strong first impression</strong>
                    <p>
                      Package your service with clear photos, details,
                      pricing, and customer expectations.
                    </p>
                  </div>
                </div>
                <div className={styles["benefit-item"]}>
                  <span>02</span>
                  <div>
                    <strong>Get hands-on onboarding</strong>
                    <p>
                      Work through your service category, offering
                      structure, availability, and listing presentation.
                    </p>
                  </div>
                </div>
                <div className={styles["benefit-item"]}>
                  <span>03</span>
                  <div>
                    <strong>Help define the provider experience</strong>
                    <p>
                      Share feedback on the tools and workflows your
                      business needs most.
                    </p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className={cx(styles.btn, styles["btn-white"], styles["btn-large"])}
                onClick={openModal}
              >
                Apply as a founding provider
              </button>
            </div>
          </div>
        </section>

        <section className={cx(styles.section, styles["tools-section"])} id="tools">
          <div className={styles.container}>
            <div className={cx(styles["section-heading"], styles["split-heading"])}>
              <div>
                <span className={styles.kicker}>Built for service providers</span>
                <h2>From discovery to confirmed booking.</h2>
              </div>
              <p>
                Gathra is designed to bring your listing, pricing,
                availability, bookings, messages, payments, and customer
                trust into one connected experience.
              </p>
            </div>

            <div className={styles["tools-layout"]}>
              <div className={styles["tool-tabs"]} role="tablist" aria-label="Provider tools">
                <button
                  type="button"
                  className={cx(styles["tool-tab"], activeTool === "listing" && styles.active)}
                  role="tab"
                  aria-selected={activeTool === "listing"}
                  onClick={() => setActiveTool("listing")}
                >
                  <span>01</span>
                  <div>
                    <strong>Create a standout listing</strong>
                    <small>Show what you offer and what is included.</small>
                  </div>
                </button>
                <button
                  type="button"
                  className={cx(styles["tool-tab"], activeTool === "schedule" && styles.active)}
                  role="tab"
                  aria-selected={activeTool === "schedule"}
                  onClick={() => setActiveTool("schedule")}
                >
                  <span>02</span>
                  <div>
                    <strong>Set your schedule</strong>
                    <small>Choose hours, lead time, duration, and availability.</small>
                  </div>
                </button>
                <button
                  type="button"
                  className={cx(styles["tool-tab"], activeTool === "booking" && styles.active)}
                  role="tab"
                  aria-selected={activeTool === "booking"}
                  onClick={() => setActiveTool("booking")}
                >
                  <span>03</span>
                  <div>
                    <strong>Manage bookings</strong>
                    <small>Keep customer and appointment details organized.</small>
                  </div>
                </button>
                <button
                  type="button"
                  className={cx(styles["tool-tab"], activeTool === "message" && styles.active)}
                  role="tab"
                  aria-selected={activeTool === "message"}
                  onClick={() => setActiveTool("message")}
                >
                  <span>04</span>
                  <div>
                    <strong>Communicate clearly</strong>
                    <small>Share details before the service takes place.</small>
                  </div>
                </button>
              </div>

              <div className={styles["tool-demo"]} aria-live="polite">
                <div className={styles["demo-window"]}>
                  <div className={styles["demo-header"]}>
                    <span></span>
                    <span></span>
                    <span></span>
                    <strong>Provider workspace</strong>
                  </div>
                  <div className={styles["demo-content"]}>
                    {activeTool === "listing" && (
                      <div>
                        <div className={styles["demo-cover"]}>
                          <img src="/Marketing_assets/photography.jpg" alt="Photography listing preview" />
                        </div>
                        <div className={styles["demo-copy"]}>
                          <span>Photography</span>
                          <h3>City portrait session</h3>
                          <p>60 minutes · Up to 4 people · Edited gallery included</p>
                          <div className={styles["demo-price"]}>
                            <strong>$180</strong>
                            <button type="button">Published</button>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTool === "schedule" && (
                      <div className={styles["demo-calendar"]}>
                        <div className={styles["calendar-head"]}>
                          <div>
                            <span>Availability</span>
                            <strong>September 2026</strong>
                          </div>
                          <button type="button">Set hours</button>
                        </div>
                        <div className={styles["calendar-grid"]}>
                          <span>Mon</span>
                          <span>Tue</span>
                          <span>Wed</span>
                          <span>Thu</span>
                          <span>Fri</span>
                          <span>Sat</span>
                          <span>Sun</span>
                          {CALENDAR_DAYS.map((day, i) => (
                            <i
                              key={i}
                              className={cx(day !== null && OPEN_DAYS.has(day) && styles["open-day"])}
                            >
                              {day ?? ""}
                            </i>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeTool === "booking" && (
                      <div className={styles["demo-bookings"]}>
                        <div className={styles["booking-row"]}>
                          <div className={styles["booking-date"]}>
                            <strong>18</strong>
                            <span>Sep</span>
                          </div>
                          <div>
                            <strong>Portrait session</strong>
                            <span>Jordan M. · 4:00 PM</span>
                          </div>
                          <span className={cx(styles.status, styles.confirmed)}>Confirmed</span>
                        </div>
                        <div className={styles["booking-row"]}>
                          <div className={styles["booking-date"]}>
                            <strong>19</strong>
                            <span>Sep</span>
                          </div>
                          <div>
                            <strong>Event makeup</strong>
                            <span>Nia R. · 10:30 AM</span>
                          </div>
                          <span className={cx(styles.status, styles.pending)}>Pending</span>
                        </div>
                        <div className={styles["booking-row"]}>
                          <div className={styles["booking-date"]}>
                            <strong>21</strong>
                            <span>Sep</span>
                          </div>
                          <div>
                            <strong>Personal training</strong>
                            <span>Chris T. · 6:00 PM</span>
                          </div>
                          <span className={cx(styles.status, styles.confirmed)}>Confirmed</span>
                        </div>
                      </div>
                    )}

                    {activeTool === "message" && (
                      <div className={styles["demo-message"]}>
                        <div className={cx(styles["chat-bubble"], styles.incoming)}>
                          Hi! Is the portrait session suitable for a family of four?
                        </div>
                        <div className={cx(styles["chat-bubble"], styles.outgoing)}>
                          Absolutely. The listing includes up to four people, and I can recommend a few downtown locations.
                        </div>
                        <div className={cx(styles["chat-bubble"], styles.incoming)}>
                          Perfect. We will book the Friday afternoon time.
                        </div>
                        <div className={styles["chat-compose"]}>
                          <span>Write a message…</span>
                          <button type="button">Send</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={cx(styles.section, styles["process-section"])} id="how-it-works">
          <div className={styles.container}>
            <div className={cx(styles["section-heading"], styles.centered, styles.narrow)}>
              <span className={styles.kicker}>How it works</span>
              <h2>Turn your service into a bookable listing.</h2>
              <p>
                A clear provider flow helps Gathra maintain quality while
                making it straightforward to get started.
              </p>
            </div>
            <div className={styles.steps}>
              <article className={styles["step-card"]}>
                <span className={styles["step-number"]}>1</span>
                <h3>Tell us what you offer</h3>
                <p>Share your service, location, experience, credentials, and who you serve.</p>
              </article>
              <article className={styles["step-card"]}>
                <span className={styles["step-number"]}>2</span>
                <h3>Create your listing</h3>
                <p>Add photos, pricing, duration, service area, availability, and what customers should expect.</p>
              </article>
              <article className={styles["step-card"]}>
                <span className={styles["step-number"]}>3</span>
                <h3>Submit for review</h3>
                <p>Gathra reviews your listing for quality, clarity, safety, and marketplace fit.</p>
              </article>
              <article className={styles["step-card"]}>
                <span className={styles["step-number"]}>4</span>
                <h3>Publish and get booked</h3>
                <p>Make your service discoverable, receive requests or bookings, and serve your customers.</p>
              </article>
            </div>
            <div className={styles["center-action"]}>
              <button
                type="button"
                className={cx(styles.btn, styles["btn-orange"], styles["btn-large"])}
                onClick={openModal}
              >
                Start your service listing
              </button>
            </div>
          </div>
        </section>

        <section className={cx(styles.section, styles["faq-section"])} id="faq">
          <div className={cx(styles.container, styles["faq-grid"])}>
            <div className={styles["faq-intro"]}>
              <span className={styles.kicker}>Your questions, answered</span>
              <h2>What should service providers know?</h2>
              <p>
                This mockup keeps policy-dependent answers flexible until
                Gathra finalizes fees, payouts, review standards, licensing
                requirements, and provider protections.
              </p>
              <button
                type="button"
                className={cx(styles.btn, styles["btn-dark"])}
                onClick={openModal}
              >
                List your service
              </button>
            </div>
            <FaqAccordion items={FAQS} styles={styles} />
          </div>
        </section>

        <section className={styles["final-cta"]}>
          <div className={cx(styles.container, styles["final-cta-inner"])}>
            <div>
              <span className={cx(styles.kicker, styles.light)}>
                Your next customer could be looking for exactly what you do
              </span>
              <h2>
                Turn your expertise into a service people can discover,
                understand, and book.
              </h2>
            </div>
            <button
              type="button"
              className={cx(styles.btn, styles["btn-white"], styles["btn-large"])}
              onClick={openModal}
            >
              List your service
            </button>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={cx(styles.container, styles["footer-top"])}>
          <a className={cx(styles.brand, styles["footer-brand"])} href="#top">
            <img src="/Marketing_assets/gathra-logo.png" alt="Gathra" />
          </a>
          <p>
            A marketplace for discovering and booking real-world services
            and experiences from people and businesses.
          </p>
          <div className={styles["footer-links"]}>
            <a href="https://www.gathra.live/services" target="_blank" rel="noreferrer">
              Explore
            </a>
            <a href="#services">Service types</a>
            <a href="#faq">FAQ</a>
          </div>
        </div>
        <div className={cx(styles.container, styles["footer-bottom"])}>
          <span>Landing-page mockup for Gathra</span>
          <span>Photos used for concept visualization only</span>
        </div>
      </footer>

      <div
        className={cx(styles["modal-backdrop"], modalOpen && styles.open)}
        aria-hidden={!modalOpen}
        onClick={(e) => e.target === e.currentTarget && closeModal()}
      >
        <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <button
            type="button"
            className={styles["modal-close"]}
            aria-label="Close dialog"
            onClick={closeModal}
          >
            ×
          </button>
          <span className={styles.kicker}>Founding provider interest form</span>
          <h2 id="modal-title">What service would you like to offer?</h2>
          <p>
            Demo form for the landing-page mockup. Submissions are not sent
            anywhere.
          </p>
          {!submitted ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSubmitted(true);
              }}
            >
              <div className={styles["form-row"]}>
                <label>
                  Full name
                  <input type="text" required placeholder="Your name" />
                </label>
                <label>
                  Email
                  <input type="email" required placeholder="you@example.com" />
                </label>
              </div>
              <div className={styles["form-row"]}>
                <label>
                  City
                  <input type="text" required placeholder="Grand Rapids, MI" />
                </label>
                <label>
                  Provider type
                  <select required defaultValue="">
                    <option value="" disabled>
                      Select one
                    </option>
                    <option>Independent professional</option>
                    <option>Business or studio</option>
                    <option>Team or agency</option>
                  </select>
                </label>
              </div>
              <div className={styles["form-row"]}>
                <label>
                  Service category
                  <select required defaultValue="">
                    <option value="" disabled>
                      Select one
                    </option>
                    {SERVICE_CATEGORIES.map((cat) => (
                      <option key={cat}>{cat}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Website or social profile
                  <input type="url" placeholder="https://" />
                </label>
              </div>
              <label>
                Tell us about your service
                <textarea
                  required
                  rows={4}
                  placeholder="Describe what you offer, who it is for, and what makes your service stand out."
                />
              </label>
              <button
                type="submit"
                className={cx(styles.btn, styles["btn-orange"], styles["btn-large"], styles["full-width"])}
              >
                Submit interest
              </button>
            </form>
          ) : (
            <div className={styles["form-success"]}>
              <div className={styles["success-icon"]}>✓</div>
              <h3>Interest captured for the mockup.</h3>
              <p>
                In production, this could start the listing flow, create a
                provider lead, or route the applicant into a review process.
              </p>
              <button
                type="button"
                className={cx(styles.btn, styles["btn-dark"])}
                onClick={closeModal}
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
