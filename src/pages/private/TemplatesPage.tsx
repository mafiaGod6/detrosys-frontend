import {
  
  Check,
  Mail,
  MessageSquare,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { templateApi, type Template } from "./templateApi";

type MarketplaceTemplate = Template;

export function TemplatesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState<"all" | "email" | "sms">("all");
  const [templates, setTemplates] = useState<MarketplaceTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadTemplates = async () => {
      try {
        const systemTemplates = await templateApi.listSystem();
        if (!cancelled) setTemplates(systemTemplates);
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error ? error.message : "Failed to load templates."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadTemplates();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredTemplates = useMemo(() => {
    const query = search.toLowerCase().trim();
    return templates.filter((template) => {
      const matchesChannel =
        channelFilter === "all" || template.channel.toLowerCase() === channelFilter;

      if (!matchesChannel) return false;
      if (!query) return true;

      return (
        template.name.toLowerCase().includes(query) ||
        (template.subject && template.subject.toLowerCase().includes(query)) ||
        template.channel.toLowerCase().includes(query)
      );
    });
  }, [templates, search, channelFilter]);

  const handleUseTemplate = async (template: MarketplaceTemplate) => {
    await templateApi.useSystemTemplate(template.id);
  };

  const handleEditTemplate = (template: MarketplaceTemplate) => {
    if (template.channel.toLowerCase() === "sms") {
      navigate("/app/templates/sms/create", {
        state: { template },
      });
    } else {
      navigate("/app/templates/email/create", {
        state: { template },
      });
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f3ee] text-neutral-950 dark:bg-[#0d0d0d] dark:text-white">
      <div className="mx-auto w-full max-w-[1400px] px-5 pb-44 pt-8 sm:px-8 sm:pt-10 lg:px-12 lg:pb-48 lg:pt-12">
        <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--detrosys-accent,#e4572e)]" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-neutral-400 dark:text-neutral-600">
                Workspace / Templates
              </p>
            </div>

            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.055em] text-neutral-950 sm:text-5xl lg:text-6xl dark:text-white">
              Templates
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-6 text-neutral-500 dark:text-neutral-400">
              Explore production-ready universal templates. Click Edit to customize wording and placeholders in your editor before running campaigns.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {(["all", "email", "sms"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setChannelFilter(tab)}
                className={[
                  "rounded-xl px-4 py-2.5 text-xs font-semibold capitalize transition-all",
                  channelFilter === tab
                    ? "bg-neutral-950 text-white shadow-sm dark:bg-white dark:text-neutral-950"
                    : "border border-neutral-200 bg-white/60 text-neutral-600 hover:bg-white dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-neutral-400 dark:hover:bg-white/[0.06]",
                ].join(" ")}
              >
                {tab === "all" ? "All Templates" : tab.toUpperCase()}
              </button>
            ))}
          </div>
        </header>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative min-w-0 flex-1 sm:max-w-md">
            <Search
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-600"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates, subjects, use cases..."
              className="h-12 w-full rounded-xl border border-neutral-200 bg-white/60 pl-11 pr-4 text-sm text-neutral-950 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-400 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white dark:placeholder:text-neutral-600 dark:focus:border-white/20"
            />
          </div>

          <div className="text-xs font-medium text-neutral-400 dark:text-neutral-600">
            {filteredTemplates.length} templates available
          </div>
        </div>

        {errorMessage && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
            {errorMessage}
          </div>
        )}

        <section className="mt-10">
          {loading ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-dashed border-neutral-300 bg-white/20 text-sm text-neutral-500 dark:border-white/10 dark:bg-white/[0.015] dark:text-neutral-400">
              <RefreshCw size={20} className="mb-3 animate-spin text-neutral-400" />
              Loading templates...
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-dashed border-neutral-300 bg-white/20 p-8 text-center text-sm text-neutral-500 dark:border-white/10 dark:bg-white/[0.015] dark:text-neutral-400">
              <p className="font-semibold text-neutral-900 dark:text-white">No templates found</p>
              <p className="mt-1 text-xs">Try adjusting your search query or channel filter.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredTemplates.map((template) => (
                <MarketplaceCard
                  key={template.id}
                  template={template}
                  onUse={() => handleUseTemplate(template)}
                  onEdit={() => handleEditTemplate(template)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function MarketplaceCard({
  template,
  onUse,
  onEdit,
}: {
  template: MarketplaceTemplate;
  onUse: () => Promise<void>;
  onEdit: () => void;
}) {
  const isEmail = template.channel.toLowerCase() === "email";
  const [justUsed, setJustUsed] = useState(false);

  const handleUse = async () => {
    try {
      await onUse();
      setJustUsed(true);
      window.setTimeout(() => setJustUsed(false), 1500);
    } catch {}
  };

  return (
    <article className="group overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/[0.06] dark:border-white/10 dark:bg-[#151515] dark:hover:shadow-black/30">
      <div className="p-3">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-neutral-200 bg-[#eeeae2] dark:border-white/[0.08] dark:bg-[#202020]">
          {isEmail ? (
            <DynamicEmailPreview template={template} />
          ) : (
            <DynamicSmsPreview template={template} />
          )}

          <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500 backdrop-blur dark:border-white/10 dark:bg-[#151515]/90 dark:text-neutral-400">
            {isEmail ? <Mail size={11} /> : <MessageSquare size={11} />}
            {isEmail ? "Email" : "SMS"}
          </div>
        </div>
      </div>

      <div className="px-5 pb-5 pt-2">
        <h3 className="truncate text-base font-semibold text-neutral-950 dark:text-white">
          {template.name}
        </h3>

        <p className="mt-1.5 min-h-[38px] line-clamp-2 text-xs leading-5 text-neutral-500 dark:text-neutral-400">
          {template.subject || template.body?.slice(0, 80) || "Ready for campaigns."}
        </p>

        <div className="mt-4 flex items-center gap-2 border-t border-neutral-100 pt-3 dark:border-white/[0.06]">
          <button
            type="button"
            onClick={onEdit}
            title="Edit and customize this template"
            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-white/70 px-3 text-xs font-semibold text-neutral-700 transition hover:border-neutral-400 hover:bg-neutral-100 dark:border-white/10 dark:bg-white/[0.04] dark:text-neutral-300 dark:hover:bg-white/[0.08]"
          >
            <Pencil size={13} />
            <span>Edit</span>
          </button>

          <button
            type="button"
            onClick={() => void handleUse()}
            disabled={justUsed}
            className={[
              "inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-semibold transition-all",
              justUsed
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200",
            ].join(" ")}
          >
            {justUsed ? (
              <>
                <Check size={13} /> Saved
              </>
            ) : (
              <>
                <Plus size={13} /> Use
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}

function DynamicEmailPreview({ template }: { template: Template }) {
  return (
    <div className="absolute inset-3 flex flex-col justify-between overflow-hidden rounded-xl bg-white p-3 shadow-xs dark:bg-[#111]">
      <div>
        <div className="flex items-center justify-between border-b border-neutral-100 pb-1.5 dark:border-white/[0.06]">
          <div className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </div>
          <span className="max-w-[130px] truncate text-[8px] font-semibold text-neutral-400">
            {template.subject || template.name}
          </span>
        </div>

        <h5 className="mt-2 line-clamp-1 text-[11px] font-bold text-neutral-900 dark:text-neutral-100">
          {template.name}
        </h5>

        <p className="mt-1 line-clamp-3 text-[9px] leading-relaxed text-neutral-500 dark:text-neutral-400">
          {template.subject || "Universal responsive layout formatted with placeholders."}
        </p>
      </div>

      <div className="pt-2">
        <span className="inline-block rounded-md bg-neutral-950 px-2.5 py-1 text-[8px] font-semibold text-white dark:bg-white dark:text-neutral-950">
          Preview Template &rarr;
        </span>
      </div>
    </div>
  );
}

function DynamicSmsPreview({ template }: { template: Template }) {
  const displayText = useMemo(() => {
    return template.body || `[${template.name}] Notification update. Reply STOP to cancel.`;
  }, [template.body, template.name]);

  return (
    <div className="absolute inset-3 flex items-center justify-center">
      <div className="w-full rounded-2xl border border-neutral-200 bg-white p-3 shadow-xs dark:border-white/[0.08] dark:bg-[#111]">
        <div className="mb-2 flex items-center gap-1.5">
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 text-[8px] text-white">
            <MessageSquare size={8} />
          </span>
          <span className="text-[9px] font-bold text-neutral-900 dark:text-neutral-100">
            SMS Preview
          </span>
        </div>

        <div className="line-clamp-4 rounded-xl rounded-br-xs bg-neutral-950 p-2.5 text-[9px] leading-relaxed text-white dark:bg-neutral-100 dark:text-neutral-950">
          {displayText}
        </div>
      </div>
    </div>
  );
}