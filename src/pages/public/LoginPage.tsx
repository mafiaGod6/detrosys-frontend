import {
  ArrowUpRight,
  Check,
  Eye,
  EyeOff,
  Moon,
  Sun,
} from "lucide-react";
import {
  useEffect,
  useState,
  type FormEvent,
} from "react";
import { useNavigate } from "react-router";
import { apiRequest } from "../../api/client";

type LoginResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
};

type CurrentUser = {
  id: string;
  email: string;
  email_verified: boolean;
  onboarding_complete: boolean;
};

const REMEMBERED_EMAIL_KEY = "detrosys_remembered_email";

export function LoginPage() {
  const navigate = useNavigate();

  const [dark, setDark] = useState(() => {
    const savedTheme = localStorage.getItem("detrosys-theme");

    if (savedTheme) {
      return savedTheme === "dark";
    }

    return window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
  });

  const [showPassword, setShowPassword] = useState(false);

  // Initialize email from localStorage if user previously checked "Remember me"
  const [email, setEmail] = useState(() => {
    return localStorage.getItem(REMEMBERED_EMAIL_KEY) || "";
  });
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(() => {
    return Boolean(localStorage.getItem(REMEMBERED_EMAIL_KEY));
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.documentElement.classList.toggle(
      "dark",
      dark,
    );

    localStorage.setItem(
      "detrosys-theme",
      dark ? "dark" : "light",
    );
  }, [dark]);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const loginData = (await apiRequest(
        "/auth/login",
        {
          method: "POST",
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
            remember_me: rememberMe,
          }),
        },
      )) as LoginResponse;

      if (
        !loginData.access_token ||
        !loginData.refresh_token
      ) {
        throw new Error(
          "Login succeeded but no authentication tokens were returned.",
        );
      }

      // Persist auth tokens
      localStorage.setItem(
        "detrosys_access_token",
        loginData.access_token,
      );

      localStorage.setItem(
        "detrosys_refresh_token",
        loginData.refresh_token,
      );

      // Handle "Remember Me" email persistence
      if (rememberMe) {
        localStorage.setItem(
          REMEMBERED_EMAIL_KEY,
          email.trim().toLowerCase(),
        );
      } else {
        localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      }

      const currentUser = (await apiRequest(
        "/users/me",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${loginData.access_token}`,
          },
        },
      )) as CurrentUser;

      if (
        currentUser.onboarding_complete === true
      ) {
        navigate("/app", {
          replace: true,
        });
      } else {
        navigate("/onboarding", {
          replace: true,
        });
      }
    } catch (err: unknown) {
      localStorage.removeItem(
        "detrosys_access_token",
      );

      localStorage.removeItem(
        "detrosys_refresh_token",
      );

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Unable to log in. Please check your credentials and try again.",
        );
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

      {/* CONTENT */}
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
            {dark ? (
              <Sun size={16} />
            ) : (
              <Moon size={16} />
            )}
          </button>
        </div>

        {/* LOGIN */}
        <div className="flex flex-1 items-center justify-center py-16">
          <div className="w-full max-w-[460px]">
            {/* HEADER */}
            <div className="mb-10 text-center">
              <div className="mb-5 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--detrosys-accent)]" />
                Detrosys / Account
              </div>

              <h1 className="text-4xl font-semibold tracking-[-0.055em] sm:text-5xl">
                Welcome back.
              </h1>

              <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                Pick up where you left off.
              </p>
            </div>

            {/* FORM CARD */}
            <div className="rounded-[2rem] border border-black/10 bg-white/50 p-6 shadow-[0_30px_100px_rgba(0,0,0,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.035] dark:shadow-[0_30px_100px_rgba(0,0,0,0.2)] sm:p-8">
              <form
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                {/* EMAIL */}
                <div>
                  <label
                    htmlFor="login-email"
                    className="mb-3 block text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400"
                  >
                    Email
                  </label>

                  <input
                    id="login-email"
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

                {/* PASSWORD */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <label
                      htmlFor="login-password"
                      className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400"
                    >
                      Password
                    </label>

                    <a
                      href="/forgot-password"
                      className="text-[10px] font-medium text-neutral-400 transition-colors hover:text-neutral-950 dark:hover:text-white"
                    >
                      Forgot password?
                    </a>
                  </div>

                  <div className="relative">
                    <input
                      id="login-password"
                      name="password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={password}
                      onChange={(event) =>
                        setPassword(event.target.value)
                      }
                      placeholder="Your password"
                      autoComplete="current-password"
                      required
                      className="w-full border-b border-black/15 bg-transparent px-0 py-3 pr-10 text-base outline-none transition-colors placeholder:text-neutral-400 focus:border-[var(--detrosys-accent)] dark:border-white/15 dark:placeholder:text-neutral-600"
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
                      className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-neutral-400 transition-colors hover:text-neutral-950 dark:hover:text-white"
                    >
                      {showPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                </div>

                {/* REMEMBER ME TOGGLE */}
                <div className="pt-0.5">
                  <label
                    htmlFor="login-remember-me"
                    className="group flex cursor-pointer select-none items-center gap-2.5"
                  >
                    <div className="relative flex items-center">
                      <input
                        id="login-remember-me"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(event) =>
                          setRememberMe(event.target.checked)
                        }
                        className="sr-only"
                      />
                      <div
                        className={[
                          "flex h-4 w-4 items-center justify-center rounded-[6px] border transition-all duration-150",
                          rememberMe
                            ? "border-neutral-950 bg-neutral-950 text-white dark:border-white dark:bg-white dark:text-neutral-950"
                            : "border-black/20 bg-transparent group-hover:border-black/40 dark:border-white/20 dark:group-hover:border-white/40",
                        ].join(" ")}
                      >
                        {rememberMe && (
                          <Check size={11} strokeWidth={3} />
                        )}
                      </div>
                    </div>

                    <span className="text-xs font-medium text-neutral-600 group-hover:text-neutral-950 dark:text-neutral-400 dark:group-hover:text-white">
                      Remember me
                    </span>
                  </label>
                </div>

                {error && (
                  <div
                    role="alert"
                    className="border-l-2 border-red-500/70 pl-3 text-sm leading-5 text-red-600 dark:text-red-400"
                  >
                    {error}
                  </div>
                )}

                {/* LOGIN BUTTON */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={[
                    "group flex w-full items-center justify-center gap-3 rounded-full bg-neutral-950 px-6 py-3.5 text-sm font-semibold text-white transition-all duration-300 dark:bg-[#f4f1e9] dark:text-neutral-950",
                    isSubmitting
                      ? "cursor-wait opacity-70"
                      : "hover:-translate-y-0.5 hover:shadow-xl",
                  ].join(" ")}
                >
                  {isSubmitting
                    ? "Logging in..."
                    : "Log in"}

                  {!isSubmitting && (
                    <ArrowUpRight
                      size={16}
                      className="transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1"
                    />
                  )}
                </button>
              </form>
            </div>

            {/* SIGN UP */}
            <p className="mt-7 text-center text-sm text-neutral-500 dark:text-neutral-400">
              Don't have an account?{" "}
              <a
                href="/signup"
                className="font-semibold text-neutral-950 underline decoration-black/20 underline-offset-4 transition-colors hover:decoration-[var(--detrosys-accent)] dark:text-white dark:decoration-white/20"
              >
                Create one
              </a>
            </p>

            {/* SMALL BRAND DETAIL */}
            <div className="mt-12 flex items-center justify-center gap-3 text-[9px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
              <span>Detrosys</span>
              <span className="h-px w-8 bg-neutral-300 dark:bg-neutral-700" />
              <span>
                Your workspace awaits.
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}