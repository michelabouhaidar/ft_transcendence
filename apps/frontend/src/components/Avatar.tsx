import { ComponentProps, useState } from "react";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface AvatarProps extends ComponentProps<"div"> {
  src?: string;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  status?: "online" | "offline";
  // User id: picks the color of the default (initials) avatar so it stays the same everywhere.
  colorSeed?: string;
}

const COLORS = [
  "bg-brand-600 border-brand-700",
  "bg-emerald-600 border-emerald-700",
  "bg-amber-600 border-amber-700",
  "bg-rose-600 border-rose-700",
  "bg-violet-600 border-violet-700",
  "bg-cyan-700 border-cyan-800",
  "bg-orange-600 border-orange-700",
  "bg-teal-600 border-teal-700",
];

function colorFor(seed = ""): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return COLORS[hash % COLORS.length];
}

const SIZES: Record<AvatarSize, [box: string, text: string, dot: string]> = {
  xs: ["h-6 w-6", "text-[10px]", "h-1.5 w-1.5"],
  sm: ["h-8 w-8", "text-xs", "h-2 w-2"],
  md: ["h-10 w-10", "text-base", "h-2.5 w-2.5"],
  lg: ["h-12 w-12", "text-xl", "h-3 w-3"],
  xl: ["h-16 w-16", "text-[28px]", "h-4 w-4"],
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (parts.length >= 2 ? parts[0][0] + parts[1][0] : name.slice(0, 2)).toUpperCase();
}

export function Avatar({ src, alt = "User avatar", name, size = "md", status, colorSeed, className = "", ...props }: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [box, text, dot] = SIZES[size];
  return (
    <div
      role="img"
      aria-label={name || alt}
      className={`relative inline-flex shrink-0 items-center justify-center font-sans font-bold select-none rounded-full ${box} ${className}`}
      {...props}
    >
      {src && !imageError ? (
        <img src={src} alt={alt} onError={() => setImageError(true)} className="h-full w-full object-cover rounded-full border border-zinc-200 dark:border-dark-border" />
      ) : (
        <div className={`h-full w-full flex items-center justify-center rounded-full text-white border ${colorFor(colorSeed)}`}>
          <span className={`${text} leading-none font-bold font-sans tracking-tight`}>{initials(name || alt)}</span>
        </div>
      )}
      {status && (
        <span
          aria-label={`Status: ${status}`}
          className={`absolute bottom-0 right-0 rounded-full ring-2 ring-white dark:ring-dark-bg ${status === "online" ? "bg-success-500" : "bg-zinc-400"} ${dot}`}
        />
      )}
    </div>
  );
}
