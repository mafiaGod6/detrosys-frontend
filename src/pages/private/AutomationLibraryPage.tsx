import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Copy,
  GitBranch,
  Lock,
  Mail,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Timer,
  Trash2,
  Workflow,
  X,
} from "lucide-react";
import { useNavigate } from "react-router";
import {
  deleteAutomation,
  getAutomations,
  getCampaigns,
  getChannelLabel,
  getStatusLabel,
  isAutomationReusable,
  reuseAutomationForCampaign,
  type Automation,
  type AutomationNode,
  type Campaign,
} from "./automationApi";

function statusClasses(status: Automation["status"]) {
  if (status === "active") return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  if (status === "paused") return "bg-amber-500/10 text-amber-700 dark:text-amber-300";
  if (status === "finished") return "bg-blue-500/10 text-blue-700 dark:text-blue-300";
  return "bg-neutral-950/[0.05] text-neutral-500 dark:bg-white/[0.06] dark:text-neutral-400";
}

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ??
  import.meta.env.VITE_API_URL ??
  "http://localhost:8000"
).replace(/\/$/, "");

export function AutomationLibraryPage() {
  const navigate = useNavigate();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [filter, setFilter] = useState<"all" | Automation["status"]>("all");

  // Delete modal state
  const [automationToDelete, setAutomationToDelete] = useState<Automation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Reuse modal state (Select Campaign only — no canvas editing)
  const [automationToReuse, setAutomationToReuse] = useState<Automation | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [isReusing, setIsReusing] = useState(false);

  const [planSlug, setPlanSlug] = useState<string>(() => {
    const saved = localStorage.getItem("detrosys_plan");
    return saved && saved !== "none" ? saved : "free";
  });

  const loadData = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const token = localStorage.getItem("detrosys_access_token");
      const headers: Record<string, string> = {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const [data, campaignsRes, statusRes] = await Promise.allSettled([
        getAutomations(),
        getCampaigns(),
        fetch(`${API_BASE_URL}/billing/status`, { headers }).then((r) =>
          r.ok ? r.json() : null,
        ),
      ]);

      if (data.status === "fulfilled") {
        setAutomations(data.value);
        setErrorMessage("");
      } else {
        setErrorMessage(
          data.reason instanceof Error
            ? data.reason.message
            : "Unable to load automations from backend.",
        );
      }

      if (campaignsRes.status === "fulfilled") {
        setCampaigns(campaignsRes.value);
      }

      let resolvedPlan = "free";
      if (statusRes.status === "fulfilled" && statusRes.value) {
        let raw = statusRes.value.plan || statusRes.value.plan_slug;
        if (typeof raw === "object" && raw !== null) {
          raw = (raw as any).slug || (raw as any).name;
        }
        const val = String(raw || "free").toLowerCase().trim();
        if (val.includes("adv")) resolvedPlan = "advanced";
        else if (val.includes("pro")) resolvedPlan = "pro";
        else if (val.includes("basic")) resolvedPlan = "basic";
        else if (val === "none") resolvedPlan = "none";
      }

      setPlanSlug(resolvedPlan);
      localStorage.setItem("detrosys_plan", resolvedPlan);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load automations.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const isFreePlan = planSlug === "free" || planSlug === "none";

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return automations.filter((automation) => {
      const matchesFilter = filter === "all" || automation.status === filter;
      const matchesSearch =
        !query ||
        automation.name.toLowerCase().includes(query) ||
        (automation.campaignName && automation.campaignName.toLowerCase().includes(query)) ||
        getChannelLabel(automation.channel).toLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });
  }, [automations, filter, search]);

  // Campaigns available to link when clicking "Reuse"
  const availableCampaignsForReuse = useMemo(() => {
    if (!automationToReuse) return [];
    const usedCampaignIds = new Set(
      automations
        .filter((a) => a.campaignId && a.id !== automationToReuse.id)
        .map((a) => String(a.campaignId)),
    );

    return campaigns.filter((c) => {
      const isAssignableStatus = c.status === "draft" || c.status === "scheduled";
      return isAssignableStatus && !usedCampaignIds.has(String(c.id));
    });
  }, [campaigns, automations, automationToReuse]);

  const handleCreate = () => {
    if (planSlug === "none") {
      navigate("/billing");
      return;
    }
    navigate("/app/automations/create");
  };

  const openReuseModal = (automation: Automation) => {
    if (planSlug === "none") {
      navigate("/billing");
      return;
    }
    setErrorMessage("");
    setSuccessMessage("");
    setAutomationToReuse(automation);
    setSelectedCampaignId("");
  };

  const confirmReuseForCampaign = async () => {
    if (!automationToReuse || !selectedCampaignId) return;
    const targetCampaign = campaigns.find((c) => c.id === selectedCampaignId);
    if (!targetCampaign) return;

    setIsReusing(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await reuseAutomationForCampaign(automationToReuse, targetCampaign);
      await loadData();
      setSuccessMessage(
        `"${automationToReuse.name}" is now linked to campaign "${targetCampaign.name}".`,
      );
      setAutomationToReuse(null);
      setSelectedCampaignId("");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to assign automation to the selected campaign.",
      );
    } finally {
      setIsReusing(false);
    }
  };

  const handleDuplicate = async (automation: Automation) => {
    if (planSlug === "none") {
      navigate("/billing");
      return;
    }
    if (isFreePlan && automation.channel !== "email") return;

    openReuseModal(automation);
  };

  const confirmDelete = async () => {
    if (!automationToDelete) return;

    setIsDeleting(true);
    try {
      setErrorMessage("");
      setSuccessMessage("");
      await deleteAutomation(automationToDelete.id);
      setAutomations((current) =>
        current.filter((item) => item.id !== automationToDelete.id),
      );
      setAutomationToDelete(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to delete automation.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f3ee] text-neutral-950 dark:bg-[#0d0d0d] dark:text-white">
      <div className="mx-auto w-full max-w-[1400px] px-5 pb-44 pt-8 sm:px-8 sm:pt-10 lg:px-12 lg:pb-48 lg:pt-12">
        {/* HEADER */}
        <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--detrosys-accent,#e4572e)]" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-neutral-400 dark:text-neutral-600">
                Workspace / Automations
              </p>
            </div>

            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.055em] text-neutral-950 sm:text-5xl lg:text-6xl dark:text-white">
              Automations
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-6 text-neutral-500 dark:text-neutral-400">
              Build once and run whenever your campaigns are ready. Keep workflows
              organized and reusable without starting from scratch.
            </p>
          </div>

          <div className="flex w-full flex-col items-stretch sm:w-auto">
            {planSlug === "none" ? (
              <div className="flex w-full flex-col items-stretch gap-1 sm:w-auto sm:items-end">
                <button
                  type="button"
                  onClick={() => navigate("/billing")}
                  className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-neutral-300/70 px-5 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-300 dark:bg-neutral-800/80 dark:text-neutral-300 dark:hover:bg-neutral-800 sm:w-auto"
                >
                  <Lock size={14} />
                  Automations Locked on No Plan
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleCreate}
                className="group flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 px-4 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:bg-white dark:text-neutral-950 sm:w-auto"
              >
                <Plus size={16} strokeWidth={2.2} className="transition-transform duration-200 group-hover:rotate-90" />
                <span>Create automation</span>
              </button>
            )}
          </div>
        </header>

        {/* CONTROLS */}
        <div className="mt-10 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative min-w-0 flex-1 sm:max-w-md">
            <Search
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-600"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search automations, campaigns, channels..."
              className="h-12 w-full rounded-xl border border-neutral-200 bg-white/60 pl-11 pr-4 text-sm text-neutral-950 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-400 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white dark:placeholder:text-neutral-600 dark:focus:border-white/20"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {(["all", "active", "draft", "paused", "finished"] as const).map(
              (item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFilter(item)}
                  className={[
                    "rounded-xl px-3.5 py-2.5 text-xs font-semibold transition",
                    filter === item
                      ? "bg-neutral-950 text-white dark:bg-white dark:text-neutral-950"
                      : "border border-neutral-200 bg-white/60 text-neutral-600 hover:bg-white dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-neutral-400 dark:hover:bg-white/[0.06]",
                  ].join(" ")}
                >
                  {item === "all" ? "All" : getStatusLabel(item)}
                </button>
              ),
            )}
          </div>
        </div>

        {errorMessage && (
          <div className="mt-6 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600 dark:border-red-400/20 dark:bg-red-500/[0.06] dark:text-red-300">
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={() => void loadData()}
              className="font-semibold underline hover:text-red-800 dark:hover:text-red-200"
            >
              Retry
            </button>
          </div>
        )}

        {successMessage && (
          <div className="mt-6 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
            <span className="flex items-center gap-2">
              <Check size={14} />
              {successMessage}
            </span>
            <button
              type="button"
              onClick={() => setSuccessMessage("")}
              className="text-emerald-500 hover:text-emerald-800 dark:hover:text-emerald-200"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <section className="mt-10">
          {loading ? (
            <div className="min-h-[440px] rounded-2xl border border-dashed border-neutral-300 bg-white/20 p-10 text-center dark:border-white/10 dark:bg-white/[0.015]">
              <div className="flex flex-col items-center justify-center pt-24 text-sm text-neutral-400">
                <RefreshCw size={20} className="animate-spin mb-3" />
                Loading automations...
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="min-h-[440px] rounded-2xl border border-dashed border-neutral-300 bg-white/20 p-10 text-center dark:border-white/10 dark:bg-white/[0.015]">
              <div className="mx-auto flex max-w-md flex-col items-center justify-center pt-24 text-center">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-neutral-200 bg-white dark:border-white/10 dark:bg-[#151515]">
                  <Workflow size={23} className="text-neutral-500" />
                </div>
                <h2 className="text-xl font-semibold">No automations yet</h2>
                <p className="mt-3 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                  Choose a campaign, then build its workflow freely on the canvas.
                </p>
                <button
                  type="button"
                  onClick={handleCreate}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 px-4 py-2.5 text-sm font-semibold !text-white dark:bg-white dark:!text-neutral-950 sm:w-auto"
                >
                  Create your first automation
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          ) : (
            <div className="grid max-h-[640px] gap-5 overflow-y-auto overscroll-contain pr-1 xl:grid-cols-2">
              {filtered.map((automation) => {
                const reusable = isAutomationReusable(automation);
                const isChannelRestricted =
                  isFreePlan && automation.channel !== "email";

                return (
                  <article
                    key={automation.id}
                    className="group overflow-hidden rounded-[26px] border border-neutral-200 bg-white/70 shadow-sm transition hover:border-neutral-300 dark:border-white/[0.08] dark:bg-[#121212] dark:hover:border-white/20"
                  >
                    <div className="border-b border-neutral-200/70 p-6 dark:border-white/[0.07]">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                            <span
                              className={
                                "rounded-full px-2.5 py-1 " +
                                statusClasses(automation.status)
                              }
                            >
                              {automation.status === "active" ? "● " : ""}
                              {getStatusLabel(automation.status)}
                            </span>
                            <span>{getChannelLabel(automation.channel)}</span>
                          </div>
                          <h2 className="mt-4 text-2xl font-semibold tracking-tight">
                            {automation.name}
                          </h2>
                          <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                            {automation.campaignId ? (
                              <>
                                Built for{" "}
                                <span className="font-medium text-neutral-700 dark:text-neutral-200">
                                  {automation.campaignName}
                                </span>
                              </>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-md bg-neutral-200/70 px-2 py-0.5 text-xs font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                                Standalone · Ready to reuse
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="rounded-2xl border border-neutral-200 bg-white p-3 dark:border-white/10 dark:bg-[#181818]">
                          <Workflow size={19} className="text-neutral-500" />
                        </div>
                      </div>
                    </div>

                    <AutomationFlowMiniMap nodes={automation.nodes} />

                    <div className="flex flex-wrap items-center justify-between gap-3 p-5">
                      <div className="text-xs text-neutral-400">
                        {automation.nodes.length} nodes · Updated{" "}
                        {new Date(automation.updatedAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isChannelRestricted}
                          onClick={() => void handleDuplicate(automation)}
                          className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-30 dark:border-white/10 dark:text-neutral-300 dark:hover:bg-white/[0.05]"
                        >
                          <Copy size={14} /> Duplicate
                        </button>

                        <button
                          type="button"
                          disabled={!reusable && Boolean(automation.campaignId)}
                          onClick={() => setAutomationToDelete(automation)}
                          title={!reusable && Boolean(automation.campaignId) ? "Cannot delete while campaign is active. Complete or delete the campaign first." : ""}
                          className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-30 dark:border-red-500/20 dark:bg-red-500/[0.06] dark:text-red-400"
                        >
                          <Trash2 size={14} /> Delete
                        </button>

                        <button
                          type="button"
                          disabled={
                            !reusable || planSlug === "none" || isChannelRestricted
                          }
                          onClick={() => openReuseModal(automation)}
                          title={!reusable ? "Automation is locked by an active campaign." : "Assign this workflow to a campaign"}
                          className="rounded-xl bg-neutral-950 px-4 py-2 text-xs font-semibold !text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-30 dark:bg-white dark:!text-neutral-950"
                        >
                          Reuse
                        </button>

                        <button
                          type="button"
                          disabled={isChannelRestricted}
                          onClick={() => {
                            if (!isChannelRestricted)
                              navigate(`/app/automations/${automation.id}`);
                          }}
                          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-500 transition hover:text-neutral-950 disabled:opacity-30 dark:text-neutral-400 dark:hover:text-white"
                        >
                          Open <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>

                    {!reusable && automation.status === "active" && (
                      <div className="flex items-center gap-2 border-t border-neutral-200/70 px-5 py-3 text-[11px] text-neutral-400 dark:border-white/[0.07]">
                        <ShieldAlert size={13} />
                        Reuse and deletion unlock when the current campaign finishes or is completed.
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* REUSE AUTOMATION -> SELECT CAMPAIGN MODAL */}
      {automationToReuse && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-neutral-950/45 p-4 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !isReusing) {
              setAutomationToReuse(null);
            }
          }}
        >
          <div className="relative w-full max-w-md rounded-[26px] border border-neutral-200 bg-[#f5f3ee] p-7 shadow-2xl dark:border-white/10 dark:bg-[#121212]">
            <button
              type="button"
              onClick={() => setAutomationToReuse(null)}
              disabled={isReusing}
              className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 transition hover:text-neutral-950 disabled:opacity-50 dark:hover:text-white"
            >
              <X size={16} />
            </button>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-neutral-700 dark:border-white/10 dark:bg-[#181818] dark:text-neutral-200">
              <Workflow size={21} strokeWidth={1.9} />
            </div>

            <h3 className="mt-5 text-xl font-semibold tracking-tight text-neutral-950 dark:text-white">
              Reuse "{automationToReuse.name}"
            </h3>

            <p className="mt-2 text-xs leading-5 text-neutral-500 dark:text-neutral-400">
              Select the campaign you want to attach this automation workflow to.
            </p>

            <div className="mt-5">
              <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400 dark:text-neutral-500">
                Target Campaign
              </label>

              {availableCampaignsForReuse.length === 0 ? (
                <div className="mt-2 rounded-xl border border-dashed border-neutral-300 bg-white/60 p-4 text-xs text-neutral-500 dark:border-white/10 dark:bg-white/[0.02] dark:text-neutral-400">
                  No unassigned draft or scheduled campaigns found. Create a new campaign first on the Campaigns page.
                </div>
              ) : (
                <div className="relative mt-2">
                  <select
                    value={selectedCampaignId}
                    onChange={(e) => setSelectedCampaignId(e.target.value)}
                    disabled={isReusing}
                    className="h-11 w-full appearance-none rounded-xl border border-neutral-200 bg-white px-4 pr-10 text-sm font-medium text-neutral-950 outline-none focus:border-neutral-400 dark:border-white/10 dark:bg-[#181818] dark:text-white"
                  >
                    <option value="">Select a campaign...</option>
                    {availableCampaignsForReuse.map((camp) => (
                      <option key={camp.id} value={camp.id}>
                        {camp.name} ({getChannelLabel(camp.channel)})
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={15}
                    className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
                  />
                </div>
              )}
            </div>

            <div className="mt-7 flex flex-col gap-2 sm:flex-row-reverse">
              {availableCampaignsForReuse.length === 0 ? (
                <button
                  type="button"
                  onClick={() => navigate("/app/campaigns")}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-950 py-2.5 text-xs font-semibold text-white transition hover:bg-neutral-800 dark:bg-white dark:text-neutral-950"
                >
                  <span>Go to Campaigns</span>
                  <ArrowRight size={13} />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!selectedCampaignId || isReusing}
                  onClick={() => void confirmReuseForCampaign()}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-950 py-2.5 text-xs font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-40 dark:bg-white dark:text-neutral-950"
                >
                  {isReusing && <RefreshCw size={13} className="animate-spin" />}
                  <span>{isReusing ? "Linking..." : "Use for Campaign"}</span>
                </button>
              )}

              <button
                type="button"
                disabled={isReusing}
                onClick={() => setAutomationToReuse(null)}
                className="rounded-xl border border-neutral-300 bg-white px-5 py-2.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 disabled:opacity-50 dark:border-white/10 dark:bg-transparent dark:text-neutral-400 dark:hover:bg-white/[0.05]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP DELETE CONFIRMATION MODAL */}
      {automationToDelete && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-neutral-950/45 p-4 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !isDeleting) setAutomationToDelete(null);
          }}
        >
          <div className="relative w-full max-w-md rounded-[26px] border border-neutral-200 bg-[#f5f3ee] p-7 shadow-2xl dark:border-white/10 dark:bg-[#121212]">
            <button
              type="button"
              onClick={() => setAutomationToDelete(null)}
              disabled={isDeleting}
              className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 transition hover:text-neutral-950 disabled:opacity-50 dark:hover:text-white"
            >
              <X size={16} />
            </button>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-600 dark:bg-red-500/15 dark:text-red-400">
              <Trash2 size={22} strokeWidth={2} />
            </div>

            <h3 className="mt-5 text-xl font-semibold tracking-tight text-neutral-950 dark:text-white">
              Delete "{automationToDelete.name}"?
            </h3>

            <p className="mt-2 text-xs leading-5 text-neutral-500 dark:text-neutral-400">
              This workflow will be permanently deleted from your library. This action cannot be undone.
            </p>

            <div className="mt-7 flex flex-col gap-2 sm:flex-row-reverse">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => void confirmDelete()}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting && <RefreshCw size={13} className="animate-spin" />}
                <span>{isDeleting ? "Deleting..." : "Delete Automation"}</span>
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setAutomationToDelete(null)}
                className="rounded-xl border border-neutral-300 bg-white px-5 py-2.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 disabled:opacity-50 dark:border-white/10 dark:bg-transparent dark:text-neutral-400 dark:hover:bg-white/[0.05]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function getNodeBadge(nodeType: AutomationNode["data"]["nodeType"]) {
  switch (nodeType) {
    case "trigger":
      return { icon: Sparkles, bg: "bg-neutral-950 text-white dark:bg-white dark:text-neutral-950" };
    case "email":
      return { icon: Mail, bg: "bg-blue-600 text-white" };
    case "sms":
      return { icon: MessageSquare, bg: "bg-violet-600 text-white" };
    case "wait":
      return { icon: Timer, bg: "bg-amber-600 text-white" };
    case "condition":
      return { icon: GitBranch, bg: "bg-emerald-600 text-white" };
    default:
      return { icon: X, bg: "bg-neutral-500 text-white" };
  }
}

function AutomationFlowMiniMap({ nodes }: { nodes: AutomationNode[] }) {
  const visibleNodes = useMemo(() => {
    const rank = (n: AutomationNode) => {
      if (n.data.nodeType === "trigger") return -1;
      if (n.data.nodeType === "end") return 1;
      return 0;
    };
    const list = [...nodes].sort((a, b) => {
      const rA = rank(a);
      const rB = rank(b);
      if (rA !== rB) return rA - rB;
      return (a.position?.y ?? 0) - (b.position?.y ?? 0);
    });
    return list.slice(0, 4);
  }, [nodes]);

  const hasConditions = nodes.some((n) => n.data.nodeType === "condition");
  const overflowCount = Math.max(0, nodes.length - 4);

  return (
    <div className="relative h-[190px] overflow-hidden bg-[#ebe6db]/80 p-5 dark:bg-[#111111]">
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_1px_1px,currentColor_1px,transparent_0)] [background-size:18px_18px] text-neutral-400 dark:text-white/[0.06]" />

      <div className="absolute right-4 top-3.5 z-10 flex items-center gap-1.5 rounded-full border border-neutral-300/80 bg-white/70 px-2.5 py-0.5 text-[9px] font-semibold text-neutral-600 backdrop-blur dark:border-white/10 dark:bg-white/[0.04] dark:text-neutral-300">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--detrosys-accent,#e4572e)]" />
        {hasConditions ? "Branching Pipeline" : "Linear Drip"} · {nodes.length} {nodes.length === 1 ? "step" : "steps"}
      </div>

      <div className="relative flex h-full items-center justify-center">
        <svg className="pointer-events-none absolute inset-0 h-full w-full">
          <line
            x1="12%"
            y1="50%"
            x2="88%"
            y2="50%"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            className="text-neutral-300 dark:text-neutral-700"
          />
        </svg>

        <div className="relative z-10 flex w-full max-w-[580px] items-center justify-between gap-2 px-2">
          {visibleNodes.map((node, index) => {
            const badge = getNodeBadge(node.data.nodeType);
            const Icon = badge.icon;

            return (
              <div key={node.id} className="flex items-center gap-2">
                <div className="group/node relative flex flex-col items-center">
                  <div className="flex h-12 w-28 flex-col items-center justify-center rounded-2xl border border-neutral-300/80 bg-white/95 px-2 py-1.5 shadow-sm transition hover:scale-105 hover:shadow-md dark:border-white/10 dark:bg-[#1a1a1a]">
                    <div className="flex items-center gap-1.5">
                      <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] text-[9px] ${badge.bg}`}>
                        <Icon size={9} />
                      </span>
                      <span className="truncate text-[10px] font-bold text-neutral-900 dark:text-neutral-100">
                        {node.data.nodeType === "trigger" ? "Start" : node.data.nodeType.toUpperCase()}
                      </span>
                    </div>

                    <span className="mt-0.5 truncate text-[9px] font-medium text-neutral-500 dark:text-neutral-400">
                      {node.data.config?.templateName ||
                        node.data.config?.duration ||
                        node.data.label ||
                        "Action"}
                    </span>
                  </div>

                  {node.data.nodeType === "condition" && (
                    <span className="absolute -bottom-3 rounded-full bg-emerald-500/10 px-1.5 py-0.2 text-[8px] font-semibold text-emerald-600 dark:text-emerald-400">
                      Split
                    </span>
                  )}
                </div>

                {index < visibleNodes.length - 1 && (
                  <ArrowRight
                    size={12}
                    className="shrink-0 text-neutral-400 dark:text-neutral-600"
                  />
                )}
              </div>
            );
          })}

          {overflowCount > 0 && (
            <div className="flex items-center gap-1.5">
              <ArrowRight
                size={12}
                className="shrink-0 text-neutral-400 dark:text-neutral-600"
              />
              <div className="flex h-12 w-14 items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white/60 text-[10px] font-semibold text-neutral-500 dark:border-white/10 dark:bg-white/[0.02] dark:text-neutral-400">
                +{overflowCount}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}