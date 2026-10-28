import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Lock,
  MessageSquare,
  Plus,
  Search,
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import { templateApi, type Template } from "./templateApi";

const PLAN_TEMPLATE_CAPS: Record<string, number | null> = {
  none: 0,
  free: 0,
  basic: 300,
  pro: 1000,
  advanced: null,
};

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ??
  import.meta.env.VITE_API_URL ??
  "http://localhost:8000"
).replace(/\/$/, "");
const SERVER_ROOT = API_BASE_URL.replace(/\/api(\/v\d+)?$/, "");

export function SmsTemplatesPage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [planSlug, setPlanSlug] = useState<string>(() => {
    const saved = localStorage.getItem("detrosys_plan");
    return saved && saved !== "none" ? saved : "free";
  });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        const token = localStorage.getItem("detrosys_access_token");
        const headers: Record<string, string> = {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        const fetchBilling = async () => {
          const r1 = await fetch(`${SERVER_ROOT}/api/v1/billing/status`, { headers });
          if (r1.ok) return r1.json();
          const r2 = await fetch(`${API_BASE_URL}/billing/status`, { headers });
          return r2.ok ? r2.json() : null;
        };

        const [allTemplates, statusRes] = await Promise.allSettled([
          templateApi.list(),
          fetchBilling(),
        ]);

        if (!cancelled) {
          if (allTemplates.status === "fulfilled") {
            const userOwned = allTemplates.value.filter(
              (t) => !t.is_system && t.channel === "sms",
            );
            setTotalCount(userOwned.length);
            setTemplates(userOwned.slice(0, 4));
          }

          let resolvedPlan = localStorage.getItem("detrosys_plan") || "free";
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
            else resolvedPlan = "free";
          }

          setPlanSlug(resolvedPlan);
          localStorage.setItem("detrosys_plan", resolvedPlan);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error ? error.message : "Failed to load templates.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  const [search, setSearch] = useState("");

  const filteredTemplates = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return templates;

    return templates.filter(
      (template) =>
        template.name.toLowerCase().includes(query) ||
        template.body?.toLowerCase().includes(query) ||
        template.description?.toLowerCase().includes(query),
    );
  }, [templates, search]);

  const templateCap = planSlug in PLAN_TEMPLATE_CAPS ? PLAN_TEMPLATE_CAPS[planSlug] : 0;
  const isChannelLocked = planSlug === "none" || planSlug === "free";
  const isAtLimit =
    !isChannelLocked &&
    templateCap !== null &&
    templateCap !== undefined &&
    totalCount >= templateCap;

  return (
    <main className="min-h-screen bg-[#f5f3ee] px-5 pb-32 pt-8 text-neutral-950 dark:bg-[#0d0d0d] dark:text-white sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
              <MessageSquare size={15} />
              SMS
            </div>

            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Recent work
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-neutral-500 dark:text-neutral-400">
              Your four most recent SMS templates. Older templates remain
              permanently available in your Library.
            </p>
          </div>

          {isChannelLocked ? (
            <div className="flex w-full flex-col items-stretch gap-1 sm:w-auto sm:items-end">
              <button
                type="button"
                onClick={() => navigate("/billing")}
                className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-neutral-300/70 px-5 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-300 dark:bg-neutral-800/80 dark:text-neutral-300 dark:hover:bg-neutral-800 sm:w-auto"
              >
                <Lock size={14} />
                SMS Locked on {planSlug === "free" ? "Free Sandbox" : "No Plan"}
              </button>
              <span className="text-center text-[11px] font-medium text-[var(--detrosys-accent,#e4572e)] sm:text-right">
                Upgrade to Basic or higher to unlock SMS dispatch.
              </span>
            </div>
          ) : isAtLimit ? (
            <div className="flex w-full flex-col items-stretch gap-1 sm:w-auto sm:items-end">
              <button
                type="button"
                onClick={() => navigate("/billing")}
                className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-neutral-300/70 px-5 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-300 dark:bg-neutral-800/80 dark:text-neutral-300 dark:hover:bg-neutral-800 sm:w-auto"
              >
                <Lock size={14} />
                Template limit reached ({totalCount}/{templateCap})
              </button>
              <span className="text-center text-[11px] font-medium text-[var(--detrosys-accent,#e4572e)] sm:text-right">
                Upgrade your workspace to expand your template library.
              </span>
            </div>
          ) : (
            <Link
              to="/app/templates/sms/create"
              className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-5 text-sm font-semibold !text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-neutral-800 dark:bg-white dark:!text-neutral-950 dark:hover:bg-neutral-200 sm:w-auto"
            >
              <Plus size={17} />
              Create SMS Template
            </Link>
          )}
        </div>

        <div className="mt-10">
          <div className="relative max-w-[540px]">
            <Search
              size={18}
              className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search recent templates..."
              className="h-[60px] w-full rounded-2xl border border-neutral-200 bg-white pl-13 pr-5 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-950/5 dark:border-white/10 dark:bg-[#151515] dark:text-white dark:placeholder:text-neutral-500 dark:focus:border-white/25"
            />
          </div>
        </div>

        <section className="mt-10">
          {errorMessage && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
              {errorMessage}
            </div>
          )}

          {loading ? (
            <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-dashed border-neutral-300 dark:border-white/10 text-sm text-neutral-500">
              Loading templates...
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-dashed border-neutral-300 dark:border-white/10">
              <div className="max-w-sm text-center">
                <MessageSquare size={28} className="mx-auto mb-4 text-neutral-400" />
                <h2 className="text-lg font-semibold">
                  {search ? "No matching templates" : "No recent SMS templates"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                  {search ? "Try a different search term." : "Create an SMS template to see it here."}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredTemplates.map((template) => (
                <SmsTemplateCard key={template.id} template={template} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function SmsTemplateCard({ template }: { template: Template }) {
  const navigate = useNavigate();

  const handleOpen = () => {
    navigate(`/app/templates/sms/create?id=${template.id}`, {
      state: { template },
    });
  };

  const messageText = useMemo(() => {
    if (template.body && template.body.trim()) {
      return template.body;
    }
    if (template.description && template.description.toLowerCase() !== "sms template") {
      return `[Detrosys] ${template.name}: ${template.description} Reply STOP to opt out.`;
    }
    return `[Detrosys] ${template.name}: Hi {first_name}, your latest update is ready.`;
  }, [template.body, template.description, template.name]);

  return (
    <article className="overflow-hidden rounded-3xl border border-neutral-200 bg-white dark:border-white/10 dark:bg-[#151515]">
      <div className="p-3">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-neutral-200 bg-[#eeeae2] dark:border-white/[0.08] dark:bg-[#202020]">
          <div className="absolute inset-3 flex items-center justify-center">
            <div className="w-full rounded-2xl border border-neutral-200 bg-white p-3 shadow-xs dark:border-white/[0.08] dark:bg-[#111]">
              <div className="mb-2 flex items-center gap-1.5">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 text-[8px] text-white">
                  <MessageSquare size={8} />
                </span>
                <span className="text-[9px] font-bold text-neutral-900 dark:text-neutral-100">
                  SMS
                </span>
              </div>
              <div className="line-clamp-3 rounded-xl rounded-br-xs bg-neutral-950 p-2.5 text-[9px] leading-relaxed text-white dark:bg-neutral-100 dark:text-neutral-950">
                {messageText}
              </div>
            </div>
          </div>

          <div className="absolute right-3 top-3 rounded-full border border-neutral-200 bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500 dark:border-white/10 dark:bg-[#151515]/90 dark:text-neutral-400">
            SMS
          </div>
        </div>
      </div>

      <div className="px-5 pb-5 pt-2">
        <h3 className="truncate text-base font-semibold">{template.name}</h3>
        <p className="mt-2 line-clamp-2 min-h-[40px] text-xs leading-5 text-neutral-500 dark:text-neutral-400">
          {messageText}
        </p>

        <button
          type="button"
          onClick={handleOpen}
          className="mt-5 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-neutral-950 transition-all duration-150 hover:bg-neutral-100 active:scale-95 dark:text-white dark:hover:bg-white/[0.06]"
        >
          Open
          <ArrowUpRight size={14} />
        </button>
      </div>
    </article>
  );
}