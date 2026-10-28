import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Bold,
  Check,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  RefreshCw,
  Underline,
} from "lucide-react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { templateApi, type Template } from "./templateApi";

const PLAN_TEMPLATE_CAPS: Record<string, number | null> = {
  none: 0,
  free: 3,
  basic: 300,
  pro: 1000,
  advanced: null,
};

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ??
  import.meta.env.VITE_API_URL ??
  "http://localhost:8000"
).replace(/\/$/, "");

function unpackFrontendFallback(storedBody?: string | null): {
  senderName: string;
  rawBody: string;
} {
  if (!storedBody) return { senderName: "", rawBody: "" };

  const metaMatch = storedBody.match(/<!--DETROSYS_META:([^>]+)-->/);
  if (metaMatch && metaMatch[1]) {
    try {
      const parsed = JSON.parse(decodeURIComponent(metaMatch[1]));
      return {
        senderName: parsed.sender_name || parsed.senderName || "",
        rawBody: parsed.raw_body || parsed.rawBody || "",
      };
    } catch {}
  }

  return { senderName: "", rawBody: storedBody };
}

export function CreateEmailTemplatePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const editorRef = useRef<HTMLDivElement | null>(null);

  const stateTemplate = (location.state as { template?: Template & { sender_name?: string; raw_body?: string } } | null)?.template;
  const queryId = searchParams.get("id");
  const editingTemplateId = stateTemplate?.id || queryId || null;
  const isEditing = Boolean(editingTemplateId);

  const [senderName, setSenderName] = useState(
    () => stateTemplate?.sender_name || localStorage.getItem("detrosys_company_name") || "Detrosys",
  );
  const [emailName, setEmailName] = useState(() => stateTemplate?.name || "");
  const [subject, setSubject] = useState(() => stateTemplate?.subject || "");
  const [body, setBody] = useState(() => stateTemplate?.raw_body || stateTemplate?.body || "");

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
            const fallback = unpackFrontendFallback(fullData.body);
            const loadedSender =
              fullData.sender_name ||
              fallback.senderName ||
              localStorage.getItem("detrosys_company_name") ||
              "Detrosys";
            const loadedRawBody =
              fullData.raw_body !== undefined && fullData.raw_body !== null
                ? fullData.raw_body
                : fallback.rawBody;

            setSenderName(loadedSender);
            setEmailName(fullData.name || "");
            setSubject(fullData.subject || "");
            setBody(loadedRawBody);
            if (editorRef.current) {
              editorRef.current.innerHTML = loadedRawBody;
            }
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
          const userOwnedEmails = allTemplates.value.filter(
            (t) => !t.is_system && (t.channel === "email" || !t.channel),
          );
          setTotalCount(userOwnedEmails.length);
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

  const templateCap = planSlug in PLAN_TEMPLATE_CAPS ? PLAN_TEMPLATE_CAPS[planSlug] : 3;
  const isLimitReached =
    !isEditing &&
    (planSlug === "none" ||
      (templateCap !== null && templateCap !== undefined && totalCount >= templateCap));

  const execFormat = (command: string, value: string | undefined = undefined) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, value);
    setBody(editorRef.current.innerHTML);
  };

  const handleLink = () => {
    const url = window.prompt("Enter link URL:", "https://");
    if (url) execFormat("createLink", url);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLimitReached) return;

    const rawHtmlContent = editorRef.current ? editorRef.current.innerHTML : body;

    if (!emailName.trim() || !subject.trim() || !rawHtmlContent.trim()) {
      setErrorMessage("Please fill in Email Name, Subject, and Email Body.");
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

      if (senderName.trim()) {
        localStorage.setItem("detrosys_company_name", senderName.trim());
      }

      let response: Response;

      if (editingTemplateId) {
        response = await fetch(`${API_BASE_URL}/templates/${editingTemplateId}`, {
          method: "PUT",
          headers,
          body: JSON.stringify({
            name: emailName.trim(),
            subject: subject.trim(),
            body: rawHtmlContent.trim(),
            sender_name: senderName.trim(),
          }),
        });
      } else {
        response = await fetch(`${API_BASE_URL}/templates/`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            name: emailName.trim(),
            channel: "email",
            subject: subject.trim(),
            body: rawHtmlContent.trim(),
            sender_name: senderName.trim(),
          }),
        });
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || "Unable to save email template.");
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
            Email Template
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">
            {isEditing ? "Edit Email Template" : "Create Email Template"}
          </h1>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            Create a reusable email template for your campaigns and automations.
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
                  Sender's Name
                </label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="e.g. Detrosys"
                  disabled={isLimitReached}
                  className="mt-2 h-12 w-full rounded-2xl border border-neutral-200 bg-[#fbfaf8] px-4 text-sm outline-none transition focus:border-neutral-400 focus:bg-white disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-white dark:focus:bg-[#141414]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                  Email Name
                </label>
                <input
                  type="text"
                  value={emailName}
                  onChange={(e) => setEmailName(e.target.value)}
                  placeholder="e.g. Welcome Email"
                  required
                  disabled={isLimitReached}
                  className="mt-2 h-12 w-full rounded-2xl border border-neutral-200 bg-[#fbfaf8] px-4 text-sm outline-none transition focus:border-neutral-400 focus:bg-white disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-white dark:focus:bg-[#141414]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Welcome to our platform!"
                  required
                  disabled={isLimitReached}
                  className="mt-2 h-12 w-full rounded-2xl border border-neutral-200 bg-[#fbfaf8] px-4 text-sm outline-none transition focus:border-neutral-400 focus:bg-white disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-white dark:focus:bg-[#141414]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                  Email Body
                </label>
                <div className="mt-2 overflow-hidden rounded-2xl border border-neutral-200 bg-[#fbfaf8] focus-within:border-neutral-400 focus-within:bg-white dark:border-white/10 dark:bg-white/[0.03] dark:focus-within:bg-[#141414]">
                  <div className="flex items-center gap-1 border-b border-neutral-200/80 bg-white px-3 py-2 dark:border-white/10 dark:bg-white/[0.02]">
                    <button
                      type="button"
                      onClick={() => execFormat("bold")}
                      className="rounded-lg p-1.5 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-white/10"
                    >
                      <Bold size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => execFormat("italic")}
                      className="rounded-lg p-1.5 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-white/10"
                    >
                      <Italic size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => execFormat("underline")}
                      className="rounded-lg p-1.5 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-white/10"
                    >
                      <Underline size={15} />
                    </button>
                    <div className="mx-1 h-4 w-px bg-neutral-200 dark:bg-white/10" />
                    <button
                      type="button"
                      onClick={() => execFormat("insertUnorderedList")}
                      className="rounded-lg p-1.5 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-white/10"
                    >
                      <List size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => execFormat("insertOrderedList")}
                      className="rounded-lg p-1.5 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-white/10"
                    >
                      <ListOrdered size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={handleLink}
                      className="rounded-lg p-1.5 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-white/10"
                    >
                      <LinkIcon size={15} />
                    </button>
                  </div>

                  <div
                    ref={editorRef}
                    contentEditable={!isLimitReached}
                    suppressContentEditableWarning
                    onInput={() => {
                      if (editorRef.current) setBody(editorRef.current.innerHTML);
                    }}
                    className="min-h-[260px] p-4 text-sm leading-relaxed outline-none dark:text-white"
                  />
                </div>
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