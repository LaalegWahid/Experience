"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { AuthModal } from "./auth-modal";

type OpenOptions = { redirect?: string; error?: string | null };

const AuthModalContext = createContext<{
  openAuth: (options?: OpenOptions) => void;
}>({ openAuth: () => {} });

/** Open the login/sign-up popup from any client component. */
export function useAuthModal() {
  return useContext(AuthModalContext);
}

export function AuthModalProvider({
  children,
  bypassOtp = false,
}: {
  children: React.ReactNode;
  /** Use email + password instead of an emailed code (email delivery is off). */
  bypassOtp?: boolean;
}) {
  const [state, setState] = useState<
    { open: false } | { open: true; redirect?: string; error?: string | null }
  >({ open: false });

  const pathname = usePathname();

  const openAuth = useCallback((options?: OpenOptions) => {
    setState({ open: true, ...options });
  }, []);
  const close = useCallback(() => setState({ open: false }), []);

  // Let server redirects (e.g. /login?redirect=…) open the popup by landing on
  // any page with ?auth=login|signup. Keyed on pathname so it also fires after a
  // client-side navigation lands here. We strip the params afterwards so a
  // refresh doesn't reopen it.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.get("auth")) return;
    const redirect = params.get("redirect") ?? undefined;
    const errCode = params.get("error");
    const error =
      errCode === "account_not_linked"
        ? "This email already has an account. Sign in with your email code instead."
        : errCode === "google"
          ? "We couldn't sign you in with Google. Please try again."
          : null;
    setState({ open: true, redirect, error });

    params.delete("auth");
    params.delete("redirect");
    params.delete("error");
    const qs = params.toString();
    window.history.replaceState(
      {},
      "",
      window.location.pathname + (qs ? `?${qs}` : ""),
    );
  }, [pathname]);

  return (
    <AuthModalContext.Provider value={{ openAuth }}>
      {children}
      {state.open && (
        <AuthModal
          redirect={state.redirect}
          initialError={state.error}
          bypassOtp={bypassOtp}
          onClose={close}
        />
      )}
    </AuthModalContext.Provider>
  );
}
