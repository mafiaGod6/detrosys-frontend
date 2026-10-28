import {
  ArrowUpRight,
  Library,
  Mail,
  MessageSquare,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { templateApi, type Template, type TemplateChannel } from "./templateApi";

type Filter = "all" | TemplateChannel;

function extractPlainTextPreview(rawBody?: string | null): string {
  if (!rawBody) return "";
  const withoutComments = rawBody.replace(/<!--[\s\S]*?-->/g, "");
  const withoutTags = withoutComments
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return withoutTags;
}

export function TemplateLibraryPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    let cancelled = false;

    const loadTemplates = async () => {
      try {
        const allTemplates = await templateApi.list();
        if (!cancelled) {
          setTemplates(allTemplates.filter((template) => !template.is_system));
        }
      } catch {
        if (!cancelled) setTemplates([]);
      }
    };

    loadTemplates();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredTemplates = useMemo(() => {
    if (filter === "all") {
      return templates;
    }

    return templates.filter((template) => template.channel === filter);
  }, [filter, templates]);

  return (
    <main className="min-h-screen bg-[#f5f3ee] px-5 pb-32 pt-8 text-neutral-950 dark:bg-[#0d0d0d] dark:text-white sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10">
          <div className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-neutral-400 dark:text-neutral-500">
            <Library size={14} />
            Library
          </div>

          <h1 className="text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
            Your library
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-neutral-500 dark:text-neutral-400">
            Your permanent collection of templates. Templates created by you or
            saved from the marketplace stay here.
          </p>
        </header>

        <div className="mb-8 flex gap-2">
          <FilterButton
            active={filter === "all"}
            onClick={() => setFilter("all")}
          >
            All
          </FilterButton>

          <FilterButton
            active={filter === "email"}
            onClick={() => setFilter("email")}
          >
            <Mail size={14} />
            Email
          </FilterButton>

          <FilterButton
            active={filter === "sms"}
            onClick={() => setFilter("sms")}
          >
            <MessageSquare size={14} />
            SMS
          </FilterButton>
        </div>

        {filteredTemplates.length === 0 ? (
          <section className="flex min-h-[420px] items-center justify-center rounded-3xl border border-dashed border-neutral-300 dark:border-white/10">
            <div className="text-center">
              <Library
                size={28}
                className="mx-auto mb-4 text-neutral-400"
              />

              <h2 className="text-lg font-semibold">Your library is empty</h2>

              <p className="mt-2 max-w-sm text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                Templates you create or save from the Templates workspace will
                appear here permanently.
              </p>
            </div>
          </section>
        ) : (
          <div className="grid max-h-[720px] gap-6 overflow-y-auto overscroll-contain pr-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredTemplates.map((template) => (
              <LibraryCard key={template.id} template={template} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-all duration-200",
        active
          ? "border-neutral-950 bg-neutral-950 text-white dark:border-white dark:bg-white dark:text-neutral-950"
          : "border-neutral-200 bg-white/60 text-neutral-500 hover:border-neutral-400 hover:text-neutral-950 dark:border-white/10 dark:bg-white/[0.04] dark:text-neutral-400 dark:hover:border-white/25 dark:hover:text-white",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function LibraryCard({ template }: { template: Template }) {
  const navigate = useNavigate();
  const isEmail = template.channel === "email";

  const handleOpen = () => {
    navigate(`/app/templates/${template.channel}/create?id=${template.id}`, {
      state: { template },
    });
  };

  const previewSnippet = useMemo(() => {
    const plain = extractPlainTextPreview(template.body);
    if (plain) return plain;
    return template.description &&
      template.description.toLowerCase() !== "email template"
      ? template.description
      : `Discover the latest highlights for ${template.name}.`;
  }, [template.body, template.description, template.name]);

  const smsText = useMemo(() => {
    if (template.body && template.body.trim()) {
      return template.body;
    }
    return `[Detrosys] ${template.name}: ${template.description || "Your update is ready. Tap to view."}`;
  }, [template.body, template.name, template.description]);

  return (
    <article className="overflow-hidden rounded-3xl border border-neutral-200 bg-white dark:border-white/10 dark:bg-[#151515]">
      <div className="p-3">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-neutral-200 bg-[#eeeae2] dark:border-white/[0.08] dark:bg-[#202020]">
          {isEmail ? (
            <div className="absolute inset-3 flex flex-col justify-between overflow-hidden rounded-xl bg-white p-3 shadow-xs dark:bg-[#111]">
              <div>
                <div className="flex items-center justify-between border-b border-neutral-100 pb-1.5 dark:border-white/[0.06]">
                  <span className="truncate text-[8px] font-semibold text-neutral-400">
                    Subj: {template.subject || template.name}
                  </span>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </div>
                <h5 className="mt-2 line-clamp-1 text-[11px] font-bold text-neutral-900 dark:text-neutral-100">
                  {template.name}
                </h5>
                <p className="mt-1 line-clamp-2 text-[9px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                  {previewSnippet}
                </p>
              </div>
              <div className="pt-2">
                <span className="inline-block rounded-md bg-neutral-950 px-2 py-1 text-[8px] font-semibold text-white dark:bg-white dark:text-neutral-950">
                  Read More →
                </span>
              </div>
            </div>
          ) : (
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
                  {smsText}
                </div>
              </div>
            </div>
          )}

          <div className="absolute right-3 top-3 rounded-full border border-neutral-200 bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500 dark:border-white/10 dark:bg-[#151515]/90 dark:text-neutral-400">
            {isEmail ? "Email" : "SMS"}
          </div>
        </div>
      </div>

      <div className="px-5 pb-5 pt-2">
        <h3 className="truncate text-base font-semibold">{template.name}</h3>

        <p className="mt-2 line-clamp-2 min-h-[40px] text-xs leading-5 text-neutral-500 dark:text-neutral-400">
          {template.subject || previewSnippet}
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