import { NextResponse, type NextRequest } from "next/server";
import {
  getValidServiceReferralByToken,
  SERVICE_REFERRAL_COOKIE,
} from "@/lib/referrals";
import { env } from "@/shared/utils/env";

type Ctx = { params: Promise<{ token: string }> };

// GET /refer/<token> — entry point for a service referral link.
//
// Valid link → stash the token in an httpOnly cookie (so it survives sign-up)
//              and land the invitee on the promoted service's page. The link is
//              attributed when the invitee pays for that service (see the
//              checkout routes), and the referrer earns their commission.
// Bad link   → bounce to the shared "expired" page.
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { token } = await params;
  const base = env.BETTER_AUTH_URL.replace(/\/$/, "");

  const referral = await getValidServiceReferralByToken(token);
  if (!referral) {
    return NextResponse.redirect(`${base}/invite/expired`);
  }

  const res = NextResponse.redirect(`${base}/services/${referral.offeringId}`);
  res.cookies.set(SERVICE_REFERRAL_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: base.startsWith("https://"),
    // Expire the cookie no later than the link itself.
    maxAge: Math.max(
      0,
      Math.floor((referral.expiresAt.getTime() - Date.now()) / 1000),
    ),
  });
  return res;
}
