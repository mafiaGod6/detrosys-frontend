import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Download,
  FileUp,
  Mail,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useNavigate } from "react-router";

type AudienceType =
  | "New"
  | "Lead"
  | "Warm Lead"
  | "Hot"
  | "Cold"
  | "Offline";

type Channel = "email" | "sms";

type ApiChannelCategory = {
  channel?: string | null;
  category?: string | null;
  engagement_score?: number | null;
};

type Contact = {
  id: string;
  name: string;
  email: string;
  phone: string;
  audience: AudienceType;
  channelCategories: ApiChannelCategory[];
};

type ApiContact = {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  channel_categories?: ApiChannelCategory[] | null;
};

type CreateMode = "manual" | "upload" | null;

const audienceTypes: AudienceType[] = [
  "New",
  "Lead",
  "Warm Lead",
  "Hot",
  "Cold",
  "Offline",
];

const initialContacts: Contact[] = [];

const ACCESS_TOKEN_KEY = "detrosys_access_token";

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);

  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  if (options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const rawBase = (
    import.meta.env.VITE_API_BASE_URL ??
    import.meta.env.VITE_API_URL ??
    "http://localhost:8000"
  ).replace(/\/$/, "");

  const serverRoot = rawBase.replace(/\/api(\/v\d+)?$/, "");
  const cleanPath = path.replace(/^\//, "");

  const candidateUrls = [
    `${serverRoot}/${cleanPath}`,
    `${serverRoot}/${cleanPath}/`,
    `${serverRoot}/api/v1/${cleanPath}`,
    `${serverRoot}/api/v1/${cleanPath}/`,
    `${serverRoot}/api/${cleanPath}`,
    `${serverRoot}/api/${cleanPath}/`,
  ];

  const uniqueUrls = Array.from(new Set(candidateUrls));
  let lastError: Error | null = null;

  for (let i = 0; i < uniqueUrls.length; i++) {
    const targetUrl = uniqueUrls[i];
    try {
      const response = await fetch(targetUrl, {
        ...options,
        headers,
      });

      if (response.status === 404 && i < uniqueUrls.length - 1) {
        continue;
      }

      if (!response.ok) {
        let message = `Request failed with status ${response.status}.`;
        try {
          const data = await response.json();
          if (typeof data?.detail === "string") {
            message = data.detail;
          } else if (typeof data?.message === "string") {
            message = data.message;
          }
        } catch {}

        const error = new Error(message) as Error & { status?: number };
        error.status = response.status;
        throw error;
      }

      if (response.status === 204) {
        return undefined as T;
      }

      return (await response.json()) as T;
    } catch (err) {
      lastError = err as Error;
      if ((err as any)?.status && (err as any).status !== 404) {
        throw err;
      }
    }
  }

  throw lastError || new Error(`Endpoint not found.`);
}

function normalizeContact(contact: ApiContact): Contact {
  const channelCategories = contact.channel_categories ?? [];
  const primaryEng = channelCategories[0];
  
  const cat = (primaryEng?.category ?? "new").trim().toLowerCase();
  
  let audience: AudienceType = "New";
  if (cat === "offline") audience = "Offline";
  else if (cat === "hot") audience = "Hot";
  else if (cat === "warm" || cat === "warm lead") audience = "Warm Lead";
  else if (cat === "lead") audience = "Lead";
  else if (cat === "cold") audience = "Cold";
  else audience = "New";

  return {
    id: String(contact.id),
    name: contact.name?.trim() || "Unnamed contact",
    email: contact.email?.trim() || "",
    phone: contact.phone?.trim() || "",
    audience: audience,
    channelCategories: channelCategories,
  };
}

function getChannelAudience(
  contact: Contact,
  channel: Channel,
): AudienceType {
  const channelCategory = contact.channelCategories.find(
    (item) => item.channel?.trim().toLowerCase() === channel,
  );

  if (!channelCategory) return "New";

  const cat = (channelCategory.category ?? "new").trim().toLowerCase();

  if (cat === "offline") return "Offline";
  if (cat === "hot") return "Hot";
  if (cat === "warm" || cat === "warm lead") return "Warm Lead";
  if (cat === "lead") return "Lead";
  if (cat === "cold") return "Cold";

  return "New";
}

export function AudiencesPage() {
  const navigate = useNavigate();

  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChannel, setSelectedChannel] = useState<Channel>("email");
  const [openAudience, setOpenAudience] = useState<string | null>("All");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createMode, setCreateMode] = useState<CreateMode>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [maxContacts, setMaxContacts] = useState<number>(250);
  const [isAtContactLimit, setIsAtContactLimit] = useState(false);
  const [planSlug, setPlanSlug] = useState<string>(() => {
    const saved = localStorage.getItem("detrosys_plan");
    return saved && saved !== "none" ? saved.toLowerCase() : "free";
  });
  const [showExpansionModal, setShowExpansionModal] = useState(false);
  const [expansionLoading, setExpansionLoading] = useState(false);

  const loadQuotaAndPlan = async () => {
    try {
      let activePlan = "free";
      const token = localStorage.getItem(ACCESS_TOKEN_KEY);

      const rawBase = (
        import.meta.env.VITE_API_BASE_URL ??
        import.meta.env.VITE_API_URL ??
        "http://localhost:8000"
      ).replace(/\/$/, "");
      const serverRoot = rawBase.replace(/\/api(\/v\d+)?$/, "");

      const statusRes = await fetch(`${serverRoot}/billing/status`, {
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (statusRes.ok) {
        const data = await statusRes.json();
        let raw = data?.plan || data?.plan_slug;
        if (typeof raw === "object" && raw !== null) {
          raw = (raw as any).slug || (raw as any).name;
        }
        const val = String(raw || "free").toLowerCase().trim();
        if (val.includes("adv")) activePlan = "advanced";
        else if (val.includes("pro")) activePlan = "pro";
        else if (val.includes("basic")) activePlan = "basic";
        else if (val === "none") activePlan = "none";
      }

      setPlanSlug(activePlan);
      localStorage.setItem("detrosys_plan", activePlan);

      if (activePlan === "advanced") {
        setMaxContacts(250000);
      } else if (activePlan === "pro") {
        setMaxContacts(50000);
      } else if (activePlan === "basic") {
        setMaxContacts(10000);
      } else if (activePlan === "none") {
        setMaxContacts(0);
      } else {
        setMaxContacts(250);
      }
      setIsAtContactLimit(false);
    } catch {
      setPlanSlug("free");
      setMaxContacts(250);
    }
  };

  const loadContacts = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await apiRequest<ApiContact[]>("/contacts");
      const loadedContacts = Array.isArray(response)
        ? response.map(normalizeContact)
        : [];

      setContacts(loadedContacts);
      setSelectedContactIds((current) => {
        const validIds = new Set(loadedContacts.map((contact) => contact.id));
        return new Set([...current].filter((id) => validIds.has(id)));
      });

      await loadQuotaAndPlan();
    } catch (error) {
      const err = error as Error & { status?: number };
      const msg = err.message || "";

      if (err.status === 404 || msg.includes("404") || msg.toLowerCase().includes("not found")) {
        setContacts([]);
        setErrorMessage(null);
        await loadQuotaAndPlan();
      } else {
        setErrorMessage(msg || "Unable to load contacts.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadContacts();
  }, []);

  const handleBuyContactSlots = async () => {
    if (planSlug === "none" || planSlug === "free") {
      navigate("/billing");
      return;
    }

    setExpansionLoading(true);
    try {
      const data = await apiRequest<{ checkout_url?: string }>(
        "/billing/addons/checkout",
        {
          method: "POST",
          body: JSON.stringify({ addon_type: "contacts_5k" }),
        },
      );

      if (data?.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Unable to initiate payment.");
    } finally {
      setExpansionLoading(false);
    }
  };

  const filteredContacts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return contacts;

    return contacts.filter(
      (contact) =>
        contact.name.toLowerCase().includes(query) ||
        contact.email.toLowerCase().includes(query) ||
        contact.phone.toLowerCase().includes(query),
    );
  }, [contacts, searchQuery]);

  const getAudienceContacts = (audience: string) => {
    if (audience === "All") return filteredContacts;
    return filteredContacts.filter(
      (contact) =>
        getChannelAudience(contact, selectedChannel) === audience,
    );
  };

  const toggleContactSelection = (contactId: string) => {
    setSelectedContactIds((current) => {
      const next = new Set(current);
      if (next.has(contactId)) next.delete(contactId);
      else next.add(contactId);
      return next;
    });
  };

  const toggleSelectAll = (contactIds: string[]) => {
    setSelectedContactIds((current) => {
      const next = new Set(current);
      const allSelected =
        contactIds.length > 0 && contactIds.every((id) => next.has(id));

      if (allSelected) {
        contactIds.forEach((id) => next.delete(id));
      } else {
        contactIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const deleteContacts = async (contactIds: string[]) => {
    if (contactIds.length === 0) return;
    setActionError(null);

    try {
      const results = await Promise.allSettled(
        contactIds.map((id) =>
          apiRequest<void>(`/contacts/${id}`, { method: "DELETE" }),
        ),
      );

      const failed = results.filter((result) => result.status === "rejected");
      if (failed.length > 0) {
        throw new Error(
          failed.length === 1
            ? "Unable to delete one contact."
            : `Unable to delete ${failed.length} contacts.`,
        );
      }

      setSelectedContactIds((current) => {
        const next = new Set(current);
        contactIds.forEach((id) => next.delete(id));
        return next;
      });

      await loadContacts();
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Unable to delete contacts.",
      );
    }
  };

  const deleteSingleContact = (contactId: string) => {
    void deleteContacts([contactId]);
  };

  const downloadContacts = () => {
    if (contacts.length === 0) return;
    const header = ["Name", "Email", "Phone", "Audience"];
    const rows = contacts.map((contact) => [
      contact.name,
      contact.email,
      contact.phone,
      contact.audience,
    ]);

    const csv = [header, ...rows]
      .map((row) =>
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "detrosys-contacts.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const openCreateModal = () => {
    if (contacts.length >= maxContacts || isAtContactLimit) {
      setShowExpansionModal(true);
      return;
    }
    setCreateMode(null);
    setCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setCreateModalOpen(false);
    setCreateMode(null);
  };

  const addContacts = (newContacts: Contact[]) => {
    setContacts((current) => [...current, ...newContacts]);
  };

  return (
    <main className="min-h-screen bg-[#f5f3ee] text-neutral-950 dark:bg-[#0d0d0d] dark:text-white">
      <div className="mx-auto w-full max-w-[1400px] px-5 pb-44 pt-8 sm:px-8 sm:pt-10 lg:px-12 lg:pb-48 lg:pt-12">
        <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--detrosys-accent,#e4572e)]" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-neutral-400 dark:text-neutral-600">
                Workspace / Audiences
              </p>
            </div>

            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.055em] text-neutral-950 sm:text-5xl lg:text-6xl dark:text-white">
              Audiences
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-6 text-neutral-500 dark:text-neutral-400">
              Keep your contacts understandable. Organise them by audience type
              when you need to, without making classification mandatory.
            </p>
          </div>

          <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
            <span className="flex items-center justify-center rounded-xl border border-neutral-200 bg-white/60 px-3.5 py-2.5 text-xs font-semibold text-neutral-600 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-neutral-400">
              {contacts.length.toLocaleString()} / {maxContacts.toLocaleString()} contacts
            </span>

            <button
              type="button"
              onClick={downloadContacts}
              disabled={contacts.length === 0}
              className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white/60 px-4 text-xs font-semibold text-neutral-700 transition hover:border-neutral-400 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-neutral-300 dark:hover:border-white/20 dark:hover:text-white"
            >
              <Download size={14} />
              <span>Download contacts</span>
            </button>

            {contacts.length >= maxContacts || isAtContactLimit ? (
              <button
                type="button"
                onClick={() => setShowExpansionModal(true)}
                className="group flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--detrosys-accent,#e4572e)] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--detrosys-accent)]/90"
              >
                <span>Expand capacity</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={openCreateModal}
                className="group flex min-h-11 items-center justify-center gap-2 rounded-xl bg-neutral-950 px-4 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:bg-white dark:text-neutral-950"
              >
                <Plus
                  size={16}
                  strokeWidth={2.2}
                  className="transition-transform duration-200 group-hover:rotate-90"
                />
                <span>Create audience</span>
              </button>
            )}
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
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search contacts..."
              className="h-12 w-full rounded-xl border border-neutral-200 bg-white/60 pl-11 pr-4 text-sm text-neutral-950 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-400 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white dark:placeholder:text-neutral-600 dark:focus:border-white/20"
            />
          </div>

          <div className="relative min-w-0">
            <select
              value={selectedChannel}
              onChange={(event) =>
                setSelectedChannel(event.target.value as Channel)
              }
              className="h-12 w-full appearance-none rounded-xl border border-neutral-200 bg-white/60 px-4 pr-10 text-xs font-medium text-neutral-700 outline-none transition-colors focus:border-neutral-400 dark:border-white/[0.08] dark:bg-[#151515] dark:text-white dark:focus:border-white/20 sm:min-w-[150px]"
              aria-label="Filter by channel"
            >
              <option value="email" className="bg-white text-neutral-900 dark:bg-[#151515] dark:text-white">Email</option>
              <option value="sms" className="bg-white text-neutral-900 dark:bg-[#151515] dark:text-white">SMS</option>
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-600"
            />
          </div>
        </div>

        {selectedContactIds.size > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white/60 px-4 py-3 dark:border-white/[0.08] dark:bg-white/[0.03]">
            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
              {selectedContactIds.size} selected
            </span>
            <button
              type="button"
              onClick={() => void deleteContacts([...selectedContactIds])}
              className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300"
            >
              <Trash2 size={14} />
              Delete selected
            </button>
          </div>
        )}

        {actionError && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
            {actionError}
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
            {errorMessage}
          </div>
        )}

        {loading ? (
          <div className="mt-8 space-y-4">
            <div className="h-14 w-full animate-pulse rounded-2xl bg-neutral-200/60 dark:bg-neutral-800/40" />
            <div className="h-14 w-full animate-pulse rounded-2xl bg-neutral-200/40 dark:bg-neutral-800/20" />
            <div className="h-14 w-full animate-pulse rounded-2xl bg-neutral-200/30 dark:bg-neutral-800/10" />
          </div>
        ) : (
          <section className="mt-8">
            <AudienceSection
              name="All"
              contacts={getAudienceContacts("All")}
              isOpen={openAudience === "All"}
              onToggle={() =>
                setOpenAudience((current) => (current === "All" ? null : "All"))
              }
              selectedContactIds={selectedContactIds}
              onToggleContact={toggleContactSelection}
              onToggleSelectAll={() =>
                toggleSelectAll(filteredContacts.map((contact) => contact.id))
              }
              selectAllVisible={
                filteredContacts.length > 0 &&
                filteredContacts.every((contact) =>
                  selectedContactIds.has(contact.id),
                )
              }
              onEditContact={setEditingContact}
              onDeleteContact={deleteSingleContact}
              selectedChannel={selectedChannel}
            />

            {audienceTypes.map((audience) => (
              <AudienceSection
                key={audience}
                name={audience}
                contacts={getAudienceContacts(audience)}
                isOpen={openAudience === audience}
                onToggle={() =>
                  setOpenAudience((current) =>
                    current === audience ? null : audience,
                  )
                }
                selectedContactIds={selectedContactIds}
                onToggleContact={toggleContactSelection}
                onToggleSelectAll={() =>
                  toggleSelectAll(
                    getAudienceContacts(audience).map((contact) => contact.id),
                  )
                }
                selectAllVisible={
                  getAudienceContacts(audience).length > 0 &&
                  getAudienceContacts(audience).every((contact) =>
                    selectedContactIds.has(contact.id),
                  )
                }
                onEditContact={setEditingContact}
                onDeleteContact={deleteSingleContact}
                selectedChannel={selectedChannel}
              />
            ))}
          </section>
        )}
      </div>

      {createModalOpen && (
        <CreateAudienceModal
          mode={createMode}
          onSelectMode={setCreateMode}
          onClose={closeCreateModal}
          onAddContacts={addContacts}
          onReload={loadContacts}
        />
      )}

      {editingContact && (
        <EditContactModal
          contact={editingContact}
          onClose={() => setEditingContact(null)}
          onSaved={async () => {
            setEditingContact(null);
            await loadContacts();
          }}
        />
      )}

      {showExpansionModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-[26px] border border-neutral-200 bg-[#f5f3ee] p-7 shadow-2xl dark:border-white/10 dark:bg-[#151515]">
            <button
              type="button"
              onClick={() => setShowExpansionModal(false)}
              className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:text-neutral-950 dark:hover:text-white"
            >
              <X size={16} />
            </button>

            <h3 className="text-xl font-semibold tracking-tight">
              Contact capacity reached
            </h3>

            <p className="mt-2 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
              You have reached your limit of {maxContacts.toLocaleString()} contacts. Add additional permanent capacity to keep importing subscribers.
            </p>

            <div className="mt-6 flex items-baseline justify-between rounded-2xl border border-neutral-200 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.04]">
              <div>
                <span className="text-sm font-semibold">+5,000 Contact Slots</span>
                <span className="block text-xs text-neutral-400">Permanent increase</span>
              </div>
              <span className="text-xl font-bold">$25.00</span>
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
              <button
                type="button"
                disabled={expansionLoading}
                onClick={() => void handleBuyContactSlots()}
                className="flex-1 rounded-xl bg-neutral-950 py-3 text-xs font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-950"
              >
                {expansionLoading ? "Processing..." : "Purchase slots"}
              </button>
              <button
                type="button"
                onClick={() => setShowExpansionModal(false)}
                className="rounded-xl border border-neutral-300 px-5 py-3 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 dark:border-white/10 dark:text-neutral-400"
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

type AudienceSectionProps = {
  name: string;
  contacts: Contact[];
  isOpen: boolean;
  onToggle: () => void;
  selectedContactIds: Set<string>;
  onToggleContact: (contactId: string) => void;
  onToggleSelectAll: () => void;
  selectAllVisible: boolean;
  onEditContact: (contact: Contact) => void;
  onDeleteContact: (contactId: string) => void;
  selectedChannel: Channel;
};

function AudienceSection({
  name,
  contacts,
  isOpen,
  onToggle,
  selectedContactIds,
  onToggleContact,
  onToggleSelectAll,
  selectAllVisible,
  onEditContact,
  onDeleteContact,
  selectedChannel,
}: AudienceSectionProps) {
  return (
    <div className="border-b border-neutral-200 dark:border-white/[0.08]">
      <button
        type="button"
        onClick={onToggle}
        className="group flex w-full items-center justify-between py-5 text-left transition-colors duration-200"
        aria-expanded={isOpen}
      >
        <div className="flex min-w-0 items-center gap-4">
          <span
            className={[
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all duration-200",
              isOpen
                ? "border-neutral-950 bg-neutral-950 text-white dark:border-white dark:bg-white dark:text-neutral-950"
                : "border-neutral-300 bg-transparent text-neutral-400 group-hover:border-neutral-500 group-hover:text-neutral-700 dark:border-white/10 dark:text-neutral-600 dark:group-hover:border-white/25 dark:group-hover:text-neutral-300",
            ].join(" ")}
          >
            {isOpen ? (
              <ChevronDown size={15} strokeWidth={2} />
            ) : (
              <ChevronRight size={15} strokeWidth={2} />
            )}
          </span>
          <span className="text-base font-semibold tracking-[-0.015em]">
            {name}
          </span>
        </div>

        <span className="ml-4 shrink-0 text-xs font-medium text-neutral-400 dark:text-neutral-600">
          {contacts.length.toLocaleString()}
        </span>
      </button>

      <div
        className={[
          "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        ].join(" ")}
      >
        <div className="overflow-hidden">
          {contacts.length > 0 ? (
            <div className="mb-5 max-h-[420px] overflow-y-auto overscroll-contain rounded-2xl border border-neutral-200 bg-white/70 dark:border-white/[0.08] dark:bg-[#121212]">
              <div className="flex items-center justify-end border-b border-neutral-200 px-5 py-2.5 dark:border-white/[0.07]">
                <button
                  type="button"
                  onClick={onToggleSelectAll}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-neutral-400 transition-colors hover:bg-neutral-200/70 hover:text-neutral-800 dark:text-neutral-500 dark:hover:bg-white/[0.06] dark:hover:text-neutral-200"
                >
                  <span
                    className={[
                      "flex h-4 w-4 items-center justify-center rounded-md border transition-all",
                      selectAllVisible
                        ? "border-neutral-950 bg-neutral-950 text-white dark:border-white dark:bg-white dark:text-neutral-950"
                        : "border-neutral-300 bg-transparent dark:border-white/15",
                    ].join(" ")}
                  >
                    {selectAllVisible && <Check size={10} strokeWidth={2.5} />}
                  </span>
                  {selectAllVisible ? "Deselect all" : "Select all"}
                </button>
              </div>

              {contacts.map((contact, index) => (
                <ContactRow
                  key={contact.id}
                  contact={contact}
                  isLast={index === contacts.length - 1}
                  selected={selectedContactIds.has(contact.id)}
                  onToggle={() => onToggleContact(contact.id)}
                  onEdit={() => onEditContact(contact)}
                  onDelete={() => onDeleteContact(contact.id)}
                  selectedChannel={selectedChannel}
                />
              ))}
            </div>
          ) : (
            <div className="mb-5 rounded-2xl border border-dashed border-neutral-300 px-6 py-10 text-center dark:border-white/10">
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                {name === "All" ? "No contacts yet." : `No contacts in ${name}.`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type ContactRowProps = {
  contact: Contact;
  isLast: boolean;
  selected: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  selectedChannel: Channel;
};

function ContactRow({
  contact,
  isLast,
  selected,
  onToggle,
  onEdit,
  onDelete,
  selectedChannel,
}: ContactRowProps) {
  
  const channelData = contact.channelCategories.find(
    (c) => c.channel?.trim().toLowerCase() === selectedChannel
  );
  
  const cat = (channelData?.category ?? "new").trim().toLowerCase();
  
  let badgeText = "New"; 
  if (cat === "offline") badgeText = "Offline";
  else if (cat === "hot") badgeText = "Hot";
  else if (cat === "warm" || cat === "warm lead") badgeText = "Warm Lead";
  else if (cat === "lead") badgeText = "Lead";
  else if (cat === "cold") badgeText = "Cold";

  return (
    <div
      className={[
        "group flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between",
        !isLast ? "border-b border-neutral-200 dark:border-white/[0.07]" : "",
      ].join(" ")}
    >
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onToggle}
          className={[
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all duration-150",
            selected
              ? "border-neutral-950 bg-neutral-950 text-white dark:border-white dark:bg-white dark:text-neutral-950"
              : "border-neutral-300 bg-transparent text-transparent hover:border-neutral-500 hover:bg-neutral-100 dark:border-white/15 dark:hover:border-white/20 dark:hover:bg-white/[0.04]",
          ].join(" ")}
        >
          {selected && <Check size={11} strokeWidth={2.5} />}
        </button>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-950 text-xs font-semibold text-white dark:bg-white dark:text-neutral-950">
          {getInitials(contact.name)}
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-neutral-950 dark:text-white">
            {contact.name}
          </p>
          <div className="mt-1 flex flex-col gap-1 text-xs text-neutral-400 dark:text-neutral-600 sm:flex-row sm:items-center sm:gap-3">
            {contact.email && (
              <span className="flex min-w-0 items-center gap-1.5 truncate">
                <Mail size={12} />
                {contact.email}
              </span>
            )}
            {contact.phone && (
              <span className="flex items-center gap-1.5">
                <Phone size={12} />
                {contact.phone}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-auto">
        <span className="rounded-full border border-neutral-200 bg-white/70 px-2.5 py-1 text-[11px] font-medium text-neutral-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-neutral-400">
          {badgeText}
        </span>

        <button
          type="button"
          onClick={onEdit}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-200 hover:text-neutral-950 dark:hover:bg-white/[0.07] dark:hover:text-white"
        >
          <Pencil size={14} />
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:text-red-300"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

type EditContactModalProps = {
  contact: Contact;
  onClose: () => void;
  onSaved: () => Promise<void>;
};

function EditContactModal({ contact, onClose, onSaved }: EditContactModalProps) {
  const [name, setName] = useState(contact.name);
  const [email, setEmail] = useState(contact.email);
  const [phone, setPhone] = useState(contact.phone);
  const [audience, setAudience] = useState<AudienceType>(contact.audience);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName) {
      setErrorMessage("Name is required.");
      return;
    }

    if (!trimmedEmail && !trimmedPhone) {
      setErrorMessage("At least an email or phone number is required.");
      return;
    }

    setSaving(true);

    try {
      await apiRequest<ApiContact>(`/contacts/${contact.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail || null,
          phone: trimmedPhone || null,
          audience: audience,
        }),
      });

      contact.audience = audience;
      await onSaved();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to update contact.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/30 px-4 py-6 backdrop-blur-[2px] dark:bg-black/60"
      role="dialog"
      aria-modal="true"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-[26px] border border-neutral-200 bg-[#f5f3ee] shadow-2xl dark:border-white/10 dark:bg-[#121212]"
      >
        <div className="flex items-start justify-between border-b border-neutral-200 px-6 py-5 dark:border-white/[0.08]">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-400 dark:text-neutral-600">
              Contact
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-[-0.035em]">
              Edit contact
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-neutral-400 transition-colors hover:bg-neutral-200 hover:text-neutral-950 dark:hover:bg-white/[0.07] dark:hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 p-6">
          {errorMessage && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
              {errorMessage}
            </div>
          )}

          <Field label="Name" value={name} placeholder="Jane Smith" onChange={setName} />
          <Field
            label="Email"
            value={email}
            placeholder="jane@example.com"
            type="email"
            onChange={setEmail}
          />
          <Field
            label="Phone"
            value={phone}
            placeholder="+91 98765 43210"
            onChange={setPhone}
          />

          <div>
            <span className="mb-1.5 block text-xs font-medium text-neutral-500 dark:text-neutral-400">
              Audience Classification
            </span>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value as AudienceType)}
              className="h-10 w-full rounded-xl border border-neutral-300 bg-white/70 px-3 text-sm text-neutral-950 outline-none transition-colors dark:border-white/10 dark:bg-[#151515] dark:text-white"
            >
              {audienceTypes.map((type) => (
                <option key={type} value={type} className="bg-white text-neutral-900 dark:bg-[#151515] dark:text-white">
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-neutral-200 px-6 py-5 dark:border-white/[0.08] sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-neutral-950 dark:hover:bg-white/[0.07] dark:hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800 dark:bg-white dark:text-neutral-950"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

type CreateAudienceModalProps = {
  mode: CreateMode;
  onSelectMode: (mode: CreateMode) => void;
  onClose: () => void;
  onAddContacts: (contacts: Contact[]) => void;
  onReload: () => Promise<void>;
};

function CreateAudienceModal({
  mode,
  onSelectMode,
  onClose,
  onAddContacts,
  onReload,
}: CreateAudienceModalProps) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 px-4 py-6 backdrop-blur-[2px] dark:bg-black/60"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[26px] border border-neutral-200 bg-[#f5f3ee] shadow-2xl dark:border-white/10 dark:bg-[#121212]">
        <div className="flex shrink-0 items-start justify-between border-b border-neutral-200 px-6 py-5 dark:border-white/[0.08] sm:px-7">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-400 dark:text-neutral-600">
              Contacts
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-[-0.035em]">
              Create audience
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-500 dark:text-neutral-400">
              Add contacts manually or import a CSV subscriber list.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-neutral-400 transition-colors hover:bg-neutral-200 hover:text-neutral-950 dark:hover:bg-white/[0.07] dark:hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 sm:p-7">
          {!mode ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => onSelectMode("manual")}
                className="group rounded-2xl border border-neutral-200 bg-white/70 p-6 text-left transition hover:border-neutral-400 hover:bg-white dark:border-white/10 dark:bg-[#171717] dark:hover:border-white/20"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-950 text-white dark:bg-white dark:text-neutral-950">
                  <Plus size={19} strokeWidth={2} />
                </div>
                <h3 className="mt-5 text-base font-semibold">Manual Add</h3>
                <p className="mt-2 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                  Add one or more contacts by name, email, or phone.
                </p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Add contacts
                  <ChevronRight size={14} />
                </span>
              </button>

              <button
                type="button"
                onClick={() => onSelectMode("upload")}
                className="group rounded-2xl border border-neutral-200 bg-white/70 p-6 text-left transition hover:border-neutral-400 hover:bg-white dark:border-white/10 dark:bg-[#171717] dark:hover:border-white/20"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-950 text-white dark:bg-white dark:text-neutral-950">
                  <Upload size={18} strokeWidth={1.9} />
                </div>
                <h3 className="mt-5 text-base font-semibold">Upload Contact List</h3>
                <p className="mt-2 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                  Import a CSV contact list with Name, Email, and Phone columns.
                </p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Upload list
                  <ChevronRight size={14} />
                </span>
              </button>
            </div>
          ) : mode === "manual" ? (
            <ManualAddForm
              onBack={() => onSelectMode(null)}
              onClose={onClose}
              onAddContacts={onAddContacts}
              onReload={onReload}
            />
          ) : (
            <UploadContactsForm
              onBack={() => onSelectMode(null)}
              onClose={onClose}
              onReload={onReload}
            />
          )}
        </div>
      </div>
    </div>
  );
}

type ManualContactRow = {
  id: number;
  name: string;
  email: string;
  phone: string;
};

type ManualAddFormProps = {
  onBack: () => void;
  onClose: () => void;
  onAddContacts: (contacts: Contact[]) => void;
  onReload: () => Promise<void>;
};

function ManualAddForm({ onBack, onClose, onAddContacts, onReload }: ManualAddFormProps) {
  const [rows, setRows] = useState<ManualContactRow[]>([
    { id: 1, name: "", email: "", phone: "" },
  ]);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const updateRow = (id: number, field: keyof Omit<ManualContactRow, "id">, value: string) => {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
  };

  const addRow = () => {
    setRows((current) => [
      ...current,
      { id: Date.now(), name: "", email: "", phone: "" },
    ]);
  };

  const removeRow = (id: number) => {
    setRows((current) => (current.length === 1 ? current : current.filter((row) => row.id !== id)));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    const validRows = rows.filter(
      (row) => row.name.trim() || row.email.trim() || row.phone.trim(),
    );

    if (validRows.length === 0) return;
    setSaving(true);

    try {
      const createdContacts: Contact[] = [];
      for (const row of validRows) {
        const response = await apiRequest<ApiContact>("/contacts", {
          method: "POST",
          body: JSON.stringify({
            name: row.name.trim() || "Unnamed contact",
            email: row.email.trim() || null,
            phone: row.phone.trim() || null,
          }),
        });

        const created = normalizeContact(response);
        createdContacts.push(created);
      }

      onAddContacts(createdContacts);
      await onReload();
      onClose();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to add contacts.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-5 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="text-xs font-semibold text-neutral-500 transition-colors hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white"
        >
          ← Back
        </button>
      </div>

      {errorMessage && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
          {errorMessage}
        </div>
      )}

      <div className="max-h-[360px] overflow-y-auto overscroll-contain rounded-2xl border border-neutral-200 dark:border-white/[0.08]">
        {rows.map((row, index) => (
          <div
            key={row.id}
            className={[
              "p-4 sm:p-5",
              index > 0 ? "border-t border-neutral-200 dark:border-white/[0.08]" : "",
            ].join(" ")}
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-400 dark:text-neutral-600">
                Contact {index + 1}
              </span>
              {rows.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  className="text-xs font-medium text-neutral-400 transition-colors hover:text-red-500"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field
                  label="Name"
                  value={row.name}
                  placeholder="Jane Smith"
                  onChange={(value) => updateRow(row.id, "name", value)}
                />
              </div>
              <Field
                label="Email"
                value={row.email}
                placeholder="jane@example.com"
                type="email"
                onChange={(value) => updateRow(row.id, "email", value)}
              />
              <Field
                label="Phone"
                value={row.phone}
                placeholder="+91 98765 43210"
                onChange={(value) => updateRow(row.id, "phone", value)}
              />
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addRow}
        className="mt-4 flex items-center gap-2 text-sm font-semibold text-neutral-600 transition-colors hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white"
      >
        <Plus size={15} />
        Add another contact
      </button>

      <div className="mt-7 flex flex-col-reverse gap-3 border-t border-neutral-200 pt-5 dark:border-white/[0.08] sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="rounded-xl px-4 py-2.5 text-sm font-semibold text-neutral-500 transition hover:bg-neutral-200 hover:text-neutral-950 dark:hover:bg-white/[0.07] dark:hover:text-white"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-950"
        >
          {saving ? "Adding..." : "Add contacts"}
        </button>
      </div>
    </form>
  );
}

type UploadContactsFormProps = {
  onBack: () => void;
  onClose: () => void;
  onReload: () => Promise<void>;
};

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];

    if (character === '"') {
      if (inQuotes && nextCharacter === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (character === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((character === "\n" || character === "\r") && !inQuotes) {
      if (character === "\r" && nextCharacter === "\n") index += 1;
      row.push(cell);
      cell = "";
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
      continue;
    }
    cell += character;
  }

  row.push(cell);
  if (row.some((value) => value.trim() !== "")) rows.push(row);
  return rows;
}

function getCsvColumnIndex(headers: string[], name: string) {
  return headers.findIndex(
    (header) =>
      header.trim().replace(/^\uFEFF/, "").toLowerCase() === name.toLowerCase(),
  );
}

function UploadContactsForm({ onBack, onClose, onReload }: UploadContactsFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setFileName(selectedFile.name);
    setErrorMessage(null);
    setProgress(0);
  };

  const handleUpload = async () => {
    if (!file || uploading) return;

    setUploading(true);
    setProgress(0);
    setErrorMessage(null);

    try {
      const text = await file.text();
      const rows = parseCsv(text);

      if (rows.length < 2) {
        throw new Error("The CSV does not contain any contacts.");
      }

      const headers = rows[0];
      const nameIndex = getCsvColumnIndex(headers, "Name");
      const emailIndex = getCsvColumnIndex(headers, "Email");
      const phoneIndex = getCsvColumnIndex(headers, "Phone");

      if (nameIndex === -1 || emailIndex === -1 || phoneIndex === -1) {
        throw new Error("CSV must contain Name, Email, and Phone columns.");
      }

      const contacts = rows
        .slice(1)
        .map((row) => ({
          name: row[nameIndex]?.trim() || "",
          email: row[emailIndex]?.trim() || "",
          phone: row[phoneIndex]?.trim() || "",
        }))
        .filter((contact) => contact.name && (contact.email || contact.phone));

      if (contacts.length === 0) {
        throw new Error(
          "No valid contacts were found. Each row needs a name and an email or phone number.",
        );
      }

      for (let index = 0; index < contacts.length; index += 1) {
        const contact = contacts[index];
        await apiRequest<ApiContact>("/contacts", {
          method: "POST",
          body: JSON.stringify({
            name: contact.name,
            email: contact.email || null,
            phone: contact.phone || null,
          }),
        });
        setProgress(Math.round(((index + 1) / contacts.length) * 100));
      }

      setProgress(100);
      await onReload();
      onClose();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to upload contacts.",
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={uploading}
          className="text-xs font-semibold text-neutral-500 transition hover:text-neutral-950 disabled:opacity-50 dark:text-neutral-400 dark:hover:text-white"
        >
          ← Back
        </button>
        <span className="text-xs text-neutral-400 dark:text-neutral-600">CSV files</span>
      </div>

      {errorMessage && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
          {errorMessage}
        </div>
      )}

      <label
        className={`group flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white/40 px-6 text-center transition hover:border-neutral-500 hover:bg-white/70 dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-white/25 ${
          uploading ? "cursor-default opacity-90" : "cursor-pointer"
        }`}
      >
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
          disabled={uploading}
          className="sr-only"
        />

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-950 text-white dark:bg-white dark:text-neutral-950">
          {fileName ? <FileUp size={19} strokeWidth={1.9} /> : <Upload size={19} strokeWidth={1.9} />}
        </div>

        <p className="mt-5 text-sm font-semibold">
          {fileName || "Choose a CSV contact list"}
        </p>
        <p className="mt-2 max-w-sm text-xs leading-5 text-neutral-400 dark:text-neutral-600">
          Use Name, Email, and Phone columns. Each contact needs a name and an email or phone number.
        </p>
        <span className="mt-5 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-neutral-600 dark:border-white/10 dark:bg-transparent dark:text-neutral-400">
          Browse files
        </span>
      </label>

      {uploading && (
        <div className="mt-5">
          <div className="h-1.5 overflow-hidden rounded-full bg-neutral-200 dark:bg-white/10">
            <div
              className="h-full rounded-full bg-neutral-950 transition-[width] duration-150 ease-out dark:bg-white"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-7 flex flex-col-reverse gap-3 border-t border-neutral-200 pt-5 dark:border-white/[0.08] sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          disabled={uploading}
          className="rounded-xl px-4 py-2.5 text-sm font-semibold text-neutral-500 transition hover:bg-neutral-200 hover:text-neutral-950 disabled:opacity-50 dark:hover:bg-white/[0.07] dark:hover:text-white"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => void handleUpload()}
          disabled={!file || uploading}
          className="rounded-xl bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-40 dark:bg-white dark:text-neutral-950"
        >
          {uploading ? "Importing..." : "Upload list"}
        </button>
      </div>
    </div>
  );
}

type FieldProps = {
  label: string;
  value: string;
  placeholder: string;
  type?: string;
  onChange: (value: string) => void;
};

function Field({ label, value, placeholder, type = "text", onChange }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-neutral-500 dark:text-neutral-400">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-neutral-200 bg-white/70 px-3 text-sm text-neutral-950 outline-none transition focus:border-neutral-400 dark:border-white/10 dark:bg-white/[0.03] dark:text-white dark:placeholder:text-neutral-600 dark:focus:border-white/20"
      />
    </label>
  );
}