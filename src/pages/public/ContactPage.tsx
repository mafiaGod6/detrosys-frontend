import { ArrowUpRight, Check, Loader2 } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";

import { PublicFooter } from "../../components/public/PublicFooter";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ??
  import.meta.env.VITE_API_URL ??
  "http://localhost:8000"
).replace(/\/$/, "");

const MAX_MESSAGE = 1000;
const ORBIT_RADIUS = 38; // percent of the orbit box

const reasons = [
  "General question",
  "Product question",
  "Technical issue",
  "Billing",
  "Feedback",
  "Partnership",
  "Other",
];

const reasonHints: Record<string, string> = {
  "General question": "Anything about Detrosys.",
  "Product question": "How a feature works, or what fits your plan.",
  "Technical issue": "Something broke? Tell us where and what you clicked.",
  "Billing": "Invoices, plans, and payments.",
  "Feedback": "Ideas and honest opinions are welcome.",
  "Partnership": "Integrations, collabs, co-marketing.",
  "Other": "Anything else at all.",
};

type TopicOrbitProps = {
  value: string;
  onChange: (value: string) => void;
};

function TopicOrbit({ value, onChange }: TopicOrbitProps) {
  const points = reasons.map((item, index) => {
    const angle = -Math.PI / 2 + (index / reasons.length) * Math.PI * 2;
    return {
      item,
      x: 50 + ORBIT_RADIUS * Math.cos(angle),
      y: 50 + ORBIT_RADIUS * Math.sin(angle),
    };
  });

  const active = points.find((p) => p.item === value) ?? points[0];

  return (
    <div className="flex w-full flex-col items-center">
      <div className="relative aspect-square w-full max-w-[440px]">
        {/* Rotating rings */}
        <div className="absolute inset-[4%] animate-[spin_60s_linear_infinite] rounded-full border border-dashed border-black/15 dark:border-white/15" />
        <div className="absolute inset-[16%] animate-[spin_40s_linear_infinite_reverse] rounded-full border border-black/10 dark:border-white/10" />
        <div className="absolute inset-[30%] rounded-full bg-[var(--detrosys-accent)]/[0.06]" />

        {/* Connector line from the center to the selected topic */}
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" aria-hidden="true">
          <line
            x1="50"
            y1="50"
            x2={active.x}
            y2={active.y}
            stroke="var(--detrosys-accent, #e4572e)"
            strokeWidth="0.35"
            strokeDasharray="1 1.2"
            className="transition-all duration-500"
          />
        </svg>

        {/* Center: the selected topic */}
        <div className="absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-neutral-950 px-3 text-center text-[11px] font-semibold leading-4 text-white shadow-xl dark:bg-[#f4f1e9] dark:text-neutral-950 sm:h-28 sm:w-28">
          {active.item}
        </div>

        {/* Topic nodes */}
        {points.map((p) => {
          const selected = p.item === active.item;
          return (
            <button
              key={p.item}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(p.item)}
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
              className="group absolute -translate-x-1/2 -translate-y-1/2 outline-none"
            >
              <span
                className={[
                  "block h-4 w-4 rounded-full border transition-all duration-300 group-hover:scale-150 group-focus-visible:ring-4 group-focus-visible:ring-[var(--detrosys-accent)]/30",
                  selected
                    ? "scale-150 border-[var(--detrosys-accent)] bg-[var(--detrosys-accent)] shadow-[0_0_0_6px_rgba(228,87,46,0.15)]"
                    : "border-neutral-400 bg-[#f4f1e9] dark:border-neutral-600 dark:bg-neutral-950",
                ].join(" ")}
              />
              <span
                className={[
                  "absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors duration-300",
                  selected
                    ? "text-neutral-950 dark:text-white"
                    : "text-neutral-400 group-hover:text-neutral-700 dark:text-neutral-600 dark:group-hover:text-neutral-300",
                ].join(" ")}
              >
                {p.item}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-10 max-w-sm text-center text-sm leading-6 text-neutral-500 dark:text-neutral-400">
        {reasonHints[active.item]}
      </p>
    </div>
  );
}

export function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState(reasons[0]);
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          reason,
          message: message.trim(),
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.detail || "Failed to send your message. Please try again.");
      }

      setSent(true);
      setName("");
      setEmail("");
      setMessage("");
      setReason(reasons[0]);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "An unexpected error occurred while sending.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f1e9] text-neutral-950 dark:bg-neutral-950 dark:text-white">
      <main>
        {/* INTRO */}
        <section className="px-6 pb-16 pt-28 sm:px-8 lg:px-16 lg:pb-20 lg:pt-40">
          <div className="mx-auto max-w-[1200px]">
            <div className="mb-8 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.22em] text-neutral-500 dark:text-neutral-400">
              <span className="h-2 w-2 rounded-full bg-[var(--detrosys-accent)]" />
              Detrosys / Contact
            </div>

            <div className="grid gap-10 lg:grid-cols-[1fr_0.45fr] lg:items-end">
              <h1 className="max-w-4xl text-[clamp(3.5rem,8vw,7.5rem)] font-semibold leading-[0.88] tracking-[-0.065em]">
                Have something
                <br />
                <span className="text-neutral-400 dark:text-neutral-600">
                  to say?
                </span>
              </h1>

              <p className="max-w-md text-base leading-7 text-neutral-600 dark:text-neutral-400 sm:text-lg sm:leading-8">
                Questions, feedback, problems, ideas — whatever brought you
                here, send it our way.
              </p>
            </div>
          </div>
        </section>

        {/* ORBIT  |  FORM */}
        <section className="px-6 pb-24 sm:px-8 lg:px-16 lg:pb-36">
          <div className="mx-auto grid max-w-[1200px] gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            {/* LEFT: VISUAL TOPIC ORBIT */}
            <div className="flex items-center justify-center py-6 lg:sticky lg:top-28">
              <TopicOrbit value={reason} onChange={setReason} />
            </div>

            {/* RIGHT: FORM */}
            <div className="rounded-[2rem] border border-black/10 bg-white/45 p-6 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.03] sm:p-8 lg:p-10">
              {sent && (
                <div className="mb-6 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                  <span className="font-semibold">Message sent! </span>
                  Thank you for reaching out. We will get back to you at {email || "your email"}.
                </div>
              )}

              {errorMessage && (
                <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-7">
                <div>
                  <label
                    htmlFor="name"
                    className="mb-3 block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400"
                  >
                    Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full border-b border-black/15 bg-transparent px-0 py-3 text-base outline-none transition-colors placeholder:text-neutral-400 focus:border-[var(--detrosys-accent)] dark:border-white/15 dark:placeholder:text-neutral-600"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="mb-3 block text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full border-b border-black/15 bg-transparent px-0 py-3 text-base outline-none transition-colors placeholder:text-neutral-400 focus:border-[var(--detrosys-accent)] dark:border-white/15 dark:placeholder:text-neutral-600"
                  />
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <label
                      htmlFor="message"
                      className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400"
                    >
                      Message
                    </label>
                    <span className="text-[10px] tabular-nums text-neutral-400">
                      {message.length} / {MAX_MESSAGE}
                    </span>
                  </div>
                  <textarea
                    id="message"
                    name="message"
                    required
                    maxLength={MAX_MESSAGE}
                    rows={7}
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Tell us what's on your mind..."
                    className="w-full resize-none border-b border-black/15 bg-transparent px-0 py-3 text-base leading-7 outline-none transition-colors placeholder:text-neutral-400 focus:border-[var(--detrosys-accent)] dark:border-white/15 dark:placeholder:text-neutral-600"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="group inline-flex items-center gap-3 rounded-full bg-neutral-950 px-6 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#f4f1e9] dark:text-neutral-950"
                  >
                    {loading ? (
                      <>
                        <span>Sending...</span>
                        <Loader2 size={16} className="animate-spin" />
                      </>
                    ) : sent ? (
                      <>
                        <span>Message sent</span>
                        <Check
                          size={16}
                          className="transition-transform duration-300 group-hover:scale-110"
                        />
                      </>
                    ) : (
                      <>
                        <span>Send message</span>
                        <ArrowUpRight
                          size={16}
                          className="transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1"
                        />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}