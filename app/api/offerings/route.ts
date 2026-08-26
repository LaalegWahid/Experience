import { NextResponse } from "next/server";
import { searchOfferings } from "@/lib/offerings";

// GET /api/offerings — published offerings for the public marketplace grid,
// filtered by the "where" / "when" / "what" params the home search uses.
// Consumed client-side by TanStack Query so the browse view can cache results
// and show skeletons while loading.
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;

  const where = params.get("where")?.trim() || undefined;
  const when = params.get("when")?.trim() || undefined;
  const category = params.get("category")?.trim() || undefined;

  const results = await searchOfferings({
    where,
    date: when && /^\d{4}-\d{2}-\d{2}$/.test(when) ? when : undefined,
    category,
  });

  return NextResponse.json(results);
}
