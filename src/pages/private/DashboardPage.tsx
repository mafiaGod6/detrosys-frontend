import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import {
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Lock,
  Mail,
  MessageSquare,
  Plus,
  RefreshCw,
  Send,
  Users,
} from "lucide-react";

type DashboardPageProps = {
  firstName?: string;
};

type DateRange = {
  label: string;
  days: 7 | 30 | 90 | null;
};

const DATE_RANGES: DateRange[] = [
  {
    label: "Last 7 days",
    days: 7,
  },
  {
    label: "Last 30 days",
    days: 30,
  },
  {
    label: "Last 90 days",
    days: 90,
  },
  {
    label: "All time",
    days: null,
  },
];

type AnalyticsMetric = "messages" | "contacts";

type DashboardActivity = {
  index: number;
  label: string;
  contacts: number;
  messages: number;
};

type AudienceGrowthPoint = {
  index: number;
  label: string;
  contacts: number;
};

type CurrentCampaign = {
  id: string;
  name: string;
  channel: string;
  status: string;
  scheduled_at: string | null;
};

type RecentActivity = {
  type: "campaign" | "contact";
  label: string;
  name: string;
  timestamp: string;
};

type DashboardResponse = {
  range: {
    days: 7 | 30 | 90 | null;
    start: string | null;
    end: string;
  };

  metrics: {
    contacts: number;
    messages_sent: number;
    delivered: number;
    active_campaigns: number;
  };

  communication: {
    email: {
      sent: number;
      delivered: number;
      delivery_rate: number | null;
    };

    sms: {
      sent: number;
      delivered: number;
      delivery_rate: number | null;
    };
  };

  activity: DashboardActivity[];

  audience_growth: AudienceGrowthPoint[];

  current_campaigns: CurrentCampaign[];

  attention: {
    failed_campaigns: number;
  };

  recent_activity: RecentActivity[];
};

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ??
  import.meta.env.VITE_API_URL ??
  "http://localhost:8000"
).replace(/\/$/, "");

const ACCESS_TOKEN_KEY = "detrosys_access_token";

async function apiRequest<T>(path: string): Promise<T> {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);

  const headers = new Headers();
  headers.set("Accept", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}.`;
    try {
      const data = await response.json();
      if (typeof data?.detail === "string") {
        message = data.detail;
      } else if (typeof data?.message === "string") {
        message = data.message;
      }
    } catch {}

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

// Identifies the logged-in user from the login token so that browser-saved
// numbers are never shared between different accounts.
function getUserKey(): string | null {
  try {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) return null;
    const part = token.split(".")[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(json);
    const id = payload?.sub ?? payload?.user_id ?? payload?.id ?? payload?.email;
    return id ? String(id) : null;
  } catch {
    return null;
  }
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatCampaignChannel(channel: string): string {
  if (channel === "email") return "Email";
  if (channel === "sms") return "SMS";
  if (channel === "email_sms") return "Email + SMS";
  return channel;
}

function formatCampaignStatus(status: string): string {
  if (status === "active") return "Active";
  if (status === "scheduled") return "Scheduled";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function DashboardPage({
  firstName = "there",
}: DashboardPageProps) {
  const navigate = useNavigate();

  const [dateRange, setDateRange] = useState<DateRange>(DATE_RANGES[1]);
  const [dateRangeOpen, setDateRangeOpen] = useState(false);
  const [analyticsMetric, setAnalyticsMetric] = useState<AnalyticsMetric>("messages");
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [isRestrictedPlan, setIsRestrictedPlan] = useState<boolean>(false);

  const checkPlanStatus = async () => {
    try {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (!token) {
        setIsRestrictedPlan(true);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/billing/status`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        let raw = data?.plan || data?.plan_slug;
        if (typeof raw === "object" && raw !== null) {
          raw = (raw as any).slug || (raw as any).name;
        }
        const plan = String(raw || "free").toLowerCase().trim();
        if (plan === "none") {
          setIsRestrictedPlan(true);
        } else {
          setIsRestrictedPlan(false);
        }
      }
    } catch {
      setIsRestrictedPlan(false);
    }
  };

  const loadDashboard = async (range: DateRange, showRefreshState = false) => {
    if (showRefreshState) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setErrorMessage(null);

    try {
      const query = range.days === null ? "" : `?days=${range.days}`;
      const response = await apiRequest<DashboardResponse>(`/dashboard${query}`);

      // --- MONTHLY LEDGER PERSISTENCE (kept per user, so accounts never mix) ---
      // Keeps this month's counts even if campaigns are deleted. Only applied to
      // the default 30-day view, and only when we know which user is logged in.
      const userKey = getUserKey();
      if (userKey && range.days === 30) {
        const now = new Date();
        const monthKey = `detrosys_monthly_ledger_${userKey}_${now.getFullYear()}_${now.getMonth() + 1}`;

        let monthlyLedger = { sent: 0, delivered: 0 };
        try {
          const savedLedger = localStorage.getItem(monthKey);
          if (savedLedger) {
            monthlyLedger = JSON.parse(savedLedger);
          }
        } catch {}

        const backendSent = response.metrics?.messages_sent ?? 0;
        const backendDelivered = response.metrics?.delivered ?? 0;

        const finalSent = Math.max(monthlyLedger.sent ?? 0, backendSent);
        const finalDelivered = Math.max(monthlyLedger.delivered ?? 0, backendDelivered);

        try {
          localStorage.setItem(
            monthKey,
            JSON.stringify({ sent: finalSent, delivered: finalDelivered })
          );
        } catch {}

        response.metrics.messages_sent = finalSent;
        response.metrics.delivered = finalDelivered;

        // Only use the saved totals for the Email row when there is no SMS,
        // otherwise the Email row would show SMS numbers too.
        if (response.communication?.email && (response.communication?.sms?.sent ?? 0) === 0) {
          response.communication.email.sent = finalSent;
          response.communication.email.delivered = finalDelivered;
          response.communication.email.delivery_rate =
            finalSent === 0 ? null : Math.round((finalDelivered * 1000) / finalSent) / 10;
        }
      }
      // -------------------------------------------------------------------------

      setDashboard(response);
      setLastRefreshed(new Date());
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load dashboard data.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void checkPlanStatus();
    void loadDashboard(dateRange);
  }, [dateRange]);

  const handleRefresh = () => {
    if (refreshing) return;
    void loadDashboard(dateRange, true);
  };

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
    setDateRangeOpen(false);
  };

  const analyticsLabel = analyticsMetric === "messages" ? "messages" : "contacts";

  const metrics = dashboard?.metrics;
  const communication = dashboard?.communication;
  const activity = dashboard?.activity ?? [];
  const audienceGrowth = dashboard?.audience_growth ?? [];
  const currentCampaigns = dashboard?.current_campaigns ?? [];
  const recentActivity = dashboard?.recent_activity ?? [];
  const failedCampaigns = dashboard?.attention.failed_campaigns ?? 0;

  const maxActivityValue = Math.max(
    1,
    ...activity.map((item) =>
      analyticsMetric === "messages" ? item.messages : item.contacts,
    ),
  );

  const maxAudienceValue = Math.max(
    1,
    ...audienceGrowth.map((item) => item.contacts),
  );

  return (
    <div className="mx-auto w-full max-w-[1400px] px-5 pb-44 pt-8 sm:px-8 sm:pt-10 lg:px-12 lg:pb-48 lg:pt-12">
      {/* HEADER */}
      <section className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--detrosys-accent,#e4572e)]" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-neutral-400 dark:text-neutral-600">
              Workspace / Dashboard
            </p>
          </div>

          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.055em] text-neutral-950 sm:text-5xl lg:text-6xl dark:text-white">
            Good morning, {firstName}.
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-neutral-500 dark:text-neutral-400">
            Here's what's happening across your workspace.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {/* DATE RANGE */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setDateRangeOpen((current) => !current)}
              aria-expanded={dateRangeOpen}
              aria-haspopup="menu"
              className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white/60 px-3.5 py-2.5 text-xs font-semibold text-neutral-700 transition-all duration-200 hover:border-neutral-400 hover:bg-white dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-neutral-300 dark:hover:border-white/20 dark:hover:bg-[#1a1a1a]"
            >
              <span>{dateRange.label}</span>
              <ChevronDown
                size={14}
                className={[
                  "transition-transform duration-200",
                  dateRangeOpen ? "rotate-180" : "",
                ].join(" ")}
              />
            </button>

            {dateRangeOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full z-30 mt-2 min-w-[170px] overflow-hidden rounded-xl border border-neutral-200 bg-white p-1.5 shadow-[0_12px_35px_rgba(0,0,0,0.1)] dark:border-white/[0.08] dark:bg-[#151515] dark:shadow-[0_12px_35px_rgba(0,0,0,0.3)]"
              >
                {DATE_RANGES.map((range) => {
                  const active = range.label === dateRange.label;

                  return (
                    <button
                      key={range.label}
                      type="button"
                      role="menuitem"
                      onClick={() => handleDateRangeChange(range)}
                      className={[
                        "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors",
                        active
                          ? "bg-neutral-950 text-white dark:bg-white dark:text-neutral-950"
                          : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950 dark:text-neutral-400 dark:hover:bg-white/[0.05] dark:hover:text-white",
                      ].join(" ")}
                    >
                      <span>{range.label}</span>
                      {active && <CheckCircle2 size={13} strokeWidth={1.8} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* REFRESH */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            aria-label="Refresh dashboard"
            title={
              lastRefreshed
                ? `Last refreshed at ${lastRefreshed.toLocaleTimeString()}`
                : "Refresh dashboard"
            }
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white/60 text-neutral-500 transition-all duration-200 hover:border-neutral-400 hover:bg-white hover:text-neutral-950 disabled:cursor-wait disabled:opacity-60 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-neutral-500 dark:hover:border-white/20 dark:hover:bg-[#1a1a1a] dark:hover:text-white"
          >
            <RefreshCw
              size={15}
              className={refreshing ? "animate-spin" : ""}
            />
          </button>
        </div>
      </section>

      {/* ERROR */}
      {errorMessage && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          {errorMessage}
        </div>
      )}

      {/* PRIMARY METRICS */}
      <section className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-[22px] border border-neutral-200 bg-neutral-200 sm:grid-cols-2 lg:grid-cols-4 dark:border-white/[0.08] dark:bg-white/[0.08]">
        <DashboardMetric
          label="Contacts"
          value={loading ? "—" : formatNumber(metrics?.contacts ?? 0)}
          description={
            loading
              ? "Loading..."
              : metrics?.contacts
                ? "Total contacts"
                : "No contacts yet"
          }
          icon={Users}
        />

        <DashboardMetric
          label="Messages sent"
          value={loading ? "—" : formatNumber(metrics?.messages_sent ?? 0)}
          description={
            loading
              ? "Loading..."
              : metrics?.messages_sent
                ? `In ${dateRange.label.toLowerCase()}`
                : "No activity yet"
          }
          icon={Send}
        />

        <DashboardMetric
          label="Delivered"
          value={loading ? "—" : formatNumber(metrics?.delivered ?? 0)}
          description={
            loading
              ? "Loading..."
              : metrics?.delivered
                ? `In ${dateRange.label.toLowerCase()}`
                : "No delivery data yet"
          }
          icon={CheckCircle2}
        />

        <DashboardMetric
          label="Active campaigns"
          value={loading ? "—" : formatNumber(metrics?.active_campaigns ?? 0)}
          description={
            loading
              ? "Loading..."
              : metrics?.active_campaigns
                ? "Currently active"
                : "No campaigns yet"
          }
          icon={BarChart3}
        />
      </section>

      {/* MAIN ANALYTICS */}
      <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.75fr)]">
        {/* 1. ACTIVITY OVER TIME */}
        <div className="relative min-h-[410px] overflow-hidden rounded-[26px] border border-neutral-200 bg-white/70 p-6 sm:p-8 dark:border-white/[0.08] dark:bg-[#121212]">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.035] dark:opacity-[0.025]"
            aria-hidden="true"
            style={{
              backgroundImage:
                "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />

          <div className="relative z-10 flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-400 dark:text-neutral-600">
                Analytics
              </p>

              <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-neutral-950 dark:text-white">
                Activity over time
              </h2>
            </div>

            <div className="hidden items-center gap-2 sm:flex">
              <MetricToggle
                active={analyticsMetric === "messages"}
                label="Messages"
                onClick={() => setAnalyticsMetric("messages")}
              />

              <MetricToggle
                active={analyticsMetric === "contacts"}
                label="Contacts"
                onClick={() => setAnalyticsMetric("contacts")}
              />
            </div>
          </div>

          <div className={`relative z-10 mt-8 ${isRestrictedPlan ? "blur-md select-none pointer-events-none" : ""}`}>
            {loading ? (
              <DashboardEmptyState
                icon={BarChart3}
                title="Loading analytics"
                description="Fetching your real workspace activity."
              />
            ) : activity.length === 0 ? (
              <DashboardEmptyState
                icon={BarChart3}
                title={`No ${analyticsLabel} data yet`}
                description={`${analyticsLabel === "messages" ? "Message" : "Contact"} activity for ${dateRange.label.toLowerCase()} will appear here once your workspace has real data.`}
              />
            ) : (
              <div className="flex h-[240px] items-end gap-2 overflow-x-auto pb-2 pt-2">
                {activity.map((item) => {
                  const value =
                    analyticsMetric === "messages"
                      ? item.messages
                      : item.contacts;

                  const height =
                    value === 0
                      ? 4
                      : Math.max(8, (value / maxActivityValue) * 100);

                  return (
                    <div
                      key={`${item.index}-${item.label}`}
                      className="flex min-w-[36px] flex-1 flex-col items-center justify-end gap-1.5"
                    >
                      <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">
                        {value}
                      </span>

                      <div className="flex h-[150px] w-full items-end justify-center">
                        <div
                          className="w-full max-w-[34px] rounded-t-md bg-neutral-300 transition-all duration-300 dark:bg-white/[0.12]"
                          style={{
                            height: `${height}%`,
                          }}
                          title={`${item.label}: ${value} ${analyticsLabel}`}
                        />
                      </div>

                      <span className="whitespace-nowrap text-[9px] text-neutral-400 dark:text-neutral-600">
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* LOCK OVERLAY */}
          {isRestrictedPlan && (
            <FeatureLockOverlay
              title="Unlock Activity Analytics"
              description="Real-time campaign trends and activity charts are available on active plans."
              onUpgrade={() => navigate("/billing")}
            />
          )}
        </div>

        {/* COMMUNICATION SUMMARY */}
        <div className="rounded-[26px] border border-neutral-200 bg-white/70 p-6 sm:p-8 dark:border-white/[0.08] dark:bg-[#121212]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-400 dark:text-neutral-600">
            Communication
          </p>

          <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-neutral-950 dark:text-white">
            Delivery performance
          </h2>

          <div className="mt-8 space-y-5">
            <CommunicationRow
              icon={Mail}
              label="Email"
              sent={communication?.email.sent ?? 0}
              delivered={communication?.email.delivered ?? 0}
              rate={communication?.email.delivery_rate ?? null}
            />

            <CommunicationRow
              icon={MessageSquare}
              label="SMS"
              sent={communication?.sms.sent ?? 0}
              delivered={communication?.sms.delivered ?? 0}
              rate={communication?.sms.delivery_rate ?? null}
            />
          </div>

          <div className="mt-8 border-t border-neutral-200 pt-6 dark:border-white/[0.08]">
            <p className="text-xs leading-5 text-neutral-500 dark:text-neutral-500">
              Delivery performance is calculated from your actual campaign engagement data.
            </p>
          </div>
        </div>
      </section>

      {/* CAMPAIGNS + AUDIENCE */}
      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* CAMPAIGNS */}
        <div className="rounded-[26px] border border-neutral-200 bg-white/70 p-6 sm:p-8 dark:border-white/[0.08] dark:bg-[#121212]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-400 dark:text-neutral-600">
                Campaigns
              </p>

              <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-neutral-950 dark:text-white">
                Current campaigns
              </h2>
            </div>

            <button
              type="button"
              onClick={() => navigate("/app/campaigns")}
              className="group flex items-center gap-1.5 text-xs font-semibold text-neutral-500 transition-colors hover:text-neutral-950 dark:text-neutral-500 dark:hover:text-white"
            >
              View all
              <ArrowUpRight
                size={13}
                className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </button>
          </div>

          {loading ? (
            <div className="mt-8 rounded-2xl border border-dashed border-neutral-300 px-5 py-8 text-center dark:border-white/[0.12]">
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Loading campaigns...
              </p>
            </div>
          ) : currentCampaigns.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-neutral-300 px-5 py-8 text-center dark:border-white/[0.12]">
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                No campaigns yet
              </p>

              <p className="mx-auto mt-2 max-w-xs text-xs leading-5 text-neutral-400 dark:text-neutral-600">
                Your active and scheduled campaigns will appear here.
              </p>
            </div>
          ) : (
            <div className="mt-6 divide-y divide-neutral-200 dark:divide-white/[0.08]">
              {currentCampaigns.map((campaign) => (
                <button
                  key={campaign.id}
                  type="button"
                  onClick={() => navigate("/app/campaigns")}
                  className="flex w-full items-center justify-between gap-4 py-4 text-left transition-colors hover:bg-neutral-50 dark:hover:bg-white/[0.02]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-neutral-800 dark:text-neutral-200">
                      {campaign.name}
                    </p>

                    <p className="mt-1 text-[11px] text-neutral-400 dark:text-neutral-600">
                      {formatCampaignChannel(campaign.channel)}
                      {" · "}
                      {formatCampaignStatus(campaign.status)}
                    </p>
                  </div>

                  <ArrowUpRight
                    size={14}
                    className="shrink-0 text-neutral-400 dark:text-neutral-600"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 2. AUDIENCE GROWTH */}
        <div className="relative overflow-hidden rounded-[26px] border border-neutral-200 bg-white/70 p-6 sm:p-8 dark:border-white/[0.08] dark:bg-[#121212]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-400 dark:text-neutral-600">
                Audience
              </p>

              <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-neutral-950 dark:text-white">
                Audience growth
              </h2>
            </div>

            <Users
              size={18}
              strokeWidth={1.7}
              className="text-neutral-400 dark:text-neutral-600"
            />
          </div>

          <div className={`mt-8 ${isRestrictedPlan ? "blur-md select-none pointer-events-none" : ""}`}>
            <p className="text-4xl font-semibold tracking-[-0.05em] text-neutral-950 dark:text-white">
              {loading ? "—" : formatNumber(metrics?.contacts ?? 0)}
            </p>

            <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-600">
              {metrics?.contacts ? "Total contacts" : "No contacts yet"}
            </p>

            {loading ? (
              <div className="mt-7 flex h-24 items-center justify-center border-b border-neutral-200 dark:border-white/[0.08]">
                <span className="text-xs text-neutral-400">Loading...</span>
              </div>
            ) : audienceGrowth.length === 0 ? (
              <div className="mt-7 flex h-24 items-center justify-center border-b border-neutral-200 dark:border-white/[0.08]">
                <span className="text-xs text-neutral-400 dark:text-neutral-600">
                  No audience growth data yet
                </span>
              </div>
            ) : (
              <div className="mt-7 flex h-24 items-end gap-1.5 border-b border-neutral-200 dark:border-white/[0.08]">
                {audienceGrowth.map((item) => {
                  const height = Math.max(
                    3,
                    (item.contacts / maxAudienceValue) * 100,
                  );

                  return (
                    <div
                      key={`${item.index}-${item.label}`}
                      className="group relative flex h-full flex-1 items-end"
                    >
                      <div
                        className="w-full rounded-t-md bg-neutral-300/80 transition-all duration-300 dark:bg-white/[0.08]"
                        style={{
                          height: `${height}%`,
                        }}
                        title={`${item.label}: ${item.contacts} contacts`}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            <p className="mt-4 text-xs leading-5 text-neutral-400 dark:text-neutral-600">
              Audience growth is calculated from your actual contact activity.
            </p>
          </div>

          {/* LOCK OVERLAY */}
          {isRestrictedPlan && (
            <FeatureLockOverlay
              title="Unlock Audience Growth"
              description="Subscriber acquisition pacing and growth velocity are unlocked on active plans."
              onUpgrade={() => navigate("/billing")}
            />
          )}
        </div>
      </section>

      {/* ATTENTION + ACTIVITY */}
      <section className="mt-6 grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
        {/* ATTENTION */}
        <div className="rounded-[26px] border border-neutral-200 bg-white/70 p-6 sm:p-8 dark:border-white/[0.08] dark:bg-[#121212]">
          <div className="flex items-center gap-2">
            <CircleAlert
              size={15}
              strokeWidth={1.8}
              className="text-neutral-400 dark:text-neutral-600"
            />

            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-400 dark:text-neutral-600">
              Attention
            </p>
          </div>

          <div className="mt-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-100 dark:border-white/[0.08] dark:bg-[#181818]">
              {failedCampaigns > 0 ? (
                <CircleAlert
                  size={19}
                  strokeWidth={1.7}
                  className="text-neutral-500 dark:text-neutral-500"
                />
              ) : (
                <CheckCircle2
                  size={19}
                  strokeWidth={1.7}
                  className="text-neutral-500 dark:text-neutral-500"
                />
              )}
            </div>

            <h2 className="mt-5 text-lg font-semibold tracking-[-0.025em] text-neutral-950 dark:text-white">
              {failedCampaigns > 0
                ? `${failedCampaigns} campaign${failedCampaigns === 1 ? "" : "s"} need attention`
                : "You're all caught up."}
            </h2>

            <p className="mt-2 max-w-sm text-xs leading-5 text-neutral-500 dark:text-neutral-500">
              {failedCampaigns > 0
                ? "One or more campaigns have failed and may require review."
                : "Important warnings and actions will appear here when something genuinely requires your attention."}
            </p>

            {failedCampaigns > 0 && (
              <button
                type="button"
                onClick={() => navigate("/app/campaigns")}
                className="mt-5 text-xs font-semibold text-neutral-700 underline underline-offset-4 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white"
              >
                Review campaigns
              </button>
            )}
          </div>
        </div>

        {/* 3. RECENT ACTIVITY */}
        <div className="relative overflow-hidden rounded-[26px] border border-neutral-200 bg-white/70 p-6 sm:p-8 dark:border-white/[0.08] dark:bg-[#121212]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-400 dark:text-neutral-600">
            Recent activity
          </p>

          <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-neutral-950 dark:text-white">
            Workspace activity
          </h2>

          <div className={`mt-6 ${isRestrictedPlan ? "blur-md select-none pointer-events-none" : ""}`}>
            {loading ? (
              <div className="rounded-2xl border border-dashed border-neutral-300 px-5 py-8 text-center dark:border-white/[0.12]">
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Loading activity...
                </p>
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-300 px-5 py-8 text-center dark:border-white/[0.12]">
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Nothing has happened yet
                </p>

                <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-neutral-400 dark:text-neutral-600">
                  Campaign launches, contact additions, edits and other real workspace events will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-200 dark:divide-white/[0.08]">
                {recentActivity.map((item, index) => (
                  <div
                    key={`${item.type}-${item.name}-${item.timestamp}-${index}`}
                    className="flex items-center justify-between gap-4 py-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-500 dark:bg-[#181818] dark:text-neutral-500">
                        {item.type === "campaign" ? (
                          <Send size={14} strokeWidth={1.8} />
                        ) : (
                          <Users size={14} strokeWidth={1.8} />
                        )}
                      </span>

                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-neutral-700 dark:text-neutral-300">
                          {item.label}
                        </p>

                        <p className="mt-0.5 truncate text-[11px] text-neutral-400 dark:text-neutral-600">
                          {item.name}
                        </p>
                      </div>
                    </div>

                    <span className="shrink-0 text-[10px] text-neutral-400 dark:text-neutral-600">
                      {formatTimestamp(item.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* LOCK OVERLAY */}
          {isRestrictedPlan && (
            <FeatureLockOverlay
              title="Unlock Workspace Audit Activity"
              description="Live dispatch tracking and subscriber action logs require an active plan."
              onUpgrade={() => navigate("/billing")}
            />
          )}
        </div>
      </section>

      {/* QUICK ACTIONS */}
      <section className="mt-6 rounded-[26px] border border-neutral-200 bg-white/70 p-6 sm:p-8 dark:border-white/[0.08] dark:bg-[#121212]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-400 dark:text-neutral-600">
              Quick actions
            </p>

            <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-neutral-950 dark:text-white">
              Create something
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <QuickAction
              label="Campaign"
              icon={Plus}
              onClick={() => navigate("/app/campaigns")}
            />

            <QuickAction
              label="Audience"
              icon={Plus}
              onClick={() => navigate("/app/audiences")}
            />

            <QuickAction
              label="Template"
              icon={Plus}
              onClick={() => navigate("/app/templates")}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureLockOverlay({
  title,
  description,
  onUpgrade,
}: {
  title: string;
  description: string;
  onUpgrade: () => void;
}) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/60 p-6 text-center backdrop-blur-xs dark:bg-[#111111]/70">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-950 text-white shadow-md dark:bg-white dark:text-neutral-950">
        <Lock size={17} strokeWidth={2.2} />
      </div>

      <h3 className="mt-3 text-sm font-semibold tracking-tight text-neutral-950 dark:text-white">
        {title}
      </h3>

      <p className="mt-1.5 max-w-xs text-[11px] leading-4 text-neutral-500 dark:text-neutral-400">
        {description}
      </p>

      <button
        type="button"
        onClick={onUpgrade}
        className="mt-4 rounded-xl bg-neutral-950 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-neutral-800 dark:bg-white dark:text-neutral-950"
      >
        Upgrade Plan
      </button>
    </div>
  );
}

type DashboardMetricProps = {
  label: string;
  value: string;
  description: string;
  icon: typeof Users;
};

function DashboardMetric({
  label,
  value,
  description,
  icon: Icon,
}: DashboardMetricProps) {
  return (
    <div className="bg-white/70 p-5 transition-colors duration-200 hover:bg-white dark:bg-[#121212] dark:hover:bg-[#151515] sm:p-6">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-600">
          {label}
        </p>

        <Icon
          size={15}
          strokeWidth={1.7}
          className="text-neutral-400 dark:text-neutral-600"
        />
      </div>

      <p className="mt-7 text-3xl font-semibold tracking-[-0.05em] text-neutral-950 dark:text-white">
        {value}
      </p>

      <p className="mt-1.5 text-xs text-neutral-400 dark:text-neutral-600">
        {description}
      </p>
    </div>
  );
}

type MetricToggleProps = {
  label: string;
  active?: boolean;
  onClick: () => void;
};

function MetricToggle({
  label,
  active = false,
  onClick,
}: MetricToggleProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors duration-150",
        active
          ? "bg-neutral-950 text-white dark:bg-white dark:text-neutral-950"
          : "text-neutral-400 hover:text-neutral-950 dark:text-neutral-600 dark:hover:text-white",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

type CommunicationRowProps = {
  icon: typeof Mail;
  label: string;
  sent: number;
  delivered: number;
  rate: number | null;
};

function CommunicationRow({
  icon: Icon,
  label,
  sent,
  delivered,
  rate,
}: CommunicationRowProps) {
  return (
    <div className="flex items-center justify-between border-b border-neutral-200 pb-5 last:border-0 last:pb-0 dark:border-white/[0.08]">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 text-neutral-500 dark:bg-[#181818] dark:text-neutral-500">
          <Icon size={15} strokeWidth={1.8} />
        </span>

        <div>
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {label}
          </span>

          <p className="mt-0.5 text-[10px] text-neutral-400 dark:text-neutral-600">
            {sent > 0
              ? `${formatNumber(delivered)} of ${formatNumber(sent)} delivered`
              : "No data"}
          </p>
        </div>
      </div>

      <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
        {rate === null ? "—" : `${rate}%`}
      </span>
    </div>
  );
}

type DashboardEmptyStateProps = {
  icon: typeof BarChart3;
  title: string;
  description: string;
};

function DashboardEmptyState({
  icon: Icon,
  title,
  description,
}: DashboardEmptyStateProps) {
  return (
    <div className="flex min-h-[245px] items-center justify-center">
      <div className="max-w-sm text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-100 text-neutral-400 dark:border-white/[0.08] dark:bg-[#181818] dark:text-neutral-600">
          <Icon size={20} strokeWidth={1.7} />
        </div>

        <h3 className="mt-5 text-sm font-semibold text-neutral-950 dark:text-white">
          {title}
        </h3>

        <p className="mt-2 text-xs leading-5 text-neutral-500 dark:text-neutral-500">
          {description}
        </p>
      </div>
    </div>
  );
}

type QuickActionProps = {
  label: string;
  icon: typeof Plus;
  onClick: () => void;
};

function QuickAction({
  label,
  icon: Icon,
  onClick,
}: QuickActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white/60 px-4 py-3 text-xs font-semibold text-neutral-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-neutral-400 hover:bg-white hover:text-neutral-950 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-neutral-300 dark:hover:border-white/20 dark:hover:bg-[#181818] dark:hover:text-white"
    >
      <Icon
        size={14}
        strokeWidth={1.8}
        className="transition-transform duration-200 group-hover:scale-110"
      />
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}