import React, {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
} from "react";
import { useLocation } from "react-router";

export function NavigationPacer({
  children,
}: {
  children: React.ReactNode;
}) {
  const location = useLocation();

  // Controls the actual route rendered on screen during transitions
  const [displayLocation, setDisplayLocation] = useState(location);
  const [stage, setStage] = useState<"idle" | "exiting" | "entering">("idle");
  const [progress, setProgress] = useState(0);

  const prevPathRef = useRef(location.pathname + location.search);

  useEffect(() => {
    const currentPath = location.pathname + location.search;

    if (currentPath !== prevPathRef.current) {
      prevPathRef.current = currentPath;

      // Stage 1: Graceful Exit
      setStage("exiting");
      setProgress(70);

      const exitTimer = window.setTimeout(() => {
        // Swap to the new route behind the scenes
        setDisplayLocation(location);

        // Level all scroll containers
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        document.querySelectorAll("main, [data-scroll-container]").forEach((el) => {
          el.scrollTop = 0;
        });

        // Stage 2: Graceful Enter
        setStage("entering");
        setProgress(100);

        const enterTimer = window.setTimeout(() => {
          setStage("idle");
          setProgress(0);
        }, 160);

        return () => window.clearTimeout(enterTimer);
      }, 160);

      return () => window.clearTimeout(exitTimer);
    }
  }, [location]);

  // Clone Routes and provide displayLocation so the previous page holds until fade completes
  const content = Children.map(children, (child) => {
    if (isValidElement(child)) {
      return cloneElement(
        child as React.ReactElement<{ location?: typeof location }>,
        {
          location: displayLocation,
        },
      );
    }
    return child;
  });

  return (
    <>
      <style>{`
        /* Tactile press response for all interactive elements */
        button:not(:disabled):active,
        [role="button"]:not([aria-disabled="true"]):active {
          transform: scale(0.98);
          transition: transform 90ms ease-out;
        }

        /* Pure opacity transition - no persistent transform on root */
        .detrosys-pacer-wrapper {
          min-height: 100vh;
          width: 100%;
          transition: opacity 160ms cubic-bezier(0.2, 0.8, 0.4, 1);
        }

        .detrosys-pacer-exiting {
          opacity: 0.35;
        }

        .detrosys-pacer-entering {
          opacity: 1;
        }
      `}</style>

      {/* Top accent progress line */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-0 right-0 top-0 z-[9999] h-[2.5px] overflow-hidden"
        style={{
          opacity: stage !== "idle" ? 1 : 0,
          transition: "opacity 160ms ease-out",
        }}
      >
        <div
          className="h-full bg-gradient-to-r from-[var(--detrosys-accent,#e4572e)] via-[#ff7347] to-[var(--detrosys-accent,#e4572e)] shadow-[0_0_12px_rgba(228,87,46,0.85)]"
          style={{
            width: `${progress}%`,
            transition:
              progress === 100
                ? "width 140ms ease-out"
                : "width 220ms cubic-bezier(0.2, 0.8, 0.4, 1)",
          }}
        />
      </div>

      <div
        className={`detrosys-pacer-wrapper ${
          stage === "exiting"
            ? "detrosys-pacer-exiting"
            : stage === "entering"
              ? "detrosys-pacer-entering"
              : ""
        }`}
      >
        {content}
      </div>
    </>
  );
}