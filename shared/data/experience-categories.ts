import { OTHER_CATEGORY } from "./service-categories";

// Experience categories shown when a host creates an Experience listing — the
// parallel of SERVICE_CATEGORIES. Icons are 3D PNGs in /public/experience-icons.
export type ExperienceCategory = {
  /** Stable value stored on the offering + used in URLs. "Other" → empty in DB. */
  value: string;
  /** Display label (Airbnb-style). */
  label: string;
  icon: string;
  /** "How would you describe your experience?" sub-types (empty = skip the step). */
  subtypes: string[];
  /** Sample photos shown on the empty Photos step (in /public/experience-samples). */
  samples: string[];
};

export const EXPERIENCE_CATEGORIES: ExperienceCategory[] = [
  {
    value: "Art and design",
    label: "Art and design",
    icon: "/experience-icons/art-design.png",
    subtypes: [
      "Architecture tour",
      "Art workshop",
      "Gallery tour",
      "Shopping & fashion experience",
    ],
    samples: [
      "/experience-samples/art-design-1.jpg",
      "/experience-samples/art-design-2.jpg",
      "/experience-samples/art-design-3.jpg",
    ],
  },
  {
    value: "Fitness and wellness",
    label: "Fitness and wellness",
    icon: "/experience-icons/fitness-wellness.png",
    subtypes: ["Wellness experience", "Beauty experience", "Workout"],
    samples: [
      "/experience-samples/fitness-wellness-1.jpg",
      "/experience-samples/fitness-wellness-2.jpg",
      "/experience-samples/fitness-wellness-3.jpg",
    ],
  },
  {
    value: "Food and drink",
    label: "Food and drink",
    icon: "/experience-icons/food-drink.png",
    subtypes: ["Dining experience", "Cooking class", "Food tour", "Tasting"],
    samples: [
      "/experience-samples/food-drink-1.jpg",
      "/experience-samples/food-drink-2.jpg",
      "/experience-samples/food-drink-3.jpg",
    ],
  },
  {
    value: "History and culture",
    label: "History and culture",
    icon: "/experience-icons/history-culture.png",
    subtypes: ["Cultural tour", "Landmark tour", "Museum tour"],
    samples: [
      "/experience-samples/history-culture-1.jpg",
      "/experience-samples/history-culture-2.jpg",
      "/experience-samples/history-culture-3.jpg",
    ],
  },
  {
    value: "Nature and outdoors",
    label: "Nature and outdoors",
    icon: "/experience-icons/nature-outdoors.png",
    subtypes: [
      "Outdoor experience",
      "Flying experience",
      "Water sport experience",
      "Wildlife experience",
    ],
    samples: [
      "/experience-samples/nature-outdoors-1.jpg",
      "/experience-samples/nature-outdoors-2.jpg",
      "/experience-samples/nature-outdoors-3.jpg",
    ],
  },
  {
    value: OTHER_CATEGORY,
    label: "Other",
    icon: "/experience-icons/other.png",
    subtypes: [],
    samples: [],
  },
];

export function findExperienceCategory(
  value: string,
): ExperienceCategory | undefined {
  return EXPERIENCE_CATEGORIES.find((c) => c.value === value);
}
