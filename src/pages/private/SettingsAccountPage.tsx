import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Check,
  KeyRound,
  LogOut,
  Monitor,
  Moon,
  Sun,
  Trash2,
  X,
} from "lucide-react";

import { SettingsNavigation } from "../../components/private/SettingsNavigation";

type Theme = "system" | "light" | "dark";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

function readTheme(): Theme {
  const value = localStorage.getItem("detrosys-theme");

  return value === "light" || value === "dark"
    ? value
    : "system";
}

function applyTheme(theme: Theme) {
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
    return;
  }

  if (theme === "light") {
    document.documentElement.classList.remove("dark");
    return;
  }

  document.documentElement.classList.toggle(
    "dark",
    window.matchMedia("(prefers-color-scheme: dark)").matches,
  );
}

export function SettingsAccountPage() {
  const [theme, setTheme] = useState<Theme>(() => readTheme());

  const [email, setEmail] = useState("");
  const [loadingEmail, setLoadingEmail] = useState(true);

  const [passwordResetting, setPasswordResetting] =
    useState(false);

  const [passwordMessage, setPasswordMessage] =
    useState("");

  const [saved, setSaved] = useState(false);

  // Delete account modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    applyTheme(theme);

    if (theme === "system") {
      localStorage.removeItem("detrosys-theme");
    } else {
      localStorage.setItem("detrosys-theme", theme);
    }
  }, [theme]);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem(
        "detrosys_access_token",
      );

      if (!token) {
        window.location.replace("/login");
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/users/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (response.status === 401) {
          localStorage.removeItem("detrosys_access_token");
          localStorage.removeItem("detrosys_refresh_token");
          window.location.replace("/login");
          return;
        }

        if (!response.ok) {
          throw new Error(
            "Failed to load account information.",
          );
        }

        const user = await response.json();
        setEmail(user.email ?? "");
      } catch (error) {
        console.error(
          "Failed to load account information:",
          error,
        );
      } finally {
        setLoadingEmail(false);
      }
    };

    loadUser();
  }, []);

  const chooseTheme = (value: Theme) => {
    setTheme(value);
    setSaved(true);

    window.setTimeout(() => {
      setSaved(false);
    }, 1200);
  };

  const handleChangePassword = async () => {
    if (!email || passwordResetting) {
      return;
    }

    setPasswordResetting(true);
    setPasswordMessage("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => null);

        console.error(
          "Password reset request failed:",
          errorData,
        );

        setPasswordMessage(
          "Unable to send the password reset email. Please try again.",
        );
        return;
      }

      setPasswordMessage(
        "Password reset instructions have been sent to your email.",
      );
    } catch (error) {
      console.error(
        "Password reset request failed:",
        error,
      );

      setPasswordMessage(
        "Unable to send the password reset email. Please try again.",
      );
    } finally {
      setPasswordResetting(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("detrosys_access_token");
    localStorage.removeItem("detrosys_refresh_token");
    localStorage.removeItem("detrosys_plan");
    localStorage.removeItem("detrosys_free_consumed");
    window.location.replace("/login");
  };

  const openDeleteModal = () => {
    setConfirmText("");
    setDeleteError(null);
    setDeleteModalOpen(true);
  };

  const handleDeleteAccount = async () => {
    if (confirmText.trim() !== "DELETE" || deleting) {
      return;
    }

    setDeleting(true);
    setDeleteError(null);

    const token = localStorage.getItem("detrosys_access_token");

    if (!token) {
      window.location.replace("/login");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(
          data?.detail || "Failed to delete account. Please try again.",
        );
      }

      localStorage.clear();
      sessionStorage.clear();
      window.location.replace("/");
    } catch (error) {
      console.error("Account deletion error:", error);
      setDeleteError(
        error instanceof Error
          ? error.message
          : "Unable to delete account.",
      );
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1180px] pb-20">
      <header className="max-w-2xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-neutral-400 dark:text-neutral-600">
          Settings / Account
        </p>

        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.055em] text-neutral-950 sm:text-5xl dark:text-white">
          Account
        </h1>

        <p className="mt-4 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
          Personal access, appearance and account controls.
        </p>
      </header>

      <div className="mt-8">
        <SettingsNavigation />
      </div>

      <div className="mt-10 space-y-10">
        {/* LOGIN & SECURITY */}
        <section>
          <Heading
            icon={KeyRound}
            title="Login & security"
            text="Manage the credentials used to access this account."
          />

          <div className="divide-y divide-neutral-200 border-b border-neutral-200 dark:divide-white/[0.08] dark:border-white/[0.08]">
            {/* EMAIL */}
            <div className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Email address
                </p>

                <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-600">
                  {loadingEmail
                    ? "Loading your account email..."
                    : email || "Your account email"}
                </p>
              </div>
            </div>

            {/* CHANGE PASSWORD */}
            <div className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Password
                </p>

                <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-600">
                  Send a password reset link to your account email.
                </p>

                {passwordMessage && (
                  <p className="mt-2 max-w-md text-xs text-neutral-500 dark:text-neutral-400">
                    {passwordMessage}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={handleChangePassword}
                disabled={
                  loadingEmail ||
                  !email ||
                  passwordResetting
                }
                className="w-fit rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 transition-all hover:border-neutral-400 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-neutral-300 dark:hover:border-white/20"
              >
                {passwordResetting
                  ? "Sending..."
                  : "Change password"}
              </button>
            </div>
          </div>
        </section>

        {/* APPEARANCE */}
        <section>
          <Heading
            icon={Monitor}
            title="Appearance"
            text="Choose how Detrosys should appear on this device."
          />

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {(
              [
                ["system", "System", Monitor],
                ["light", "Light", Sun],
                ["dark", "Dark", Moon],
              ] as const
            ).map(([value, label, Icon]) => (
              <button
                key={value}
                type="button"
                onClick={() => chooseTheme(value)}
                className={[
                  "flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all",
                  "border-neutral-200 bg-white/50 text-neutral-700 hover:border-neutral-400 dark:border-white/[0.08] dark:bg-white/[0.02] dark:text-neutral-300",
                  theme === value
                    ? "!border-neutral-950 !bg-neutral-950 !text-white dark:!border-white dark:!bg-white dark:!text-neutral-950"
                    : "",
                ].join(" ")}
              >
                <Icon size={15} />

                <span className="text-xs font-semibold">
                  {label}
                </span>

                {theme === value && (
                  <Check
                    size={14}
                    className="ml-auto"
                  />
                )}
              </button>
            ))}
          </div>

          {saved && (
            <p className="mt-3 text-xs text-neutral-400 dark:text-neutral-600">
              Appearance updated.
            </p>
          )}
        </section>

        {/* SIGN OUT */}
        <section className="border-t border-neutral-200 pt-7 dark:border-white/[0.08]">
          <Row
            icon={LogOut}
            title="Sign out"
            text="End the current session on this device."
            button="Sign out"
            onClick={handleSignOut}
          />
        </section>

        {/* DELETE ACCOUNT */}
        <section className="border-t border-red-200 pt-7 dark:border-red-500/20">
          <Row
            icon={Trash2}
            title="Delete account"
            text="Permanently delete your account, contacts, campaigns, automations, and all workspace records. This action cannot be undone."
            button="Delete account"
            danger
            onClick={openDeleteModal}
          />
        </section>
      </div>

      {/* CONFIRMATION SAFEGUARD MODAL */}
      {deleteModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-account-title"
        >
          <div className="relative w-full max-w-md rounded-[28px] border border-neutral-200 bg-[#f5f3ee] p-7 shadow-2xl sm:p-8 dark:border-white/10 dark:bg-[#151515]">
            <button
              type="button"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleting}
              aria-label="Close"
              className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:text-neutral-950 dark:hover:text-white"
            >
              <X size={16} />
            </button>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400">
              <AlertTriangle size={24} strokeWidth={2} />
            </div>

            <h3
              id="delete-account-title"
              className="mt-5 text-2xl font-semibold tracking-tight text-neutral-950 dark:text-white"
            >
              Permanently delete account?
            </h3>

            <p className="mt-2 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
              This will completely delete your account and remove all campaigns,
              audiences, contacts, automations, and workspace data. This action is
              irreversible.
            </p>

            {deleteError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
                {deleteError}
              </div>
            )}

            <div className="mt-5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                Type <span className="font-mono text-neutral-950 dark:text-white">DELETE</span> to confirm
              </label>

              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                disabled={deleting}
                className="mt-2 h-11 w-full rounded-xl border border-neutral-300 bg-white px-3.5 text-sm text-neutral-950 outline-none transition focus:border-red-500 dark:border-white/10 dark:bg-[#1c1c1c] dark:text-white dark:focus:border-red-400"
              />
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
              <button
                type="button"
                disabled={confirmText !== "DELETE" || deleting}
                onClick={handleDeleteAccount}
                className="flex-1 rounded-xl bg-red-600 py-3 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {deleting ? "Deleting account..." : "Permanently Delete"}
              </button>

              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleting}
                className="rounded-xl border border-neutral-300 px-5 py-3 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 dark:border-white/10 dark:text-neutral-400 dark:hover:bg-white/[0.04]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Heading({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof KeyRound;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-4 border-b border-neutral-200 pb-4 dark:border-white/[0.08]">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-500 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-neutral-400">
        <Icon size={16} />
      </div>

      <div>
        <h2 className="text-sm font-semibold text-neutral-950 dark:text-white">
          {title}
        </h2>

        <p className="mt-1 text-xs leading-5 text-neutral-400 dark:text-neutral-600">
          {text}
        </p>
      </div>
    </div>
  );
}

function Row({
  icon: Icon,
  title,
  text,
  button,
  danger = false,
  onClick,
}: {
  icon: typeof LogOut;
  title: string;
  text: string;
  button: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <Icon
          size={15}
          className={
            danger
              ? "mt-0.5 text-red-500"
              : "mt-0.5 text-neutral-400"
          }
        />

        <div>
          <p
            className={
              danger
                ? "text-xs font-semibold text-red-700 dark:text-red-400"
                : "text-xs font-semibold text-neutral-700 dark:text-neutral-300"
            }
          >
            {title}
          </p>

          <p className="mt-1 max-w-xl text-xs leading-5 text-neutral-400 dark:text-neutral-600">
            {text}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onClick}
        className={
          danger
            ? "w-fit rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition-all hover:border-red-300 hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/5 dark:text-red-400 dark:hover:bg-red-500/10"
            : "w-fit rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 transition-all hover:border-neutral-400 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-neutral-300 dark:hover:border-white/20"
        }
      >
        {button}
      </button>
    </div>
  );
}