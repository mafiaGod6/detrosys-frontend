import { useEffect, useState } from "react";
import { ArrowLeft, Check, RefreshCw } from "lucide-react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
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

export function CreateSmsTemplatePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const stateTemplate = (location.state as { template?: Template } | null)?.template;
  const queryId = searchParams.get("id");
  const editingTemplateId = stateTemplate?.id || queryId || null;
  const isEditing = Boolean(editingTemplateId);

  const [name, setName] = useState(() => stateTemplate?.name || "");
  const [body, setBody] = useState(() => stateTemplate?.body || "");

  const [totalCount, setTotalCount] = useState(0);
  const [planSlug, setPlanSlug] = useState<string>(() => {
    const saved = localStorage.getItem("detrosys_plan");
    return saved && saved !== "none" ? saved : "free";
  });

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadFullTemplateAndStatus = async () => {
      try {
        const token = localStorage.getItem("detrosys_access_token");
        const headers: Record<string, string> = {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        if (editingTemplateId) {
          const res = await fetch(`${API_BASE_URL}/templates/${editingTemplateId}`, {
            headers,
          });
          if (res.ok && !cancelled) {
            const fullData = await res.json();
            setName(fullData.name || "");
            setBody(fullData.body || "");
          }
        }

        const [allTemplates, statusRes] = await Promise.allSettled([
          templateApi.list(),
          fetch(`${API_BASE_URL}/billing/status`, { headers }).then((r) =>
            r.ok ? r.json() : null,
          ),
        ]);

        if (cancelled) return;

        if (allTemplates.status === "fulfilled") {
          const userOwnedSms = allTemplates.value.filter(
            (t) => !t.is_system && t.channel === "sms",
          );
          setTotalCount(userOwnedSms.length);
        }

        if (statusRes.status === "fulfilled" && statusRes.value) {
          let raw = statusRes.value.plan || statusRes.value.plan_slug;
          if (typeof raw === "object" && raw !== null) {
            raw = (raw as any).slug || (raw as any).name;
          }
          const val = String(raw || "free").toLowerCase().trim();
          let resolved = "free";
          if (val.includes("adv")) resolved = "advanced";
          else if (val.includes("pro")) resolved = "pro";
          else if (val.includes("basic")) resolved = "basic";
          else if (val === "none") resolved = "none";

          setPlanSlug(resolved);
          localStorage.setItem("detrosys_plan", resolved);
        }
      } catch {}
    };

    void loadFullTemplateAndStatus();
    return () => {
      cancelled = true;
    };
  }, [editingTemplateId]);

  const templateCap = planSlug in PLAN_TEMPLATE_CAPS ? PLAN_TEMPLATE_CAPS[planSlug] : 0;
  const isLimitReached =
    !isEditing &&
    (planSlug === "none" ||
      planSlug === "free" ||
      (templateCap !== null && templateCap !== undefined && totalCount >= templateCap));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLimitReached) return;

    if (!name.trim() || !body.trim()) {
      setErrorMessage("Please fill in Template Name and SMS Message.");
      return;
    }

    setSaving(true);
    setErrorMessage(null);

    try {
      const token = localStorage.getItem("detrosys_access_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      let response: Response;

      if (editingTemplateId) {
        response = await fetch(`${API_BASE_URL}/templates/${editingTemplateId}`, {
          method: "PUT",
          headers,
          body: JSON.stringify({
            name: name.trim(),
            body: body.trim(),
          }),
        });
      } else {
        response = await fetch(`${API_BASE_URL}/templates/`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            name: name.trim(),
            channel: "sms",
            subject: null,
            body: body.trim(),
          }),
        });
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || "Unable to save SMS template.");
      }

      setSavedSuccess(true);
      setTimeout(() => {
        navigate("/app/templates/library");
      }, 600);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to save template.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f3ee] px-5 pb-36 pt-8 text-neutral-950 dark:bg-[#0d0d0d] dark:text-white sm:px-8 lg:px-12">
      <div className="mx-auto max-w-4xl">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 shadow-xs transition hover:text-neutral-950 dark:border-white/10 dark:bg-[#151515] dark:text-neutral-300 dark:hover:text-white"
        >
          <ArrowLeft size={16} />
        </button>

        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500">
            SMS Template
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">
            {isEditing ? "Edit SMS Template" : "Create SMS Template"}
          </h1>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            Create a reusable SMS template for your campaigns and automations.
          </p>
        </header>

        {isLimitReached && (
          <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50/90 px-5 py-4 text-sm text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
            <strong>Template Limit Reached:</strong> You have reached your limit
            of {templateCap ?? 0} templates for your current plan. Please upgrade to
            create more.
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSave}>
          <div className="rounded-[28px] border border-neutral-200/80 bg-white p-6 shadow-xs dark:border-white/10 dark:bg-[#141414] sm:p-8">
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                  Template Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Welcome SMS"
                  required
                  disabled={isLimitReached}
                  className="mt-2 h-12 w-full rounded-2xl border border-neutral-200 bg-[#fbfaf8] px-4 text-sm outline-none transition focus:border-neutral-400 focus:bg-white disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-white dark:focus:bg-[#141414]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                    SMS Message
                  </label>
                  <span className="text-xs text-neutral-400">
                    {body.length} / 160 characters
                  </span>
                </div>
                <textarea
                  rows={5}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Type your SMS message..."
                  required
                  disabled={isLimitReached}
                  className="mt-2 w-full rounded-2xl border border-neutral-200 bg-[#fbfaf8] p-4 text-sm leading-relaxed outline-none transition focus:border-neutral-400 focus:bg-white disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-white dark:focus:bg-[#141414]"
                />
              </div>
            </div>

            <div className="mt-8 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="rounded-xl px-5 py-2.5 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-white/[0.05]"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving || isLimitReached}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-950 px-6 py-2.5 text-xs font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-40 dark:bg-white dark:text-neutral-950"
              >
                {saving ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Saving...
                  </>
                ) : savedSuccess ? (
                  <>
                    <Check size={14} />
                    Saved
                  </>
                ) : (
                  "Save Template"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}