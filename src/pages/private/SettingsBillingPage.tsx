import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Bot,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Layers,
  Loader2,
  Mail,
  MessageSquare,
  ReceiptText,
  Sparkles,
  Users,
  Workflow,
  XCircle,
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

type CancelOutcome = "refund" | "period_end";

type CancelPreview = {
  can_cancel: boolean;
  reason: string | null;
  outcome: CancelOutcome | null;
  refund_amount: string | number | null;
  currency: string | null;
  refund_deadline: string | null;
  access_until: string | null;
  already_scheduled: boolean;
};

const PAID_PLAN_SLUGS = ["basic", "pro", "advanced"];

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
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [preview, setPreview] = useState<CancelPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const fetchBilling = useCallback(async () => {
    try {
      const headers = authHeaders();

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
      let yearly = false;
      let renewal: string | null = null;
      let scheduledCancel = false;

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
          yearly = true;
        }
        if (data?.current_period_end) {
          renewal = formatDate(data.current_period_end);
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
          yearly = true;
        }
        if (subData?.current_period_end) {
          renewal = formatDate(subData.current_period_end);
        }
        scheduledCancel = Boolean(subData?.cancel_at_period_end);
      }

      setPlanSlug(resolved);
      setCurrency(resolvedCurrency);
      setIsYearly(yearly);
      setRenewalDate(renewal);
      setCancelAtPeriodEnd(scheduledCancel);
      localStorage.setItem("detrosys_plan", resolved);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchBilling();
  }, [fetchBilling]);

  const canShowCancel = PAID_PLAN_SLUGS.includes(planSlug) && !cancelAtPeriodEnd;

  async function openCancelDialog() {
    setCancelOpen(true);
    setPreview(null);
    setCancelError(null);
    setPreviewLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/billing/subscription/cancel-preview`,
        { headers: authHeaders() },
      );
      if (!res.ok) {
        setCancelError(await readError(res));
        return;
      }
      setPreview((await res.json()) as CancelPreview);
    } catch {
      setCancelError("Could not reach the server. Please try again.");
    } finally {
      setPreviewLoading(false);
    }
  }

  function closeCancelDialog() {
    if (cancelling) return;
    setCancelOpen(false);
    setPreview(null);
    setCancelError(null);
  }

  async function confirmCancel() {
    if (!preview?.can_cancel || !preview.outcome || cancelling) return;
    setCancelling(true);
    setCancelError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/billing/subscription/cancel`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ expected_outcome: preview.outcome }),
      });
      if (!res.ok) {
        setCancelError(await readError(res));
        // The server state may have moved on; refresh what the user sees.
        void fetchBilling();
        return;
      }
      const data = await res.json();
      setNotice(
        data?.message ||
          "Your subscription has been cancelled.",
      );
      setCancelOpen(false);
      setPreview(null);
      await fetchBilling();
    } catch {
      setCancelError(
        "We could not confirm the result. Please refresh this page to check your subscription before trying again.",
      );
    } finally {
      setCancelling(false);
    }
  }

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
        {notice && (
          <div
            role="status"
            className="flex items-start justify-between gap-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-700 dark:text-emerald-300"
          >
            <span>{notice}</span>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="text-xs font-semibold underline"
            >
              Dismiss
            </button>
          </div>
        )}

        <section className="rounded-3xl border border-neutral-200 bg-[#f5f3ee] p-7 shadow-sm dark:border-white/[0.08] dark:bg-[#121212] sm:p-9">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-400 dark:text-neutral-500">
                  Current Workspace Plan
                </span>
                {!loading && planSlug === "none" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-neutral-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-neutral-500">
                    No active plan
                  </span>
                ) : !loading && cancelAtPeriodEnd ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                    <AlertTriangle size={12} strokeWidth={2.2} />
                    Cancelling
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 size={12} strokeWidth={2.2} />
                    Active
                  </span>
                )}
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
                  <span>
                    {cancelAtPeriodEnd ? "Access ends on" : "Next billing date"}:{" "}
                    <strong>{renewalDate}</strong>
                  </span>
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
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate("/pricing")}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
                >
                  Change Plan
                  <ArrowUpRight size={13} />
                </button>

                {canShowCancel && (
                  <button
                    type="button"
                    onClick={() => void openCancelDialog()}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/40 px-4 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-500/10 dark:text-red-400"
                  >
                    <XCircle size={13} />
                    Cancel Plan
                  </button>
                )}

                {PAID_PLAN_SLUGS.includes(planSlug) && cancelAtPeriodEnd && (
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-700 dark:text-amber-400">
                    Cancellation scheduled
                  </span>
                )}
              </div>
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

      {cancelOpen && (
        <CancelDialog
          preview={preview}
          loading={previewLoading}
          cancelling={cancelling}
          error={cancelError}
          planName={plan.name}
          onClose={closeCancelDialog}
          onConfirm={() => void confirmCancel()}
        />
      )}
    </div>
  );
}

function CancelDialog({
  preview,
  loading,
  cancelling,
  error,
  planName,
  onClose,
  onConfirm,
}: {
  preview: CancelPreview | null;
  loading: boolean;
  cancelling: boolean;
  error: string | null;
  planName: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const isRefund = preview?.outcome === "refund";
  const canConfirm = Boolean(preview?.can_cancel) && !loading && !cancelling;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-dialog-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white p-7 shadow-xl dark:border-white/[0.08] dark:bg-[#141414]"
      >
        <h2
          id="cancel-dialog-title"
          className="text-lg font-semibold text-neutral-950 dark:text-white"
        >
          Cancel {planName} plan?
        </h2>

        <div className="mt-4 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
          {loading && (
            <p className="flex items-center gap-2">
              <Loader2 size={15} className="animate-spin" />
              Checking your cancellation options...
            </p>
          )}

          {!loading && preview && !preview.can_cancel && (
            <p>{preview.reason || "This subscription cannot be cancelled."}</p>
          )}

          {!loading && preview?.can_cancel && isRefund && (
            <div className="space-y-3">
              <p>
                You are within the 7-day refund window
                {preview.refund_deadline
                  ? ` (ends ${formatDate(preview.refund_deadline)})`
                  : ""}
                .
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  Your plan is cancelled <strong>immediately</strong> and
                  access to plan features ends right away.
                </li>
                <li>
                  You are refunded{" "}
                  <strong>
                    {formatMoney(preview.refund_amount, preview.currency)}
                  </strong>{" "}
                  in full to your original payment method.
                </li>
                <li>
                  Refunds are reviewed by our payment provider and can take a
                  few days.
                </li>
              </ul>
            </div>
          )}

          {!loading && preview?.can_cancel && !isRefund && (
            <div className="space-y-3">
              <p>
                The 7-day refund window has passed, so this payment is{" "}
                <strong>not refundable</strong>.
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  You keep full access until{" "}
                  <strong>
                    {preview.access_until
                      ? formatDate(preview.access_until)
                      : "the end of your billing period"}
                  </strong>
                  .
                </li>
                <li>You will not be charged again.</li>
              </ul>
            </div>
          )}

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400"
            >
              {error}
            </p>
          )}
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={cancelling}
            className="rounded-xl border border-neutral-300 px-4 py-2 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-50 dark:border-white/10 dark:text-neutral-300 dark:hover:bg-white/[0.05]"
          >
            Keep my plan
          </button>

          {preview?.can_cancel && (
            <button
              type="button"
              onClick={onConfirm}
              disabled={!canConfirm}
              className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cancelling && <Loader2 size={13} className="animate-spin" />}
              {cancelling
                ? "Cancelling..."
                : isRefund
                  ? "Cancel and refund"
                  : "Cancel at period end"}
            </button>
          )}
        </div>
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

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  return {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function readError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    const detail = body?.detail;
    if (typeof detail === "string" && detail) return detail;
    if (Array.isArray(detail) && detail[0]?.msg) return String(detail[0].msg);
  } catch {
    // fall through
  }
  return "Something went wrong. Please try again.";
}

function formatMoney(
  amount: string | number | null,
  currency: string | null,
): string {
  if (amount === null || amount === undefined) return "your payment";
  const value = Number(amount);
  if (Number.isNaN(value)) return String(amount);
  try {
    return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency ?? ""}`.trim();
  }
}