import { Moon, Sun } from "lucide-react";

type PrivateThemeToggleProps = {
  darkMode: boolean;
  onToggle: () => void;
};

export function PrivateThemeToggle({
  darkMode,
  onToggle,
}: PrivateThemeToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={darkMode ? "Switch to light theme" : "Switch to dark theme"}
      title={darkMode ? "Switch to light theme" : "Switch to dark theme"}
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-300 bg-[#e7e2d8]/90 text-neutral-700 shadow-sm backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-neutral-500 hover:text-neutral-950 dark:border-white/10 dark:bg-[#151515]/90 dark:text-neutral-300 dark:hover:border-white/25 dark:hover:text-white"
    >
      {darkMode ? (
        <Sun size={17} strokeWidth={1.9} />
      ) : (
        <Moon size={17} strokeWidth={1.9} />
      )}
    </button>
  );
}