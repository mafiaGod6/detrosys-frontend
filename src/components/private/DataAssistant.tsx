import { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  Bot,
  Check,
  Copy,
  MessageSquare,
  Sparkles,
  X,
} from "lucide-react";
import { useNavigate } from "react-router";

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
};

type PlanSlug = "none" | "free" | "basic" | "pro" | "advanced";

const suggestions = [
  "What should I work on next?",
  "Help me create a campaign",
  "Analyze my workspace",
];

const ACCESS_TOKEN_KEY = "detrosys_access_token";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8000"
).replace(/\/$/, "");

// Messages shown when credits are 0, keyed by the backend's entitlement_reason.
const EXHAUSTED_MESSAGES: Record<string, string> = {
  no_subscription: "No active plan. Choose a plan to use D.A.T.A.",
  no_period_end: "Your plan's billing period is being confirmed. Try again shortly.",
  period_ended: "Your plan period has ended. Renew to continue.",
  active: "You have used all D.A.T.A. credits for this period.",
};

function exhaustedMessage(reason: string): string {
  if (reason.startsWith("not_active")) {
    return "Your plan is not active. Check Billing for details.";
  }
  return EXHAUSTED_MESSAGES[reason] ?? "AI credits are not available right now.";
}

function normalizePlan(raw: unknown): PlanSlug {
  const val = String(raw ?? "none").toLowerCase().trim();
  if (val.includes("adv")) return "advanced";
  if (val.includes("pro")) return "pro";
  if (val.includes("basic")) return "basic";
  if (val === "free") return "free";
  return "none";
}

export function DataAssistant() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // null = not loaded (or failed). Never a guessed number.
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);
  const [creditsLoading, setCreditsLoading] = useState(false);
  const [creditsError, setCreditsError] = useState(false);
  const [planSlug, setPlanSlug] = useState<PlanSlug>("none");
  const [entitlementReason, setEntitlementReason] = useState<string>("");

  const inputRef = useRef<HTMLTextAreaElement>(null);

  const fetchCredits = async () => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!accessToken) {
      setCreditsError(true);
      setCreditsRemaining(null);
      return;
    }

    setCreditsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/billing/status`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Billing status request failed (${res.status})`);
      }

      const data = await res.json();
      const credits = Number(data?.credits);
      if (!Number.isFinite(credits)) {
        throw new Error("Billing status response has no credits value");
      }

      setPlanSlug(normalizePlan(data?.plan));
      setEntitlementReason(String(data?.entitlement_reason ?? ""));
      setCreditsRemaining(Math.max(0, Math.floor(credits)));
      setCreditsError(false);
    } catch (err) {
      console.error("Failed to load AI credits:", err);
      setCreditsRemaining(null);
      setCreditsError(true);
    } finally {
      setCreditsLoading(false);
    }
  };

  // Load on mount and every time the panel opens, so the number stays current.
  useEffect(() => {
    void fetchCredits();
  }, []);

  useEffect(() => {
    if (open) {
      void fetchCredits();
      window.setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const sendMessage = async (text = input.trim()) => {
    // Unknown credits (failed load) or zero credits: do not send.
    if (!text || creditsRemaining === null || creditsRemaining <= 0) return;

    setCreditsRemaining((prev) => (prev === null ? null : Math.max(0, prev - 1)));

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: text,
    };

    const currentHistory = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    setMessages((current) => [...current, userMessage]);
    setInput("");

    try {
      const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      const response = await fetch(`${API_BASE_URL}/ai/assistant/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          message: text,
          history: currentHistory,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.detail || "D.A.T.A. is currently unavailable.");
      }

      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: data?.response || "I could not generate a response. Please try again.",
      };

      setMessages((current) => [...current, assistantMessage]);
    } catch (error) {
      // Refund the optimistic decrement on failure.
      setCreditsRemaining((prev) => (prev === null ? null : prev + 1));

      const errorMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred. Please try again.",
      };

      setMessages((current) => [...current, errorMessage]);
    } finally {
      // Sync with the server so the number never drifts.
      void fetchCredits();
    }
  };

  const copyMessage = async (message: Message) => {
    await navigator.clipboard.writeText(message.content);
    setCopiedId(message.id);
    window.setTimeout(() => setCopiedId(null), 1500);
  };

  const isExhausted = creditsRemaining !== null && creditsRemaining <= 0;
  const creditsUnknown = creditsRemaining === null;
  const displayCredits = creditsRemaining === null ? "—" : creditsRemaining;
  const needsUpgrade = planSlug === "none" || planSlug === "free";

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open D.A.T.A."
          className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2.5 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-950 shadow-[0_10px_35px_rgba(0,0,0,0.08)] transition-all hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-[0_14px_40px_rgba(0,0,0,0.12)] dark:border-white/[0.1] dark:bg-neutral-950 dark:text-white dark:shadow-[0_10px_35px_rgba(0,0,0,0.25)] dark:hover:border-white/[0.18]"
        >
          <Sparkles size={15} strokeWidth={1.8} />
          <span>Ask D.A.T.A.</span>
        </button>
      )}

      {open && (
        <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[430px] flex-col border-l border-neutral-200 bg-[#faf9f6] shadow-[-20px_0_60px_rgba(0,0,0,0.08)] dark:border-white/[0.08] dark:bg-neutral-950 dark:shadow-[-20px_0_60px_rgba(0,0,0,0.3)]">
          <header className="flex h-[76px] shrink-0 items-center justify-between border-b border-neutral-200 px-5 dark:border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-950 text-white dark:bg-white dark:text-neutral-950">
                <Sparkles size={16} strokeWidth={1.8} />
              </div>

              <div>
                <p className="text-sm font-semibold tracking-[-0.01em] text-neutral-950 dark:text-white">
                  D.A.T.A.
                </p>
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-400 dark:text-neutral-600">
                  Detrosys AI
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white/80 px-2.5 py-1 text-xs font-medium text-neutral-600 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-neutral-300">
                <span>{creditsLoading && creditsRemaining === null ? "…" : displayCredits} credits</span>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close D.A.T.A."
                className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-950 dark:text-neutral-500 dark:hover:bg-white/[0.05] dark:hover:text-white"
              >
                <X size={17} strokeWidth={1.8} />
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto">
            {creditsError && (
              <div className="mx-5 mt-4 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
                <span>Couldn't load your AI credits.</span>
                <button
                  type="button"
                  onClick={() => void fetchCredits()}
                  className="font-semibold underline hover:opacity-80"
                >
                  Retry
                </button>
              </div>
            )}

            {isExhausted && (
              <div className="mx-5 mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                <span>{exhaustedMessage(entitlementReason)} </span>
                <button
                  type="button"
                  onClick={() => navigate("/billing")}
                  className="font-semibold underline hover:opacity-80"
                >
                  {needsUpgrade ? "Upgrade in Billing" : "Manage plan in Billing"}
                </button>
              </div>
            )}

            {messages.length === 0 ? (
              <div className="flex min-h-full flex-col justify-center px-6 py-10">
                <div className="mb-7">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-neutral-700 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-neutral-300">
                    <Bot size={21} strokeWidth={1.5} />
                  </div>

                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-400 dark:text-neutral-600">
                    Your assistant
                  </p>

                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-neutral-950 dark:text-white">
                    What can I help you with?
                  </h2>

                  <p className="mt-3 max-w-[330px] text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                    Ask D.A.T.A. about your workspace, campaigns, audiences,
                    templates or automations.
                  </p>
                </div>

                <div className="space-y-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => void sendMessage(suggestion)}
                      disabled={creditsUnknown || isExhausted}
                      className="group flex w-full items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3.5 text-left text-xs font-medium text-neutral-700 transition-all hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/[0.08] dark:bg-white/[0.02] dark:text-neutral-300 dark:hover:border-white/[0.14] dark:hover:bg-white/[0.04] dark:hover:text-white"
                    >
                      <span>{suggestion}</span>
                      <ArrowUp
                        size={14}
                        className="rotate-45 text-neutral-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-7 px-5 py-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={
                      message.role === "user"
                        ? "flex justify-end"
                        : "flex justify-start"
                    }
                  >
                    <div
                      className={
                        message.role === "user"
                          ? "max-w-[85%] rounded-2xl rounded-br-md bg-neutral-950 px-4 py-3 text-sm leading-6 text-white dark:bg-white dark:text-neutral-950"
                          : "max-w-[90%]"
                      }
                    >
                      {message.role === "assistant" && (
                        <div className="mb-2 flex items-center gap-2">
                          <Sparkles
                            size={13}
                            className="text-neutral-400"
                            strokeWidth={1.8}
                          />
                          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400 dark:text-neutral-600">
                            D.A.T.A.
                          </span>
                        </div>
                      )}

                      <p className="whitespace-pre-wrap text-sm leading-6">
                        {message.content}
                      </p>

                      {message.role === "assistant" && (
                        <button
                          type="button"
                          onClick={() => void copyMessage(message)}
                          className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-semibold text-neutral-400 transition-colors hover:text-neutral-700 dark:text-neutral-600 dark:hover:text-neutral-300"
                        >
                          {copiedId === message.id ? (
                            <>
                              <Check size={12} />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy size={12} />
                              Copy
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-neutral-200 p-4 dark:border-white/[0.08]">
            <div className="rounded-2xl border border-neutral-200 bg-white p-2 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.03]">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void sendMessage();
                  }
                }}
                placeholder={
                  creditsError
                    ? "Credits unavailable. Retry above."
                    : isExhausted
                      ? "Credits exhausted..."
                      : "Ask D.A.T.A..."
                }
                disabled={isExhausted || creditsUnknown}
                rows={2}
                className="w-full resize-none bg-transparent px-2 py-1 text-sm leading-6 text-neutral-950 outline-none placeholder:text-neutral-400 disabled:opacity-50 dark:text-white dark:placeholder:text-neutral-600"
              />

              <div className="flex items-center justify-between px-1 pt-2">
                <div className="flex items-center gap-2 text-neutral-400 dark:text-neutral-600">
                  <MessageSquare size={13} strokeWidth={1.7} />
                  <span className="text-[10px]">
                    Enter to send · Shift + Enter for new line
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => void sendMessage()}
                  disabled={!input.trim() || isExhausted || creditsUnknown}
                  aria-label="Send message"
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-950 text-white transition-all hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-30 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
                >
                  <ArrowUp size={15} strokeWidth={2} />
                </button>
              </div>
            </div>

            <p className="mt-2 text-center text-[9px] text-neutral-400 dark:text-neutral-700">
              D.A.T.A. can make mistakes. Check important information.
            </p>
          </div>
        </aside>
      )}
    </>
  );
}