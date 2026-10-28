import { ArrowUpRight, Zap } from "lucide-react";
import { useNavigate } from "react-router";

type UpgradeButtonProps = {
  currentPlan?: string;
  onUpgrade?: () => void;
};

export function UpgradeButton({
  currentPlan = "Free",
  onUpgrade,
}: UpgradeButtonProps) {
  const navigate = useNavigate();

  const isFree =
    currentPlan.toLowerCase() === "free";

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
      return;
    }

    navigate("/app/billing");
  };

  return (
    <button
      type="button"
      onClick={handleUpgrade}
      className="group flex items-center gap-2 rounded-xl border border-neutral-300 bg-[#e7e2d8]/90 px-3.5 py-2.5 text-xs font-semibold text-neutral-950 shadow-sm backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-neutral-500 hover:shadow-md dark:border-white/10 dark:bg-[#151515]/90 dark:text-white dark:hover:border-white/25"
    >
      <Zap
        size={14}
        strokeWidth={2.2}
        className="transition-transform duration-200 group-hover:scale-110"
      />

      <span>
        {isFree ? "Upgrade" : "Change plan"}
      </span>

      <ArrowUpRight
        size={13}
        className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
      />
    </button>
  );
}