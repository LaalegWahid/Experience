// Rule-based questions for the experience "Share what you'll provide" step. The
// exact set is derived deterministically from the host's chosen category +
// sub-type, so every host sees questions that actually fit what they run. This
// drives our license / insurance / quality / standards checks, so it stays a
// fixed, auditable catalog rather than anything generated at runtime.

/** The full catalog: stable id -> exact wording shown to the host. */
export const COMPLIANCE_QUESTIONS = {
  transport:
    "Will you or your co-host(s) operate a vehicle to transport guests, or provide them with vehicles that they'll operate themselves?",
  thirdPartyTransport:
    "Are you hiring a licensed third-party transportation provider?",
  licensedGuide: "Is your experience led by a licensed or certified guide?",
  admissionTickets:
    "Will you provide entry tickets or handle admission fees for guests?",
  venuePermission:
    "Do you have permission from the venues you'll visit to bring guests?",
  audioEquipment:
    "Will you provide audio equipment, such as headsets, so guests can hear you?",
  protectedArea:
    "Will your experience take place in a national park or other protected area?",
  provideMaterials: "Will you provide all the materials and tools guests need?",
  serveFood: "Will you serve food?",
  serveAlcohol: "Will you serve alcohol?",
  alcoholLicense: "Do you hold the license required to serve alcohol?",
  foodHygiene:
    "Do you hold the required food-handling or hygiene certification?",
  dietary: "Can you accommodate dietary restrictions and allergies?",
  certifiedInstructor: "Are you a certified instructor for this activity?",
  certifiedExpert: "Is your experience led by a certified expert in this field?",
  provideEquipment: "Will you provide the equipment guests need?",
  physical: "Does your experience involve strenuous physical activity?",
  healthWaiver: "Will guests be asked to sign a health or liability waiver?",
  licensedBeauty: "Are you licensed for the beauty treatments you'll provide?",
  water:
    "Will guests be in or on the water, such as swimming, boating, or water sports?",
  swimRequired: "Are guests required to know how to swim?",
  safetyEquipment: "Will you provide the required safety equipment?",
  firstAid: "Is someone on your team certified in first aid?",
  activityLicense:
    "Do you hold the license or certification required to run this activity?",
} as const;

export type ComplianceQuestionId = keyof typeof COMPLIANCE_QUESTIONS;

/**
 * The questions relevant to a given experience, based on the host's category and
 * sub-type. Deterministic and free of side effects. Returned in display order.
 */
export function experienceComplianceQuestions(
  category: string,
  subcategory?: string,
): ComplianceQuestionId[] {
  const cat = (category ?? "").toLowerCase();
  const sub = (subcategory ?? "").toLowerCase();

  // ── History & culture ──────────────────────────────────────────────────
  if (sub.includes("museum")) {
    return ["licensedGuide", "admissionTickets", "audioEquipment", "venuePermission"];
  }
  if (sub.includes("cultural") || sub.includes("landmark")) {
    return ["licensedGuide", "admissionTickets", "protectedArea", "transport"];
  }

  // ── Art & design ───────────────────────────────────────────────────────
  if (sub.includes("architecture") || sub.includes("gallery")) {
    return ["licensedGuide", "admissionTickets", "venuePermission", "transport"];
  }
  if (sub.includes("workshop")) {
    return ["provideMaterials", "serveFood", "serveAlcohol"];
  }
  if (sub.includes("shopping")) {
    return ["licensedGuide", "transport", "thirdPartyTransport"];
  }

  // ── Fitness & wellness ─────────────────────────────────────────────────
  if (sub.includes("workout")) {
    return ["certifiedInstructor", "provideEquipment", "physical", "healthWaiver"];
  }
  if (sub.includes("wellness")) {
    return ["certifiedInstructor", "provideEquipment", "physical"];
  }
  if (sub.includes("beauty")) {
    return ["licensedBeauty", "provideMaterials", "serveFood", "serveAlcohol"];
  }

  // ── Food & drink ───────────────────────────────────────────────────────
  if (sub.includes("cooking")) {
    return ["provideMaterials", "serveAlcohol", "foodHygiene", "dietary"];
  }
  if (sub.includes("food tour")) {
    return ["serveFood", "serveAlcohol", "transport", "venuePermission"];
  }
  if (sub.includes("tasting")) {
    return ["serveFood", "serveAlcohol", "alcoholLicense", "certifiedExpert"];
  }
  if (sub.includes("dining") || cat.includes("food")) {
    return ["serveFood", "serveAlcohol", "foodHygiene", "dietary"];
  }

  // ── Nature & outdoors ──────────────────────────────────────────────────
  if (sub.includes("water")) {
    return ["water", "swimRequired", "safetyEquipment", "firstAid", "transport"];
  }
  if (sub.includes("flying")) {
    return ["activityLicense", "safetyEquipment", "firstAid", "transport"];
  }
  if (sub.includes("wildlife")) {
    return ["protectedArea", "licensedGuide", "transport", "firstAid"];
  }
  if (sub.includes("outdoor") || cat.includes("nature")) {
    return ["protectedArea", "physical", "safetyEquipment", "firstAid", "transport"];
  }

  // ── Generic tour fallback (any remaining "* tour") ─────────────────────
  if (sub.includes("tour")) {
    return ["licensedGuide", "admissionTickets", "transport"];
  }

  // ── Final fallback (catch-all "Other" / unknown) ───────────────────────
  return ["transport", "thirdPartyTransport", "serveFood", "serveAlcohol"];
}
