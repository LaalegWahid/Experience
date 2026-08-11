import postgres from "postgres";
import { randomUUID } from "node:crypto";


const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set (run with `node --env-file=.env`).");
  process.exit(1);
}
const sql = postgres(url, { prepare: false, onnotice: () => {} });

const cover = (id) =>
  `https://images.unsplash.com/photo-${id}?w=900&q=80&auto=format&fit=crop`;
const avatar = (id) =>
  `https://images.unsplash.com/photo-${id}?w=200&q=80&auto=format&fit=crop`;
const slugify = (s) =>
  "demo-" +
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const HOSTS = [
  {
    key: "sofia",
    name: "Sofia Marino",
    email: "sofia@demo.local",
    type: "individual",
    bio: "Yoga teacher and ceramicist sharing calm mornings and hands-on craft.",
    avatarUrl: avatar("1494790108377-be9c29b29330"),
    isVerified: true,
  },
  {
    key: "liam",
    name: "Liam Chen",
    email: "liam@demo.local",
    type: "individual",
    bio: "Neighborhood food guide and private chef. I cook where you are.",
    avatarUrl: avatar("1507003211169-0a1dd7228f2d"),
    isVerified: true,
  },
  {
    key: "atlas",
    name: "Atlas Studio",
    email: "atlas@demo.local",
    type: "business",
    bio: "A small creative studio: photography, training, and local adventures.",
    avatarUrl: avatar("1633332755192-727a05c4013d"),
    isVerified: false,
  },
  {
    key: "mara",
    name: "Mara Lindgren",
    email: "mara@demo.local",
    type: "individual",
    bio: "Sound healing and mindful movement guide. Slow down and reset.",
    avatarUrl: avatar("1438761681033-6461ffad8d80"),
    isVerified: true,
  },
  {
    key: "diego",
    name: "Diego Santos",
    email: "diego@demo.local",
    type: "business",
    bio: "Outdoor adventures: climb, paddle, sail, and explore.",
    avatarUrl: avatar("1500648767791-00dcc994a43e"),
    isVerified: false,
  },
  {
    key: "yuki",
    name: "Yuki Tanaka",
    email: "yuki@demo.local",
    type: "individual",
    bio: "Artist and cook running hands-on classes and at-home services.",
    avatarUrl: avatar("1534528741775-53994a69daeb"),
    isVerified: true,
  },
  {
    key: "karim",
    name: "Karim Benali",
    email: "karim@demo.local",
    type: "individual",
    bio: "Coach sportif à Casablanca: strength, conditioning, and recovery.",
    avatarUrl: avatar("1507003211169-0a1dd7228f2d"),
    isVerified: true,
  },
  {
    key: "leila",
    name: "Leila Haddad",
    email: "leila@demo.local",
    type: "individual",
    bio: "Marrakesh cook and henna artist sharing Moroccan flavors and rituals.",
    avatarUrl: avatar("1438761681033-6461ffad8d80"),
    isVerified: true,
  },
  {
    key: "omar",
    name: "Marco Reyes",
    email: "marco@demo.local",
    type: "business",
    bio: "Miami local showing off Wynwood, South Beach, Little Havana, and Biscayne Bay.",
    avatarUrl: avatar("1633332755192-727a05c4013d"),
    isVerified: false,
  },
  {
    key: "nadia",
    name: "Nadia El Fassi",
    email: "nadia@demo.local",
    type: "individual",
    bio: "Tangier photographer and makeup artist for portraits and events.",
    avatarUrl: avatar("1534528741775-53994a69daeb"),
    isVerified: true,
  },
  {
    key: "hassan",
    name: "Hassan Alaoui",
    email: "hassan@demo.local",
    type: "individual",
    bio: "Fes artisan running leather, mosaic, and medina craft workshops.",
    avatarUrl: avatar("1500648767791-00dcc994a43e"),
    isVerified: false,
  },
];

// priceUsd is converted to cents. duration in minutes.
const OFFERINGS = [
  { host: "sofia", type: "experience", title: "Sunrise Rooftop Yoga", category: "Wellness", format: "public_group", locationType: "at_host", priceUsd: 18, duration: 75, capacity: 12, img: "1544367567-0f2fcb009e0b",
    description: "A calm hatha flow on a city rooftop as the sun comes up. All levels welcome.",
    includedItems: ["Mat & props", "Herbal tea afterwards"], requirements: ["Arrive 10 minutes early", "Wear comfortable clothing"], cancellationPolicy: "flexible" },
  { host: "sofia", type: "experience", title: "Pottery Wheel Workshop", category: "Classes & workshops", format: "class_workshop", locationType: "at_host", priceUsd: 55, duration: 180, capacity: 8, img: "1565193566173-7a0ee3dbe261",
    description: "Learn to center clay and throw your first bowl. Leave with a piece we fire for you.",
    includedItems: ["All materials", "Firing & glazing", "Apron"], requirements: ["No experience needed"], cancellationPolicy: "moderate" },
  { host: "sofia", type: "service", title: "Deep Tissue Massage", category: "Wellness", format: "one_on_one", locationType: "at_guest", priceUsd: 70, duration: 60, capacity: 1, img: "1600334089648-b0d9d3028eb2",
    description: "A focused 60-minute massage at your home to release tension and aid recovery.",
    includedItems: ["Massage table", "Oils"], requirements: ["A quiet room with space for a table"], cancellationPolicy: "strict" },
  { host: "liam", type: "experience", title: "Downtown Food Tour", category: "Activities & tours", format: "public_group", locationType: "at_host", priceUsd: 42, duration: 210, capacity: 10, img: "1504674900247-0877df9cc836",
    description: "A guided tasting walk through five local spots: cheese, pastries, and street eats.",
    includedItems: ["All tastings", "Local guide"], requirements: ["Come hungry", "Comfortable shoes"], cancellationPolicy: "flexible" },
  { host: "liam", type: "service", title: "Private Chef Dinner", category: "Private dining", format: "private_group", locationType: "at_guest", priceUsd: 120, duration: 240, capacity: 6, img: "1414235077428-338989a2e8c0",
    description: "A four-course seasonal menu cooked in your kitchen. Groceries and cleanup included.",
    includedItems: ["Groceries", "4-course menu", "Cleanup"], requirements: ["Share dietary needs in advance"], cancellationPolicy: "strict" },
  { host: "liam", type: "experience", title: "Hands-on Pasta Class", category: "Classes & workshops", format: "class_workshop", locationType: "at_host", priceUsd: 48, duration: 150, capacity: 8, img: "1556910103-1c02745aae4d",
    description: "Make fresh pasta from scratch, then sit down to eat what you made with wine.",
    includedItems: ["Ingredients", "A glass of wine", "Recipe card"], requirements: ["Tell us about allergies"], cancellationPolicy: "moderate" },
  { host: "liam", type: "experience", title: "Natural Wine Tasting", category: "Activities & tours", format: "public_group", locationType: "at_host", priceUsd: 35, duration: 90, capacity: 12, img: "1510812431401-41d2bd2722f3",
    description: "Taste six low-intervention wines with a relaxed walkthrough of how they're made.",
    includedItems: ["6 tastings", "Snack board"], requirements: ["21+ / valid ID"], cancellationPolicy: "moderate" },
  { host: "atlas", type: "service", title: "Portrait Photography Session", category: "Personal services", format: "one_on_one", locationType: "at_guest", priceUsd: 65, duration: 90, capacity: 1, img: "1452587925148-ce544e77e70d",
    description: "A relaxed portrait session on location. You get 15 edited photos within a week.",
    includedItems: ["90-min shoot", "15 edited photos"], requirements: ["Bring 1-2 outfit options"], cancellationPolicy: "moderate" },
  { host: "atlas", type: "service", title: "Personal Training Session", category: "Wellness", format: "one_on_one", locationType: "at_guest", priceUsd: 40, duration: 60, capacity: 1, img: "1571019613454-1cb2f99b2d8b",
    description: "A tailored strength and mobility session at your place or a nearby park.",
    includedItems: ["Custom plan", "Basic equipment"], requirements: ["Wear training clothes"], cancellationPolicy: "flexible" },
  { host: "atlas", type: "experience", title: "Old Town Walking Tour", category: "Activities & tours", format: "public_group", locationType: "at_host", priceUsd: 22, duration: 120, capacity: 15, img: "1502602898657-3e91760cbb34",
    description: "Two hours through hidden courtyards and history with a local storyteller.",
    includedItems: ["Local guide"], requirements: ["Comfortable shoes"], cancellationPolicy: "flexible" },
  { host: "atlas", type: "experience", title: "Beginner Surf Lesson", category: "Activities & tours", format: "public_group", locationType: "at_host", priceUsd: 58, duration: 120, capacity: 6, img: "1502680390469-be75c86b636f",
    description: "Catch your first wave with a certified instructor. Board and wetsuit included.",
    includedItems: ["Board", "Wetsuit", "Instruction"], requirements: ["Must be able to swim"], cancellationPolicy: "moderate" },
  { host: "atlas", type: "service", title: "Classic Barber Cut", category: "Personal services", format: "one_on_one", locationType: "at_guest", priceUsd: 28, duration: 45, capacity: 1, img: "1503951914875-452162b0f3f1",
    description: "A sharp, classic cut and beard tidy-up at home. Tools and cleanup included.",
    includedItems: ["Cut & style", "Beard trim"], requirements: ["A chair near a mirror"], cancellationPolicy: "flexible" },

  { host: "mara", type: "experience", title: "Sound Bath Meditation", category: "Wellness", format: "public_group", locationType: "at_host", priceUsd: 25, duration: 60, capacity: 15, img: "1506126613408-eca07ce68773",
    description: "Lie back and let crystal bowls and gongs reset your nervous system.",
    includedItems: ["Mats & blankets", "Eye pillow"], requirements: ["Wear loose clothing"], cancellationPolicy: "flexible" },
  { host: "mara", type: "service", title: "Reformer Pilates", category: "Wellness", format: "one_on_one", locationType: "at_host", priceUsd: 45, duration: 50, capacity: 1, img: "1518611012118-696072aa579a",
    description: "A precise one-on-one reformer session tailored to your body.",
    includedItems: ["Reformer & equipment"], requirements: ["Grippy socks"], cancellationPolicy: "moderate" },
  { host: "mara", type: "experience", title: "Calligraphy Workshop", category: "Classes & workshops", format: "class_workshop", locationType: "at_host", priceUsd: 38, duration: 120, capacity: 10, img: "1455390582262-044cdead277a",
    description: "Learn modern brush lettering and take home your own piece.",
    includedItems: ["Brushes & ink", "Practice pads"], requirements: ["No experience needed"], cancellationPolicy: "flexible" },
  { host: "mara", type: "service", title: "Acoustic Guitar Lesson", category: "Personal services", format: "one_on_one", locationType: "at_guest", priceUsd: 35, duration: 60, capacity: 1, img: "1510915361894-db8b60106cb1",
    description: "Beginner-friendly guitar lessons paced to your goals.",
    includedItems: ["Lesson plan", "Practice notes"], requirements: ["Bring your own guitar"], cancellationPolicy: "flexible" },
  { host: "mara", type: "experience", title: "Watercolor Painting Class", category: "Classes & workshops", format: "class_workshop", locationType: "at_host", priceUsd: 42, duration: 120, capacity: 10, img: "1513364776144-60967b0f800f",
    description: "Loosen up with washes and color on paper. All materials provided.",
    includedItems: ["Paints & paper", "Brushes"], requirements: ["No experience needed"], cancellationPolicy: "flexible" },
  { host: "mara", type: "service", title: "Hot Stone Spa Treatment", category: "Wellness", format: "one_on_one", locationType: "at_guest", priceUsd: 85, duration: 75, capacity: 1, img: "1544161515-4ab6ce6db874",
    description: "Warm basalt stones melt away tension in this in-home spa session.",
    includedItems: ["Stones & oils", "Table"], requirements: ["A warm, quiet room"], cancellationPolicy: "strict" },

  { host: "diego", type: "experience", title: "Rock Climbing Intro", category: "Activities & tours", format: "public_group", locationType: "at_host", priceUsd: 48, duration: 150, capacity: 6, img: "1522163182402-834f871fd851",
    description: "Learn the ropes (literally) with a certified climbing instructor.",
    includedItems: ["Gear & shoes", "Instruction"], requirements: ["Reasonable fitness"], cancellationPolicy: "strict" },
  { host: "diego", type: "experience", title: "Kayak River Trip", category: "Activities & tours", format: "public_group", locationType: "at_host", priceUsd: 55, duration: 180, capacity: 8, img: "1545579133-99bb5ab189bd",
    description: "A guided paddle down calm waters with stops for photos and a swim.",
    includedItems: ["Kayak & paddle", "Life vest"], requirements: ["Must be able to swim"], cancellationPolicy: "moderate" },
  { host: "diego", type: "experience", title: "Sunset Sailing Trip", category: "Activities & tours", format: "public_group", locationType: "at_host", priceUsd: 75, duration: 150, capacity: 10, img: "1500627964684-141351970a7f",
    description: "Glide out for golden hour with drinks and skyline views.",
    includedItems: ["Drinks", "Captain & crew"], requirements: ["Bring a light jacket"], cancellationPolicy: "strict" },
  { host: "diego", type: "experience", title: "Cocktail Mixology Night", category: "Activities & tours", format: "public_group", locationType: "at_host", priceUsd: 40, duration: 120, capacity: 14, img: "1514362545857-3bc16c4c7d1b",
    description: "Shake and stir three classic cocktails with a pro bartender.",
    includedItems: ["3 cocktails", "Snacks"], requirements: ["21+ / valid ID"], cancellationPolicy: "moderate" },
  { host: "diego", type: "experience", title: "Coffee Roasting Workshop", category: "Classes & workshops", format: "class_workshop", locationType: "at_host", priceUsd: 44, duration: 120, capacity: 8, img: "1447933601403-0c6688de566e",
    description: "Roast green beans to your taste and brew a cup to compare.",
    includedItems: ["Beans to take home", "Tastings"], requirements: ["No experience needed"], cancellationPolicy: "moderate" },

  { host: "yuki", type: "experience", title: "Sushi Rolling Class", category: "Classes & workshops", format: "class_workshop", locationType: "at_host", priceUsd: 52, duration: 150, capacity: 8, img: "1579871494447-9811cf80d66c",
    description: "Roll maki and nigiri from scratch, then feast on your creations.",
    includedItems: ["All ingredients", "Sake tasting"], requirements: ["Mention allergies"], cancellationPolicy: "moderate" },
  { host: "yuki", type: "experience", title: "Vegan Cooking Class", category: "Classes & workshops", format: "class_workshop", locationType: "at_host", priceUsd: 46, duration: 150, capacity: 8, img: "1512621776951-a57141f2eefd",
    description: "Cook a vibrant plant-based three-course meal and eat together.",
    includedItems: ["Ingredients", "Recipes"], requirements: ["Mention allergies"], cancellationPolicy: "moderate" },
  { host: "yuki", type: "service", title: "Home Cleaning (Deep)", category: "Personal services", format: "one_on_one", locationType: "at_guest", priceUsd: 90, duration: 180, capacity: 1, img: "1581578731548-c64695cc6952",
    description: "A thorough top-to-bottom clean of your home by a trusted pro.",
    includedItems: ["Supplies & equipment"], requirements: ["Access to the home"], cancellationPolicy: "strict" },
  { host: "yuki", type: "service", title: "Makeup & Styling Session", category: "Personal services", format: "one_on_one", locationType: "at_guest", priceUsd: 60, duration: 75, capacity: 1, img: "1594465919760-441fe5908ab0",
    description: "Event-ready makeup and styling at your place.",
    includedItems: ["Full makeup application"], requirements: ["Clean, moisturized skin"], cancellationPolicy: "moderate" },
  { host: "yuki", type: "service", title: "Dog Grooming (Mobile)", category: "Personal services", format: "one_on_one", locationType: "at_guest", priceUsd: 50, duration: 90, capacity: 1, img: "1583337130417-3346a1be7dee",
    description: "Full wash, trim, and tidy for your dog. We come to you.",
    includedItems: ["Wash & blow-dry", "Nail trim"], requirements: ["Up-to-date vaccinations"], cancellationPolicy: "moderate" },
  { host: "yuki", type: "service", title: "Pet Sitting & Walking", category: "Personal services", format: "one_on_one", locationType: "at_guest", priceUsd: 20, duration: 60, capacity: 1, img: "1601758228041-f3b2795255f1",
    description: "A reliable walk or drop-in visit to keep your pet happy.",
    includedItems: ["Walk or visit", "Photo update"], requirements: ["Provide care instructions"], cancellationPolicy: "flexible" },

  // ── Morocco-based hosts ───────────────────────────────────────────────────
  { host: "karim", type: "experience", title: "Sunrise HIIT Bootcamp", category: "Wellness", format: "public_group", locationType: "at_host", priceUsd: 15, duration: 60, capacity: 14, img: "1599058917212-d750089bc07e",
    description: "A high-energy beachfront bootcamp to kick-start your day. All fitness levels.",
    includedItems: ["Warm-up & cooldown", "Water"], requirements: ["Wear training clothes", "Bring a towel"], cancellationPolicy: "flexible" },
  { host: "karim", type: "service", title: "Beachfront Personal Training", category: "Wellness", format: "one_on_one", locationType: "at_guest", priceUsd: 35, duration: 60, capacity: 1, img: "1581009146145-b5ef050c2e1e",
    description: "A tailored strength and conditioning session at your place or on the corniche.",
    includedItems: ["Custom plan", "Basic equipment"], requirements: ["Wear training clothes"], cancellationPolicy: "flexible" },
  { host: "karim", type: "service", title: "Sports Recovery Massage", category: "Wellness", format: "one_on_one", locationType: "at_guest", priceUsd: 55, duration: 60, capacity: 1, img: "1519823551278-64ac92734fb1",
    description: "A deep recovery massage at home to ease sore muscles after training.",
    includedItems: ["Massage table", "Oils"], requirements: ["A quiet room"], cancellationPolicy: "moderate" },

  { host: "omar", type: "experience", title: "Little Havana Food Tour", category: "Activities & tours", format: "public_group", locationType: "at_host", priceUsd: 42, duration: 150, capacity: 10, img: "1504674900247-0877df9cc836",
    description: "Taste your way down Calle Ocho with a local foodie: croquetas, empanadas, and fresh sugarcane juice.",
    includedItems: ["Tastings", "Local guide"], requirements: ["Come hungry", "Comfortable shoes"], cancellationPolicy: "flexible" },
  { host: "leila", type: "service", title: "Hammam & Argan Spa Ritual", category: "Wellness", format: "one_on_one", locationType: "at_host", priceUsd: 65, duration: 90, capacity: 1, img: "1540555700478-4be289fbecef",
    description: "A traditional black-soap hammam and argan oil treatment in a private spa.",
    includedItems: ["Black soap & gloves", "Argan oil"], requirements: ["Bring swimwear"], cancellationPolicy: "strict" },
  { host: "omar", type: "experience", title: "South Beach Art Deco Walking Tour", category: "Activities & tours", format: "public_group", locationType: "at_host", priceUsd: 24, duration: 120, capacity: 15, img: "1502602898657-3e91760cbb34",
    description: "Stroll Miami Beach's pastel Art Deco district with a local guide. Ocean Drive history and photo stops.",
    includedItems: ["Local guide"], requirements: ["Comfortable shoes"], cancellationPolicy: "flexible" },
  { host: "omar", type: "experience", title: "Biscayne Bay Sunset Sail", category: "Activities & tours", format: "public_group", locationType: "at_host", priceUsd: 55, duration: 120, capacity: 10, img: "1500627964684-141351970a7f",
    description: "Cruise Biscayne Bay at golden hour with skyline views, music, and a drink in hand.",
    includedItems: ["Drinks", "Captain & crew"], requirements: ["Bring a light jacket"], cancellationPolicy: "strict" },
  { host: "omar", type: "experience", title: "Cuban Coffee & Pastry Tasting", category: "Activities & tours", format: "public_group", locationType: "at_host", priceUsd: 20, duration: 90, capacity: 12, img: "1447933601403-0c6688de566e",
    description: "Sip cortaditos and taste fresh pastelitos in Little Havana while learning the ritual of Cuban cafe culture.",
    includedItems: ["Coffee & pastries"], requirements: [], cancellationPolicy: "flexible" },

  { host: "nadia", type: "service", title: "Tangier Portrait Session", category: "Personal services", format: "one_on_one", locationType: "at_guest", priceUsd: 60, duration: 90, capacity: 1, img: "1554048612-b6a482bc67e5",
    description: "A relaxed portrait session around Tangier with 15 edited photos within a week.",
    includedItems: ["90-min shoot", "15 edited photos"], requirements: ["Bring 1-2 outfit options"], cancellationPolicy: "moderate" },
  { host: "nadia", type: "service", title: "Bridal Makeup & Styling", category: "Personal services", format: "one_on_one", locationType: "at_guest", priceUsd: 80, duration: 90, capacity: 1, img: "1487412947147-5cebf100ffc2",
    description: "Wedding-ready makeup and styling at your venue, with a pre-event trial.",
    includedItems: ["Full makeup", "Lashes"], requirements: ["Clean, moisturized skin"], cancellationPolicy: "strict" },

  { host: "hassan", type: "experience", title: "Leather Tannery Craft Workshop", category: "Classes & workshops", format: "class_workshop", locationType: "at_host", priceUsd: 50, duration: 180, capacity: 6, img: "1528283648649-33347faa5d9e",
    description: "Visit the famous Chouara tannery, then hand-craft a small leather piece to keep.",
    includedItems: ["Materials", "Your finished piece"], requirements: ["No experience needed"], cancellationPolicy: "moderate" },
  { host: "omar", type: "experience", title: "Wynwood Street Art Walking Tour", category: "Activities & tours", format: "public_group", locationType: "at_host", priceUsd: 26, duration: 120, capacity: 12, img: "1485965120184-e220f721d03e",
    description: "Explore Wynwood's world-famous murals and galleries with an artist guide through Miami's coolest district.",
    includedItems: ["Local guide"], requirements: ["Comfortable shoes"], cancellationPolicy: "flexible" },
];

const GUESTS = [
  { key: "emma", name: "Emma Rivera", email: "emma@demo.local" },
  { key: "noah", name: "Noah Kim", email: "noah@demo.local" },
  { key: "olivia", name: "Olivia Tan", email: "olivia@demo.local" },
  { key: "james", name: "James Park", email: "james@demo.local" },
];

const COMMENTS = [
  "Absolutely loved it. It exceeded my expectations.",
  "Great host, super welcoming and professional.",
  "Would do this again in a heartbeat. Highly recommend.",
  "Well organized and a lot of fun. Worth every penny.",
  "Relaxed pace and very knowledgeable. Five stars.",
  "A real highlight of our trip. Thank you!",
];

// Two availability patterns, alternated across offerings.
const PATTERNS = [
  [
    { d: 1, s: "09:00", e: "18:00" },
    { d: 2, s: "09:00", e: "18:00" },
    { d: 4, s: "09:00", e: "18:00" },
    { d: 6, s: "10:00", e: "15:00" },
  ],
  [
    { d: 3, s: "08:00", e: "13:00" },
    { d: 5, s: "08:00", e: "13:00" },
    { d: 6, s: "09:00", e: "16:00" },
    { d: 7, s: "09:00", e: "14:00" },
  ],
];

// A base city per host; at-host offerings get a jittered point near it so the
// detail-page map shows a distinct, real-looking spot.
const CITY = {
  sofia: { address: "18 Rua da Bica de Duarte Belo", postal: "1200-160", city: "Lisbon", region: "Lisbon", country: "Portugal", lat: 38.7223, lng: -9.1393 },
  liam: { address: "33 Carrer de Girona", postal: "08009", city: "Barcelona", region: "Catalonia", country: "Spain", lat: 41.3851, lng: 2.1734 },
  atlas: { address: "210 Prinsengracht", postal: "1016 HD", city: "Amsterdam", region: "North Holland", country: "Netherlands", lat: 52.3676, lng: 4.9041 },
  mara: { address: "14 Nyhavn", postal: "1051", city: "Copenhagen", region: "Capital Region", country: "Denmark", lat: 55.6761, lng: 12.5683 },
  diego: { address: "27 Rua das Flores", postal: "4050-262", city: "Porto", region: "Porto", country: "Portugal", lat: 41.1579, lng: -8.6291 },
  yuki: { address: "9 Kastanienallee", postal: "10435", city: "Berlin", region: "Berlin", country: "Germany", lat: 52.52, lng: 13.405 },
  karim: { address: "12 Boulevard d'Anfa", postal: "20000", city: "Casablanca", region: "Casablanca-Settat", country: "Morocco", lat: 33.5731, lng: -7.5898 },
  leila: { address: "45 Rue Yves Saint Laurent", postal: "40000", city: "Marrakesh", region: "Marrakesh-Safi", country: "Morocco", lat: 31.6295, lng: -7.9811 },
  omar: { address: "1438 SW 8th St (Calle Ocho)", postal: "33135", city: "Miami", region: "Florida", country: "United States", lat: 25.7651, lng: -80.2197 },
  nadia: { address: "23 Rue de la Liberté", postal: "90000", city: "Tangier", region: "Tangier-Tétouan-Al Hoceïma", country: "Morocco", lat: 35.7595, lng: -5.834 },
  hassan: { address: "5 Talaa Kebira, Fes el Bali", postal: "30000", city: "Fes", region: "Fès-Meknès", country: "Morocco", lat: 34.0181, lng: -5.0078 },
};
const jitter = () => (Math.random() - 0.5) * 0.02; // ~±1km

async function main() {
  console.log("Clearing previous seed data…");
  // Locations aren't cascade-deleted by offerings (FK is set-null), so remove
  // the demo ones explicitly before the cascade wipes the offerings.
  await sql`delete from locations where id in (
    select location_id from offerings
    where slug like 'demo-%' and location_id is not null
  )`;
  await sql`delete from "user" where id like 'seed_%'`;

  // Hosts + providers
  const providerByHost = {};
  let payoutIdx = 0;
  for (const h of HOSTS) {
    const userId = `seed_host_${h.key}`;
    await sql`insert into "user" ${sql({
      id: userId,
      name: h.name,
      email: h.email,
      email_verified: true,
      image: h.avatarUrl,
      role: "host",
      created_at: new Date(),
      updated_at: new Date(),
    })}`;
    const providerId = randomUUID();
    await sql`insert into providers ${sql({
      id: providerId,
      user_id: userId,
      type: h.type,
      display_name: h.name,
      bio: h.bio,
      avatar_url: h.avatarUrl,
      is_verified: h.isVerified,
      created_at: new Date(),
      updated_at: new Date(),
    })}`;
    providerByHost[h.key] = providerId;

    // Give each host a payout method so the admin reservations view has real
    // payout details. Alternate bank / crypto for variety.
    const payout =
      payoutIdx++ % 2 === 0
        ? {
            type: "bank",
            account_holder_name: h.name,
            iban: "FR7630006000011234567890189",
            bic: "BNPAFRPP",
            bank_name: "BNP Paribas",
            country: "FR",
          }
        : {
            type: "crypto",
            wallet_address: "0x1d4b2f9a6c3e8051f7a2c9d0b4e6a8c1f3057b2e",
            chain: "base",
            stablecoin: "USDC",
          };
    await sql`insert into payout_methods ${sql({
      id: randomUUID(),
      provider_id: providerId,
      ...payout,
      created_at: new Date(),
      updated_at: new Date(),
    })}`;
  }
  console.log(`Inserted ${HOSTS.length} hosts.`);

  // Guests
  for (const g of GUESTS) {
    await sql`insert into "user" ${sql({
      id: `seed_guest_${g.key}`,
      name: g.name,
      email: g.email,
      email_verified: true,
      image: null,
      role: "guest",
      created_at: new Date(),
      updated_at: new Date(),
    })}`;
  }

  // Offerings + availability + reviews
  let reviewCount = 0;
  for (let i = 0; i < OFFERINGS.length; i++) {
    const o = OFFERINGS[i];
    const offeringId = randomUUID();

    // At-host offerings get a fixed location with coordinates for the map.
    let locationId = null;
    if (o.locationType === "at_host") {
      const c = CITY[o.host];
      locationId = randomUUID();
      await sql`insert into locations ${sql({
        id: locationId,
        address_line1: c.address ?? null,
        address_line2: null,
        city: c.city,
        region: c.region,
        postal_code: c.postal ?? null,
        country: c.country,
        lat: c.lat + jitter(),
        lng: c.lng + jitter(),
        created_at: new Date(),
      })}`;
    }

    await sql`insert into offerings (
      id, provider_id, type, status, title, slug, description, category,
      format, location_type, price_cents, currency, pricing_type,
      duration_minutes, capacity, booking_cutoff_minutes,
      included_items, requirements, cancellation_policy, cover_image_url,
      location_id, published_at, created_at, updated_at
    ) values (
      ${offeringId}, ${providerByHost[o.host]}, ${o.type}, 'published',
      ${o.title}, ${slugify(o.title)}, ${o.description}, ${o.category},
      ${o.format}, ${o.locationType}, ${o.priceUsd * 100}, 'USD', 'per_person',
      ${o.duration}, ${o.capacity}, 120,
      ${sql.json(o.includedItems)}, ${sql.json(o.requirements)},
      ${o.cancellationPolicy}, ${o.coverUrl ?? cover(o.img)},
      ${locationId}, now(), now(), now()
    )`;

    const pattern = PATTERNS[i % PATTERNS.length];
    for (const r of pattern) {
      await sql`insert into availability_rules ${sql({
        id: randomUUID(),
        offering_id: offeringId,
        day_of_week: r.d,
        start_time: r.s,
        end_time: r.e,
        created_at: new Date(),
        updated_at: new Date(),
      })}`;
    }

    // Reviews spread across offerings (0–3 each), via past "executed" bookings.
    const n = i % 4;
    if (n > 0) {
      for (let j = 0; j < n; j++) {
        const guest = GUESTS[(i + j) % GUESTS.length];
        const guestId = `seed_guest_${guest.key}`;
        const bookingId = randomUUID();
        const daysAgo = 3 + j * 4 + i;
        const apptAt = new Date(Date.now() - daysAgo * 86_400_000);
        await sql`insert into bookings ${sql({
          id: bookingId,
          user_id: guestId,
          offering_id: offeringId,
          appointment_at: apptAt,
          status: "executed",
          price_cents: o.priceUsd * 100,
          currency: "USD",
          stripe_session_id: null,
          created_at: apptAt,
          updated_at: apptAt,
        })}`;
        await sql`insert into reviews ${sql({
          id: randomUUID(),
          booking_id: bookingId,
          offering_id: offeringId,
          user_id: guestId,
          rating: 4 + ((i + j) % 2), // 4 or 5
          comment: COMMENTS[(i + j) % COMMENTS.length],
          created_at: apptAt,
        })}`;
        reviewCount++;
      }
    }
  }

  console.log(
    `Inserted ${OFFERINGS.length} offerings, ${GUESTS.length} guests, ${reviewCount} reviews.`,
  );
  console.log("Done. Visit /services to see them.");
}

main()
  .then(() => sql.end())
  .catch(async (e) => {
    console.error("Seed failed:", e);
    await sql.end();
    process.exit(1);
  });
