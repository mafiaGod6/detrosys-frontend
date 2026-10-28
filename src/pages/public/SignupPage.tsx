import {
  ArrowUpRight,
  Eye,
  EyeOff,
  Moon,
  Sun,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { apiRequest } from "../../api/client";

const MIN_PASSWORD_LENGTH = 8;

export function SignupPage() {
  const navigate = useNavigate();

  const [dark, setDark] = useState(() => {
    const savedTheme = localStorage.getItem("detrosys-theme");

    if (savedTheme) {
      return savedTheme === "dark";
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("detrosys-theme", dark ? "dark" : "light");
  }, [dark]);

  const passwordLongEnough =
    password.length >= MIN_PASSWORD_LENGTH;

  const passwordsMatch =
    confirmPassword.length > 0 &&
    password === confirmPassword;

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (
      !passwordLongEnough ||
      !passwordsMatch ||
      isSubmitting
    ) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
        }),
      });

      // Save email permanently for the resend verification flow
      localStorage.setItem("detrosys_pending_email", email);
      
      // Navigate with router state as a primary handoff
      navigate("/verify-email", { state: { email } });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unable to create your account.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative flex min-h-screen overflow-hidden bg-[#f4f1e9] text-neutral-950 dark:bg-neutral-950 dark:text-white">
      {/* BACKGROUND DESIGN */}
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

        {/* SIGN UP */}
        <div className="flex flex-1 items-center justify-center py-16">
          <div className="w-full max-w-[460px]">
            {/* HEADER */}
            <div className="mb-10 text-center">
              <div className="mb-5 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--detrosys-accent)]" />
                Detrosys / Account
              </div>

              <h1 className="text-4xl font-semibold tracking-[-0.055em] sm:text-5xl">
                Create your account.
              </h1>

              <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                Start with the workspace. The rest can come later.
              </p>
            </div>

            {/* FORM CARD */}
            <div className="rounded-[2rem] border border-black/10 bg-white/50 p-6 shadow-[0_30px_100px_rgba(0,0,0,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.035] dark:shadow-[0_30px_100px_rgba(0,0,0,0.2)] sm:p-8">
              <form
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                <div>
                  <label
                    htmlFor="signup-email"
                    className="mb-3 block text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400"
                  >
                    Email
                  </label>

                  <input
                    id="signup-email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    className="w-full border-b border-black/15 bg-transparent px-0 py-3 text-base outline-none transition-colors placeholder:text-neutral-400 focus:border-[var(--detrosys-accent)] dark:border-white/15 dark:placeholder:text-neutral-600"
                  />
                </div>

                <div>
                  <label
                    htmlFor="signup-password"
                    className="mb-3 block text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400"
                  >
                    Password
                  </label>

                  <div className="relative">
                    <input
                      id="signup-password"
                      name="password"
                      type={
                        showPassword ? "text" : "password"
                      }
                      value={password}
                      onChange={(event) =>
                        setPassword(event.target.value)
                      }
                      placeholder="Create a password"
                      autoComplete="new-password"
                      required
                      minLength={MIN_PASSWORD_LENGTH}
                      className="w-full border-b border-black/15 bg-transparent px-0 py-3 pr-10 text-base outline-none transition-colors placeholder:text-neutral-400 focus:border-[var(--detrosys-accent)] dark:border-white/15 dark:placeholder:text-neutral-600"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((value) => !value)
                      }
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                      className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-neutral-400 transition-colors hover:text-neutral-950 dark:hover:text-white"
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
                      At least 8 characters
                    </span>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="signup-confirm-password"
                    className="mb-3 block text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400"
                  >
                    Confirm password
                  </label>

                  <div className="relative">
                    <input
                      id="signup-confirm-password"
                      name="confirmPassword"
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(
                          event.target.value
                        )
                      }
                      placeholder="Enter your password again"
                      autoComplete="new-password"
                      required
                      className="w-full border-b border-black/15 bg-transparent px-0 py-3 pr-10 text-base outline-none transition-colors placeholder:text-neutral-400 focus:border-[var(--detrosys-accent)] dark:border-white/15 dark:placeholder:text-neutral-600"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(
                          (value) => !value
                        )
                      }
                      aria-label={
                        showConfirmPassword
                          ? "Hide password"
                          : "Show password"
                      }
                      className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-neutral-400 transition-colors hover:text-neutral-950 dark:hover:text-white"
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
                        className={`h-1.5 w-1.5 ${
                          passwordsMatch
                            ? "bg-[var(--detrosys-accent)]"
                            : "bg-neutral-300 dark:bg-neutral-700"
                        } rounded-full`}
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

                {error && (
                  <p className="text-sm text-red-500">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={
                    !passwordLongEnough ||
                    !passwordsMatch ||
                    isSubmitting
                  }
                  className="group flex w-full items-center justify-center gap-3 rounded-full bg-neutral-950 px-6 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none dark:bg-[#f4f1e9] dark:text-neutral-950"
                >
                  {isSubmitting
                    ? "Creating account..."
                    : "Create account"}

                  {!isSubmitting && (
                    <ArrowUpRight
                      size={16}
                      className="transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1"
                    />
                  )}
                </button>
              </form>

              <p className="mt-7 text-center text-[11px] leading-5 text-neutral-400">
                By creating an account, you agree to our{" "}
                <a
                  href="/terms"
                  className="underline underline-offset-2 transition-colors hover:text-neutral-950 dark:hover:text-white"
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="/privacy"
                  className="underline underline-offset-2 transition-colors hover:text-neutral-950 dark:hover:text-white"
                >
                  Privacy Policy
                </a>
                .
              </p>
            </div>

            <p className="mt-7 text-center text-sm text-neutral-500 dark:text-neutral-400">
              Already have an account?{" "}
              <a
                href="/login"
                className="font-semibold text-neutral-950 underline decoration-black/20 underline-offset-4 transition-colors hover:decoration-[var(--detrosys-accent)] dark:text-white dark:decoration-white/20"
              >
                Log in
              </a>
            </p>

            <div className="mt-12 flex items-center justify-center gap-3 text-[9px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
              <span>Detrosys</span>
              <span className="h-px w-8 bg-neutral-300 dark:bg-neutral-700" />
              <span>Your workspace starts here.</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}