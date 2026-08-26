import type { Locale } from "./config";

// Flat, namespaced translation keys. `en` is the source of truth for the key
// set; every other locale must provide the same keys (enforced by the types
// below). To translate a new string: add the key here, then use `t("key")`.
const en = {
  // Navbar
  "nav.marketplace": "Marketplace",
  "nav.admin": "Admin",
  "nav.favorites": "Favorites",
  "nav.signIn": "Sign in",
  "nav.getStarted": "Get started",
  "nav.explore": "Explore",

  // User menu
  "menu.switchToHosting": "Switch to hosting",
  "menu.switchToGuest": "Switch to guest",
  "menu.today": "Today",
  "menu.calendar": "Calendar",
  "menu.listings": "Listings",
  "menu.messages": "Messages",
  "menu.bookings": "Bookings",
  "menu.newListing": "New listing",
  "menu.payouts": "Payouts",
  "menu.viewSite": "View site",
  "menu.profile": "Profile",
  "menu.wishlist": "Wishlist",
  "menu.appointments": "Appointments",
  "menu.notifications": "Notifications",
  "menu.accountSettings": "Account settings",
  "menu.referHost": "Refer a host",
  "menu.hostStudio": "Host studio",
  "menu.becomeHost": "Become a host",
  "menu.invoices": "Invoices",
  "menu.paymentMethods": "Payment methods",
  "menu.developer": "Developer",
  "menu.language": "Language",
  "menu.signOut": "Sign out",
  "menu.signingOut": "Signing out…",
  "menu.noReviews": "No reviews yet",
  "menu.review": "review",
  "menu.reviews": "reviews",
  "menu.account": "account",

  // Roles
  "role.guest": "guest",
  "role.host": "host",
  "role.admin": "admin",

  // Language dialog
  "lang.title": "Language",
  "lang.subtitle": "Choose how the site is shown to you.",
  "lang.english": "English",
  "lang.spanish": "Spanish",
  "lang.close": "Close",

  // Home page
  "home.title": "Services",
  "home.subtitle":
    "Book talented local pros tell us where, when, and who's coming.",
  "home.heroTitle": "Find unforgettable local experiences",
  "home.heroTitleAccent": "anytime, anywhere.",
  "home.heroSubtitle":
    "Discover and book amazing activities, tours, and services from trusted local experts.",
  "home.clearFilters": "Clear filters",
  "home.allCategories": "All",
  "home.tabExperiences": "Experiences",
  "home.tabServices": "Services",
  "home.experience": "experience",
  "home.experiences": "experiences",
  "home.service": "service",
  "home.services": "services",
  "home.result": "result",
  "home.results": "results",
  "home.matchFilters": "match your filters",
  "home.available": "available",
  "home.noResults": "No services found. Try widening your filters.",
  "home.loadError": "Something went wrong loading services.",
  "home.tryAgain": "Try again",

  // Marketplace search
  "search.where": "Where are you going?",
  "search.what": "What are you looking for?",
  "search.when": "When?",
  "search.wherePlaceholder": "Any location",
  "search.anyActivity": "Any activity",
  "search.search": "Search",
  "search.startSearch": "Start your search",

  // Service detail
  "service.allServices": "All services",
  "service.about": "About",
  "service.details": "Details",
  "service.menu": "Menu",
  "service.itinerary": "Itinerary",
  "service.gallery": "Gallery",
  "service.included": "What's included",
  "service.goodToKnow": "Good to know",
  "service.reviews": "Reviews",
  "service.review": "review",
  "service.reviewsCount": "reviews",
  "service.noReviews": "No reviews yet.",
  "service.share": "Share",
  "service.linkCopied": "Link copied!",
  "service.availability": "Availability",
  "service.duration": "Duration",
  "service.capacity": "Capacity",
  "service.format": "Format",
  "service.location": "Location",
  "service.people": "people",
  "service.person": "person",
  "service.hostedBy": "Hosted by",
  "service.verifiedHost": "Verified host",
  "service.theHost": "the host",
  "service.noChargeUntilConfirm":
    "You won't be charged until your host confirms.",
  "service.format.publicGroup": "Public group",
  "service.format.privateGroup": "Private group",
  "service.format.oneOnOne": "One-on-one",
  "service.format.classWorkshop": "Class / workshop",
  "service.locationType.atHost": "At the host's place",
  "service.locationType.atGuest": "At your location",
  "service.locationType.online": "Online",
  "service.pricing.perPerson": "/ person",
  "service.pricing.perBooking": "/ booking",

  // Availability calendar
  "calendar.mon": "Mon",
  "calendar.tue": "Tue",
  "calendar.wed": "Wed",
  "calendar.thu": "Thu",
  "calendar.fri": "Fri",
  "calendar.sat": "Sat",
  "calendar.sun": "Sun",
  "calendar.noAvailability":
    "The host hasn't set availability for this service yet.",
  "calendar.prevMonth": "Previous month",
  "calendar.nextMonth": "Next month",
  "calendar.hint": "Highlighted days are available. Pick one to book.",

  // Reserve button
  "reserve.fullyBooked": "Fully booked",
  "reserve.reserve": "Reserve",
  "reserve.signInToReserve": "Sign in to reserve",

  // Favorite button
  "favorite.add": "Add to favorites",
  "favorite.remove": "Remove from favorites",

  // Menu carousel
  "menuCarousel.prev": "Previous",
  "menuCarousel.next": "Next",
  "menuCarousel.page": "Page {n}",

  // Location section
  "locationMap.title": "Where you'll be",
  "locationMap.online":
    "This is an online experience. Joining details are shared after booking.",
  "locationMap.atGuest":
    "The host travels to your location. You'll confirm the exact address when you book.",
  "locationMap.mapTitle": "Map showing the approximate location",
  "locationMap.approx":
    "Approximate location. The exact address is shared after booking.",

  // Service chat
  "chat.title": "Message the host",
  "chat.signIn": "Sign in",
  "chat.askSuffix": "to ask {host} a question about this service.",
  "chat.hostNote":
    "This is your service. Guest messages will appear in your host inbox.",
  "chat.noMessages": "No messages yet. Say hello to {host} 👋",
  "chat.networkError": "Network error. Please try again.",
  "chat.sendError": "Could not send your message.",
  "chat.placeholder": "Message {host}…",
  "chat.send": "Send",

  // Booking modal
  "booking.titleConfirmed": "Booking confirmed",
  "booking.titlePayment": "Complete your payment",
  "booking.titleChoose": "Choose date & time",
  "booking.close": "Close",
  "booking.confirmedThanks": "Thanks! Your booking is confirmed.",
  "booking.dateAtTime": "{date} at {time}",
  "booking.done": "Done",
  "booking.appointment": "Appointment:",
  "booking.orCrypto": "or pay with crypto",
  "booking.noAvailability":
    "This service has no availability set yet. Please check back later.",
  "booking.availableOn": "Available on {days}.",
  "booking.yourLocation": "Your location",
  "booking.locationPrompt":
    "This host travels to you. Share your location so we can confirm you're within their travel range.",
  "booking.locating": "Locating…",
  "booking.locationShared": "Location shared ✓",
  "booking.shareLocation": "Share my location",
  "booking.geoUnavailable": "Geolocation isn't available in this browser.",
  "booking.geoDenied":
    "Couldn't get your location. Allow access and try again.",
  "booking.checkingDistance": "Checking your distance…",
  "booking.withinRange": "✓ You're within range (~{min} min away).",
  "booking.tooFar":
    "✗ Too far, ~{min} min away (host travels up to {max} min). You can't book this service.",
  "booking.locationNoted":
    "Location noted. This host hasn't set a travel limit.",
  "booking.routeCaption": "Route from the host (A) to you (B).",
  "booking.mapTitle": "Host and your location",
  "booking.chooseOption": "Choose an option",
  "booking.date": "Date",
  "booking.notAvailableOn": "Not available on {day}. Pick another day.",
  "booking.windowTooShort":
    "The available window is too short for this {min}-minute service.",
  "booking.startTime": "Start time",
  "booking.selectTime": "Select a time…",
  "booking.slotMeta": "{min} min · within {start}–{end}",
  "booking.networkError": "Network error. Please try again.",
  "booking.checkoutFailed": "Checkout failed ({status}).",
  "booking.noPayment": "No payment was started. Please try again.",
  "booking.continuePayment": "Continue to payment",

  // Payment form
  "pay.genericError": "Something went wrong. Please try again.",
  "pay.failed": "Payment failed.",
  "pay.incomplete": "Payment could not be completed.",
  "pay.payAmount": "Pay {amount}",
  "pay.pay": "Pay",
  "pay.useNewCard": "Use a new card",
  "pay.processing": "Processing…",
  "pay.securedByStripe": "Payments are processed securely by Stripe.",

  // USDC payment
  "usdc.notConfigured": "USDC payments aren't configured yet.",
  "usdc.noWallet":
    "No Ethereum wallet found. Install MetaMask to pay with USDC.",
  "usdc.failed": "Payment failed or was rejected.",
  "usdc.recordError":
    "Your payment was sent but we couldn't confirm the booking. Please contact support with your transaction hash.",
  "usdc.sent": "USDC payment sent ✓",
  "usdc.confirmWallet": "Confirm in your wallet…",
  "usdc.payWith": "Pay {amount} with USDC",

  // Card fields
  "card.number": "Card number",
  "card.expiry": "Expiry",
  "card.cvc": "CVC",

  // Favorites page
  "fav.metaTitle": "Your favorites",
  "fav.title": "Your favorites",
  "fav.subtitle": "Services you've saved to come back to.",
  "fav.empty": "You haven't saved any services yet.",
  "fav.browse": "Browse services",
  "fav.view": "View service",

  // Host onboarding wizard
  "onb.back": "Back",
  "onb.aboutTitle": "Tell us about yourself",
  "onb.aboutSubtitle": "A few details to set up your host profile.",
  "onb.firstName": "First name",
  "onb.lastName": "Last name",
  "onb.dob": "Date of birth",
  "onb.ageNote": "You must be at least 18 to host.",
  "onb.email": "Email",
  "onb.terms":
    "By selecting Agree and continue, you agree to our Terms of Service and acknowledge our Privacy Policy.",
  "onb.belongTitle": "Everyone belongs here",
  "onb.belongBody":
    "When you join, we ask you to agree to our Community Commitment: to treat everyone, regardless of their race, religion, national origin, ethnicity, disability, sex, gender identity, sexual orientation, or age, with respect, and without judgment or bias.",
  "onb.agree": "Agree and continue",
  "onb.decline": "Decline",
  "onb.whichService": "Which service will you provide?",
  "onb.whereTitle": "Where will you offer your service?",
  "onb.enterCity": "Enter a city",
  "onb.createTitle": "Create your listing",
  "onb.createBody":
    "Tell us about you and the service you offer. We'll review your listing to confirm it meets our requirements.",
  "onb.next": "Next",
  "onb.settingUp": "Setting up…",
  "onb.searchCity": "Search for a city",
  "onb.suggested": "Suggested",
  "onb.noCities": "No cities found.",
  "onb.yourService": "Your service",

  // Host-an-experience landing
  "hae.heroTitle": "OFFER WHAT YOU\ndo, book what\nyou need !",
  "hae.heroSubtitle":
    "Create a one-of-a-kind experience for guests across your city.",
  "hae.feedTomorrow": "Tomorrow in your city",
  "hae.featuredTitle": "BRING THE BEST OF YOUR CITY TO LIFE",
  "hae.featuredSubtitle":
    "Join a marketplace of local experiences led by people like you.",
  "hae.featLina": "Lina hosts pasta nights in her home kitchen",
  "hae.featMarco": "Marco leads sunrise yoga sessions in the park",
  "hae.featSara": "Sara styles guests for a night out",
  "hae.meet": "Meet {name} →",
  "hae.exploreTitle": "Find the experience only you can host",
  "hae.exploreSubtitle": "Tap a category and see what's possible.",
  "hae.faqTitle": "Your questions, answered",
  "hae.faq1Q": "Is my experience right for Gathra?",
  "hae.faq1A":
    "If you can share it with others, you can host it: cooking, classes, wellness, beauty, home services, and more. The best experiences are personal, hands-on, and led by someone who loves what they do.",
  "hae.faq2Q": "How do I get started?",
  "hae.faq2A":
    "Share a bit about yourself and your experience, add photos and details, set your price and availability, and publish. Most hosts have their first listing live within an afternoon.",
  "hae.faq3Q": "What does it cost?",
  "hae.faq3A":
    "It's free to create a listing. Gathra only takes a small service fee from each booking once you get paid, so there's no risk in getting started.",
  "hae.faq4Q": "When and how do I get paid?",
  "hae.faq4A":
    "Guests pay securely up front. After each completed experience, your payout is sent to your bank account or wallet. Most hosts see funds within a day.",
  "hae.faq5Q": "Do I need to host full-time?",
  "hae.faq5A":
    "No. You open only the dates and times you want. Host once a month or every weekend; it's entirely up to you.",
  "hae.ctaTitle": "Ready to start hosting?",
  "hae.ctaSubtitle":
    "It takes minutes to create your listing, and it's free to start.",
  "hae.backToMarket": "Back to marketplace",
  "hae.startOffering": "Start offering",
  "hae.findHelp": "Find help",
  "hae.perkFees": "6–10% fees",
  "hae.perkPayments": "Cash or crypto",
  "hae.perkReferral": "Earn by referring",

  // Why Gathra  platform differentiators (home)
  "why.title": "WHY PEOPLE CHOOSE GATHRA",
  "why.subtitle":
    "A marketplace built around people, fair fees, and open technology.",
  "why.moreEyebrow": "Beyond the fees",
  "why.moreTitle": "Built around people, not transactions",
  "why.moreSubtitle":
    "The added value you won't find on the platforms charging you double.",
  "why.communityKicker": "Local & personal",
  "why.communityTitle": "Real human connection",
  "why.communityBody":
    "Every booking connects one person to another  in person, not a transaction with a faceless brand.",
  "why.communityCta": "Find hosts near you",
  "why.feesEyebrow": "Stop overpaying",
  "why.feesTitle": "Everyone takes a cut. We take the smallest.",
  "why.calcPriceLabel": "Drag your booking price",
  "why.calcKept": "stays with you",
  "why.calcVsAvg": "vs the average platform",
  "why.calcTakeHeading": "Here's what each platform takes from it",
  "why.feesLowest": "Lowest",
  "why.feesPunchline":
    "Others grab up to 25% of every booking. With Gathra you keep up to 94%.",
  "why.feesFootnote": "Approximate published platform commissions, for comparison.",
  "why.feesBody":
    "We keep things fair and transparent  just a 10% fee, and in some cases, 4% is reinvested back into the community. Unlike  platforms like Airbnb that take 15–25%, our model is designed so more value stays with the people actually building and using the platform",
  "why.feesOurs": "6–10%",
  "why.feesOursLabel": "Gathra fee",
  "why.feesTheirs": "15–25%",
  "why.feesTheirsLabel": "typical platforms",
  "why.referralsKicker": "+4% back",
  "why.referralsTitle": "Earn by referring hosts",
  "why.referralsBody":
    "Share a host's link. When a guest you referred books, you earn 4% of the fee  automatically.",
  "why.referralsCta": "Get your invite link",
  "why.paymentsKicker": "Card or crypto",
  "why.paymentsTitle": "Pay with fiat or crypto",
  "why.paymentsBody":
    "Check out with a card or crypto, and get paid the same way  whatever works for you.",
  "why.paymentsCta": "Start booking",
  "why.apiKicker": "Agent-ready",
  "why.apiTitle": "Open API, agent-ready",
  "why.apiBody":
    "Build on Gathra with our open API  and let AI agents browse and book on your behalf.",
  "why.apiCta": "Read the API docs",

  // Host-an-experience explorer
  "exp.cat.Cooking": "Cooking",
  "exp.cat.Wellness": "Wellness",
  "exp.cat.Beauty": "Beauty",
  "exp.cat.Teaching": "Teaching",
  "exp.cat.Home": "Home",
  "exp.cat.Auto": "Auto",
  "exp.blurb.Cooking": "Dinners, tastings, and hands-on cooking classes.",
  "exp.blurb.Wellness": "Yoga, training, and outdoor sessions guests love.",
  "exp.blurb.Beauty": "Makeup, hair, and beauty experiences at home.",
  "exp.blurb.Teaching": "Share a skill, craft, or subject you know well.",
  "exp.blurb.Home": "Cleaning, repairs, and handy work done right.",
  "exp.blurb.Auto": "Auto, tech, and on-demand local services.",
  "exp.earnAround": "{cat} hosts earn around",
  "exp.perMonth": "/ month",
  "exp.startWith": "Start with {cat}",
  "exp.disclaimer":
    "Illustrative averages. Your earnings depend on pricing, demand, and how often you host.",
  "exp.perGuest": "{price} / guest",
  "exp.hostedBy": "Hosted by {name}",
  "exp.book": "Book",

  // Auth modal
  "auth.invalidEmail": "Enter a valid email address.",
  "auth.sendCodeError": "We couldn't send a code. Please try again.",
  "auth.enterCode": "Enter the 6-digit code.",
  "auth.codeWrong": "That code isn't right or has expired.",
  "auth.enterPassword": "Enter your password.",
  "auth.credsWrong": "That email or password isn't right.",
  "auth.enterName": "Enter your first and last name.",
  "auth.selectDob": "Select your date of birth.",
  "auth.passwordLen": "Password must be at least 8 characters.",
  "auth.createError":
    "We couldn't create your account. That email may already be registered.",
  "auth.headerEmail": "Log in or sign up",
  "auth.headerOtp": "Confirm it's you",
  "auth.headerPassword": "Enter your password",
  "auth.headerProfile": "Finish signing up",
  "auth.welcome": "Welcome to Gathra",
  "auth.emailHint": "We'll email you a confirmation code to sign in.",
  "auth.passwordHint": "Enter your password on the next step to sign in.",
  "auth.sending": "Sending…",
  "auth.continue": "Continue",
  "auth.codeSentTo": "We sent a code to {email}.",
  "auth.verifying": "Verifying…",
  "auth.didntGet": "Didn't get it?",
  "auth.resend": "Send a new code",
  "auth.sent": "Sent ✓",
  "auth.enterPasswordFor": "Enter the password for {email}.",
  "auth.yourPassword": "Your password",
  "auth.hide": "Hide",
  "auth.show": "Show",
  "auth.signingIn": "Signing in…",
  "auth.newHere": "New here?",
  "auth.createAccount": "Create an account",
  "auth.legalName": "Legal name",
  "auth.nameHint": "Make sure it matches the name on your government ID.",
  "auth.password": "Password",
  "auth.createPassword": "Create a password",
  "auth.termsPrefix": "By selecting",
  "auth.termsSuffix":
    ", I agree to the Terms of Service and acknowledge the Privacy Policy.",
  "auth.finishing": "Finishing…",
  "auth.or": "or",
  "auth.continueGoogle": "Continue with Google",
  "auth.redirecting": "Redirecting…",
  "auth.googleUnavailable": "Google sign-in is unavailable right now.",

  // Profile page
  "profile.metaTitle": "Profile",
  "profile.title": "Profile",
  "profile.subtitle": "Your account details on Local Experiences.",
  "profile.fullName": "Full name",
  "profile.accountType": "Account type",
  "profile.memberSince": "Member since",
  "profile.verified": "Verified",

  // Refer page
  "refer.metaTitle": "Refer & earn",
  "refer.title": "Refer & earn",
  "refer.subtitle":
    "Share a service through your link. When someone books it, you earn 4% of the booking — paid out to you.",

  // Notifications page
  "notif.metaTitle": "Notifications",
  "notif.title": "Notifications",
  "notif.subtitle": "Booking updates and messages will show up here.",
  "notif.caughtUp": "You're all caught up",
  "notif.empty":
    "No notifications yet. When you book an experience or a host messages you, you'll see it here.",

  // Appointments page
  "appt.metaTitle": "Your appointments",
  "appt.title": "Your appointments",
  "appt.subtitle":
    "Upcoming and past bookings. Leave a review once a service is done.",
  "appt.current": "Current",
  "appt.past": "Past",
  "appt.canceled": "Canceled",
  "appt.emptyCurrent": "No upcoming appointments. Book a service to get started.",
  "appt.emptyPast": "Nothing here yet.",
  "appt.emptyCanceled": "No canceled appointments.",
  "appt.markCompleted": "Mark as completed",
  "appt.cancel": "Cancel",
  "appt.completed": "Completed",
  "appt.executed": "Executed",
  "appt.canceledBadge": "Canceled",
  "appt.refunded": "Refunded {amount}",
  "appt.cancelRefund": " · Cancel now for a {amount} refund",
  "appt.noRefund": " · No refund if you cancel now",
  "appt.updateRating": "Update your rating",
  "appt.howWasIt": "How was it?",
  "appt.reviewPlaceholder": "Share a few words for the host (optional)",
  "appt.updateReview": "Update review",
  "appt.submitReview": "Submit review",
  "appt.yourReview": "Your review",
  "appt.editReview": "Edit review",
  "appt.reportedNote": "You reported this host. Our team will review it.",
  "appt.reportHost": "Report host",
  "appt.reason": "Reason",
  "appt.reportPlaceholder": "Tell us what happened (optional)",
  "appt.submitReport": "Submit report",
  "appt.starsAria": "{rating} out of 5",
  "appt.reason.no_show": "Host didn't show up",
  "appt.reason.inappropriate": "Inappropriate behavior",
  "appt.reason.safety": "Safety concern",
  "appt.reason.scam": "Scam or fraud",
  "appt.reason.other": "Other",

  // Referrals — referring a service & earning a commission
  "ref.refer": "Refer & earn",
  "ref.referThis": "Refer this service",
  "ref.referDesc": "Share your link. You earn 4% when someone books through it.",
  "ref.signInToRefer": "Sign in to refer & earn",
  "ref.addPayoutFirst": "Add a payout method to start referring.",
  "ref.setUpPayout": "Set up payouts",
  "ref.getLink": "Get referral link",
  "ref.generating": "Generating…",
  "ref.newReady": "Your referral link is ready",
  "ref.shareOnce":
    "Share it with someone who'd book this. It works once and expires {date}.",
  "ref.copied": "Copied",
  "ref.copy": "Copy",
  "ref.forService": "for {service}",
  "ref.created": "Created {date}",
  "ref.used": "Booked {date}",
  "ref.expires": "Expires {date}",
  "ref.status.active": "active",
  "ref.status.redeemed": "booked",
  "ref.status.expired": "expired",
  // Referral payouts + earnings
  "ref.payoutTitle": "Payout method",
  "ref.payoutDesc":
    "Where we send your referral earnings. You only need to set this up once.",
  "ref.payoutSave": "Save payout method",
  "ref.payoutSaving": "Saving…",
  "ref.payoutSaved": "Payout method saved.",
  "ref.earningsTitle": "Your earnings",
  "ref.owed": "Owed to you",
  "ref.paid": "Paid out",
  "ref.earnEmpty": "No earnings yet. Share a link to start earning.",
  "ref.earn.pending": "pending",
  "ref.earn.owed": "owed",
  "ref.earn.paid": "paid",
  "ref.earn.reversed": "reversed",
  "ref.linksTitle": "Your links",
  "ref.linksEmpty": "No links yet. Open a service and tap “Refer & earn.”",

  // Countdown
  "cd.startingNow": "Starting now",
  "cd.timeLeft": "{time} left",
} as const;

export type TranslationKey = keyof typeof en;

const es: Record<TranslationKey, string> = {
  // Navbar
  "nav.marketplace": "Mercado",
  "nav.admin": "Administración",
  "nav.favorites": "Favoritos",
  "nav.signIn": "Iniciar sesión",
  "nav.getStarted": "Comenzar",
  "nav.explore": "Explorar",

  // User menu
  "menu.switchToHosting": "Cambiar a anfitrión",
  "menu.switchToGuest": "Cambiar a invitado",
  "menu.today": "Hoy",
  "menu.calendar": "Calendario",
  "menu.listings": "Anuncios",
  "menu.messages": "Mensajes",
  "menu.bookings": "Reservas",
  "menu.newListing": "Nuevo anuncio",
  "menu.payouts": "Pagos",
  "menu.viewSite": "Ver sitio",
  "menu.profile": "Perfil",
  "menu.wishlist": "Lista de deseos",
  "menu.appointments": "Citas",
  "menu.notifications": "Notificaciones",
  "menu.accountSettings": "Configuración de cuenta",
  "menu.referHost": "Recomendar un anfitrión",
  "menu.hostStudio": "Estudio de anfitrión",
  "menu.becomeHost": "Conviértete en anfitrión",
  "menu.invoices": "Facturas",
  "menu.paymentMethods": "Métodos de pago",
  "menu.developer": "Desarrollador",
  "menu.language": "Idioma",
  "menu.signOut": "Cerrar sesión",
  "menu.signingOut": "Cerrando sesión…",
  "menu.noReviews": "Sin reseñas todavía",
  "menu.review": "reseña",
  "menu.reviews": "reseñas",
  "menu.account": "cuenta",

  // Roles
  "role.guest": "invitado",
  "role.host": "anfitrión",
  "role.admin": "administrador",

  // Language dialog
  "lang.title": "Idioma",
  "lang.subtitle": "Elige cómo se muestra el sitio.",
  "lang.english": "Inglés",
  "lang.spanish": "Español",
  "lang.close": "Cerrar",

  // Home page
  "home.title": "Servicios",
  "home.subtitle":
    "Reserva profesionales locales. Dinos dónde, cuándo y quién asistirá.",
  "home.heroTitle": "Encuentra experiencias locales inolvidables",
  "home.heroTitleAccent": "cuando quieras, donde quieras.",
  "home.heroSubtitle":
    "Descubre y reserva actividades, tours y servicios increíbles de expertos locales de confianza.",
  "home.clearFilters": "Borrar filtros",
  "home.allCategories": "Todo",
  "home.tabExperiences": "Experiencias",
  "home.tabServices": "Servicios",
  "home.experience": "experiencia",
  "home.experiences": "experiencias",
  "home.service": "servicio",
  "home.services": "servicios",
  "home.result": "resultado",
  "home.results": "resultados",
  "home.matchFilters": "coinciden con tus filtros",
  "home.available": "disponibles",
  "home.noResults":
    "No se encontraron servicios. Intenta ampliar tus filtros.",
  "home.loadError": "Algo salió mal al cargar los servicios.",
  "home.tryAgain": "Reintentar",

  // Marketplace search
  "search.where": "¿A dónde vas?",
  "search.what": "¿Qué estás buscando?",
  "search.when": "¿Cuándo?",
  "search.wherePlaceholder": "Cualquier lugar",
  "search.anyActivity": "Cualquier actividad",
  "search.search": "Buscar",
  "search.startSearch": "Empieza tu búsqueda",

  // Service detail
  "service.allServices": "Todos los servicios",
  "service.about": "Acerca de",
  "service.details": "Detalles",
  "service.menu": "Menú",
  "service.itinerary": "Itinerario",
  "service.gallery": "Galería",
  "service.included": "Qué incluye",
  "service.goodToKnow": "Información útil",
  "service.reviews": "Reseñas",
  "service.review": "reseña",
  "service.reviewsCount": "reseñas",
  "service.noReviews": "Aún no hay reseñas.",
  "service.share": "Compartir",
  "service.linkCopied": "¡Enlace copiado!",
  "service.availability": "Disponibilidad",
  "service.duration": "Duración",
  "service.capacity": "Capacidad",
  "service.format": "Formato",
  "service.location": "Ubicación",
  "service.people": "personas",
  "service.person": "persona",
  "service.hostedBy": "Ofrecido por",
  "service.verifiedHost": "Anfitrión verificado",
  "service.theHost": "el anfitrión",
  "service.noChargeUntilConfirm":
    "No se te cobrará hasta que el anfitrión confirme.",
  "service.format.publicGroup": "Grupo público",
  "service.format.privateGroup": "Grupo privado",
  "service.format.oneOnOne": "Individual",
  "service.format.classWorkshop": "Clase / taller",
  "service.locationType.atHost": "En el lugar del anfitrión",
  "service.locationType.atGuest": "En tu ubicación",
  "service.locationType.online": "En línea",
  "service.pricing.perPerson": "/ persona",
  "service.pricing.perBooking": "/ reserva",

  // Availability calendar
  "calendar.mon": "Lun",
  "calendar.tue": "Mar",
  "calendar.wed": "Mié",
  "calendar.thu": "Jue",
  "calendar.fri": "Vie",
  "calendar.sat": "Sáb",
  "calendar.sun": "Dom",
  "calendar.noAvailability":
    "El anfitrión aún no ha definido la disponibilidad de este servicio.",
  "calendar.prevMonth": "Mes anterior",
  "calendar.nextMonth": "Mes siguiente",
  "calendar.hint":
    "Los días resaltados están disponibles. Elige uno para reservar.",

  // Reserve button
  "reserve.fullyBooked": "Agotado",
  "reserve.reserve": "Reservar",
  "reserve.signInToReserve": "Inicia sesión para reservar",

  // Favorite button
  "favorite.add": "Añadir a favoritos",
  "favorite.remove": "Quitar de favoritos",

  // Menu carousel
  "menuCarousel.prev": "Anterior",
  "menuCarousel.next": "Siguiente",
  "menuCarousel.page": "Página {n}",

  // Location section
  "locationMap.title": "Dónde estarás",
  "locationMap.online":
    "Esta es una experiencia en línea. Los detalles para unirse se comparten después de reservar.",
  "locationMap.atGuest":
    "El anfitrión se desplaza a tu ubicación. Confirmarás la dirección exacta al reservar.",
  "locationMap.mapTitle": "Mapa que muestra la ubicación aproximada",
  "locationMap.approx":
    "Ubicación aproximada. La dirección exacta se comparte después de reservar.",

  // Service chat
  "chat.title": "Escribe al anfitrión",
  "chat.signIn": "Inicia sesión",
  "chat.askSuffix": "para hacerle una pregunta a {host} sobre este servicio.",
  "chat.hostNote":
    "Este es tu servicio. Los mensajes de los invitados aparecerán en tu bandeja de anfitrión.",
  "chat.noMessages": "Aún no hay mensajes. Saluda a {host} 👋",
  "chat.networkError": "Error de red. Inténtalo de nuevo.",
  "chat.sendError": "No se pudo enviar tu mensaje.",
  "chat.placeholder": "Escribe a {host}…",
  "chat.send": "Enviar",

  // Booking modal
  "booking.titleConfirmed": "Reserva confirmada",
  "booking.titlePayment": "Completa tu pago",
  "booking.titleChoose": "Elige fecha y hora",
  "booking.close": "Cerrar",
  "booking.confirmedThanks": "¡Gracias! Tu reserva está confirmada.",
  "booking.dateAtTime": "{date} a las {time}",
  "booking.done": "Listo",
  "booking.appointment": "Cita:",
  "booking.orCrypto": "o paga con cripto",
  "booking.noAvailability":
    "Este servicio aún no tiene disponibilidad. Vuelve más tarde.",
  "booking.availableOn": "Disponible los {days}.",
  "booking.yourLocation": "Tu ubicación",
  "booking.locationPrompt":
    "Este anfitrión se desplaza hasta ti. Comparte tu ubicación para confirmar que estás dentro de su rango de desplazamiento.",
  "booking.locating": "Localizando…",
  "booking.locationShared": "Ubicación compartida ✓",
  "booking.shareLocation": "Compartir mi ubicación",
  "booking.geoUnavailable":
    "La geolocalización no está disponible en este navegador.",
  "booking.geoDenied":
    "No se pudo obtener tu ubicación. Permite el acceso e inténtalo de nuevo.",
  "booking.checkingDistance": "Comprobando tu distancia…",
  "booking.withinRange": "✓ Estás dentro del rango (~{min} min de distancia).",
  "booking.tooFar":
    "✗ Demasiado lejos, ~{min} min de distancia (el anfitrión se desplaza hasta {max} min). No puedes reservar este servicio.",
  "booking.locationNoted":
    "Ubicación registrada. Este anfitrión no ha definido un límite de desplazamiento.",
  "booking.routeCaption": "Ruta del anfitrión (A) a ti (B).",
  "booking.mapTitle": "Ubicación del anfitrión y la tuya",
  "booking.chooseOption": "Elige una opción",
  "booking.date": "Fecha",
  "booking.notAvailableOn": "No disponible el {day}. Elige otro día.",
  "booking.windowTooShort":
    "La franja disponible es demasiado corta para este servicio de {min} minutos.",
  "booking.startTime": "Hora de inicio",
  "booking.selectTime": "Selecciona una hora…",
  "booking.slotMeta": "{min} min · dentro de {start}–{end}",
  "booking.networkError": "Error de red. Inténtalo de nuevo.",
  "booking.checkoutFailed": "El pago falló ({status}).",
  "booking.noPayment": "No se inició ningún pago. Inténtalo de nuevo.",
  "booking.continuePayment": "Continuar al pago",

  // Payment form
  "pay.genericError": "Algo salió mal. Inténtalo de nuevo.",
  "pay.failed": "El pago falló.",
  "pay.incomplete": "No se pudo completar el pago.",
  "pay.payAmount": "Pagar {amount}",
  "pay.pay": "Pagar",
  "pay.useNewCard": "Usar una tarjeta nueva",
  "pay.processing": "Procesando…",
  "pay.securedByStripe":
    "Los pagos se procesan de forma segura con Stripe.",

  // USDC payment
  "usdc.notConfigured": "Los pagos con USDC aún no están configurados.",
  "usdc.noWallet":
    "No se encontró ninguna cartera Ethereum. Instala MetaMask para pagar con USDC.",
  "usdc.failed": "El pago falló o fue rechazado.",
  "usdc.recordError":
    "Tu pago se envió pero no pudimos confirmar la reserva. Contacta con soporte con el hash de tu transacción.",
  "usdc.sent": "Pago en USDC enviado ✓",
  "usdc.confirmWallet": "Confirma en tu cartera…",
  "usdc.payWith": "Pagar {amount} con USDC",

  // Card fields
  "card.number": "Número de tarjeta",
  "card.expiry": "Vencimiento",
  "card.cvc": "CVC",

  // Favorites page
  "fav.metaTitle": "Tus favoritos",
  "fav.title": "Tus favoritos",
  "fav.subtitle": "Servicios que guardaste para volver a verlos.",
  "fav.empty": "Aún no has guardado ningún servicio.",
  "fav.browse": "Explorar servicios",
  "fav.view": "Ver servicio",

  // Host onboarding wizard
  "onb.back": "Atrás",
  "onb.aboutTitle": "Cuéntanos sobre ti",
  "onb.aboutSubtitle": "Algunos datos para configurar tu perfil de anfitrión.",
  "onb.firstName": "Nombre",
  "onb.lastName": "Apellido",
  "onb.dob": "Fecha de nacimiento",
  "onb.ageNote": "Debes tener al menos 18 años para ser anfitrión.",
  "onb.email": "Correo electrónico",
  "onb.terms":
    "Al seleccionar Aceptar y continuar, aceptas nuestros Términos de servicio y reconoces nuestra Política de privacidad.",
  "onb.belongTitle": "Aquí todos pertenecen",
  "onb.belongBody":
    "Cuando te unes, te pedimos que aceptes nuestro Compromiso de comunidad: tratar a todas las personas, sin importar su raza, religión, origen nacional, etnia, discapacidad, sexo, identidad de género, orientación sexual o edad, con respeto y sin juicios ni prejuicios.",
  "onb.agree": "Aceptar y continuar",
  "onb.decline": "Rechazar",
  "onb.whichService": "¿Qué servicio ofrecerás?",
  "onb.whereTitle": "¿Dónde ofrecerás tu servicio?",
  "onb.enterCity": "Ingresa una ciudad",
  "onb.createTitle": "Crea tu anuncio",
  "onb.createBody":
    "Cuéntanos sobre ti y el servicio que ofreces. Revisaremos tu anuncio para confirmar que cumple nuestros requisitos.",
  "onb.next": "Siguiente",
  "onb.settingUp": "Configurando…",
  "onb.searchCity": "Busca una ciudad",
  "onb.suggested": "Sugeridas",
  "onb.noCities": "No se encontraron ciudades.",
  "onb.yourService": "Tu servicio",

  // Host-an-experience landing
  "hae.heroTitle": "HAZ LO QUE AMAS. Cobra por ello.",
  "hae.heroSubtitle":
    "Crea una experiencia única para invitados de toda tu ciudad.",
  "hae.feedTomorrow": "Mañana en tu ciudad",
  "hae.featuredTitle": "Da vida a lo mejor de tu ciudad",
  "hae.featuredSubtitle":
    "Únete a un mercado de experiencias locales lideradas por personas como tú.",
  "hae.featLina": "Lina ofrece noches de pasta en su cocina",
  "hae.featMarco": "Marco dirige sesiones de yoga al amanecer en el parque",
  "hae.featSara": "Sara prepara a los invitados para una noche de fiesta",
  "hae.meet": "Conoce a {name} →",
  "hae.exploreTitle": "Encuentra la experiencia que solo tú puedes ofrecer",
  "hae.exploreSubtitle": "Toca una categoría y descubre lo que es posible.",
  "hae.faqTitle": "Tus preguntas, respondidas",
  "hae.faq1Q": "¿Mi experiencia es adecuada para Gathra?",
  "hae.faq1A":
    "Si puedes compartirla con otros, puedes ofrecerla: cocina, clases, bienestar, belleza, servicios para el hogar y más. Las mejores experiencias son personales, prácticas y guiadas por alguien que ama lo que hace.",
  "hae.faq2Q": "¿Cómo empiezo?",
  "hae.faq2A":
    "Cuéntanos un poco sobre ti y tu experiencia, añade fotos y detalles, fija tu precio y disponibilidad, y publica. La mayoría de los anfitriones tienen su primer anuncio activo en una tarde.",
  "hae.faq3Q": "¿Cuánto cuesta?",
  "hae.faq3A":
    "Crear un anuncio es gratis. Gathra solo cobra una pequeña comisión de servicio por cada reserva una vez que recibes el pago, así que no hay riesgo en empezar.",
  "hae.faq4Q": "¿Cuándo y cómo me pagan?",
  "hae.faq4A":
    "Los invitados pagan de forma segura por adelantado. Después de cada experiencia completada, tu pago se envía a tu cuenta bancaria o cartera. La mayoría de los anfitriones reciben los fondos en un día.",
  "hae.faq5Q": "¿Necesito ser anfitrión a tiempo completo?",
  "hae.faq5A":
    "No. Abres solo las fechas y horas que quieras. Ofrece tu experiencia una vez al mes o cada fin de semana; depende totalmente de ti.",
  "hae.ctaTitle": "¿Listo para empezar a ser anfitrión?",
  "hae.ctaSubtitle":
    "Crear tu anuncio toma minutos, y empezar es gratis.",
  "hae.backToMarket": "Volver al mercado",
  "hae.startOffering": "Empieza a ofrecer",
  "hae.findHelp": "Busca ayuda",
  "hae.perkFees": "Comisión del 6–10 %",
  "hae.perkPayments": "Dinero o cripto",
  "hae.perkReferral": "Gana recomendando",

  // Why Gathra  platform differentiators (home)
  "why.title": "Por qué la gente elige Gathra",
  "why.subtitle":
    "Un mercado construido en torno a las personas, comisiones justas y tecnología abierta.",
  "why.moreEyebrow": "Más allá de las comisiones",
  "why.moreTitle": "Pensado para las personas, no para las transacciones",
  "why.moreSubtitle":
    "El valor añadido que no encontrarás en las plataformas que te cobran el doble.",
  "why.communityKicker": "Local y cercano",
  "why.communityTitle": "Conexión humana real",
  "why.communityBody":
    "Cada reserva conecta a una persona con otra  en persona, no una transacción con una marca sin rostro.",
  "why.communityCta": "Encuentra anfitriones cerca",
  "why.feesEyebrow": "Deja de pagar de más",
  "why.feesTitle": "Todos se llevan una parte. La nuestra es la más pequeña.",
  "why.calcPriceLabel": "Ajusta el precio de tu reserva",
  "why.calcKept": "se queda contigo",
  "why.calcVsAvg": "frente a la plataforma promedio",
  "why.calcTakeHeading": "Esto es lo que cada plataforma se lleva",
  "why.feesLowest": "La más baja",
  "why.feesPunchline":
    "Otros se llevan hasta el 25 % de cada reserva. Con Gathra te quedas con hasta el 94 %.",
  "why.feesFootnote":
    "Comisiones aproximadas publicadas por cada plataforma, a modo de comparación.",
  "why.feesBody":
    "Nuestra comisión es solo del 6–10 %. La mayoría de las plataformas cobran 15–25 %, así que conservas mucho más de cada reserva.",
  "why.feesOurs": "6–10 %",
  "why.feesOursLabel": "comisión de Gathra",
  "why.feesTheirs": "15–25 %",
  "why.feesTheirsLabel": "plataformas típicas",
  "why.referralsKicker": "+4% para ti",
  "why.referralsTitle": "Gana recomendando anfitriones",
  "why.referralsBody":
    "Comparte el enlace de un anfitrión. Cuando un huésped que recomendaste reserva, ganas el 4 % de la comisión  automáticamente.",
  "why.referralsCta": "Consigue tu enlace",
  "why.paymentsKicker": "Tarjeta o cripto",
  "why.paymentsTitle": "Paga con dinero o cripto",
  "why.paymentsBody":
    "Paga con tarjeta o cripto, y cobra de la misma forma  lo que mejor te funcione.",
  "why.paymentsCta": "Empieza a reservar",
  "why.apiKicker": "Lista para agentes",
  "why.apiTitle": "API abierta, lista para agentes",
  "why.apiBody":
    "Construye sobre Gathra con nuestra API abierta  y deja que agentes de IA exploren y reserven por ti.",
  "why.apiCta": "Lee la documentación",

  // Host-an-experience explorer
  "exp.cat.Cooking": "Cocina",
  "exp.cat.Wellness": "Bienestar",
  "exp.cat.Beauty": "Belleza",
  "exp.cat.Teaching": "Enseñanza",
  "exp.cat.Home": "Hogar",
  "exp.cat.Auto": "Auto",
  "exp.blurb.Cooking": "Cenas, degustaciones y clases de cocina prácticas.",
  "exp.blurb.Wellness":
    "Yoga, entrenamiento y sesiones al aire libre que encantan a los invitados.",
  "exp.blurb.Beauty": "Maquillaje, peinado y experiencias de belleza a domicilio.",
  "exp.blurb.Teaching": "Comparte una habilidad, oficio o materia que domines.",
  "exp.blurb.Home": "Limpieza, reparaciones y trabajos del hogar bien hechos.",
  "exp.blurb.Auto": "Servicios locales de auto, tecnología y a demanda.",
  "exp.earnAround": "Los anfitriones de {cat} ganan alrededor de",
  "exp.perMonth": "/ mes",
  "exp.startWith": "Empieza con {cat}",
  "exp.disclaimer":
    "Promedios ilustrativos. Tus ganancias dependen del precio, la demanda y la frecuencia con la que ofrezcas tu experiencia.",
  "exp.perGuest": "{price} / invitado",
  "exp.hostedBy": "Ofrecido por {name}",
  "exp.book": "Reservar",

  // Auth modal
  "auth.invalidEmail": "Ingresa un correo electrónico válido.",
  "auth.sendCodeError": "No pudimos enviar un código. Inténtalo de nuevo.",
  "auth.enterCode": "Ingresa el código de 6 dígitos.",
  "auth.codeWrong": "Ese código no es correcto o ha caducado.",
  "auth.enterPassword": "Ingresa tu contraseña.",
  "auth.credsWrong": "Ese correo o contraseña no es correcto.",
  "auth.enterName": "Ingresa tu nombre y apellido.",
  "auth.selectDob": "Selecciona tu fecha de nacimiento.",
  "auth.passwordLen": "La contraseña debe tener al menos 8 caracteres.",
  "auth.createError":
    "No pudimos crear tu cuenta. Ese correo puede estar ya registrado.",
  "auth.headerEmail": "Inicia sesión o regístrate",
  "auth.headerOtp": "Confirma que eres tú",
  "auth.headerPassword": "Ingresa tu contraseña",
  "auth.headerProfile": "Termina de registrarte",
  "auth.welcome": "Te damos la bienvenida a Gathra",
  "auth.emailHint":
    "Te enviaremos un código de confirmación por correo para iniciar sesión.",
  "auth.passwordHint":
    "Ingresa tu contraseña en el siguiente paso para iniciar sesión.",
  "auth.sending": "Enviando…",
  "auth.continue": "Continuar",
  "auth.codeSentTo": "Enviamos un código a {email}.",
  "auth.verifying": "Verificando…",
  "auth.didntGet": "¿No lo recibiste?",
  "auth.resend": "Enviar un código nuevo",
  "auth.sent": "Enviado ✓",
  "auth.enterPasswordFor": "Ingresa la contraseña de {email}.",
  "auth.yourPassword": "Tu contraseña",
  "auth.hide": "Ocultar",
  "auth.show": "Mostrar",
  "auth.signingIn": "Iniciando sesión…",
  "auth.newHere": "¿Eres nuevo?",
  "auth.createAccount": "Crear una cuenta",
  "auth.legalName": "Nombre legal",
  "auth.nameHint":
    "Asegúrate de que coincida con el nombre de tu identificación oficial.",
  "auth.password": "Contraseña",
  "auth.createPassword": "Crea una contraseña",
  "auth.termsPrefix": "Al seleccionar",
  "auth.termsSuffix":
    ", acepto los Términos de servicio y reconozco la Política de privacidad.",
  "auth.finishing": "Finalizando…",
  "auth.or": "o",
  "auth.continueGoogle": "Continuar con Google",
  "auth.redirecting": "Redirigiendo…",
  "auth.googleUnavailable":
    "El inicio de sesión con Google no está disponible en este momento.",

  // Profile page
  "profile.metaTitle": "Perfil",
  "profile.title": "Perfil",
  "profile.subtitle": "Los datos de tu cuenta en Local Experiences.",
  "profile.fullName": "Nombre completo",
  "profile.accountType": "Tipo de cuenta",
  "profile.memberSince": "Miembro desde",
  "profile.verified": "Verificado",

  // Refer page
  "refer.metaTitle": "Recomienda y gana",
  "refer.title": "Recomienda y gana",
  "refer.subtitle":
    "Comparte un servicio con tu enlace. Cuando alguien lo reserva, ganas el 4% de la reserva, pagado a ti.",

  // Notifications page
  "notif.metaTitle": "Notificaciones",
  "notif.title": "Notificaciones",
  "notif.subtitle": "Las novedades de reservas y los mensajes aparecerán aquí.",
  "notif.caughtUp": "Estás al día",
  "notif.empty":
    "Aún no hay notificaciones. Cuando reserves una experiencia o un anfitrión te escriba, lo verás aquí.",

  // Appointments page
  "appt.metaTitle": "Tus citas",
  "appt.title": "Tus citas",
  "appt.subtitle":
    "Reservas próximas y pasadas. Deja una reseña cuando termine un servicio.",
  "appt.current": "Actuales",
  "appt.past": "Pasadas",
  "appt.canceled": "Canceladas",
  "appt.emptyCurrent": "No hay citas próximas. Reserva un servicio para empezar.",
  "appt.emptyPast": "Aún no hay nada aquí.",
  "appt.emptyCanceled": "No hay citas canceladas.",
  "appt.markCompleted": "Marcar como completada",
  "appt.cancel": "Cancelar",
  "appt.completed": "Completada",
  "appt.executed": "Ejecutada",
  "appt.canceledBadge": "Cancelada",
  "appt.refunded": "Reembolsado {amount}",
  "appt.cancelRefund": " · Cancela ahora para un reembolso de {amount}",
  "appt.noRefund": " · Sin reembolso si cancelas ahora",
  "appt.updateRating": "Actualiza tu calificación",
  "appt.howWasIt": "¿Qué tal estuvo?",
  "appt.reviewPlaceholder": "Comparte unas palabras para el anfitrión (opcional)",
  "appt.updateReview": "Actualizar reseña",
  "appt.submitReview": "Enviar reseña",
  "appt.yourReview": "Tu reseña",
  "appt.editReview": "Editar reseña",
  "appt.reportedNote":
    "Reportaste a este anfitrión. Nuestro equipo lo revisará.",
  "appt.reportHost": "Reportar anfitrión",
  "appt.reason": "Motivo",
  "appt.reportPlaceholder": "Cuéntanos qué pasó (opcional)",
  "appt.submitReport": "Enviar reporte",
  "appt.starsAria": "{rating} de 5",
  "appt.reason.no_show": "El anfitrión no se presentó",
  "appt.reason.inappropriate": "Comportamiento inapropiado",
  "appt.reason.safety": "Problema de seguridad",
  "appt.reason.scam": "Estafa o fraude",
  "appt.reason.other": "Otro",

  // Referrals — recomendar un servicio y ganar una comisión
  "ref.refer": "Recomienda y gana",
  "ref.referThis": "Recomienda este servicio",
  "ref.referDesc": "Comparte tu enlace. Ganas el 4% cuando alguien reserva con él.",
  "ref.signInToRefer": "Inicia sesión para recomendar y ganar",
  "ref.addPayoutFirst": "Añade un método de pago para empezar a recomendar.",
  "ref.setUpPayout": "Configurar pagos",
  "ref.getLink": "Obtener enlace de recomendación",
  "ref.generating": "Generando…",
  "ref.newReady": "Tu enlace de recomendación está listo",
  "ref.shareOnce":
    "Compártelo con alguien que reservaría esto. Funciona una vez y caduca el {date}.",
  "ref.copied": "Copiado",
  "ref.copy": "Copiar",
  "ref.forService": "para {service}",
  "ref.created": "Creado {date}",
  "ref.used": "Reservado {date}",
  "ref.expires": "Caduca {date}",
  "ref.status.active": "activo",
  "ref.status.redeemed": "reservado",
  "ref.status.expired": "caducado",
  // Pagos y ganancias de recomendación
  "ref.payoutTitle": "Método de pago",
  "ref.payoutDesc":
    "Adónde enviamos tus ganancias de recomendación. Solo tienes que configurarlo una vez.",
  "ref.payoutSave": "Guardar método de pago",
  "ref.payoutSaving": "Guardando…",
  "ref.payoutSaved": "Método de pago guardado.",
  "ref.earningsTitle": "Tus ganancias",
  "ref.owed": "Se te debe",
  "ref.paid": "Pagado",
  "ref.earnEmpty": "Aún no hay ganancias. Comparte un enlace para empezar a ganar.",
  "ref.earn.pending": "pendiente",
  "ref.earn.owed": "pendiente de pago",
  "ref.earn.paid": "pagado",
  "ref.earn.reversed": "revertido",
  "ref.linksTitle": "Tus enlaces",
  "ref.linksEmpty": "Aún no hay enlaces. Abre un servicio y pulsa «Recomienda y gana».",

  // Countdown
  "cd.startingNow": "Comienza ahora",
  "cd.timeLeft": "quedan {time}",
};

export const dictionaries: Record<Locale, Record<TranslationKey, string>> = {
  en,
  es,
};

/** Look up a key for a locale, falling back to English then the key itself. */
export function translate(locale: Locale, key: TranslationKey): string {
  return dictionaries[locale]?.[key] ?? en[key] ?? key;
}
