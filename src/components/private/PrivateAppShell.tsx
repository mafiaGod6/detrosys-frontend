import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";
import { DetrosysLogo } from "../DetrosysLogo";
import { AccountMenu } from "./AccountMenu";
import { DataAssistant } from "./DataAssistant";
import { ExperimentalNavigation } from "./ExperimentalNavigation";
import { UpgradeButton } from "./UpgradeButton";

type PrivateAppShellProps = {
  children: React.ReactNode;
  modalOpen?: boolean;
};

export function PrivateAppShell({
  children,
  modalOpen = false,
}: PrivateAppShellProps) {
  const location = useLocation();
  const mainRef = useRef<HTMLElement | null>(null);

  // Synchronously initialize from localStorage
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const savedTheme =
      localStorage.getItem("detrosys-theme") ||
      localStorage.getItem("detrosys_theme");
    if (savedTheme) {
      return savedTheme === "dark";
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // Level internal dashboard scroll on route change
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  // Synchronize DOM classes and persist state changes
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("detrosys-theme", darkMode ? "dark" : "light");
    localStorage.setItem("detrosys_theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  // Listen for theme updates made in other tabs or settings panels
  useEffect(() => {
    const handleStorageChange = () => {
      const savedTheme =
        localStorage.getItem("detrosys-theme") ||
        localStorage.getItem("detrosys_theme");
      if (savedTheme === "dark") {
        setDarkMode(true);
      } else if (savedTheme === "light") {
        setDarkMode(false);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Lock document when modal is open
  useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [modalOpen]);

  const toggleTheme = () => {
    setDarkMode((current) => !current);
  };

  return (
    <div className="relative h-screen min-h-screen overflow-hidden bg-[#f5f3ee] text-neutral-950 transition-colors duration-300 dark:bg-[#0d0d0d] dark:text-white">
      {/* Header backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-30 h-16 bg-[#f5f3ee] dark:bg-[#0d0d0d] sm:h-20"
      />

      {/* Private header */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-start justify-between px-4 pt-3 sm:px-6 sm:pt-4 lg:px-8">
        <div className="pointer-events-auto">
          <button
            type="button"
            onClick={() => {
              window.history.pushState({}, "", "/app");
              window.dispatchEvent(new PopStateEvent("popstate"));
            }}
            className="group flex items-center rounded-xl px-1 py-1 transition-opacity duration-200 hover:opacity-75"
            aria-label="Go to Dashboard"
          >
            <DetrosysLogo size={34} showText textClassName="text-sm tracking-[-0.02em]" />
          </button>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <UpgradeButton />
          <AccountMenu darkMode={darkMode} onToggleTheme={toggleTheme} />
        </div>
      </header>

      {/* Workspace */}
      <main ref={mainRef} className="h-full overflow-y-auto overscroll-contain">
        <div className="min-h-full px-4 pb-32 pt-16 sm:px-6 sm:pb-36 sm:pt-20 lg:px-8">
          {children}
        </div>
      </main>

      <DataAssistant />

      {!modalOpen && !location.pathname.startsWith("/app/settings") && (
        <ExperimentalNavigation />
      )}
    </div>
  );
}