import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  Bot,
  Boxes,
  FileText,
  LayoutDashboard,
  Library,
  Mail,
  Megaphone,
  MessageSquare,
  MessageCircle,
} from "lucide-react";

export type PrivateSection =
  | "dashboard"
  | "messaging"
  | "campaigns"
  | "audiences"
  | "templates"
  | "automations";

type TemplateSubSection = "email" | "sms" | "library";

type ExperimentalNavigationProps = {
  onModalStateChange?: (open: boolean) => void;
};

const navigationItems: {
  id: PrivateSection;
  label: string;
  icon: typeof LayoutDashboard;
  path: string;
}[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/app",
  },
  {
    id: "messaging",
    label: "Messaging",
    icon: MessageCircle,
    path: "/app/messaging",
  },
  {
    id: "campaigns",
    label: "Campaigns",
    icon: Megaphone,
    path: "/app/campaigns",
  },
  {
    id: "audiences",
    label: "Audiences",
    icon: Boxes,
    path: "/app/audiences",
  },
  {
    id: "templates",
    label: "Templates",
    icon: FileText,
    path: "/app/templates",
  },
  {
    id: "automations",
    label: "Automations",
    icon: Bot,
    path: "/app/automations",
  },
];

const templateSubItems: {
  id: TemplateSubSection;
  label: string;
  icon: typeof Mail;
  path: string;
}[] = [
  {
    id: "email",
    label: "Email",
    icon: Mail,
    path: "/app/templates/email",
  },
  {
    id: "sms",
    label: "SMS",
    icon: MessageSquare,
    path: "/app/templates/sms",
  },
  {
    id: "library",
    label: "Library",
    icon: Library,
    path: "/app/templates/library",
  },
];

function getScrollPosition(target?: Node | null): number {
  // Document/window scroll
  if (
    !target ||
    target === document ||
    target === document.documentElement ||
    target === document.body
  ) {
    return (
      window.scrollY ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0
    );
  }

  // A nested scrollable container (e.g. a div with overflow-y-auto)
  if (target instanceof HTMLElement) {
    return target.scrollTop;
  }

  return window.scrollY;
}

function TemplateFlyout({
  activeTemplateSubSection,
  onSelect,
}: {
  activeTemplateSubSection: TemplateSubSection | null;
  onSelect: (path: string) => void;
}) {
  return (
    <div
      className="
        pointer-events-none
        absolute
        bottom-full
        left-1/2
        mb-2
        flex
        -translate-x-1/2
        flex-col
        items-center
      "
    >
      {/* FLYOUT PANEL */}
      <div
        className="
          pointer-events-auto
          flex items-center gap-1
          rounded-2xl border border-neutral-300
          bg-[#e7e2d8]/95 p-1.5
          shadow-lg shadow-black/10 backdrop-blur-xl
          dark:border-white/[0.1] dark:bg-[#151515]/95
        "
      >
        {templateSubItems.map((subItem) => {
          const SubIcon = subItem.icon;

          const isSelected =
            activeTemplateSubSection === subItem.id;

          return (
            <button
              key={subItem.id}
              type="button"
              onClick={() => onSelect(subItem.path)}
              aria-current={isSelected ? "page" : undefined}
              className={[
                "flex h-[50px] w-[74px] flex-col items-center justify-center gap-1",
                "rounded-xl transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2",
                "focus-visible:ring-neutral-950/30 dark:focus-visible:ring-white/30",
                isSelected
                  ? "bg-neutral-950 text-white dark:bg-white dark:text-neutral-950"
                  : "text-neutral-500 hover:bg-white/70 hover:text-neutral-950 dark:text-neutral-500 dark:hover:bg-white/[0.06] dark:hover:text-white",
              ].join(" ")}
            >
              <SubIcon size={15} strokeWidth={2} />
              <span className="text-[10px] font-semibold">
                {subItem.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* POINTER — welds the panel to the icon below */}
      <span
        className="
          -mt-[5px] h-2.5 w-2.5 rotate-45
          border-b border-r border-neutral-300
          bg-[#e7e2d8]/95
          dark:border-white/[0.1] dark:bg-[#151515]/95
        "
      />
    </div>
  );
}

function getActiveSection(pathname: string): PrivateSection {
  if (pathname.startsWith("/app/messaging")) return "messaging";
  if (pathname.startsWith("/app/campaigns")) return "campaigns";
  if (pathname.startsWith("/app/audiences")) return "audiences";
  if (pathname.startsWith("/app/templates")) return "templates";
  if (pathname.startsWith("/app/automations")) return "automations";

  return "dashboard";
}

function getTemplateSubSection(
  pathname: string,
): TemplateSubSection | null {
  if (pathname.startsWith("/app/templates/email")) return "email";
  if (pathname.startsWith("/app/templates/sms")) return "sms";
  if (pathname.startsWith("/app/templates/library")) return "library";

  return null;
}

export function ExperimentalNavigation({
  onModalStateChange,
}: ExperimentalNavigationProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const [hoveredSection, setHoveredSection] =
    useState<PrivateSection | null>(null);

  const [navHidden, setNavHidden] = useState(false);

  const lastScrollY = useRef(0);

  useEffect(() => {
    lastScrollY.current = getScrollPosition();

    const SCROLL_THRESHOLD = 8;
    const REVEAL_NEAR_TOP = 80;

    const handleScroll = (event: Event) => {
      const currentY = getScrollPosition(event.target as Node);
      const delta = currentY - lastScrollY.current;

      if (Math.abs(delta) < SCROLL_THRESHOLD) {
        return;
      }

      if (currentY <= REVEAL_NEAR_TOP) {
        setNavHidden(false);
      } else if (delta > 0) {
        // scrolling down
        setNavHidden(true);
      } else {
        // scrolling up
        setNavHidden(false);
      }

      lastScrollY.current = currentY;
    };

    // capture: true catches scroll events from ANY scrollable
    // element on the page (not just window/body), since scroll
    // events don't bubble but can be caught while capturing.
    window.addEventListener("scroll", handleScroll, {
      passive: true,
      capture: true,
    });

    return () =>
      window.removeEventListener(
        "scroll",
        handleScroll,
        { capture: true } as EventListenerOptions,
      );
  }, []);

  useEffect(() => {
    // Every time the route changes, start the new page with the
    // nav visible and re-sync the scroll reference point, so a
    // short page (no scroll events) never leaves the nav stuck.
    setNavHidden(false);
    lastScrollY.current = getScrollPosition();
  }, [location.pathname]);

  const activeSection = getActiveSection(location.pathname);

  const activeTemplateSubSection =
    getTemplateSubSection(location.pathname);

  const activeIndex = navigationItems.findIndex(
    (item) => item.id === activeSection,
  );

  const selectSection = (
    item: (typeof navigationItems)[number],
  ) => {
    onModalStateChange?.(false);
    navigate(item.path);
  };

  const selectTemplate = (path: string) => {
    onModalStateChange?.(false);
    navigate(path);
  };

  return (
    <nav
      aria-label="Private workspace navigation"
      className={[
        "pointer-events-none fixed inset-x-0 bottom-3 z-50",
        "flex justify-center px-3",
        "transition-transform duration-300 ease-out",
        "sm:bottom-5 sm:px-6",
        "lg:bottom-6",
        navHidden
          ? "translate-y-[calc(100%+24px)]"
          : "translate-y-0",
      ].join(" ")}
    >
      <div className="pointer-events-auto relative flex w-full max-w-[820px] justify-center">
        {/* DESKTOP NAVIGATION */}
        <div className="hidden w-full items-end justify-center gap-2 sm:flex sm:gap-3">
          {navigationItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = item.id === activeSection;
            const isHovered = item.id === hoveredSection;

            const distanceFromActive = Math.abs(
              index - activeIndex,
            );

            const lift = isActive
              ? "-translate-y-3"
              : distanceFromActive === 1
                ? "-translate-y-1"
                : "";

            return (
              <div
                key={item.id}
                className={[
                  "relative flex flex-col items-center",
                  lift,
                ].join(" ")}
              >
                {/* ================================================== */}
                {/* SUB-SECTION FLYOUT (Templates)                     */}
                {/* ================================================== */}

                {item.id === "templates" && isActive && (
                  <TemplateFlyout
                    activeTemplateSubSection={
                      activeTemplateSubSection
                    }
                    onSelect={selectTemplate}
                  />
                )}

                {/* ================================================== */}
                {/* MAIN NAV ITEM                                      */}
                {/* ================================================== */}

                <button
                  type="button"
                  onClick={() => selectSection(item)}
                  onMouseEnter={() =>
                    setHoveredSection(item.id)
                  }
                  onMouseLeave={() =>
                    setHoveredSection(null)
                  }
                  aria-current={
                    isActive ? "page" : undefined
                  }
                  className="
                    group relative flex min-w-[96px]
                    flex-col items-center justify-end gap-2
                    rounded-2xl px-3 py-2.5
                    transition-all duration-300 ease-out
                    focus-visible:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-neutral-950/30
                    dark:focus-visible:ring-white/30
                  "
                >
                  <span
                    className={[
                      "relative flex h-11 w-11 items-center justify-center rounded-2xl border",
                      "transition-all duration-300 ease-out",
                      isActive
                        ? "border-neutral-950 bg-neutral-950 text-white shadow-lg shadow-black/10 dark:border-white dark:bg-white dark:text-neutral-950"
                        : isHovered
                          ? "border-neutral-400 bg-white text-neutral-950 dark:border-white/30 dark:bg-white/[0.08] dark:text-white"
                          : "border-neutral-300 bg-[#e7e2d8]/90 text-neutral-500 backdrop-blur-md dark:border-white/10 dark:bg-[#151515]/90 dark:text-neutral-500",
                    ].join(" ")}
                  >
                    <Icon
                      size={17}
                      strokeWidth={
                        isActive ? 2.2 : 1.8
                      }
                    />

                    {isActive && (
                      <span
                        className="
                          absolute -bottom-1.5 left-1/2
                          h-1 w-1
                          -translate-x-1/2
                          rounded-full
                          bg-[var(--detrosys-accent,#e4572e)]
                        "
                      />
                    )}
                  </span>

                  <span
                    className={[
                      "whitespace-nowrap text-[11px] font-medium",
                      "transition-all duration-300",
                      isActive
                        ? "text-neutral-950 dark:text-white"
                        : isHovered
                          ? "text-neutral-700 dark:text-neutral-300"
                          : "text-neutral-400 dark:text-neutral-600",
                    ].join(" ")}
                  >
                    {item.label}
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        {/* MOBILE NAVIGATION */}
        <div
          className="
            flex w-full max-w-md items-center justify-between
            rounded-[22px]
            border border-neutral-200
            bg-[#e7e2d8]/95 p-2
            shadow-lg backdrop-blur-xl
            sm:hidden
            dark:border-white/[0.08]
            dark:bg-[#151515]/95
          "
        >
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.id === activeSection;

            return (
              <div
                key={item.id}
                className="relative flex min-w-0 flex-1 justify-center"
              >
                {item.id === "templates" && isActive && (
                  <TemplateFlyout
                    activeTemplateSubSection={
                      activeTemplateSubSection
                    }
                    onSelect={selectTemplate}
                  />
                )}

                <button
                  type="button"
                  onClick={() => selectSection(item)}
                  aria-label={item.label}
                  aria-current={
                    isActive ? "page" : undefined
                  }
                  className={[
                    "relative flex h-12 w-full min-w-0",
                    "items-center justify-center rounded-2xl",
                    "transition-all duration-200",
                    "focus-visible:outline-none",
                    "focus-visible:ring-2",
                    "focus-visible:ring-neutral-950/30",
                    "dark:focus-visible:ring-white/30",
                    isActive
                      ? "bg-neutral-950 text-white dark:bg-white dark:text-neutral-950"
                      : "text-neutral-400 dark:text-neutral-600",
                  ].join(" ")}
                >
                  <Icon
                    size={18}
                    strokeWidth={
                      isActive ? 2.2 : 1.8
                    }
                  />

                  {isActive && (
                    <span
                      className="
                        absolute bottom-1.5 h-1 w-1
                        rounded-full
                        bg-[var(--detrosys-accent,#e4572e)]
                      "
                    />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
}