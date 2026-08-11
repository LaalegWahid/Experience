// Per-category helpers for the listing wizard: the "Choose a type of service"
// options shown when building an offering, the role noun used in
// "How many years have you been a …?", and the suggested listing titles.

const TYPE_OPTIONS: Record<string, string[]> = {
  Catering: [
    "Buffet",
    "Plated dinner",
    "Cocktail reception",
    "Corporate event",
    "Wedding",
  ],
  Chef: [
    "Tasting menu",
    "Family dinner",
    "Brunch",
    "Moroccan cuisine",
    "Vegetarian",
    "Pastry",
  ],
  "Hair styling": ["Cut & style", "Color", "Bridal", "Braids", "Blowout"],
  Makeup: ["Everyday", "Bridal", "Editorial", "Special event"],
  Massage: ["Deep tissue", "Swedish", "Sports", "Hot stone", "Prenatal"],
  "Personal training": [
    "Strength",
    "Weight loss",
    "HIIT",
    "Mobility",
    "Group session",
  ],
  Photography: ["Portrait", "Event", "Product", "Wedding", "Real estate"],
  "Prepared meals": [
    "Weekly meal prep",
    "Single meal",
    "Healthy",
    "Family pack",
  ],
  "Spa treatments": [
    "Facial",
    "Body scrub",
    "Hammam",
    "Aromatherapy",
    "Manicure & pedicure",
  ],
};

const FALLBACK_TYPES = ["Standard session", "Premium session", "Group session"];

/** The selectable "type of service" options for an offering in this category. */
export function getServiceTypeOptions(category: string): string[] {
  return TYPE_OPTIONS[category] ?? FALLBACK_TYPES;
}

const ROLE_NOUNS: Record<string, string> = {
  Catering: "caterer",
  Chef: "private chef",
  "Hair styling": "hair stylist",
  Makeup: "makeup artist",
  Massage: "massage therapist",
  "Personal training": "personal trainer",
  Photography: "photographer",
  "Prepared meals": "meal-prep chef",
  "Spa treatments": "spa therapist",
  Other: "service provider",
};

/** The noun used in "How many years have you been a {role}?". */
export function roleNoun(category: string): string {
  return ROLE_NOUNS[category] ?? (category.toLowerCase() || "service provider");
}

/** Three suggested listing titles for the final "make it your own" step. */
export function suggestedTitles(category: string, name: string): string[] {
  const who = name.trim() || "you";
  const cat = category || "Your service";
  return [
    `${cat} sessions by ${who}`,
    `${cat} by ${who}`,
    `${cat} coaching by ${who}`,
  ];
}
