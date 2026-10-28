import { DetrosysLogo } from "../DetrosysLogo";

const footerGroups = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "How it works", href: "/#how-it-works" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/#about" },
      { label: "Contact", href: "/contact" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Refund", href: "/refund" },
    ],
  },
];

const socialLinks = [
  { label: "LinkedIn", mark: "in", href: "https://www.linkedin.com/company/134374280/admin/?lipi=urn%3Ali%3Apage%3Ad_flagship3_feed%3B8n8eMpBzRYuwJN4ND6vU7Q%3D%3D" },
  { label: "X", mark: "𝕏", href: "https://x.com/Detrosys986" },
];

export function PublicFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-black/10 bg-[#f4f1e9] dark:border-white/10 dark:bg-neutral-950">
      {/* Main footer */}
      <div className="mx-auto max-w-[1400px] px-6 pb-8 pt-24 sm:px-8 lg:pb-10 lg:pt-32">
        <div className="grid gap-16 lg:grid-cols-[1.8fr_1fr_1fr_1fr_0.8fr]">
          {/* Brand */}
          <div>
            <a
              href="/"
              className="group inline-flex items-center"
              aria-label="Detrosys home"
            >
              <DetrosysLogo size={42} showText textClassName="text-[15px] tracking-[-0.025em]" />
            </a>

            <p className="mt-7 max-w-md text-lg leading-8 tracking-[-0.015em] text-neutral-500 dark:text-neutral-400">
              A workspace for the work behind the work — built to keep people,
              communication, processes, and decisions connected.
            </p>

            <p className="mt-6 text-sm leading-6 text-neutral-400 dark:text-neutral-500">
              Built for people who would rather do the work than learn the
              software.
            </p>
          </div>

          {/* Link groups */}
          {footerGroups.map((group) => (
            <div key={group.title}>
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500">
                {group.title}
              </h2>

              <div className="mt-6 flex flex-col items-start gap-4">
                {group.links.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="group relative text-[14px] font-medium text-neutral-600 transition-colors duration-200 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white"
                  >
                    {link.label}

                    <span className="absolute -bottom-1 left-0 h-px w-0 bg-current transition-all duration-300 group-hover:w-full" />
                  </a>
                ))}
              </div>
            </div>
          ))}

          {/* Social */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500">
              Find us
            </h2>

            <div className="mt-6 flex flex-wrap gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  title={social.label}
                  className="group flex h-11 w-11 items-center justify-center rounded-[13px] border border-black/10 bg-white text-[11px] font-semibold uppercase text-neutral-500 transition-all duration-300 hover:-translate-y-1 hover:border-black/20 hover:text-neutral-950 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:border-white/20 dark:hover:text-white"
                >
                  <span className="transition-transform duration-300 group-hover:scale-110">
                    {social.mark}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom line */}
        <div className="mt-20 flex flex-col gap-5 border-t border-black/10 pt-7 text-xs text-neutral-400 sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:text-neutral-500">
          <span>
            © {new Date().getFullYear()} Detrosys. All rights reserved.
          </span>

          <div className="flex items-center gap-4">
            <a
              href="/privacy"
              className="transition-colors hover:text-neutral-950 dark:hover:text-white"
            >
              Privacy
            </a>

            <span aria-hidden="true">·</span>

            <a
              href="/terms"
              className="transition-colors hover:text-neutral-950 dark:hover:text-white"
            >
              Terms
            </a>

            <span aria-hidden="true">·</span>

            <a
              href="/refund"
              className="transition-colors hover:text-neutral-950 dark:hover:text-white"
            >
              Refund
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}