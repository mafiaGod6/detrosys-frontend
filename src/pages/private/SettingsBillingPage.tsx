import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Bot,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Layers,
  Mail,
  MessageSquare,
  ReceiptText,
  Sparkles,
  Users,
  Workflow,
} from "lucide-react";
import { useNavigate } from "react-router";

import { SettingsNavigation } from "../../components/private/SettingsNavigation";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8000"
).replace(/\/$/, "");

const ACCESS_TOKEN_KEY = "detrosys_access_token";

type PlanPricing = {
  monthly: string;
  yearly: string;
};

type PlanDetails = {
  name: string;
  priceUSD: PlanPricing;
  priceINR: PlanPricing;
  contacts: string;
  monthlyWorkflows: string;
  yearlyWorkflows: string;
  templates: string;
  workflowLength: string;
  channels: string;
  audienceTargeting: string;
  aiCredits: string;
  supportSla: string;
};

const PLAN_CATALOG: Record<string, PlanDetails> = {
  none: {
    name: "No Active Plan",
    priceUSD: { monthly: "$0", yearly: "$0" },
    priceINR: { monthly: "₹0", yearly: "₹0" },
    contacts: "0",
    monthlyWorkflows: "0",
    yearlyWorkflows: "0",
    templates: "0",
    workflowLength: "None",
    channels: "None",
    audienceTargeting: "None",
    aiCredits: "0",
    supportSla: "Community",
  },
  free: {
    name: "Free Sandbox",
    priceUSD: { monthly: "$0", yearly: "$0" },
    priceINR: { monthly: "₹0", yearly: "₹0" },
    contacts: "250",
    monthlyWorkflows: "3 Workflows Lifetime",
    yearlyWorkflows: "3 Workflows Lifetime",
    templates: "3 Templates",
    workflowLength: "1 template max",
    channels: "Email Only",
    audienceTargeting: "Static Lists",
    aiCredits: "5 Lifetime",
    supportSla: "Community",
  },
  basic: {
    name: "Basic",
    priceUSD: { monthly: "$89 / month", yearly: "$859 / year" },
    priceINR: { monthly: "₹7,499 / month", yearly: "₹71,999 / year" },
    contacts: "10,000",
    monthlyWorkflows: "10 Workflows / mo",
    yearlyWorkflows: "150 Workflows / yr",
    templates: "300 Templates",
    workflowLength: "Unlimited steps",
    channels: "Email + SMS",
    audienceTargeting: "Standard",
    aiCredits: "30 credits / mo",
    supportSla: "Standard (48h)",
  },
  pro: {
    name: "Pro",
    priceUSD: { monthly: "$129 / month", yearly: "$1,239 / year" },
    priceINR: { monthly: "₹12,999 / month", yearly: "₹1,24,799 / year" },
    contacts: "50,000",
    monthlyWorkflows: "25 Workflows / mo",
    yearlyWorkflows: "325 Workflows / yr",
    templates: "1,000 Templates",
    workflowLength: "Unlimited steps",
    channels: "Email + SMS",
    audienceTargeting: "Dynamic",
    aiCredits: "50 credits / mo",
    supportSla: "Priority (24h)",
  },
  advanced: {
    name: "Advanced",
    priceUSD: { monthly: "$189 / month", yearly: "$1,819 / year" },
    priceINR: { monthly: "₹17,399 / month", yearly: "₹166,999 / year" },
    contacts: "250,000",
    monthlyWorkflows: "75 Workflows / mo",
    yearlyWorkflows: "1,000 Workflows / yr",
    templates: "Unlimited",
    workflowLength: "Unlimited steps",
    channels: "Email + SMS",
    audienceTargeting: "Behavioral",
    aiCredits: "100 credits / mo",
    supportSla: "Premium (12h)",
  },
};

export function SettingsBillingPage() {
  const navigate = useNavigate();
  const [planSlug, setPlanSlug] = useState<string>("free");
  const [currency, setCurrency] = useState<string>("INR");
  const [isYearly, setIsYearly] = useState<boolean>(false);
  const [renewalDate, setRenewalDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBilling() {
      try {
        const token = localStorage.getItem(ACCESS_TOKEN_KEY);
        const headers = {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        };

        const [statusRes, subRes] = await Promise.allSettled([
          fetch(`${API_BASE_URL}/billing/status`, { headers }).then((r) =>
            r.ok ? r.json() : null,
          ),
          fetch(`${API_BASE_URL}/billing/subscription`, { headers }).then((r) =>
            r.ok ? r.json() : null,
          ),
        ]);

        let resolved = "free";
        let resolvedCurrency = "INR";

        if (statusRes.status === "fulfilled" && statusRes.value) {
          const data = statusRes.value;
          let raw = data?.plan || data?.plan_slug;
          if (typeof raw === "object" && raw !== null) {
            raw = (raw as any).slug || (raw as any).name;
          }
          const val = String(raw || "free").toLowerCase().trim();
          if (val.includes("adv")) resolved = "advanced";
          else if (val.includes("pro")) resolved = "pro";
          else if (val.includes("basic")) resolved = "basic";
          else if (val === "none") resolved = "none";

          if (data?.currency) {
            resolvedCurrency = String(data.currency).toUpperCase();
          }

          if (data?.billing_interval === "year" || data?.interval === "year") {
            setIsYearly(true);
          }
          if (data?.current_period_end) {
            setRenewalDate(formatDate(data.current_period_end));
          }
        }

        if (subRes.status === "fulfilled" && subRes.value) {
          const subData = subRes.value;
          if (subData?.currency) {
            resolvedCurrency = String(subData.currency).toUpperCase();
          }
          if (
            subData?.billing_interval === "year" ||
            subData?.interval === "year"
          ) {
            setIsYearly(true);
          }
          if (subData?.current_period_end) {
            setRenewalDate(formatDate(subData.current_period_end));
          }
        }

        setPlanSlug(resolved);
        setCurrency(resolvedCurrency);
        localStorage.setItem("detrosys_plan", resolved);
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    }

    void fetchBilling();
  }, []);

  const plan = PLAN_CATALOG[planSlug] || PLAN_CATALOG.free;
  
  const activePricing = currency === "INR" ? plan.priceINR : plan.priceUSD;
  const priceDisplay = isYearly ? activePricing.yearly : activePricing.monthly;
  const workflowDisplay = isYearly ? plan.yearlyWorkflows : plan.monthlyWorkflows;

  return (
    <div className="mx-auto w-full max-w-[1180px] pb-24">
      <header className="max-w-2xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-neutral-400 dark:text-neutral-600">
          Settings / Billing
        </p>

        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.055em] text-neutral-950 sm:text-5xl dark:text-white">
          Billing & Subscription
        </h1>

        <p className="mt-4 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
          Manage your active workspace plan, review allocated feature limits,
          and track billing cycles.
        </p>
      </header>

      <div className="mt-8">
        <SettingsNavigation />
      </div>

      <div className="mt-6 space-y-10">
        <section className="rounded-3xl border border-neutral-200 bg-[#f5f3ee] p-7 shadow-sm dark:border-white/[0.08] dark:bg-[#121212] sm:p-9">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-400 dark:text-neutral-500">
                  Current Workspace Plan
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={12} strokeWidth={2.2} />
                  Active
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-baseline gap-3">
                <h2 className="text-3xl font-semibold tracking-[-0.04em] text-neutral-950 sm:text-4xl dark:text-white">
                  {loading ? "Loading..." : plan.name}
                </h2>
                <span className="rounded-xl border border-neutral-300/80 bg-white/80 px-2.5 py-1 text-xs font-semibold text-neutral-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-neutral-300">
                  {isYearly ? "Annual Cadence" : "Monthly Cadence"}
                </span>
              </div>

              {renewalDate && (
                <p className="mt-2.5 flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                  <Calendar size={13} className="text-neutral-400" />
                  <span>Next billing date: <strong>{renewalDate}</strong></span>
                </p>
              )}
            </div>

            <div className="flex flex-col items-start gap-3 rounded-2xl border border-neutral-200 bg-white/70 p-5 dark:border-white/[0.08] dark:bg-[#181818] lg:items-end">
              <div className="flex items-center gap-2 text-sm font-semibold text-neutral-950 dark:text-white">
                <CreditCard size={16} />
                <span>{priceDisplay}</span>
              </div>
              <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
                Tax-inclusive Merchant of Record checkout via Paddle
              </p>
              <button
                type="button"
                onClick={() => navigate("/pricing")}
                className="mt-1 inline-flex items-center gap-1.5 rounded-xl bg-neutral-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
              >
                Change Plan
                <ArrowUpRight size={13} />
              </button>
            </div>
          </div>
        </section>

        <section>
          <div className="border-b border-neutral-200 pb-4 dark:border-white/[0.08]">
            <h3 className="text-base font-semibold text-neutral-950 dark:text-white">
              Allocated Plan Entitlements
            </h3>
            <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-600">
              The limits and capabilities provisioned for your workspace tier.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={Users}
              label="Contact Storage"
              value={`${plan.contacts} Contacts`}
              subtitle={planSlug === "free" ? "Permanent cap" : "Contacts on your plan"}
            />
            <FeatureCard
              icon={Workflow}
              label="Active Workflows"
              value={workflowDisplay}
              subtitle="Automation pipelines"
            />
            <FeatureCard
              icon={Layers}
              label="Template Library"
              value={plan.templates}
              subtitle="Email & SMS templates"
            />
            <FeatureCard
              icon={Clock}
              label="Workflow Length"
              value={plan.workflowLength}
              subtitle="Step capacity per flow"
            />
            <FeatureCard
              icon={plan.channels.includes("SMS") ? MessageSquare : Mail}
              label="Dispatch Channels"
              value={plan.channels}
              subtitle="Outbound infrastructure"
            />
            <FeatureCard
              icon={Sparkles}
              label="Audience Targeting"
              value={plan.audienceTargeting}
              subtitle="Segmentation engine"
            />
            <FeatureCard
              icon={Bot}
              label="D.A.T.A. Assistant"
              value={plan.aiCredits}
              subtitle="Credits on your plan"
            />
            <FeatureCard
              icon={CheckCircle2}
              label="Support SLA"
              value={plan.supportSla}
              subtitle="Customer success desk"
            />
          </div>
        </section>

        <section>
          <div className="border-b border-neutral-200 pb-4 dark:border-white/[0.08]">
            <h3 className="text-base font-semibold text-neutral-950 dark:text-white">
              Billing History & Invoices
            </h3>
            <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-600">
              Transaction receipts and invoices are generated directly by Paddle.
            </p>
          </div>

          <div className="mt-6 rounded-2xl border border-neutral-200 bg-white/70 p-6 dark:border-white/[0.08] dark:bg-[#141414] sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-neutral-950 text-white dark:bg-white dark:text-neutral-950">
                  <ReceiptText size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-neutral-950 dark:text-white">
                    Direct Email Invoicing via Paddle
                  </h4>
                  <p className="mt-1 max-w-xl text-xs leading-5 text-neutral-500 dark:text-neutral-400">
                    As our Merchant of Record, Paddle automatically delivers VAT/GST compliant
                    receipts and PDF invoices directly to your account email address upon each
                    payment and renewal cycle.
                  </p>
                </div>
              </div>

              <div className="shrink-0">
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-medium text-neutral-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-neutral-300">
                  <CheckCircle2 size={13} className="text-emerald-500" />
                  Emailed automatically
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  label,
  value,
  subtitle,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white/70 p-5 shadow-xs transition hover:border-neutral-300 dark:border-white/[0.08] dark:bg-[#141414] dark:hover:border-white/20">
      <div className="flex items-center gap-2 text-neutral-400 dark:text-neutral-500">
        <Icon size={15} strokeWidth={1.8} />
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em]">
          {label}
        </span>
      </div>
      <p className="mt-3 text-lg font-semibold tracking-tight text-neutral-950 dark:text-white">
        {value}
      </p>
      <p className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-600">
        {subtitle}
      </p>
    </div>
  );
}

function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}