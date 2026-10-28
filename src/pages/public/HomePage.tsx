import { ArrowRight, CircleDot, Plus, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { PublicFooter } from "../../components/public/PublicFooter";
import { PublicNavbar } from "../../components/public/PublicNavbar";

// Safe client-side JWT token expiration validator
function isSessionActive(): boolean {
  if (typeof window === "undefined") return false;
  const token = localStorage.getItem("detrosys_access_token");
  if (!token) return false;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      localStorage.removeItem("detrosys_access_token");
      return false;
    }

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );

    const payload = JSON.parse(jsonPayload);

    if (payload.exp && payload.exp * 1000 <= Date.now()) {
      localStorage.removeItem("detrosys_access_token");
      localStorage.removeItem("detrosys_refresh_token");
      return false;
    }

    return true;
  } catch {
    localStorage.removeItem("detrosys_access_token");
    return false;
  }
}

const featureItems = [
  {
    index: "01",
    title: "Campaigns",
    description:
      "A campaign is where your communication gets a clear objective. Coordinate high-deliverability email and SMS outreach from one unified composer without jumping between disconnected tools.",
    detail:
      "Campaigns give your workspace a concrete center of gravity. Monitor live transmission rates, recipient engagement, and revenue attribution in real time without having to reconstruct analytics from multiple platforms.",
  },
  {
    index: "02",
    title: "Audiences",
    description:
      "Your contacts are dynamic customers, not static database rows. Segment audiences based on real purchasing behavior, recent engagement, and lifecycle stages with zero complex formula queries.",
    detail:
      "Detrosys eliminates convoluted query builders. Build intuitive, responsive groups that update dynamically as users interact with your messages, feeding qualified contacts directly into active campaigns.",
  },
  {
    index: "03",
    title: "Templates",
    description:
      "Build high-converting communications once and deploy them effortlessly. Create clean, responsive email and SMS layouts that adapt perfectly to desktop and mobile viewports.",
    detail:
      "Start with battle-tested layouts, customize variables, and keep your brand voice consistent across every transactional and promotional message without starting from scratch every time.",
  },
  {
    index: "04",
    title: "Automations",
    description:
      "Visual, node-based workflows that execute your business logic 24/7. Trigger multi-step drip sequences, behavioral follow-ups, and customer notifications reliably without ongoing supervision.",
    detail:
      "Automations connect directly to your audience context. Build visible logic paths (Trigger → Condition → Delay → Action) so you can audit exactly how a subscriber moves through your funnel before turning it on.",
  },
  {
    index: "05",
    title: "Dashboard",
    description:
      "A high-signal operational dashboard that highlights what actually matters: delivery health, audience velocity, and revenue movement across all your active campaigns.",
    detail:
      "No cluttered walls of vanity metrics. The dashboard shows what changed, which campaigns are generating conversions, and where deliverability needs immediate attention.",
  },
  {
    index: "06",
    title: "One workspace",
    description:
      "Campaigns, audiences, templates, and automations are interdependent workflows. They should never feel like separate products that simply share a logo.",
    detail:
      "The continuity between tools is the product. The reason a contact enters an audience, triggers an automated sequence, and receives an optimized campaign remains visible as one seamless pipeline.",
  },
];

const audienceTypes = [
  { name: "All", count: "8,421", symbol: "○" },
  { name: "New", count: "1,204", symbol: "+" },
  { name: "Hot", count: "628", symbol: "↑" },
  { name: "Warm", count: "1,876", symbol: "~" },
  { name: "Cold", count: "2,903", symbol: "↓" },
  { name: "Lead", count: "1,810", symbol: "•" },
];

type DragPosition = {
  x: number;
  y: number;
};

function refreshConnections(container: HTMLElement) {
  const containerRect = container.getBoundingClientRect();

  container
    .querySelectorAll<SVGLineElement>("[data-connection]")
    .forEach((line) => {
      const fromId = line.dataset.from;
      const toId = line.dataset.to;

      if (!fromId || !toId) return;

      const from = container.querySelector<HTMLElement>(
        `[data-drag-id="${fromId}"]`,
      );
      const to = container.querySelector<HTMLElement>(
        `[data-drag-id="${toId}"]`,
      );

      if (!from || !to) return;

      const fromRect = from.getBoundingClientRect();
      const toRect = to.getBoundingClientRect();

      line.setAttribute(
        "x1",
        String(fromRect.left + fromRect.width / 2 - containerRect.left),
      );
      line.setAttribute(
        "y1",
        String(fromRect.top + fromRect.height / 2 - containerRect.top),
      );
      line.setAttribute(
        "x2",
        String(toRect.left + toRect.width / 2 - containerRect.left),
      );
      line.setAttribute(
        "y2",
        String(toRect.top + toRect.height / 2 - containerRect.top),
      );
    });
}

function DraggableFloat({
  children,
  className = "",
  dragId,
}: {
  children: ReactNode;
  className?: string;
  dragId?: string;
}) {
  const [position, setPosition] = useState<DragPosition>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  const positionRef = useRef<DragPosition>(position);
  const startPointer = useRef({ x: 0, y: 0 });
  const startPosition = useRef<DragPosition>({ x: 0, y: 0 });
  const elementRef = useRef<HTMLDivElement | null>(null);
  const moveFrame = useRef<number | null>(null);

  const scheduleConnectionRefresh = (container: HTMLElement) => {
    if (moveFrame.current !== null) {
      cancelAnimationFrame(moveFrame.current);
    }

    moveFrame.current = requestAnimationFrame(() => {
      refreshConnections(container);
      moveFrame.current = null;
    });
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    startPointer.current = {
      x: event.clientX,
      y: event.clientY,
    };

    startPosition.current = positionRef.current;
    setDragging(true);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;

    const element = elementRef.current;
    const container =
      element?.closest<HTMLElement>("[data-drag-container]") ??
      element?.parentElement;

    if (!element || !container) return;

    const containerRect = container.getBoundingClientRect();
    const cardRect = element.getBoundingClientRect();

    const deltaX = event.clientX - startPointer.current.x;
    const deltaY = event.clientY - startPointer.current.y;

    const baseLeft =
      cardRect.left - containerRect.left - startPosition.current.x;
    const baseTop =
      cardRect.top - containerRect.top - startPosition.current.y;

    const minX = -baseLeft;
    const minY = -baseTop;
    const maxX = containerRect.width - cardRect.width - baseLeft;
    const maxY = containerRect.height - cardRect.height - baseTop;

    const nextPosition = {
      x: Math.max(
        minX,
        Math.min(startPosition.current.x + deltaX, maxX),
      ),
      y: Math.max(
        minY,
        Math.min(startPosition.current.y + deltaY, maxY),
      ),
    };

    positionRef.current = nextPosition;
    element.style.transform = `translate3d(${nextPosition.x}px, ${nextPosition.y}px, 0)`;

    scheduleConnectionRefresh(container);
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const element = elementRef.current;
    const container =
      element?.closest<HTMLElement>("[data-drag-container]") ??
      element?.parentElement;

    if (container) {
      scheduleConnectionRefresh(container);
    }

    setPosition(positionRef.current);
    setDragging(false);
  };

  useEffect(() => {
    return () => {
      if (moveFrame.current !== null) {
        cancelAnimationFrame(moveFrame.current);
      }
    };
  }, []);

  return (
    <div
      ref={elementRef}
      data-drag-id={dragId}
      className={`${className} select-none ${
        dragging ? "z-30 cursor-grabbing" : "cursor-grab"
      }`}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        transition: dragging
          ? "none"
          : "transform 300ms cubic-bezier(0.22, 1, 0.36, 1)",
        touchAction: "none",
        willChange: "transform",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {children}
    </div>
  );
}

// TOP-LEFT TO BOTTOM DIAGONAL FLUID-GLASS BACKDROP
function DiagonalFluidHeroBackdrop({
  mouseOffset,
}: {
  mouseOffset: { x: number; y: number };
}) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      {/* 1. Dynamic Cursor Light Spotlight */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-500"
        style={{
          background: `radial-gradient(900px circle at ${38 + mouseOffset.x * 12}% ${34 + mouseOffset.y * 12}%, rgba(228,87,46,0.085), transparent 72%)`,
        }}
      />

      {/* 2. Micro-Architectural Coordinate Matrix Grid */}
      <div
        className="absolute inset-0 opacity-[0.32] dark:opacity-[0.14]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(160, 150, 135, 0.16) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(160, 150, 135, 0.16) 1px, transparent 1px)
          `,
          backgroundSize: "72px 72px",
        }}
      />

      {/* 3. The 3D Fluid Glass Stage */}
      <div
        className="absolute inset-0 h-full w-full transition-transform duration-700 ease-out"
        style={{
          transform: `perspective(1200px) rotateX(${mouseOffset.y * -2.4}deg) rotateY(${mouseOffset.x * 2.8}deg) translate3d(${mouseOffset.x * 10}px, ${mouseOffset.y * 10}px, 0)`,
        }}
      >
        <div
          className="relative h-full w-full"
          style={{
            maskImage:
              "radial-gradient(ellipse 115% 105% at 38% 32%, black 25%, rgba(0,0,0,0.6) 65%, transparent 95%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 115% 105% at 38% 32%, black 25%, rgba(0,0,0,0.6) 65%, transparent 95%)",
          }}
        >
          {/* Light Mode: Iridescent Pastel Glass Ribbon */}
          <img
            src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=2400&q=85"
            alt=""
            className="dark:hidden h-full w-full object-cover object-[22%_25%] scale-105 opacity-60 mix-blend-multiply transition-all duration-700"
          />

          {/* Dark Mode: Luminous Obsidian Bioluminescent Glass Wave */}
          <img
            src="https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=2400&q=85"
            alt=""
            className="hidden dark:block h-full w-full object-cover object-[22%_25%] scale-105 opacity-75 mix-blend-screen contrast-125 brightness-110 transition-all duration-700"
          />

          {/* Animated Kinetic Conduit */}
          <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-60 dark:opacity-85">
            <defs>
              <linearGradient id="diagonalBeamLight" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--detrosys-accent, #e4572e)" stopOpacity="0.85" />
                <stop offset="50%" stopColor="#ff8552" stopOpacity="0.45" />
                <stop offset="100%" stopColor="var(--detrosys-accent, #e4572e)" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="diagonalBeamDark" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
                <stop offset="45%" stopColor="#818cf8" stopOpacity="0.65" />
                <stop offset="85%" stopColor="var(--detrosys-accent, #e4572e)" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#e4572e" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M -40 160 C 260 210, 460 120, 720 360 C 940 560, 1160 440, 1420 520"
              fill="none"
              stroke="url(#diagonalBeamLight)"
              strokeWidth="2.5"
              strokeDasharray="8 16"
              className="dark:hidden animate-[dash_12s_linear_infinite]"
            />
            <path
              d="M -40 160 C 260 210, 460 120, 720 360 C 940 560, 1160 440, 1420 520"
              fill="none"
              stroke="url(#diagonalBeamDark)"
              strokeWidth="2.5"
              strokeDasharray="8 16"
              className="hidden dark:block animate-[dash_10s_linear_infinite]"
            />
          </svg>
        </div>
      </div>

      {/* 4. Ambient Depth Lighting */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[15%] top-[14%] h-80 w-80 rounded-full bg-[var(--detrosys-accent)]/10 blur-[110px] dark:bg-[var(--detrosys-accent)]/18"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[20%] bottom-[18%] hidden h-72 w-72 rounded-full bg-violet-600/15 blur-[120px] dark:block"
      />

      {/* 5. MULTI-STOP DISSOLVE INTO SECTION 2 (#story) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-48 bg-gradient-to-b from-transparent via-[#f3f1eb]/70 to-[#e8e4da] dark:via-[#0b0b0b]/70 dark:to-[#111111]"
      />
    </div>
  );
}

export function HomePage() {
  const [openFeature, setOpenFeature] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const toggleSound = () => {
    if (!videoRef.current) return;
    const nextMuted = !videoRef.current.muted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const { clientX, clientY, currentTarget } = e;
    const { width, height, left, top } = currentTarget.getBoundingClientRect();
    const x = ((clientX - left) / width - 0.5) * 2;
    const y = ((clientY - top) / height - 0.5) * 2;
    setMouseOffset({ x, y });
  };

  useEffect(() => {
    setIsAuthenticated(isSessionActive());
  }, []);

  useEffect(() => {
    const containers = Array.from(
      document.querySelectorAll<HTMLElement>("[data-drag-container]"),
    );

    const refreshAll = () => {
      containers.forEach(refreshConnections);
    };

    refreshAll();

    const resizeObserver = new ResizeObserver(refreshAll);
    containers.forEach((container) => resizeObserver.observe(container));
    window.addEventListener("resize", refreshAll);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", refreshAll);
    };
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f3f1eb] text-neutral-950 dark:bg-[#0b0b0b] dark:text-white">
      <PublicNavbar />

      <main>
        {/* ============================================================
            SECTION 1: HERO
        ============================================================ */}
        <section
          onMouseMove={handleMouseMove}
          className="relative min-h-screen overflow-hidden px-6 pb-24 pt-32 sm:px-8 lg:px-12"
        >
          {/* Diagonal Fluid-Glass Backdrop */}
          <DiagonalFluidHeroBackdrop mouseOffset={mouseOffset} />

          {/* Ambient Lighting Spheres */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-[35%] top-[12%] h-[34rem] w-[34rem] rounded-full bg-[var(--detrosys-accent)]/10 blur-[130px]"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-[-8rem] top-[42%] h-72 w-72 rounded-full border border-neutral-300/60 dark:border-neutral-800/60"
          />

          <div className="relative z-10 mx-auto flex min-h-[calc(100vh-8rem)] max-w-[1400px] flex-col justify-between">
            {/* Headline and Narrative */}
            <div className="grid items-end gap-14 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="max-w-5xl">
                <h1 className="text-[clamp(4rem,9.5vw,10.5rem)] font-semibold leading-[0.82] tracking-[-0.075em]">
                  <span className="block">Work</span>

                  <span className="ml-[8vw] block text-neutral-400 dark:text-neutral-600">
                    connected.
                  </span>

                  <span className="block">Think clear.</span>
                </h1>

                <p className="mt-12 max-w-2xl text-xl leading-9 tracking-[-0.02em] text-neutral-600 sm:text-2xl sm:leading-10 dark:text-neutral-400">
                  Unified email marketing, SMS campaigns, and visual workflow
                  automations—built without the bloated CRM fees.
                </p>
              </div>

              <div className="max-w-lg pb-2 lg:justify-self-end">
                <p className="text-lg leading-8 text-neutral-600 dark:text-neutral-400">
                  Sync subscribers. Organize smart audiences. Deploy high-converting
                  campaigns. Automate follow-up sequences. All from one fluid
                  workspace.
                </p>

                <p className="mt-6 text-lg leading-8 text-neutral-600 dark:text-neutral-400">
                  Most platforms force you to jump across disconnected screens
                  and pay extra every time your list grows. Detrosys unifies the
                  entire relationship chain.
                </p>

                <div className="mt-9 flex flex-wrap items-center gap-5">
                  <a
                    href={isAuthenticated ? "/app" : "/signup"}
                    className="group flex items-center gap-3 rounded-full bg-neutral-950 px-6 py-3.5 text-sm font-semibold !text-white shadow-[0_10px_28px_rgba(0,0,0,0.16)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_35px_rgba(0,0,0,0.2)] dark:bg-white dark:!text-neutral-950"
                  >
                    <span className="!text-white dark:!text-neutral-950">
                      {isAuthenticated ? "Go to Dashboard" : "Start free"}
                    </span>

                    <ArrowRight
                      size={16}
                      className="!text-white transition-transform duration-300 group-hover:translate-x-1 dark:!text-neutral-950"
                    />
                  </a>

                  <a
                    href="#how-it-works"
                    className="flex items-center gap-2 px-1 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white"
                  >
                    Explore how it works
                    <span aria-hidden="true">↓</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Interactive Connected Workflow Canvas */}
            <div
              className="relative mt-20 min-h-[430px] sm:min-h-[520px] lg:min-h-[600px]"
              data-drag-container
            >
              <svg
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-0 h-full w-full"
              >
                <line
                  data-connection
                  data-from="hero-audience"
                  data-to="hero-campaign"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeDasharray="4 6"
                  strokeLinecap="round"
                  className="text-neutral-400/80 transition-colors dark:text-neutral-700"
                />
                <line
                  data-connection
                  data-from="hero-campaign"
                  data-to="hero-automation"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeDasharray="4 6"
                  strokeLinecap="round"
                  className="text-neutral-400/80 transition-colors dark:text-neutral-700"
                />
              </svg>

              {/* Draggable Cards Matrix */}
              <div className="relative z-10 grid min-h-[430px] gap-4 sm:min-h-[520px] sm:grid-cols-3 sm:items-center lg:min-h-[600px] lg:grid-cols-[1fr_1.2fr_1fr]">
                {/* 1. Audience Card */}
                <div className="relative flex min-h-[150px] items-end sm:min-h-[260px]">
                  <DraggableFloat
                    dragId="hero-audience"
                    className="w-full max-w-xs"
                  >
                    <div className="relative w-full rounded-[1.5rem] border border-neutral-300 bg-[#e9e6de]/95 p-5 shadow-[0_25px_60px_rgba(0,0,0,0.08)] backdrop-blur-md transition-shadow duration-300 hover:shadow-[0_30px_70px_rgba(0,0,0,0.12)] dark:border-neutral-700 dark:bg-neutral-900/95">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-widest text-neutral-400">
                          Audience
                        </span>
                        <CircleDot size={13} />
                      </div>

                      <p className="mt-10 text-xl font-semibold">Warm</p>

                      <p className="mt-1 text-xs text-neutral-500">
                        1,876 subscribers
                      </p>
                    </div>
                  </DraggableFloat>
                </div>

                {/* 2. Campaign Card */}
                <div className="relative mx-auto w-full max-w-md">
                  <DraggableFloat dragId="hero-campaign" className="w-full">
                    <div className="rounded-[2rem] border border-neutral-300 bg-[#e8e4da]/95 p-6 shadow-[0_35px_80px_rgba(0,0,0,0.1)] backdrop-blur-md transition-shadow duration-300 hover:shadow-[0_40px_90px_rgba(0,0,0,0.14)] dark:border-neutral-700 dark:bg-neutral-900/95">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-widest text-neutral-400">
                          Campaign
                        </span>

                        <span className="flex items-center gap-2 text-[10px] text-neutral-500">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--detrosys-accent)]" />
                          Live flow
                        </span>
                      </div>

                      <p className="mt-12 text-2xl font-semibold tracking-[-0.04em]">
                        Spring / Re-engage
                      </p>

                      <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                        <span className="rounded-full border border-neutral-300 px-3 py-1.5 dark:border-neutral-700">
                          Audience
                        </span>
                        <ArrowRight size={12} />
                        <span className="rounded-full border border-neutral-300 px-3 py-1.5 dark:border-neutral-700">
                          Template
                        </span>
                        <ArrowRight size={12} />
                        <span className="rounded-full border border-neutral-300 px-3 py-1.5 dark:border-neutral-700">
                          Automation
                        </span>
                      </div>
                    </div>
                  </DraggableFloat>
                </div>

                {/* 3. Automation Card */}
                <div className="relative flex min-h-[150px] items-start justify-end sm:min-h-[260px] sm:items-center">
                  <DraggableFloat
                    dragId="hero-automation"
                    className="w-full max-w-xs"
                  >
                    <div className="w-full rounded-[1.75rem] bg-neutral-950/95 p-5 text-white shadow-[0_35px_80px_rgba(0,0,0,0.18)] backdrop-blur-md transition-shadow duration-300 hover:shadow-[0_40px_90px_rgba(0,0,0,0.22)] dark:bg-[#f1efe8]/95 dark:text-neutral-950">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-widest opacity-50">
                          Automation
                        </span>
                        <ArrowRight size={14} />
                      </div>

                      <p className="mt-10 text-lg font-semibold">Follow-up</p>

                      <p className="mt-1 text-xs opacity-50">
                        3 actions connected
                      </p>
                    </div>
                  </DraggableFloat>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            SECTION 2: PRODUCT TOUR / WORKFLOW ENGINE
        ============================================================ */}
        <section
          id="story"
          className="relative scroll-mt-20 overflow-hidden bg-[#e8e4da] px-6 py-28 sm:px-8 lg:px-12 dark:bg-[#111111]"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 left-[10%] h-64 w-64 rounded-full bg-[var(--detrosys-accent)]/6 blur-[90px]"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-[-10rem] top-[-10rem] h-[30rem] w-[30rem] rounded-full border border-neutral-300/70 dark:border-neutral-800/70"
          />

          <div className="mx-auto max-w-[1400px]">
            <div className="grid gap-14">
              <div className="order-2">
                <h2 className="max-w-xl text-5xl font-semibold leading-[0.93] tracking-[-0.055em] sm:text-6xl">
                  See how work moves through Detrosys.
                </h2>

                <div className="mt-8 space-y-6 text-base leading-7 text-neutral-600 dark:text-neutral-400">
                  <p>
                    Most marketing tools make you configure everything in
                    isolation: contacts in one tab, templates in another,
                    triggers hidden in deep settings.
                  </p>

                  <p>
                    Detrosys connects the entire lifecycle in real time. Watch a
                    contact arrive, see them map into an audience segment,
                    trigger a tailored email or SMS campaign, and follow up
                    automatically when they engage.
                  </p>

                  <p>
                    One continuous pipeline designed for speed, clarity, and
                    dependable inbox placement.
                  </p>
                </div>
              </div>

              <div className="order-1 relative w-full overflow-hidden rounded-[2rem] border border-neutral-300 bg-[#f6f4ef] shadow-2xl dark:border-neutral-700 dark:bg-neutral-950">
                {/* SCALING VIDEO (NO CROPPING, SCALES WITH SCREEN) */}
                <video
                  ref={videoRef}
                  autoPlay
                  muted={isMuted}
                  loop
                  playsInline
                  onClick={toggleSound}
                  className="block h-auto w-full cursor-pointer object-contain"
                >
                  <source src="/videos/product-tour.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>

                {/* DECORATIVE RINGS */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-[430px] w-[430px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-neutral-950/[0.05] dark:border-white/[0.08]"
                />

                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-neutral-950/[0.05] dark:border-white/[0.08]"
                />

                {/* TOP-LEFT LABEL */}
                <div className="pointer-events-none absolute left-6 top-6 z-20 flex items-center gap-2 rounded-full bg-black/55 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur-md sm:left-8 sm:top-8">
                  <span className="h-2 w-2 rounded-full bg-[var(--detrosys-accent)]" />
                  DETROSYS / INTERACTIVE WORKFLOW PREVIEW
                </div>

                {/* SOUND TOGGLE BUTTON (TOP-RIGHT) */}
                <button
                  type="button"
                  onClick={toggleSound}
                  aria-label={isMuted ? "Unmute video" : "Mute video"}
                  className="absolute right-6 top-6 z-20 flex items-center gap-2 rounded-full border border-white/15 bg-black/65 px-3.5 py-1.5 text-xs font-medium text-white shadow-lg backdrop-blur-md transition hover:bg-black/80 sm:right-8 sm:top-8"
                >
                  {isMuted ? (
                    <>
                      <VolumeX size={14} />
                      <span>Sound Off</span>
                    </>
                  ) : (
                    <>
                      <Volume2 size={14} className="text-[var(--detrosys-accent)]" />
                      <span>Sound On</span>
                    </>
                  )}
                </button>

                <div className="pointer-events-none absolute bottom-0 left-0 z-20 h-px w-[62%] bg-white/30" />
              </div>
            </div>
          </div>

          {/* DISSOLVE INTO SECTION 3 (#how-it-works) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-44 bg-gradient-to-b from-transparent via-[#e8e4da]/70 to-[#eee9df] dark:via-[#111111]/70 dark:to-[#0d0d0d]"
          />
        </section>

        {/* ============================================================
            SECTION 3: HOW IT WORKS
        ============================================================ */}
        <section
          id="how-it-works"
          className="relative scroll-mt-20 overflow-hidden bg-[#eee9df] px-6 py-32 sm:px-8 lg:px-12 dark:bg-[#0d0d0d]"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-[-8rem] top-[25%] h-80 w-80 rounded-full border border-neutral-300/60 dark:border-neutral-800/60"
          />

          <div className="mx-auto max-w-[1400px]">
            <div className="grid gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
              <div>
                <h2 className="max-w-5xl text-5xl font-semibold leading-[0.9] tracking-[-0.06em] sm:text-7xl lg:text-8xl">
                  The system follows
                  <span className="block mt-3 text-neutral-400 dark:text-neutral-600">
                    how marketing actually executes.
                  </span>
                </h2>
              </div>

              <div className="max-w-xl text-lg leading-8 text-neutral-600 dark:text-neutral-400">
                <p>
                  Marketing work flows naturally: a subscriber joins your list,
                  qualifies for an audience segment, receives a tailored
                  campaign, and triggers continuous automated follow-up.
                </p>

                <p className="mt-6">
                  Detrosys organizes your workspace around that natural chain
                  rather than asking you to reconstruct context across six
                  unrelated screens.
                </p>
              </div>
            </div>

            <div className="mt-24 border-y border-neutral-300/70 dark:border-neutral-800/70">
              <div className="grid lg:grid-cols-3">
                {[
                  {
                    number: "01",
                    title: "Connect your contacts",
                    text: "Import existing customer lists via CSV or sync leads in real time through webhooks. Detrosys organizes contacts into clear subscriber profiles that keep engagement history, tags, and deliverability status front and center.",
                    extra:
                      "No hidden records lost in static spreadsheets. Every contact connects directly to the audience segments and automations that follow.",
                  },
                  {
                    number: "02",
                    title: "Design targeted campaigns",
                    text: "Build and preview responsive email and SMS templates that look sharp across all client devices. Connect your message directly to the audience segment that needs it and dispatch with reliable deliverability.",
                    extra:
                      "Eliminate disconnected design tools. What you author in your template editor is immediately ready to dispatch across active workflows.",
                  },
                  {
                    number: "03",
                    title: "Automate the follow-up",
                    text: "Turn repetitive customer touchpoints into dependable visual automations. Set behavioral triggers, schedule multi-step drip sequences, and let the system execute reliably 24/7.",
                    extra:
                      "Visual nodes let you inspect the full logic at a glance: trigger conditions, delivery delays, and communication actions.",
                  },
                ].map((step) => (
                  <article
                    key={step.number}
                    className="min-h-[520px] border-b border-neutral-300/70 p-8 last:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0 lg:p-12 dark:border-neutral-800/70"
                  >
                    <span className="text-xs text-neutral-400">
                      {step.number}
                    </span>

                    <div className="mt-20">
                      <h3 className="text-3xl font-semibold tracking-[-0.04em]">
                        {step.title}
                      </h3>

                      <p className="mt-7 text-base leading-8 text-neutral-600 dark:text-neutral-400">
                        {step.text}
                      </p>

                      <p className="mt-6 text-sm leading-7 text-neutral-400 dark:text-neutral-500">
                        {step.extra}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="mt-20 grid gap-10 border-b border-neutral-300/70 pb-20 lg:grid-cols-[0.7fr_1.3fr] dark:border-neutral-800/70">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-400">
                The core principle
              </p>

              <div className="max-w-4xl">
                <p className="text-2xl leading-[1.6] tracking-[-0.025em] sm:text-3xl sm:leading-[1.65]">
                  You should never have to piece together six separate tools to
                  run one automated campaign.
                </p>

                <p className="mt-9 max-w-3xl text-base leading-8 text-neutral-500 dark:text-neutral-400">
                  When your contact database, email templates, SMS delivery, and
                  automation logic live in separate apps, you waste hours
                  syncing data. Detrosys unifies the entire chain into one
                  coherent, dependable interface.
                </p>
              </div>
            </div>
          </div>

          {/* DISSOLVE INTO SECTION 4 */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-48 bg-gradient-to-b from-transparent via-[#eee9df]/50 to-neutral-950 dark:via-[#0d0d0d]/50 dark:to-[#141414]"
          />
        </section>

        {/* ============================================================
            SECTION 4: INSIDE THE WORKSPACE (AUDIENCE MATRIX)
        ============================================================ */}
        <section className="relative overflow-hidden bg-neutral-950 px-6 py-32 text-white sm:px-8 lg:px-12 dark:bg-[#141414]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-[-10rem] top-[15%] h-[32rem] w-[32rem] rounded-full border border-white/[0.06]"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-[-12rem] right-[-12rem] h-[38rem] w-[38rem] rounded-full border border-white/[0.06]"
          />

          <div className="mx-auto max-w-[1400px]">
            <div className="grid gap-16 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
              <div>
                <h2 className="max-w-xl text-5xl font-semibold leading-[0.92] tracking-[-0.06em] sm:text-6xl">
                  Your audience isn't a spreadsheet.
                  <span className="mt-5 block text-white/30">
                    It's context for action.
                  </span>
                </h2>

                <div className="mt-10 max-w-lg space-y-7 text-base leading-8 text-white/55">
                  <p>
                    A spreadsheet can tell you that there are 1,876 contacts in
                    a list. It cannot, by itself, tell you why they are there,
                    what work they belong to, or what communication should
                    trigger next.
                  </p>

                  <p>
                    Detrosys treats an audience as living operational context.
                    Groups connect directly to the campaigns that reach them,
                    the templates that speak to them, and the automations that
                    nurture them over time.
                  </p>

                  <p>
                    That distinction removes guesswork and allows you to scale
                    outreach without losing clarity.
                  </p>
                </div>
              </div>

              <div
                className="relative min-h-[560px]"
                data-drag-container
              >
                <svg
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 z-0 h-full w-full"
                >
                  {audienceTypes.map((audience) => (
                    <line
                      key={audience.name}
                      data-connection
                      data-from={`audience-${audience.name.toLowerCase()}`}
                      data-to="audience-center"
                      stroke="currentColor"
                      strokeWidth="1"
                      className="text-white/10"
                    />
                  ))}
                </svg>
                <div className="absolute left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10">
                  <div className="absolute inset-10 rounded-full border border-white/10" />
                  <div className="absolute inset-[95px] rounded-full bg-white/[0.035]" />
                </div>

                <div
                  data-drag-id="audience-center"
                  className="absolute left-1/2 top-1/2 z-20 flex h-36 w-48 -translate-x-1/2 -translate-y-1/2 flex-col justify-between rounded-3xl border border-white/15 bg-white/[0.08] p-5 backdrop-blur-xl"
                >
                  <div className="flex justify-between text-[10px] uppercase tracking-widest text-white/40">
                    <span>Audience</span>
                    <span>Live</span>
                  </div>

                  <div>
                    <p className="text-2xl font-semibold">Warm leads</p>
                    <p className="mt-1 text-xs text-white/40">
                      1,876 contacts
                    </p>
                  </div>
                </div>

                {audienceTypes.map((audience, index) => {
                  const positions = [
                    "left-0 top-[12%]",
                    "right-[3%] top-[18%]",
                    "right-0 bottom-[17%]",
                    "left-[7%] bottom-[5%]",
                    "left-[38%] top-0",
                    "left-[34%] bottom-0",
                  ];

                  return (
                    <DraggableFloat
                      key={audience.name}
                      dragId={`audience-${audience.name.toLowerCase()}`}
                      className={`absolute z-10 ${positions[index]} w-36 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl transition-shadow duration-300 hover:shadow-[0_15px_40px_rgba(0,0,0,0.2)]`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/40">
                          {audience.symbol}
                        </span>

                        <span className="text-[10px] text-white/30">
                          {audience.count}
                        </span>
                      </div>

                      <p className="mt-5 text-sm font-medium">
                        {audience.name}
                      </p>
                    </DraggableFloat>
                  );
                })}
              </div>
            </div>
          </div>

          {/* DISSOLVE INTO SECTION 5 */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-48 bg-gradient-to-b from-transparent via-neutral-950/60 to-[#f0ece2] dark:via-[#141414]/60 dark:to-[#0e0e0e]"
          />
        </section>

        {/* ============================================================
            SECTION 5: FEATURES
        ============================================================ */}
        <section
          id="features"
          className="relative scroll-mt-20 overflow-hidden bg-[#f0ece2] px-6 py-32 sm:px-8 lg:px-12 dark:bg-[#0e0e0e]"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-[-12rem] top-[25%] h-96 w-96 rounded-full border border-neutral-300/60 dark:border-neutral-800/60"
          />

          <div className="mx-auto max-w-[1400px]">
            <div className="grid gap-12 lg:grid-cols-[0.5fr_1.5fr]">
              <div>
                <h2 className="max-w-xs text-4xl font-semibold leading-[0.95] tracking-[-0.05em]">
                  Six capabilities.
                  <span className="mt-3 block text-neutral-400 dark:text-neutral-600">
                    One place to understand them.
                  </span>
                </h2>

                <p className="mt-8 max-w-sm text-base leading-7 text-neutral-500 dark:text-neutral-400">
                  Every capability in Detrosys works smoothly on its own, but
                  delivers real leverage when connected together.
                </p>
              </div>

              <div>
                <div className="border-t border-neutral-300/70 dark:border-neutral-800/70">
                  {featureItems.map((feature) => {
                    const isOpen = openFeature === feature.index;

                    return (
                      <article
                        key={feature.index}
                        className="border-b border-neutral-300/70 dark:border-neutral-800/70"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setOpenFeature(isOpen ? null : feature.index)
                          }
                          className="group grid w-full gap-6 py-8 text-left transition-all duration-300 lg:grid-cols-[70px_0.7fr_1fr_40px] lg:items-start"
                          aria-expanded={isOpen}
                        >
                          <span className="text-xs text-neutral-400">
                            {feature.index}
                          </span>

                          <span className="text-2xl font-semibold tracking-[-0.035em]">
                            {feature.title}
                          </span>

                          <span className="text-sm leading-7 text-neutral-500 dark:text-neutral-400">
                            {feature.description}
                          </span>

                          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 text-neutral-400 transition-transform duration-300 group-hover:border-neutral-400 dark:border-neutral-800 dark:group-hover:border-neutral-600">
                            <Plus
                              size={16}
                              className={`transition-transform duration-300 ${
                                isOpen ? "rotate-45" : ""
                              }`}
                            />
                          </span>
                        </button>

                        <div
                          className={`grid transition-[grid-template-rows,opacity] duration-300 ${
                            isOpen
                              ? "grid-rows-[1fr] opacity-100"
                              : "grid-rows-[0fr] opacity-0"
                          }`}
                        >
                          <div className="overflow-hidden">
                            <div className="pb-9 pl-0 lg:pl-[70px] lg:pr-20">
                              <p className="max-w-3xl border-l border-[var(--detrosys-accent)] pl-6 text-base leading-8 text-neutral-600 dark:text-neutral-400">
                                {feature.detail}
                              </p>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* DISSOLVE INTO SECTION 6 (#about) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-40 bg-gradient-to-b from-transparent via-[#f0ece2]/75 to-[#e8e3d8] dark:via-[#0e0e0e]/75 dark:to-[#111111]"
          />
        </section>

        {/* ============================================================
            SECTION 6: ABOUT DETROSYS (CLEAN & SPACED HEADLINE)
        ============================================================ */}
        <section
          id="about"
          className="relative scroll-mt-20 overflow-hidden bg-[#e8e3d8] px-6 py-32 sm:px-8 lg:px-12 dark:bg-[#111111]"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-[-12rem] top-[10%] h-[34rem] w-[34rem] rounded-full border border-neutral-300/60 dark:border-neutral-800/70"
          />

          <div className="mx-auto max-w-[1400px]">
            <div className="grid gap-16 lg:grid-cols-[0.8fr_1.2fr]">
              {/* Left Column: Clean Headline with generous spacing */}
              <div>
                <h2 className="max-w-xl text-4xl font-semibold leading-[1.08] tracking-[-0.035em] sm:text-6xl sm:leading-[1.05] lg:text-[4.25rem]">
                  Built for teams tired of overpaying for marketing bloat.
                </h2>

                <p className="mt-8 max-w-md text-lg leading-8 text-neutral-600 dark:text-neutral-400">
                  Most platforms punish you for growing. Detrosys was created with
                  a straightforward standard: you should know exactly what you
                  pay for, understand your interface immediately, and never pay
                  an enterprise tax just to reach your own audience.
                </p>
              </div>

              {/* Right Column: Grounded Reality & 4 Pillars */}
              <div className="max-w-3xl">
                <div className="space-y-8 text-lg leading-9 text-neutral-700 dark:text-neutral-300">
                  <p>
                    Legacy marketing platforms and bloated CRMs were engineered
                    around endless feature checklists rather than daily
                    operational reality. They trap teams in labyrinthine
                    navigation menus, hide basic automated workflows behind
                    enterprise paywalls, and use opaque billing tiers where
                    your subscription price doubles the moment your contact
                    list expands.
                  </p>

                  <p>
                    We built Detrosys from the ground up to solve that exact
                    problem. Instead of copying twenty-year-old CRM playbooks or
                    burying you in unused complexity, Detrosys focuses on the
                    engine that actually drives business revenue every day:
                    high-deliverability email dispatch, clean audience context,
                    and visual automation.
                  </p>

                  <p>
                    Mid-to-high volume businesses frequently cut their
                    operational marketing software expenses by thousands of
                    dollars simply by moving off bloated legacy stacks onto an
                    engine designed for speed, clarity, and fair unit
                    economics.
                  </p>
                </div>

                <div className="mt-14 border-t border-neutral-300/80 pt-12 dark:border-neutral-700/80">
                  <p className="text-2xl font-semibold leading-[1.3] tracking-[-0.025em] sm:text-3xl text-neutral-900 dark:text-white">
                    Scaling your audience should feel like an achievement, not a
                    financial penalty.
                  </p>
                </div>

                {/* 2x2 Core Pillars Grid */}
                <div className="mt-12 grid gap-10 sm:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-neutral-400">
                      Transparent Unit Economics
                    </h3>

                    <p className="mt-4 text-base leading-7 text-neutral-600 dark:text-neutral-400">
                      Most platforms lure you in cheap and aggressively hike
                      renewal rates as you add contacts. Detrosys is built on
                      predictable tier structures and permanent capacity
                      expansions. You always know down to the dollar what you are
                      paying for.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-neutral-400">
                      Email-First Workflows
                    </h3>

                    <p className="mt-4 text-base leading-7 text-neutral-600 dark:text-neutral-400">
                      Flashy features mean nothing if messages don't reach the
                      customer. Email is the backbone of digital revenue, and
                      Detrosys treats deliverability and drafting clarity as top
                      priorities.
                    </p>
                  </div>
                </div>

                <div className="mt-12 grid gap-10 sm:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-neutral-400">
                      Zero CRM Clutter
                    </h3>

                    <p className="mt-4 text-base leading-7 text-neutral-600 dark:text-neutral-400">
                      We eliminated the traditional CRM learning curve. Instead
                      of jumping between disconnected menus just to trigger one
                      drip sequence, your audiences, templates, and automations
                      live in one visual canvas.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-neutral-400">
                      Engineered for Real Margin
                    </h3>

                    <p className="mt-4 text-base leading-7 text-neutral-600 dark:text-neutral-400">
                      Independent brands shouldn't have to subsidize
                      venture-backed enterprise software markups. By keeping our
                      platform lean and focused, we pass the savings directly
                      back to your bottom line.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* DISSOLVE DIRECTLY INTO FINAL CLOSING CTA SECTION */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-40 bg-gradient-to-b from-transparent via-[#e8e3d8]/75 to-[#f3f1eb] dark:via-[#111111]/75 dark:to-[#0b0b0b]"
          />
        </section>

        {/* ============================================================
            SECTION 7: FINAL COMBINED CLOSING CTA
        ============================================================ */}
        <section className="relative overflow-hidden bg-[#f3f1eb] px-6 pb-24 sm:px-8 lg:px-12 lg:pb-32 dark:bg-[#0b0b0b]">
          <div className="mx-auto max-w-[1400px]">
            <div className="relative overflow-hidden rounded-[3rem] bg-neutral-950 px-8 py-16 text-white shadow-[0_30px_100px_rgba(0,0,0,0.14)] sm:px-14 sm:py-20 lg:px-20 lg:py-24 dark:bg-[#f1efe8] dark:text-neutral-950">
              {/* Geometry */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-40 -top-40 h-[34rem] w-[34rem] rounded-full border border-white/[0.1] dark:border-black/[0.08]"
              />

              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-20 -top-20 h-[24rem] w-[24rem] rounded-full border border-white/[0.1] dark:border-black/[0.08]"
              />

              <div
                aria-hidden="true"
                className="pointer-events-none absolute bottom-[-10rem] left-[35%] h-[26rem] w-[26rem] rounded-full border border-white/[0.06] dark:border-black/[0.06]"
              />

              <div
                aria-hidden="true"
                className="absolute right-10 top-10 h-2 w-2 rounded-full bg-[var(--detrosys-accent)] shadow-[0_0_20px_rgba(0,0,0,0.4)]"
              />

              <div className="relative grid gap-16 lg:grid-cols-[1fr_0.45fr] lg:items-end">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] !text-white/40 dark:!text-neutral-950/40">
                    Detrosys / Start here
                  </p>

                  <h2 className="mt-7 max-w-5xl text-5xl font-semibold leading-[0.88] tracking-[-0.07em] sm:text-7xl lg:text-[7.5rem]">
                    <span className="block">Your work should</span>

                    <span className="mt-3 block !text-white/35 dark:!text-neutral-950/30">
                      be complicated.
                    </span>

                    <span className="mt-3 block">
                      Your software shouldn't.
                    </span>
                  </h2>

                  <p className="mt-10 max-w-2xl text-lg leading-8 !text-white/55 dark:!text-neutral-950/55">
                    Detrosys brings the pieces of everyday business work into
                    one place — campaigns, people, templates, automations, and
                    the information connecting them. Less hunting. Less
                    switching. More time actually doing the work.
                  </p>

                  <div className="mt-10 flex flex-wrap items-center gap-5">
                    <a
                      href={isAuthenticated ? "/app" : "/signup"}
                      className="group flex items-center gap-3 rounded-full bg-white px-7 py-4 text-sm font-semibold !text-neutral-950 shadow-[0_12px_30px_rgba(0,0,0,0.2)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(0,0,0,0.28)] dark:bg-neutral-950 dark:!text-white"
                    >
                      <span className="!text-neutral-950 dark:!text-white">
                        {isAuthenticated ? "Go to Dashboard" : "Get started"}
                      </span>

                      <ArrowRight
                        size={16}
                        className="!text-neutral-950 transition-transform duration-300 group-hover:translate-x-1 dark:!text-white"
                      />
                    </a>

                    <span className="text-sm !text-white/40 dark:!text-neutral-950/40">
                      Come in. Look around. Decide for yourself.
                    </span>
                  </div>
                </div>

                <div className="relative hidden min-h-[280px] lg:block">
                  <div className="absolute bottom-0 right-0 h-[260px] w-[260px] rounded-full border border-white/[0.08] dark:border-black/[0.08]" />

                  <div className="absolute bottom-[55px] right-[55px] h-[150px] w-[150px] rounded-full border border-white/[0.1] dark:border-black/[0.1]" />

                  <div className="absolute bottom-[120px] right-[120px] h-3 w-3 rounded-full bg-[var(--detrosys-accent)]" />

                  <div className="absolute bottom-0 right-0 text-right text-[10px] uppercase leading-6 tracking-[0.2em] !text-white/25 dark:!text-neutral-950/25">
                    <div>People</div>
                    <div>Audiences</div>
                    <div>Campaigns</div>
                    <div>Templates</div>
                    <div>Automation</div>
                    <div>One workspace</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}