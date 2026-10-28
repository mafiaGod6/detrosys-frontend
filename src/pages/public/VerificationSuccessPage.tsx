import { ArrowUpRight, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";

export function VerificationSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const verified =
    (location.state as { verified?: boolean } | null)?.verified ===
    true;

  const [dark, setDark] = useState(() => {
    const savedTheme = localStorage.getItem("detrosys-theme");

    if (savedTheme) {
      return savedTheme === "dark";
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("detrosys-theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    // location.state is read-only and isn't consumed/deleted by
    // reading it, so this check is safe to run more than once (e.g.
    // React StrictMode's intentional double-invoke in development)
    // without ever producing a false negative.
    if (!verified) {
      navigate("/signup", {
        replace: true,
      });
    }
  }, [verified, navigate]);

  return (
    <main className="relative flex min-h-screen overflow-hidden bg-[#f4f1e9] text-neutral-950 dark:bg-neutral-950 dark:text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-24 h-[520px] w-[520px] rounded-full border border-black/[0.045] dark:border-white/[0.045]"
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
        className="pointer-events-none absolute inset-0 opacity-[0.18] dark:opacity-[0.12]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1500px] flex-col px-6 py-7 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between">
          <a
            href="/"
            aria-label="Detrosys home"
            className="group inline-flex items-center gap-3"
          >
            <span className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-[0.9rem] bg-neutral-950 text-sm font-semibold text-white shadow-lg dark:bg-[#f4f1e9] dark:text-neutral-950">
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

        <div className="flex flex-1 items-center justify-center py-16">
          <div className="w-full max-w-[460px] text-center">
            <div className="mb-5 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--detrosys-accent)]" />
              Detrosys / Verified
            </div>

            <h1 className="text-4xl font-semibold tracking-[-0.055em] sm:text-5xl">
              Email verified.
            </h1>

            <p className="mx-auto mt-5 max-w-sm text-sm leading-6 text-neutral-500 dark:text-neutral-400">
              Your account has been verified successfully.
              Log in to continue to your workspace.
            </p>

            <button
              type="button"
              onClick={() => navigate("/login")}
              className="group mt-8 inline-flex items-center justify-center gap-3 rounded-full bg-neutral-950 px-6 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl dark:bg-[#f4f1e9] dark:text-neutral-950"
            >
              Continue to login

              <ArrowUpRight
                size={16}
                className="transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1"
              />
            </button>

            <div className="mt-12 flex items-center justify-center gap-3 text-[9px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
              <span>Detrosys</span>
              <span className="h-px w-8 bg-neutral-300 dark:bg-neutral-700" />
              <span>Account verified</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}