import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Check,
  ChevronDown,
  Copy,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  MessageSquare,
  Power,
  Save,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import { SettingsNavigation } from "../../components/private/SettingsNavigation";
import { SetupGuideButton } from "../../pages/private/SetupGuide";
import type { ProviderId } from "../../pages/private/setupGuides";

export type ChannelType = "email" | "sms";

export type EmailProviderType =
  | "brevo"
  | "mailgun"
  | "resend"
  | "sendgrid"
  | "ses";

export type SmsProviderType = "twilio";

export type IntegrationResponse = {
  id: string;
  user_id: string;
  channel: ChannelType;
  provider: EmailProviderType | SmsProviderType;
  is_active: boolean;
  connected_sender?: string;
  masked_key?: string;
  safe_fields?: Record<string, string>;
  created_at?: string;
  updated_at?: string;
};

type ProviderField = {
  key: string;
  label: string;
  placeholder: string;
  type?: "text" | "password";
};

const EMAIL_PROVIDERS = [
  {
    value: "brevo",
    label: "Brevo",
    fields: [
      {
        key: "api_key",
        label: "API key",
        placeholder: "Enter your Brevo API key",
        type: "password" as const,
      },
      {
        key: "from_email",
        label: "Verified sender email",
        placeholder: "sender@yourcompany.com",
      },
    ],
  },
  {
    value: "mailgun",
    label: "Mailgun",
    fields: [
      {
        key: "api_key",
        label: "API key",
        placeholder: "Enter your Mailgun API key",
        type: "password" as const,
      },
      {
        key: "domain",
        label: "Sending domain",
        placeholder: "mg.yourcompany.com",
      },
      {
        key: "from_email",
        label: "Verified sender email",
        placeholder: "sender@yourcompany.com",
      },
      {
        key: "region",
        label: "Region (us / eu)",
        placeholder: "us",
      },
    ],
  },
  {
    value: "resend",
    label: "Resend",
    fields: [
      {
        key: "api_key",
        label: "API key",
        placeholder: "Enter your Resend API key",
        type: "password" as const,
      },
      {
        key: "from_email",
        label: "Verified sender email",
        placeholder: "sender@yourcompany.com",
      },
    ],
  },
  {
    value: "sendgrid",
    label: "SendGrid",
    fields: [
      {
        key: "api_key",
        label: "API key",
        placeholder: "Enter your SendGrid API key",
        type: "password" as const,
      },
      {
        key: "from_email",
        label: "Verified sender email",
        placeholder: "sender@yourcompany.com",
      },
    ],
  },
  {
    value: "ses",
    label: "Amazon SES",
    fields: [
      {
        key: "access_key_id",
        label: "AWS Access Key ID",
        placeholder: "Enter your AWS access key ID",
      },
      {
        key: "secret_access_key",
        label: "AWS Secret Access Key",
        placeholder: "Enter your AWS secret access key",
        type: "password" as const,
      },
      {
        key: "region",
        label: "AWS Region",
        placeholder: "e.g. ap-south-1",
      },
      {
        key: "from_email",
        label: "Verified sender email",
        placeholder: "sender@yourcompany.com",
      },
    ],
  },
] as const;

const SMS_PROVIDERS = [
  {
    value: "twilio",
    label: "Twilio",
    fields: [
      {
        key: "account_sid",
        label: "Account SID",
        placeholder: "Enter your Twilio Account SID",
      },
      {
        key: "auth_token",
        label: "Auth Token",
        placeholder: "Enter your Twilio auth token",
        type: "password" as const,
      },
      {
        key: "from_phone_number",
        label: "Twilio phone number",
        placeholder: "+1 555 000 0000",
      },
    ],
  },
] as const;

const PROVIDER_LABELS: Record<string, string> = {
  brevo: "Brevo",
  mailgun: "Mailgun",
  resend: "Resend",
  sendgrid: "SendGrid",
  ses: "Amazon SES",
  twilio: "Twilio",
};

type Values = Record<string, string>;

const ACCESS_TOKEN_KEY = "detrosys_access_token";
const VERIFIED_IDS_STORAGE_KEY = "detrosys_verified_integrations";

const RAW_API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000"
).replace(/\/$/, "");

const SERVER_ROOT = RAW_API_BASE.replace(/\/api(\/v\d+)?$/, "");

async function fetchWithFallback(path: string, init?: RequestInit): Promise<Response> {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const primaryUrl = `${RAW_API_BASE}${cleanPath}`;
  const res = await fetch(primaryUrl, init);

  if (res.status !== 404) {
    return res;
  }

  const altUrl = cleanPath.startsWith("/api/v1")
    ? `${SERVER_ROOT}${cleanPath.replace(/^\/api\/v1/, "")}`
    : `${SERVER_ROOT}/api/v1${cleanPath}`;

  return fetch(altUrl, init);
}

function ProviderSelect({
  value,
  onChange,
  disabled = false,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  options: readonly { value: string; label: string }[];
}) {
  if (options.length === 1) {
    return (
      <div className="flex h-12 w-full items-center justify-between rounded-xl border border-neutral-200 bg-white/60 px-4 text-sm font-medium text-neutral-950 dark:border-white/[0.08] dark:bg-[#141414] dark:text-white">
        <span>{options[0].label}</span>
        <span className="rounded-md bg-neutral-200/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-600 dark:bg-white/10 dark:text-neutral-300">
          Default SMS Gateway
        </span>
      </div>
    );
  }

  return (
    <div className="relative">
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full appearance-none rounded-xl border border-neutral-200 bg-white/60 px-4 pr-10 text-sm font-medium text-neutral-950 outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/[0.08] dark:bg-[#141414] dark:text-white"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-white text-neutral-950 dark:bg-[#141414] dark:text-white">
            {option.label}
          </option>
        ))}
      </select>

      <ChevronDown
        size={15}
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400"
      />
    </div>
  );
}

function NoAutofillInput({
  field,
  value,
  maskedPlaceholder,
  disabled,
  onChange,
}: {
  field: ProviderField;
  value: string;
  maskedPlaceholder?: string;
  disabled: boolean;
  onChange: (val: string) => void;
}) {
  const [unlocked, setUnlocked] = useState(false);

  const isSecret = field.type === "password";
  const displayValue =
    isSecret && !unlocked && !value && maskedPlaceholder
      ? maskedPlaceholder
      : value;

  return (
    <input
      type={isSecret && unlocked ? "password" : "text"}
      name={`detrosys_${field.key}_noautofill`}
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck={false}
      data-lpignore="true"
      data-1p-ignore="true"
      data-form-type="other"
      readOnly={!unlocked}
      onFocus={() => setUnlocked(true)}
      onClick={() => setUnlocked(true)}
      onBlur={() => {
        if (!value) setUnlocked(false);
      }}
      value={displayValue}
      placeholder={maskedPlaceholder || field.placeholder}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className="mt-2 h-11 w-full rounded-xl border border-neutral-200 bg-white/60 px-4 text-sm text-neutral-950 outline-none placeholder:text-neutral-400 focus:border-neutral-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white dark:placeholder:text-neutral-500"
    />
  );
}

function Section({
  title,
  icon: Icon,
  provider,
  providers,
  fields,
  values,
  maskedKeyHint,
  setValue,
  initialized,
  initializing,
  saved,
  saving,
  isConfigured,
  disabled = false,
  onProviderChange,
  onInitialize,
  onSave,
  error,
  statusMessage,
}: {
  title: string;
  icon: typeof Mail;
  provider: string;
  providers: readonly { value: string; label: string }[];
  fields: readonly ProviderField[];
  values: Values;
  maskedKeyHint?: string;
  setValue: (key: string, value: string) => void;
  initialized: boolean;
  initializing: boolean;
  saved: boolean;
  saving: boolean;
  isConfigured: boolean;
  disabled?: boolean;
  onProviderChange: (value: string) => void;
  onInitialize: () => void;
  onSave: () => void;
  error?: string | null;
  statusMessage?: string | null;
}) {
  const isBusy = initializing || saving;

  return (
    <section className="border-t border-neutral-200 pt-8 dark:border-white/[0.08]">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-500 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-neutral-400">
          <Icon size={17} />
        </div>

        <div>
          <div className="flex items-center gap-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-600">
              Channel
            </p>
            {isConfigured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold tracking-wide text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                <Check size={10} strokeWidth={2.5} /> Active
              </span>
            )}
          </div>

          <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-neutral-950 dark:text-white">
            {title}
          </h2>

          <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-600">
            {providers.length === 1
              ? `Configure your ${providers[0].label} credentials to deliver ${title.toLowerCase()}.`
              : `Choose the provider used to deliver ${title.toLowerCase()}.`}
          </p>
        </div>
      </div>

      <form
        autoComplete="off"
        onSubmit={(e) => e.preventDefault()}
        className="mt-7 max-w-2xl"
      >
        <label className="block">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400 dark:text-neutral-600">
              Provider
            </span>
            <SetupGuideButton provider={provider as ProviderId} />
          </div>

          <div className="mt-2">
            <ProviderSelect
              value={provider}
              disabled={disabled || isBusy}
              onChange={(value) => onProviderChange(value)}
              options={providers}
            />
          </div>
        </label>

        <div className="mt-5 border-l border-neutral-200 pl-5 dark:border-white/[0.08]">
          <div className="flex items-center gap-2">
            <KeyRound size={14} className="text-neutral-400" />
            <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              {providers.find((item) => item.value === provider)?.label} credentials
            </p>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            {fields.map((field) => (
              <label key={field.key} className="block">
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400 dark:text-neutral-600">
                  {field.label}
                </span>

                <NoAutofillInput
                  field={field}
                  value={values[field.key] ?? ""}
                  maskedPlaceholder={
                    field.type === "password" ? maskedKeyHint : undefined
                  }
                  disabled={disabled || isBusy}
                  onChange={(val) => setValue(field.key, val)}
                />
              </label>
            ))}
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-500/20 dark:bg-red-500/5 dark:text-red-300">
              {error}
            </div>
          )}

          {!error && statusMessage && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
              {statusMessage}
            </div>
          )}

          <div className="mt-6 flex justify-end">
            {!initialized ? (
              <button
                type="button"
                disabled={isBusy || disabled}
                onClick={onInitialize}
                className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-xs font-semibold text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-neutral-300 dark:hover:border-white/25 dark:hover:text-white"
              >
                {initializing ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <ShieldCheck size={14} />
                )}
                {initializing ? "Initializing..." : "Initialize"}
              </button>
            ) : (
              <button
                type="button"
                disabled={isBusy || disabled}
                onClick={onSave}
                className="inline-flex items-center gap-2 rounded-xl bg-neutral-950 px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
              >
                {saving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : saved ? (
                  <Check size={14} />
                ) : (
                  <Save size={14} />
                )}
                {saving ? "Saving..." : saved ? "Saved" : "Save"}
              </button>
            )}
          </div>
        </div>
      </form>
    </section>
  );
}

function formatMaskedKeyDisplay(rawMask?: string): string {
  if (!rawMask) return "••••••••••••••••";
  for (const sep of ["_", "-", "."]) {
    const idx = rawMask.indexOf(sep);
    if (idx > 1 && idx <= 8) {
      return `${rawMask.slice(0, idx + 1)}••••••••••••`;
    }
  }
  const bulletIdx = rawMask.indexOf("•");
  if (bulletIdx > 0) {
    return `${rawMask.slice(0, Math.min(bulletIdx, 3))}••••••••••••`;
  }
  return "••••••••••••••••";
}

export function SettingsIntegrationsPage() {
  const [email, setEmail] = useState<EmailProviderType>("brevo");
  const sms: SmsProviderType = "twilio";

  const [emailValues, setEmailValues] = useState<Values>({});
  const [smsValues, setSmsValues] = useState<Values>({});

  const [emailInitialized, setEmailInitialized] = useState(false);
  const [smsInitialized, setSmsInitialized] = useState(false);

  const [initializingChannel, setInitializingChannel] = useState<ChannelType | null>(null);
  const [savingChannel, setSavingChannel] = useState<ChannelType | null>(null);
  const [saved, setSaved] = useState<ChannelType | null>(null);

  const [emailError, setEmailError] = useState<string | null>(null);
  const [smsError, setSmsError] = useState<string | null>(null);
  const [emailStatusMsg, setEmailStatusMsg] = useState<string | null>(null);
  const [smsStatusMsg, setSmsStatusMsg] = useState<string | null>(null);

  const [integrations, setIntegrations] = useState<IntegrationResponse[]>([]);
  const [isNoPlan, setIsNoPlan] = useState<boolean>(false);

  const [verifiedIds, setVerifiedIds] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem(VERIFIED_IDS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const markIdVerified = (id: string) => {
    setVerifiedIds((prev) => {
      const next = { ...prev, [id]: true };
      try {
        localStorage.setItem(VERIFIED_IDS_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const [rowActionId, setRowActionId] = useState<string | null>(null);
  const [tableBanner, setTableBanner] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlan() {
      const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (!accessToken) return;

      try {
        const res = await fetchWithFallback("/billing/status", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
          },
        });
        if (res.ok) {
          const data = await res.json();
          let raw = data?.plan || data?.plan_slug;
          if (typeof raw === "object" && raw !== null) {
            raw = (raw as any).slug || (raw as any).name;
          }
          const val = String(raw || "free").toLowerCase().trim();
          setIsNoPlan(val === "none");
        }
      } catch {}
    }

    void fetchPlan();
  }, []);

  const populateSavedFieldsForProvider = (
    list: IntegrationResponse[],
    channel: ChannelType,
    providerSlug: string,
  ) => {
    const match = list.find(
      (item) => item.channel === channel && item.provider === providerSlug,
    );
    if (match?.safe_fields) {
      if (channel === "email") {
        setEmailValues((prev) => ({ ...match.safe_fields, ...prev }));
      } else {
        setSmsValues((prev) => ({ ...match.safe_fields, ...prev }));
      }
    }
  };

  const loadIntegrations = async () => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!accessToken) return;

    try {
      const response = await fetchWithFallback("/integrations/", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) return;

      const data: IntegrationResponse[] = await response.json();
      setIntegrations(data);

      const activeEmail = data.find((i) => i.channel === "email" && i.is_active);
      if (activeEmail && EMAIL_PROVIDERS.some((p) => p.value === activeEmail.provider)) {
        const prov = activeEmail.provider as EmailProviderType;
        setEmail(prov);
        if (activeEmail.safe_fields) {
          setEmailValues(activeEmail.safe_fields);
        }
      } else {
        populateSavedFieldsForProvider(data, "email", email);
      }

      const activeSms = data.find(
        (i) => i.channel === "sms" && i.provider === "twilio",
      );
      if (activeSms?.safe_fields) {
        setSmsValues(activeSms.safe_fields);
      }
    } catch {}
  };

  useEffect(() => {
    void loadIntegrations();
  }, []);

  const emailDefinition = useMemo(
    () => EMAIL_PROVIDERS.find((provider) => provider.value === email)!,
    [email],
  );

  const smsDefinition = SMS_PROVIDERS[0];

  const currentEmailRecord = useMemo(
    () =>
      integrations.find(
        (i) => i.channel === "email" && i.provider === email,
      ),
    [integrations, email],
  );

  const currentSmsRecord = useMemo(
    () =>
      integrations.find(
        (i) => i.channel === "sms" && i.provider === "twilio",
      ),
    [integrations],
  );

  const isEmailConfigured = Boolean(currentEmailRecord?.is_active);
  const isSmsConfigured = Boolean(currentSmsRecord?.is_active);

  const collectCredentials = (channel: ChannelType): Record<string, string> | null => {
    const rawCredentials = channel === "email" ? emailValues : smsValues;
    const requiredFields =
      channel === "email" ? emailDefinition.fields : smsDefinition.fields;

    const credentials: Record<string, string> = {};
    for (const field of requiredFields) {
      const val = (rawCredentials[field.key] || "").trim();
      if (!val) {
        const errMsg = `Please enter "${field.label}" before initializing.`;
        if (channel === "email") setEmailError(errMsg);
        else setSmsError(errMsg);
        return null;
      }
      credentials[field.key] = val;
    }
    return credentials;
  };

  const initialize = async (channel: ChannelType) => {
    if (isNoPlan) {
      const msg = "An active plan (Free or paid) is required to connect sending infrastructure.";
      if (channel === "email") setEmailError(msg);
      if (channel === "sms") setSmsError(msg);
      return;
    }

    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!accessToken) {
      const msg = "Your session expired. Please sign in again.";
      if (channel === "email") setEmailError(msg);
      if (channel === "sms") setSmsError(msg);
      return;
    }

    if (channel === "email") {
      setEmailError(null);
      setEmailStatusMsg(null);
    } else {
      setSmsError(null);
      setSmsStatusMsg(null);
    }

    const credentials = collectCredentials(channel);
    if (!credentials) return;

    setInitializingChannel(channel);
    const provider = channel === "email" ? email : sms;

    try {
      const response = await fetchWithFallback("/integrations/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          channel,
          provider,
          credentials,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.detail || "Initialization failed. Please check your credentials.",
        );
      }

      if (channel === "email") {
        setEmailInitialized(true);
        setEmailStatusMsg(
          data?.message ||
            "Initialized! A verification email was sent. Click Save to activate.",
        );
      } else {
        setSmsInitialized(true);
        setSmsStatusMsg(
          data?.message || "Twilio SMS credentials initialized! Click Save to activate.",
        );
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Provider initialization failed.";
      if (channel === "email") {
        setEmailInitialized(false);
        setEmailError(message);
      } else {
        setSmsInitialized(false);
        setSmsError(message);
      }
    } finally {
      setInitializingChannel(null);
    }
  };

  const save = async (channel: ChannelType) => {
    const isReady = channel === "email" ? emailInitialized : smsInitialized;
    if (!isReady) {
      await initialize(channel);
      return;
    }

    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!accessToken) return;

    const credentials = collectCredentials(channel);
    if (!credentials) return;

    setSavingChannel(channel);
    if (channel === "email") setEmailError(null);
    if (channel === "sms") setSmsError(null);

    const provider = channel === "email" ? email : sms;

    try {
      const response = await fetchWithFallback("/integrations/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          channel,
          provider,
          credentials,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.detail || "Failed to save provider credentials.");
      }

      if (data?.id) {
        markIdVerified(String(data.id));
      }

      await loadIntegrations();

      if (channel === "email") {
        setEmailValues((prev) => {
          const next = { ...prev };
          delete next.api_key;
          delete next.secret_access_key;
          return next;
        });
        setEmailStatusMsg("Provider saved and active for Campaigns & Automations.");
      } else {
        setSmsValues((prev) => {
          const next = { ...prev };
          delete next.auth_token;
          return next;
        });
        setSmsStatusMsg("Twilio SMS provider saved and active for Campaigns & Automations.");
      }

      setSaved(channel);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save credentials.";
      if (channel === "email") setEmailError(message);
      if (channel === "sms") setSmsError(message);
    } finally {
      setSavingChannel(null);
    }
  };

  const handleVerifyRow = async (item: IntegrationResponse) => {
    if (verifiedIds[item.id]) return;

    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!accessToken) return;

    setRowActionId(item.id);
    setTableBanner(null);

    try {
      const res = await fetchWithFallback(`/integrations/${item.id}/verify`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.detail || "Provider verification failed.");
      }
      markIdVerified(item.id);
      setTableBanner({
        type: "success",
        text: data?.message || `${PROVIDER_LABELS[item.provider] || item.provider} verified successfully.`,
      });
    } catch (err) {
      setTableBanner({
        type: "error",
        text: err instanceof Error ? err.message : "Verification check failed.",
      });
    } finally {
      setRowActionId(null);
    }
  };

  const handleActivateRow = async (item: IntegrationResponse) => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!accessToken) return;

    setRowActionId(item.id);
    setTableBanner(null);

    try {
      const res = await fetchWithFallback(`/integrations/${item.id}/activate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.detail || "Unable to activate integration.");
      }
      await loadIntegrations();
      setTableBanner({
        type: "success",
        text: `${PROVIDER_LABELS[item.provider] || item.provider} is now your active ${item.channel.toUpperCase()} provider.`,
      });
    } catch (err) {
      setTableBanner({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to switch active provider.",
      });
    } finally {
      setRowActionId(null);
    }
  };

  const handleDeleteRow = async (item: IntegrationResponse) => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!accessToken) return;

    setRowActionId(item.id);
    setTableBanner(null);

    try {
      const res = await fetchWithFallback(`/integrations/${item.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail || "Unable to remove integration.");
      }
      setIntegrations((curr) => curr.filter((i) => i.id !== item.id));
      setTableBanner({
        type: "success",
        text: `${PROVIDER_LABELS[item.provider] || item.provider} credentials removed.`,
      });
    } catch (err) {
      setTableBanner({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to delete integration.",
      });
    } finally {
      setRowActionId(null);
    }
  };

  const handleCopySender = (id: string, text?: string) => {
    if (!text || text === "—") return;
    void navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <div className="mx-auto w-full max-w-[1180px] pb-24">
      <header className="max-w-2xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-neutral-400 dark:text-neutral-600">
          Settings / Integrations
        </p>

        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.055em] text-neutral-950 sm:text-5xl dark:text-white">
          Integrations
        </h1>

        <p className="mt-4 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
          Choose the provider behind each communication channel, initialize your
          credentials to verify the connection, and save to activate sending.
        </p>
      </header>

      {isNoPlan && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
          <Lock size={18} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Provider Connections Locked</p>
            <p className="mt-1 text-xs">
              You must activate a plan (such as the Free Sandbox or any paid plan) before connecting API credentials.
            </p>
          </div>
        </div>
      )}

      <div className="mt-8">
        <SettingsNavigation />
      </div>

      <div className="mt-4 space-y-10">
        <Section
          title="Email"
          icon={Mail}
          provider={email}
          providers={EMAIL_PROVIDERS}
          fields={emailDefinition.fields}
          values={emailValues}
          maskedKeyHint={
            currentEmailRecord
              ? formatMaskedKeyDisplay(currentEmailRecord.masked_key)
              : undefined
          }
          disabled={isNoPlan}
          setValue={(key, value) => {
            setEmailValues((current) => ({
              ...current,
              [key]: value,
            }));
            setEmailInitialized(false);
            setSaved((prev) => (prev === "email" ? null : prev));
            setEmailError(null);
            setEmailStatusMsg(null);
          }}
          initialized={emailInitialized}
          initializing={initializingChannel === "email"}
          saved={saved === "email"}
          saving={savingChannel === "email"}
          isConfigured={isEmailConfigured}
          error={emailError}
          statusMessage={emailStatusMsg}
          onProviderChange={(value) => {
            const nextProv = value as EmailProviderType;
            setEmail(nextProv);
            const savedMatch = integrations.find(
              (i) => i.channel === "email" && i.provider === nextProv,
            );
            setEmailValues(savedMatch?.safe_fields ?? {});
            setEmailInitialized(false);
            setSaved((prev) => (prev === "email" ? null : prev));
            setEmailError(null);
            setEmailStatusMsg(null);
          }}
          onInitialize={() => void initialize("email")}
          onSave={() => void save("email")}
        />

        <Section
          title="SMS"
          icon={MessageSquare}
          provider={sms}
          providers={SMS_PROVIDERS}
          fields={smsDefinition.fields}
          values={smsValues}
          maskedKeyHint={
            currentSmsRecord
              ? formatMaskedKeyDisplay(currentSmsRecord.masked_key)
              : undefined
          }
          disabled={isNoPlan}
          setValue={(key, value) => {
            setSmsValues((current) => ({
              ...current,
              [key]: value,
            }));
            setSmsInitialized(false);
            setSaved((prev) => (prev === "sms" ? null : prev));
            setSmsError(null);
            setSmsStatusMsg(null);
          }}
          initialized={smsInitialized}
          initializing={initializingChannel === "sms"}
          saved={saved === "sms"}
          saving={savingChannel === "sms"}
          isConfigured={isSmsConfigured}
          error={smsError}
          statusMessage={smsStatusMsg}
          onProviderChange={() => {}}
          onInitialize={() => void initialize("sms")}
          onSave={() => void save("sms")}
        />

        {/* ACTIVE & SAVED CONNECTIONS HISTORY TABLE */}
        <section className="border-t border-neutral-200 pt-10 dark:border-white/[0.08]">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-600">
                Infrastructure Registry
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-neutral-950 dark:text-white">
                Connected Providers &amp; History
              </h2>
              <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-600">
                View your active sending gateways, masked API keys, connected sender identities, and test or switch providers anytime.
              </p>
            </div>
          </div>

          {tableBanner && (
            <div
              className={[
                "mt-5 rounded-xl border px-4 py-3 text-xs font-medium",
                tableBanner.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                  : "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300",
              ].join(" ")}
            >
              {tableBanner.text}
            </div>
          )}

          {integrations.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 bg-white/30 px-6 py-12 text-center dark:border-white/[0.08] dark:bg-white/[0.01]">
              <KeyRound size={20} className="mx-auto text-neutral-400" />
              <p className="mt-3 text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                No providers saved yet
              </p>
              <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
                Initialize and save an Email or Twilio SMS provider above to see it listed here.
              </p>
            </div>
          ) : (
            <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-200 bg-white/70 shadow-2xs dark:border-white/[0.08] dark:bg-[#121212]">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200/80 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400 dark:border-white/[0.08] dark:text-neutral-500">
                      <th className="py-3.5 pl-5 pr-3">Channel</th>
                      <th className="px-3 py-3.5">Provider</th>
                      <th className="px-3 py-3.5">Connected Email / Phone</th>
                      <th className="px-3 py-3.5">API Key / Secret</th>
                      <th className="px-3 py-3.5">Status</th>
                      <th className="py-3.5 pl-3 pr-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200/60 text-xs dark:divide-white/[0.06]">
                    {integrations.map((item) => {
                      const isRowBusy = rowActionId === item.id;
                      const isRowVerified = Boolean(verifiedIds[item.id]);
                      const sender = item.connected_sender || "—";

                      return (
                        <tr
                          key={item.id}
                          className="transition-colors hover:bg-neutral-100/50 dark:hover:bg-white/[0.02]"
                        >
                          <td className="py-4 pl-5 pr-3 font-medium text-neutral-900 dark:text-white">
                            <span className="inline-flex items-center gap-2 uppercase tracking-wider text-[11px]">
                              {item.channel === "email" ? (
                                <Mail size={13} className="text-neutral-400" />
                              ) : (
                                <MessageSquare size={13} className="text-neutral-400" />
                              )}
                              {item.channel}
                            </span>
                          </td>

                          <td className="px-3 py-4 font-semibold text-neutral-950 dark:text-white">
                            {PROVIDER_LABELS[item.provider] || item.provider}
                          </td>

                          <td className="px-3 py-4 text-neutral-600 dark:text-neutral-300">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px]">{sender}</span>
                              {sender !== "—" && (
                                <button
                                  type="button"
                                  onClick={() => handleCopySender(item.id, sender)}
                                  title="Copy connected address/number"
                                  className="rounded-md p-1 text-neutral-400 transition hover:bg-neutral-200/60 hover:text-neutral-700 dark:hover:bg-white/10 dark:hover:text-white"
                                >
                                  {copiedId === item.id ? (
                                    <Check size={12} className="text-emerald-500" />
                                  ) : (
                                    <Copy size={12} />
                                  )}
                                </button>
                              )}
                            </div>
                          </td>

                          <td className="px-3 py-4">
                            <span className="rounded-lg border border-neutral-200/80 bg-neutral-100/80 px-2.5 py-1 font-mono text-[11px] text-neutral-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-neutral-400">
                              {formatMaskedKeyDisplay(item.masked_key)}
                            </span>
                          </td>

                          <td className="px-3 py-4">
                            {item.is_active ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-200/70 px-2.5 py-1 text-[10px] font-semibold text-neutral-600 dark:bg-white/[0.06] dark:text-neutral-400">
                                Saved in History
                              </span>
                            )}
                          </td>

                          <td className="py-4 pl-3 pr-5 text-right">
                            <div className="inline-flex items-center justify-end gap-2">
                              {isRowVerified ? (
                                <button
                                  type="button"
                                  disabled
                                  className="inline-flex cursor-default items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                                >
                                  <Check size={12} strokeWidth={2.5} />
                                  Verified
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={isRowBusy}
                                  onClick={() => void handleVerifyRow(item)}
                                  title="Ping provider API to verify credentials"
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-950 disabled:opacity-40 dark:border-white/10 dark:bg-white/[0.03] dark:text-neutral-300 dark:hover:border-white/25 dark:hover:text-white"
                                >
                                  {isRowBusy ? (
                                    <Loader2 size={12} className="animate-spin" />
                                  ) : (
                                    <Activity size={12} />
                                  )}
                                  Verify
                                </button>
                              )}

                              {!item.is_active && (
                                <button
                                  type="button"
                                  disabled={isRowBusy || isNoPlan}
                                  onClick={() => void handleActivateRow(item)}
                                  title="Make this the active provider for this channel"
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-950 px-2.5 py-1.5 text-[11px] font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-40 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
                                >
                                  <Power size={12} />
                                  Set Active
                                </button>
                              )}

                              <button
                                type="button"
                                disabled={isRowBusy}
                                onClick={() => void handleDeleteRow(item)}
                                title="Delete saved credentials"
                                className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-600 transition hover:bg-red-100 disabled:opacity-40 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}