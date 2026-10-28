import {
  ChevronDown,
  LogOut,
  Moon,
  Settings,
  Sun,
  UserRound,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";

type UserProfile = {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  company_name?: string | null;
};

type AccountMenuProps = {
  darkMode: boolean;
  onToggleTheme: () => void;
  onSignOut?: () => void;
};

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ??
  import.meta.env.VITE_API_URL ??
  "http://localhost:8000"
).replace(/\/$/, "");

export function AccountMenu({
  darkMode,
  onToggleTheme,
  onSignOut,
}: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Fetch live authenticated user profile
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("detrosys_access_token");
      if (!token) return;

      try {
        const response = await fetch(`${API_BASE_URL}/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data);
        }
      } catch (err) {
        console.error("Failed to fetch live user profile:", err);
      }
    };

    void fetchUser();
  }, []);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  // Dynamic user display values
  const displayName =
    [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim() ||
    user?.company_name ||
    user?.email?.split("@")[0] ||
    "Your account";

  const displayEmail = user?.email || "Account";

  const avatarInitial = (
    user?.first_name?.[0] ||
    user?.company_name?.[0] ||
    user?.email?.[0] ||
    "U"
  ).toUpperCase();

  // Clear authentication tokens and redirect
  const handleSignOut = () => {
    setOpen(false);
    if (onSignOut) {
      onSignOut();
    }
    localStorage.removeItem("detrosys_access_token");
    localStorage.removeItem("detrosys_plan");
    localStorage.removeItem("detrosys_free_consumed");
    window.location.href = "/login";
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* ACCOUNT TRIGGER BUTTON */}
      <button
        type="button"
        aria-label="Open account menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={[
          "flex h-10 items-center gap-2 rounded-xl border px-2.5",
          "transition-all duration-200",
          open
            ? "border-neutral-500 bg-white text-neutral-950 dark:border-white/25 dark:bg-white/[0.08] dark:text-white"
            : "border-neutral-300 bg-[#e7e2d8]/90 text-neutral-700 hover:border-neutral-500 hover:text-neutral-950 dark:border-white/10 dark:bg-[#151515]/90 dark:text-neutral-300 dark:hover:border-white/25 dark:hover:text-white",
        ].join(" ")}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-950 text-xs font-bold text-white dark:bg-white dark:text-neutral-950">
          {avatarInitial}
        </span>

        <span className="hidden max-w-[110px] truncate text-xs font-medium sm:block">
          {displayName}
        </span>

        <ChevronDown
          size={14}
          className={[
            "hidden transition-transform duration-200 sm:block",
            open ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>

      {/* ACCOUNT DROPDOWN PANEL */}
      {open && (
        <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-64 overflow-hidden rounded-2xl border border-neutral-200 bg-[#f5f3ee] p-2 shadow-xl shadow-black/10 dark:border-white/10 dark:bg-[#151515] dark:shadow-black/30">
          {/* USER INFORMATION */}
          <div className="px-3 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-950 text-sm font-semibold text-white dark:bg-white dark:text-neutral-950">
                {avatarInitial}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-neutral-950 dark:text-white">
                  {displayName}
                </p>

                <p className="mt-0.5 truncate text-xs text-neutral-400 dark:text-neutral-500">
                  {displayEmail}
                </p>
              </div>
            </div>
          </div>

          <div className="my-1 h-px bg-neutral-200 dark:bg-white/[0.08]" />

          {/* PROFILE */}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate("/app/settings/profile");
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-neutral-700 transition-colors duration-150 hover:bg-neutral-200/70 hover:text-neutral-950 dark:text-neutral-300 dark:hover:bg-white/[0.06] dark:hover:text-white"
          >
            <UserRound size={16} strokeWidth={1.8} />
            <span>Profile</span>
          </button>

          {/* SETTINGS */}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate("/app/settings");
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-neutral-700 transition-colors duration-150 hover:bg-neutral-200/70 hover:text-neutral-950 dark:text-neutral-300 dark:hover:bg-white/[0.06] dark:hover:text-white"
          >
            <Settings size={16} strokeWidth={1.8} />
            <span>Settings</span>
          </button>

          {/* THEME */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm text-neutral-700 transition-colors duration-150 hover:bg-neutral-200/70 hover:text-neutral-950 dark:text-neutral-300 dark:hover:bg-white/[0.06] dark:hover:text-white"
          >
            <span className="flex items-center gap-3">
              {darkMode ? (
                <Moon size={16} strokeWidth={1.8} />
              ) : (
                <Sun size={16} strokeWidth={1.8} />
              )}
              <span>Theme</span>
            </span>

            <span className="text-[11px] text-neutral-400 dark:text-neutral-600">
              {darkMode ? "Dark" : "Light"}
            </span>
          </button>

          <div className="my-1 h-px bg-neutral-200 dark:bg-white/[0.08]" />

                    {/* LEGAL + CONTACT */}
          {[
            { label: "Privacy policy", path: "/privacy" },
            { label: "Terms & conditions", path: "/terms" },
            { label: "Refund policy", path: "/refund" },
            { label: "Contact", path: "/contact" },
          ].map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={() => {
                setOpen(false);
                navigate(item.path);
              }}
              className="flex w-full items-center rounded-xl px-3 py-2 text-left text-xs text-neutral-500 transition-colors duration-150 hover:bg-neutral-200/70 hover:text-neutral-950 dark:text-neutral-500 dark:hover:bg-white/[0.06] dark:hover:text-white"
            >
              {item.label}
            </button>
          ))}

          <div className="my-1 h-px bg-neutral-200 dark:bg-white/[0.08]" />

          {/* SIGN OUT */}
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-neutral-500 transition-colors duration-150 hover:bg-red-500/10 hover:text-red-500 dark:text-neutral-500 dark:hover:text-red-400"
          >
            <LogOut size={16} strokeWidth={1.8} />
            <span>Sign out</span>
          </button>
        </div>
      )}
    </div>
  );
}