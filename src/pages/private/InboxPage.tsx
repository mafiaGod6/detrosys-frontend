import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Search, Paperclip, Send, Loader2, Inbox } from "lucide-react";

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
    const errBody = await response.json().catch(() => null);
    throw new Error(errBody?.detail || `API error: ${response.status}`);
  }
  return response.json();
}

type ThreadSnippet = {
  thread_id: string;
  contact_id: string;
  contact_name: string;
  contact_email: string;
  latest_message_snippet: string;
  unread: boolean;
  updated_at: string;
  initials: string;
};

type UIMessage = {
  id: string | number;
  type: "outbound" | "inbound";
  text: string;
  subject?: string | null;
  time: string;
};

function getInitials(name: string, email: string): string {
  const clean = (name || "").trim();
  if (clean && clean !== "Unknown") {
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return clean.slice(0, 2).toUpperCase();
  }
  return (email || "U").slice(0, 2).toUpperCase();
}

function formatTime(iso?: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return iso;
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function InboxPage() {
  const navigate = useNavigate();
  const { campaignId } = useParams();

  const [threads, setThreads] = useState<ThreadSnippet[]>([]);
  const [messagesDB, setMessagesDB] = useState<Record<string, UIMessage[]>>({});
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyText, setReplyText] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchThreads = useCallback(
    async (isInitial = false) => {
      if (!campaignId) return;
      try {
        const data = await apiRequest<any[]>(
          `/messages/campaigns/${campaignId}/threads`
        );
        const mapped: ThreadSnippet[] = (data || []).map((item) => {
          const threadId = String(item.thread_id || item.id);
          const name =
            item.contact_name ||
            item.name ||
            item.contact_email ||
            item.email ||
            "Lead";
          const email = item.contact_email || item.email || "";
          return {
            thread_id: threadId,
            contact_id: String(item.contact_id || item.id),
            contact_name: name,
            contact_email: email,
            latest_message_snippet: item.latest_message_snippet || "",
            unread: Boolean(item.unread),
            updated_at: item.updated_at ? formatTime(item.updated_at) : "",
            initials: getInitials(name, email),
          };
        });

        setThreads(mapped);
        if (mapped.length > 0) {
          setActiveThreadId((prev) =>
            prev && mapped.some((t) => t.thread_id === prev) ? prev : mapped[0].thread_id
          );
        } else {
          setActiveThreadId(null);
        }
      } catch (err) {
        console.error("Failed to fetch campaign threads:", err);
        if (isInitial) setThreads([]);
      } finally {
        if (isInitial) setLoading(false);
      }
    },
    [campaignId]
  );

  const fetchThreadHistory = useCallback(async (threadId: string) => {
    try {
      const data = await apiRequest<any>(`/messages/threads/${threadId}`);
      const rawMessages: any[] = data?.messages || [];
      const mappedMessages: UIMessage[] = rawMessages.map((m) => ({
        id: m.id,
        type:
          m.sender_type === "agent" || m.sender_type === "outbound"
            ? "outbound"
            : "inbound",
        text: m.body || m.text || "",
        subject: m.subject,
        time: formatTime(m.created_at || m.sent_at),
      }));

      setMessagesDB((prev) => ({
        ...prev,
        [threadId]: mappedMessages,
      }));
    } catch (err) {
      console.error("Failed to fetch thread messages:", err);
    }
  }, []);

  useEffect(() => {
    void fetchThreads(true);
    const interval = window.setInterval(() => {
      void fetchThreads(false);
    }, 8000);
    return () => window.clearInterval(interval);
  }, [fetchThreads]);

  useEffect(() => {
    if (!activeThreadId) return;
    void fetchThreadHistory(activeThreadId);
    const interval = window.setInterval(() => {
      void fetchThreadHistory(activeThreadId);
    }, 8000);
    return () => window.clearInterval(interval);
  }, [activeThreadId, fetchThreadHistory]);

  const activeThread = threads.find((t) => t.thread_id === activeThreadId);
  const activeMessages = activeThreadId ? messagesDB[activeThreadId] || [] : [];

  const filteredThreads = threads.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.contact_name.toLowerCase().includes(q) ||
      t.contact_email.toLowerCase().includes(q) ||
      t.latest_message_snippet.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [activeMessages.length, activeThreadId]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReplyText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleSendMessage = async () => {
    if (!replyText.trim() || !activeThreadId || sending) return;

    const savedText = replyText.trim();
    const tempId = Date.now();

    const optimisticMessage: UIMessage = {
      id: tempId,
      type: "outbound",
      text: savedText,
      time: "Just now",
    };

    setMessagesDB((prev) => ({
      ...prev,
      [activeThreadId]: [...(prev[activeThreadId] || []), optimisticMessage],
    }));

    setReplyText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setSending(true);

    try {
      await apiRequest(`/messages/threads/${activeThreadId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: savedText }),
      });
      await fetchThreadHistory(activeThreadId);
      await fetchThreads(false);
    } catch (error) {
      console.error("Failed to send message via backend:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to send reply. Please check your email provider integration."
      );
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="animate-spin text-neutral-400" size={32} />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 pb-16 pt-6 sm:px-8 sm:pt-10 lg:px-12 lg:pb-24 lg:pt-12">
      <section className="mb-4 flex items-center gap-3.5 sm:mb-6 sm:gap-4">
        <button
          onClick={() => navigate("/app/messaging")}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white/60 text-neutral-500 transition-all duration-200 hover:border-neutral-400 hover:bg-white hover:text-neutral-950 sm:h-10 sm:w-10 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-neutral-500 dark:hover:border-white/20 dark:hover:bg-[#1a1a1a] dark:hover:text-white"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-[-0.03em] text-neutral-950 sm:text-2xl dark:text-white">
            Campaign Inbox
          </h1>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            Inbox & Replies
          </p>
        </div>
      </section>

      {/* RESTORED TWO-COLUMN LAYOUT */}
      <section className="flex h-[70vh] min-h-[650px] w-full flex-col overflow-hidden rounded-[22px] border border-neutral-200 bg-white/70 shadow-sm sm:rounded-[26px] lg:flex-row dark:border-white/[0.08] dark:bg-[#121212]">
        
        {/* LEFT SIDEBAR: FIXED 340px WIDTH ON DESKTOP */}
        <div className="flex max-h-[250px] w-full shrink-0 flex-col border-b border-neutral-200 bg-white/40 lg:max-h-none lg:w-[340px] lg:border-b-0 lg:border-r dark:border-white/[0.08] dark:bg-black/20">
          <div className="flex flex-col gap-3 border-b border-neutral-200 p-4 sm:p-5 dark:border-white/[0.08]">
            <h2 className="text-sm font-semibold text-neutral-950 dark:text-white">
              Replies ({filteredThreads.length})
            </h2>
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search emails..."
                className="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-9 pr-3 text-xs text-neutral-950 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none dark:border-white/[0.08] dark:bg-[#181818] dark:text-white dark:focus:border-white/30"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredThreads.length === 0 ? (
              <div className="p-6 text-center text-xs text-neutral-500">
                No replies yet. When a contact replies to this campaign, it will appear here.
              </div>
            ) : (
              filteredThreads.map((thread) => {
                const isActive = activeThreadId === thread.thread_id;
                const threadMessages = messagesDB[thread.thread_id] || [];
                const lastMessage = threadMessages[threadMessages.length - 1];

                return (
                  <button
                    key={thread.thread_id}
                    onClick={() => setActiveThreadId(thread.thread_id)}
                    className={`flex w-full items-start gap-3 border-b border-neutral-100 p-4 text-left transition-colors dark:border-white/[0.04] ${
                      isActive
                        ? "bg-neutral-100 dark:bg-white/[0.06]"
                        : "hover:bg-neutral-50 dark:hover:bg-white/[0.02]"
                    }`}
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        isActive
                          ? "bg-neutral-950 text-white dark:bg-white dark:text-neutral-950"
                          : "bg-neutral-200 text-neutral-600 dark:bg-white/[0.08] dark:text-neutral-400"
                      }`}
                    >
                      {thread.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="flex items-center gap-1.5 truncate text-sm font-semibold text-neutral-950 dark:text-white">
                          {thread.unread && !isActive && (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--detrosys-accent,#e4572e)]" />
                          )}
                          <span className="truncate">{thread.contact_name}</span>
                        </h4>
                        <span className="shrink-0 text-[10px] text-neutral-400 dark:text-neutral-500">
                          {lastMessage?.time?.split(",")[0] || thread.updated_at.split(",")[0] || ""}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs font-medium text-neutral-700 dark:text-neutral-300">
                        {thread.contact_email}
                      </p>
                      <p className="mt-1 line-clamp-1 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                        {lastMessage?.text?.replace(/\n/g, " ") ||
                          thread.latest_message_snippet?.replace(/\n/g, " ") ||
                          "No messages yet."}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANE: STANDARD EMAIL THREAD VIEW */}
        {activeThread ? (
          <div className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-transparent">
            <div className="flex h-[64px] shrink-0 items-center gap-3 border-b border-neutral-200 bg-white/50 px-4 sm:h-[72px] sm:px-6 dark:border-white/[0.08] dark:bg-black/10">
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold text-neutral-950 sm:text-lg dark:text-white">
                  {activeThread.contact_name}
                  <span className="hidden sm:inline"> — {activeThread.contact_email}</span>
                </h3>
                <p className="truncate text-[11px] text-neutral-500 sm:hidden">
                  {activeThread.contact_email}
                </p>
              </div>
            </div>

            <div className="flex flex-1 flex-col overflow-y-auto bg-[#faf9f7] dark:bg-transparent">
              <div className="flex flex-col gap-3 p-4 sm:gap-4 sm:p-6">
                {activeMessages.map((msg) => {
                  const isOutbound = msg.type === "outbound";
                  return (
                    <div key={msg.id} className="flex gap-2.5 sm:gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-[10px] font-bold text-neutral-600 sm:h-10 sm:w-10 sm:text-xs dark:bg-white/[0.08] dark:text-neutral-300">
                        {isOutbound ? "YOU" : activeThread.initials}
                      </div>
                      <div className="min-w-0 flex-1 rounded-xl border border-neutral-200 bg-white p-3.5 shadow-sm sm:p-5 dark:border-white/[0.08] dark:bg-[#181818]">
                        <div className="mb-2.5 flex flex-col gap-1 sm:mb-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <span className="block truncate text-xs font-semibold text-neutral-950 sm:inline sm:text-sm dark:text-white">
                              {isOutbound ? "You (via Detrosys)" : activeThread.contact_name}
                            </span>
                            <span className="block truncate text-[11px] text-neutral-500 sm:ml-2 sm:inline sm:text-xs">
                              {isOutbound ? "" : activeThread.contact_email}
                            </span>
                          </div>
                          <span className="shrink-0 text-[10px] text-neutral-400 sm:text-xs">
                            {msg.time}
                          </span>
                        </div>
                        <div className="break-words whitespace-pre-wrap text-xs leading-relaxed text-neutral-800 sm:text-sm dark:text-neutral-300">
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} className="h-1 shrink-0" />
              </div>
            </div>

            {/* Standard Email Reply Block */}
            <div className="shrink-0 border-t border-neutral-200 bg-[#faf9f7] p-3 sm:p-5 dark:border-white/[0.08] dark:bg-transparent">
              <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm focus-within:border-neutral-400 focus-within:ring-1 focus-within:ring-neutral-400 dark:border-white/[0.08] dark:bg-[#181818]">
                <div className="border-b border-neutral-100 px-3.5 py-2 sm:px-4 dark:border-white/[0.04]">
                  <span className="block truncate text-xs font-medium text-neutral-500">
                    To: {activeThread.contact_email}
                  </span>
                </div>
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={replyText}
                  onChange={handleTextChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void handleSendMessage();
                    }
                  }}
                  placeholder="Write your reply..."
                  className="max-h-40 min-h-[44px] w-full resize-none overflow-y-auto bg-transparent px-3.5 py-2.5 text-sm text-neutral-950 outline-none transition-all duration-100 ease-out placeholder:text-neutral-400 sm:max-h-48 sm:px-4 sm:py-3 dark:text-white dark:placeholder:text-neutral-600"
                />
                <div className="flex items-center justify-between border-t border-neutral-100 bg-neutral-50 px-3.5 py-2.5 sm:px-4 sm:py-3 dark:border-white/[0.04] dark:bg-white/[0.02]">
                  <button className="text-neutral-400 transition hover:text-neutral-600 dark:hover:text-white">
                    <Paperclip size={16} />
                  </button>
                  <button
                    onClick={() => void handleSendMessage()}
                    disabled={!replyText.trim() || sending}
                    className="flex items-center gap-2 rounded-lg bg-neutral-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50 sm:px-5 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
                  >
                    {sending ? "Sending..." : "Send Reply"}
                    <Send size={14} className="-mr-1" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center p-6 text-center text-neutral-400">
            <Inbox size={48} className="mb-4 text-neutral-300 dark:text-neutral-600" />
            <p className="text-sm">Select a thread to view</p>
          </div>
        )}
      </section>
    </div>
  );
}