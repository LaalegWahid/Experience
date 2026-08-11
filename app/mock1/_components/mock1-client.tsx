"use client";

/* eslint-disable @next/next/no-img-element */

import { useAuthModal } from "@/components/auth-modal-provider";
import { FaqAccordion } from "@/components/faq-accordion";
import { cx } from "@/shared/utils/cx";
import styles from "../mock1.module.css";

const FAQS = [
  {
    q: "What kinds of experiences can I list?",
    a: "Tours, tastings, workshops, classes, wellness, outdoor activities, entertainment, gatherings, cultural experiences, and original formats that do not fit a predefined category.",
  },
  {
    q: "Who can host on Gathra?",
    a: "Independent creators, guides, instructors, chefs, artists, specialists, venues, studios, hospitality operators, and established businesses can all create experiences.",
  },
  {
    q: "How are experiences reviewed?",
    a: "Listings can be reviewed for completeness, clear guest expectations, quality, safety, local requirements, and whether the experience is appropriate for the marketplace.",
  },
  {
    q: "How will guests find my experience?",
    a: "Experiences can be discovered through Gathra’s location and category search, marketplace collections, host profiles, and launch marketing. Final discovery features should match the production product.",
  },
  {
    q: "What fees does Gathra charge?",
    a: "Final host fees, payment processing, cancellation rules, and payout timing should be inserted here once Gathra’s commercial terms are confirmed. Hosts should see all terms before publishing.",
  },
  {
    q: "Do I need licenses or insurance?",
    a: "Requirements depend on the activity and location. Hosts remain responsible for following applicable laws and maintaining any licenses, permits, or insurance required for their experience.",
  },
];

export function Mock1Client() {
  const { openAuth } = useAuthModal();

  return (
    <div className={styles.root}>
      <main id="top">
        <section className={styles.hero}>
          <div className={cx(styles.container, styles["hero-grid"])}>
            <div className={styles["hero-copy"]}>
              <div className={styles.eyebrow}>
                Now onboarding
                founding experience hosts
              </div>
              <h1>Get paid to bring your city to life.</h1>
              <p className={styles["hero-lede"]}>
                Create tours, workshops, tastings, classes, outdoor
                activities, and original local experiences people can
                discover and book on Gathra.
              </p>
              <div className={styles["hero-actions"]}>
                <button
                  type="button"
                  className={cx(styles.btn, styles["btn-orange"], styles["btn-large"])}
                  onClick={() => openAuth()}
                >
                  Create an experience
                </button>
                <a
                  className={cx(styles.btn, styles["btn-ghost"], styles["btn-large"])}
                  href="#how-it-works"
                >
                  See how it works
                </a>
              </div>
              <div className={styles["trust-row"]} aria-label="Host benefits">
                <div>
                  <strong>Set your price</strong>
                  <span>You control what you charge</span>
                </div>
                <div>
                  <strong>Choose your schedule</strong>
                  <span>Host when it works for you</span>
                </div>
                <div>
                  <strong>Individuals + businesses</strong>
                  <span>Local talent of every kind</span>
                </div>
              </div>
            </div>

            <div className={styles["hero-visual"]}>
              <div className={styles["hero-image-wrap"]}>
                <img
                  src="/Marketing_assets/hero-tour.jpg"
                  alt="A local guide leading a group experience"
                />
              </div>
              <div className={cx(styles["floating-card"], styles["card-one"])}>
                <div className={styles["icon-badge"]}>✓</div>
                <div>
                  <strong>Your idea, made bookable</strong>
                  <span>
                    Turn local knowledge into an experience people can
                    reserve.
                  </span>
                </div>
              </div>
              <div className={cx(styles["floating-card"], styles["card-two"])}>
                <span className={styles["mini-label"]}>Example experience</span>
                <strong>Hidden gems city walk</strong>
                <span>2 hours · Small group</span>
              </div>
            </div>
          </div>
        </section>

        <section className={styles["logo-strip"]} aria-label="Gathra positioning statement">
          <div className={cx(styles.container, styles["strip-content"])}>
            <span>
              One place to offer, discover, and book real-world experiences.
            </span>
            <div className={styles["strip-divider"]}></div>
            <span>
              Built for local creators, experts, venues, and businesses.
            </span>
          </div>
        </section>

        <section className={styles.section} id="ideas">
          <div className={styles.container}>
            <div className={cx(styles["section-heading"], styles.centered)}>
              <span className={styles.kicker}>Make what you love bookable</span>
              <h2>Host one-of-a-kind experiences of all kinds</h2>
              <p>
                Gathra is designed for experiences that are useful,
                memorable, social, creative, local, or completely original.
              </p>
            </div>

            <div className={styles["category-grid"]}>
              <article className={cx(styles["category-card"], styles["category-large"])}>
                <img
                  src="/Marketing_assets/cooking.jpg"
                  alt="People taking part in a cooking class"
                />
                <div className={styles["category-overlay"]}>
                  <span>Food & drink</span>
                  <h3>Share something delicious</h3>
                  <p>
                    Cooking classes, tastings, food walks, private dining,
                    and cultural food experiences.
                  </p>
                </div>
              </article>

              <article className={styles["category-card"]}>
                <img
                  src="/Marketing_assets/pottery.jpg"
                  alt="Participant making pottery in a creative workshop"
                />
                <div className={styles["category-overlay"]}>
                  <span>Arts & creativity</span>
                  <h3>Teach your craft</h3>
                  <p>
                    Art workshops, photography walks, dance, design, music,
                    and hands-on making.
                  </p>
                </div>
              </article>

              <article className={styles["category-card"]}>
                <img
                  src="/Marketing_assets/hiking.jpg"
                  alt="A group hiking through a mountain landscape"
                />
                <div className={styles["category-overlay"]}>
                  <span>Nature & outdoors</span>
                  <h3>Lead an adventure</h3>
                  <p>
                    Hikes, cycling, water activities, nature walks, sports,
                    and outdoor exploration.
                  </p>
                </div>
              </article>

              <article className={styles["category-card"]}>
                <img src="/Marketing_assets/yoga.jpg" alt="Outdoor yoga class" />
                <div className={styles["category-overlay"]}>
                  <span>Wellness & movement</span>
                  <h3>Help people feel their best</h3>
                  <p>
                    Fitness, yoga, wellness sessions, self-care, beauty, and
                    restorative experiences.
                  </p>
                </div>
              </article>

              <article className={styles["category-card"]}>
                <img
                  src="/Marketing_assets/tasting.jpg"
                  alt="A group taking part in a tasting experience"
                />
                <div className={styles["category-overlay"]}>
                  <span>Culture, tours & gatherings</span>
                  <h3>Show people what makes your community special</h3>
                  <p>
                    Neighborhood tours, local history, cultural activities,
                    social gatherings, themed events, and new formats that
                    do not fit a traditional category.
                  </p>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className={cx(styles.section, styles["founding-section"])}>
          <div className={cx(styles.container, styles["founding-grid"])}>
            <div className={styles["founding-copy"]}>
              <span className={cx(styles.kicker, styles.light)}>
                The founding host opportunity
              </span>
              <h2>Be early, Stand out, Help shape Gathra.</h2>
              <p>
                Join the first wave of local hosts building the experiences
                people will discover on Gathra. Early hosts can establish
                their presence, get closer onboarding support, and help
                influence how the marketplace evolves.
              </p>
              <div className={styles["benefit-list"]}>
                <div className={styles["benefit-item"]}>
                  <span>01</span>
                  <div>
                    <strong>Build your presence early</strong>
                    <p>
                      Create a strong host profile and listing before your
                      category becomes crowded.
                    </p>
                  </div>
                </div>
                <div className={styles["benefit-item"]}>
                  <span>02</span>
                  <div>
                    <strong>Get hands-on onboarding</strong>
                    <p>
                      Receive guidance on your title, description,
                      itinerary, photos, pricing, and guest expectations.
                    </p>
                  </div>
                </div>
                <div className={styles["benefit-item"]}>
                  <span>03</span>
                  <div>
                    <strong>Help shape the marketplace</strong>
                    <p>
                      Share feedback directly with the Gathra team as the
                      host experience is refined.
                    </p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className={cx(styles.btn, styles["btn-white"], styles["btn-large"])}
                onClick={() => openAuth()}
              >
                Apply as a founding host
              </button>
            </div>
            <div className={styles["founding-panel"]}>
              <div className={styles["panel-badge"]}>Founding host preview</div>
              <div className={styles["profile-card"]}>
                <div className={styles.avatar}>M</div>
                <div>
                  <strong>Maya&rsquo;s Creative Studio</strong>
                  <span>Art & design · Grand Rapids</span>
                </div>
                <div className={styles.verified}>✓</div>
              </div>
              <div className={styles["listing-preview"]}>
                <div className={styles["preview-image"]}>
                  <img src="/Marketing_assets/pottery.jpg" alt="Pottery workshop preview" />
                </div>
                <div className={styles["preview-copy"]}>
                  <span className={styles["mini-label"]}>Creative workshop</span>
                  <h3>Make your first ceramic bowl</h3>
                  <div className={styles["preview-meta"]}>
                    <span>2.5 hours</span>
                    <span>Up to 8 guests</span>
                  </div>
                  <div className={styles["price-row"]}>
                    <strong>$65</strong>
                    <span>per guest</span>
                  </div>
                </div>
              </div>
              <div className={styles["booking-toast"]}>
                <span className={styles["toast-icon"]}>🎉</span>
                <div>
                  <strong>New booking request</strong>
                  <span>4 guests · Saturday at 2:00 PM</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={cx(styles.section, styles["tools-section"])}>
          <div className={styles.container}>
            <div className={cx(styles["section-heading"], styles["split-heading"])}>
              <div>
                <span className={styles.kicker}>From idea to confirmed plan</span>
                <h2>Everything your experience needs, in one place.</h2>
              </div>
              <p>
                Gathra is built to help providers package what they do, show
                real availability, receive bookings, communicate with
                guests, and build repeat demand.
              </p>
            </div>
            <div className={styles["feature-grid"]}>
              <article className={styles["feature-card"]}>
                <div className={styles["feature-icon"]}>✦</div>
                <h3>Create a standout listing</h3>
                <p>
                  Show guests what they will do, what makes the experience
                  special, where it takes place, and what is included.
                </p>
              </article>
              <article className={cx(styles["feature-card"], styles["orange-card"])}>
                <div className={styles["feature-icon"]}>◷</div>
                <h3>Set pricing and availability</h3>
                <p>
                  Choose your schedule, group size, duration, price, and the
                  dates or times guests can request or reserve.
                </p>
              </article>
              <article className={cx(styles["feature-card"], styles["dark-card"])}>
                <div className={styles["feature-icon"]}>↗</div>
                <h3>Turn discovery into bookings</h3>
                <p>
                  Give customers the details and confidence they need to
                  move from browsing to a confirmed plan.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className={cx(styles.section, styles["process-section"])} id="how-it-works">
          <div className={styles.container}>
            <div className={cx(styles["section-heading"], styles.centered, styles.narrow)}>
              <span className={styles.kicker}>How it works</span>
              <h2>Start hosting in four clear steps</h2>
              <p>
                The flow keeps the process simple while giving guests enough
                information to book confidently.
              </p>
            </div>
            <div className={styles.steps}>
              <article className={styles["step-card"]}>
                <span className={styles["step-number"]}>1</span>
                <h3>Tell us about your idea</h3>
                <p>
                  Share the activity, who it is for, where it happens, and
                  what makes you the right host.
                </p>
              </article>
              <article className={styles["step-card"]}>
                <span className={styles["step-number"]}>2</span>
                <h3>Build your listing</h3>
                <p>
                  Add photos, an itinerary, price, duration, group size,
                  location, and important guest details.
                </p>
              </article>
              <article className={styles["step-card"]}>
                <span className={styles["step-number"]}>3</span>
                <h3>Submit for review</h3>
                <p>
                  Gathra reviews the listing for clarity, quality, safety,
                  and marketplace fit.
                </p>
              </article>
              <article className={styles["step-card"]}>
                <span className={styles["step-number"]}>4</span>
                <h3>Publish and host</h3>
                <p>
                  Set your availability, begin receiving bookings,
                  communicate with guests, and deliver the experience.
                </p>
              </article>
            </div>
            <div className={styles["center-action"]}>
              <button
                type="button"
                className={cx(styles.btn, styles["btn-orange"], styles["btn-large"])}
                onClick={() => openAuth()}
              >
                Start building your experience
              </button>
            </div>
          </div>
        </section>

        <section className={cx(styles.section, styles["faq-section"])} id="faq">
          <div className={cx(styles.container, styles["faq-grid"])}>
            <div className={styles["faq-intro"]}>
              <span className={styles.kicker}>Your questions, answered</span>
              <h2>What should hosts know?</h2>
              <p>
                This mockup keeps policy-dependent answers flexible until
                Gathra finalizes fees, payouts, review standards, and host
                protections.
              </p>
              <button
                type="button"
                className={cx(styles.btn, styles["btn-dark"])}
                onClick={() => openAuth()}
              >
                Become a host
              </button>
            </div>
            <FaqAccordion items={FAQS} styles={styles} />
          </div>
        </section>

        <section className={styles["final-cta"]}>
          <div className={cx(styles.container, styles["final-cta-inner"])}>
            <div>
              <span className={cx(styles.kicker, styles.light)}>
                Your idea could be someone&rsquo;s next favorite experience
              </span>
              <h2>
                Turn what you know, love, or uniquely provide into something
                people can book.
              </h2>
            </div>
            <button
              type="button"
              className={cx(styles.btn, styles["btn-white"], styles["btn-large"])}
              onClick={() => openAuth()}
            >
              Create your experience
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
            <a href="#ideas">Host ideas</a>
            <a href="#faq">FAQ</a>
          </div>
        </div>
       
      </footer>
    </div>
  );
}
