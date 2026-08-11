"use client";

import { useEffect, useMemo, useState } from "react";
import { tryCatch } from "@/shared/utils/TryCatch";

type Param = {
  name: string;
  /** Display type, e.g. "string", "integer", "string[]", "enum". */
  type: string;
  required: boolean;
  description: string;
  /** Prefilled value for the live tester (path/query params). */
  prefill?: string;
  placeholder?: string;
};

type Endpoint = {
  /** Stable anchor id used by the on-page nav. */
  key: string;
  group: "guest" | "host";
  method: "GET" | "POST" | "PATCH" | "PUT";
  title: string;
  /** One or two sentences of plain-English explanation. */
  description: string;
  /** Path template with `:param` placeholders. */
  path: string;
  pathParams?: Param[];
  queryParams?: Param[];
  /** Documented request-body fields (write endpoints). */
  bodyParams?: Param[];
  /** Prefilled JSON body for the tester / curl. */
  bodyExample?: string;
  /** A representative success response, shown as documentation. */
  responseExample: string;
  /** Extra call-outs (auth nuances, x402, side effects). */
  notes?: string[];
};

/** Real sample values pulled from the DB so examples run as-is. */
export type PlaygroundSamples = {
  offeringId: string;
  providerId: string;
  date: string;
  time: string;
};

const HOST_BADGE = "Host only";

/* ------------------------------------------------------------------ */
/* Endpoint catalog                                                    */
/* ------------------------------------------------------------------ */

function buildEndpoints(s: PlaygroundSamples): Endpoint[] {
  const oid = s.offeringId || "OFFERING_ID";
  const pid = s.providerId || "PROVIDER_ID";

  return [
    /* ---- Guest ---- */
    {
      key: "search-offerings",
      group: "guest",
      method: "GET",
      title: "Search offerings",
      description:
        "Returns the list of published services and experiences. Use the query parameters to filter by keyword or price range. This is the main discovery endpoint.",
      path: "/api/v1/offerings",
      queryParams: [
        { name: "q", type: "string", required: false, description: "Free-text keyword to match against title and description.", placeholder: "yoga" },
        { name: "host", type: "string", required: false, description: "Filter to a single host by name.", placeholder: "Marco Reyes" },
        { name: "minPrice", type: "integer", required: false, description: "Minimum price in cents (e.g. 2000 = $20.00).", placeholder: "0" },
        { name: "maxPrice", type: "integer", required: false, description: "Maximum price in cents.", placeholder: "20000" },
      ],
      responseExample: `{
  "data": [
    {
      "id": "${oid}",
      "type": "experience",
      "title": "Biscayne Bay Sunset Sail",
      "description": "Cruise Biscayne Bay at golden hour…",
      "category": "Activities & tours",
      "priceCents": 5500,
      "currency": "USD",
      "durationMinutes": 120,
      "host": { "name": "Marco Reyes" }
    }
  ]
}`,
    },
    {
      key: "offering-detail",
      group: "guest",
      method: "GET",
      title: "Get an offering",
      description:
        "Returns the full details of a single service by its ID, including price, duration, what's included, and the host. Only published offerings are visible (unless you own it).",
      path: "/api/v1/offerings/:id",
      pathParams: [
        { name: "id", type: "string", required: true, description: "The offering's unique ID.", prefill: s.offeringId, placeholder: "OFFERING_ID" },
      ],
      responseExample: `{
  "data": {
    "id": "${oid}",
    "type": "experience",
    "status": "published",
    "title": "Biscayne Bay Sunset Sail",
    "slug": "demo-biscayne-bay-sunset-sail",
    "description": "Cruise Biscayne Bay at golden hour…",
    "category": "Activities & tours",
    "format": "public_group",
    "locationType": "at_host",
    "priceCents": 5500,
    "currency": "USD",
    "pricingType": "per_person",
    "durationMinutes": 120,
    "capacity": 10,
    "includedItems": ["Drinks", "Captain & crew"],
    "requirements": ["Bring a light jacket"],
    "cancellationPolicy": "strict",
    "provider": { "name": "Marco Reyes", "isVerified": false },
    "publishedAt": "2026-06-02T09:30:00.000Z"
  }
}`,
    },
    {
      key: "offering-availability",
      group: "guest",
      method: "GET",
      title: "Get availability",
      description:
        "Returns a service's recurring weekly availability windows so you can pick a date and time that is bookable before quoting or booking.",
      path: "/api/v1/offerings/:id/availability",
      pathParams: [
        { name: "id", type: "string", required: true, description: "The offering's unique ID.", prefill: s.offeringId, placeholder: "OFFERING_ID" },
      ],
      responseExample: `{
  "data": [
    { "dayOfWeek": 5, "startTime": "18:00", "endTime": "20:00" },
    { "dayOfWeek": 6, "startTime": "18:00", "endTime": "20:00" }
  ]
}`,
      notes: ["dayOfWeek follows ISO weekdays: 1 = Monday … 7 = Sunday."],
    },
    {
      key: "provider-detail",
      group: "guest",
      method: "GET",
      title: "Get a provider",
      description:
        "Returns a host's public profile (display name, bio, avatar, and verification status) by their provider ID.",
      path: "/api/v1/providers/:id",
      pathParams: [
        { name: "id", type: "string", required: true, description: "The provider's unique ID.", prefill: s.providerId, placeholder: "PROVIDER_ID" },
      ],
      responseExample: `{
  "data": {
    "id": "${pid}",
    "name": "Marco Reyes",
    "type": "business",
    "bio": "Miami local showing off Wynwood, South Beach…",
    "avatarUrl": "https://…",
    "isVerified": false
  }
}`,
    },
    {
      key: "quote",
      group: "guest",
      method: "POST",
      title: "Get a quote",
      description:
        "Checks whether a date/time is bookable and returns the full price breakdown (base price + service fee), without creating a booking. Use this to show the user a price before they commit.",
      path: "/api/v1/quotes",
      bodyParams: [
        { name: "offeringId", type: "string", required: true, description: "The offering to quote." },
        { name: "date", type: "string", required: true, description: "Target date, formatted YYYY-MM-DD." },
        { name: "time", type: "string", required: true, description: "Start time, 24h HH:MM." },
      ],
      bodyExample: `{
  "offeringId": "${oid}",
  "date": "${s.date}",
  "time": "${s.time}"
}`,
      responseExample: `{
  "data": {
    "offeringId": "${oid}",
    "appointmentAt": "${s.date}T${s.time}:00.000Z",
    "durationMinutes": 120,
    "basePriceCents": 5500,
    "serviceFeeCents": 1100,
    "totalCents": 6600,
    "currency": "USD",
    "available": true,
    "expiresAt": "2026-06-22T12:15:00.000Z"
  }
}`,
      notes: ["Returns 409 unavailable if the slot is outside the offering's availability windows."],
    },
    {
      key: "bookings-list",
      group: "guest",
      method: "GET",
      title: "List your bookings",
      description:
        "Returns every booking made with your API key. The key acts as your account, so you only ever see your own bookings.",
      path: "/api/v1/bookings",
      responseExample: `{
  "data": [
    {
      "id": "BOOKING_ID",
      "offeringId": "${oid}",
      "title": "Biscayne Bay Sunset Sail",
      "hostName": "Marco Reyes",
      "appointmentAt": "${s.date}T${s.time}:00.000Z",
      "status": "confirmed",
      "priceCents": 5500,
      "currency": "USD"
    }
  ]
}`,
    },
    {
      key: "booking-create",
      group: "guest",
      method: "POST",
      title: "Create a booking",
      description:
        "Books a service at a given date and time. When x402 payments are enabled, a request without payment first returns HTTP 402 with the payment requirements; you then retry the same request with a signed X-PAYMENT header to pay in USDC.",
      path: "/api/v1/bookings",
      bodyParams: [
        { name: "offeringId", type: "string", required: true, description: "The offering to book." },
        { name: "date", type: "string", required: true, description: "Target date, YYYY-MM-DD." },
        { name: "time", type: "string", required: true, description: "Start time, 24h HH:MM." },
      ],
      bodyExample: `{
  "offeringId": "${oid}",
  "date": "${s.date}",
  "time": "${s.time}"
}`,
      responseExample: `{
  "data": {
    "id": "BOOKING_ID",
    "offeringId": "${oid}",
    "appointmentAt": "${s.date}T${s.time}:00.000Z",
    "status": "confirmed",
    "priceCents": 5500,
    "currency": "USD",
    "createdAt": "2026-06-22T12:00:00.000Z"
  }
}`,
      notes: [
        "Returns 201 on success.",
        "With x402 enabled, an unpaid request returns 402 with payment details in the body. See the x402 demo above.",
      ],
    },
    {
      key: "booking-cancel",
      group: "guest",
      method: "POST",
      title: "Cancel a booking",
      description: "Cancels one of your own bookings by its booking ID and returns the updated record.",
      path: "/api/v1/bookings/:id/cancel",
      pathParams: [
        { name: "id", type: "string", required: true, description: "The booking ID to cancel.", placeholder: "BOOKING_ID" },
      ],
      responseExample: `{
  "data": {
    "id": "BOOKING_ID",
    "offeringId": "${oid}",
    "appointmentAt": "${s.date}T${s.time}:00.000Z",
    "status": "canceled",
    "priceCents": 5500,
    "currency": "USD",
    "createdAt": "2026-06-22T12:00:00.000Z"
  }
}`,
    },
    {
      key: "review-create",
      group: "guest",
      method: "POST",
      title: "Review a booking",
      description:
        "Leaves a star rating and an optional comment on a booking, once that booking is completed. One review per booking.",
      path: "/api/v1/reviews",
      bodyParams: [
        { name: "bookingId", type: "string", required: true, description: "The completed booking to review." },
        { name: "rating", type: "integer", required: true, description: "Star rating from 1 to 5." },
        { name: "comment", type: "string", required: false, description: "Optional free-text comment (max 2000 chars)." },
      ],
      bodyExample: `{
  "bookingId": "BOOKING_ID",
  "rating": 5,
  "comment": "Great experience!"
}`,
      responseExample: `{
  "data": {
    "id": "REVIEW_ID",
    "bookingId": "BOOKING_ID",
    "offeringId": "${oid}",
    "rating": 5,
    "comment": "Great experience!",
    "createdAt": "2026-06-22T12:00:00.000Z"
  }
}`,
      notes: ["Returns 409 if the booking isn't completed yet, or has already been reviewed."],
    },

    /* ---- Host ---- */
    {
      key: "offering-create",
      group: "host",
      method: "POST",
      title: "Create a listing",
      description:
        "Creates a new offering as a draft under your provider profile. Requires a host account. Prices are integer cents. Only the required fields are mandatory. The rest fall back to sensible defaults.",
      path: "/api/v1/offerings",
      bodyParams: [
        { name: "type", type: "enum", required: true, description: "service or experience." },
        { name: "title", type: "string", required: true, description: "3–160 characters." },
        { name: "priceCents", type: "integer", required: true, description: "Price in cents (e.g. 4500 = $45.00)." },
        { name: "durationMinutes", type: "integer", required: true, description: "5–1440 minutes." },
        { name: "description", type: "string", required: false, description: "Up to 5000 characters." },
        { name: "category", type: "string", required: false, description: "Display category." },
        { name: "format", type: "enum", required: false, description: "public_group · private_group · one_on_one · class_workshop. Default public_group." },
        { name: "locationType", type: "enum", required: false, description: "at_host · at_guest · online. Default at_host." },
        { name: "currency", type: "enum", required: false, description: "USD or EUR. Default USD." },
        { name: "capacity", type: "integer", required: false, description: "Max guests. Default 1." },
        { name: "includedItems", type: "string[]", required: false, description: "What's included." },
        { name: "requirements", type: "string[]", required: false, description: "What guests should bring/know." },
        { name: "cancellationPolicy", type: "enum", required: false, description: "flexible · moderate · strict. Default flexible." },
      ],
      bodyExample: `{
  "type": "experience",
  "title": "My new experience",
  "description": "A great time, hosted by me.",
  "category": "Activities & tours",
  "priceCents": 4500,
  "currency": "USD",
  "durationMinutes": 120,
  "capacity": 8,
  "includedItems": ["Equipment", "Snacks"],
  "requirements": ["Comfortable shoes"],
  "cancellationPolicy": "moderate"
}`,
      responseExample: `{
  "data": {
    "id": "NEW_OFFERING_ID",
    "status": "draft",
    "title": "My new experience",
    "priceCents": 4500,
    "currency": "USD",
    "durationMinutes": 120,
    "provider": { "name": "You", "isVerified": false }
  }
}`,
      notes: [
        HOST_BADGE + ". Returns 403 if your account has no provider profile.",
        "New listings start as draft. Publish them with the update endpoint below.",
      ],
    },
    {
      key: "offering-update",
      group: "host",
      method: "PATCH",
      title: "Update / publish a listing",
      description:
        "Updates any subset of fields on a listing you own. Set status to \"published\" to make it live, or \"archived\" to hide it. Send only the fields you want to change.",
      path: "/api/v1/offerings/:id",
      pathParams: [
        { name: "id", type: "string", required: true, description: "The offering to update (must be yours).", prefill: s.offeringId, placeholder: "OFFERING_ID" },
      ],
      bodyParams: [
        { name: "status", type: "enum", required: false, description: "draft · published · archived." },
        { name: "title", type: "string", required: false, description: "New title." },
        { name: "priceCents", type: "integer", required: false, description: "New price in cents." },
        { name: "…", type: "any", required: false, description: "Any field from Create a listing is accepted." },
      ],
      bodyExample: `{
  "status": "published",
  "priceCents": 5000
}`,
      responseExample: `{
  "data": {
    "id": "${oid}",
    "status": "published",
    "title": "My new experience",
    "priceCents": 5000,
    "currency": "USD",
    "publishedAt": "2026-06-22T12:00:00.000Z"
  }
}`,
      notes: [HOST_BADGE + ". Returns 404 if the listing isn't yours."],
    },
    {
      key: "offering-availability-set",
      group: "host",
      method: "PUT",
      title: "Set weekly availability",
      description:
        "Replaces the entire weekly availability schedule for a listing you own. Send all the windows you want; anything not included is removed.",
      path: "/api/v1/offerings/:id/availability",
      pathParams: [
        { name: "id", type: "string", required: true, description: "The offering to schedule (must be yours).", prefill: s.offeringId, placeholder: "OFFERING_ID" },
      ],
      bodyParams: [
        { name: "rules", type: "array", required: true, description: "Up to 7 windows of { dayOfWeek (1–7), startTime, endTime } in 24h HH:MM. End must be after start." },
      ],
      bodyExample: `{
  "rules": [
    { "dayOfWeek": 5, "startTime": "18:00", "endTime": "20:00" },
    { "dayOfWeek": 6, "startTime": "18:00", "endTime": "20:00" }
  ]
}`,
      responseExample: `{
  "data": [
    { "dayOfWeek": 5, "startTime": "18:00", "endTime": "20:00" },
    { "dayOfWeek": 6, "startTime": "18:00", "endTime": "20:00" }
  ]
}`,
      notes: [HOST_BADGE],
    },
  ];
}

/* ------------------------------------------------------------------ */
/* Low-level UI primitives                                             */
/* ------------------------------------------------------------------ */

const inputClass =
  "rounded-lg border border-zinc-300 bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-accent dark:border-zinc-700";

const METHOD_STYLES: Record<Endpoint["method"], string> = {
  GET: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  POST: "bg-accent/15 text-accent",
  PATCH: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  PUT: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
};

function MethodBadge({
  method,
  className,
}: {
  method: Endpoint["method"];
  className?: string;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-md px-2 py-0.5 font-mono text-[11px] font-bold tracking-wide ${METHOD_STYLES[method]} ${className ?? ""}`}
    >
      {method}
    </span>
  );
}

const HTML_ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;" };

/** Tiny JSON syntax highlighter → HTML string of <span>s for dark code panels. */
function highlightJson(json: string): string {
  const escaped = json.replace(/[&<>]/g, (c) => HTML_ESCAPES[c]);
  return escaped.replace(
    /("(?:\\.|[^"\\])*"(\s*:)?)|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
    (match, str, colon, keyword, num) => {
      if (str !== undefined) {
        // A string followed by ":" is a key; otherwise a string value.
        return colon
          ? `<span class="text-sky-300">${match}</span>`
          : `<span class="text-amber-200">${match}</span>`;
      }
      if (keyword !== undefined) return `<span class="text-fuchsia-300">${match}</span>`;
      if (num !== undefined) return `<span class="text-emerald-300">${match}</span>`;
      return match;
    },
  );
}

/** Dark, labeled code panel with a copy button — the signature "docs" element. */
function CodeBlock({
  code,
  label,
  lang,
}: {
  code: string;
  label: string;
  lang?: "json" | "bash";
}) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    const res = await tryCatch(navigator.clipboard.writeText(code));
    if (res.ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
        <span className="font-mono text-[11px] font-medium uppercase tracking-wide text-zinc-400">
          {label}
        </span>
        <button
          type="button"
          onClick={copy}
          className="rounded-md px-2 py-0.5 text-[11px] font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-xs leading-relaxed text-zinc-100">
        {lang === "json" ? (
          <code dangerouslySetInnerHTML={{ __html: highlightJson(code) }} />
        ) : (
          <code>{code}</code>
        )}
      </pre>
    </div>
  );
}

function ParamTable({ title, params }: { title: string; params: Param[] }) {
  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {title}
      </h4>
      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="bg-zinc-50 text-zinc-500 dark:bg-zinc-900/50 dark:text-zinc-400">
              <th className="px-3 py-2 font-medium">Field</th>
              <th className="px-3 py-2 font-medium">Type</th>
              <th className="px-3 py-2 font-medium">Required</th>
              <th className="px-3 py-2 font-medium">Description</th>
            </tr>
          </thead>
          <tbody>
            {params.map((p) => (
              <tr
                key={p.name}
                className="border-t border-zinc-200 align-top dark:border-zinc-800"
              >
                <td className="px-3 py-2 font-mono font-semibold text-foreground">
                  {p.name}
                </td>
                <td className="px-3 py-2 font-mono text-zinc-400">{p.type}</td>
                <td className="px-3 py-2">
                  {p.required ? (
                    <span className="font-semibold text-accent">Required</span>
                  ) : (
                    <span className="text-zinc-400">Optional</span>
                  )}
                </td>
                <td className="px-3 py-2 leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {p.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Build a copy-pasteable curl command for an endpoint, with sample values. */
function curlFor(ep: Endpoint, baseUrl: string): string {
  let path = ep.path;
  for (const p of ep.pathParams ?? []) {
    path = path.replace(`:${p.name}`, p.prefill || p.placeholder || `:${p.name}`);
  }
  const lines = [
    `curl -X ${ep.method} "${baseUrl}${path}"`,
    `  -H "Authorization: Bearer YOUR_API_KEY"`,
  ];
  if (ep.bodyExample) {
    lines.push(`  -H "Content-Type: application/json"`);
    lines.push(`  -d '${ep.bodyExample}'`);
  }
  return lines.join(" \\\n");
}

/* ------------------------------------------------------------------ */
/* Per-endpoint documentation + live tester                            */
/* ------------------------------------------------------------------ */

function EndpointDoc({
  endpoint,
  apiKey,
  baseUrl,
}: {
  endpoint: Endpoint;
  apiKey: string;
  baseUrl: string;
}) {
  const [pathValues, setPathValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const p of endpoint.pathParams ?? []) init[p.name] = p.prefill ?? "";
    return init;
  });
  const [queryValues, setQueryValues] = useState<Record<string, string>>({});
  const [body, setBody] = useState(endpoint.bodyExample ?? "");
  const [resp, setResp] = useState<{ status: number; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [tryOpen, setTryOpen] = useState(false);

  async function send() {
    let path = endpoint.path;
    for (const p of endpoint.pathParams ?? []) {
      path = path.replace(
        `:${p.name}`,
        encodeURIComponent(pathValues[p.name]?.trim() ?? ""),
      );
    }
    const qs = new URLSearchParams();
    for (const q of endpoint.queryParams ?? []) {
      const v = queryValues[q.name]?.trim();
      if (v) qs.set(q.name, v);
    }
    const url = qs.toString() ? `${path}?${qs.toString()}` : path;

    const headers: Record<string, string> = {};
    if (apiKey.trim()) headers.Authorization = `Bearer ${apiKey.trim()}`;
    const init: RequestInit = { method: endpoint.method, headers };
    if (endpoint.method !== "GET" && body.trim()) {
      headers["Content-Type"] = "application/json";
      init.body = body;
    }

    setLoading(true);
    setResp(null);
    const res = await tryCatch(fetch(url, init));
    setLoading(false);
    if (!res.ok) {
      setResp({ status: 0, text: "Network error. Could not reach the API." });
      return;
    }
    const text = await res.data.text();
    let pretty = text;
    try {
      pretty = JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      /* leave as-is for non-JSON */
    }
    setResp({ status: res.data.status, text: pretty });
  }

  const ok = resp && resp.status >= 200 && resp.status < 300;

  return (
    <section id={endpoint.key} className="scroll-mt-36 border-t border-zinc-200 pt-10 dark:border-zinc-800">
      {/* Title + request line */}
      <h3 className="text-xl font-semibold tracking-tight text-foreground">
        {endpoint.title}
      </h3>
      <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-900/40">
        <MethodBadge method={endpoint.method} />
        <code className="break-all font-mono text-sm text-foreground">
          {endpoint.path}
        </code>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        {endpoint.description}
      </p>

      {endpoint.notes && (
        <ul className="mt-3 flex flex-col gap-1">
          {endpoint.notes.map((n) => (
            <li
              key={n}
              className="flex gap-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400"
            >
              <span className="text-accent">•</span>
              <span>{n}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Two-column docs: params on the left, code on the right (Stripe-style) */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          {endpoint.pathParams && (
            <ParamTable title="Path parameters" params={endpoint.pathParams} />
          )}
          {endpoint.queryParams && (
            <ParamTable title="Query parameters" params={endpoint.queryParams} />
          )}
          {endpoint.bodyParams && (
            <ParamTable title="Body parameters" params={endpoint.bodyParams} />
          )}
          {!endpoint.pathParams &&
            !endpoint.queryParams &&
            !endpoint.bodyParams && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No parameters.
              </p>
            )}
        </div>

        <div className="flex flex-col gap-4">
          <CodeBlock label="Request" code={curlFor(endpoint, baseUrl)} lang="bash" />
          <CodeBlock label="Response" code={endpoint.responseExample} lang="json" />
        </div>
      </div>

      {/* Live tester */}
      <div className="mt-5">
        <button
          type="button"
          onClick={() => setTryOpen((v) => !v)}
          className="flex items-center gap-2 text-sm font-medium text-accent transition-opacity hover:opacity-80"
        >
          <svg
            viewBox="0 0 24 24"
            className={`h-4 w-4 transition-transform ${tryOpen ? "rotate-90" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
          {tryOpen ? "Hide tester" : "Try it"}
        </button>

        {tryOpen && (
          <div className="mt-3 flex flex-col gap-3 rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/30">
            {endpoint.pathParams && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {endpoint.pathParams.map((p) => (
                  <label
                    key={p.name}
                    className="flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400"
                  >
                    {p.name}
                    <input
                      value={pathValues[p.name] ?? ""}
                      onChange={(e) =>
                        setPathValues((v) => ({ ...v, [p.name]: e.target.value }))
                      }
                      placeholder={p.placeholder ?? `:${p.name}`}
                      className={inputClass}
                    />
                  </label>
                ))}
              </div>
            )}

            {endpoint.queryParams && (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {endpoint.queryParams.map((q) => (
                  <label
                    key={q.name}
                    className="flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400"
                  >
                    {q.name}
                    <input
                      value={queryValues[q.name] ?? ""}
                      onChange={(e) =>
                        setQueryValues((v) => ({ ...v, [q.name]: e.target.value }))
                      }
                      placeholder={q.placeholder}
                      className={inputClass}
                    />
                  </label>
                ))}
              </div>
            )}

            {endpoint.bodyExample !== undefined && (
              <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Request body (JSON)
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={Math.min(12, body.split("\n").length + 1)}
                  spellCheck={false}
                  className={`${inputClass} font-mono`}
                />
              </label>
            )}

            <div>
              <button
                type="button"
                onClick={send}
                disabled={loading}
                className="rounded-full bg-accent px-4 py-1.5 text-xs font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Sending…" : `Send ${endpoint.method}`}
              </button>
            </div>

            {resp && (
              <div className="flex flex-col gap-1.5">
                <span
                  className={`text-xs font-semibold ${
                    ok
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {resp.status ? `HTTP ${resp.status}` : "Error"}
                </span>
                <CodeBlock label="Live response" code={resp.text} lang="json" />
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Sidebar with scroll-spy                                             */
/* ------------------------------------------------------------------ */

function useActiveSection(ids: string[]): string {
  const [active, setActive] = useState(ids[0] ?? "");
  const key = ids.join(",");
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-150px 0px -65% 0px", threshold: [0, 0.5, 1] },
    );
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return active;
}

function SidebarLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
        active
          ? "bg-accent/10 font-medium text-accent"
          : "text-zinc-500 hover:bg-zinc-100 hover:text-foreground dark:text-zinc-400 dark:hover:bg-zinc-800"
      }`}
    >
      {children}
    </a>
  );
}

/* ------------------------------------------------------------------ */
/* Top-level reference                                                 */
/* ------------------------------------------------------------------ */

export function ApiPlayground({
  baseUrl,
  samples,
}: {
  baseUrl: string;
  samples: PlaygroundSamples;
}) {
  const [apiKey, setApiKey] = useState("");
  const endpoints = useMemo(() => buildEndpoints(samples), [samples]);
  const guest = endpoints.filter((e) => e.group === "guest");
  const host = endpoints.filter((e) => e.group === "host");

  const navIds = useMemo(
    () => ["authentication", ...endpoints.map((e) => e.key)],
    [endpoints],
  );
  const active = useActiveSection(navIds);

  return (
    <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
      {/* Sidebar — sticks below the navbar; scrolls internally if the list is
          taller than the viewport. */}
      <aside className="hidden lg:sticky lg:top-36 lg:block lg:self-start">
        <nav className="flex max-h-[calc(100vh-10rem)] flex-col gap-1 overflow-y-auto pb-8">
          <span className="px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
            Getting started
          </span>
          <SidebarLink href="#authentication" active={active === "authentication"}>
            Authentication
          </SidebarLink>

          <span className="px-2.5 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
            Guest endpoints
          </span>
          {guest.map((ep) => (
            <SidebarLink key={ep.key} href={`#${ep.key}`} active={active === ep.key}>
              <MethodBadge method={ep.method} className="w-12" />
              <span className="truncate">{ep.title}</span>
            </SidebarLink>
          ))}

          <span className="px-2.5 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
            Host endpoints
          </span>
          {host.map((ep) => (
            <SidebarLink key={ep.key} href={`#${ep.key}`} active={active === ep.key}>
              <MethodBadge method={ep.method} className="w-12" />
              <span className="truncate">{ep.title}</span>
            </SidebarLink>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <div className="min-w-0">
        <header className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            API reference
          </h2>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            A complete reference for the marketplace REST API. Every endpoint has
            its parameters, an example request and response, and a live tester.
            Paste an API key below and call the API right from this page.
          </p>
        </header>

        {/* Authentication */}
        <section id="authentication" className="scroll-mt-36 pt-8 pb-12">
          <h3 className="text-xl font-semibold tracking-tight text-foreground">
            Authentication
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Every request must include your API key as a bearer token. A key acts
            as your account, so which endpoints you can call depends on your role.
            All responses share a consistent envelope.
          </p>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <CodeBlock
              label="Authorization header"
              lang="bash"
              code={`Authorization: Bearer lm_live_…`}
            />
            <CodeBlock
              label="Response envelope"
              lang="json"
              code={`{ "data": { } }
// or on error:
{ "error": { "message": "…", "code": "…" } }`}
            />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium text-foreground">Base URL</span>
            <code className="rounded-md bg-zinc-100 px-2 py-1 font-mono text-xs text-foreground dark:bg-zinc-900">
              {baseUrl}
            </code>
          </div>

          <label className="mt-5 flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Your API key
            <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
              Used by every “Try it” tester below. Never leaves your browser.
            </span>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="lm_live_…"
              spellCheck={false}
              className={`${inputClass} max-w-md font-mono`}
            />
          </label>
        </section>

        {/* Endpoints */}
        {endpoints.map((ep) => (
          <EndpointDoc key={ep.key} endpoint={ep} apiKey={apiKey} baseUrl={baseUrl} />
        ))}
      </div>
    </div>
  );
}
