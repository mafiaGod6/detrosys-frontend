import { ArrowUpRight, Moon, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { apiRequest } from "../../api/client";

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Retrieve the email from routing state FIRST, then fallback to Local Storage
  const registeredEmail = location.state?.email || localStorage.getItem("detrosys_pending_email");

  const verificationRequest = useRef<Promise<void> | null>(null);
  const verificationToken = useRef<string | null>(null);

  const [dark, setDark] = useState(() => {
    const savedTheme = localStorage.getItem("detrosys-theme");
    if (savedTheme) {
      return savedTheme === "dark";
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const [status, setStatus] = useState<"waiting" | "verifying" | "error">("waiting");
  const [error, setError] = useState("");
  
  // Cooldown timer state for the resend button
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("detrosys-theme", dark ? "dark" : "light");
  }, [dark]);

  // Handle the 60-second cooldown timer countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      return;
    }

    if (verificationToken.current !== token) {
      verificationToken.current = token;
      verificationRequest.current = null;
    }

    setStatus("verifying");
    setError("");

    if (!verificationRequest.current) {
      verificationRequest.current = apiRequest(
        `/auth/verify-email?token=${encodeURIComponent(token)}`,
        {
          method: "GET",
        }
      ).then(() => {
        return;
      });
    }

    verificationRequest.current
      .then(() => {
        // Clear the pending email from storage once successfully verified
        localStorage.removeItem("detrosys_pending_email");
        
        navigate("/verification-success", {
          replace: true,
          state: { verified: true },
        });
      })
      .catch((err: unknown) => {
        setStatus("error");
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("This verification link is invalid or has expired.");
        }
      });
  }, [searchParams, navigate]);

  const handleResendVerification = async () => {
    if (cooldown > 0) return;

    let targetEmail = registeredEmail;
    
    // Absolute final fallback just in case they cleared local storage
    if (!targetEmail) {
      const userInput = prompt("Session expired. Please enter your registered email address to resend the link:");
      if (!userInput || !userInput.trim()) {
        return; 
      }
      targetEmail = userInput.trim();
    }

    try {
      await apiRequest("/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: targetEmail }),
      });
      
      // Start the 60 second cooldown
      setCooldown(60);
      alert(`Verification email resent to ${targetEmail}! Please check your inbox and spam folder.`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(`Failed to resend: ${err.message}`);
      } else {
        alert("Failed to resend verification email.");
      }
    }
  };

  return (
    <main className="relative flex min-h-screen overflow-hidden bg-[#f4f1e9] text-neutral-950 dark:bg-neutral-950 dark:text-white">
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

        <div className="flex flex-1 items-center justify-center py-16">
          <div className="w-full max-w-[460px] text-center">
            <div className="mb-5 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--detrosys-accent)]" />
              Detrosys / Verification
            </div>

            {status === "waiting" && (
              <>
                <h1 className="text-4xl font-semibold tracking-[-0.055em] sm:text-5xl">
                  Check your email.
                </h1>

                <p className="mx-auto mt-5 max-w-sm text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                  We sent a verification link to your email
                  address. Open the email and click the link
                  to verify your account.
                </p>

                <div className="mt-8 flex flex-col items-center gap-4">
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={cooldown > 0}
                    className={`group inline-flex items-center justify-center gap-3 rounded-full px-6 py-3.5 text-sm font-semibold transition-all duration-300 ${
                      cooldown > 0
                        ? "cursor-not-allowed bg-neutral-950 text-white opacity-50 dark:bg-[#f4f1e9] dark:text-neutral-950"
                        : "bg-neutral-950 text-white hover:-translate-y-0.5 hover:shadow-xl dark:bg-[#f4f1e9] dark:text-neutral-950"
                    }`}
                  >
                    {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend verification"}
                    <ArrowUpRight 
                      size={16} 
                      className={cooldown === 0 ? "transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1" : ""} 
                    />
                  </button>

                  <a
                    href="/login"
                    className="text-sm font-semibold text-neutral-500 underline decoration-black/20 underline-offset-4 transition-colors hover:text-neutral-950 hover:decoration-[var(--detrosys-accent)] dark:text-neutral-400 dark:decoration-white/20 dark:hover:text-white"
                  >
                    Back to login
                  </a>
                </div>
              </>
            )}

            {status === "verifying" && (
              <>
                <h1 className="text-4xl font-semibold tracking-[-0.055em] sm:text-5xl">
                  Verifying your email.
                </h1>

                <p className="mx-auto mt-5 max-w-sm text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                  Please wait while we verify your account.
                </p>
              </>
            )}

            {status === "error" && (
              <>
                <h1 className="text-4xl font-semibold tracking-[-0.055em] sm:text-5xl">
                  Verification failed.
                </h1>

                <p className="mx-auto mt-5 max-w-sm text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                  {error}
                </p>

                <div className="mt-8 flex flex-col items-center gap-4">
                  <a
                    href="/login"
                    className="group inline-flex items-center justify-center gap-3 rounded-full bg-neutral-950 px-6 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl dark:bg-[#f4f1e9] dark:text-neutral-950"
                  >
                    Back to login

                    <ArrowUpRight
                      size={16}
                      className="transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1"
                    />
                  </a>
                </div>
              </>
            )}

            <div className="mt-12 flex items-center justify-center gap-3 text-[9px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
              <span>Detrosys</span>
              <span className="h-px w-8 bg-neutral-300 dark:bg-neutral-700" />
              <span>Secure account verification</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}