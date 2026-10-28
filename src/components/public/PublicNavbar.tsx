import {
  ArrowUpRight,
  Menu,
  Moon,
  Sun,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { DetrosysLogo } from "../DetrosysLogo";

// Safe client-side JWT token expiration validator
function isSessionActive(): boolean {
  if (typeof window === "undefined") return false;
  const token = localStorage.getItem("detrosys_access_token");
  if (!token) return false;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      localStorage.removeItem("detrosys_access_token");
      return false;
    }

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );

    const payload = JSON.parse(jsonPayload);

    if (payload.exp && payload.exp * 1000 <= Date.now()) {
      localStorage.removeItem("detrosys_access_token");
      localStorage.removeItem("detrosys_refresh_token");
      return false;
    }

    return true;
  } catch {
    localStorage.removeItem("detrosys_access_token");
    return false;
  }
}

const scrollLinks = [
  { label: "Features", target: "features" },
  { label: "How it works", target: "how-it-works" },
  { label: "About", target: "about" },
];

const pageLinks = [
  { label: "FAQ", href: "/faq" },
  { label: "Pricing", href: "/pricing" },
];

export function PublicNavbar() {
  const [open, setOpen] = useState(false);

  const [dark, setDark] = useState(() => {
    const savedTheme =
      localStorage.getItem("detrosys-theme") ||
      localStorage.getItem("detrosys_theme");

    if (savedTheme) {
      return savedTheme === "dark";
    }

    return window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
  });

  const [activeSection, setActiveSection] = useState("");
  const [visible, setVisible] = useState(true);

  const [isLoggedIn, setIsLoggedIn] = useState(() => isSessionActive());

  useEffect(() => {
    const checkAuth = () => {
      setIsLoggedIn(isSessionActive());
    };

    checkAuth();

    window.addEventListener("storage", checkAuth);
    return () => {
      window.removeEventListener("storage", checkAuth);
    };
  }, []);

  useEffect(() => {
    const handleFocus = () => {
      setIsLoggedIn(isSessionActive());
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        handleFocus();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("detrosys-theme", dark ? "dark" : "light");
    localStorage.setItem("detrosys_theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    const sections = scrollLinks
      .map((link) => document.getElementById(link.target))
      .filter((section): section is HTMLElement => section !== null);

    if (sections.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visibleEntries[0]) {
          setActiveSection(visibleEntries[0].target.id);
        }
      },
      {
        rootMargin: "-25% 0px -60% 0px",
        threshold: [0.1, 0.25, 0.5, 0.75],
      },
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let previousScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 24) {
        setVisible(true);
      } else if (currentScrollY > previousScrollY + 4) {
        setVisible(false);
        setOpen(false);
      } else if (currentScrollY < previousScrollY - 4) {
        setVisible(true);
      }

      previousScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollTo = (target: string) => {
    document.getElementById(target)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    setOpen(false);
  };

  const toggleTheme = () => {
    setDark((value) => !value);
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 px-5 pt-5 sm:px-8 transition-transform duration-500 ${
        visible ? "translate-y-0" : "-translate-y-[calc(100%+2rem)]"
      }`}
    >
      <nav className="mx-auto flex max-w-[1400px] items-start justify-between">
        {/* Brand */}
        <a
          href="/"
          className="group flex items-center"
          aria-label="Detrosys home"
        >
          <DetrosysLogo size={42} showText textClassName="text-[18px]" />
        </a>

        {/* Desktop navigation */}
        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-3 rounded-2xl border border-black/10 bg-[#f3f1eb]/95 px-3 py-2 shadow-[0_10px_35px_rgba(0,0,0,0.08)] backdrop-blur-xl md:flex lg:gap-7 lg:px-5 dark:border-white/10 dark:bg-neutral-950/95">
          {scrollLinks.map((link) => {
            const active = activeSection === link.target;

            return (
              <button
                key={link.target}
                type="button"
                onClick={() => scrollTo(link.target)}
                className="group relative whitespace-nowrap py-2 text-[13px] font-medium text-neutral-600 transition-colors duration-200 hover:text-neutral-950 lg:text-[14px] dark:text-neutral-300 dark:hover:text-white"
              >
                {link.label}

                <span
                  className={`absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[var(--detrosys-accent)] transition-all duration-300 ${
                    active
                      ? "scale-100 opacity-100"
                      : "scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-60"
                  }`}
                />
              </button>
            );
          })}

          {pageLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="group relative whitespace-nowrap py-2 text-[13px] font-medium text-neutral-600 transition-colors duration-200 hover:text-neutral-950 lg:text-[14px] dark:text-neutral-300 dark:hover:text-white"
            >
              {link.label}

              <span className="absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 scale-0 rounded-full bg-[var(--detrosys-accent)] opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-60" />
            </a>
          ))}
        </div>

        {/* Desktop actions */}
        <div className="hidden items-center gap-2 rounded-2xl border border-black/10 bg-[#f3f1eb]/95 p-1 shadow-[0_10px_35px_rgba(0,0,0,0.08)] backdrop-blur-xl md:flex lg:gap-4 lg:p-1.5 dark:border-white/10 dark:bg-neutral-950/95">
          <button
            type="button"
            onClick={toggleTheme}
            className="group flex h-9 w-9 items-center justify-center rounded-[11px] text-neutral-700 transition-all duration-300 hover:bg-black/5 lg:h-10 lg:w-10 dark:text-neutral-200 dark:hover:bg-white/10"
            aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
            title={dark ? "Light mode" : "Dark mode"}
          >
            {dark ? (
              <Sun
                size={17}
                strokeWidth={1.8}
                className="transition-transform duration-500 group-hover:rotate-45"
              />
            ) : (
              <Moon
                size={17}
                strokeWidth={1.8}
                className="transition-transform duration-500 group-hover:-rotate-12"
              />
            )}
          </button>

          {isLoggedIn ? (
            <a
              href="/app"
              className="group flex items-center gap-2 whitespace-nowrap rounded-[12px] bg-neutral-950 px-3 py-2 text-[13px] font-semibold !text-white shadow-[0_7px_18px_rgba(0,0,0,0.16)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(0,0,0,0.2)] lg:gap-3 lg:px-5 lg:py-2.5 lg:text-[14px] dark:bg-white dark:!text-neutral-950"
            >
              <span className="!text-white dark:!text-neutral-950">
                Dashboard
              </span>

              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15 dark:bg-black/10">
                <ArrowUpRight
                  size={14}
                  strokeWidth={2}
                  className="!text-white dark:!text-neutral-950"
                />
              </span>
            </a>
          ) : (
            <>
              <a
                href="/login"
                className="px-1 text-[13px] font-semibold text-neutral-700 transition-colors hover:text-neutral-950 lg:px-2 lg:text-[14px] dark:text-neutral-300 dark:hover:text-white"
              >
                Login
              </a>

              <a
                href="/signup"
                className="group flex items-center gap-2 whitespace-nowrap rounded-[12px] bg-neutral-950 px-3 py-2 text-[13px] font-semibold !text-white shadow-[0_7px_18px_rgba(0,0,0,0.16)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(0,0,0,0.2)] lg:gap-3 lg:px-5 lg:py-2.5 lg:text-[14px] dark:bg-white dark:!text-neutral-950"
              >
                <span className="!text-white dark:!text-neutral-950">
                  Start free
                </span>

                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15 dark:bg-black/10">
                  <ArrowUpRight
                    size={14}
                    strokeWidth={2}
                    className="!text-white dark:!text-neutral-950"
                  />
                </span>
              </a>
            </>
          )}
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-black/10 bg-[#f3f1eb]/95 text-neutral-700 shadow-[0_8px_24px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-neutral-950/95 dark:text-neutral-200"
            aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
          >
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-black/10 bg-[#f3f1eb]/95 text-neutral-700 shadow-[0_8px_24px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-neutral-950/95 dark:text-neutral-200"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
          >
            {open ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </nav>

      {/* Mobile navigation */}
      {open && (
        <div className="mx-auto mt-4 max-w-[1400px] overflow-hidden rounded-[24px] border border-black/10 bg-[#f3f1eb]/98 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.14)] backdrop-blur-2xl md:hidden dark:border-white/10 dark:bg-neutral-950/98">
          <div className="flex flex-col">
            {scrollLinks.map((link) => (
              <button
                key={link.target}
                type="button"
                onClick={() => scrollTo(link.target)}
                className="flex items-center justify-between rounded-[16px] px-4 py-3.5 text-left text-[15px] font-medium text-neutral-700 transition-colors hover:bg-black/5 dark:text-neutral-300 dark:hover:bg-white/5"
              >
                <span>{link.label}</span>
                {activeSection === link.target && (
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--detrosys-accent)]" />
                )}
              </button>
            ))}

            {pageLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-[16px] px-4 py-3.5 text-[15px] font-medium text-neutral-700 transition-colors hover:bg-black/5 dark:text-neutral-300 dark:hover:bg-white/5"
              >
                {link.label}
              </a>
            ))}

            <div className="my-2 h-px bg-black/10 dark:bg-white/10" />

            {isLoggedIn ? (
              <a
                href="/app"
                onClick={() => setOpen(false)}
                className="mt-1 flex items-center justify-center gap-2 rounded-[16px] bg-neutral-950 px-4 py-3.5 text-[15px] font-semibold !text-white dark:bg-white dark:!text-neutral-950"
              >
                <span className="!text-white dark:!text-neutral-950">
                  Dashboard
                </span>
                <ArrowUpRight
                  size={16}
                  className="!text-white dark:!text-neutral-950"
                />
              </a>
            ) : (
              <>
                <a
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-[16px] px-4 py-3.5 text-[15px] font-semibold text-neutral-700 dark:text-neutral-300"
                >
                  Login
                </a>

                <a
                  href="/signup"
                  onClick={() => setOpen(false)}
                  className="mt-1 flex items-center justify-center gap-2 rounded-[16px] bg-neutral-950 px-4 py-3.5 text-[15px] font-semibold !text-white dark:bg-white dark:!text-neutral-950"
                >
                  <span className="!text-white dark:!text-neutral-950">
                    Start free
                  </span>
                  <ArrowUpRight
                    size={16}
                    className="!text-white dark:!text-neutral-950"
                  />
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}