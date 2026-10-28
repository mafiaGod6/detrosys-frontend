import {
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import {
  Archive,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronDown,
  CircleAlert,
  Clock3,
  Edit3,
  Lock,
  Mail,
  MessageSquare,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Search,
  Send,
  Trash2,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router";

export type CampaignStatus =
  | "draft"
  | "scheduled"
  | "active"
  | "inactive"
  | "completed"
  | "cancelled"
  | "failed";

export type CampaignChannel =
  | "email"
  | "sms"
  | "email_sms";

export type Campaign = {
  id: string;
  name: string;
  channel: CampaignChannel;
  status: CampaignStatus;
  audienceId: string | null;
  audienceName: string;
  audienceSize: number | null;
  createdAt: string;
  updatedAt: string;
  scheduledAt: string | null;
  sent: number | null;
  delivered: number | null;
  failed: number | null;
};

export type Audience = {
  id: string;
  name: string;
  is_default: boolean;
  rule: string;
  size: number;
};

export type AutomationSummary = {
  id: string;
  name: string;
};

export type CampaignsPageProps = {
  onCreateCampaign?: () => void;
  onModalChange?: (open: boolean) => void;
};

export type CampaignDraft = {
  name: string;
  channel: CampaignChannel;
  audienceId: string;
  timing: "now" | "schedule";
  scheduledAt: string;
};

export type ActionButtonProps = {
  label: string;
  icon: LucideIcon;
  destructive?: boolean;
  disabled?: boolean;
  onClick?: () => void;
};

export type ApiError = Error & {
  status?: number;
};

export type LifecycleProps = {
  status: CampaignStatus;
  scheduledAt: string | null;
};

const ACCESS_TOKEN_KEY = "detrosys_access_token";

const STATUS_ORDER: CampaignStatus[] = [
  "active",
  "scheduled",
  "draft",
  "inactive",
  "completed",
  "cancelled",
  "failed",
];

const STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  active: "Active",
  inactive: "Inactive",
  completed: "Completed",
  cancelled: "Cancelled",
  failed: "Failed",
};

const STATUS_DESCRIPTIONS: Record<CampaignStatus, string> = {
  draft: "Not scheduled or running yet",
  scheduled: "Waiting for its scheduled send time",
  active: "Currently running",
  inactive: "Stopped but still available",
  completed: "Finished successfully",
  cancelled: "Cancelled before completion",
  failed: "Execution failed",
};

const CHANNEL_LABELS: Record<CampaignChannel, string> = {
  email: "Email",
  sms: "SMS",
  email_sms: "Email + SMS",
};

const lifecycleSteps: {
  id: CampaignStatus;
  label: string;
}[] = [
  { id: "draft", label: "Draft" },
  { id: "scheduled", label: "Scheduled" },
  { id: "active", label: "Active" },
  { id: "completed", label: "Completed" },
];

function extractSafePlan(raw: unknown): string {
  if (!raw) return "free";
  if (typeof raw === "string") {
    const val = raw.toLowerCase().trim();
    if (val.includes("adv")) return "advanced";
    if (val.includes("pro")) return "pro";
    if (val.includes("basic")) return "basic";
    if (val === "none") return "none";
    return "free";
  }
  if (typeof raw === "object" && raw !== null) {
    const obj = raw as Record<string, unknown>;
    return extractSafePlan(obj.slug || obj.name || obj.plan);
  }
  return "free";
}

function parseErrorDetail(payload: any, fallback: string): string {
  if (!payload) return fallback;
  if (typeof payload.detail === "string") {
    return payload.detail;
  }
  if (Array.isArray(payload.detail)) {
    return payload.detail
      .map((item: any) => {
        const field = Array.isArray(item?.loc)
          ? item.loc[item.loc.length - 1]
          : "";
        const msg = item?.msg || JSON.stringify(item);
        return field ? `${field}: ${msg}` : msg;
      })
      .join(", ");
  }
  if (typeof payload.message === "string") {
    return payload.message;
  }
  return fallback;
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  if (options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const rawBase = (
    import.meta.env.VITE_API_BASE_URL ??
    import.meta.env.VITE_API_URL ??
    "http://localhost:8000"
  ).replace(/\/$/, "");

  const serverRoot = rawBase.replace(/\/api(\/v\d+)?$/, "");
  const cleanPath = path.replace(/^\//, "");

  const candidateUrls = [
    `${serverRoot}/api/v1/${cleanPath}`,
    `${serverRoot}/api/v1/${cleanPath}/`,
    `${serverRoot}/${cleanPath}`,
    `${serverRoot}/${cleanPath}/`,
    `${serverRoot}/api/${cleanPath}`,
    `${serverRoot}/api/${cleanPath}/`,
  ];

  const uniqueUrls = Array.from(new Set(candidateUrls));
  let lastError: Error | null = null;

  for (let i = 0; i < uniqueUrls.length; i++) {
    const targetUrl = uniqueUrls[i];
    try {
      const response = await fetch(targetUrl, {
        ...options,
        headers,
      });

      if (response.status === 404 && i < uniqueUrls.length - 1) {
        continue;
      }

      if (!response.ok) {
        let detail = `Request failed with status ${response.status}.`;
        try {
          const payload = await response.json();
          detail = parseErrorDetail(payload, detail);
        } catch {}

        const error = new Error(detail) as ApiError;
        error.status = response.status;
        throw error;
      }

      if (response.status === 204) {
        return undefined as T;
      }

      return (await response.json()) as T;
    } catch (err) {
      lastError = err as Error;
      if ((err as any)?.status && (err as any).status !== 404) {
        throw err;
      }
      if (
        options.method &&
        options.method.toUpperCase() !== "GET" &&
        !(err as any)?.status
      ) {
        throw err;
      }
    }
  }

  throw lastError || new Error(`Failed to reach endpoint for ${path}.`);
}

function normalizeCampaignStatus(value: string): CampaignStatus {
  if (
    value === "draft" ||
    value === "scheduled" ||
    value === "active" ||
    value === "inactive" ||
    value === "completed" ||
    value === "cancelled" ||
    value === "failed"
  ) {
    return value;
  }
  return "draft";
}

function normalizeCampaignChannel(value: string): CampaignChannel {
  if (value === "email" || value === "sms" || value === "email_sms") {
    return value;
  }
  return "email";
}

function createCampaignFromApi(
  item: {
    id: string;
    name: string;
    channel: string;
    status: string;
    audience_id?: string | null;
    scheduled_at?: string | null;
    created_at?: string;
    updated_at?: string;
    sent?: number | null;
    delivered?: number | null;
    failed?: number | null;
  },
  audiences: Audience[],
  fallbackCreatedAt?: string,
): Campaign {
  const audience = item.audience_id
    ? audiences.find((candidate) => candidate.id === item.audience_id)
    : undefined;

  const fallback = fallbackCreatedAt ?? new Date().toISOString();

  return {
    id: item.id,
    name: item.name,
    channel: normalizeCampaignChannel(item.channel),
    status: normalizeCampaignStatus(item.status),
    audienceId: item.audience_id ?? null,
    audienceName: audience?.name ?? "Unknown audience",
    audienceSize: audience?.size ?? null,
    createdAt: item.created_at ?? fallback,
    updatedAt: item.updated_at ?? item.created_at ?? fallback,
    scheduledAt: item.scheduled_at ?? null,
    sent: typeof item.sent === "number" ? item.sent : null,
    delivered: typeof item.delivered === "number" ? item.delivered : null,
    failed: typeof item.failed === "number" ? item.failed : null,
  };
}

export function CampaignsPage({
  onCreateCampaign,
  onModalChange,
}: CampaignsPageProps) {
  const navigate = useNavigate();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [planLimits, setPlanLimits] = useState<{
    used: number;
    max: number;
    plan_slug: string;
  }>(() => {
    const saved = extractSafePlan(localStorage.getItem("detrosys_plan"));
    let max = 10;
    if (saved === "none") max = 0;
    else if (saved === "free") max = 3;
    else if (saved === "basic") max = 10;
    else if (saved === "pro") max = 25;
    else if (saved === "advanced") max = 75;
    return {
      used: 0,
      max,
      plan_slug: saved,
    };
  });

  const [automationByCampaign, setAutomationByCampaign] = useState<
    Record<string, AutomationSummary | null>
  >({});
  const [automationLoadingCampaignId, setAutomationLoadingCampaignId] = useState<
    string | null
  >(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | "all">("all");
  const [channelFilter, setChannelFilter] = useState<CampaignChannel | "all">("all");
  const [sortBy, setSortBy] = useState<"updated" | "created" | "scheduled" | "name">("updated");
  const [expandedCampaignId, setExpandedCampaignId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);

  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);
  const [isDeletingCampaign, setIsDeletingCampaign] = useState(false);

  useEffect(() => {
    onModalChange?.(modalMode !== null || campaignToDelete !== null);
  }, [modalMode, campaignToDelete, onModalChange]);

  const editingCampaign = useMemo(
    () =>
      campaigns.find((campaign) => campaign.id === editingCampaignId) ?? null,
    [campaigns, editingCampaignId],
  );

  const loadWorkflowQuota = async () => {
    try {
      let resolvedPlan = extractSafePlan(localStorage.getItem("detrosys_plan"));
      let serverUsed = 0;
      let serverLimit = 10;

      try {
        const statusRes = await apiRequest<{
          plan?: unknown;
          workflows_used?: number;
          workflows_used_in_cycle?: number;
          workflows_limit?: number;
        }>("/billing/status");
        if (statusRes?.plan) {
          resolvedPlan = extractSafePlan(statusRes.plan);
        }
        if (typeof statusRes?.workflows_used_in_cycle === "number") {
          serverUsed = statusRes.workflows_used_in_cycle;
        } else if (typeof statusRes?.workflows_used === "number") {
          serverUsed = statusRes.workflows_used;
        }
        if (typeof statusRes?.workflows_limit === "number") {
          serverLimit = statusRes.workflows_limit;
        }
      } catch {}

      localStorage.setItem("detrosys_plan", resolvedPlan);

      let maxWorkflows = serverLimit;
      if (resolvedPlan === "none") maxWorkflows = 0;
      else if (resolvedPlan === "free" && serverLimit === 10) maxWorkflows = 3;

      setPlanLimits({
        used: serverUsed,
        max: maxWorkflows,
        plan_slug: resolvedPlan,
      });
    } catch {}
  };

  const loadCampaigns = async (silent = false) => {
    if (!silent) setLoading(true);

    try {
      const [campaignResponse, audienceResponse] = await Promise.all([
        apiRequest<
          Array<{
            id: string;
            name: string;
            channel: string;
            status: string;
            audience_id?: string | null;
            scheduled_at?: string | null;
            created_at?: string;
            updated_at?: string;
            sent?: number | null;
            delivered?: number | null;
            failed?: number | null;
          }>
        >("/campaigns"),
        apiRequest<Audience[]>("/audiences"),
      ]);

      setAudiences(audienceResponse);
      const loadedCampaigns = campaignResponse.map((item) =>
        createCampaignFromApi(item, audienceResponse),
      );
      setCampaigns(loadedCampaigns);
      void loadWorkflowQuota();
    } catch (error) {
      const apiError = error as ApiError;
      setErrorMessage(apiError.message || "Unable to load campaigns.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    void loadCampaigns();
  }, []);

  const hasLiveCampaigns = useMemo(
    () =>
      campaigns.some(
        (campaign) =>
          campaign.status === "scheduled" || campaign.status === "active",
      ),
    [campaigns],
  );

  useEffect(() => {
    if (!hasLiveCampaigns) return;
    const intervalId = window.setInterval(() => {
      void loadCampaigns(true);
    }, 5000);
    return () => window.clearInterval(intervalId);
  }, [hasLiveCampaigns]);

  const isAtWorkflowLimit =
    planLimits.plan_slug === "none" ||
    (planLimits.max > 0 && planLimits.used >= planLimits.max);

  const openCreateModal = () => {
    if (planLimits.plan_slug === "none" || isAtWorkflowLimit) {
      setErrorMessage("Workflow limit reached for this billing cycle. Deleting campaigns does not free up slots.");
      return;
    }
    setEditingCampaignId(null);
    setModalMode("create");
    setErrorMessage(null);
    onCreateCampaign?.();
  };

  const openEditModal = (campaign: Campaign) => {
    setEditingCampaignId(campaign.id);
    setModalMode("edit");
    setErrorMessage(null);
  };

  const closeCampaignModal = () => {
    if (saving) return;
    setModalMode(null);
    setEditingCampaignId(null);
  };

  const filteredCampaigns = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = campaigns.filter((campaign) => {
      const matchesSearch =
        query.length === 0 ||
        campaign.name.toLowerCase().includes(query) ||
        campaign.audienceName.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" || campaign.status === statusFilter;

      const matchesChannel =
        channelFilter === "all" || campaign.channel === channelFilter;

      return matchesSearch && matchesStatus && matchesChannel;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "created") {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      if (sortBy === "scheduled") {
        const aTime = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
        const bTime = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
        return bTime - aTime;
      }
      return (
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    });
  }, [campaigns, searchQuery, statusFilter, channelFilter, sortBy]);

  const groupedCampaigns = useMemo(() => {
    return STATUS_ORDER.map((status) => ({
      status,
      campaigns: filteredCampaigns.filter(
        (campaign) => campaign.status === status,
      ),
    })).filter((group) => group.campaigns.length > 0);
  }, [filteredCampaigns]);

  const handleCreateCampaign = async (draft: CampaignDraft) => {
    if (isAtWorkflowLimit) {
      setErrorMessage("Lifetime workflow limit reached for this billing cycle. Deleting campaigns does not free up slots.");
      return;
    }

    setSaving(true);
    setErrorMessage(null);

    // 1. OPTIMISTIC UPDATE: Increment instantly for a snappy UI
    setPlanLimits((prev) => ({ ...prev, used: prev.used + 1 }));

    try {
      const response = await apiRequest<{
        id: string;
        name: string;
        channel: string;
        status: string;
        audience_id?: string | null;
        scheduled_at?: string | null;
        created_at?: string;
        updated_at?: string;
        sent?: number | null;
        delivered?: number | null;
        failed?: number | null;
      }>("/campaigns", {
        method: "POST",
        body: JSON.stringify({
          name: draft.name.trim(),
          channel: draft.channel,
          status: draft.timing === "schedule" ? "scheduled" : "draft",
          audience_id: draft.audienceId,
          scheduled_at:
            draft.timing === "schedule"
              ? new Date(draft.scheduledAt).toISOString()
              : null,
        }),
      });

      const campaign = createCampaignFromApi(response, audiences);
      setCampaigns((current) => [campaign, ...current]);
      setExpandedCampaignId(campaign.id);
      closeCampaignModal();
      
      // 2. BACKGROUND SYNC: Ping the backend so it permanently records the +1 in the database
      await loadWorkflowQuota();
      
    } catch (error) {
      // 3. REFUND: If the API fails, instantly give the usage slot back!
      setPlanLimits((prev) => ({ ...prev, used: Math.max(0, prev.used - 1) }));
      
      const apiError = error as ApiError;
      setErrorMessage(apiError.message || "Unable to create campaign.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCampaign = async (
    campaignId: string,
    draft: CampaignDraft,
  ) => {
    const existing = campaigns.find((campaign) => campaign.id === campaignId);
    setSaving(true);
    setErrorMessage(null);

    let nextStatus: CampaignStatus = existing?.status ?? "draft";
    if (draft.timing === "schedule") {
      nextStatus = "scheduled";
    } else if (existing?.status === "scheduled") {
      nextStatus = "draft";
    }

    try {
      const response = await apiRequest<{
        id: string;
        name: string;
        channel: string;
        status: string;
        audience_id?: string | null;
        scheduled_at?: string | null;
        created_at?: string;
        updated_at?: string;
        sent?: number | null;
        delivered?: number | null;
        failed?: number | null;
      }>(`/campaigns/${campaignId}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: draft.name.trim(),
          channel: draft.channel,
          status: nextStatus,
          audience_id: draft.audienceId,
          scheduled_at:
            draft.timing === "schedule"
              ? new Date(draft.scheduledAt).toISOString()
              : null,
        }),
      });

      const updated = createCampaignFromApi(
        response,
        audiences,
        existing?.createdAt,
      );

      setCampaigns((current) =>
        current.map((campaign) =>
          campaign.id === campaignId
            ? {
                ...updated,
                sent: updated.sent ?? campaign.sent,
                delivered: updated.delivered ?? campaign.delivered,
                failed: updated.failed ?? campaign.failed,
              }
            : campaign,
        ),
      );

      closeCampaignModal();
    } catch (error) {
      const apiError = error as ApiError;
      setErrorMessage(apiError.message || "Unable to update campaign.");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (
    campaignId: string,
    status: CampaignStatus,
  ) => {
    const existing = campaigns.find((campaign) => campaign.id === campaignId);
    if (!existing) return;

    setErrorMessage(null);

    try {
      const response = await apiRequest<{
        id: string;
        name: string;
        channel: string;
        status: string;
        audience_id?: string | null;
        scheduled_at?: string | null;
        created_at?: string;
        updated_at?: string;
        sent?: number | null;
        delivered?: number | null;
        failed?: number | null;
      }>(`/campaigns/${campaignId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });

      const updated = createCampaignFromApi(
        response,
        audiences,
        existing.createdAt,
      );

      setCampaigns((current) =>
        current.map((campaign) =>
          campaign.id === campaignId
            ? {
                ...updated,
                sent: updated.sent ?? campaign.sent,
                delivered: updated.delivered ?? campaign.delivered,
                failed: updated.failed ?? campaign.failed,
              }
            : campaign,
        ),
      );
    } catch (error) {
      const apiError = error as ApiError;
      const errMsg = apiError.message || "Unable to update campaign status.";
      await loadCampaigns();
      setErrorMessage(errMsg);
    }
  };

  const confirmDeleteCampaign = async () => {
    if (!campaignToDelete) return;

    setIsDeletingCampaign(true);
    setErrorMessage(null);

    try {
      await apiRequest<void>(`/campaigns/${campaignToDelete.id}`, { method: "DELETE" });

      setCampaigns((current) =>
        current.filter((item) => item.id !== campaignToDelete.id),
      );

      // Note: Deleting does NOT decrement planLimits.used, enforcing the strict lifetime lock.

      setAutomationByCampaign((current) => {
        const next = { ...current };
        delete next[campaignToDelete.id];
        return next;
      });

      if (expandedCampaignId === campaignToDelete.id) {
        setExpandedCampaignId(null);
      }

      setCampaignToDelete(null);
    } catch (error) {
      const apiError = error as ApiError;
      setErrorMessage(
        apiError.message || `Unable to delete "${campaignToDelete.name}".`,
      );
    } finally {
      setIsDeletingCampaign(false);
    }
  };

  const loadCampaignAutomation = async (campaignId: string) => {
    const hasLoaded = Object.prototype.hasOwnProperty.call(
      automationByCampaign,
      campaignId,
    );

    if (hasLoaded) return;

    setAutomationLoadingCampaignId(campaignId);

    try {
      const automation = await apiRequest<{ id: string; name?: string }>(
        `/automations/campaign/${campaignId}`,
      );

      setAutomationByCampaign((current) => ({
        ...current,
        [campaignId]: {
          id: automation.id,
          name: automation.name ?? "Campaign automation",
        },
      }));
    } catch {
      setAutomationByCampaign((current) => ({
        ...current,
        [campaignId]: null,
      }));
    } finally {
      setAutomationLoadingCampaignId(null);
    }
  };

  const handleExpandCampaign = async (campaignId: string) => {
    const nextExpanded = expandedCampaignId === campaignId ? null : campaignId;

    setExpandedCampaignId(nextExpanded);

    if (nextExpanded) {
      await loadCampaignAutomation(nextExpanded);
    }
  };

  const isFreeOrNone =
    planLimits.plan_slug === "free" || planLimits.plan_slug === "none";

  return (
    <>
      <div className="mx-auto w-full max-w-[1400px] px-5 pb-44 pt-8 sm:px-8 sm:pt-10 lg:px-12 lg:pb-48 lg:pt-12">
        {/* HEADER */}
        <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--detrosys-accent,#e4572e)]" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-neutral-400 dark:text-neutral-600">
                Workspace / Campaigns
              </p>
            </div>

            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.055em] text-neutral-950 sm:text-5xl lg:text-6xl dark:text-white">
              Campaigns
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-6 text-neutral-500 dark:text-neutral-400">
              Define what you want to send, who receives it, and when it should
              happen. Execution and content are handled through automations.
            </p>
          </div>

          <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
            <span className="flex items-center justify-center rounded-xl border border-neutral-200 bg-white/60 px-3.5 py-2.5 text-xs font-semibold text-neutral-600 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-neutral-400">
              {planLimits.used} / {planLimits.max} workflows used (Lifetime)
            </span>

            {planLimits.plan_slug === "none" ? (
              <div className="flex w-full flex-col items-stretch gap-1 sm:w-auto sm:items-end">
                <button
                  type="button"
                  onClick={() => navigate("/billing")}
                  className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-neutral-300/70 px-5 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-300 dark:bg-neutral-800/80 dark:text-neutral-300 dark:hover:bg-neutral-800 sm:w-auto"
                >
                  <Lock size={14} />
                  <span>Campaigns Locked on No Plan</span>
                </button>
              </div>
            ) : isAtWorkflowLimit ? (
              <div className="flex w-full flex-col items-stretch gap-1 sm:w-auto sm:items-end">
                <button
                  type="button"
                  onClick={() => navigate("/billing")}
                  className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-neutral-300/70 px-5 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-300 dark:bg-neutral-800/80 dark:text-neutral-300 dark:hover:bg-neutral-800 sm:w-auto"
                >
                  <Lock size={14} />
                  <span>Workflow Limit Reached ({planLimits.used}/{planLimits.max})</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={openCreateModal}
                className="group flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 px-4 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:bg-white dark:text-neutral-950 sm:w-auto"
              >
                <Plus
                  size={16}
                  strokeWidth={2.2}
                  className="transition-transform duration-200 group-hover:rotate-90"
                />
                <span>Create campaign</span>
              </button>
            )}
          </div>
        </header>

        {/* CONTROLS */}
        <div className="mt-10 flex flex-col gap-3 xl:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-600"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search campaigns or audiences..."
              className="h-12 w-full rounded-xl border border-neutral-200 bg-white/60 pl-11 pr-4 text-sm text-neutral-950 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-400 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white dark:placeholder:text-neutral-600 dark:focus:border-white/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:flex">
            <FilterSelect
              value={statusFilter}
              onChange={(value) =>
                setStatusFilter(value as CampaignStatus | "all")
              }
              options={[
                { value: "all", label: "All statuses" },
                ...STATUS_ORDER.map((status) => ({
                  value: status,
                  label: STATUS_LABELS[status],
                })),
              ]}
            />

            <FilterSelect
              value={channelFilter}
              onChange={(value) =>
                setChannelFilter(value as CampaignChannel | "all")
              }
              options={[
                { value: "all", label: "All channels" },
                { value: "email", label: "Email" },
                { value: "sms", label: "SMS" },
                { value: "email_sms", label: "Email + SMS" },
              ]}
            />

            <FilterSelect
              value={sortBy}
              onChange={(value) =>
                setSortBy(value as "updated" | "created" | "scheduled" | "name")
              }
              options={[
                { value: "updated", label: "Recently updated" },
                { value: "created", label: "Recently created" },
                { value: "scheduled", label: "Scheduled first" },
                { value: "name", label: "Name" },
              ]}
            />
          </div>
        </div>

        {errorMessage && (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-500/20 dark:bg-red-500/[0.06]">
            <CircleAlert
              size={16}
              className="mt-0.5 shrink-0 text-red-500 dark:text-red-400"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-red-700 dark:text-red-300">
                Campaign request failed
              </p>
              <p className="mt-1 text-xs leading-5 text-red-600 dark:text-red-400">
                {errorMessage}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="shrink-0 text-red-400 transition-colors hover:text-red-700 dark:text-red-500 dark:hover:text-red-300"
              aria-label="Dismiss error"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* CONTENT */}
        {loading && campaigns.length === 0 ? (
          <LoadingCampaignState />
        ) : campaigns.length === 0 ? (
          <EmptyCampaignState onCreate={openCreateModal} />
        ) : filteredCampaigns.length === 0 ? (
          <NoResultsState
            onClear={() => {
              setSearchQuery("");
              setStatusFilter("all");
              setChannelFilter("all");
            }}
          />
        ) : (
          <div className="mt-10 space-y-10">
            {groupedCampaigns.map((group) => (
              <section key={group.status}>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500 dark:text-neutral-500">
                      {STATUS_LABELS[group.status]}
                    </h2>
                    <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-600">
                      {STATUS_DESCRIPTIONS[group.status]}
                    </p>
                  </div>
                  <span className="text-xs tabular-nums text-neutral-400 dark:text-neutral-600">
                    {group.campaigns.length}
                  </span>
                </div>

                <div className="max-h-[420px] overflow-y-auto overscroll-contain rounded-2xl border border-neutral-200 bg-white/70 shadow-xs dark:border-white/[0.08] dark:bg-[#121212]">
                  {group.campaigns.map((campaign, index) => (
                    <CampaignAccordion
                      key={campaign.id}
                      campaign={campaign}
                      isFreePlan={isFreeOrNone}
                      expanded={expandedCampaignId === campaign.id}
                      isLast={index === group.campaigns.length - 1}
                      automation={
                        Object.prototype.hasOwnProperty.call(
                          automationByCampaign,
                          campaign.id,
                        )
                          ? automationByCampaign[campaign.id]
                          : undefined
                      }
                      automationLoading={automationLoadingCampaignId === campaign.id}
                      onToggle={() => void handleExpandCampaign(campaign.id)}
                      onStatusChange={handleStatusChange}
                      onEdit={openEditModal}
                      onDelete={(item) => setCampaignToDelete(item)}
                      onArchive={() =>
                        setErrorMessage("Archiving is not exposed by the current Campaign API.")
                      }
                      onViewAutomation={(automationId) => {
                        navigate(`/app/automations/${automationId}`);
                      }}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {loading && campaigns.length > 0 && (
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-neutral-400 dark:text-neutral-600">
            <RefreshCw size={13} className="animate-spin" />
            Refreshing campaigns...
          </div>
        )}
      </div>

      {modalMode && (
        <CreateCampaignModal
          mode={modalMode}
          initialCampaign={editingCampaign}
          audiences={audiences}
          saving={saving}
          isFreePlan={isFreeOrNone}
          onClose={closeCampaignModal}
          onCreate={handleCreateCampaign}
          onUpdate={handleUpdateCampaign}
        />
      )}

      {campaignToDelete && (
        <DeleteCampaignModal
          campaign={campaignToDelete}
          linkedAutomation={automationByCampaign[campaignToDelete.id]}
          isDeleting={isDeletingCampaign}
          onClose={() => {
            if (!isDeletingCampaign) setCampaignToDelete(null);
          }}
          onConfirm={confirmDeleteCampaign}
        />
      )}
    </>
  );
}

function DeleteCampaignModal({
  campaign,
  linkedAutomation,
  isDeleting,
  onClose,
  onConfirm,
}: {
  campaign: Campaign;
  linkedAutomation: AutomationSummary | null | undefined;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-neutral-950/45 p-4 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-campaign-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isDeleting) onClose();
      }}
    >
      <div className="relative w-full max-w-md rounded-[26px] border border-neutral-200 bg-[#f5f3ee] p-7 shadow-2xl dark:border-white/10 dark:bg-[#121212]">
        <button
          type="button"
          onClick={onClose}
          disabled={isDeleting}
          aria-label="Close dialog"
          className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 transition hover:text-neutral-950 disabled:opacity-50 dark:hover:text-white"
        >
          <X size={16} />
        </button>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-600 dark:bg-red-500/15 dark:text-red-400">
          <Trash2 size={22} strokeWidth={2} />
        </div>

        <h3 id="delete-campaign-title" className="mt-5 text-xl font-semibold tracking-tight text-neutral-950 dark:text-white">
          Delete "{campaign.name}"?
        </h3>

        {linkedAutomation ? (
          <div className="mt-3 space-y-3">
            <p className="text-xs leading-5 text-neutral-500 dark:text-neutral-400">
              This campaign is currently linked to the automation{" "}
              <strong className="text-neutral-900 dark:text-neutral-100 font-semibold">
                "{linkedAutomation.name}"
              </strong>.
            </p>
            <div className="rounded-xl border border-neutral-200/80 bg-white/70 p-3.5 text-[11px] leading-relaxed text-neutral-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-neutral-300">
              <span className="font-semibold text-neutral-900 dark:text-white block mb-0.5">
                Workflow preservation:
              </span>
              The attached automation will not be deleted. It will be detached, renamed to{" "}
              <strong>"Untitled Automation"</strong>, and unlocked for reuse in your Automations library.
            </div>
          </div>
        ) : (
          <p className="mt-2 text-xs leading-5 text-neutral-500 dark:text-neutral-400">
            Are you sure you want to delete this campaign? This action cannot be undone.
          </p>
        )}

        <div className="mt-7 flex flex-col gap-2 sm:flex-row-reverse">
          <button
            type="button"
            disabled={isDeleting}
            onClick={() => void onConfirm()}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            {isDeleting && <RefreshCw size={13} className="animate-spin" />}
            <span>{isDeleting ? "Deleting..." : "Delete Campaign"}</span>
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="rounded-xl border border-neutral-300 bg-white px-5 py-2.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 disabled:opacity-50 dark:border-white/10 dark:bg-transparent dark:text-neutral-400 dark:hover:bg-white/[0.05]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export type CampaignAccordionProps = {
  campaign: Campaign;
  isFreePlan: boolean;
  expanded: boolean;
  isLast: boolean;
  automation: AutomationSummary | null | undefined;
  automationLoading: boolean;
  onToggle: () => void;
  onStatusChange: (
    campaignId: string,
    status: CampaignStatus,
  ) => Promise<void>;
  onEdit: (campaign: Campaign) => void;
  onDelete: (campaign: Campaign) => void;
  onArchive: () => void;
  onViewAutomation: (automationId: string) => void;
};

function CampaignAccordion({
  campaign,
  isFreePlan,
  expanded,
  isLast,
  automation,
  automationLoading,
  onToggle,
  onStatusChange,
  onEdit,
  onDelete,
  onArchive,
  onViewAutomation,
}: CampaignAccordionProps) {
  const ChannelIcon =
    campaign.channel === "email"
      ? Mail
      : campaign.channel === "sms"
        ? MessageSquare
        : Send;

  const isAutomationDisabled =
    !automation ||
    automationLoading ||
    (isFreePlan && campaign.channel !== "email");

  return (
    <article
      className={[
        "bg-white/70 transition-colors duration-200 hover:bg-white dark:bg-[#121212] dark:hover:bg-[#151515]",
        !isLast ? "border-b border-neutral-200 dark:border-white/[0.08]" : "",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="group flex w-full items-center gap-4 px-4 py-4 text-left transition-colors sm:px-5 sm:py-5"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-500 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-neutral-400">
          <ChannelIcon size={17} strokeWidth={1.8} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-3">
            <h3 className="truncate text-sm font-semibold text-neutral-950 dark:text-white">
              {campaign.name}
            </h3>
            <StatusBadge status={campaign.status} />
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-400 dark:text-neutral-600">
            <span>{CHANNEL_LABELS[campaign.channel]}</span>
            <span className="flex items-center gap-1.5">
              <Users size={12} />
              {campaign.audienceName}
            </span>
            {campaign.audienceSize !== null && (
              <span>{campaign.audienceSize.toLocaleString()} people</span>
            )}
          </div>
        </div>

        <div className="hidden shrink-0 text-right md:block">
          {campaign.scheduledAt ? (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400 dark:text-neutral-600">
                Scheduled
              </p>
              <p className="mt-1 text-xs font-medium text-neutral-700 dark:text-neutral-300">
                {formatCampaignSchedule(campaign.scheduledAt)}
              </p>
            </>
          ) : (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400 dark:text-neutral-600">
                Updated
              </p>
              <p className="mt-1 text-xs font-medium text-neutral-700 dark:text-neutral-300">
                {formatDate(campaign.updatedAt)}
              </p>
            </>
          )}
        </div>

        <span
          className={[
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            "text-neutral-400 transition-transform duration-300",
            "group-hover:text-neutral-700 dark:text-neutral-600 dark:group-hover:text-neutral-300",
            expanded ? "rotate-180" : "",
          ].join(" ")}
        >
          <ChevronDown size={17} />
        </span>
      </button>

      {expanded && (
        <div className="border-t border-neutral-200 bg-white/40 px-4 pb-5 pt-5 dark:border-white/[0.08] dark:bg-white/[0.01] sm:px-5 sm:pb-6">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto]">
            <div>
              <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                <DetailItem
                  icon={Users}
                  label="Audience"
                  value={campaign.audienceName}
                />
                <DetailItem
                  icon={Users}
                  label="Audience size"
                  value={
                    campaign.audienceSize !== null
                      ? `${campaign.audienceSize.toLocaleString()} people`
                      : "Not available"
                  }
                />
                <DetailItem
                  icon={CalendarDays}
                  label="Created"
                  value={formatDate(campaign.createdAt)}
                />
                <DetailItem
                  icon={campaign.scheduledAt ? Clock3 : Send}
                  label={campaign.scheduledAt ? "Schedule" : "Timing"}
                  value={
                    campaign.scheduledAt
                      ? formatCampaignSchedule(campaign.scheduledAt)
                      : campaign.status === "active"
                        ? "Send now"
                        : "Not scheduled"
                  }
                />
                <DetailItem
                  icon={
                    campaign.channel === "email"
                      ? Mail
                      : campaign.channel === "sms"
                        ? MessageSquare
                        : Send
                  }
                  label="Channel"
                  value={CHANNEL_LABELS[campaign.channel]}
                />
                <DetailItem
                  icon={CircleAlert}
                  label="Automation"
                  value={
                    automationLoading
                      ? "Loading..."
                      : automation
                        ? automation.name
                        : "Not linked yet"
                  }
                />
              </div>

              <div className="mt-8">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-600">
                  Lifecycle
                </p>
                <Lifecycle
                  status={campaign.status}
                  scheduledAt={campaign.scheduledAt}
                />
              </div>

              {campaign.sent !== null && (
                <div className="mt-8">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-600">
                    Performance
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <PerformanceItem label="Sent" value={campaign.sent} />
                    <PerformanceItem
                      label="Delivered"
                      value={campaign.delivered}
                    />
                    <PerformanceItem label="Failed" value={campaign.failed} />
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 lg:min-w-[180px]">
              {(campaign.status === "draft" ||
                campaign.status === "scheduled" ||
                campaign.status === "inactive" ||
                campaign.status === "failed") && (
                <ActionButton
                  label="Edit"
                  icon={Edit3}
                  onClick={() => onEdit(campaign)}
                />
              )}

              {campaign.status === "draft" && (
                <ActionButton
                  label="Start"
                  icon={Play}
                  onClick={() => void onStatusChange(campaign.id, "active")}
                />
              )}

              {campaign.status === "scheduled" && (
                <ActionButton
                  label="Pause"
                  icon={Pause}
                  onClick={() => void onStatusChange(campaign.id, "inactive")}
                />
              )}

              {campaign.status === "active" && (
                <ActionButton
                  label="Pause"
                  icon={Pause}
                  onClick={() => void onStatusChange(campaign.id, "inactive")}
                />
              )}

              {campaign.status === "inactive" && (
                <ActionButton
                  label="Activate"
                  icon={Play}
                  onClick={() => void onStatusChange(campaign.id, "active")}
                />
              )}

              {campaign.status === "failed" && (
                <ActionButton
                  label="Retry"
                  icon={RefreshCw}
                  onClick={() => void onStatusChange(campaign.id, "active")}
                />
              )}

              {campaign.status === "completed" && (
                <ActionButton
                  label="Archive"
                  icon={Archive}
                  onClick={onArchive}
                />
              )}

              <ActionButton
                label="View automation"
                icon={ArrowUpRight}
                disabled={isAutomationDisabled}
                onClick={() => {
                  if (!isAutomationDisabled && automation) {
                    onViewAutomation(automation.id);
                  }
                }}
              />

              <ActionButton
                label="Delete"
                icon={Trash2}
                destructive
                onClick={() => {
                  onDelete(campaign);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

type CreateCampaignModalProps = {
  mode: "create" | "edit";
  initialCampaign: Campaign | null;
  audiences: Audience[];
  saving: boolean;
  isFreePlan: boolean;
  onClose: () => void;
  onCreate: (draft: CampaignDraft) => Promise<void>;
  onUpdate: (campaignId: string, draft: CampaignDraft) => Promise<void>;
};

function CreateCampaignModal({
  mode,
  initialCampaign,
  audiences,
  saving,
  isFreePlan,
  onClose,
  onCreate,
  onUpdate,
}: CreateCampaignModalProps) {
  const [name, setName] = useState(initialCampaign?.name ?? "");
  const [channel, setChannel] = useState<CampaignChannel>(
    initialCampaign?.channel ?? "email",
  );
  const [audienceId, setAudienceId] = useState(
    initialCampaign?.audienceId ?? "",
  );
  const [timing, setTiming] = useState<"now" | "schedule">(
    initialCampaign?.scheduledAt ? "schedule" : "now",
  );
  const [scheduledAt, setScheduledAt] = useState(
    initialCampaign?.scheduledAt
      ? toDatetimeLocalValue(initialCampaign.scheduledAt)
      : "",
  );

  const selectedAudience =
    audiences.find((audience) => audience.id === audienceId) ?? null;

  const canCreate =
    name.trim().length > 0 &&
    audienceId.length > 0 &&
    (!isFreePlan || channel === "email") &&
    (timing === "now" || scheduledAt.length > 0);

  const handleSubmit = async () => {
    if (!canCreate || saving) return;

    const draft: CampaignDraft = {
      name: name.trim(),
      channel,
      audienceId,
      timing,
      scheduledAt,
    };

    if (mode === "edit" && initialCampaign) {
      await onUpdate(initialCampaign.id, draft);
      return;
    }

    await onCreate(draft);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-950/45 p-4 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="campaign-modal-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[24px] border border-neutral-200 bg-[#f5f3ee] shadow-2xl shadow-black/20 dark:border-white/[0.08] dark:bg-[#111111] dark:shadow-black/50">
        <div className="flex shrink-0 items-start justify-between border-b border-neutral-200 px-6 py-5 sm:px-8 dark:border-white/[0.08]">
          <div className="min-w-0 pr-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-neutral-400 dark:text-neutral-600">
              {mode === "edit" ? "Edit campaign" : "New campaign"}
            </p>
            <h2
              id="campaign-modal-title"
              className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-neutral-950 dark:text-white"
            >
              {mode === "edit" ? "Edit campaign" : "Create campaign"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-5 text-neutral-500 dark:text-neutral-400">
              Set the campaign scope and timing. Content will be selected through its automation.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close campaign modal"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-neutral-400 transition-colors hover:bg-neutral-200 hover:text-neutral-950 disabled:cursor-not-allowed disabled:opacity-50 dark:text-neutral-600 dark:hover:bg-white/[0.06] dark:hover:text-white"
          >
            <X size={17} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-6 sm:px-8 sm:py-7">
          <div className="grid gap-x-6 gap-y-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <FieldLabel htmlFor="campaign-name">Campaign name</FieldLabel>
              <input
                id="campaign-name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. August product announcement"
                className="mt-2 h-11 w-full rounded-xl border border-neutral-200 bg-white/70 px-4 text-sm text-neutral-950 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-400 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white dark:placeholder:text-neutral-600 dark:focus:border-white/20"
              />
            </div>

            <div>
              <FieldLabel>Campaign channel</FieldLabel>
              <div className="mt-2 flex flex-wrap justify-center gap-3">
                <div className="w-full sm:w-[calc(50%-0.375rem)]">
                  <ChannelOption
                    active={channel === "email"}
                    icon={Mail}
                    title="Email"
                    description="Send through email"
                    onClick={() => setChannel("email")}
                  />
                </div>

                <div className="w-full sm:w-[calc(50%-0.375rem)]">
                  <ChannelOption
                    active={channel === "sms"}
                    disabled={isFreePlan}
                    icon={MessageSquare}
                    title="SMS"
                    description={isFreePlan ? "Locked on Free" : "Send through SMS"}
                    onClick={() => {
                      if (!isFreePlan) setChannel("sms");
                    }}
                  />
                </div>

                <div className="w-full sm:w-[calc(50%-0.375rem)]">
                  <ChannelOption
                    active={channel === "email_sms"}
                    disabled={isFreePlan}
                    icon={Send}
                    title="Email + SMS"
                    description={isFreePlan ? "Locked on Free" : "Send through both"}
                    onClick={() => {
                      if (!isFreePlan) setChannel("email_sms");
                    }}
                  />
                </div>
              </div>
            </div>

            <div>
              <FieldLabel>Timing</FieldLabel>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <TimingOption
                  active={timing === "now"}
                  icon={Send}
                  title="Send now"
                  description="Save as draft & start when ready"
                  onClick={() => setTiming("now")}
                />
                <TimingOption
                  active={timing === "schedule"}
                  icon={CalendarDays}
                  title="Schedule"
                  description="Choose a date"
                  onClick={() => setTiming("schedule")}
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <FieldLabel htmlFor="campaign-audience">Audience</FieldLabel>
              <div className="relative mt-2">
                <select
                  id="campaign-audience"
                  value={audienceId}
                  onChange={(event) => setAudienceId(event.target.value)}
                  className="h-11 w-full appearance-none rounded-xl border border-neutral-200 bg-white/70 px-4 pr-10 text-sm text-neutral-950 outline-none transition-colors focus:border-neutral-400 dark:border-white/[0.08] dark:bg-[#151515] dark:text-white dark:focus:border-white/20"
                >
                  <option value="" className="bg-white text-neutral-900 dark:bg-[#151515] dark:text-white">Select an audience</option>
                  {audiences.map((audience) => (
                    <option key={audience.id} value={audience.id} className="bg-white text-neutral-900 dark:bg-[#151515] dark:text-white">
                      {audience.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-600"
                />
              </div>

              {selectedAudience && (
                <p className="mt-2 text-[11px] leading-4 text-neutral-400 dark:text-neutral-600">
                  {selectedAudience.size.toLocaleString()} people currently match this audience.
                </p>
              )}

              {!selectedAudience && audiences.length === 0 && (
                <p className="mt-2 text-[11px] leading-4 text-neutral-400 dark:text-neutral-600">
                  No audiences are available yet.
                </p>
              )}
            </div>

            {timing === "schedule" && (
              <div className="md:col-span-2">
                <FieldLabel htmlFor="campaign-schedule">
                  Schedule date & time
                </FieldLabel>
                <input
                  id="campaign-schedule"
                  type="datetime-local"
                  min={getMinimumDatetimeLocal()}
                  value={scheduledAt}
                  onChange={(event) => setScheduledAt(event.target.value)}
                  className="mt-2 h-11 w-full rounded-xl border border-neutral-200 bg-white/70 px-4 text-sm text-neutral-950 outline-none transition-colors focus:border-neutral-400 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white dark:focus:border-white/20"
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-neutral-200 px-6 py-4 sm:px-8 dark:border-white/[0.08]">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-neutral-500 transition hover:bg-neutral-200/70 hover:text-neutral-950 disabled:opacity-50 dark:text-neutral-400 dark:hover:bg-white/[0.05] dark:hover:text-white"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!canCreate || saving}
            onClick={() => void handleSubmit()}
            className="inline-flex min-w-[150px] items-center justify-center gap-2 rounded-xl bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-40 disabled:hover:translate-y-0 dark:bg-white dark:text-neutral-950"
          >
            {saving && <RefreshCw size={14} className="animate-spin" />}
            <span>
              {mode === "edit"
                ? "Save changes"
                : timing === "now"
                  ? "Create campaign"
                  : "Create & schedule"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

function Lifecycle({ status, scheduledAt }: LifecycleProps) {
  const terminalOrAlternate =
    status === "inactive" || status === "cancelled" || status === "failed";

  const activeIndex = lifecycleSteps.findIndex((step) => step.id === status);

  return (
    <div className="mt-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {lifecycleSteps.map((step, index) => {
          const completed =
            !terminalOrAlternate &&
            ((activeIndex >= 0 && index < activeIndex) ||
              status === "completed");

          const active =
            !terminalOrAlternate &&
            (step.id === status ||
              (status === "completed" && step.id === "completed"));

          return (
            <div
              key={step.id}
              className="flex min-w-0 flex-1 items-center gap-2"
            >
              <div className="flex items-center gap-2">
                <span
                  className={[
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold transition-colors",
                    completed || active
                      ? "border-neutral-950 bg-neutral-950 text-white dark:border-white dark:bg-white dark:text-neutral-950"
                      : "border-neutral-200 bg-white text-neutral-400 dark:border-white/[0.1] dark:bg-white/[0.03] dark:text-neutral-600",
                  ].join(" ")}
                >
                  {completed ? <Check size={13} /> : index + 1}
                </span>

                <span
                  className={[
                    "whitespace-nowrap text-xs font-medium",
                    active || completed
                      ? "text-neutral-950 dark:text-white"
                      : "text-neutral-400 dark:text-neutral-600",
                  ].join(" ")}
                >
                  {step.label}
                </span>
              </div>

              {index < lifecycleSteps.length - 1 && (
                <span
                  className={[
                    "hidden h-px flex-1 sm:block",
                    completed
                      ? "bg-neutral-950 dark:bg-white"
                      : "bg-neutral-200 dark:bg-white/[0.08]",
                  ].join(" ")}
                />
              )}
            </div>
          );
        })}
      </div>

      {terminalOrAlternate && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-neutral-200 bg-white/50 px-4 py-3 dark:border-white/[0.08] dark:bg-white/[0.02]">
          <CircleAlert
            size={15}
            className="mt-0.5 shrink-0 text-neutral-400 dark:text-neutral-600"
          />
          <div>
            <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              {STATUS_LABELS[status as CampaignStatus] ?? status}
            </p>
            <p className="mt-1 text-xs leading-5 text-neutral-400 dark:text-neutral-600">
              {STATUS_DESCRIPTIONS[status as CampaignStatus] ?? ""}
            </p>
          </div>
        </div>
      )}

      {status === "scheduled" && scheduledAt && (
        <p className="mt-3 text-xs text-neutral-400 dark:text-neutral-600">
          Scheduled for {formatCampaignSchedule(scheduledAt)}
        </p>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: CampaignStatus }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-neutral-200 bg-white/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-500 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-neutral-400">
      <span
        className={[
          "h-1.5 w-1.5 rounded-full",
          status === "active"
            ? "bg-emerald-500"
            : status === "failed"
              ? "bg-red-500"
              : status === "completed"
                ? "bg-blue-500"
                : status === "cancelled"
                  ? "bg-neutral-400"
                  : status === "scheduled"
                    ? "bg-amber-500"
                    : "bg-neutral-400",
        ].join(" ")}
      />
      {STATUS_LABELS[status]}
    </span>
  );
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-neutral-400 dark:text-neutral-600">
        <Icon size={13} strokeWidth={1.8} />
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em]">
          {label}
        </span>
      </div>
      <p className="mt-2 text-sm font-medium text-neutral-800 dark:text-neutral-200">
        {value}
      </p>
    </div>
  );
}

function PerformanceItem({
  label,
  value,
}: {
  label: string;
  value: number | null;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white/60 px-4 py-3 dark:border-white/[0.08] dark:bg-white/[0.02]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400 dark:text-neutral-600">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold tabular-nums text-neutral-950 dark:text-white">
        {value === null ? "—" : value.toLocaleString()}
      </p>
    </div>
  );
}

function ActionButton({
  label,
  icon: Icon,
  destructive = false,
  disabled = false,
  onClick,
}: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all duration-200",
        disabled
          ? "cursor-not-allowed opacity-40"
          : destructive
            ? "border-red-200 bg-red-50 text-red-600 hover:border-red-300 hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/[0.06] dark:text-red-400"
            : "border-neutral-200 bg-white/70 text-neutral-700 hover:-translate-y-0.5 hover:border-neutral-400 hover:bg-white hover:text-neutral-950 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-neutral-300 dark:hover:border-white/20 dark:hover:text-white",
      ].join(" ")}
    >
      <Icon size={14} strokeWidth={1.9} />
      <span>{label}</span>
    </button>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: {
    value: string;
    label: string;
  }[];
}) {
  return (
    <div className="relative min-w-0">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full appearance-none rounded-xl border border-neutral-200 bg-white/60 px-4 pr-10 text-xs font-medium text-neutral-700 outline-none transition-colors focus:border-neutral-400 dark:border-white/[0.08] dark:bg-[#151515] dark:text-white dark:focus:border-white/20 sm:min-w-[150px]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-white text-neutral-900 dark:bg-[#151515] dark:text-white">
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-600"
      />
    </div>
  );
}

function FieldLabel({
  children,
  htmlFor,
}: {
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-xs font-semibold text-neutral-700 dark:text-neutral-300"
    >
      {children}
    </label>
  );
}

function ChannelOption({
  active,
  disabled = false,
  icon: Icon,
  title,
  description,
  onClick,
}: {
  active: boolean;
  disabled?: boolean;
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[
        "flex min-w-0 items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all duration-200",
        disabled
          ? "cursor-not-allowed border-neutral-200 bg-neutral-100 opacity-50 dark:border-white/[0.05] dark:bg-white/[0.01]"
          : active
            ? "border-neutral-950 bg-neutral-950 text-white dark:border-white dark:bg-white dark:text-neutral-950"
            : "border-neutral-200 bg-white/50 text-neutral-700 hover:border-neutral-400 dark:border-white/[0.08] dark:bg-white/[0.02] dark:text-neutral-300 dark:hover:border-white/20",
      ].join(" ")}
    >
      <span
        className={[
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          active
            ? "bg-white/10 dark:bg-neutral-950/10"
            : "bg-neutral-100 dark:bg-white/[0.05]",
        ].join(" ")}
      >
        <Icon size={15} strokeWidth={1.8} />
      </span>

      <span className="min-w-0">
        <span className="block text-sm font-semibold">{title}</span>
        <span
          className={[
            "mt-0.5 block truncate text-xs",
            active
              ? "text-white/60 dark:text-neutral-950/60"
              : "text-neutral-400 dark:text-neutral-600",
          ].join(" ")}
        >
          {description}
        </span>
      </span>

      {active && (
        <Check size={15} className="ml-auto shrink-0" strokeWidth={2.2} />
      )}
    </button>
  );
}

function TimingOption({
  active,
  icon: Icon,
  title,
  description,
  onClick,
}: {
  active: boolean;
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex min-w-0 items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all duration-200",
        active
          ? "border-neutral-950 bg-neutral-950 text-white dark:border-white dark:bg-white dark:text-neutral-950"
          : "border-neutral-200 bg-white/50 text-neutral-700 hover:border-neutral-400 dark:border-white/[0.08] dark:bg-white/[0.02] dark:text-neutral-300 dark:hover:border-white/20",
      ].join(" ")}
    >
      <span
        className={[
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          active
            ? "bg-white/10 dark:bg-neutral-950/10"
            : "bg-neutral-100 dark:bg-white/[0.05]",
        ].join(" ")}
      >
        <Icon size={15} strokeWidth={1.8} />
      </span>

      <span className="min-w-0">
        <span className="block text-sm font-semibold">{title}</span>
        <span
          className={[
            "mt-0.5 block truncate text-xs",
            active
              ? "text-white/60 dark:text-neutral-950/60"
              : "text-neutral-400 dark:text-neutral-600",
          ].join(" ")}
        >
          {description}
        </span>
      </span>

      {active && (
        <Check size={15} className="ml-auto shrink-0" strokeWidth={2.2} />
      )}
    </button>
  );
}

function LoadingCampaignState() {
  return (
    <div className="mt-12 flex min-h-[440px] items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white/20 px-6 dark:border-white/[0.1] dark:bg-white/[0.015]">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-neutral-500 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-neutral-400">
          <RefreshCw size={21} strokeWidth={1.7} className="animate-spin" />
        </div>
        <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.24em] text-neutral-400 dark:text-neutral-600">
          Loading campaigns
        </p>
        <p className="mt-3 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
          Pulling campaigns and audiences from the workspace.
        </p>
      </div>
    </div>
  );
}

function EmptyCampaignState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="mt-12 flex min-h-[440px] items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white/20 px-6 dark:border-white/[0.1] dark:bg-white/[0.015]">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-neutral-500 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-neutral-400">
          <Send size={21} strokeWidth={1.7} />
        </div>
        <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.24em] text-neutral-400 dark:text-neutral-600">
          No campaigns
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-neutral-950 dark:text-white">
          Start with what you want to send.
        </h2>
        <p className="mt-3 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
          Create a campaign by choosing its channel, audience, and timing. You can connect the campaign to an automation afterward.
        </p>
        <button
          type="button"
          onClick={onCreate}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 px-4 py-3 text-xs font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:bg-white dark:text-neutral-950 sm:w-auto"
        >
          <Plus size={15} />
          Create campaign
        </button>
      </div>
    </div>
  );
}

function NoResultsState({ onClear }: { onClear: () => void }) {
  return (
    <div className="mt-12 flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-neutral-300 px-6 dark:border-white/[0.1]">
      <div className="text-center">
        <Search
          size={22}
          className="mx-auto text-neutral-400 dark:text-neutral-600"
        />
        <h2 className="mt-4 text-lg font-semibold text-neutral-950 dark:text-white">
          No matching campaigns
        </h2>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          Try changing your search or filters.
        </p>
        <button
          type="button"
          onClick={onClear}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-xs font-semibold text-neutral-700 transition-colors hover:border-neutral-400 hover:text-neutral-950 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-neutral-300 dark:hover:border-white/20 dark:hover:text-white sm:w-auto"
        >
          <X size={14} />
          Clear filters
        </button>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatCampaignSchedule(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function toDatetimeLocalValue(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (number: number) => String(number).padStart(2, "0");
  return (
    [date.getFullYear(), pad(date.getMonth() + 1), pad(date.getDate())].join(
      "-",
    ) + `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

function getMinimumDatetimeLocal() {
  const now = new Date();
  const pad = (number: number) => String(number).padStart(2, "0");
  return (
    [now.getFullYear(), pad(now.getMonth() + 1), pad(now.getDate())].join("-") +
    `T${pad(now.getHours())}:${pad(now.getMinutes())}`
  );
}