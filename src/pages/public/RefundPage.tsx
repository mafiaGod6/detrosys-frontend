import {
  ArrowLeft,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  HelpCircle,
  Mail,
  RefreshCcw,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router";
import { PublicFooter } from "../../components/public/PublicFooter";
import { PublicNavbar } from "../../components/public/PublicNavbar";

export function RefundPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f3f1eb] text-neutral-950 dark:bg-[#0b0b0b] dark:text-white">
      <PublicNavbar />

      <main className="relative px-6 pb-28 pt-36 sm:px-8 lg:px-12">
        {/* Ambient Subtle Background Glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-[20%] top-[8%] h-[32rem] w-[32rem] rounded-full bg-[var(--detrosys-accent)]/8 blur-[140px]"
        />

        <div className="relative mx-auto max-w-4xl">
          {/* Breadcrumb Navigation */}
          <div className="mb-8 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">
            <Link
              to="/"
              className="flex items-center gap-1.5 transition-colors hover:text-neutral-950 dark:hover:text-white"
            >
              <ArrowLeft size={13} />
              Home
            </Link>
            <ChevronRight size={12} className="opacity-40" />
            <span className="text-[var(--detrosys-accent)]">Cancellation &amp; Refund</span>
          </div>

          {/* Document Header */}
          <header className="border-b border-neutral-300 pb-10 dark:border-neutral-800">
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white/70 px-3.5 py-1 text-xs font-semibold text-neutral-700 backdrop-blur-md dark:border-neutral-700 dark:bg-white/[0.04] dark:text-neutral-300">
              <RefreshCcw size={14} className="text-[var(--detrosys-accent)]" />
              SaaS Billing &amp; Subscriptions
            </div>

            <h1 className="mt-5 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl lg:text-6xl">
              Cancellation &amp; Refund Policy
            </h1>

            <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
              Effective Date: October 12, 2026 • Last Updated: October 12, 2026
            </p>
          </header>

          {/* Legal Document Content */}
          <div className="mt-12 space-y-12 text-base leading-8 text-neutral-700 dark:text-neutral-300">
            {/* Overview Card */}
            <section className="space-y-4">
              <p>
                At <strong>Detrosys</strong> (accessible at{" "}
                <a
                  href="https://detrosys.online"
                  className="font-medium underline underline-offset-4 hover:text-[var(--detrosys-accent)]"
                >
                  detrosys.online
                </a>
                ), we build software designed to keep your marketing workflows, audiences, and automations connected seamlessly. Because our platform is a cloud-hosted Software-as-a-Service (SaaS) tool delivered instantly upon account activation, this policy sets out the exact conditions under which cancellations and refunds are granted.
              </p>
            </section>

            {/* Section 1: Initial Purchase Guarantee */}
            <section className="space-y-4 rounded-3xl border border-neutral-300/80 bg-white/40 p-8 backdrop-blur-sm dark:border-neutral-800 dark:bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-950 text-white dark:bg-white dark:text-neutral-950">
                  <CalendarCheck size={16} />
                </span>
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-neutral-950 dark:text-white">
                  1. 7-Day Money-Back Guarantee (First-Time Subscriptions)
                </h2>
              </div>
              <p>
                We want you to evaluate Detrosys with complete confidence. If you subscribe to any paid recurring tier (Basic, Pro, or Advanced) for the very first time and determine within <strong>7 calendar days</strong> of your initial transaction that the platform does not meet your business requirements, you are eligible for a 100% full refund.
              </p>
              <div className="rounded-2xl border border-neutral-300/70 bg-white/60 p-4 text-sm leading-6 dark:border-neutral-800 dark:bg-neutral-900/60">
                <strong className="text-neutral-900 dark:text-white">Note:</strong> This guarantee applies strictly to your initial subscription purchase. It allows you to test live workflows and integrations without financial risk.
              </div>
            </section>

            {/* Section 2: Renewals & Cancellations */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-neutral-950 dark:text-white">
                2. Subscription Renewals &amp; Account Cancellation
              </h2>
              <p>
                Detrosys subscriptions operate on a recurring billing cycle (monthly or annually) billed in advance:
              </p>
              <ul className="list-inside list-disc space-y-2.5 pl-2 text-sm leading-7">
                <li>
                  <strong>Self-Service Cancellation:</strong> You can cancel your subscription at any time directly through your dashboard by navigating to <strong>Account Settings &gt; Billing</strong>. No phone calls or support tickets are required.
                </li>
                <li>
                  <strong>Continued Access:</strong> When you cancel your subscription, your account remains fully active with all premium features until the end of your current prepaid billing period. You will not be billed again.
                </li>
                <li>
                  <strong>Renewals Are Non-Refundable:</strong> Routine monthly or annual renewal charges are non-refundable once processed. We send advance billing reminders for annual plans to the registered account email address.
                </li>
              </ul>
            </section>

            {/* Section 3: Non-Refundable Add-ons */}
            <section className="space-y-4 rounded-3xl border border-neutral-300/80 bg-white/40 p-8 backdrop-blur-sm dark:border-neutral-800 dark:bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--detrosys-accent)] text-white">
                  <ShieldAlert size={16} />
                </span>
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-neutral-950 dark:text-white">
                  3. Non-Refundable Usage &amp; Add-On Items
                </h2>
              </div>
              <p>
                Certain services involve external gateway, telecommunication, or irreversible infrastructure allocations. The following items are strictly non-refundable:
              </p>
              <ul className="list-inside list-disc space-y-2 pl-2 text-sm leading-7">
                <li>
                  <strong>Permanent Contact Expansions:</strong> One-time purchases that permanently increase your workspace contact capacity (e.g., +5,000 contact capacity blocks) once provisioned to your database.
                </li>
                <li>
                  <strong>Dispatched Communications:</strong> Telecommunication carrier fees and third-party relay charges for SMS segments or email batches that have already been transmitted through active campaigns.
                </li>
                <li>
                  <strong>Accounts Terminated for Abuse:</strong> Any account suspended or terminated due to violations of our Acceptable Use Policy (such as transmitting unsolicited spam, phishing, or uploading scraped contact lists).
                </li>
              </ul>
            </section>

            {/* Section 4: Free Sandbox Tier */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-[var(--detrosys-accent)]" />
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-neutral-950 dark:text-white">
                  4. Free Sandbox Tier (Test Before Buying)
                </h2>
              </div>
              <p>
                To help you determine whether Detrosys fits your workflow before spending any money, we provide a permanent <strong>Free Sandbox Plan</strong>. This plan allows you to manage up to 250 contacts, build templates, and test automated workflows without entering credit card or payment details.
              </p>
            </section>

            {/* Section 5: Processing Time & Refund Method */}
            <section className="space-y-4 rounded-3xl border border-neutral-300/80 bg-white/40 p-8 backdrop-blur-sm dark:border-neutral-800 dark:bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-950 text-white dark:bg-white dark:text-neutral-950">
                  <CreditCard size={16} />
                </span>
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-neutral-950 dark:text-white">
                  5. Refund Processing Timelines
                </h2>
              </div>
              <p>
                Approved refunds are credited directly back to the original payment method used during checkout via our payment partners:
              </p>
              <div className="grid gap-3 pt-2 sm:grid-cols-2">
                <div className="rounded-2xl border border-neutral-300/80 bg-white/60 p-4 dark:border-neutral-800 dark:bg-neutral-900/60">
                  <div className="flex items-center gap-2 text-sm font-semibold text-neutral-950 dark:text-white">
                    <Clock size={15} className="text-[var(--detrosys-accent)]" />
                    International Payments (Paddle)
                  </div>
                  <p className="mt-1 text-xs leading-5 text-neutral-500 dark:text-neutral-400">
                    Processed within <strong>5–10 business days</strong> depending on your card issuer or banking institution.
                  </p>
                </div>

                <div className="rounded-2xl border border-neutral-300/80 bg-white/60 p-4 dark:border-neutral-800 dark:bg-neutral-900/60">
                  <div className="flex items-center gap-2 text-sm font-semibold text-neutral-950 dark:text-white">
                    <Clock size={15} className="text-[var(--detrosys-accent)]" />
                    Indian Domestic (Cashfree)
                  </div>
                  <p className="mt-1 text-xs leading-5 text-neutral-500 dark:text-neutral-400">
                    Processed back to source UPI, net banking, or debit card within <strong>5–7 business days</strong>.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 6: Chargebacks & Dispute Resolution */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-neutral-950 dark:text-white">
                6. Chargebacks and Payment Disputes
              </h2>
              <p>
                If you encounter an unexpected charge, billing question, or technical issue, we strongly encourage you to contact us first at{" "}
                <a
                  href="mailto:billing@detrosys.online"
                  className="font-medium text-[var(--detrosys-accent)] underline underline-offset-4"
                >
                  support@detrosys.online
                </a>
                . Filing an unverified chargeback with your bank or credit card provider without contacting support may result in immediate workspace suspension while the dispute is under review.
              </p>
            </section>

            {/* Section 7: How to Request a Refund */}
            <section className="rounded-3xl border border-neutral-300 bg-[#e8e4da]/70 p-8 dark:border-neutral-800 dark:bg-[#111111]">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-950 text-white dark:bg-white dark:text-neutral-950">
                  <Mail size={16} />
                </span>
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-neutral-950 dark:text-white">
                  7. How to Request a Refund
                </h2>
              </div>
              <p className="mt-3 text-sm leading-7">
                To submit a refund request under our 7-day guarantee, email us from your registered Detrosys account email address with the following details:
              </p>

              <div className="mt-4 space-y-2 rounded-2xl border border-neutral-300/80 bg-white/60 p-5 text-sm dark:border-neutral-800 dark:bg-neutral-900/60">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
                  <span>Your registered account email address</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
                  <span>Invoice or Order ID number from your receipt</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
                  <span>A brief note explaining why the platform did not fit your needs (to help us improve)</span>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-6 text-sm font-medium">
                <a
                  href="mailto:support@detrosys.online"
                  className="inline-flex items-center gap-2 text-neutral-700 transition-colors hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white"
                >
                  <Mail size={16} className="text-[var(--detrosys-accent)]" />
                  <span>support@detrosys.online</span>
                </a>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-1.5 text-neutral-700 transition-colors hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white"
                >
                  <HelpCircle size={16} />
                  <span>Contact Help Center</span>
                </Link>
              </div>
            </section>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}