import {
  ArrowLeft,
  ChevronRight,
  FileText,
  Mail,
  Scale,
  ShieldAlert,
  Zap,
} from "lucide-react";
import { Link } from "react-router";
import { PublicFooter } from "../../components/public/PublicFooter";
import { PublicNavbar } from "../../components/public/PublicNavbar";

export function TermsPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f3f1eb] text-neutral-950 dark:bg-[#0b0b0b] dark:text-white">
      <PublicNavbar />

      <main className="relative px-6 pb-28 pt-36 sm:px-8 lg:px-12">
        {/* Ambient Glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-[20%] top-[8%] h-[32rem] w-[32rem] rounded-full bg-[var(--detrosys-accent)]/8 blur-[140px]"
        />

        <div className="relative mx-auto max-w-4xl">
          {/* Breadcrumb */}
          <div className="mb-8 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">
            <Link
              to="/"
              className="flex items-center gap-1.5 transition-colors hover:text-neutral-950 dark:hover:text-white"
            >
              <ArrowLeft size={13} />
              Home
            </Link>
            <ChevronRight size={12} className="opacity-40" />
            <span className="text-[var(--detrosys-accent)]">Terms of Service</span>
          </div>

          {/* Document Header */}
          <header className="border-b border-neutral-300 pb-10 dark:border-neutral-800">
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white/70 px-3.5 py-1 text-xs font-semibold text-neutral-700 backdrop-blur-md dark:border-neutral-700 dark:bg-white/[0.04] dark:text-neutral-300">
              <Scale size={14} className="text-[var(--detrosys-accent)]" />
              User Agreement &amp; Acceptable Use
            </div>

            <h1 className="mt-5 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl lg:text-6xl">
              Terms &amp; Conditions
            </h1>

            <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
              Effective Date: October 12, 2026 • Last Updated: October 12, 2026
            </p>
          </header>

          {/* Body Content */}
          <div className="mt-12 space-y-12 text-base leading-8 text-neutral-700 dark:text-neutral-300">
            {/* 1. General Terms */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-neutral-950 dark:text-white">
                1. General Terms &amp; Agreement Overview
              </h2>
              <p>
                By accessing, creating an account on, or purchasing services through Detrosys (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;), you confirm that you have read, understood, and agreed to be legally bound by these Terms &amp; Conditions. These terms apply to all visitors, registered workspace accounts, API integrations, and communication dispatched through our infrastructure.
              </p>
              <p>
                These Terms constitute a valid contract between you (either as an individual or on behalf of the commercial entity you represent) and Detrosys, a sole proprietorship registered in Ravet, Pune, Maharashtra, India. If you do not agree to these terms, you must discontinue using our services immediately.
              </p>
            </section>

            {/* 2. SaaS License Grant */}
            <section className="space-y-4 rounded-3xl border border-neutral-300/80 bg-white/40 p-8 backdrop-blur-sm dark:border-neutral-800 dark:bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-950 text-white dark:bg-white dark:text-neutral-950">
                  <FileText size={16} />
                </span>
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-neutral-950 dark:text-white">
                  2. Cloud Service License Grant
                </h2>
              </div>
              <p>
                Subject to your compliance with this Agreement and timely payment of applicable fees, Detrosys grants you a revocable, non-exclusive, non-transferable, limited license to access and use our hosted cloud Software-as-a-Service (SaaS) platform strictly for your internal business operations.
              </p>
              <p>
                Detrosys is provided exclusively as a cloud-hosted web application accessible via internet browsers and authorized APIs. You are not granted any license to download, install, distribute, copy, or execute the underlying software source code on private servers.
              </p>
            </section>

            {/* 3. Acceptable Use & Anti-Spam */}
            <section className="space-y-4 rounded-3xl border border-amber-500/30 bg-amber-500/[0.03] p-8 dark:border-amber-500/20">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--detrosys-accent)] text-white">
                  <ShieldAlert size={16} />
                </span>
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-neutral-950 dark:text-white">
                  3. Acceptable Use &amp; Anti-Spam Policy (AUP)
                </h2>
              </div>
              <p>
                Detrosys provides automation tools for legitimate customer engagement. You represent and warrant that all communication dispatched through our system complies with global deliverability laws:
              </p>
              <ul className="list-inside list-disc space-y-2.5 pl-2 text-sm leading-7">
                <li>
                  <strong>Opt-in Permission Only:</strong> You will not upload, sync, or transmit messages to purchased, scraped, harvested, or third-party lead databases. All recipients must have explicitly opted-in to receive communications from your organization.
                </li>
                <li>
                  <strong>CAN-SPAM &amp; GDPR Adherence:</strong> All marketing emails must include an active, functioning one-click unsubscribe mechanism and your organization&apos;s valid physical address. You must honor unsubscribe requests within 48 hours.
                </li>
                <li>
                  <strong>Carrier Compliance (TCPA &amp; Telecom):</strong> Outbound SMS campaigns must comply with the US Telephone Consumer Protection Act (TCPA), regional carrier registries, and strict opt-in/opt-out keywords (such as STOP and HELP).
                </li>
                <li>
                  <strong>Immediate Termination for Abuse:</strong> Detrosys reserves the right to immediately suspend or terminate any workspace that generates excessive spam complaints, high bounce rates (&gt;5%), spam-trap hits, or carrier deliverability blocks without prior notice and without refund.
                </li>
              </ul>
            </section>

            {/* 4. Platform Restrictions */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-neutral-950 dark:text-white">
                4. Restrictions on Use
              </h2>
              <p>You agree not to, and you will not permit any third party to:</p>
              <ul className="list-inside list-disc space-y-2 pl-2 text-sm leading-7">
                <li>Sell, sub-license, rent, lease, or commercially exploit workspace access to unauthorized parties.</li>
                <li>Decompile, reverse-engineer, decrypt, or attempt to extract the source code of Detrosys.</li>
                <li>Circumvent workspace usage caps, rate-limits, or security controls.</li>
                <li>Use the platform to distribute malware, phishing campaigns, deceptive links, or unlawful content.</li>
                <li>Remove or obscure any proprietary trademark, copyright, or attribution notices.</li>
              </ul>
            </section>

            {/* 5. Subscriptions, Payments & Taxes */}
            <section className="space-y-4 rounded-3xl border border-neutral-300/80 bg-white/40 p-8 backdrop-blur-sm dark:border-neutral-800 dark:bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-950 text-white dark:bg-white dark:text-neutral-950">
                  <Zap size={16} />
                </span>
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-neutral-950 dark:text-white">
                  5. Subscriptions, Billing, and Payments
                </h2>
              </div>
              <p>
                Detrosys offers monthly and annual subscription plans (Basic, Pro, Advanced) and one-time capacity add-ons.
              </p>
              <ul className="list-inside list-disc space-y-2.5 pl-2 text-sm leading-7">
                <li>
                  <strong>Recurring Billing:</strong> Paid subscriptions are billed in advance on a recurring monthly or annual basis. Subscriptions automatically renew unless canceled prior to the billing cycle through Account Settings &gt; Billing.
                </li>
                <li>
                  <strong>Payment Gateways:</strong> Detrosys offloads all raw financial processing to certified PCI-DSS payment partners. Domestic Indian transactions are processed via Cashfree Payments. International transactions are processed through Paddle, which acts as our Merchant of Record.
                </li>
                <li>
                  <strong>Failed Charges:</strong> If automated renewal payments fail, access to premium campaign automation tools and contact capacity may be suspended until balances are resolved.
                </li>
              </ul>
            </section>

            {/* 6. Refund Policy Reference */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-neutral-950 dark:text-white">
                6. Cancellation &amp; Refund Policy
              </h2>
              <p>
                Because Detrosys provides immediate digital provisioning upon purchase, all refund requests are strictly governed by our dedicated{" "}
                <Link
                  to="/refund"
                  className="font-semibold text-[var(--detrosys-accent)] underline underline-offset-4 hover:opacity-80"
                >
                  Cancellation &amp; Refund Policy
                </Link>
                :
              </p>
              <ul className="list-inside list-disc space-y-2 pl-2 text-sm leading-7">
                <li>First-time subscriptions are backed by an initial 7-day money-back guarantee.</li>
                <li>Subscription renewals and delivered communications (dispatched SMS and email carrier fees) are non-refundable once charged.</li>
                <li>Permanent workspace capacity expansions (such as contact blocks) are non-refundable once activated.</li>
              </ul>
            </section>

            {/* 7. Intellectual Property & Customer Data */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-neutral-950 dark:text-white">
                7. Intellectual Property &amp; Data Ownership
              </h2>
              <p>
                Detrosys retains all ownership, rights, title, and intellectual property in and to the platform, including workflow builder logic, user interface designs, templates, and trademarks.
              </p>
              <p>
                You retain complete ownership of all customer audience lists, contact data, creative copy, and business assets uploaded into your account. You grant Detrosys a limited license to process and transmit this data solely as required to provide the Service.
              </p>
            </section>

            {/* 8. Warranty Disclaimer */}
            <section className="space-y-4 rounded-3xl border border-neutral-300/80 bg-white/40 p-8 backdrop-blur-sm dark:border-neutral-800 dark:bg-white/[0.02]">
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-neutral-950 dark:text-white">
                8. Disclaimer of Warranties
              </h2>
              <p className="text-sm uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                Provided on an &ldquo;As Is&rdquo; and &ldquo;As Available&rdquo; basis.
              </p>
              <p>
                Detrosys makes no warranties, express or implied, regarding uptime, delivery completion rates, or error-free operation. We specifically disclaim all implied warranties of merchantability, fitness for a particular purpose, and non-infringement. We cannot guarantee that third-party email providers or telecom networks will not reject or delay dispatched communications.
              </p>
            </section>

            {/* 9. Limitation of Liability */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-neutral-950 dark:text-white">
                9. Limitation of Liability
              </h2>
              <p>
                To the fullest extent permitted by applicable law, in no event shall Detrosys, its founders, or contractors be liable for any indirect, incidental, punitive, or consequential damages (including lost profits, lost revenues, or loss of business data).
              </p>
              <p>
                Our maximum aggregated liability for all claims arising out of this Agreement or your use of the Service shall not exceed the amount actually paid by you to Detrosys in the twelve (12) months preceding the claim.
              </p>
            </section>

            {/* 10. Governing Law & Dispute Resolution */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-neutral-950 dark:text-white">
                10. Governing Law &amp; Arbitration
              </h2>
              <p>
                This Agreement shall be governed by and construed in accordance with the substantive laws of India, without regard to conflict of laws principles.
              </p>
              <p>
                In the event of any dispute, controversy, or claim, the parties agree to first seek informal resolution by providing written notice to support@detrosys.online. If unresolved within sixty (60) days, the dispute shall be resolved via binding arbitration conducted under the Arbitration and Conciliation Act of India, held in Pune, Maharashtra, India. The courts of Pune, Maharashtra shall possess exclusive jurisdiction.
              </p>
            </section>

            {/* 11. Contact Info Card */}
            <section className="rounded-3xl border border-neutral-300 bg-[#e8e4da]/70 p-8 dark:border-neutral-800 dark:bg-[#111111]">
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-neutral-950 dark:text-white">
                Questions Regarding These Terms?
              </h2>
              <p className="mt-2 text-sm leading-7">
                If you have questions or concerns regarding our terms or acceptable use policies, contact our team:
              </p>

              <div className="mt-6 space-y-2 text-sm font-medium">
                <p className="text-neutral-950 dark:text-white">Detrosys</p>
                <p className="text-neutral-500 dark:text-neutral-400">
                  Sole Proprietorship registered in Ravet, Pune, Maharashtra, India
                </p>
                <p className="flex items-center gap-2 pt-2">
                  <Mail size={15} className="text-[var(--detrosys-accent)]" />
                  <a
                    href="mailto:support@detrosys.online"
                    className="underline underline-offset-4 hover:text-[var(--detrosys-accent)]"
                  >
                    support@detrosys.online
                  </a>
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}