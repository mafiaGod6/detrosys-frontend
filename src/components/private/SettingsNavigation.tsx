import {
  ArrowLeft,
  CreditCard,
  KeyRound,
  Plug,
  UserRound,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router";

const items = [
  {
    label: "Profile",
    path: "/app/settings/profile",
    icon: UserRound,
  },
  {
    label: "Integrations",
    path: "/app/settings/integrations",
    icon: Plug,
  },
  {
    label: "Billing",
    path: "/app/settings/billing",
    icon: CreditCard,
  },
  {
    label: "Account",
    path: "/app/settings/account",
    icon: KeyRound,
  },
];

export function SettingsNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div>
      <button
        type="button"
        onClick={() => navigate("/app")}
        className="group inline-flex items-center gap-2 text-xs font-semibold text-neutral-500 transition-colors hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white"
      >
        <ArrowLeft
          size={14}
          strokeWidth={1.8}
          className="transition-transform group-hover:-translate-x-0.5"
        />
        Back to Dashboard
      </button>

      <nav
        aria-label="Settings navigation"
        className="mt-5 border-y border-neutral-200 py-2 dark:border-white/[0.08]"
      >
        <div className="flex min-w-max items-center gap-1 overflow-x-auto">
          {items.map(({ label, path, icon: Icon }) => {
            const active = location.pathname === path;

            return (
              <button
                key={path}
                type="button"
                onClick={() => navigate(path)}
                className={[
                  "inline-flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-xs font-semibold transition-all",
                  active
                    ? "bg-neutral-950 text-white dark:bg-white dark:text-neutral-950"
                    : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950 dark:text-neutral-400 dark:hover:bg-white/[0.05] dark:hover:text-white",
                ].join(" ")}
              >
                <Icon size={14} strokeWidth={1.8} />
                {label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}