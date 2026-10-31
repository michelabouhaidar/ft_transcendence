interface LogoProps {
  size?: "sm" | "md";
  showWordmark?: boolean;
  /** Extra classes for the TRENNO text, e.g. "hidden sm:inline" to drop it on phones. */
  wordmarkClassName?: string;
}

const SIZES = { sm: { icon: 30, text: "text-lg" }, md: { icon: 38, text: "text-2xl" } };

// Faceted geometric "T" emblem with the TRENNO wordmark.
export function Logo({ size = "md", showWordmark = true, wordmarkClassName = "" }: LogoProps) {
  const { icon, text } = SIZES[size];
  return (
    <div className="flex items-center gap-3 select-none">
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 48 48"
        fill="none"
        className="shrink-0 drop-shadow-[0_4px_12px_theme(colors.brand.600/35%)] transition-transform duration-300 hover:scale-105"
      >
        <defs>
          <linearGradient id="t-wing-left" x1="6" y1="8" x2="24" y2="18" gradientUnits="userSpaceOnUse">
            <stop offset="0%" className="[stop-color:theme(colors.brand.400)]" />
            <stop offset="100%" className="[stop-color:theme(colors.brand.600)]" />
          </linearGradient>
          <linearGradient id="t-wing-right" x1="24" y1="8" x2="42" y2="18" gradientUnits="userSpaceOnUse">
            <stop offset="0%" className="[stop-color:theme(colors.brand.600)]" />
            <stop offset="100%" className="[stop-color:theme(colors.brand.700)]" />
          </linearGradient>
          <linearGradient id="t-stem-main" x1="24" y1="18" x2="24" y2="42" gradientUnits="userSpaceOnUse">
            <stop offset="0%" className="[stop-color:theme(colors.brand.600)]" />
            <stop offset="60%" className="[stop-color:theme(colors.brand.800)]" />
            <stop offset="100%" className="[stop-color:theme(colors.brand.950)]" />
          </linearGradient>
          <linearGradient id="t-specular" x1="12" y1="8" x2="36" y2="8" gradientUnits="userSpaceOnUse">
            <stop offset="0%" className="[stop-color:theme(colors.white)]" stopOpacity="0.8" />
            <stop offset="50%" className="[stop-color:theme(colors.white)]" stopOpacity="0.2" />
            <stop offset="100%" className="[stop-color:theme(colors.white)]" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M8 12L24 19L24 13L11 8L8 12Z" fill="url(#t-wing-left)" />
        <path d="M40 12L24 19L24 13L37 8L40 12Z" fill="url(#t-wing-right)" />
        <path d="M24 6L37 11L24 16L11 11L24 6Z" fill="url(#t-wing-left)" />
        <path d="M24 7L35 11L24 15L13 11L24 7Z" stroke="url(#t-specular)" strokeWidth="0.75" fill="none" />
        <path d="M19 18L24 20L24 42L19 39L19 18Z" fill="url(#t-wing-left)" />
        <path d="M29 18L24 20L24 42L29 39L29 18Z" fill="url(#t-stem-main)" />
        <rect x="36.5" y="6.5" width="5" height="5" transform="rotate(45 39 9)" className="fill-zinc-950 dark:fill-white transition-colors" />
        <rect x="37.5" y="7.5" width="3" height="3" transform="rotate(45 39 9)" className="fill-brand-600" />
      </svg>
      {showWordmark && <span className={`font-bold tracking-[0.14em] uppercase text-zinc-950 dark:text-white ${text} font-sans transition-colors ${wordmarkClassName}`}>TRENNO</span>}
    </div>
  );
}