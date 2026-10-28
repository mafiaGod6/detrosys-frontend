import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { MessageSquare, Sparkles, X, Loader2, Zap } from "lucide-react";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ??
  import.meta.env.VITE_API_URL ??
  "http://localhost:8000"
).replace(/\/$/, "");

const ACCESS_TOKEN_KEY = "detrosys_access_token";

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}

export function MessagingPage() {
  const navigate = useNavigate();

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [selectedCampaign] = useState<any>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isDrafting, setIsDrafting] = useState(false);

  const [creditsRemaining] = useState<number | string>("Unlimited");

  const fetchCampaigns = useCallback(async (isInitial = false) => {
    try {
      const data = await apiRequest<any[]>("/campaigns");
      
      // Forcefully fetch the exact thread counts from the messaging endpoint 
      // to bypass backend schema stripping and guarantee accurate numbers
      const enrichedCampaigns = await Promise.all(
        (data || []).map(async (c) => {
          try {
            const threads = await apiRequest<any[]>(`/messages/campaigns/${c.id}/threads`);
            return {
              ...c,
              replies: threads.length,
              last_reply: threads.length > 0 ? threads[0].updated_at : c.last_reply
            };
          } catch (e) {
            return { ...c, replies: c.replies || 0 };
          }
        })
      );

      // Show email / email+sms campaigns that have been sent or have replies
      const relevant = enrichedCampaigns.filter(
        (c) =>
          (c.replies && c.replies > 0) ||
          (c.sent && c.sent > 0) ||
          c.status === "active" ||
          c.status === "completed"
      );
      
      // Campaigns with replies first, then by most recent reply
      relevant.sort((a, b) => {
        const diff = Number(b.replies || 0) - Number(a.replies || 0);
        if (diff !== 0) return diff;
        return (
          new Date(b.last_reply || 0).getTime() - new Date(a.last_reply || 0).getTime()
        );
      });

      setCampaigns(relevant);
    } catch (err) {
      console.error("Failed to fetch campaigns", err);
      if (isInitial) setCampaigns([]);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCampaigns(true);
    const interval = window.setInterval(() => {
      void fetchCampaigns(false);
    }, 10000);
    return () => window.clearInterval(interval);
  }, [fetchCampaigns]);

  const handleRunAi = async () => {
    if (!aiPrompt.trim() || !selectedCampaign) return;
    setIsDrafting(true);

    try {
      const payload = {
        prompt: aiPrompt,
      };

      const response = await apiRequest<{ draft: string }>(`/messages/campaigns/${selectedCampaign.id}/ai-draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log("Generated Drafts:", response);

      setTimeout(() => {
        setIsDrafting(false);
        setAiModalOpen(false);
        setAiPrompt("");
        alert("Successfully generated AI drafts for all threads!");
      }, 1000);
    } catch (error) {
      console.error("AI Generation failed:", error);
      alert("Failed to generate AI drafts. Please check the backend.");
      setIsDrafting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] px-5 pb-44 pt-8 sm:px-8 sm:pt-10 lg:px-12 lg:pb-48 lg:pt-12">
      {/* HEADER */}
      <section className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--detrosys-accent,#e4572e)]" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-neutral-400 dark:text-neutral-600">
              Workspace / Communications
            </p>
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.055em] text-neutral-950 sm:text-5xl lg:text-6xl dark:text-white">
            Messaging
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-neutral-500 dark:text-neutral-400">
            Monitor incoming replies across all your campaigns and respond manually.
          </p>
        </div>
      </section>

      {/* CAMPAIGN GRID & EMPTY STATE */}
      <section className="mt-10">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-neutral-400" size={32} />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[26px] border border-dashed border-neutral-200 bg-white/30 py-24 text-center dark:border-white/[0.08] dark:bg-[#121212]/30">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400 dark:bg-white/[0.04] dark:text-neutral-500">
              <MessageSquare size={24} strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-neutral-950 dark:text-white">
              No active conversations
            </h3>
            <p className="mt-2 max-w-sm text-sm text-neutral-500 dark:text-neutral-400">
              When leads reply to your active campaigns, their email threads will appear here for you to manage.
            </p>
          </div>
        ) : (
          <div className="grid max-h-[640px] gap-6 overflow-y-auto overscroll-contain pr-1 sm:grid-cols-2 xl:grid-cols-3">
            {campaigns.map((campaign) => {
              const replyCount = Number(campaign.replies || 0);
              return (
                <div
                  key={campaign.id}
                  className="flex flex-col justify-between rounded-[26px] border border-neutral-200 bg-white/70 p-6 sm:p-8 dark:border-white/[0.08] dark:bg-[#121212]"
                >
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <h2 className="line-clamp-2 text-xl font-semibold tracking-[-0.03em] text-neutral-950 dark:text-white">
                        {campaign.name}
                      </h2>
                      {replyCount > 0 ? (
                        <span className="shrink-0 rounded-full bg-neutral-950 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white dark:bg-white dark:text-neutral-950">
                          {replyCount} {replyCount === 1 ? "Reply" : "Replies"}
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-full bg-neutral-200 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-600 dark:bg-white/[0.08] dark:text-neutral-400">
                          0 Replies
                        </span>
                      )}
                    </div>
                    <div className="mt-4 space-y-1">
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        <span className="font-medium text-neutral-700 dark:text-neutral-300">
                          Sent:
                        </span>{" "}
                        {campaign.sent ?? 0} contacts
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        <span className="font-medium text-neutral-700 dark:text-neutral-300">
                          Last reply:
                        </span>{" "}
                        {campaign.last_reply
                          ? new Date(campaign.last_reply).toLocaleString([], {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })
                          : "No replies yet"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 flex flex-col gap-2.5">
                    <button
                      type="button"
                      disabled
                      className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-neutral-100 px-4 py-2.5 text-xs font-semibold text-neutral-400 dark:border-white/[0.05] dark:bg-white/[0.02] dark:text-neutral-600"
                    >
                      <Sparkles size={14} />
                      Write with AI (Coming Soon)
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate(`/app/messaging/${campaign.id}`)}
                      className="group flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 px-4 py-2.5 text-xs font-semibold text-white transition-all duration-200 hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
                    >
                      <MessageSquare
                        size={14}
                        className="transition-transform duration-200 group-hover:scale-110"
                      />
                      Open Inbox
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* AI MODAL OVERLAY */}
      {aiModalOpen && selectedCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/40 p-4 backdrop-blur-sm dark:bg-black/60">
          <div className="w-full max-w-lg rounded-[26px] border border-neutral-200 bg-white p-6 shadow-2xl dark:border-white/[0.08] dark:bg-[#121212]">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-neutral-950 dark:text-white">
                <Sparkles size={18} className="text-[var(--detrosys-accent,#e4572e)]" />
                Auto-Draft Replies
              </h3>
              <button
                onClick={() => setAiModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-950 dark:hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              <Zap size={12} className="text-yellow-500" />
              Credits Remaining:{" "}
              <span className="text-neutral-950 dark:text-white">{creditsRemaining}</span>
            </div>

            <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
              Give Detrosys AI instructions on how to reply to the{" "}
              <strong>{selectedCampaign?.replies || 0} contacts</strong> who responded to{" "}
              <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                "{selectedCampaign?.name || ""}"
              </span>
              .
            </p>

            <textarea
              rows={4}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g. Tell everyone I'm available for a call next week and give them my calendly link..."
              className="mb-4 w-full resize-none rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-950 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-0 dark:border-white/[0.12] dark:bg-[#181818] dark:text-white dark:placeholder:text-neutral-600 dark:focus:border-white/30"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setAiModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-neutral-600 transition hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleRunAi}
                disabled={isDrafting || !aiPrompt.trim()}
                className="flex items-center gap-2 rounded-xl bg-neutral-950 px-5 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
              >
                {isDrafting ? <Loader2 size={16} className="animate-spin" /> : null}
                {isDrafting ? "Drafting..." : "Generate & Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}