import { HTMLAttributes, useState } from "react";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";
export type AvatarStatus = "online" | "offline" | "busy" | "away";
export type AvatarShape = "circle" | "square";

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  status?: AvatarStatus;
  shape?: AvatarShape;
  /** User id: picks the color of the default (initials) avatar so it stays the same everywhere. */
  colorSeed?: string;
}

const defaultColors = [
  "bg-brand-600 border-brand-700",
  "bg-emerald-600 border-emerald-700",
  "bg-amber-600 border-amber-700",
  "bg-rose-600 border-rose-700",
  "bg-violet-600 border-violet-700",
  "bg-cyan-700 border-cyan-800",
  "bg-orange-600 border-orange-700",
  "bg-teal-600 border-teal-700",
];

function colorFor(seed?: string): string {
  if (!seed) return defaultColors[0];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return defaultColors[hash % defaultColors.length];
}

const sizeStyles: Record<AvatarSize, { box: string; text: string; dot: string }> = {
  xs: { box: "h-6 w-6", text: "text-[10px]", dot: "h-1.5 w-1.5 ring-1" },
  sm: { box: "h-8 w-8", text: "text-xs", dot: "h-2 w-2 ring-1.5" },
  md: { box: "h-10 w-10", text: "text-base", dot: "h-2.5 w-2.5 ring-2" },
  lg: { box: "h-12 w-12", text: "text-xl", dot: "h-3 w-3 ring-2" },
  xl: { box: "h-16 w-16", text: "text-[28px]", dot: "h-4 w-4 ring-2" },
};

const statusStyles: Record<AvatarStatus, string> = {
  online: "bg-success-500",
  offline: "bg-zinc-400",
  busy: "bg-destructive-500",
  away: "bg-warning-500",
};

function getInitials(name?: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function Avatar({
  src,
  alt = "User avatar",
  name,
  size = "md",
  status,
  shape = "circle",
  colorSeed,
  className = "",
  ...props
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const { box, text, dot } = sizeStyles[size];
  const initials = getInitials(name || alt);
  const isCircle = shape === "circle";
  const shapeClass = isCircle ? "rounded-full" : "rounded-none";

  return (
    <div
      role="img"
      aria-label={name || alt}
      className={`relative inline-flex shrink-0 items-center justify-center font-sans font-bold select-none ${box} ${shapeClass} ${className}`}
      {...props}
    >
      {src && !imageError ? (
        <img
          src={src}
          alt={alt}
          onError={() => setImageError(true)}
          className={`h-full w-full object-cover ${shapeClass} border border-zinc-200 dark:border-dark-border`}
        />
      ) : (
        <div
          className={`h-full w-full flex items-center justify-center ${shapeClass} ${colorFor(colorSeed)} text-white border`}
        >
          <span className={`${text} leading-none font-bold font-sans tracking-tight`}>{initials}</span>
        </div>
      )}

      {status && (
        <span
          aria-label={`Status: ${status}`}
          className={`absolute bottom-0 right-0 rounded-full ring-2 ring-white dark:ring-dark-bg ${statusStyles[status]} ${dot}`}
        />
      )}
    </div>
  );
}
