import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { emailOTP } from "better-auth/plugins";
import { db } from "@/db";
import * as authSchema from "@/db/auth-schema";
import { env } from "@/shared/utils/env";
import { sendEmail } from "./email";
import { DEFAULT_ROLE, isSelfRegisterableRole } from "./roles";

export { ROLES, type Role } from "./roles";

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: authSchema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  // "Continue with Google" is enabled only when both credentials are set, so
  // the app still runs without them. New Google users default to the guest role.
  ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
    ? {
        socialProviders: {
          google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          },
        },
      }
    : {}),
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: DEFAULT_ROLE,
        // The role is accepted from sign-up input, but the database hook below
        // sanitizes it so only self-registerable roles (never "admin") can be
        // set this way. Admins must be promoted server-side.
        input: true,
      },
      // ISO yyyy-mm-dd, collected on the sign-up popup's profile step.
      dateOfBirth: {
        type: "string",
        required: false,
        input: true,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // Enforce, server-side, that nobody can self-register as "admin"
          // (or with any unknown role) by posting directly to the API.
          const requestedRole = (user as { role?: unknown }).role;
          const role = isSelfRegisterableRole(requestedRole)
            ? requestedRole
            : DEFAULT_ROLE;
          return { data: { ...user, role } };
        },
      },
    },
  },
  plugins: [
    // Passwordless sign-in: the guest enters their email and we send a 6-digit
    // code. Signing in with a code for an unknown email creates the account
    // (role defaults to guest via the databaseHook above).
    emailOTP({
      otpLength: 6,
      expiresIn: 600, // 10 minutes
      async sendVerificationOTP({ email, otp, type }) {
        const subject =
          type === "sign-in"
            ? "Your sign-in code"
            : "Your verification code";
        await sendEmail({
          to: email,
          subject,
          text: `Your ${subject.toLowerCase()} is ${otp}. It expires in 10 minutes.`,
          html: `<div style="font-family:system-ui,sans-serif;max-width:420px;margin:auto">
            <p style="font-size:15px;color:#333">Here is your code:</p>
            <p style="font-size:34px;font-weight:700;letter-spacing:8px;color:#be6140">${otp}</p>
            <p style="font-size:13px;color:#888">It expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
          </div>`,
        });
      },
    }),
    // Keep nextCookies last so it can set cookies on the outgoing response.
    nextCookies(),
  ],
});
