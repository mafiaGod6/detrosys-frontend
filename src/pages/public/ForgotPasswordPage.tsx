import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Mail,
  Moon,
  Sun,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export function ForgotPasswordPage() {
  const [dark, setDark] = useState(() => {
    const savedTheme = localStorage.getItem("detrosys-theme");

    if (savedTheme) {
      return savedTheme === "dark";
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("detrosys-theme", dark ? "dark" : "light");
  }, [dark]);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!email.trim() || loading) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
          }),
        },
      );

      if (!response.ok) {
        let message = "Unable to send the reset link.";

        try {
          const data = await response.json();

          if (typeof data?.detail === "string") {
            message = data.detail;
          }
        } catch {
          // Keep the fallback message.
        }

        throw new Error(message);
      }

      setSubmitted(true);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to send the reset link. Please try again.",
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
              dark ? "Switch to light theme" : "Switch to dark theme"
            }
            title={dark ? "Light mode" : "Dark mode"}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white/40 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/70 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.08]"
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

        {/* FORGOT PASSWORD */}

        <div className="flex flex-1 items-center justify-center py-16">
          <div className="w-full max-w-[460px]">
            {/* HEADER */}

            <div className="mb-10 text-center">
              <div className="mb-5 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--detrosys-accent)]" />
                Detrosys / Account
              </div>

              <h1 className="text-4xl font-semibold tracking-[-0.055em] sm:text-5xl">
                Forgot your password?
              </h1>

              <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                Enter your email and we&apos;ll send you a secure password
                reset link.
              </p>
            </div>

            {/* FORM CARD */}

            <div className="rounded-[2rem] border border-black/10 bg-white/50 p-6 shadow-[0_30px_100px_rgba(0,0,0,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.035] dark:shadow-[0_30px_100px_rgba(0,0,0,0.2)] sm:p-8">
              {!submitted ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* EMAIL */}

                  <div>
                    <label
                      htmlFor="forgot-email"
                      className="mb-3 block text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400"
                    >
                      Email
                    </label>

                    <div className="relative">
                      <input
                        id="forgot-email"
                        name="email"
                        type="email"
                        value={email}
                        onChange={(event) => {
                          setEmail(event.target.value);

                          if (error) {
                            setError("");
                          }
                        }}
                        placeholder="you@example.com"
                        autoComplete="email"
                        required
                        disabled={loading}
                        className="w-full border-b border-black/15 bg-transparent px-0 py-3 pr-8 text-base outline-none transition-colors placeholder:text-neutral-400 focus:border-[var(--detrosys-accent)] disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:placeholder:text-neutral-600"
                      />

                      <Mail
                        size={15}
                        className="absolute right-0 top-1/2 -translate-y-1/2 text-neutral-400"
                      />
                    </div>
                  </div>

                  {/* ERROR */}

                  {error && (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/[0.05] px-4 py-3 text-xs leading-5 text-red-600 dark:text-red-400">
                      {error}
                    </div>
                  )}

                  {/* SEND BUTTON */}

                  <button
                    type="submit"
                    disabled={loading}
                    className="group flex w-full items-center justify-center gap-3 rounded-full bg-neutral-950 px-6 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none dark:bg-[#f4f1e9] dark:text-neutral-950"
                  >
                    {loading ? "Sending..." : "Send reset link"}

                    {!loading && (
                      <ArrowUpRight
                        size={16}
                        className="transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1"
                      />
                    )}
                  </button>
                </form>
              ) : (
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
                        Reset link sent
                      </p>

                      <p className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">
                        Check your inbox to continue.
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-black/10 pt-6 text-sm leading-6 text-neutral-500 dark:border-white/10 dark:text-neutral-400">
                    We&apos;ve sent a password reset link to{" "}
                    <span className="font-medium text-neutral-800 dark:text-neutral-200">
                      {email}
                    </span>
                    .
                  </div>
                </div>
              )}
            </div>

            {/* BACK TO LOGIN */}

            <div className="mt-7 text-center">
              <a
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white"
              >
                <ArrowLeft size={15} />
                Back to Login
              </a>
            </div>

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