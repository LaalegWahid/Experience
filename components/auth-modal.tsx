"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { authClient, emailOtp, signIn, signUp } from "@/lib/auth-client";
import { setInitialPassword } from "@/app/(auth)/profile-actions";
import { GoogleSignInButton } from "./google-sign-in-button";
import { useLanguage } from "./language-provider";
import { useLockBodyScroll } from "./use-lock-body-scroll";
import { gathraLogo } from "@/shared/brand";

type Step = "email" | "otp" | "password" | "profile";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function AuthModal({
  redirect,
  initialError,
  bypassOtp = false,
  onClose,
}: {
  redirect?: string;
  initialError?: string | null;
  /**
   * When true, email delivery is off, so emailed codes can't be received. The
   * "Confirm it's you" code step is replaced by an email + password step (and
   * sign-up creates the account with a password instead of via a code).
   */
  bypassOtp?: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { t } = useLanguage();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [resent, setResent] = useState(false);

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Lock background scroll while the modal is mounted — this component only
  // renders when open (see AuthModalProvider), so mount/unmount == open/close.
  useLockBodyScroll(true);

  function finish() {
    onClose();
    router.refresh();
    if (redirect) router.push(redirect);
  }

  async function continueFromEmail() {
    setError(null);
    if (!EMAIL_RE.test(email.trim())) {
      setError(t("auth.invalidEmail"));
      return;
    }
    // Email delivery off: authenticate with a password instead of an emailed code.
    if (bypassOtp) {
      setStep("password");
      return;
    }
    setPending(true);
    const { error } = await emailOtp.sendVerificationOtp({
      email: email.trim(),
      type: "sign-in",
    });
    setPending(false);
    if (error) {
      setError(t("auth.sendCodeError"));
      return;
    }
    setCode("");
    setStep("otp");
  }

  async function verifyCode() {
    setError(null);
    if (code.trim().length < 6) {
      setError(t("auth.enterCode"));
      return;
    }
    setPending(true);
    const { error } = await signIn.emailOtp({
      email: email.trim(),
      otp: code.trim(),
    });
    if (error) {
      setPending(false);
      setError(t("auth.codeWrong"));
      return;
    }
    await routeAfterAuth();
  }

  // Email + password sign-in (used when email delivery is off).
  async function submitPassword() {
    setError(null);
    if (!password) {
      setError(t("auth.enterPassword"));
      return;
    }
    setPending(true);
    const { error } = await signIn.email({
      email: email.trim(),
      password,
    });
    if (error) {
      setPending(false);
      setError(t("auth.credsWrong"));
      return;
    }
    await routeAfterAuth();
  }

  // After any successful sign-in: send brand-new accounts (no name yet) to the
  // profile step, otherwise finish.
  async function routeAfterAuth() {
    const { data } = await authClient.getSession();
    setPending(false);
    if (data?.user && !data.user.name?.trim()) {
      setStep("profile");
      return;
    }
    finish();
  }

  async function resend() {
    setError(null);
    setResent(false);
    await emailOtp.sendVerificationOtp({ email: email.trim(), type: "sign-in" });
    setResent(true);
  }

  async function completeProfile() {
    setError(null);
    if (!firstName.trim() || !lastName.trim()) {
      setError(t("auth.enterName"));
      return;
    }
    if (!dob) {
      setError(t("auth.selectDob"));
      return;
    }
    if (password.length < 8) {
      setError(t("auth.passwordLen"));
      return;
    }
    setPending(true);
    const name = `${firstName.trim()} ${lastName.trim()}`;
    const { data } = await authClient.getSession();
    if (data?.user) {
      // Account already exists (created via the email-code path) — fill in the
      // profile and attach a password.
      await authClient.updateUser({ name, dateOfBirth: dob });
      await setInitialPassword(password);
    } else {
      // No session yet (password path with email delivery off) — create the
      // account now, with its password.
      const { error } = await signUp.email({
        email: email.trim(),
        password,
        name,
        dateOfBirth: dob,
      });
      if (error) {
        setPending(false);
        setError(t("auth.createError"));
        return;
      }
    }
    setPending(false);
    finish();
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative flex h-14 items-center justify-center border-b border-zinc-200 dark:border-zinc-800">
          {step !== "email" && (
            <button
              type="button"
              aria-label={t("onb.back")}
              onClick={() => {
                setError(null);
                // Profile is reached from the code step (normal) or the password
                // step (email off); everything else steps back to email.
                if (step === "profile") {
                  setStep(bypassOtp ? "password" : "otp");
                } else {
                  setStep("email");
                }
              }}
              className="absolute left-3 flex h-8 w-8 items-center justify-center rounded-full text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
            </button>
          )}
          <span className="text-sm font-semibold text-foreground">
            {step === "email"
              ? t("auth.headerEmail")
              : step === "otp"
                ? t("auth.headerOtp")
                : step === "password"
                  ? t("auth.headerPassword")
                  : t("auth.headerProfile")}
          </span>
          <button
            type="button"
            aria-label={t("booking.close")}
            onClick={onClose}
            className="absolute right-3 flex h-8 w-8 items-center justify-center rounded-full text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6">
          {step === "email" && (
            <>
              <div className="mb-5 flex flex-col items-center text-center">
                <Image src={gathraLogo} alt="" className="h-10 w-auto" />
                <h2 className="mt-4 text-xl font-semibold text-foreground">
                  {t("auth.welcome")}
                </h2>
              </div>
              <label className="block rounded-xl border border-zinc-300 px-3 py-2 transition-colors focus-within:border-accent dark:border-zinc-700">
                <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  {t("onb.email")}
                </span>
                <input
                  type="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && continueFromEmail()}
                  placeholder="you@example.com"
                  className="block w-full bg-transparent text-sm text-foreground outline-none placeholder:text-zinc-400"
                />
              </label>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                {bypassOtp ? t("auth.passwordHint") : t("auth.emailHint")}
              </p>
              {error && <ErrorText>{error}</ErrorText>}
              <button
                type="button"
                onClick={continueFromEmail}
                disabled={pending}
                className="mt-4 flex h-12 w-full items-center justify-center rounded-lg bg-accent text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {pending ? t("auth.sending") : t("auth.continue")}
              </button>
              <Divider />
              <GoogleSignInButton
                callbackURL={redirect ?? "/"}
                errorCallbackURL="/?auth=login&error=google"
              />
            </>
          )}

          {step === "otp" && (
            <>
              <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
                {t("auth.codeSentTo")
                  .split("{email}")
                  .flatMap((part, i) =>
                    i === 0
                      ? [part]
                      : [
                          <span key="e" className="font-medium text-foreground">
                            {email}
                          </span>,
                          part,
                        ],
                  )}
              </p>
              <input
                inputMode="numeric"
                autoFocus
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => e.key === "Enter" && verifyCode()}
                placeholder="••••••"
                className="mx-auto mt-6 block w-48 rounded-xl border border-zinc-300 bg-transparent py-3 text-center text-2xl font-semibold tracking-[0.4em] text-foreground outline-none transition-colors focus:border-accent dark:border-zinc-700"
              />
              {error && <ErrorText center>{error}</ErrorText>}
              <button
                type="button"
                onClick={verifyCode}
                disabled={pending}
                className="mt-5 flex h-12 w-full items-center justify-center rounded-lg bg-accent text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {pending ? t("auth.verifying") : t("auth.continue")}
              </button>
              <p className="mt-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
                {t("auth.didntGet")}{" "}
                <button
                  type="button"
                  onClick={resend}
                  className="font-semibold text-foreground underline underline-offset-2"
                >
                  {t("auth.resend")}
                </button>
                {resent && (
                  <span className="ml-1 text-green-600">{t("auth.sent")}</span>
                )}
              </p>
            </>
          )}

          {step === "password" && (
            <>
              <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
                {t("auth.enterPasswordFor")
                  .split("{email}")
                  .flatMap((part, i) =>
                    i === 0
                      ? [part]
                      : [
                          <span key="e" className="font-medium text-foreground">
                            {email}
                          </span>,
                          part,
                        ],
                  )}
              </p>
              <div className="mt-6 flex items-center rounded-xl border border-zinc-300 px-3 transition-colors focus-within:border-accent dark:border-zinc-700">
                <input
                  type={showPassword ? "text" : "password"}
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitPassword()}
                  placeholder={t("auth.yourPassword")}
                  className="block w-full bg-transparent py-3 text-sm text-foreground outline-none placeholder:text-zinc-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="ml-2 shrink-0 text-xs font-semibold text-foreground underline underline-offset-2"
                >
                  {showPassword ? t("auth.hide") : t("auth.show")}
                </button>
              </div>
              {error && <ErrorText>{error}</ErrorText>}
              <button
                type="button"
                onClick={submitPassword}
                disabled={pending}
                className="mt-5 flex h-12 w-full items-center justify-center rounded-lg bg-accent text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {pending ? t("auth.signingIn") : t("nav.signIn")}
              </button>
              <p className="mt-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
                {t("auth.newHere")}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setStep("profile");
                  }}
                  className="font-semibold text-foreground underline underline-offset-2"
                >
                  {t("auth.createAccount")}
                </button>
              </p>
            </>
          )}

          {step === "profile" && (
            <>
              <p className="mb-4 text-sm font-medium text-foreground">
                {t("auth.legalName")}
              </p>
              <div className="overflow-hidden rounded-xl border border-zinc-300 dark:border-zinc-700">
                <input
                  autoFocus
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder={t("onb.firstName")}
                  className="block w-full border-b border-zinc-300 bg-transparent px-3 py-3 text-sm text-foreground outline-none placeholder:text-zinc-400 dark:border-zinc-700"
                />
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && completeProfile()}
                  placeholder={t("onb.lastName")}
                  className="block w-full bg-transparent px-3 py-3 text-sm text-foreground outline-none placeholder:text-zinc-400"
                />
              </div>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                {t("auth.nameHint")}
              </p>

              <p className="mb-2 mt-5 text-sm font-medium text-foreground">
                {t("onb.dob")}
              </p>
              <input
                type="date"
                value={dob}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setDob(e.target.value)}
                className="block w-full rounded-xl border border-zinc-300 bg-transparent px-3 py-3 text-sm text-foreground outline-none transition-colors focus:border-accent dark:border-zinc-700"
              />

              <p className="mb-2 mt-5 text-sm font-medium text-foreground">
                {t("auth.password")}
              </p>
              <div className="flex items-center rounded-xl border border-zinc-300 px-3 transition-colors focus-within:border-accent dark:border-zinc-700">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && completeProfile()}
                  placeholder={t("auth.createPassword")}
                  className="block w-full bg-transparent py-3 text-sm text-foreground outline-none placeholder:text-zinc-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="ml-2 shrink-0 text-xs font-semibold text-foreground underline underline-offset-2"
                >
                  {showPassword ? t("auth.hide") : t("auth.show")}
                </button>
              </div>

              {error && <ErrorText>{error}</ErrorText>}
              <p className="mt-4 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                {t("auth.termsPrefix")}{" "}
                <span className="font-semibold">{t("onb.agree")}</span>
                {t("auth.termsSuffix")}
              </p>
              <button
                type="button"
                onClick={completeProfile}
                disabled={pending}
                className="mt-4 flex h-12 w-full items-center justify-center rounded-lg bg-accent text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {pending ? t("auth.finishing") : t("onb.agree")}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ErrorText({
  children,
  center,
}: {
  children: React.ReactNode;
  center?: boolean;
}) {
  return (
    <p
      className={`mt-2 text-sm text-red-600 dark:text-red-400 ${center ? "text-center" : ""}`}
    >
      {children}
    </p>
  );
}

function Divider() {
  const { t } = useLanguage();
  return (
    <div className="my-5 flex items-center gap-3 text-xs text-zinc-400">
      <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
      {t("auth.or")}
      <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
    </div>
  );
}
