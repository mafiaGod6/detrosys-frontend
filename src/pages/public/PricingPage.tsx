import {
  Check,
  ChevronLeft,
  ChevronRight,
  Minus,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type TouchEvent,
} from "react";
import { PublicFooter } from "../../components/public/PublicFooter";
import { PublicNavbar } from "../../components/public/PublicNavbar";

type BillingCycle = "monthly" | "yearly";

type Plan = {
  name: string;
  description: string;
  usdMonthly: number;
  usdYearly: number;
  inrMonthly: number;
  inrYearly: number;
  features: string[];
};

const ACCESS_TOKEN_KEY = "detrosys_access_token";

const plans: Plan[] = [
  {
    name: "Free",
    description:
      "A simple sandbox to test your provider integrations and build your first workflow.",
    usdMonthly: 0,
    usdYearly: 0,
    inrMonthly: 0,
    inrYearly: 0,
    features: [
      "Up to 250 contacts",
      "3 lifetime workflows",
      "3 reusable templates",
      "1 template per workflow",
      "5 lifetime AI credits",
    ],
  },
  {
    name: "Basic",
    description:
      "For small teams launching structured email and SMS customer journeys.",
    usdMonthly: 89,
    usdYearly: 859,
    inrMonthly: 7499,
    inrYearly: 71999,
    features: [
      "Up to 10,000 contacts",
      "10 workflows / month",
      "300 reusable templates",
      "Email + SMS dispatch",
      "30 AI credits / month",
    ],
  },
  {
    name: "Pro",
    description:
      "For growing brands relying on dynamic segmentation and conditional logic.",
    usdMonthly: 129,
    usdYearly: 1239,
    inrMonthly: 12999,
    inrYearly: 124799,
    features: [
      "Up to 50,000 contacts",
      "25 workflows / month",
      "1,000 reusable templates",
      "Dynamic segmentation",
      "50 AI credits / month",
    ],
  },
  {
    name: "Advanced",
    description:
      "Maximum scale for high-volume automated marketing and behavioral targeting.",
    usdMonthly: 189,
    usdYearly: 1819,
    inrMonthly: 17399,
    inrYearly: 166999,
    features: [
      "Up to 250,000 contacts",
      "75 workflows / month",
      "Unlimited templates",
      "Advanced behavioral targeting",
      "100 AI credits / month",
    ],
  },
  {
    name: "Custom",
    description:
      "A dedicated environment engineered for enterprise volume and custom routing.",
    usdMonthly: 0,
    usdYearly: 0,
    inrMonthly: 0,
    inrYearly: 0,
    features: [
      "Custom contact ceilings",
      "Custom workflow limits",
      "Dedicated database limits",
      "Custom API rate scaling",
      "Dedicated success manager",
    ],
  },
];

const comparisonRows = [
  {
    feature: "Contacts",
    values: ["250", "10,000", "50,000", "250,000", "Custom"],
  },
  {
    feature: "Workflows (Monthly Plan)",
    values: ["3 Workflows Lifetime", "10 Workflows / mo", "25 Workflows / mo", "75 Workflows / mo", "Custom Workflows"],
  },
  {
    feature: "Workflows (Yearly Plan)",
    values: ["—", "150 Workflows / yr", "325 Workflows / yr", "1,000 Workflows / yr", "Custom Workflows"],
  },
  {
    feature: "Template Library",
    values: ["3", "300", "1,000", "Unlimited", "Unlimited"],
  },
  {
    feature: "Workflow Length",
    values: ["1 template max", "Unlimited steps", "Unlimited steps", "Unlimited steps", "Unlimited steps"],
  },
  {
    feature: "Channels",
    values: ["Email Only", "Email + SMS", "Email + SMS", "Email + SMS", "Custom"],
  },
  {
    feature: "Audience Targeting",
    values: ["Static Lists", "Standard", "Dynamic", "Behavioral", "Custom"],
  },
  {
    feature: "D.A.T.A. Credits",
    values: ["5 Lifetime", "30 credits", "50 credits", "100 credits", "Custom"],
  },
  {
    feature: "Support SLA",
    values: [
      "Community",
      "Standard (48h)",
      "Priority (24h)",
      "Premium (12h)",
      "Dedicated",
    ],
  },
];

function detectIndia(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const language = navigator.language?.toLowerCase() ?? "";

  const languages =
    navigator.languages
      ?.map((value) => value.toLowerCase())
      .join(" ") ?? "";

  const timezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";

  return (
    /[-_]in(?:\b|$)/i.test(language) ||
    /[-_]in(?:\b|$)/i.test(languages) ||
    timezone === "Asia/Kolkata"
  );
}

function formatPrice(
  plan: Plan,
  billingCycle: BillingCycle,
  isIndia: boolean,
) {
  if (plan.name === "Free") {
    return {
      value: "Free",
      suffix: "",
    };
  }

  if (plan.name === "Custom") {
    return {
      value: "Let's talk",
      suffix: "",
    };
  }

  const amount = isIndia
    ? billingCycle === "monthly"
      ? plan.inrMonthly
      : plan.inrYearly
    : billingCycle === "monthly"
      ? plan.usdMonthly
      : plan.usdYearly;

  const formatted = new Intl.NumberFormat(
    isIndia ? "en-IN" : "en-US",
    {
      style: "currency",
      currency: isIndia ? "INR" : "USD",
      maximumFractionDigits: 0,
    },
  ).format(amount);

  return {
    value: formatted,
    suffix: billingCycle === "yearly" ? "/yr" : "/mo",
  };
}

function wrapIndex(index: number, total: number) {
  if (index < 0) {
    return total - 1;
  }

  if (index >= total) {
    return 0;
  }

  return index;
}

export function PricingPage() {
  const [billingCycle, setBillingCycle] =
    useState<BillingCycle>("monthly");

  const [activePlan, setActivePlan] = useState(0);

  const [selectedPlan, setSelectedPlan] =
    useState<Plan | null>(null);

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return Boolean(localStorage.getItem(ACCESS_TOKEN_KEY));
  });

  useEffect(() => {
    const checkAuth = () => {
      setIsLoggedIn(Boolean(localStorage.getItem(ACCESS_TOKEN_KEY)));
    };

    checkAuth();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkAuth();
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === ACCESS_TOKEN_KEY || event.key === null) {
        checkAuth();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", checkAuth);
    window.addEventListener("storage", handleStorage);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", checkAuth);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const isIndia = useMemo(() => detectIndia(), []);

  const touchStartX = useRef<number | null>(null);

  const goToPlan = (direction: number) => {
    setActivePlan((current) =>
      wrapIndex(current + direction, plans.length),
    );
  };

  const handleTouchStart = (
    event: TouchEvent<HTMLDivElement>,
  ) => {
    touchStartX.current =
      event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (
    event: TouchEvent<HTMLDivElement>,
  ) => {
    if (touchStartX.current === null) {
      return;
    }

    const endX =
      event.changedTouches[0]?.clientX ??
      touchStartX.current;

    const difference =
      touchStartX.current - endX;

    if (Math.abs(difference) > 45) {
      goToPlan(difference > 0 ? 1 : -1);
    }

    touchStartX.current = null;
  };

  // Modal action: Custom goes to email, logged-in users go to billing,
  // everyone else goes to login.
  const handleModalAction = (plan: Plan) => {
    if (plan.name === "Custom") {
      window.location.href =
        "mailto:support@detrosys.com?subject=Detrosys%20Custom%20Plan";
      return;
    }

    window.location.href = isLoggedIn ? "/app/billing" : "/login";
  };

  const previousPlan =
    plans[
      wrapIndex(activePlan - 1, plans.length)
    ];

  const currentPlan = plans[activePlan];

  const nextPlan =
    plans[
      wrapIndex(activePlan + 1, plans.length)
    ];

  const renderPrice = (plan: Plan) => {
    const price = formatPrice(
      plan,
      billingCycle,
      isIndia,
    );

    return (
      <div className="mt-8 flex items-end gap-2">
        <span className="text-4xl font-semibold tracking-[-0.05em]">
          {price.value}
        </span>

        {price.suffix && (
          <span className="mb-1 text-xs text-neutral-400">
            {price.suffix}
          </span>
        )}
      </div>
    );
  };

  const renderCard = (
    plan: Plan,
    position:
      | "previous"
      | "current"
      | "next",
  ) => {
    const isCurrent = position === "current";

    return (
      <article
        className={`
          absolute left-1/2 top-1/2
          -translate-x-1/2 -translate-y-1/2
          overflow-hidden rounded-[2rem]
          border border-black/10
          bg-[#e8e1d6]
          dark:border-white/10
          dark:bg-[#211e1a]
          transition-[transform,opacity,box-shadow]
          duration-300
          ease-out
          ${
            isCurrent
              ? `
                z-30
                h-[570px]
                w-[min(430px,calc(100vw-3rem))]
                shadow-[0_30px_90px_rgba(0,0,0,0.14)]
              `
              : `
                z-10
                h-[510px]
                w-[min(360px,calc(100vw-3rem))]
                opacity-90
              `
          }
          ${
            position === "previous"
              ? "translate-x-[calc(-50%-235px)]"
              : position === "next"
                ? "translate-x-[calc(-50%+235px)]"
                : ""
          }
        `}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[var(--detrosys-accent)]/10 blur-3xl"
        />

        <div className="relative flex h-full flex-col p-8">
          <div className="flex items-start justify-between">
            <p
              className={`
                text-xs font-semibold uppercase
                tracking-[0.18em]
                ${
                  plan.name === "Custom"
                    ? "text-[var(--detrosys-accent)]"
                    : "text-neutral-400"
                }
              `}
            >
              {plan.name}
            </p>

            <span className="text-xs text-neutral-400">
              {String(
                plans.findIndex(
                  (item) =>
                    item.name === plan.name,
                ) + 1,
              ).padStart(2, "0")}
            </span>
          </div>

          <p className="mt-6 min-h-[72px] max-w-[310px] text-sm leading-6 text-neutral-600 dark:text-neutral-400">
            {plan.description}
          </p>

          {renderPrice(plan)}

          <div className="my-8 h-px bg-black/10 dark:bg-white/10" />

          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-400">
            Includes
          </p>

          <ul className="mt-5 space-y-4">
            {plan.features.map((feature) => (
              <li
                key={feature}
                className="flex items-start gap-3 text-sm leading-5 text-neutral-600 dark:text-neutral-300"
              >
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-black/5 text-neutral-600 dark:bg-white/10 dark:text-neutral-300">
                  <Check
                    size={10}
                    strokeWidth={2.5}
                  />
                </span>

                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() =>
              setSelectedPlan(plan)
            }
            className="mt-auto inline-flex h-11 w-full items-center justify-center rounded-xl bg-neutral-950 text-xs font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg dark:bg-white dark:text-neutral-950"
          >
            {plan.name === "Custom"
              ? "Talk to us"
              : plan.name === "Free"
                ? "Get started"
                : `Choose ${plan.name}`}
          </button>
        </div>
      </article>
    );
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f3f1eb] text-neutral-950 dark:bg-[#0b0b0b] dark:text-white">
      <PublicNavbar />

      <main>
        <section className="relative overflow-hidden px-6 pb-16 pt-36 sm:px-8 lg:px-12 lg:pb-24">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-[-10rem] h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-[var(--detrosys-accent)]/10 blur-[120px]"
          />

          <div className="relative mx-auto max-w-[1400px]">
            <div className="mx-auto max-w-4xl text-center">
              <h1 className="text-5xl font-semibold leading-[0.9] tracking-[-0.065em] sm:text-7xl lg:text-[6.5rem]">
                Choose the workspace
                <span className="block text-neutral-400 dark:text-neutral-600">
                  that fits the work.
                </span>
              </h1>

              <p className="mx-auto mt-8 max-w-2xl text-base leading-7 text-neutral-500 dark:text-neutral-400 sm:text-lg">
                Start small, grow when you need to, or build
                something specific to the way your organisation
                works.
              </p>

              <div className="mt-10 inline-flex items-center rounded-full border border-black/10 bg-white/70 p-1.5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]">
                <button
                  type="button"
                  onClick={() =>
                    setBillingCycle("monthly")
                  }
                  className={`rounded-full px-5 py-2.5 text-sm font-medium transition-none ${
                    billingCycle === "monthly"
                      ? "bg-neutral-950 !text-white shadow-md dark:bg-white dark:!text-neutral-950"
                      : "text-neutral-500 dark:text-neutral-400"
                  }`}
                >
                  Monthly
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setBillingCycle("yearly")
                  }
                  className={`rounded-full px-5 py-2.5 text-sm font-medium transition-none ${
                    billingCycle === "yearly"
                      ? "bg-neutral-950 !text-white shadow-md dark:bg-white dark:!text-neutral-950"
                      : "text-neutral-500 dark:text-neutral-400"
                  }`}
                >
                  Yearly
                </button>

                <span className="mr-2 ml-1 rounded-full bg-[var(--detrosys-accent)]/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--detrosys-accent)]">
                  Save 20%
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 pb-32 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-[1200px]">
            <div
              className="relative h-[650px] touch-pan-y"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <button
                type="button"
                onClick={() => goToPlan(-1)}
                aria-label="Previous pricing plan"
                className="absolute left-2 top-1/2 z-40 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white/90 text-neutral-950 shadow-lg backdrop-blur-xl md:flex dark:border-white/10 dark:bg-[#171717]/90 dark:text-white"
              >
                <ChevronLeft size={20} />
              </button>

              <button
                type="button"
                onClick={() => goToPlan(1)}
                aria-label="Next pricing plan"
                className="absolute right-2 top-1/2 z-40 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white/90 text-neutral-950 shadow-lg backdrop-blur-xl md:flex dark:border-white/10 dark:bg-[#171717]/90 dark:text-white"
              >
                <ChevronRight size={20} />
              </button>

              <div className="absolute inset-0 hidden md:block">
                {renderCard(previousPlan, "previous")}
                {renderCard(currentPlan, "current")}
                {renderCard(nextPlan, "next")}
              </div>

              <div className="absolute inset-x-0 top-1/2 h-[570px] -translate-y-1/2 md:hidden">
                <article className="mx-auto h-full w-full max-w-[430px] overflow-hidden rounded-[2rem] border border-black/10 bg-[#e8e1d6] shadow-[0_25px_70px_rgba(0,0,0,0.10)] dark:border-white/10 dark:bg-[#211e1a]">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[var(--detrosys-accent)]/10 blur-3xl"
                  />

                  <div className="relative flex h-full flex-col p-7">
                    <div className="flex items-start justify-between">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
                        {currentPlan.name}
                      </p>

                      <span className="text-xs text-neutral-400">
                        {String(activePlan + 1).padStart(2, "0")}
                      </span>
                    </div>

                    <p className="mt-6 min-h-[72px] text-sm leading-6 text-neutral-600 dark:text-neutral-400">
                      {currentPlan.description}
                    </p>

                    {renderPrice(currentPlan)}

                    <div className="my-8 h-px bg-black/10 dark:bg-white/10" />

                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-400">
                      Includes
                    </p>

                    <ul className="mt-5 space-y-4">
                      {currentPlan.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-3 text-sm leading-5 text-neutral-600 dark:text-neutral-300"
                        >
                          <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-black/5 text-neutral-600 dark:bg-white/10 dark:text-neutral-300">
                            <Check size={10} strokeWidth={2.5} />
                          </span>

                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      type="button"
                      onClick={() => setSelectedPlan(currentPlan)}
                      className="mt-auto inline-flex h-11 w-full items-center justify-center rounded-xl bg-neutral-950 text-xs font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg dark:bg-white dark:text-neutral-950"
                    >
                      {currentPlan.name === "Custom"
                        ? "Talk to us"
                        : currentPlan.name === "Free"
                          ? "Get started"
                          : `Choose ${currentPlan.name}`}
                    </button>
                  </div>
                </article>
              </div>

              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-5 md:hidden">
                <button
                  type="button"
                  onClick={() => goToPlan(-1)}
                  aria-label="Previous pricing plan"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white text-neutral-950 dark:border-white/10 dark:bg-[#171717] dark:text-white"
                >
                  <ChevronLeft size={18} />
                </button>

                <div className="flex items-center gap-1.5">
                  {plans.map((plan, index) => (
                    <button
                      key={plan.name}
                      type="button"
                      onClick={() => setActivePlan(index)}
                      aria-label={`Show ${plan.name} plan`}
                      className={`h-1.5 rounded-full ${
                        index === activePlan
                          ? "w-6 bg-[var(--detrosys-accent)]"
                          : "w-1.5 bg-neutral-300 dark:bg-neutral-700"
                      }`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => goToPlan(1)}
                  aria-label="Next pricing plan"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white text-neutral-950 dark:border-white/10 dark:bg-[#171717] dark:text-white"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            <p className="mt-5 text-center text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-400 md:hidden">
              Swipe to explore plans
            </p>
          </div>
        </section>

        <section className="px-6 pb-32 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-[1400px]">
            <div className="mb-12 max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-400">
                Compare plans
              </p>

              <h2 className="mt-5 text-4xl font-semibold leading-[0.95] tracking-[-0.055em] sm:text-6xl">
                See what changes
                <span className="text-neutral-400 dark:text-neutral-600">
                  {" "}
                  as your workspace grows.
                </span>
              </h2>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-black/10 bg-white/45 shadow-[0_20px_60px_rgba(0,0,0,0.05)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.025] dark:shadow-none">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] border-collapse">
                  <thead>
                    <tr className="border-b border-black/10 dark:border-white/10">
                      <th className="w-[24%] px-6 py-7 text-left text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">
                        Feature
                      </th>

                      {plans.map((plan) => (
                        <th
                          key={plan.name}
                          className="px-5 py-7 text-left text-sm font-semibold"
                        >
                          {plan.name}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {comparisonRows.map((row, index) => (
                      <tr
                        key={row.feature}
                        className={
                          index !== comparisonRows.length - 1
                            ? "border-b border-black/10 dark:border-white/10"
                            : ""
                        }
                      >
                        <td className="px-6 py-5 text-sm font-medium">
                          {row.feature}
                        </td>

                        {row.values.map((value, valueIndex) => (
                          <td
                            key={`${row.feature}-${valueIndex}`}
                            className="px-5 py-5 text-sm text-neutral-500 dark:text-neutral-400"
                          >
                            {value === "—" ? (
                              <Minus
                                size={15}
                                className="text-neutral-300 dark:text-neutral-700"
                              />
                            ) : (
                              value
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <p className="mt-4 text-xs text-neutral-400 md:hidden">
              Swipe horizontally across the comparison
              table to view all plans.
            </p>
          </div>
        </section>
      </main>

      <PublicFooter />

      {selectedPlan && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedPlan(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pricing-plan-modal-title"
            className="relative w-full max-w-[460px] overflow-hidden rounded-[1.75rem] border border-black/10 bg-[#f3f1eb] p-7 shadow-[0_30px_100px_rgba(0,0,0,0.22)] dark:border-white/10 dark:bg-[#171717]"
          >
            <button
              type="button"
              aria-label="Close plan summary"
              onClick={() => setSelectedPlan(null)}
              className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white/70 text-neutral-500 transition-colors hover:text-neutral-950 dark:border-white/10 dark:bg-white/[0.04] dark:text-neutral-400 dark:hover:text-white"
            >
              <X size={16} />
            </button>

            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
              Plan summary
            </p>

            <h2
              id="pricing-plan-modal-title"
              className="mt-3 pr-10 text-3xl font-semibold tracking-[-0.045em] text-neutral-950 dark:text-white"
            >
              {selectedPlan.name}
            </h2>

            <p className="mt-3 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
              {selectedPlan.description}
            </p>

            {selectedPlan.name === "Custom" ? (
              <div className="mt-7">
                <p className="text-2xl font-semibold tracking-[-0.04em] text-neutral-950 dark:text-white">
                  Let's talk
                </p>

                <p className="mt-2 text-xs leading-5 text-neutral-400 dark:text-neutral-600">
                  This plan is tailored to your workspace requirements and
                  does not have a fixed public price.
                </p>
              </div>
            ) : (
              <div className="mt-7 flex items-end gap-2">
                <span className="text-3xl font-semibold tracking-[-0.045em] text-neutral-950 dark:text-white">
                  {formatPrice(selectedPlan, billingCycle, isIndia).value}
                </span>

                {selectedPlan.name !== "Free" && (
                  <span className="mb-1 text-xs text-neutral-400">
                    {formatPrice(selectedPlan, billingCycle, isIndia).suffix}
                  </span>
                )}
              </div>
            )}

            <div className="my-6 h-px bg-black/10 dark:bg-white/10" />

            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
              Includes
            </p>

            <ul className="mt-4 space-y-3">
              {selectedPlan.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-3 text-sm leading-5 text-neutral-600 dark:text-neutral-300"
                >
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-black/5 text-neutral-600 dark:bg-white/10 dark:text-neutral-300">
                    <Check size={10} strokeWidth={2.5} />
                  </span>

                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row-reverse">
              <button
                type="button"
                onClick={() => handleModalAction(selectedPlan)}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-neutral-950 px-4 text-xs font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg dark:bg-white dark:text-neutral-950"
              >
                {!isLoggedIn
                  ? "Log in to continue"
                  : selectedPlan.name === "Custom"
                    ? "Contact Support"
                    : "Choose plan"}
              </button>

              <button
                type="button"
                onClick={() => setSelectedPlan(null)}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-black/10 bg-white/60 px-4 text-xs font-semibold text-neutral-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-neutral-300"
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