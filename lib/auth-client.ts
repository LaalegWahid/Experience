import { createAuthClient } from "better-auth/react";
import {
  emailOTPClient,
  inferAdditionalFields,
} from "better-auth/client/plugins";
import type { auth } from "./auth";

export const authClient = createAuthClient({
  // Infers the custom `role` field (and any other additional fields)
  // from the server auth instance so it is typed on the client.
  plugins: [inferAdditionalFields<typeof auth>(), emailOTPClient()],
});

export const { signIn, signUp, signOut, useSession, getSession, emailOtp } =
  authClient;
