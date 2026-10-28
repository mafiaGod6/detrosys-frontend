import { useEffect, useState } from "react";
import { ArrowDown, ArrowRight, ExternalLink, Info, X } from "lucide-react";
import { SETUP_GUIDES, type ProviderId } from "./setupGuides";

// The "i" button and its popup. The popup shows a flow strip at the top
// (short labels joined by arrows), then each step as a card with arrows
// between the cards and the full list of points.

export function SetupGuideButton({ provider }: { provider: ProviderId }) {
  const [open, setOpen] = useState(false);
  const guide = SETUP_GUIDES[provider];

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`How to set up ${guide.label}`}
        className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-300 text-neutral-500 transition hover:border-neutral-950 hover:text-neutral-950 dark:border-white/15 dark:text-neutral-400 dark:hover:border-white dark:hover:text-white"
      >
        <Info size={14} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-neutral-950/45 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="setup-guide-title"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="relative flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-[26px] border border-neutral-200 bg-[#f5f3ee] shadow-2xl dark:border-white/10 dark:bg-[#121212]">
            {/* HEADER */}
            <div className="flex shrink-0 items-start justify-between border-b border-neutral-200 px-6 py-5 dark:border-white/[0.08]">
              <div className="pr-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                  Setup guide
                </p>
                <h3
                  id="setup-guide-title"
                  className="mt-1 text-xl font-semibold tracking-tight text-neutral-950 dark:text-white"
                >
                  {guide.label}
                </h3>
                <p className="mt-2 text-xs leading-5 text-neutral-500 dark:text-neutral-400">
                  {guide.summary}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close guide"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-400 hover:text-neutral-950 dark:hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-6">
              {/* FLOW STRIP */}
              <div className="flex flex-wrap items-center gap-2">
                {guide.steps.map((step, index) => (
                  <div key={step.title} className="flex items-center gap-2">
                    <span className="rounded-full border border-neutral-300 bg-white/70 px-3 py-1 text-[11px] font-semibold text-neutral-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-neutral-300">
                      {index + 1}. {step.short}
                    </span>
                    {index < guide.steps.length - 1 && (
                      <ArrowRight
                        size={13}
                        className="shrink-0 text-neutral-400 dark:text-neutral-600"
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* DETAILED STEPS */}
              <ol className="mt-7">
                {guide.steps.map((step, index) => (
                  <li key={step.title}>
                    <div className="rounded-2xl border border-neutral-200 bg-white/70 p-5 dark:border-white/[0.08] dark:bg-white/[0.02]">
                      <div className="flex items-start gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-[12px] font-bold text-white dark:bg-white dark:text-neutral-950">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-neutral-950 dark:text-white">
                            {step.title}
                          </p>
                          <ul className="mt-3 space-y-2">
                            {step.points.map((point) => (
                              <li
                                key={point}
                                className="flex gap-2 text-xs leading-5 text-neutral-600 dark:text-neutral-400"
                              >
                                <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-neutral-400 dark:bg-neutral-600" />
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                          {step.tip && (
                            <p className="mt-3 rounded-xl bg-neutral-950/[0.04] px-3 py-2 text-[11px] leading-5 text-neutral-600 dark:bg-white/[0.04] dark:text-neutral-300">
                              <span className="font-semibold">Tip: </span>
                              {step.tip}
                            </p>
                          )}
                          {step.link && (
                            <a
                              href={step.link.href}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-neutral-700 underline underline-offset-2 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white"
                            >
                              {step.link.label}
                              <ExternalLink size={11} />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {index < guide.steps.length - 1 && (
                      <div className="flex justify-center py-2 text-neutral-400 dark:text-neutral-600">
                        <ArrowDown size={18} />
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            </div>

            {guide.note && (
              <div className="shrink-0 border-t border-neutral-200 px-6 py-4 text-xs leading-5 text-neutral-600 dark:border-white/[0.08] dark:text-neutral-400">
                {guide.note}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
