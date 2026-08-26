export type ServiceCategory = {
  /** Stable value stored on the offering. "Other" is saved as empty in the DB. */
  value: string;
  /** Display label shown to hosts. */
  label: string;
  icon: string;
  type: "service" | "experience";
};

/** Value used for the catch-all "Other" category (stored empty in the DB). */
export const OTHER_CATEGORY = "Other";

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  { value: "Catering", label: "Catering", icon: "/service-icons/catering.png", type: "service" },
  { value: "Chef", label: "Chef", icon: "/service-icons/private-chef.png", type: "service" },
  { value: "Hair styling", label: "Hair styling", icon: "/service-icons/hair-styling.png", type: "service" },
  { value: "Makeup", label: "Makeup", icon: "/service-icons/makeup.png", type: "service" },
  { value: "Massage", label: "Massage", icon: "/service-icons/massage.png", type: "service" },
  { value: "Personal training", label: "Personal training", icon: "/service-icons/personal-training.png", type: "service" },
  { value: "Photography", label: "Photography", icon: "/service-icons/photography.png", type: "service" },
  { value: "Prepared meals", label: "Prepared meals", icon: "/service-icons/prepared-meals.png", type: "service" },
  { value: "Spa treatments", label: "Spa treatments", icon: "/service-icons/spa.png", type: "service" },
  { value: OTHER_CATEGORY, label: "Other", icon: "/service-icons/other.svg", type: "service" },
];

export function findServiceCategory(value: string): ServiceCategory | undefined {
  return SERVICE_CATEGORIES.find((c) => c.value === value);
}
