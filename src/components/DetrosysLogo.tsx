type DetrosysLogoProps = {
  /** Size in pixels for the square logo icon container (default: 36) */
  size?: number;
  /** Whether to render the 'Detrosys' text next to the mark (default: false) */
  showText?: boolean;
  /** Custom class for the wrapper */
  className?: string;
  /** Custom class for the text */
  textClassName?: string;
  /** Optional custom file path (defaults to /logo.png with auto-fallbacks) */
  src?: string;
};

export function DetrosysLogo({
  size = 36,
  showText = false,
  className = "",
  textClassName = "",
  src = "/logo.png",
}: DetrosysLogoProps) {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* Universal Logo Tile */}
      <span
        style={{ width: `${size}px`, height: `${size}px` }}
        className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-[13px] border border-black/10 bg-white p-1 shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-transform duration-300 group-hover:-translate-y-0.5 dark:border-white/10 dark:bg-neutral-900"
      >
        <img
          src={src}
          alt="Detrosys"
          className="h-full w-full object-contain select-none"
          draggable={false}
          onError={(e) => {
            const target = e.currentTarget;
            // Auto-fallback chain if the exact extension or name differs in public/
            if (target.src.endsWith(".png")) {
              target.src = "/logo.jpg";
            } else if (target.src.endsWith("/logo.jpg")) {
              target.src = "/Custom Logo for Detrosys.jpg";
            } else if (!target.src.endsWith(".svg")) {
              target.src = "/logo.svg";
            }
          }}
        />
      </span>

      {/* Optional Brand Wordmark */}
      {showText && (
        <span
          className={`text-[17px] font-semibold tracking-[-0.035em] text-neutral-950 dark:text-white ${textClassName}`}
        >
          Detrosys
        </span>
      )}
    </div>
  );
}