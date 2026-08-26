"use server";

import { requireProvider } from "@/lib/host";
import { env } from "@/shared/utils/env";

export type AiCopyInput = {
  category: string;
  type: "service" | "experience";
  role: string;
  years: number;
  city: string;
  typeOfService?: string;
  offerings: string[];
  experience?: string;
  degree?: string;
};

export type AiCopyResult = {
  titles?: string[];
  description?: string;
  error?: string;
};

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

/**
 * Generates listing title options and a description with Groq (OpenAI-compatible
 * chat completions). Returns a friendly error when the key isn't configured or
 * the call fails — the wizard falls back to its template suggestions.
 */
export async function generateListingCopy(
  input: AiCopyInput,
): Promise<AiCopyResult> {
  await requireProvider();

  if (!env.GROQ_API_KEY) {
    return { error: "AI isn't configured yet. Add GROQ_API_KEY to enable this." };
  }

  const context = [
    `Provider name: ${input.role ? "(a " + input.role + ")" : ""}`,
    `Category: ${input.category}`,
    `Offering kind: ${input.type}`,
    `Years of experience: ${input.years}`,
    `City: ${input.city || "unspecified"}`,
    input.typeOfService ? `Specialty: ${input.typeOfService}` : "",
    input.offerings.length ? `Bookable offerings: ${input.offerings.join(", ")}` : "",
    input.experience ? `Background: ${input.experience}` : "",
    input.degree ? `Qualification: ${input.degree}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const prompt = `You are writing copy for a local services marketplace listing.
Using the details below, return JSON with exactly this shape:
{"titles": ["...", "...", "..."], "description": "..."}

Rules:
- "titles": 3 SHORT, catchy listing titles, each 40 characters or fewer. No surrounding quotes, no emojis.
- "description": ONE short first-person sentence (max 140 characters) that makes a guest want to book. No emojis, no markdown, no line breaks.

Details:
${context}`;

  let res: Response;
  try {
    res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.8,
        max_tokens: 600,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You write concise, appealing marketplace copy and respond ONLY with valid JSON.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });
  } catch {
    return { error: "Couldn't reach the AI service. Try again." };
  }

  if (!res.ok) {
    return { error: "The AI service returned an error. Try again." };
  }

  const data = (await res.json().catch(() => null)) as
    | { choices?: { message?: { content?: string } }[] }
    | null;
  const content = data?.choices?.[0]?.message?.content ?? "";

  let parsed: { titles?: unknown; description?: unknown } | null = null;
  try {
    parsed = JSON.parse(content);
  } catch {
    return { error: "The AI returned an unexpected response. Try again." };
  }

  const titles = Array.isArray(parsed?.titles)
    ? parsed!.titles
        .filter((t): t is string => typeof t === "string")
        .map((t) => t.trim().replace(/^["']|["']$/g, "").slice(0, 60))
        .filter(Boolean)
        .slice(0, 3)
    : [];
  const description =
    typeof parsed?.description === "string"
      ? parsed.description.trim().replace(/\s+/g, " ").slice(0, 160)
      : "";

  if (titles.length === 0 && !description) {
    return { error: "The AI returned no usable copy. Try again." };
  }

  return { titles, description };
}
