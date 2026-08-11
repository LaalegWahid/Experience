import { NextResponse } from "next/server";

// Consistent envelope for every /api/v1 response so external clients can rely
// on a stable shape: success -> { data }, failure -> { error: { message, code } }.

export function apiOk<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ data }, { status });
}

export function apiError(
  status: number,
  message: string,
  code?: string,
): NextResponse {
  return NextResponse.json(
    { error: { message, code: code ?? null } },
    { status },
  );
}
