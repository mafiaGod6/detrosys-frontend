import {
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Moon,
  Sun,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

const MIN_PASSWORD_LENGTH = 8;

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export function ResetPasswordPage() {
  const [dark, setDark] = useState(() => {
    const savedTheme = localStorage.getItem("detrosys-theme");

    if (savedTheme) {
      return savedTheme === "dark";
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("detrosys-theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    if (!success) {
      return;
    }

    const timer = window.setTimeout(() => {
      window.location.assign("/login");
    }, 4000);

    return () => window.clearTimeout(timer);
  }, [success]);

  const passwordLongEnough =
    password.length >= MIN_PASSWORD_LENGTH;

  const passwordsMatch =
    confirmPassword.length > 0 &&
    password === confirmPassword;

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError("");

    if (!token) {
      setError(
        "This password reset link is invalid or incomplete.",
      );
      return;
    }

    if (!passwordLongEnough) {
      setError(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      );
      return;
    }

    if (!passwordsMatch) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            new_password: password,
          }),
        },
      );

      if (!response.ok) {
        let message =
          "Unable to change your password.";

        try {
          const data = await response.json();

          if (typeof data?.detail === "string") {
            message = data.detail;
          }
        } catch {
          // Keep fallback message.
        }

        throw new Error(message);
      }

      setSuccess(true);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to change your password. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen overflow-hidden bg-[#f4f1e9] text-neutral-950 dark:bg-neutral-950 dark:text-white">
      {/* ============================================================
          BACKGROUND DESIGN
          ============================================================ */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-24 h-[520px] w-[520px] rounded-full border border-black/[0.045] dark:border-white/[0.045]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 top-44 h-[360px] w-[360px] rounded-full border border-black/[0.045] dark:border-white/[0.045]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 bottom-0 h-[620px] w-[620px] rounded-full border border-black/[0.045] dark:border-white/[0.045]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[15%] top-[12%] h-40 w-40 rounded-full bg-[var(--detrosys-accent)]/[0.045] blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[12%] left-[18%] h-32 w-32 rounded-full bg-[var(--detrosys-accent)]/[0.04] blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.18] dark:opacity-[0.12]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />

      {/* ============================================================
          CONTENT
          ============================================================ */}

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1500px] flex-col px-6 py-7 sm:px-8 lg:px-12">
        {/* TOP BAR */}

        <div className="flex items-center justify-between">
          <a
            href="/"
            aria-label="Detrosys home"
            className="group inline-flex items-center gap-3"
          >
            <span className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-[0.9rem] bg-neutral-950 text-sm font-semibold text-white shadow-lg transition-transform duration-300 group-hover:-rotate-3 dark:bg-[#f4f1e9] dark:text-neutral-950">
              D

              <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-[var(--detrosys-accent)]" />
            </span>

            <span className="text-base font-semibold tracking-[-0.025em]">
              Detrosys
            </span>
          </a>

          <button
            type="button"
            onClick={() => setDark((value) => !value)}
            aria-label={
              dark
                ? "Switch to light theme"
                : "Switch to dark theme"
            }
            title={dark ? "Light mode" : "Dark mode"}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white/40 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/70 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.08]"
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

        {/* RESET PASSWORD */}

        <div className="flex flex-1 items-center justify-center py-16">
          <div className="w-full max-w-[460px]">
            {/* HEADER */}

            <div className="mb-10 text-center">
              <div className="mb-5 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--detrosys-accent)]" />
                Detrosys / Account
              </div>

              <h1 className="text-4xl font-semibold tracking-[-0.055em] sm:text-5xl">
                Reset your password.
              </h1>

              <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                Create a new password for your account.
              </p>
            </div>

            {/* FORM CARD */}

            <div className="rounded-[2rem] border border-black/10 bg-white/50 p-6 shadow-[0_30px_100px_rgba(0,0,0,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.035] dark:shadow-[0_30px_100px_rgba(0,0,0,0.2)] sm:p-8">
              {!success ? (
                !token ? (
                  <div className="py-2">
                    <div className="mb-6 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-red-500/20 bg-red-500/[0.06]">
                        <AlertCircle
                          size={18}
                          className="text-red-500"
                        />
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-neutral-950 dark:text-white">
                          Invalid reset link
                        </p>

                        <p className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">
                          The link cannot be used.
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-black/10 pt-6 text-sm leading-6 text-neutral-500 dark:border-white/10 dark:text-neutral-400">
                      This password reset page can only be
                      opened through a valid reset link sent to
                      your email.
                    </div>
                  </div>
                ) : (
                  <form
                    onSubmit={handleSubmit}
                    className="space-y-6"
                  >
                    {/* NEW PASSWORD */}

                    <div>
                      <label
                        htmlFor="reset-password"
                        className="mb-3 block text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400"
                      >
                        New password
                      </label>

                      <div className="relative">
                        <input
                          id="reset-password"
                          name="password"
                          type={
                            showPassword
                              ? "text"
                              : "password"
                          }
                          value={password}
                          onChange={(event) => {
                            setPassword(event.target.value);

                            if (error) {
                              setError("");
                            }
                          }}
                          placeholder="Your new password"
                          autoComplete="new-password"
                          required
                          disabled={loading}
                          className="w-full border-b border-black/15 bg-transparent px-0 py-3 pr-10 text-base outline-none transition-colors placeholder:text-neutral-400 focus:border-[var(--detrosys-accent)] disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:placeholder:text-neutral-600"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword(
                              (value) => !value,
                            )
                          }
                          aria-label={
                            showPassword
                              ? "Hide password"
                              : "Show password"
                          }
                          disabled={loading}
                          className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-neutral-400 transition-colors hover:text-neutral-950 disabled:cursor-not-allowed dark:hover:text-white"
                        >
                          {showPassword ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                      </div>

                      <div className="mt-3 flex items-center gap-2 text-[11px] text-neutral-400">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            passwordLongEnough
                              ? "bg-[var(--detrosys-accent)]"
                              : "bg-neutral-300 dark:bg-neutral-700"
                          }`}
                        />

                        <span>
                          At least {MIN_PASSWORD_LENGTH} characters
                        </span>
                      </div>
                    </div>

                    {/* CONFIRM PASSWORD */}

                    <div>
                      <label
                        htmlFor="reset-confirm-password"
                        className="mb-3 block text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400"
                      >
                        Confirm password
                      </label>

                      <div className="relative">
                        <input
                          id="reset-confirm-password"
                          name="confirmPassword"
                          type={
                            showConfirmPassword
                              ? "text"
                              : "password"
                          }
                          value={confirmPassword}
                          onChange={(event) => {
                            setConfirmPassword(
                              event.target.value,
                            );

                            if (error) {
                              setError("");
                            }
                          }}
                          placeholder="Enter your password again"
                          autoComplete="new-password"
                          required
                          disabled={loading}
                          className="w-full border-b border-black/15 bg-transparent px-0 py-3 pr-10 text-base outline-none transition-colors placeholder:text-neutral-400 focus:border-[var(--detrosys-accent)] disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:placeholder:text-neutral-600"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(
                              (value) => !value,
                            )
                          }
                          aria-label={
                            showConfirmPassword
                              ? "Hide password"
                              : "Show password"
                          }
                          disabled={loading}
                          className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-neutral-400 transition-colors hover:text-neutral-950 disabled:cursor-not-allowed dark:hover:text-white"
                        >
                          {showConfirmPassword ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                      </div>

                      {confirmPassword.length > 0 && (
                        <div className="mt-3 flex items-center gap-2 text-[11px]">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              passwordsMatch
                                ? "bg-[var(--detrosys-accent)]"
                                : "bg-neutral-300 dark:bg-neutral-700"
                            }`}
                          />

                          <span
                            className={
                              passwordsMatch
                                ? "text-neutral-500 dark:text-neutral-400"
                                : "text-neutral-400"
                            }
                          >
                            {passwordsMatch
                              ? "Passwords match"
                              : "Passwords do not match"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* ERROR */}

                    {error && (
                      <div className="flex items-start gap-3 border border-red-500/20 bg-red-500/[0.04] px-4 py-3">
                        <AlertCircle
                          size={15}
                          className="mt-0.5 shrink-0 text-red-500"
                        />

                        <p className="text-sm leading-5 text-red-500">
                          {error}
                        </p>
                      </div>
                    )}

                    {/* CONFIRM CHANGE */}

                    <button
                      type="submit"
                      disabled={
                        loading ||
                        !passwordLongEnough ||
                        !passwordsMatch
                      }
                      className="group flex w-full items-center justify-center gap-3 rounded-full bg-neutral-950 px-6 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none dark:bg-[#f4f1e9] dark:text-neutral-950"
                    >
                      {loading
                        ? "Changing password..."
                        : "Confirm change"}

                      {!loading && (
                        <ArrowUpRight
                          size={16}
                          className="transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1"
                        />
                      )}
                    </button>
                  </form>
                )
              ) : (
                /* SUCCESS */

                <div className="py-2">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--detrosys-accent)]/[0.10]">
                      <CheckCircle2
                        size={19}
                        className="text-[var(--detrosys-accent)]"
                      />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-neutral-950 dark:text-white">
                        Password changed successfully
                      </p>

                      <p className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">
                        Your account has been updated.
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-black/10 pt-6 text-sm leading-6 text-neutral-500 dark:border-white/10 dark:text-neutral-400">
                    A confirmation email has been sent to
                    your account. You&apos;ll be redirected to
                    the login page shortly.
                  </div>

                  <div className="mt-6 text-center text-[9px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                    Redirecting to login in 4 seconds
                  </div>
                </div>
              )}
            </div>

            {/* BACK TO LOGIN */}

            {!success && (
              <div className="mt-7 text-center">
                <a
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white"
                >
                  <ArrowLeft size={15} />
                  Back to Login
                </a>
              </div>
            )}

            {/* SMALL BRAND DETAIL */}

            <div className="mt-12 flex items-center justify-center gap-3 text-[9px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
              <span>Detrosys</span>

              <span className="h-px w-8 bg-neutral-300 dark:bg-neutral-700" />

              <span>Your workspace awaits.</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}